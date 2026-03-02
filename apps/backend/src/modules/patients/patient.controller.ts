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
import { UpdatePatientStatusDto } from './dtos/update-patient-status.dto';
import { PatientResponseDto, PatientStatsDto } from './dtos/patient-response.dto';
import {
  CreatePhysiotherapistDto,
  UpdatePhysiotherapistDto,
} from './dtos/physiotherapist.dto';
import {
  CreateAdmissionTrackingDto,
  UpdateAdmissionTrackingDto,
} from './dtos/admission-tracking.dto';

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
      isActive:
        isActive !== undefined && isActive !== null && isActive !== ''
          ? isActive === 'true'
          : undefined,
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
   * Update patient active/inactive status
   */
  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update patient active/inactive status' })
  @ApiResponse({
    status: 200,
    description: 'Patient status updated successfully',
    type: PatientResponseDto,
  })
  async updatePatientStatus(
    @Param('id') id: string,
    @Body() body: UpdatePatientStatusDto
  ) {
    this.logger.log(`Updating patient status: ${id} -> ${body.isActive}`);
    const patient = await this.patientService.setPatientStatus(id, body.isActive);
    return {
      success: true,
      data: patient,
      message: 'Patient status updated successfully',
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
  async deletePatient(
    @Param('id') id: string,
    @Query('mode') mode?: 'inactive' | 'permanent'
  ) {
    const normalizedMode = mode === 'inactive' ? 'inactive' : 'permanent';
    this.logger.log(`Deleting patient: ${id} with mode ${normalizedMode}`);
    const result = await this.patientService.deletePatient(id, normalizedMode);
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

  /**
   * Get doctors/therapists for patient assignment
   */
  @Get('locations/doctors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active doctors/therapists for patient assignment' })
  @ApiResponse({
    status: 200,
    description: 'Doctors retrieved successfully',
  })
  async getDoctors(@Query('hospitalId') hospitalId?: string) {
    this.logger.log(
      `Getting doctors${hospitalId ? ` for hospital: ${hospitalId}` : ''}`
    );
    const doctors = await this.patientService.getDoctors(hospitalId);
    return {
      success: true,
      data: doctors,
    };
  }

  /**
   * Get physiotherapists
   */
  @Get('locations/physiotherapists')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active physiotherapists' })
  @ApiResponse({
    status: 200,
    description: 'Physiotherapists retrieved successfully',
  })
  async getPhysiotherapists(
    @Query('hospitalId') hospitalId?: string,
    @Query('includeInactive') includeInactive?: string
  ) {
    this.logger.log(
      `Getting physiotherapists${hospitalId ? ` for hospital: ${hospitalId}` : ''}`
    );
    const physiotherapists = await this.patientService.getPhysiotherapists(
      hospitalId,
      includeInactive === 'true'
    );
    return {
      success: true,
      data: physiotherapists,
    };
  }

  /**
   * Update physiotherapist active/inactive status
   */
  @Put('locations/physiotherapists/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update physiotherapist active/inactive status' })
  @ApiResponse({
    status: 200,
    description: 'Physiotherapist status updated successfully',
  })
  async updatePhysiotherapistStatus(
    @Param('id') id: string,
    @Body() body: UpdatePatientStatusDto
  ) {
    this.logger.log(`Updating physiotherapist status: ${id} -> ${body.isActive}`);
    const physiotherapist = await this.patientService.setPhysiotherapistStatus(
      id,
      body.isActive
    );
    return {
      success: true,
      data: physiotherapist,
      message: 'Physiotherapist status updated successfully',
    };
  }

  /**
   * Create physiotherapist
   */
  @Post('locations/physiotherapists')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create physiotherapist' })
  @ApiResponse({
    status: 201,
    description: 'Physiotherapist created successfully',
  })
  async createPhysiotherapist(@Body() body: CreatePhysiotherapistDto) {
    this.logger.log(`Creating physiotherapist: ${body.name}`);
    const physiotherapist = await this.patientService.createPhysiotherapist(body);
    return {
      success: true,
      data: physiotherapist,
      message: 'Physiotherapist created successfully',
    };
  }

  /**
   * Update physiotherapist
   */
  @Put('locations/physiotherapists/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update physiotherapist' })
  @ApiResponse({
    status: 200,
    description: 'Physiotherapist updated successfully',
  })
  async updatePhysiotherapist(
    @Param('id') id: string,
    @Body() body: UpdatePhysiotherapistDto
  ) {
    this.logger.log(`Updating physiotherapist: ${id}`);
    const physiotherapist = await this.patientService.updatePhysiotherapist(id, body);
    return {
      success: true,
      data: physiotherapist,
      message: 'Physiotherapist updated successfully',
    };
  }

  /**
   * Delete physiotherapist
   */
  @Delete('locations/physiotherapists/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete physiotherapist' })
  @ApiResponse({
    status: 200,
    description: 'Physiotherapist deleted successfully',
  })
  async deletePhysiotherapist(
    @Param('id') id: string,
    @Query('mode') mode?: 'inactive' | 'permanent'
  ) {
    const normalizedMode = mode === 'inactive' ? 'inactive' : 'permanent';
    this.logger.log(
      `Deleting physiotherapist: ${id} with mode ${normalizedMode}`
    );
    const result = await this.patientService.deletePhysiotherapist(
      id,
      normalizedMode
    );
    return {
      success: true,
      message: result.message,
    };
  }

  /**
   * Get admission tracking options
   */
  @Get('management/admissions/options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get admission tracking options (children, physiotherapists, hospitals, devices)',
  })
  @ApiResponse({
    status: 200,
    description: 'Admission tracking options retrieved successfully',
  })
  async getAdmissionTrackingOptions(@Query('hospitalId') hospitalId?: string) {
    this.logger.log('Getting admission tracking options');
    const data = await this.patientService.getAdmissionTrackingOptions(hospitalId);
    return {
      success: true,
      data,
    };
  }

  /**
   * Get admission tracking records
   */
  @Get('management/admissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get admission tracking records' })
  @ApiResponse({
    status: 200,
    description: 'Admission tracking records retrieved successfully',
  })
  async getAdmissionTrackings(
    @Query('hospitalId') hospitalId?: string,
    @Query('childId') childId?: string,
    @Query('physiotherapistId') physiotherapistId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    const data = await this.patientService.getAdmissionTrackings({
      hospitalId,
      childId,
      physiotherapistId,
      status,
      search,
    });

    return {
      success: true,
      data,
    };
  }

  /**
   * Create admission tracking record
   */
  @Post('management/admissions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create admission tracking record' })
  @ApiResponse({
    status: 201,
    description: 'Admission tracking created successfully',
  })
  async createAdmissionTracking(@Body() body: CreateAdmissionTrackingDto) {
    this.logger.log(`Creating admission tracking for child: ${body.childId}`);
    const data = await this.patientService.createAdmissionTracking(body);
    return {
      success: true,
      data,
      message: 'Admission tracking created successfully',
    };
  }

  /**
   * Update admission tracking record
   */
  @Put('management/admissions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update admission tracking record' })
  @ApiResponse({
    status: 200,
    description: 'Admission tracking updated successfully',
  })
  async updateAdmissionTracking(
    @Param('id') id: string,
    @Body() body: UpdateAdmissionTrackingDto
  ) {
    this.logger.log(`Updating admission tracking: ${id}`);
    const data = await this.patientService.updateAdmissionTracking(id, body);
    return {
      success: true,
      data,
      message: 'Admission tracking updated successfully',
    };
  }

  /**
   * Update admission tracking status
   */
  @Put('management/admissions/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update admission tracking status' })
  @ApiResponse({
    status: 200,
    description: 'Admission tracking status updated successfully',
  })
  async updateAdmissionTrackingStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    const data = await this.patientService.updateAdmissionTrackingStatus(
      id,
      body?.status
    );
    return {
      success: true,
      data,
      message: 'Admission tracking status updated successfully',
    };
  }

  /**
   * Delete admission tracking record
   */
  @Delete('management/admissions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete admission tracking record' })
  @ApiResponse({
    status: 200,
    description: 'Admission tracking deleted successfully',
  })
  async deleteAdmissionTracking(@Param('id') id: string) {
    const result = await this.patientService.deleteAdmissionTracking(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
