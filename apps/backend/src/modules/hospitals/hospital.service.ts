import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateHospitalDto, UpdateHospitalDto } from './dtos/create-hospital.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class HospitalService {
  private readonly logger = new Logger(HospitalService.name);

  constructor(private prisma: PrismaService) {}

  private async generateUniqueHospitalAdminPhone(tx: any) {
    while (true) {
      const candidate = `HOSP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const existing = await tx.user.findUnique({
        where: { phone: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }
    }
  }

  /**
   * Create a new hospital
   */
  async createHospital(data: CreateHospitalDto, createdById: string) {
    try {
      // Verify district exists
      const district = await this.prisma.district.findUnique({
        where: { id: data.districtId },
      });

      if (!district) {
        throw new BadRequestException(`District with ID ${data.districtId} not found`);
      }

      // Verify zone if provided
      if (data.zoneId) {
        const zone = await this.prisma.zone.findUnique({
          where: { id: data.zoneId },
        });

        if (!zone) {
          throw new BadRequestException(`Zone with ID ${data.zoneId} not found`);
        }
      }

      // Check for duplicates
      const existingHospital = await this.prisma.hospital.findFirst({
        where: {
          OR: [
            { name: data.name },
            { registrationNo: data.registrationNo },
            { email: data.email },
          ],
        },
      });

      if (existingHospital) {
        throw new BadRequestException(
          'Hospital with this name, registration number, or email already exists'
        );
      }

      const adminEmail = data.email.trim();
      const normalizedAdminEmail = adminEmail.toLowerCase();

      const existingAdminUser = await this.prisma.user.findUnique({
        where: { email: normalizedAdminEmail },
        select: { id: true },
      });

      if (existingAdminUser) {
        throw new BadRequestException(
          'Hospital admin user with this email already exists'
        );
      }

      const existingAdminPhone = await this.prisma.user.findUnique({
        where: { phone: data.phone },
        select: { id: true },
      });

      if (existingAdminPhone) {
        throw new BadRequestException(
          'Hospital admin user with this phone already exists'
        );
      }

      const adminPassword = data.adminPassword;
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

      const isMainHospital = data.isMainHospital === true;

      const hospital = await this.prisma.$transaction(async (tx) => {
        if (isMainHospital) {
          await tx.hospital.updateMany({
            where: { isMainHospital: true },
            data: { isMainHospital: false },
          });
        }

        const createdHospital = await tx.hospital.create({
          data: {
            name: data.name,
            registrationNo: data.registrationNo,
            type: data.type,
            isMainHospital,
            email: data.email,
            phone: data.phone,
            alternatePhone: data.alternatePhone,
            website: data.website,
            address: data.address,
            city: data.city,
            districtId: data.districtId,
            zoneId: data.zoneId,
            postalCode: data.postalCode,
            establishedYear: data.establishedYear,
            licenseNumber: data.licenseNumber,
            bedCapacity: data.bedCapacity,
            specialization: data.specialization || [],
            totalDoctors: data.totalDoctors,
            totalTherapists: data.totalTherapists,
            totalStaff: data.totalStaff,
            adminEmail,
            adminPassword: hashedAdminPassword,
            createdById,
            status: 'ACTIVE',
          },
          include: {
            district: true,
            zone: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        const hospitalAdminUser = await tx.user.create({
          data: {
            email: normalizedAdminEmail,
            phone: data.phone,
            password: hashedAdminPassword,
            firstName: data.name,
            lastName: 'Admin',
            role: UserRole.HOSPITAL_ADMIN,
            status: UserStatus.ACTIVE,
            address: data.address,
            city: data.city,
            emailVerified: true,
          },
        });

        await tx.hospitalProfile.create({
          data: {
            userId: hospitalAdminUser.id,
            hospitalId: createdHospital.id,
            department: 'Administration',
            designation: 'Hospital Admin',
            qualifications: [],
          },
        });

        return createdHospital;
      });

      return {
        success: true,
        data: {
          ...hospital,
          adminPassword: undefined, // Don't return hashed password
        },
        message: 'Hospital created successfully',
      };
    } catch (error) {
      this.logger.error('Error creating hospital:', error);
      throw error;
    }
  }

  /**
   * Get all hospitals
   */
  async getAllHospitals(filters?: {
    districtId?: string;
    zoneId?: string;
    status?: string;
    type?: string;
    searchTerm?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const whereClause: any = {};

      if (filters?.districtId) {
        whereClause.districtId = filters.districtId;
      }

      if (filters?.zoneId) {
        whereClause.zoneId = filters.zoneId;
      }

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.type) {
        whereClause.type = filters.type;
      }

      if (filters?.searchTerm) {
        whereClause.OR = [
          { name: { contains: filters.searchTerm, mode: 'insensitive' } },
          { registrationNo: { contains: filters.searchTerm, mode: 'insensitive' } },
        ];
      }

      const [hospitals, total] = await Promise.all([
        this.prisma.hospital.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            district: true,
            zone: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            subHospitals: true,
            children: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.hospital.count({ where: whereClause }),
      ]);

      return {
        success: true,
        data: hospitals.map((h) => ({
          ...h,
          adminPassword: undefined,
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching hospitals:', error);
      throw error;
    }
  }

  /**
   * Get hospital by ID
   */
  async getHospitalById(id: string) {
    try {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id },
        include: {
          district: true,
          zone: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          subHospitals: {
            include: {
              zone: true,
              district: true,
            },
          },
          children: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              diagnosis: true,
            },
            take: 10,
          },
        },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${id} not found`);
      }

      return {
        success: true,
        data: {
          ...hospital,
          adminPassword: undefined,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching hospital:', error);
      throw error;
    }
  }

  /**
   * Update hospital
   */
  async updateHospital(id: string, data: UpdateHospitalDto) {
    try {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id },
        include: {
          adminProfile: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${id} not found`);
      }

      if (data.name && data.name !== hospital.name) {
        const existingByName = await this.prisma.hospital.findFirst({
          where: {
            name: data.name,
            id: { not: id },
          },
          select: { id: true },
        });

        if (existingByName) {
          throw new BadRequestException('Hospital with this name already exists');
        }
      }

      if (data.registrationNo && data.registrationNo !== hospital.registrationNo) {
        const existingByRegNo = await this.prisma.hospital.findFirst({
          where: {
            registrationNo: data.registrationNo,
            id: { not: id },
          },
          select: { id: true },
        });

        if (existingByRegNo) {
          throw new BadRequestException(
            'Hospital with this registration number already exists'
          );
        }
      }

      if (data.email && data.email !== hospital.email) {
        const existingByEmail = await this.prisma.hospital.findFirst({
          where: {
            email: data.email,
            id: { not: id },
          },
          select: { id: true },
        });

        if (existingByEmail) {
          throw new BadRequestException('Hospital with this email already exists');
        }
      }

      if (hospital.adminProfile?.userId && data.email) {
        const existingAdminEmail = await this.prisma.user.findFirst({
          where: {
            email: data.email.trim().toLowerCase(),
            id: { not: hospital.adminProfile.userId },
          },
          select: { id: true },
        });

        if (existingAdminEmail) {
          throw new BadRequestException(
            'Hospital admin user with this email already exists'
          );
        }
      }

      if (hospital.adminProfile?.userId && data.phone) {
        const existingAdminPhone = await this.prisma.user.findFirst({
          where: {
            phone: data.phone,
            id: { not: hospital.adminProfile.userId },
          },
          select: { id: true },
        });

        if (existingAdminPhone) {
          throw new BadRequestException(
            'Hospital admin user with this phone already exists'
          );
        }
      }

      // Verify district if being changed
      if (data.districtId && data.districtId !== hospital.districtId) {
        const district = await this.prisma.district.findUnique({
          where: { id: data.districtId },
        });

        if (!district) {
          throw new BadRequestException(`District with ID ${data.districtId} not found`);
        }
      }

      // Verify zone if being changed
      if (data.zoneId && data.zoneId !== hospital.zoneId) {
        const zone = await this.prisma.zone.findUnique({
          where: { id: data.zoneId },
        });

        if (!zone) {
          throw new BadRequestException(`Zone with ID ${data.zoneId} not found`);
        }
      }

      const updateData: any = {};
      let hashedAdminPassword: string | undefined;
      if (data.adminPassword?.trim()) {
        hashedAdminPassword = await bcrypt.hash(data.adminPassword.trim(), 10);
      }

      if (data.name !== undefined) updateData.name = data.name;
      if (data.registrationNo !== undefined) updateData.registrationNo = data.registrationNo;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.email !== undefined) {
        updateData.email = data.email;
        updateData.adminEmail = data.email.trim().toLowerCase();
      }
      if (hashedAdminPassword !== undefined) updateData.adminPassword = hashedAdminPassword;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.alternatePhone !== undefined) updateData.alternatePhone = data.alternatePhone;
      if (data.website !== undefined) updateData.website = data.website;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.districtId !== undefined) updateData.districtId = data.districtId;
      if (data.zoneId !== undefined) updateData.zoneId = data.zoneId;
      if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
      if (data.bedCapacity !== undefined) updateData.bedCapacity = data.bedCapacity;
      if (data.specialization !== undefined) updateData.specialization = data.specialization;
      if (data.totalDoctors !== undefined) updateData.totalDoctors = data.totalDoctors;
      if (data.totalTherapists !== undefined) updateData.totalTherapists = data.totalTherapists;
      if (data.totalStaff !== undefined) updateData.totalStaff = data.totalStaff;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isMainHospital !== undefined) updateData.isMainHospital = data.isMainHospital;

      const updated = await this.prisma.$transaction(async (tx) => {
        if (data.isMainHospital === true) {
          await tx.hospital.updateMany({
            where: {
              isMainHospital: true,
              id: { not: id },
            },
            data: { isMainHospital: false },
          });
        }

        const updatedHospital = await tx.hospital.update({
          where: { id },
          data: updateData,
          include: {
            district: true,
            zone: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        if (hospital.adminProfile?.userId) {
          const mappedUserStatus =
            data.status === 'ACTIVE'
              ? UserStatus.ACTIVE
              : data.status === 'INACTIVE'
                ? UserStatus.INACTIVE
                : undefined;

          await tx.user.update({
            where: { id: hospital.adminProfile.userId },
            data: {
              ...(data.email !== undefined
                ? { email: data.email.trim().toLowerCase() }
                : {}),
              ...(hashedAdminPassword !== undefined
                ? { password: hashedAdminPassword }
                : {}),
              ...(data.phone !== undefined ? { phone: data.phone } : {}),
              ...(data.name !== undefined ? { firstName: data.name } : {}),
              ...(data.address !== undefined ? { address: data.address } : {}),
              ...(data.city !== undefined ? { city: data.city } : {}),
              ...(mappedUserStatus !== undefined ? { status: mappedUserStatus } : {}),
            },
          });
        }

        return updatedHospital;
      });

      return {
        success: true,
        data: {
          ...updated,
          adminPassword: undefined,
        },
        message: 'Hospital updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating hospital:', error);
      throw error;
    }
  }

  /**
   * Hard delete hospital and cleanup dependent links
   */
  async deleteHospital(id: string) {
    try {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id },
        include: {
          adminProfile: {
            select: {
              userId: true,
            },
          },
          subHospitals: {
            select: {
              id: true,
            },
          },
          staff: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${id} not found`);
      }

      const subHospitalIds = hospital.subHospitals.map((item) => item.id);
      const staffIds = hospital.staff.map((item) => item.id);

      await this.prisma.$transaction(async (tx) => {
        await tx.child.updateMany({
          where: { hospitalId: id },
          data: {
            hospitalId: null,
            subHospitalId: null,
          },
        });

        const appointmentWhere: any = {
          OR: [{ hospitalId: id }],
        };

        if (subHospitalIds.length > 0) {
          appointmentWhere.OR.push({ subHospitalId: { in: subHospitalIds } });
        }

        if (staffIds.length > 0) {
          appointmentWhere.OR.push({ staffId: { in: staffIds } });
        }

        await tx.appointment.updateMany({
          where: appointmentWhere,
          data: {
            hospitalId: null,
            subHospitalId: null,
            staffId: null,
          },
        });

        await tx.device.updateMany({
          where: { hospitalId: id },
          data: {
            hospitalId: null,
          },
        });

        await tx.admissionTracking.updateMany({
          where: { hospitalId: id },
          data: {
            hospitalId: null,
          },
        });

        await tx.credentialLog.deleteMany({
          where: { hospitalId: id },
        });

        await tx.hospitalStaff.deleteMany({
          where: { hospitalId: id },
        });

        await tx.hospitalProfile.deleteMany({
          where: { hospitalId: id },
        });

        await tx.hospital.delete({
          where: { id },
        });

        if (hospital.adminProfile?.userId) {
          await tx.auditLog.deleteMany({
            where: { userId: hospital.adminProfile.userId },
          });

          await tx.credentialLog.deleteMany({
            where: { generatedById: hospital.adminProfile.userId },
          });

          await tx.$executeRaw(
            Prisma.sql`DELETE FROM "users" WHERE "id" = ${hospital.adminProfile.userId}`
          );
        }

        if (hospital.adminProfile?.userId) {
          const stillExists = await tx.user.findUnique({
            where: { id: hospital.adminProfile.userId },
            select: { id: true },
          });

          if (stillExists) {
            throw new BadRequestException(
              'Hospital admin user could not be permanently deleted due to related records'
            );
          }
        }
      });

      return {
        success: true,
        message: 'Hospital deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error deleting hospital:', error);
      throw error;
    }
  }

  /**
   * Get hospitals by district with zone hierarchy
   */
  async getHospitalsByDistrict(districtId: string) {
    try {
      const hospitals = await this.prisma.hospital.findMany({
        where: {
          districtId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          type: true,
          zone: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return {
        success: true,
        data: hospitals,
      };
    } catch (error) {
      this.logger.error('Error fetching hospitals by district:', error);
      throw error;
    }
  }

  /**
   * Get hospitals by zone
   */
  async getHospitalsByZone(zoneId: string) {
    try {
      const hospitals = await this.prisma.hospital.findMany({
        where: {
          zoneId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          type: true,
          district: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return {
        success: true,
        data: hospitals,
      };
    } catch (error) {
      this.logger.error('Error fetching hospitals by zone:', error);
      throw error;
    }
  }

  /**
   * Get all active hospitals (for patient assignment and general use)
   */
  async getActiveHospitals() {
    try {
      const hospitals = await this.prisma.hospital.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          type: true,
          bedCapacity: true,
          totalStaff: true,
          specialization: true,
          district: {
            select: {
              id: true,
              name: true,
              province: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          zone: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return {
        success: true,
        data: hospitals,
      };
    } catch (error) {
      this.logger.error('Error fetching active hospitals:', error);
      throw error;
    }
  }
}
