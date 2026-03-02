import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HospitalService } from './hospital.service';
import { CreateHospitalDto, UpdateHospitalDto } from './dtos/create-hospital.dto';

@ApiTags('Hospitals')
@Controller('hospitals')
@ApiBearerAuth()
export class HospitalController {
  private readonly logger = new Logger(HospitalController.name);

  constructor(private readonly hospitalService: HospitalService) {}

  /**
   * Create a new hospital
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new hospital' })
  async createHospital(
    @Body() createHospitalDto: CreateHospitalDto,
    @Req() req: any
  ) {
    this.logger.log(`Creating hospital: ${createHospitalDto.name}`);
    const createdById = req.user?.id || 'system';
    return await this.hospitalService.createHospital(createHospitalDto, createdById);
  }

  /**
   * Get all hospitals with filtering
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all hospitals with filtering' })
  async getAllHospitals(
    @Query('districtId') districtId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') searchTerm?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const filters = {
      districtId,
      zoneId,
      status,
      type,
      searchTerm,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };

    this.logger.log('Fetching hospitals with filters');
    return await this.hospitalService.getAllHospitals(filters);
  }

  /**
   * Get hospital by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get hospital by ID' })
  async getHospitalById(@Param('id') id: string) {
    this.logger.log(`Fetching hospital: ${id}`);
    return await this.hospitalService.getHospitalById(id);
  }

  /**
   * Update hospital
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update hospital' })
  async updateHospital(
    @Param('id') id: string,
    @Body() updateHospitalDto: UpdateHospitalDto
  ) {
    this.logger.log(`Updating hospital: ${id}`);
    return await this.hospitalService.updateHospital(id, updateHospitalDto);
  }

  /**
   * Get hospitals by district
   */
  @Get('district/:districtId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get hospitals by district' })
  async getHospitalsByDistrict(@Param('districtId') districtId: string) {
    this.logger.log(`Fetching hospitals for district: ${districtId}`);
    return await this.hospitalService.getHospitalsByDistrict(districtId);
  }

  /**
   * Get hospitals by zone
   */
  @Get('zone/:zoneId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get hospitals by zone' })
  async getHospitalsByZone(@Param('zoneId') zoneId: string) {
    this.logger.log(`Fetching hospitals for zone: ${zoneId}`);
    return await this.hospitalService.getHospitalsByZone(zoneId);
  }

  /**
   * Get all active hospitals (for patient assignment)
   */
  @Get('list/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all active hospitals' })
  async getActiveHospitals() {
    this.logger.log('Fetching active hospitals');
    return await this.hospitalService.getActiveHospitals();
  }
}
