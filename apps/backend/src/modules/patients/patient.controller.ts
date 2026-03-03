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
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@common/decorators';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { PatientService } from './patient.service';
import { UsersService } from '@modules/users/users.service';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
export class PatientController {
  private readonly logger = new Logger(PatientController.name);

  constructor(
    private readonly patientService: PatientService,
    private readonly usersService: UsersService
  ) {}

  private async resolveScopedHospitalId(req: any): Promise<string | undefined> {
    const roles = Array.isArray(req?.user?.roles)
      ? req.user.roles
      : [req?.user?.role].filter(Boolean);
    const isHospitalScopedUser =
      roles.includes(UserRole.HOSPITAL_ADMIN) && req?.user?.email !== 'armigo@gmail.com';

    if (!isHospitalScopedUser) {
      return undefined;
    }

    const userId = req?.user?.id || req?.user?.sub;
    if (!userId) {
      throw new ForbiddenException('Hospital scope resolution failed');
    }

    const user = await this.usersService.findById(userId);
    const hospitalId = user?.hospitalProfile?.hospitalId;
    if (!hospitalId) {
      throw new ForbiddenException('Hospital profile is not linked to this account');
    }

    return hospitalId;
  }

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
  async createPatient(@Request() req: any, @Body() createPatientDto: CreatePatientDto) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const payload: CreatePatientDto = scopedHospitalId
      ? { ...createPatientDto, hospitalId: scopedHospitalId }
      : createPatientDto;

