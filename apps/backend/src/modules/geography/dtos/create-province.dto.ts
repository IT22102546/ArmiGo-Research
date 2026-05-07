import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProvinceDto {
  @ApiProperty({ example: 'Western Province' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'WP', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
