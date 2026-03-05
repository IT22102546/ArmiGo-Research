import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePhysiotherapistDto {
  @ApiProperty({ example: 'Anusha Wickramasinghe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'anusha@hospital.lk' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+94771234567' })
  @IsString()
  @IsNotEmpty()
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

  @ApiPropertyOptional({ example: '+94771234567' })
  @IsOptional()
  @IsString()
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
