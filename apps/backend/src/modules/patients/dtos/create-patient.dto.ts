import { IsString, IsEmail, IsPhoneNumber, IsOptional, IsDateString, IsNotEmpty, MinLength } from 'class-validator';
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

  @ApiProperty({ example: '+94701234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

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

  @ApiProperty({ example: 'uuid-hospital-id' })
  @IsString()
  @IsOptional()
  hospitalId?: string;
}
