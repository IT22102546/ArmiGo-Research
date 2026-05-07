// src/modules/auth/dto/login.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, IsOptional, IsArray } from "class-validator";

export class LoginDto {
  @ApiProperty({ 
    description: "Phone number or email", 
    example: "0771234567 or user@example.com" 
  })
  @IsString()
  identifier: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: "Optional: restrict login to specific roles",
    example: ["SUPER_ADMIN", "HOSPITAL_ADMIN"],
    required: false
  })
  @IsOptional()
  @IsArray()
  allowedRoles?: string[];
}