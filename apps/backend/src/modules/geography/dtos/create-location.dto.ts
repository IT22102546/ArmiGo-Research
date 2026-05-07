import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDistrictDto {
  @ApiProperty({ example: 'Colombo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CO', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'uuid-province-id', required: false })
  @IsString()
  @IsOptional()
  provinceId?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class CreateZoneDto {
  @ApiProperty({ example: 'Colombo Central' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CC', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'uuid-district-id' })
  @IsString()
  @IsNotEmpty()
  districtId: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
