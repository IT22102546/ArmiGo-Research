import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsEnum,
  MinLength,
  IsUUID,
  IsDateString,
  IsBoolean,
} from "class-validator";
import { UserRole, UserStatus } from "@prisma/client";

export class CreateUserDto {
  @ApiProperty({ example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: "john.doe@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "0771234567" })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PARENT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: "123 Main Street" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: "Colombo" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "district-uuid" })
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiPropertyOptional({ example: "zone-uuid" })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({ example: "2010-01-01" })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  parentProfile?: {
    occupation?: string;
    preferredContact?: string;
  };
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "John" })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: "Doe" })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: "john.doe@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "0771234567" })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ example: "123 Main Street" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: "Colombo" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "district-uuid" })
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiPropertyOptional({ example: "zone-uuid" })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({ example: "2010-01-01" })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  districtId?: string;

  @ApiPropertyOptional()
  zoneId?: string;

  @ApiPropertyOptional()
  dateOfBirth?: Date;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  phoneVerified: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  district?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional()
  zone?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional()
  parentProfile?: {
    id: string;
    occupation?: string;
    preferredContact?: string;
    children?: any[];
  };

  @ApiPropertyOptional()
  hospitalProfile?: {
    id: string;
    hospitalId: string;
    hospital?: {
      id: string;
      name: string;
    };
  };

  @ApiPropertyOptional({ type: [Object] })
  children?: any[];
}