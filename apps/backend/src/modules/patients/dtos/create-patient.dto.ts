import { IsString, IsEmail, IsOptional, IsDateString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({ example: 'Lihini' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Perera' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'lihini@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+94701234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Kandy Silva',
    description: 'Parent full name',
  })
  @IsString()
  @IsNotEmpty()
  parentName: string;

  @ApiProperty({
    example: 'kandy.silva@example.com',
    description: 'Parent email',
  })
  @IsEmail()
  @IsNotEmpty()
  parentEmail: string;

  @ApiProperty({
    example: '+94701234568',
    description: 'Parent mobile number',
  })
  @IsString()
  @IsNotEmpty()
  parentPhone: string;

  @ApiProperty({
    example: 'Parent@1234',
    description: 'Parent account password',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  parentPassword?: string;

  @ApiProperty({ example: '2016-03-15' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: 'O+' })
  @IsString()
  @IsOptional()
  bloodType?: string;

  @ApiProperty({ example: 'General Ward' })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiProperty({ example: 'Left Hemiplegia' })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiProperty({ example: 'Dr. Fernando' })
  @IsString()
  @IsOptional()
  assignedDoctor?: string;

  @ApiProperty({ example: 'Medical relevant notes', required: false })
  @IsString()
  @IsOptional()
  medicalHistory?: string;

  @ApiProperty({ example: 'Kandy Silva' })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiProperty({ example: '+94701234568' })
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  // Hospital & Location Selection
  @ApiProperty({ 
    example: 'uuid-district-id', 
    description: 'District ID for geographical grouping' 
  })
  @IsString()
  @IsOptional()
  districtId?: string;

  @ApiProperty({ 
    example: 'uuid-zone-id', 
    description: 'Zone ID within district' 
  })
  @IsString()
  @IsOptional()
  zoneId?: string;

  @ApiProperty({
    example: 'No. 42, Main Street',
    description: 'Child home address',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ 
    example: 'uuid-hospital-id', 
    description: 'Main hospital ID - required for patient assignment' 
  })
  @IsString()
  @IsNotEmpty()
  hospitalId: string;

  @ApiProperty({ 
    example: 'uuid-subhospital-id', 
    required: false,
    description: 'SubHospital/Clinic ID if applicable' 
  })
  @IsString()
  @IsOptional()
  subHospitalId?: string;

  // Exercise type selections
  @ApiProperty({ example: true, required: false, description: 'Whether child does finger exercises' })
  @IsOptional()
  exerciseFingers?: boolean;

  @ApiProperty({ example: false, required: false, description: 'Whether child does wrist exercises' })
  @IsOptional()
  exerciseWrist?: boolean;

  @ApiProperty({ example: false, required: false, description: 'Whether child does elbow exercises' })
  @IsOptional()
  exerciseElbow?: boolean;

  @ApiProperty({ example: false, required: false, description: 'Whether child does shoulder exercises' })
  @IsOptional()
  exerciseShoulder?: boolean;
}
