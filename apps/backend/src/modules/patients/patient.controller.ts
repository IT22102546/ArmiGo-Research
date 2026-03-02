import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dtos/create-patient.dto';
import { UpdatePatientDto } from './dtos/update-patient.dto';
import { PatientResponseDto, PatientStatsDto } from './dtos/patient-response.dto';

@ApiTags('Patients')
@Controller('patients')
@ApiBearerAuth()
export class PatientController {
  private readonly logger = new Logger(PatientController.name);

  constructor(private readonly patientService: PatientService) {}

  /**
   * Create a new patient
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({
    status: 201,
    description: 'Patient created successfully',
    type: PatientResponseDto,
  })
  async createPatient(@Body() createPatientDto: CreatePatientDto) {
    this.logger.log(
      `Creating patient: ${createPatientDto.firstName} ${createPatientDto.lastName}`
    );
    const patient = await this.patientService.createPatient(createPatientDto);
    return {
      success: true,
      data: patient,
      message: 'Patient created successfully',
    };
  }

  /**
   * Get all patients
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all patients with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Patients retrieved successfully',
  })
  async getAllPatients(
    @Query('hospitalId') hospitalId?: string,
    @Query('isActive') isActive?: string,
    @Query('gender') gender?: string,
    @Query('diagnosis') diagnosis?: string,
    @Query('search') searchTerm?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const filters = {
      hospitalId,
      isActive: isActive === 'true',
      gender,
      diagnosis,
      searchTerm,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };

    const result = await this.patientService.getAllPatients(filters);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Get patient by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiResponse({
    status: 200,
    description: 'Patient retrieved successfully',
    type: PatientResponseDto,
  })
  async getPatientById(@Param('id') id: string) {
    this.logger.log(`Getting patient: ${id}`);
    const patient = await this.patientService.getPatientById(id);
    return {
      success: true,
      data: patient,
    };
  }

  /**
   * Get patient statistics
   */
  @Get('stats/overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get patient statistics' })
  @ApiResponse({
    status: 200,
    description: 'Patient stats retrieved successfully',
    type: PatientStatsDto,
  })
  async getPatientStats(@Query('hospitalId') hospitalId?: string) {
    this.logger.log('Getting patient statistics');
    const stats = await this.patientService.getPatientStats(hospitalId);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Update patient
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update patient' })
  @ApiResponse({
    status: 200,
    description: 'Patient updated successfully',
    type: PatientResponseDto,
  })
  async updatePatient(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto
  ) {
    this.logger.log(`Updating patient: ${id}`);
    const patient = await this.patientService.updatePatient(id, updatePatientDto);
    return {
      success: true,
      data: patient,
      message: 'Patient updated successfully',
    };
  }

  /**
   * Delete patient
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete patient' })
  @ApiResponse({
    status: 200,
    description: 'Patient deleted successfully',
  })
  async deletePatient(@Param('id') id: string) {
    this.logger.log(`Deleting patient: ${id}`);
    const result = await this.patientService.deletePatient(id);
    return {
      success: true,
      message: result.message,
    };
  }

  /**
   * Get all hospitals (for patient assignment)
   */
  @Get('locations/hospitals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all hospitals for patient assignment' })
  @ApiResponse({
    status: 200,
    description: 'Hospitals retrieved successfully',
  })
  async getHospitals() {
    this.logger.log('Getting hospitals');
    const hospitals = await this.patientService.getHospitals();
    return {
      success: true,
      data: hospitals,
    };
  }

  /**
   * Get all districts with zones
   */
  @Get('locations/districts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all districts with zones' })
  @ApiResponse({
    status: 200,
    description: 'Districts retrieved successfully',
  })
  async getDistricts() {
    this.logger.log('Getting districts');
    const districts = await this.patientService.getDistricts();
    return {
      success: true,
      data: districts,
    };
  }

  /**
   * Get zones by district
   */
  @Get('locations/districts/:districtId/zones')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get zones by district ID' })
  @ApiResponse({
    status: 200,
    description: 'Zones retrieved successfully',
  })
  async getZonesByDistrict(@Param('districtId') districtId: string) {
    this.logger.log(`Getting zones for district: ${districtId}`);
    const zones = await this.patientService.getZonesByDistrict(districtId);
    return {
      success: true,
      data: zones,
    };
  }

  /**
   * Get sub-hospitals by hospital
   */
  @Get('locations/hospitals/:hospitalId/sub-hospitals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sub-hospitals by hospital ID' })
  @ApiResponse({
    status: 200,
    description: 'Sub-hospitals retrieved successfully',
  })
  async getSubHospitalsByHospital(@Param('hospitalId') hospitalId: string) {
    this.logger.log(`Getting sub-hospitals for hospital: ${hospitalId}`);
    const subHospitals = await this.patientService.getSubHospitalsByHospital(hospitalId);
    return {
      success: true,
      data: subHospitals,
    };
  }
}
