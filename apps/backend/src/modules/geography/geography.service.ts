import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateProvinceDto } from './dtos/create-province.dto';
import { CreateDistrictDto, CreateZoneDto } from './dtos/create-location.dto';

@Injectable()
export class GeographyService {
  private readonly logger = new Logger(GeographyService.name);

  constructor(private prisma: PrismaService) {}

  // ============ PROVINCES ============

  async createProvince(data: CreateProvinceDto) {
    try {
      const existingProvince = await this.prisma.province.findFirst({
        where: {
          OR: [
            { name: data.name },
            { code: data.code },
          ],
        },
      });

      if (existingProvince) {
        throw new BadRequestException(
          `Province with name "${data.name}" or code "${data.code}" already exists`
        );
      }

      const province = await this.prisma.province.create({
        data: {
          name: data.name,
          code: data.code,
          sortOrder: data.sortOrder || 0,
        },
        include: {
          districts: true,
        },
      });

      return {
        success: true,
        data: province,
        message: 'Province created successfully',
      };
    } catch (error) {
      this.logger.error('Error creating province:', error);
      throw error;
    }
  }

  async getAllProvinces() {
    try {
      const provinces = await this.prisma.province.findMany({
        include: {
          districts: {
            include: {
              zones: {
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      return {
        success: true,
        data: provinces,
      };
    } catch (error) {
      this.logger.error('Error fetching provinces:', error);
      throw error;
    }
  }

  async getProvinceById(id: string) {
    try {
      const province = await this.prisma.province.findUnique({
        where: { id },
        include: {
          districts: {
            include: {
              zones: true,
            },
          },
        },
      });

      if (!province) {
        throw new NotFoundException(`Province with ID ${id} not found`);
      }

      return {
        success: true,
        data: province,
      };
    } catch (error) {
      this.logger.error('Error fetching province:', error);
      throw error;
    }
  }

  async updateProvince(id: string, data: Partial<CreateProvinceDto>) {
    try {
      const province = await this.prisma.province.findUnique({
        where: { id },
      });

      if (!province) {
        throw new NotFoundException(`Province with ID ${id} not found`);
      }

      const updated = await this.prisma.province.update({
        where: { id },
        data: {
          name: data.name || province.name,
          code: data.code || province.code,
          sortOrder: data.sortOrder !== undefined ? data.sortOrder : province.sortOrder,
        },
        include: {
          districts: true,
        },
      });

      return {
        success: true,
        data: updated,
        message: 'Province updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating province:', error);
      throw error;
    }
  }

  async deleteProvince(id: string) {
    try {
      const province = await this.prisma.province.findUnique({
        where: { id },
        include: {
          districts: true,
        },
      });

      if (!province) {
        throw new NotFoundException(`Province with ID ${id} not found`);
      }

      if (province.districts.length > 0) {
        throw new BadRequestException(
          'Cannot delete province with existing districts'
        );
      }

      await this.prisma.province.delete({
        where: { id },
      });

      return {
        success: true,
        message: `Province "${province.name}" deleted successfully`,
      };
    } catch (error) {
      this.logger.error('Error deleting province:', error);
      throw error;
    }
  }

  // ============ DISTRICTS ============

  async createDistrict(data: CreateDistrictDto) {
    try {
      if (data.provinceId) {
        const province = await this.prisma.province.findUnique({
          where: { id: data.provinceId },
        });
        if (!province) {
          throw new BadRequestException(`Province with ID ${data.provinceId} not found`);
        }
      }

      const existingDistrict = await this.prisma.district.findFirst({
        where: {
          OR: [
            { name: data.name },
            { code: data.code },
          ],
        },
      });

      if (existingDistrict) {
        throw new BadRequestException(
          `District with name "${data.name}" or code "${data.code}" already exists`
        );
      }

      const district = await this.prisma.district.create({
        data: {
          name: data.name,
          code: data.code,
          provinceId: data.provinceId,
          sortOrder: data.sortOrder || 0,
        },
        include: {
          province: true,
          zones: true,
        },
      });

      return {
        success: true,
        data: district,
        message: 'District created successfully',
      };
    } catch (error) {
      this.logger.error('Error creating district:', error);
      throw error;
    }
  }

  async getAllDistricts() {
    try {
      const districts = await this.prisma.district.findMany({
        include: {
          province: true,
          zones: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      return {
        success: true,
        data: districts,
      };
    } catch (error) {
      this.logger.error('Error fetching districts:', error);
      throw error;
    }
  }

  async getDistrictsByProvince(provinceId: string) {
    try {
      const districts = await this.prisma.district.findMany({
        where: { provinceId },
        include: {
          zones: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      return {
        success: true,
        data: districts,
      };
    } catch (error) {
      this.logger.error('Error fetching districts by province:', error);
      throw error;
    }
  }

  async updateDistrict(id: string, data: Partial<CreateDistrictDto>) {
    try {
      const district = await this.prisma.district.findUnique({
        where: { id },
      });

      if (!district) {
        throw new NotFoundException(`District with ID ${id} not found`);
      }

      const updated = await this.prisma.district.update({
        where: { id },
        data: {
          name: data.name || district.name,
          code: data.code || district.code,
          provinceId: data.provinceId || district.provinceId,
          sortOrder: data.sortOrder !== undefined ? data.sortOrder : district.sortOrder,
        },
        include: {
          province: true,
          zones: true,
        },
      });

      return {
        success: true,
        data: updated,
        message: 'District updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating district:', error);
      throw error;
    }
  }

  async deleteDistrict(id: string) {
    try {
      const district = await this.prisma.district.findUnique({
        where: { id },
        include: {
          zones: true,
        },
      });

      if (!district) {
        throw new NotFoundException(`District with ID ${id} not found`);
      }

      if (district.zones.length > 0) {
        throw new BadRequestException(
          'Cannot delete district with existing zones'
        );
      }

      await this.prisma.district.delete({
        where: { id },
      });

      return {
        success: true,
        message: `District "${district.name}" deleted successfully`,
      };
    } catch (error) {
      this.logger.error('Error deleting district:', error);
      throw error;
    }
  }

  // ============ ZONES ============

  async createZone(data: CreateZoneDto) {
    try {
      const district = await this.prisma.district.findUnique({
        where: { id: data.districtId },
      });

      if (!district) {
        throw new BadRequestException(`District with ID ${data.districtId} not found`);
      }

      const existingZone = await this.prisma.zone.findFirst({
        where: {
          OR: [
            { name: data.name },
            { code: data.code },
          ],
        },
      });

      if (existingZone) {
        throw new BadRequestException(
          `Zone with name "${data.name}" or code "${data.code}" already exists`
        );
      }

      const zone = await this.prisma.zone.create({
        data: {
          name: data.name,
          code: data.code,
          districtId: data.districtId,
          sortOrder: data.sortOrder || 0,
        },
        include: {
          district: {
            include: {
              province: true,
            },
          },
        },
      });

      return {
        success: true,
        data: zone,
        message: 'Zone created successfully',
      };
    } catch (error) {
      this.logger.error('Error creating zone:', error);
      throw error;
    }
  }

  async getAllZones() {
    try {
      const zones = await this.prisma.zone.findMany({
        include: {
          district: {
            include: {
              province: true,
            },
          },
          _count: {
            select: {
              hospitals: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return {
        success: true,
        data: zones,
      };
    } catch (error) {
      this.logger.error('Error fetching zones:', error);
      throw error;
    }
  }

  async getZonesByDistrict(districtId: string) {
    try {
      const zones = await this.prisma.zone.findMany({
        where: { districtId },
        include: {
          district: {
            include: {
              province: true,
            },
          },
          _count: {
            select: {
              hospitals: true,
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      return {
        success: true,
        data: zones,
      };
    } catch (error) {
      this.logger.error('Error fetching zones by district:', error);
      throw error;
    }
  }

  async updateZone(id: string, data: Partial<CreateZoneDto>) {
    try {
      const zone = await this.prisma.zone.findUnique({
        where: { id },
      });

      if (!zone) {
        throw new NotFoundException(`Zone with ID ${id} not found`);
      }

      const updated = await this.prisma.zone.update({
        where: { id },
        data: {
          name: data.name || zone.name,
          code: data.code || zone.code,
          districtId: data.districtId || zone.districtId,
          sortOrder: data.sortOrder !== undefined ? data.sortOrder : zone.sortOrder,
        },
        include: {
          district: {
            include: {
              province: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updated,
        message: 'Zone updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating zone:', error);
      throw error;
    }
  }

  async deleteZone(id: string) {
    try {
      const zone = await this.prisma.zone.findUnique({
        where: { id },
      });

      if (!zone) {
        throw new NotFoundException(`Zone with ID ${id} not found`);
      }

      await this.prisma.zone.delete({
        where: { id },
      });

      return {
        success: true,
        message: `Zone "${zone.name}" deleted successfully`,
      };
    } catch (error) {
      this.logger.error('Error deleting zone:', error);
      throw error;
    }
  }
}
