import { IsString, IsOptional, MaxLength, IsNotEmpty } from "class-validator";

/**
 * DTO for sending interest to a transfer request
 * Teacher B sends interest to Teacher A's request
 */
export class SendInterestDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string; // Optional introduction message (max 500 chars)
}

/**
 * DTO for accepting or rejecting an interest
 */
export class RespondToInterestDto {
  @IsString()
  @IsNotEmpty()
  acceptanceId!: string; // ID of the TransferAcceptance record

  @IsString()
  @IsNotEmpty()
  action!: 'accept' | 'reject'; // Accept or reject the interest

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string; // Optional response message
}

/**
 * DTO for pausing/unpausing a transfer request
 */
export class PauseTransferDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string; // Optional reason for pausing
}

/**
 * DTO for editing a transfer request
 */
export class UpdateTransferRequestDto {
  @IsString({ each: true })
  @IsOptional()
  toZones?: string[]; // Update desired zones

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string; // Update notes/additional requirements

  @IsString({ each: true })
  @IsOptional()
  preferredSchoolTypes?: string[]; // Update preferred school types

  @IsString()
  @IsOptional()
  additionalRequirements?: string; // Update additional requirements
}
