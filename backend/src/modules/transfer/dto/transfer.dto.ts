import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from "class-validator";

export enum TransferRequestStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export class CreateTransferRequestDto {
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @IsString()
  @IsNotEmpty()
  currentSchool: string;

  @IsString()
  @IsNotEmpty()
  currentDistrict: string;

  @IsString()
  @IsNotEmpty()
  currentZone: string;

  @IsString()
  @IsNotEmpty()
  fromZone: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  toZones: string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(["Sinhala", "Tamil", "English"])
  medium: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(["A/L", "O/L"])
  level: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}

export class UpdateTransferRequestDto {
  @IsString()
  @IsOptional()
  registrationId?: string;

  @IsString()
  @IsOptional()
  currentSchool?: string;

  @IsString()
  @IsOptional()
  currentDistrict?: string;

  @IsString()
  @IsOptional()
  currentZone?: string;

  @IsString()
  @IsOptional()
  fromZone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  toZones?: string[];

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  medium?: string;

  @IsString()
  @IsOptional()
  level?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}

export class QueryTransferRequestDto {
  @IsOptional()
  @IsString()
  status?: TransferRequestStatus;

  @IsOptional()
  @IsString()
  fromZone?: string;

  @IsOptional()
  @IsString()
  toZone?: string;

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
  verified?: boolean;

  @IsOptional()
  @IsString()
  requesterId?: string;

  @IsOptional()
  @IsString()
  receiverId?: string;
}

export class AcceptTransferDto {
  @IsString()
  @IsNotEmpty()
  transferRequestId: string;
}

export class RejectTransferDto {
  @IsString()
  @IsNotEmpty()
  transferRequestId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class VerifyTransferDto {
  @IsString()
  @IsNotEmpty()
  transferRequestId: string;

  @IsBoolean()
  verified: boolean;

  @IsString()
  @IsOptional()
  verificationNotes?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  transferRequestId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}

export class MarkMessageReadDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;
}

// Response DTOs
export class TransferMessageResponseDto {
  id: string;
  transferRequestId: string;
  senderId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  content: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

export class TransferRequestResponseDto {
  id: string;
  uniqueId: string;
  requesterId: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  registrationId: string;
  currentSchool: string;
  currentDistrict: string;
  currentZone: string;
  fromZone: string;
  toZones: string[];
  subject: string;
  medium: string;
  level: string;
  receiverId?: string;
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  status: TransferRequestStatus;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  requesterVisible: boolean;
  receiverVisible: boolean;
  notes?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  messages?: TransferMessageResponseDto[];
}

export class TransferMatchDto {
  id: string;
  uniqueId: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    registrationId: string;
    currentZone: string;
  };
  fromZone: string;
  toZones: string[];
  subject: string;
  medium: string;
  level: string;
  matchScore: number; // Percentage match
  verified: boolean;
  createdAt: Date;
}

export class TransferStatsDto {
  totalRequests: number;
  pendingRequests: number;
  verifiedRequests: number;
  acceptedRequests: number;
  completedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  averageMatchTime: number; // Days
  byZone: {
    zone: string;
    requests: number;
    completed: number;
  }[];
  bySubject: {
    subject: string;
    requests: number;
    completed: number;
  }[];
}
