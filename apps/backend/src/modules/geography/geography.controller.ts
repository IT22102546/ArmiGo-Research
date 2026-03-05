import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GeographyService } from './geography.service';
import { CreateProvinceDto } from './dtos/create-province.dto';
import { CreateDistrictDto, CreateZoneDto } from './dtos/create-location.dto';

@ApiTags('Geography')
@Controller('geography')
@ApiBearerAuth()
export class GeographyController {
  private readonly logger = new Logger(GeographyController.name);

  constructor(private readonly geographyService: GeographyService) {}

  // ============ PROVINCES ============

  @Post('provinces')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new province' })
  async createProvince(@Body() createProvinceDto: CreateProvinceDto) {
    this.logger.log(`Creating province: ${createProvinceDto.name}`);
    return await this.geographyService.createProvince(createProvinceDto);
  }

  @Get('provinces')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all provinces with districts and zones' })
  async getAllProvinces() {
    this.logger.log('Fetching all provinces');
    return await this.geographyService.getAllProvinces();
  }

  @Get('provinces/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get province by ID' })
  async getProvinceById(@Param('id') id: string) {
    this.logger.log(`Fetching province: ${id}`);
    return await this.geographyService.getProvinceById(id);
  }

  @Put('provinces/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update province' })
  async updateProvince(
    @Param('id') id: string,
    @Body() updateProvinceDto: Partial<CreateProvinceDto>
  ) {
    this.logger.log(`Updating province: ${id}`);
    return await this.geographyService.updateProvince(id, updateProvinceDto);
  }

  @Delete('provinces/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete province' })
  async deleteProvince(@Param('id') id: string) {
    this.logger.log(`Deleting province: ${id}`);
    return await this.geographyService.deleteProvince(id);
  }

  // ============ DISTRICTS ============

  @Post('districts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new district' })
  async createDistrict(@Body() createDistrictDto: CreateDistrictDto) {
    this.logger.log(`Creating district: ${createDistrictDto.name}`);
    return await this.geographyService.createDistrict(createDistrictDto);
  }

  @Get('districts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all districts' })
  async getAllDistricts() {
    this.logger.log('Fetching all districts');
    return await this.geographyService.getAllDistricts();
  }

  @Get('provinces/:provinceId/districts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get districts by province' })
  async getDistrictsByProvince(@Param('provinceId') provinceId: string) {
    this.logger.log(`Fetching districts for province: ${provinceId}`);
    return await this.geographyService.getDistrictsByProvince(provinceId);
  }

  @Put('districts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update district' })
  async updateDistrict(
    @Param('id') id: string,
    @Body() updateDistrictDto: Partial<CreateDistrictDto>
  ) {
    this.logger.log(`Updating district: ${id}`);
    return await this.geographyService.updateDistrict(id, updateDistrictDto);
  }

  // ============ ZONES ============

  @Post('zones')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new zone' })
  async createZone(@Body() createZoneDto: CreateZoneDto) {
    this.logger.log(`Creating zone: ${createZoneDto.name}`);
    return await this.geographyService.createZone(createZoneDto);
  }

  @Get('zones')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all zones' })
  async getAllZones() {
    this.logger.log('Fetching all zones');
    return await this.geographyService.getAllZones();
  }

  @Get('districts/:districtId/zones')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get zones by district' })
  async getZonesByDistrict(@Param('districtId') districtId: string) {
    this.logger.log(`Fetching zones for district: ${districtId}`);
    return await this.geographyService.getZonesByDistrict(districtId);
  }

  @Put('zones/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update zone' })
  async updateZone(
    @Param('id') id: string,
    @Body() updateZoneDto: Partial<CreateZoneDto>
  ) {
    this.logger.log(`Updating zone: ${id}`);
    return await this.geographyService.updateZone(id, updateZoneDto);
  }

  @Delete('zones/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete zone' })
  async deleteZone(@Param('id') id: string) {
    this.logger.log(`Deleting zone: ${id}`);
    return await this.geographyService.deleteZone(id);
  }
}
