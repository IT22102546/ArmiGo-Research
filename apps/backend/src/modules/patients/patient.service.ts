import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { CreatePatientDto } from './dtos/create-patient.dto';
import { UpdatePatientDto } from './dtos/update-patient.dto';
import { PatientResponseDto, PatientStatsDto } from './dtos/patient-response.dto';
import {
  CreateAdmissionTrackingDto,
  UpdateAdmissionTrackingDto,
} from './dtos/admission-tracking.dto';

const ADMISSION_LIFECYCLE_STATUSES = [
  'SCHEDULED',
  'ONGOING',
  'FINISHED',
  'ATTENDED_COMPLETE',
  'ABSENT_INCOMPLETE',
] as const;

type AdmissionLifecycleStatus = (typeof ADMISSION_LIFECYCLE_STATUSES)[number];

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new patient
   */
  async createPatient(data: CreatePatientDto): Promise<PatientResponseDto> {
    try {
      // Validate hospital exists
      if (!data.hospitalId) {
        throw new BadRequestException('Hospital ID is required for patient assignment');
      }

      const hospital = await this.prisma.hospital.findUnique({
        where: { id: data.hospitalId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!hospital) {
        throw new BadRequestException(`Hospital with ID ${data.hospitalId} not found`);
      }

      if (hospital.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Hospital with ID ${data.hospitalId} is inactive and cannot be assigned`
        );
      }

      if (data.districtId || data.zoneId) {
        await this.validateChildLocation(data.districtId, data.zoneId);
      }

      // Calculate age from dateOfBirth
      const birthDate = this.parseDateOnly(data.dateOfBirth);
      const age = this.calculateAge(birthDate);

      const parentFullName = (data.parentName || '').trim();
      const [parentFirstName, ...parentLastNameParts] = parentFullName.split(' ');
      const normalizedParentFirstName = parentFirstName || 'Parent';
      const normalizedParentLastName = parentLastNameParts.join(' ') || 'User';

      if (!data.parentPhone?.trim()) {
        throw new BadRequestException('Parent mobile number is required');
      }

      if (!data.parentEmail?.trim()) {
        throw new BadRequestException('Parent email is required');
      }

      const isProvidedPassword = !!data.parentPassword?.trim();
      const plainParentPassword =
        data.parentPassword?.trim() || this.generateTemporaryPassword();
      const hashedParentPassword = await bcrypt.hash(plainParentPassword, 12);
      let shouldReturnCredentials = false;

      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.parentEmail },
            { phone: data.parentPhone },
          ],
        },
      });

      let parentId: string;
      if (user && user.role === 'PARENT') {
        parentId = user.id;

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: normalizedParentFirstName,
            lastName: normalizedParentLastName,
            email: data.parentEmail,
            phone: data.parentPhone,
            ...(isProvidedPassword ? { password: hashedParentPassword } : {}),
          },
        });

        if (isProvidedPassword) {
          shouldReturnCredentials = true;
        }
      } else if (user && user.role !== 'PARENT') {
        throw new BadRequestException(
          'Provided parent email or phone already belongs to another user role'
        );
      } else {
        const placeholderParent = await this.prisma.user.create({
          data: {
            email: data.parentEmail,
            phone: data.parentPhone,
            firstName: normalizedParentFirstName,
            lastName: normalizedParentLastName,
            password: hashedParentPassword,
            role: 'PARENT',
            status: 'ACTIVE',
          },
        });
        parentId = placeholderParent.id;
        shouldReturnCredentials = true;
      }

      await this.prisma.parentProfile.upsert({
        where: { userId: parentId },
        update: {},
        create: {
          userId: parentId,
        },
      });

      const patient = await this.prisma.child.create({
        data: {
          parentId,
          hospitalId: data.hospitalId,
          subHospitalId: data.subHospitalId,
          districtId: data.districtId,
          zoneId: data.zoneId,
          address: data.address,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: birthDate,
          age,
          gender: data.gender,
          diagnosis: data.diagnosis,
          assignedDoctor: data.assignedDoctor,
          medicalNotes: data.medicalHistory,
          isActive: true,
        },
        include: {
          hospital: {
            include: {
              district: {
                include: {
                  province: true,
                },
              },
              zone: true,
            },
          },
          district: {
            include: {
              province: true,
            },
          },
          zone: true,
          subHospital: true,
          parent: true,
          progressRecords: {
            select: {
              recordDate: true,
              baselineValue: true,
              currentValue: true,
            },
            orderBy: { recordDate: 'asc' },
          },
          therapySessions: {
            select: {
              sessionDate: true,
              duration: true,
            },
          },
          admissionTrackings: {
            select: {
              admissionDate: true,
              startTime: true,
              endTime: true,
              status: true,
            },
          },
        },
      });

      const response = this.mapChildToPatientResponse(patient);

      if (shouldReturnCredentials) {
        response.parentCredentials = {
          email: data.parentEmail,
          phone: data.parentPhone,
          password: plainParentPassword,
        };
      }

      return response;
    } catch (error) {
      this.logger.error('Error creating patient:', error);
      throw error;
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(id: string): Promise<PatientResponseDto> {
    const patient = await this.prisma.child.findUnique({
      where: { id },
      include: {
        hospital: {
          include: {
            district: {
              include: {
                province: true,
              },
            },
            zone: true,
          },
        },
        district: {
          include: {
            province: true,
          },
        },
        zone: true,
        subHospital: true,
        parent: true,
        progressRecords: {
          select: {
            recordDate: true,
            baselineValue: true,
            currentValue: true,
          },
          orderBy: { recordDate: 'asc' },
        },
        therapySessions: {
          select: {
            sessionDate: true,
            duration: true,
          },
        },
        admissionTrackings: {
          select: {
            admissionDate: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return this.mapChildToPatientResponse(patient);
  }

  /**
   * Get all patients with optional filtering
   */
  async getAllPatients(
    filter?: {
      hospitalId?: string;
      isActive?: boolean;
      gender?: string;
      diagnosis?: string;
      searchTerm?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (filter?.hospitalId) {
      whereClause.hospitalId = filter.hospitalId;
    }

    if (filter?.isActive !== undefined) {
      whereClause.isActive = filter.isActive;
    }

    if (filter?.gender) {
      whereClause.gender = filter.gender;
    }

    if (filter?.diagnosis) {
      whereClause.diagnosis = {
        contains: filter.diagnosis,
        mode: 'insensitive',
      };
    }

    if (filter?.searchTerm) {
      whereClause.OR = [
        { firstName: { contains: filter.searchTerm, mode: 'insensitive' } },
        { lastName: { contains: filter.searchTerm, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.child.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          hospital: {
            include: {
              district: {
                include: {
                  province: true,
                },
              },
              zone: true,
            },
          },
          district: {
            include: {
              province: true,
            },
          },
          zone: true,
          subHospital: true,
          parent: true,
          progressRecords: {
            select: {
              recordDate: true,
              baselineValue: true,
              currentValue: true,
            },
            orderBy: { recordDate: 'asc' },
          },
          therapySessions: {
            select: {
              sessionDate: true,
              duration: true,
            },
          },
          admissionTrackings: {
            select: {
              admissionDate: true,
              startTime: true,
              endTime: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.child.count({ where: whereClause }),
    ]);

    return {
      data: patients.map((p) => this.mapChildToPatientResponse(p)),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update patient
   */
  async updatePatient(
    id: string,
    data: UpdatePatientDto
  ): Promise<PatientResponseDto> {
    const patient = await this.prisma.child.findUnique({
      where: { id },
      include: {
        parent: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Validate hospital if being changed
    if (data.hospitalId && data.hospitalId !== patient.hospitalId) {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: data.hospitalId },
      });
      if (!hospital) {
        throw new BadRequestException(`Hospital with ID ${data.hospitalId} not found`);
      }
    }

    if (data.districtId !== undefined || data.zoneId !== undefined) {
      await this.validateChildLocation(data.districtId, data.zoneId);
    }

    const updateData: any = { ...data };
    delete updateData.parentName;
    delete updateData.parentEmail;
    delete updateData.parentPhone;
    delete updateData.parentPassword;
    delete updateData.phone;
    delete updateData.email;

    if (data.dateOfBirth) {
      const birthDate = this.parseDateOnly(data.dateOfBirth);
      updateData.dateOfBirth = birthDate;
      updateData.age = this.calculateAge(birthDate);
    }

    const parentFullName = (data.parentName || '').trim();
    if (patient.parentId && (parentFullName || data.parentEmail || data.parentPhone)) {
      const [parentFirstName, ...parentLastNameParts] = parentFullName.split(' ');

      await this.prisma.user.update({
        where: { id: patient.parentId },
        data: {
          ...(parentFullName
            ? {
                firstName: parentFirstName || 'Parent',
                lastName: parentLastNameParts.join(' ') || 'User',
              }
            : {}),
          ...(data.parentEmail !== undefined ? { email: data.parentEmail } : {}),
          ...(data.parentPhone !== undefined ? { phone: data.parentPhone } : {}),
          ...(data.parentPassword
            ? { password: await bcrypt.hash(data.parentPassword, 12) }
            : {}),
        },
      });
    }

    const updated = await this.prisma.child.update({
      where: { id },
      data: updateData,
      include: {
        hospital: {
          include: {
            district: {
              include: {
                province: true,
              },
            },
            zone: true,
          },
        },
        district: {
          include: {
            province: true,
          },
        },
        zone: true,
        subHospital: true,
        parent: true,
        progressRecords: {
          select: {
            recordDate: true,
            baselineValue: true,
            currentValue: true,
          },
          orderBy: { recordDate: 'asc' },
        },
        therapySessions: {
          select: {
            sessionDate: true,
            duration: true,
          },
        },
        admissionTrackings: {
          select: {
            admissionDate: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
      },
    });

    return this.mapChildToPatientResponse(updated);
  }

  /**
   * Update patient active/inactive status
   */
  async setPatientStatus(id: string, isActive: boolean): Promise<PatientResponseDto> {
    const patient = await this.prisma.child.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const updated = await this.prisma.child.update({
      where: { id },
      data: { isActive },
      include: {
        hospital: {
          include: {
            district: {
              include: {
                province: true,
              },
            },
            zone: true,
          },
        },
        district: {
          include: {
            province: true,
          },
        },
        zone: true,
        subHospital: true,
        parent: true,
        progressRecords: {
          select: {
            recordDate: true,
            baselineValue: true,
            currentValue: true,
          },
          orderBy: { recordDate: 'asc' },
        },
        therapySessions: {
          select: {
            sessionDate: true,
            duration: true,
          },
        },
        admissionTrackings: {
          select: {
            admissionDate: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
      },
    });

    return this.mapChildToPatientResponse(updated);
  }

  /**
   * Delete patient (inactive mode or permanent mode)
   */
  async deletePatient(
    id: string,
    mode: 'inactive' | 'permanent' = 'permanent'
  ): Promise<{ message: string }> {
    const patient = await this.prisma.child.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    if (mode === 'inactive') {
      await this.prisma.child.update({
        where: { id },
        data: { isActive: false },
      });

      return { message: `Patient ${id} has been marked as inactive` };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.movementLog.deleteMany({
        where: {
          session: {
            childId: id,
          },
        },
      });

      await tx.deviceAssignment.deleteMany({ where: { childId: id } });
      await tx.appointment.deleteMany({ where: { childId: id } });
      await tx.therapySession.deleteMany({ where: { childId: id } });
      await tx.progressRecord.deleteMany({ where: { childId: id } });
      await tx.therapyProgram.deleteMany({ where: { childId: id } });
      await tx.child.delete({ where: { id } });

      const parentId = patient.parentId;
      if (!parentId) {
        return;
      }

      const remainingChildrenCount = await tx.child.count({
        where: { parentId },
      });

      if (remainingChildrenCount > 0) {
        return;
      }

      const parentUser = await tx.user.findUnique({
        where: { id: parentId },
        select: { id: true, role: true },
      });

      if (!parentUser || parentUser.role !== 'PARENT') {
        return;
      }

      const hospitalCount = await tx.hospital.count({
        where: { createdById: parentId },
      });

      if (hospitalCount > 0) {
        return;
      }

      const parentSessionIds = (
        await tx.therapySession.findMany({
          where: { createdById: parentId },
          select: { id: true },
        })
      ).map((session) => session.id);

      if (parentSessionIds.length > 0) {
        await tx.movementLog.deleteMany({
          where: { sessionId: { in: parentSessionIds } },
        });

        await tx.therapySession.deleteMany({
          where: { id: { in: parentSessionIds } },
        });
      }

      await tx.progressRecord.deleteMany({
        where: { recordedById: parentId },
      });

      await tx.deviceAssignment.deleteMany({
        where: { assignedBy: parentId },
      });

      await tx.appointment.deleteMany({
        where: {
          OR: [{ parentId }, { createdById: parentId }],
        },
      });

      await tx.auditLog.deleteMany({ where: { userId: parentId } });
      await tx.credentialLog.deleteMany({ where: { generatedById: parentId } });
      await tx.parentProfile.deleteMany({ where: { userId: parentId } });

      await tx.$executeRaw(
        Prisma.sql`DELETE FROM "users" WHERE "id" = ${parentId}`
      );
    });

    return { message: `Patient ${id} has been permanently deleted` };
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(hospitalId?: string): Promise<PatientStatsDto> {
    const whereClause: any = {};
    if (hospitalId) {
      whereClause.hospitalId = hospitalId;
    }

    const [
      allPatients,
      activePatients,
      inactivePatients,
      newThisMonth,
      newThisWeek,
    ] = await Promise.all([
      this.prisma.child.findMany({ where: whereClause }),
      this.prisma.child.count({
        where: { ...whereClause, isActive: true },
      }),
      this.prisma.child.count({
        where: { ...whereClause, isActive: false },
      }),
      this.prisma.child.count({
        where: {
          ...whereClause,
          enrolledAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      this.prisma.child.count({
        where: {
          ...whereClause,
          enrolledAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Calculate average age
    const averageAge =
      allPatients.length > 0
        ? allPatients.reduce((sum, p) => sum + p.age, 0) / allPatients.length
        : 0;

    // Group by gender
    const byGender: Record<string, number> = {};
    allPatients.forEach((p) => {
      byGender[p.gender] = (byGender[p.gender] || 0) + 1;
    });

    // Group by diagnosis
    const byDiagnosis: Record<string, number> = {};
    allPatients.forEach((p) => {
      if (p.diagnosis) {
        byDiagnosis[p.diagnosis] = (byDiagnosis[p.diagnosis] || 0) + 1;
      }
    });

    // Group by ward
    const byWard: Record<string, number> = {};
    allPatients.forEach((p) => {
      const wardKey = p.hospitalId || 'Not Assigned';
      byWard[wardKey] = (byWard[wardKey] || 0) + 1;
    });

    return {
      totalPatients: allPatients.length,
      activePatients,
      inactivePatients,
      newPatientsThisMonth: newThisMonth,
      newPatientsThisWeek: newThisWeek,
      averageAge: Math.round(averageAge * 10) / 10,
      byGender,
      byDiagnosis,
      byWard,
    };
  }

  /**
   * Private helper method to calculate age
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  private parseDateOnly(dateValue: string): Date {
    const [year, month, day] = (dateValue || '').split('-').map(Number);

    if (!year || !month || !day) {
      throw new BadRequestException('Invalid dateOfBirth format. Use YYYY-MM-DD');
    }

    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }

  private async validateChildLocation(districtId?: string, zoneId?: string) {
    if (districtId) {
      const district = await this.prisma.district.findUnique({
        where: { id: districtId },
        select: { id: true },
      });

      if (!district) {
        throw new BadRequestException(`District with ID ${districtId} not found`);
      }
    }

    if (zoneId) {
      const zone = await this.prisma.zone.findUnique({
        where: { id: zoneId },
        select: { id: true, districtId: true },
      });

      if (!zone) {
        throw new BadRequestException(`Zone with ID ${zoneId} not found`);
      }

      if (districtId && zone.districtId && zone.districtId !== districtId) {
        throw new BadRequestException('Selected zone does not belong to selected district');
      }
    }
  }

  private generateTemporaryPassword(length: number = 12): string {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const symbols = '@#$%&*!';
    const all = `${lower}${upper}${digits}${symbols}`;

    const chars = [
      lower[randomInt(lower.length)],
      upper[randomInt(upper.length)],
      digits[randomInt(digits.length)],
      symbols[randomInt(symbols.length)],
    ];

    while (chars.length < length) {
      chars.push(all[randomInt(all.length)]);
    }

    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  }

  /**
   * Get all hospitals with location information
   */
  async getHospitals() {
    return await this.prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        districtId: true,
        zoneId: true,
        status: true,
      },
      where: {
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all districts with zones
   */
  async getDistricts() {
    return await this.prisma.district.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        provinceId: true,
        province: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        zones: {
          select: {
            id: true,
            name: true,
            code: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get zones by district ID
   */
  async getZonesByDistrict(districtId: string) {
    return await this.prisma.zone.findMany({
      where: { districtId },
      select: {
        id: true,
        name: true,
        code: true,
        districtId: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get sub-hospitals by hospital ID
   */
  async getSubHospitalsByHospital(hospitalId: string) {
    return await this.prisma.subHospital.findMany({
      where: {
        hospitalId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        type: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get active doctors/therapists for patient assignment
   */
  async getDoctors(hospitalId?: string) {
    return await this.prisma.hospitalStaff.findMany({
      where: {
        isActive: true,
        ...(hospitalId ? { hospitalId } : {}),
        role: {
          in: ['DOCTOR', 'THERAPIST', 'PHYSIOTHERAPIST'],
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
        specialization: true,
        phone: true,
        email: true,
        hospitalId: true,
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get physiotherapists from real hospital staff records
   */
  async getPhysiotherapists(hospitalId?: string, includeInactive = false) {
    return await this.prisma.hospitalStaff.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(hospitalId ? { hospitalId } : {}),
        role: {
          in: ['THERAPIST', 'PHYSIOTHERAPIST'],
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
        specialization: true,
        phone: true,
        email: true,
        isActive: true,
        hospitalId: true,
        hospital: {
          select: {
            id: true,
            name: true,
            zoneId: true,
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create physiotherapist in hospital staff
   */
  async createPhysiotherapist(data: {
    name: string;
    email?: string;
    phone: string;
    hospitalId: string;
    specialization?: string;
  }) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: data.hospitalId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!hospital) {
      throw new BadRequestException(
        `Hospital with ID ${data.hospitalId} not found`
      );
    }

    if (hospital.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Hospital with ID ${data.hospitalId} is inactive and cannot be used for physiotherapist assignment`
      );
    }

    return await this.prisma.hospitalStaff.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        hospitalId: data.hospitalId,
        role: 'PHYSIOTHERAPIST',
        specialization: data.specialization,
        qualifications: [],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        specialization: true,
        phone: true,
        email: true,
        isActive: true,
        hospitalId: true,
        hospital: {
          select: {
            id: true,
            name: true,
            zoneId: true,
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update physiotherapist details
   */
  async updatePhysiotherapist(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      hospitalId?: string;
      specialization?: string;
    }
  ) {
    const existing = await this.prisma.hospitalStaff.findUnique({
      where: { id },
      select: { id: true, role: true, hospitalId: true },
    });

    if (!existing) {
      throw new NotFoundException(`Physiotherapist with ID ${id} not found`);
    }

    if (!['THERAPIST', 'PHYSIOTHERAPIST'].includes(existing.role)) {
      throw new BadRequestException('Selected staff member is not a physiotherapist');
    }

    if (data.hospitalId && data.hospitalId !== existing.hospitalId) {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: data.hospitalId },
        select: {
          id: true,
          status: true,
        },
      });
      if (!hospital) {
        throw new BadRequestException(
          `Hospital with ID ${data.hospitalId} not found`
        );
      }
      if (hospital.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Hospital with ID ${data.hospitalId} is inactive and cannot be assigned`
        );
      }
    }

    return await this.prisma.hospitalStaff.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.hospitalId !== undefined ? { hospitalId: data.hospitalId } : {}),
        ...(data.specialization !== undefined
          ? { specialization: data.specialization }
          : {}),
      },
      select: {
        id: true,
        name: true,
        role: true,
        specialization: true,
        phone: true,
        email: true,
        isActive: true,
        hospitalId: true,
        hospital: {
          select: {
            id: true,
            name: true,
            zoneId: true,
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update physiotherapist active/inactive status
   */
  async setPhysiotherapistStatus(id: string, isActive: boolean) {
    const existing = await this.prisma.hospitalStaff.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existing) {
      throw new NotFoundException(`Physiotherapist with ID ${id} not found`);
    }

    if (!['THERAPIST', 'PHYSIOTHERAPIST'].includes(existing.role)) {
      throw new BadRequestException('Selected staff member is not a physiotherapist');
    }

    return await this.prisma.hospitalStaff.update({
      where: { id },
      data: {
        isActive,
        leftAt: isActive ? null : new Date(),
      },
      select: {
        id: true,
        name: true,
        role: true,
        specialization: true,
        phone: true,
        email: true,
        isActive: true,
        hospitalId: true,
        hospital: {
          select: {
            id: true,
            name: true,
            zoneId: true,
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Delete physiotherapist (inactive mode or permanent mode)
   */
  async deletePhysiotherapist(
    id: string,
    mode: 'inactive' | 'permanent' = 'permanent'
  ): Promise<{ message: string }> {
    const existing = await this.prisma.hospitalStaff.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existing) {
      throw new NotFoundException(`Physiotherapist with ID ${id} not found`);
    }

    if (!['THERAPIST', 'PHYSIOTHERAPIST'].includes(existing.role)) {
      throw new BadRequestException('Selected staff member is not a physiotherapist');
    }

    if (mode === 'inactive') {
      await this.prisma.hospitalStaff.update({
        where: { id },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      return { message: `Physiotherapist ${id} has been marked as inactive` };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({ where: { staffId: id } });
      await tx.hospitalStaff.delete({ where: { id } });
    });

    return { message: `Physiotherapist ${id} has been permanently deleted` };
  }

  async getAdmissionTrackingOptions(hospitalId?: string) {
    const [children, physiotherapists, hospitals, devices] = await Promise.all([
      this.prisma.child.findMany({
        where: {
          ...(hospitalId ? { hospitalId } : {}),
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          age: true,
          diagnosis: true,
          assignedDoctor: true,
          isActive: true,
          hospitalId: true,
          hospital: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      this.getPhysiotherapists(hospitalId, false),
      this.prisma.hospital.findMany({
        where: {
          ...(hospitalId ? { id: hospitalId } : {}),
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.device.findMany({
        where: {
          ...(hospitalId ? { hospitalId } : {}),
          status: {
            in: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE'],
          },
        },
        select: {
          id: true,
          serialNumber: true,
          deviceType: true,
          modelNumber: true,
          status: true,
          hospitalId: true,
          hospital: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { serialNumber: 'asc' },
      }),
    ]);

    return {
      children,
      physiotherapists,
      hospitals,
      devices,
    };
  }

  async getAdmissionTrackings(filters?: {
    hospitalId?: string;
    childId?: string;
    physiotherapistId?: string;
    admissionType?: string;
    status?: string;
    search?: string;
  }) {
    const whereClause: any = {
      ...(filters?.hospitalId ? { hospitalId: filters.hospitalId } : {}),
      ...(filters?.childId ? { childId: filters.childId } : {}),
      ...(filters?.physiotherapistId
        ? { physiotherapistId: filters.physiotherapistId }
        : {}),
      ...(filters?.admissionType
        ? { admissionType: filters.admissionType }
        : {}),
    };

    if (filters?.search?.trim()) {
      const search = filters.search.trim();
      whereClause.OR = [
        {
          child: {
            firstName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          child: {
            lastName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          physiotherapist: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          manualDeviceName: { contains: search, mode: 'insensitive' },
        },
        {
          clinic: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    const records = await this.prisma.admissionTracking.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            diagnosis: true,
            assignedDoctor: true,
            hospitalId: true,
          },
        },
        physiotherapist: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            hospitalId: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        device: {
          select: {
            id: true,
            serialNumber: true,
            modelNumber: true,
            deviceType: true,
            status: true,
          },
        },
      },
      orderBy: [{ admissionDate: 'desc' }, { createdAt: 'desc' }],
    });

    const recordsWithLifecycle = records.map((record) => {
      const lifecycleStatus = this.resolveAdmissionLifecycleStatus(
        record.status,
        record.admissionDate,
        record.startTime,
        record.endTime
      );

      return {
        ...record,
        status: lifecycleStatus,
      };
    });

    const statusUpdates = recordsWithLifecycle.filter(
      (record) =>
        record.status !== records.find((item) => item.id === record.id)?.status &&
        !['ATTENDED_COMPLETE', 'ABSENT_INCOMPLETE'].includes(
          records.find((item) => item.id === record.id)?.status || ''
        )
    );

    if (statusUpdates.length > 0) {
      await this.prisma.$transaction(
        statusUpdates.map((item) =>
          this.prisma.admissionTracking.update({
            where: { id: item.id },
            data: { status: item.status },
          })
        )
      );
    }

    if (filters?.status && filters.status !== 'ALL') {
      return recordsWithLifecycle.filter((record) => record.status === filters.status);
    }

    return recordsWithLifecycle;
  }

  async createAdmissionTracking(data: CreateAdmissionTrackingDto) {
    this.validateSessionTimeRange(data.startTime, data.endTime);

    let selectedPhysioHospitalId: string | null = null;

    const child = await this.prisma.child.findUnique({
      where: { id: data.childId },
      select: {
        id: true,
        hospitalId: true,
        assignedDoctor: true,
      },
    });

    if (!child) {
      throw new NotFoundException(`Child with ID ${data.childId} not found`);
    }

    if (data.physiotherapistId) {
      const physio = await this.prisma.hospitalStaff.findUnique({
        where: { id: data.physiotherapistId },
        select: {
          id: true,
          role: true,
          isActive: true,
          hospitalId: true,
        },
      });

      if (!physio) {
        throw new NotFoundException(
          `Physiotherapist with ID ${data.physiotherapistId} not found`
        );
      }

      if (!['THERAPIST', 'PHYSIOTHERAPIST'].includes(physio.role)) {
        throw new BadRequestException('Selected staff member is not a physiotherapist');
      }

      if (!physio.isActive) {
        throw new BadRequestException('Selected physiotherapist is inactive');
      }

      selectedPhysioHospitalId = physio.hospitalId || null;
    }

    if (data.hospitalId) {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: data.hospitalId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${data.hospitalId} not found`);
      }

      if (hospital.status !== 'ACTIVE') {
        throw new BadRequestException('Selected hospital is inactive');
      }
    }

    if (data.deviceId) {
      const device = await this.prisma.device.findUnique({
        where: { id: data.deviceId },
        select: { id: true },
      });

      if (!device) {
        throw new NotFoundException(`Device with ID ${data.deviceId} not found`);
      }
    }

    let resolvedPhysiotherapistId: string | null = data.physiotherapistId || null;

    if (!resolvedPhysiotherapistId && child.assignedDoctor?.trim()) {
      const matchedPhysio = await this.prisma.hospitalStaff.findFirst({
        where: {
          isActive: true,
          role: {
            in: ['THERAPIST', 'PHYSIOTHERAPIST'],
          },
          name: {
            equals: child.assignedDoctor.trim(),
            mode: 'insensitive',
          },
          ...(child.hospitalId ? { hospitalId: child.hospitalId } : {}),
        },
        select: { id: true, hospitalId: true },
      });

      resolvedPhysiotherapistId = matchedPhysio?.id || null;
      selectedPhysioHospitalId = matchedPhysio?.hospitalId || null;
    }

    const resolvedHospitalId = data.hospitalId || child.hospitalId || null;

    if (resolvedHospitalId) {
      const resolvedHospital = await this.prisma.hospital.findUnique({
        where: { id: resolvedHospitalId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!resolvedHospital) {
        throw new NotFoundException(
          `Hospital with ID ${resolvedHospitalId} not found`
        );
      }

      if (resolvedHospital.status !== 'ACTIVE') {
        throw new BadRequestException('Selected hospital is inactive');
      }

      if (child.hospitalId && child.hospitalId !== resolvedHospitalId) {
        throw new BadRequestException(
          'Selected child does not belong to the selected hospital'
        );
      }
    }

    if (resolvedPhysiotherapistId && selectedPhysioHospitalId === null) {
      const selectedPhysio = await this.prisma.hospitalStaff.findUnique({
        where: { id: resolvedPhysiotherapistId },
        select: {
          hospitalId: true,
        },
      });
      selectedPhysioHospitalId = selectedPhysio?.hospitalId || null;
    }

    if (
      resolvedHospitalId &&
      selectedPhysioHospitalId &&
      selectedPhysioHospitalId !== resolvedHospitalId
    ) {
      throw new BadRequestException(
        'Selected physiotherapist does not belong to the selected hospital'
      );
    }

    const admissionDate = new Date(data.admissionDate);

    await this.ensureNoAdmissionSessionOverlap({
      childId: data.childId,
      admissionDate,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    if (resolvedPhysiotherapistId) {
      await this.ensureNoPhysiotherapistSessionOverlap({
        physiotherapistId: resolvedPhysiotherapistId,
        admissionDate,
        startTime: data.startTime,
        endTime: data.endTime,
      });
    }

    const lifecycleStatus = this.resolveAdmissionLifecycleStatus(
      data.status,
      admissionDate,
      data.startTime,
      data.endTime
    );

    return await this.prisma.admissionTracking.create({
      data: {
        childId: data.childId,
        physiotherapistId: resolvedPhysiotherapistId,
        hospitalId: resolvedHospitalId,
        deviceId: data.deviceId || null,
        admissionType: data.admissionType || 'REHAB',
        status: lifecycleStatus,
        admissionDate,
        startTime: data.startTime,
        endTime: data.endTime,
        dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : null,
        deviceAssignedDate: data.deviceAssignedDate
          ? new Date(data.deviceAssignedDate)
          : null,
        clinic: data.clinic,
        room: data.room,
        notes: data.notes,
        manualDeviceName: data.manualDeviceName,
        manualDeviceType: data.manualDeviceType,
        manualDeviceSerial: data.manualDeviceSerial,
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            diagnosis: true,
            assignedDoctor: true,
          },
        },
        physiotherapist: {
          select: {
            id: true,
            name: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        device: {
          select: {
            id: true,
            serialNumber: true,
            deviceType: true,
            modelNumber: true,
          },
        },
      },
    });
  }

  async updateAdmissionTracking(id: string, data: UpdateAdmissionTrackingDto) {
    const existing = await this.prisma.admissionTracking.findUnique({
      where: { id },
      select: {
        id: true,
        childId: true,
        physiotherapistId: true,
        hospitalId: true,
        admissionDate: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Admission tracking with ID ${id} not found`);
    }

    let selectedPhysioHospitalId: string | null = null;

    if (data.childId) {
      const child = await this.prisma.child.findUnique({
        where: { id: data.childId },
        select: { id: true, hospitalId: true },
      });
      if (!child) {
        throw new NotFoundException(`Child with ID ${data.childId} not found`);
      }
    }

    if (data.physiotherapistId) {
      const physio = await this.prisma.hospitalStaff.findUnique({
        where: { id: data.physiotherapistId },
        select: {
          id: true,
          role: true,
          isActive: true,
          hospitalId: true,
        },
      });

      if (!physio) {
        throw new NotFoundException(
          `Physiotherapist with ID ${data.physiotherapistId} not found`
        );
      }

      if (!['THERAPIST', 'PHYSIOTHERAPIST'].includes(physio.role)) {
        throw new BadRequestException('Selected staff member is not a physiotherapist');
      }

      if (!physio.isActive) {
        throw new BadRequestException('Selected physiotherapist is inactive');
      }

      selectedPhysioHospitalId = physio.hospitalId || null;
    }

    if (data.hospitalId) {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: data.hospitalId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${data.hospitalId} not found`);
      }

      if (hospital.status !== 'ACTIVE') {
        throw new BadRequestException('Selected hospital is inactive');
      }
    }

    if (data.deviceId) {
      const device = await this.prisma.device.findUnique({
        where: { id: data.deviceId },
        select: { id: true },
      });

      if (!device) {
        throw new NotFoundException(`Device with ID ${data.deviceId} not found`);
      }
    }

    const resolvedChildId = data.childId || existing.childId;
    const resolvedPhysiotherapistId =
      data.physiotherapistId !== undefined
        ? data.physiotherapistId || null
        : existing.physiotherapistId || null;
    const resolvedHospitalId = data.hospitalId || existing.hospitalId || null;
    const resolvedAdmissionDate = data.admissionDate
      ? new Date(data.admissionDate)
      : existing.admissionDate;
    const resolvedStartTime = data.startTime ?? existing.startTime;
    const resolvedEndTime = data.endTime ?? existing.endTime;

    const resolvedChild = await this.prisma.child.findUnique({
      where: { id: resolvedChildId },
      select: {
        id: true,
        hospitalId: true,
      },
    });

    if (!resolvedChild) {
      throw new NotFoundException(`Child with ID ${resolvedChildId} not found`);
    }

    if (resolvedHospitalId && resolvedChild.hospitalId && resolvedChild.hospitalId !== resolvedHospitalId) {
      throw new BadRequestException(
        'Selected child does not belong to the selected hospital'
      );
    }

    if (resolvedPhysiotherapistId && selectedPhysioHospitalId === null) {
      const selectedPhysio = await this.prisma.hospitalStaff.findUnique({
        where: { id: resolvedPhysiotherapistId },
        select: {
          hospitalId: true,
          role: true,
          isActive: true,
        },
      });

      if (!selectedPhysio) {
        throw new NotFoundException(
          `Physiotherapist with ID ${resolvedPhysiotherapistId} not found`
        );
      }

      if (!['THERAPIST', 'PHYSIOTHERAPIST'].includes(selectedPhysio.role)) {
        throw new BadRequestException('Selected staff member is not a physiotherapist');
      }

      if (!selectedPhysio.isActive) {
        throw new BadRequestException('Selected physiotherapist is inactive');
      }

      selectedPhysioHospitalId = selectedPhysio.hospitalId || null;
    }

    if (
      resolvedHospitalId &&
      selectedPhysioHospitalId &&
      selectedPhysioHospitalId !== resolvedHospitalId
    ) {
      throw new BadRequestException(
        'Selected physiotherapist does not belong to the selected hospital'
      );
    }

    if (resolvedStartTime && resolvedEndTime) {
      this.validateSessionTimeRange(resolvedStartTime, resolvedEndTime);
      await this.ensureNoAdmissionSessionOverlap({
        childId: resolvedChildId,
        admissionDate: resolvedAdmissionDate,
        startTime: resolvedStartTime,
        endTime: resolvedEndTime,
        excludeId: id,
      });

      if (resolvedPhysiotherapistId) {
        await this.ensureNoPhysiotherapistSessionOverlap({
          physiotherapistId: resolvedPhysiotherapistId,
          admissionDate: resolvedAdmissionDate,
          startTime: resolvedStartTime,
          endTime: resolvedEndTime,
          excludeId: id,
        });
      }
    }

    const lifecycleStatus = this.resolveAdmissionLifecycleStatus(
      data.status,
      resolvedAdmissionDate,
      resolvedStartTime,
      resolvedEndTime
    );

    return await this.prisma.admissionTracking.update({
      where: { id },
      data: {
        ...(data.childId !== undefined ? { childId: data.childId } : {}),
        ...(data.physiotherapistId !== undefined
          ? { physiotherapistId: data.physiotherapistId || null }
          : {}),
        ...(data.hospitalId !== undefined
          ? { hospitalId: data.hospitalId || null }
          : {}),
        ...(data.deviceId !== undefined ? { deviceId: data.deviceId || null } : {}),
        ...(data.admissionType !== undefined
          ? { admissionType: data.admissionType }
          : {}),
        ...(data.status !== undefined || data.startTime !== undefined || data.endTime !== undefined || data.admissionDate !== undefined
          ? { status: lifecycleStatus }
          : {}),
        ...(data.admissionDate !== undefined
          ? { admissionDate: new Date(data.admissionDate) }
          : {}),
        ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
        ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
        ...(data.dischargeDate !== undefined
          ? {
              dischargeDate: data.dischargeDate
                ? new Date(data.dischargeDate)
                : null,
            }
          : {}),
        ...(data.deviceAssignedDate !== undefined
          ? {
              deviceAssignedDate: data.deviceAssignedDate
                ? new Date(data.deviceAssignedDate)
                : null,
            }
          : {}),
        ...(data.clinic !== undefined ? { clinic: data.clinic } : {}),
        ...(data.room !== undefined ? { room: data.room } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.manualDeviceName !== undefined
          ? { manualDeviceName: data.manualDeviceName }
          : {}),
        ...(data.manualDeviceType !== undefined
          ? { manualDeviceType: data.manualDeviceType }
          : {}),
        ...(data.manualDeviceSerial !== undefined
          ? { manualDeviceSerial: data.manualDeviceSerial }
          : {}),
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            diagnosis: true,
            assignedDoctor: true,
          },
        },
        physiotherapist: {
          select: {
            id: true,
            name: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        device: {
          select: {
            id: true,
            serialNumber: true,
            deviceType: true,
            modelNumber: true,
          },
        },
      },
    });
  }

  async updateAdmissionTrackingStatus(id: string, status: string) {
    const existing = await this.prisma.admissionTracking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        admissionDate: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Admission tracking with ID ${id} not found`);
    }

    const normalizedStatus = (status || '').trim().toUpperCase();
    if (!['ATTENDED_COMPLETE', 'ABSENT_INCOMPLETE'].includes(normalizedStatus)) {
      throw new BadRequestException(
        'Status must be ATTENDED_COMPLETE or ABSENT_INCOMPLETE'
      );
    }

    const lifecycleStatus = this.resolveAdmissionLifecycleStatus(
      existing.status,
      existing.admissionDate,
      existing.startTime,
      existing.endTime
    );

    if (lifecycleStatus !== 'FINISHED') {
      throw new BadRequestException(
        'Session outcome can only be marked after the session is finished'
      );
    }

    return await this.prisma.admissionTracking.update({
      where: { id },
      data: { status: normalizedStatus },
    });
  }

  async deleteAdmissionTracking(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.admissionTracking.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Admission tracking with ID ${id} not found`);
    }

    await this.prisma.admissionTracking.delete({
      where: { id },
    });

    return { message: `Admission tracking ${id} has been deleted` };
  }

  private validateSessionTimeRange(startTime?: string | null, endTime?: string | null) {
    if (!startTime || !endTime) {
      throw new BadRequestException('Session start time and end time are required');
    }

    const startMinutes = this.parseTimeToMinutes(startTime);
    const endMinutes = this.parseTimeToMinutes(endTime);
    const latestAllowedMinutes = 21 * 60;

    if (startMinutes >= latestAllowedMinutes) {
      throw new BadRequestException('Session start time must be before 09:00 PM');
    }

    if (endMinutes > latestAllowedMinutes) {
      throw new BadRequestException('Session end time cannot be after 09:00 PM');
    }

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('Session end time must be after start time');
    }
  }

  private parseTimeToMinutes(value: string): number {
    const [hourText, minuteText] = (value || '').split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      throw new BadRequestException('Invalid time format. Use HH:mm');
    }

    return hour * 60 + minute;
  }

  private async ensureNoAdmissionSessionOverlap(params: {
    childId: string;
    admissionDate: Date;
    startTime: string;
    endTime: string;
    excludeId?: string;
  }) {
    const dayStart = new Date(params.admissionDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(params.admissionDate);
    dayEnd.setHours(23, 59, 59, 999);

    const sessions = await this.prisma.admissionTracking.findMany({
      where: {
        childId: params.childId,
        admissionDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          notIn: ['INACTIVE', 'DISCHARGED'],
        },
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    const requestedStart = this.parseTimeToMinutes(params.startTime);
    const requestedEnd = this.parseTimeToMinutes(params.endTime);

    const hasOverlap = sessions.some((session) => {
      if (!session.startTime || !session.endTime) {
        return false;
      }

      const existingStart = this.parseTimeToMinutes(session.startTime);
      const existingEnd = this.parseTimeToMinutes(session.endTime);

      return requestedStart < existingEnd && requestedEnd > existingStart;
    });

    if (hasOverlap) {
      throw new BadRequestException(
        'Another session already exists for this child within the selected time range'
      );
    }
  }

  private async ensureNoPhysiotherapistSessionOverlap(params: {
    physiotherapistId: string;
    admissionDate: Date;
    startTime: string;
    endTime: string;
    excludeId?: string;
  }) {
    const dayStart = new Date(params.admissionDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(params.admissionDate);
    dayEnd.setHours(23, 59, 59, 999);

    const sessions = await this.prisma.admissionTracking.findMany({
      where: {
        physiotherapistId: params.physiotherapistId,
        admissionDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          notIn: ['INACTIVE', 'DISCHARGED'],
        },
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    const requestedStart = this.parseTimeToMinutes(params.startTime);
    const requestedEnd = this.parseTimeToMinutes(params.endTime);

    const hasOverlap = sessions.some((session) => {
      if (!session.startTime || !session.endTime) {
        return false;
      }

      const existingStart = this.parseTimeToMinutes(session.startTime);
      const existingEnd = this.parseTimeToMinutes(session.endTime);

      return requestedStart < existingEnd && requestedEnd > existingStart;
    });

    if (hasOverlap) {
      throw new BadRequestException(
        'This physiotherapist already has a session in the selected time range'
      );
    }
  }

  /**
   * Private helper method to map Child model to PatientResponseDto
   */
  private mapChildToPatientResponse(child: any): PatientResponseDto {
    const parentName = child.parent
      ? `${child.parent.firstName || ''} ${child.parent.lastName || ''}`.trim()
      : undefined;

    const progressRecords = Array.isArray(child.progressRecords)
      ? [...child.progressRecords]
      : [];

    const therapySessions = Array.isArray(child.therapySessions)
      ? child.therapySessions
      : [];

    const admissionTrackings = Array.isArray(child.admissionTrackings)
      ? child.admissionTrackings
      : [];

    const firstProgressRecord = progressRecords[0];
    const lastProgressRecord = progressRecords[progressRecords.length - 1];

    const startProgress =
      firstProgressRecord?.baselineValue ?? firstProgressRecord?.currentValue ?? 0;
    const currentProgress =
      lastProgressRecord?.currentValue ?? lastProgressRecord?.baselineValue ?? 0;

    const admissionPlayTimeMinutes = admissionTrackings
      .filter(
        (tracking: any) =>
          tracking?.status === 'ATTENDED_COMPLETE' || tracking?.status === 'COMPLETED'
      )
      .reduce((sum: number, tracking: any) => {
        if (!tracking?.startTime || !tracking?.endTime) {
          return sum;
        }

        const duration =
          this.parseTimeToMinutes(tracking.endTime) -
          this.parseTimeToMinutes(tracking.startTime);

        return duration > 0 ? sum + duration : sum;
      }, 0);

    const therapyPlayTimeMinutes = therapySessions.reduce(
      (sum: number, session: any) => sum + (session?.duration || 0),
      0
    );

    const playTimeMinutes = therapyPlayTimeMinutes + admissionPlayTimeMinutes;

    const playedDays = new Set(
      [
        ...therapySessions
          .filter((session: any) => session?.sessionDate)
          .map((session: any) =>
            new Date(session.sessionDate).toISOString().split('T')[0]
          ),
        ...admissionTrackings
          .filter(
            (tracking: any) =>
              (tracking?.status === 'ATTENDED_COMPLETE' ||
                tracking?.status === 'COMPLETED') &&
              tracking?.admissionDate
          )
          .map((tracking: any) =>
            new Date(tracking.admissionDate).toISOString().split('T')[0]
          ),
      ]
    ).size;

    return {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      address: child.address,
      email: child.parent?.email,
      phone: child.parent?.phone,
      parentName,
      parentEmail: child.parent?.email,
      parentPhone: child.parent?.phone,
      dateOfBirth: child.dateOfBirth?.toISOString()?.split('T')[0],
      age: child.age,
      gender: child.gender,
      bloodType: child.medicalNotes?.includes('Blood Type:')
        ? child.medicalNotes.split('Blood Type:')[1]?.split(',')[0]?.trim()
        : undefined,
      ward: child.medicalNotes?.includes('Ward:')
        ? child.medicalNotes.split('Ward:')[1]?.split(',')[0]?.trim()
        : undefined,
      diagnosis: child.diagnosis,
      assignedDoctor: child.assignedDoctor,
      medicalHistory: child.medicalNotes,
      emergencyContact: undefined, // Not in current schema
      emergencyPhone: undefined, // Not in current schema
      hospitalId: child.hospitalId,
      hospital: child.hospital
        ? {
            id: child.hospital.id,
            name: child.hospital.name,
            email: child.hospital.email,
            phone: child.hospital.phone,
            address: child.hospital.address,
            city: child.hospital.city,
            districtId: child.hospital.districtId,
            zoneId: child.hospital.zoneId,
          }
        : undefined,
      district:
        child.district || child.hospital?.district
        ? {
            id: (child.district || child.hospital?.district).id,
            name: (child.district || child.hospital?.district).name,
            code: (child.district || child.hospital?.district).code,
          }
        : undefined,
      zone:
        child.zone || child.hospital?.zone
        ? {
            id: (child.zone || child.hospital?.zone).id,
            name: (child.zone || child.hospital?.zone).name,
            code: (child.zone || child.hospital?.zone).code,
          }
        : undefined,
      province:
        child.district?.province || child.hospital?.district?.province
        ? {
            id: (child.district?.province || child.hospital?.district?.province).id,
            name: (child.district?.province || child.hospital?.district?.province).name,
            code: (child.district?.province || child.hospital?.district?.province).code,
          }
        : undefined,
      subHospitalId: child.subHospitalId,
      subHospital: child.subHospital
        ? {
            id: child.subHospital.id,
            name: child.subHospital.name,
            email: child.subHospital.email,
            phone: child.subHospital.phone,
            address: child.subHospital.address,
            type: child.subHospital.type,
          }
        : undefined,
      isActive: child.isActive,
      progressTracker: {
        startProgress: Number(startProgress.toFixed(1)),
        currentProgress: Number(currentProgress.toFixed(1)),
        playTimeMinutes,
        playedDays,
      },
      enrolledAt: child.enrolledAt,
      createdAt: child.enrolledAt,
      updatedAt: child.enrolledAt,
    };
  }

  private resolveAdmissionLifecycleStatus(
    status: string | undefined | null,
    admissionDate: Date,
    startTime?: string | null,
    endTime?: string | null
  ): AdmissionLifecycleStatus {
    const normalizedStatus = (status || '').trim().toUpperCase();

    if (normalizedStatus === 'ATTENDED_COMPLETE') {
      return 'ATTENDED_COMPLETE';
    }

    if (normalizedStatus === 'ABSENT_INCOMPLETE') {
      return 'ABSENT_INCOMPLETE';
    }

    if (!startTime || !endTime) {
      return 'SCHEDULED';
    }

    const now = new Date();
    const sessionStart = this.mergeDateAndTime(admissionDate, startTime);
    const sessionEnd = this.mergeDateAndTime(admissionDate, endTime);

    if (now < sessionStart) {
      return 'SCHEDULED';
    }

    if (now >= sessionStart && now < sessionEnd) {
      return 'ONGOING';
    }

    return 'FINISHED';
  }

  private mergeDateAndTime(dateValue: Date, timeValue: string): Date {
    const [hoursText, minutesText] = (timeValue || '').split(':');
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    const date = new Date(dateValue);
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  }
}
