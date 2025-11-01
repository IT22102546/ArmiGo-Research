import {
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateBankSlipPaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  referenceType?: string; // CLASS, EXAM, PUBLICATION

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsString()
  bankSlipUrl: string; // S3 URL of uploaded bank slip
}

export class VerifyBankSlipDto {
  @IsEnum(["APPROVE", "REJECT"])
  action: "APPROVE" | "REJECT";

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class CreateWalletPaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  referenceType?: string; // CLASS, EXAM, PUBLICATION

  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class CreateTemporaryAccessDto {
  @IsString()
  userId: string;

  @Type(() => Date)
  expiresAt: Date;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(["ALL", "EXAMS_ONLY", "CLASSES_ONLY"])
  accessType?: string;
}

export class PaymentHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsEnum([
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "REFUNDED",
    "CANCELLED",
  ])
  status?: string;

  @IsOptional()
  @IsEnum([
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "BANK_SLIP",
    "DIGITAL_WALLET",
    "TRACKER_PLUS",
    "WALLET_CREDITS",
  ])
  method?: string;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
