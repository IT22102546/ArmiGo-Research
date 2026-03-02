import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from "class-validator";
import { UserRole, UserStatus } from "@prisma/client";

export class CreateUserDto {
  @ApiProperty({ example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName: string;

  @ApiProperty({ example: "john.doe@example.com", required: false })
  @IsEmail()
  @IsOptional()
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
  dateOfBirth?: string;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  parentProfile?: {
    occupation?: string;
    preferredContact?: string;
  };
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

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
  dateOfBirth?: string;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty()
  avatar?: string;

  @ApiProperty()
  address?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  districtId?: string;

  @ApiProperty()
  zoneId?: string;

  @ApiProperty()
  dateOfBirth?: Date;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  phoneVerified: boolean;

  @ApiProperty()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: Object, nullable: true })
  parentProfile?: any;

  @ApiProperty({ type: Object, nullable: true })
  hospitalProfile?: any;

  @ApiProperty({ type: Object, nullable: true })
  district?: any;

  @ApiProperty({ type: Object, nullable: true })
  zone?: any;

  @ApiProperty({ type: Array, nullable: true })
  children?: any[];
}