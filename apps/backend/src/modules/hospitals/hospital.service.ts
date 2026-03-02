import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateHospitalDto, UpdateHospitalDto } from './dtos/create-hospital.dto';

@Injectable()
export class HospitalService {
  private readonly logger = new Logger(HospitalService.name);

  constructor(private prisma: PrismaService) {}

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

      // Generate admin email
      const institutionCode = data.registrationNo
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .substring(0, 8);
      const adminEmail = `admin-${institutionCode}@armigo-health.local`;

      // Store admin password as-is (in production, consider proper encryption)
      const adminPassword = data.adminPassword || `TempPass@${Date.now()}`;

      const isMainHospital = data.isMainHospital === true;

      const hospital = await this.prisma.$transaction(async (tx) => {
        if (isMainHospital) {
          await tx.hospital.updateMany({
            where: { isMainHospital: true },
            data: { isMainHospital: false },
          });
        }

        return tx.hospital.create({
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
            adminPassword,
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
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${id} not found`);
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
      if (data.name !== undefined) updateData.name = data.name;
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

        return tx.hospital.update({
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
