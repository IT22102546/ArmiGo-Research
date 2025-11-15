import {
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

export class CreditWalletDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;
}

export class DebitWalletDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;
}

export class RefundWalletDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  description!: string;

  @IsString()
  reference!: string;

  @IsString()
  referenceType!: string;
}

export class FreezeWalletDto {
  @IsString()
  reason!: string;
}

export class TransactionHistoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
