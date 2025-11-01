import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, Min } from 'class-validator';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Payment amount',
    example: 99.99,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    description: 'User ID making the payment',
    example: 'user_123',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Class ID for enrollment payment',
    example: 'class_123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({
    description: 'Payment description',
    example: 'Class enrollment fee',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Payment gateway token',
    example: 'tok_1234567890',
  })
  @IsString()
  gatewayToken: string;

  @ApiProperty({
    description: 'Billing address',
    example: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'US',
    },
    required: false,
  })
  @IsOptional()
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Refund amount (leave empty for full refund)',
    example: 50.00,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiProperty({
    description: 'Reason for refund',
    example: 'Student requested cancellation',
  })
  @IsString()
  reason: string;
}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Payment ID',
    example: 'payment_123',
  })
  id: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 99.99,
  })
  amount: number;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  method: PaymentMethod;

  @ApiProperty({
    description: 'Gateway transaction ID',
    example: 'txn_1234567890',
  })
  gatewayTransactionId: string;

  @ApiProperty({
    description: 'Payment creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 'user_123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  })
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class PaymentIntentDto {
  @ApiProperty({
    description: 'Client secret for payment intent',
    example: 'pi_1234567890_secret_abc123',
  })
  clientSecret: string;

  @ApiProperty({
    description: 'Payment intent ID',
    example: 'pi_1234567890',
  })
  paymentIntentId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 99.99,
  })
  amount: number;
}