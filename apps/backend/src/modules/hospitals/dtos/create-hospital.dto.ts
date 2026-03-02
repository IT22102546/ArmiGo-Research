import { IsString, IsEmail, IsPhoneNumber, IsOptional, IsNotEmpty, IsEnum, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum HospitalTypeEnum {
  GOVERNMENT = 'GOVERNMENT',
  PRIVATE = 'PRIVATE',
  SPECIALIZED_CHILDREN = 'SPECIALIZED_CHILDREN',
  REHABILITATION_CENTER = 'REHABILITATION_CENTER',
  CLINIC = 'CLINIC',
}

export class CreateHospitalDto {
  @ApiProperty({ example: 'Peradenaiya Sirimawa Bandaranayake Child Hospital' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'HOS-2024-001' })
  @IsString()
  @IsNotEmpty()
  registrationNo: string;

  @ApiProperty({ enum: HospitalTypeEnum })
  @IsEnum(HospitalTypeEnum)
  @IsNotEmpty()
  type: HospitalTypeEnum;

  @ApiProperty({ example: false, required: false, description: 'Mark as the single main hospital in the system' })
  @IsBoolean()
  @IsOptional()
  isMainHospital?: boolean;

  @ApiProperty({ example: 'contact@hospital.lk' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+94701234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '+94701234568', required: false })
  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @ApiProperty({ example: 'www.hospital.lk', required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: 'No. 123, Main Road' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Kandy' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'uuid-district-id' })
  @IsString()
  @IsNotEmpty()
  districtId: string;

  @ApiProperty({ example: 'uuid-zone-id', required: false })
  @IsString()
  @IsOptional()
  zoneId?: string;

  @ApiProperty({ example: '20001', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 2010, required: false })
  @IsInt()
  @IsOptional()
  establishedYear?: number;

  @ApiProperty({ example: 'LIC-2024-001', required: false })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiProperty({ example: 100, required: false })
  @IsInt()
  @IsOptional()
  bedCapacity?: number;

  @ApiProperty({ example: ['Pediatric', 'Rehabilitation'], required: false })
  @IsOptional()
  specialization?: string[];

  @ApiProperty({ example: 50, required: false })
  @IsInt()
  @IsOptional()
  totalDoctors?: number;

  @ApiProperty({ example: 30, required: false })
  @IsInt()
  @IsOptional()
  totalTherapists?: number;

  @ApiProperty({ example: 100, required: false })
  @IsInt()
  @IsOptional()
  totalStaff?: number;

  @ApiProperty({ example: 'adminpass@123', description: 'Password for hospital admin account' })
  @IsString()
  @IsNotEmpty()
  adminPassword: string;
}

export class UpdateHospitalDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, description: 'Mark as the single main hospital in the system' })
  @IsBoolean()
  @IsOptional()
  isMainHospital?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  districtId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  zoneId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  bedCapacity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  specialization?: string[];

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  totalDoctors?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  totalTherapists?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  totalStaff?: number;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'], required: false })
  @IsOptional()
  status?: string;
}
