import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsUUID,
  MinLength,
  MaxLength,
} from "class-validator";

export enum TransferRequestStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  PAUSED = "PAUSED",
  MATCHED = "MATCHED",
  ACCEPTED = "ACCEPTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
}

/**
 * DTO for creating a mutual transfer request
 * Teacher provides their current location and desired zones for swap
 */
export class CreateMutualTransferDto {
  @IsString()
  @IsNotEmpty()
  registrationId!: string;

  @IsString()
  @IsNotEmpty()
  currentSchool!: string;

  @IsString()
  @IsOptional()
  @IsEnum(["1AB", "1C", "Type 2", "Type 3"])
  currentSchoolType?: string;

  @IsString()
  @IsNotEmpty()
  currentDistrict!: string;

  @IsString()
  @IsNotEmpty()
  currentZone!: string;

  @IsString()
  @IsNotEmpty()
  fromZone!: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  toZones!: string[]; // Desired zones for swap

  @IsOptional()
  @IsUUID()
  subjectId?: string; // FK to Subject - preferred

  @IsString()
  @IsNotEmpty()
  subject!: string; // DEPRECATED: use subjectId

  @IsOptional()
  @IsUUID()
  mediumId?: string; // FK to Medium - preferred

  @IsString()
  @IsNotEmpty()
  @IsEnum(["Sinhala", "Tamil", "English"])
  medium!: string; // DEPRECATED: use mediumId

  @IsString()
  @IsNotEmpty()
  @IsEnum(["A/L", "O/L"])
  level!: string;

  // Enhanced fields for Sri Lankan school system
  @IsOptional()
  @IsBoolean()
  isInternalTeacher?: boolean;

  @IsOptional()
  yearsOfService?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  qualifications?: string[]; // e.g., ["B.Ed", "PGDE", "M.Ed"]

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredSchoolTypes?: string[]; // e.g., ["1AB", "1C"]

  @IsString()
  @IsOptional()
  additionalRequirements?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}

/**
 * DTO for accepting a mutual transfer match
 */
export class AcceptTransferDto {
  @IsString()
  @IsOptional()
  notes?: string; // Optional notes when accepting
}

/**
 * DTO for admin verification of transfer request
 */
export class VerifyTransferDto {
  @IsBoolean()
  verified!: boolean;

  @IsString()
  @IsOptional()
  verificationNotes?: string;
}

// ============================================
// Response DTOs
// ============================================

/**
 * Full transfer request response
 */
export class TransferRequestResponseDto {
  id!: string;
  uniqueId!: string;
  requesterId!: string;
  requester!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  fromZone!: string;
  toZones!: string[];
  subject!: string;
  medium!: string;
  level!: string;

  // Enhanced fields
  currentSchool?: string;
  currentSchoolType?: string;
  currentDistrict?: string;
  yearsOfService?: number;
  qualifications?: string[];
  isInternalTeacher?: boolean;
  preferredSchoolTypes?: string[];
  additionalRequirements?: string;

  receiverId?: string;
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  status!: TransferRequestStatus;
  verified!: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  notes?: string;
  acceptanceNotes?: string;
  attachments!: string[];
  createdAt!: Date;
  updatedAt!: Date;
  completedAt?: Date;
}

/**
 * Match DTO showing compatible mutual transfer opportunities
 * Includes match score based on zone, subject, level, medium compatibility
 */
export class TransferMatchDto {
  id!: string;
  uniqueId!: string;
  requester!: {
    id: string;
    firstName: string;
    lastName: string;
  };
  fromZone!: string;
  toZones!: string[];
  subject!: string;
  medium!: string;
  level!: string;

  // Enhanced fields
  currentSchool?: string | null;
  currentSchoolType?: string | null;
  yearsOfService?: number | null;
  qualifications?: string[] | null;
  isInternalTeacher?: boolean | null;

  matchScore!: number; // 0-100 score based on compatibility
  verified!: boolean;
  createdAt!: Date;
}

/**
 * Statistics DTO for admin dashboard
 */
export class TransferStatsDto {
  totalRequests!: number;
  pendingRequests!: number;
  verifiedRequests!: number;
  matchedRequests!: number;
  completedRequests!: number;
  cancelledRequests!: number;
  averageMatchTime!: number; // Days
  byZone!: {
    zone: string;
    requests: number;
    completed: number;
  }[];
  bySubject!: {
    subject: string;
    requests: number;
    completed: number;
  }[];
}

// ============================================
// Progressive Information Disclosure DTOs
// ============================================

/**
 * Limited information DTO - shown during browsing
 * Privacy-first: Only basic, non-identifying information
 */
export class TransferRequestLimitedDto {
  id!: string;
  uniqueId!: string;
  fromZone!: string;
  toZones!: string[];
  subject!: string;
  medium!: string;
  level!: string;
  verified!: boolean;
  createdAt!: Date;

  // Enhanced fields (non-sensitive)
  currentSchoolType?: string;
  yearsOfService?: number;
  isInternalTeacher?: boolean;
  preferredSchoolTypes?: string[];

  // Minimal requester info (only first name and subject)
  requester!: {
    firstName: string;
    subject: string;
    level: string;
  };
}

/**
 * Full information DTO - shown after match acceptance
 * Contains all details including contact information
 */
export class TransferRequestFullDto extends TransferRequestLimitedDto {
  notes?: string;
  acceptanceNotes?: string;
  attachments!: string[];
  status!: TransferRequestStatus;
  completedAt?: Date;

  // Enhanced fields
  currentSchool?: string;
  currentDistrict?: string;
  qualifications?: string[];
  additionalRequirements?: string;

  // Full requester information
  requester!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    subject: string;
    level: string;
  };

  // Receiver information (if matched)
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    subject: string;
    level: string;
  };
}

/**
 * Browse/Search filters DTO
 */
export class BrowseTransferFiltersDto {
  @IsOptional()
  @IsString()
  fromZone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toZones?: string[];

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  medium?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  status?: string;

  // Enhanced filters
  @IsOptional()
  @IsString()
  currentDistrict?: string;

  @IsOptional()
  @IsString()
  currentSchoolType?: string; // 1AB, 1C, Type 2, Type 3

  @IsOptional()
  @IsBoolean()
  isInternalTeacher?: boolean;

  @IsOptional()
  minYearsOfService?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSchoolTypes?: string[];
}

// ============================================
// Messaging DTOs
// ============================================

/**
 * DTO for creating a message in transfer negotiation
 */
export class CreateTransferMessageDto {
  @IsUUID()
  @IsNotEmpty()
  transferRequestId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

/**
 * Transfer message response DTO
 */
export class TransferMessageResponseDto {
  id!: string;
  transferRequestId!: string;
  senderId!: string;
  sender!: {
    id: string;
    firstName: string;
    lastName: string;
  };
  content!: string;
  read!: boolean;
  createdAt!: Date;
}
