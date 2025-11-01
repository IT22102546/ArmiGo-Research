import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: "User email address",
    example: "john.doe@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "User password (minimum 8 characters)",
    example: "SecurePassword123!",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: "User first name",
    example: "John",
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: "User last name",
    example: "Doe",
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: "User role",
    enum: UserRole,
    example: UserRole.INTERNAL_STUDENT,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: "User phone number",
    example: "+1234567890",
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description: "User first name",
    example: "John",
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: "User last name",
    example: "Doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: "User phone number",
    example: "+1234567890",
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: "User unique identifier",
    example: "uuid-string",
  })
  id: string;

  @ApiProperty({
    description: "User email address",
    example: "john.doe@example.com",
  })
  email: string;

  @ApiProperty({
    description: "User first name",
    example: "John",
  })
  firstName: string;

  @ApiProperty({
    description: "User last name",
    example: "Doe",
  })
  lastName: string;

  @ApiProperty({
    description: "User role",
    enum: UserRole,
    example: UserRole.INTERNAL_STUDENT,
  })
  role: UserRole;

  @ApiProperty({
    description: "User phone number",
    example: "+1234567890",
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: "User avatar URL",
    example: "https://s3.amazonaws.com/bucket/avatars/user-id.jpg",
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    description: "Email verification status",
    example: true,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: "Account creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last profile update timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}