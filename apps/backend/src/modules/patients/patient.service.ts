import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreatePatientDto } from './dtos/create-patient.dto';
import { UpdatePatientDto } from './dtos/update-patient.dto';
import { PatientResponseDto, PatientStatsDto } from './dtos/patient-response.dto';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new patient
   */
  async createPatient(data: CreatePatientDto): Promise<PatientResponseDto> {
    try {
      // Calculate age from dateOfBirth
      const birthDate = new Date(data.dateOfBirth);
      const age = this.calculateAge(birthDate);

      // Create a temporary user for the patient if no parent exists
      const user = await this.prisma.user.findFirst({
        where: { email: data.email },
      });

      let parentId: string;
      if (user && user.role === 'PARENT') {
        parentId = user.id;
      } else {
        // Create a placeholder parent record if needed
        const placeholderParent = await this.prisma.user.create({
          data: {
            email: data.email || `patient-${Date.now()}@armigo-health.local`,
            phone: data.phone,
            firstName: data.firstName,
            lastName: data.lastName,
            password: 'placeholder', // Will be set properly by admin
            role: 'PARENT',
            status: 'ACTIVE',
          },
        });
        parentId = placeholderParent.id;
      }

      const patient = await this.prisma.child.create({
        data: {
          parentId,
          hospitalId: data.hospitalId,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: birthDate,
          age,
          gender: data.gender,
          diagnosis: data.diagnosis || null,
          assignedDoctor: data.assignedDoctor,
          medicalNotes: data.medicalHistory,
          isActive: true,
        },
      });

      return this.mapChildToPatientResponse(patient);
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
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const updateData: any = { ...data };
    if (data.dateOfBirth) {
      const birthDate = new Date(data.dateOfBirth);
      updateData.dateOfBirth = birthDate;
      updateData.age = this.calculateAge(birthDate);
    }

    const updated = await this.prisma.child.update({
      where: { id },
      data: updateData,
    });

    return this.mapChildToPatientResponse(updated);
  }

  /**
   * Delete patient (soft delete by marking inactive)
   */
  async deletePatient(id: string): Promise<{ message: string }> {
    const patient = await this.prisma.child.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    await this.prisma.child.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: `Patient ${id} has been deleted` };
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

  /**
   * Private helper method to map Child model to PatientResponseDto
   */
  private mapChildToPatientResponse(child: any): PatientResponseDto {
    return {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      email: child.parentProfile?.user?.email,
      phone: child.parentProfile?.user?.phone,
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
      isActive: child.isActive,
      enrolledAt: child.enrolledAt,
      createdAt: child.enrolledAt,
      updatedAt: child.enrolledAt,
    };
  }
}