    this.logger.log(
      `Creating patient: ${payload.firstName} ${payload.lastName}`
    );
    const patient = await this.patientService.createPatient(payload);
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
    @Request() req: any,
    @Query('hospitalId') hospitalId?: string,
    @Query('isActive') isActive?: string,
    @Query('gender') gender?: string,
    @Query('diagnosis') diagnosis?: string,
    @Query('search') searchTerm?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const filters = {
      hospitalId: scopedHospitalId || hospitalId,
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
  async getPatientById(@Request() req: any, @Param('id') id: string) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    this.logger.log(`Getting patient: ${id}`);
    const patient = await this.patientService.getPatientById(id);
    if (
      scopedHospitalId &&
      patient?.hospital?.id !== scopedHospitalId &&
      patient?.hospitalId !== scopedHospitalId
    ) {
      throw new ForbiddenException('You can only access patients in your hospital');
    }
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
  async getPatientStats(@Request() req: any, @Query('hospitalId') hospitalId?: string) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    this.logger.log('Getting patient statistics');
    const stats = await this.patientService.getPatientStats(scopedHospitalId || hospitalId);
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
    @Request() req: any,
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    if (scopedHospitalId) {
      const existing = await this.patientService.getPatientById(id);
      if (existing?.hospital?.id !== scopedHospitalId && existing?.hospitalId !== scopedHospitalId) {
        throw new ForbiddenException('You can only update patients in your hospital');
      }
    }

    const payload: UpdatePatientDto = scopedHospitalId
      ? { ...updatePatientDto, hospitalId: scopedHospitalId }
      : updatePatientDto;

    this.logger.log(`Updating patient: ${id}`);
    const patient = await this.patientService.updatePatient(id, payload);
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
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdatePatientStatusDto
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    if (scopedHospitalId) {
      const existing = await this.patientService.getPatientById(id);
      if (existing?.hospital?.id !== scopedHospitalId && existing?.hospitalId !== scopedHospitalId) {
        throw new ForbiddenException('You can only update patients in your hospital');
      }
    }

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
    @Request() req: any,
    @Param('id') id: string,
    @Query('mode') mode?: 'inactive' | 'permanent'
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    if (scopedHospitalId) {
      const existing = await this.patientService.getPatientById(id);
      if (existing?.hospital?.id !== scopedHospitalId && existing?.hospitalId !== scopedHospitalId) {
        throw new ForbiddenException('You can only delete patients in your hospital');
      }
    }

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
  async getHospitals(@Request() req: any) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    this.logger.log('Getting hospitals');
    const hospitals = await this.patientService.getHospitals();
    const filteredHospitals = scopedHospitalId
      ? hospitals.filter((item: any) => item.id === scopedHospitalId)
      : hospitals;
    return {
      success: true,
      data: filteredHospitals,
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
  async getSubHospitalsByHospital(
    @Request() req: any,
    @Param('hospitalId') hospitalId: string
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const effectiveHospitalId = scopedHospitalId || hospitalId;
    this.logger.log(`Getting sub-hospitals for hospital: ${hospitalId}`);
    const subHospitals = await this.patientService.getSubHospitalsByHospital(
      effectiveHospitalId
    );
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
  async getDoctors(@Request() req: any, @Query('hospitalId') hospitalId?: string) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const effectiveHospitalId = scopedHospitalId || hospitalId;
    this.logger.log(
      `Getting doctors${effectiveHospitalId ? ` for hospital: ${effectiveHospitalId}` : ''}`
    );
    const doctors = await this.patientService.getDoctors(effectiveHospitalId);
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
    @Request() req: any,
    @Query('hospitalId') hospitalId?: string,
    @Query('includeInactive') includeInactive?: string
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const effectiveHospitalId = scopedHospitalId || hospitalId;
    this.logger.log(
      `Getting physiotherapists${effectiveHospitalId ? ` for hospital: ${effectiveHospitalId}` : ''}`
    );
    const physiotherapists = await this.patientService.getPhysiotherapists(
      effectiveHospitalId,
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
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdatePatientStatusDto
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    if (scopedHospitalId) {
      const staff = await this.patientService.getPhysiotherapists(scopedHospitalId, true);
      if (!staff.some((item: any) => item.id === id)) {
        throw new ForbiddenException('You can only update physiotherapists in your hospital');
      }
    }

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
  async createPhysiotherapist(@Request() req: any, @Body() body: CreatePhysiotherapistDto) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const payload: CreatePhysiotherapistDto = scopedHospitalId
      ? { ...body, hospitalId: scopedHospitalId }
      : body;
    this.logger.log(`Creating physiotherapist: ${body.name}`);
    const physiotherapist = await this.patientService.createPhysiotherapist(payload);
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
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdatePhysiotherapistDto
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    if (scopedHospitalId) {
      const staff = await this.patientService.getPhysiotherapists(scopedHospitalId, true);
      if (!staff.some((item: any) => item.id === id)) {
        throw new ForbiddenException('You can only update physiotherapists in your hospital');
      }
    }

    const payload: UpdatePhysiotherapistDto = scopedHospitalId
      ? { ...body, hospitalId: scopedHospitalId }
      : body;

    this.logger.log(`Updating physiotherapist: ${id}`);
    const physiotherapist = await this.patientService.updatePhysiotherapist(id, payload);
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
    @Request() req: any,
    @Param('id') id: string,
    @Query('mode') mode?: 'inactive' | 'permanent'
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    if (scopedHospitalId) {
      const staff = await this.patientService.getPhysiotherapists(scopedHospitalId, true);
      if (!staff.some((item: any) => item.id === id)) {
        throw new ForbiddenException('You can only delete physiotherapists in your hospital');
      }
    }

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
  async getAdmissionTrackingOptions(
    @Request() req: any,
    @Query('hospitalId') hospitalId?: string
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    this.logger.log('Getting admission tracking options');
    const data = await this.patientService.getAdmissionTrackingOptions(
      scopedHospitalId || hospitalId
    );
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
    @Request() req: any,
    @Query('hospitalId') hospitalId?: string,
    @Query('childId') childId?: string,
    @Query('physiotherapistId') physiotherapistId?: string,
    @Query('admissionType') admissionType?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const data = await this.patientService.getAdmissionTrackings({
      hospitalId: scopedHospitalId || hospitalId,
      childId,
      physiotherapistId,
      admissionType,
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
  async createAdmissionTracking(
    @Request() req: any,
    @Body() body: CreateAdmissionTrackingDto
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    const payload: CreateAdmissionTrackingDto = scopedHospitalId
      ? { ...body, hospitalId: scopedHospitalId }
      : body;
    this.logger.log(`Creating admission tracking for child: ${body.childId}`);
    const data = await this.patientService.createAdmissionTracking(payload);
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
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateAdmissionTrackingDto
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    if (scopedHospitalId) {
      const records = await this.patientService.getAdmissionTrackings({
        hospitalId: scopedHospitalId,
      });
      if (!records.some((item: any) => item.id === id)) {
        throw new ForbiddenException('You can only update admissions in your hospital');
      }
    }

    const payload: UpdateAdmissionTrackingDto = scopedHospitalId
      ? { ...body, hospitalId: scopedHospitalId }
      : body;

    this.logger.log(`Updating admission tracking: ${id}`);
    const data = await this.patientService.updateAdmissionTracking(id, payload);
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
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    if (scopedHospitalId) {
      const records = await this.patientService.getAdmissionTrackings({
        hospitalId: scopedHospitalId,
      });
      if (!records.some((item: any) => item.id === id)) {
        throw new ForbiddenException('You can only update admissions in your hospital');
      }
    }

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
  async deleteAdmissionTracking(@Request() req: any, @Param('id') id: string) {
    const scopedHospitalId = await this.resolveScopedHospitalId(req);
    if (scopedHospitalId) {
      const records = await this.patientService.getAdmissionTrackings({
        hospitalId: scopedHospitalId,
      });
      if (!records.some((item: any) => item.id === id)) {
        throw new ForbiddenException('You can only delete admissions in your hospital');
      }
    }

    const result = await this.patientService.deleteAdmissionTracking(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
