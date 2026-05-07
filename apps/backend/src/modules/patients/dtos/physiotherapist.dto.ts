import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePhysiotherapistDto {
  @ApiProperty({ example: 'Anusha Wickramasinghe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'anusha@hospital.lk' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '0771234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^07[0-24-8]\d{7}$/, { message: 'Invalid mobile number. Must be 10 digits starting with 070/071/072/074/075/076/077/078' })
  phone: string;

  @ApiProperty({ example: 'cm123hospitalid' })
  @IsString()
  @IsNotEmpty()
  hospitalId: string;

  @ApiPropertyOptional({ example: 'Pediatric Physiotherapy' })
  @IsOptional()
  @IsString()
  specialization?: string;
}

export class UpdatePhysiotherapistDto {
  @ApiPropertyOptional({ example: 'Anusha Wickramasinghe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'anusha@hospital.lk' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '0771234567' })
  @IsOptional()
  @Matches(/^07[0-24-8]\d{7}$/, { message: 'Invalid mobile number. Must be 10 digits starting with 070/071/072/074/075/076/077/078' })
  phone?: string;

  @ApiPropertyOptional({ example: 'cm123hospitalid' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: 'Pediatric Physiotherapy' })
  @IsOptional()
  @IsString()
  specialization?: string;
}
