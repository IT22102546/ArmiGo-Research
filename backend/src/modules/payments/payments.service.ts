import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  CreatePaymentDto,
  ProcessPaymentDto,
  RefundPaymentDto,
  PaymentResponseDto,
  PaymentIntentDto,
} from './dto';
import { Payment, PaymentStatus, PaymentMethod } from '@prisma/client';

// Mock Payment Gateway Interface (replace with actual gateway like Stripe)
interface PaymentGatewayResult {
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  gatewayResponse: any;
}

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createPaymentIntent(createPaymentDto: CreatePaymentDto): Promise<PaymentIntentDto> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createPaymentDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate class exists if classId provided
    if (createPaymentDto.classId) {
      const classExists = await this.prisma.class.findUnique({
        where: { id: createPaymentDto.classId },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found');
      }

      // Check if user is already enrolled
      const existingEnrollment = await this.prisma.enrollment.findFirst({
        where: {
          classId: createPaymentDto.classId,
          studentId: createPaymentDto.userId,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      });

      if (existingEnrollment) {
        throw new ConflictException('User is already enrolled in this class');
      }
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        amount: createPaymentDto.amount,
        method: createPaymentDto.method,
        status: PaymentStatus.PENDING,
        userId: createPaymentDto.userId,
        description: createPaymentDto.description || `Payment for ${createPaymentDto.classId ? 'class enrollment' : 'service'}`,
        metadata: JSON.stringify({
          createdAt: new Date(),
          userAgent: 'web-app',
          classId: createPaymentDto.classId, // Store in metadata for reference
        }),
      },
    });

    // Mock payment intent creation (replace with actual gateway)
    const paymentIntentId = `pi_${payment.id}_${Date.now()}`;
    const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substring(7)}`;

    // Update payment with gateway transaction ID
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayTransactionId: paymentIntentId,
      },
    });

    return {
      clientSecret,
      paymentIntentId,
      amount: payment.amount,
    };
  }

  async processPayment(
    paymentId: string,
    processPaymentDto: ProcessPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not in pending status');
    }

    try {
      // Mock payment processing (replace with actual gateway)
      const gatewayResult = await this.processWithGateway(
        payment,
        processPaymentDto,
      );

      // Update payment status based on gateway result
      const status = gatewayResult.status === 'success' 
        ? PaymentStatus.COMPLETED 
        : PaymentStatus.FAILED;

      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          gatewayTransactionId: gatewayResult.transactionId,
          gatewayResponse: JSON.stringify(gatewayResult.gatewayResponse),
          processedAt: new Date(),
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            processedAt: new Date(),
            billingAddress: processPaymentDto.billingAddress,
          }),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // If payment successful and for class enrollment, create enrollment
      const metadata = JSON.parse(payment.metadata || '{}');
      if (status === PaymentStatus.COMPLETED && metadata.classId) {
        await this.prisma.enrollment.create({
          data: {
            classId: metadata.classId,
            studentId: payment.userId,
            status: 'ACTIVE',
            isPaid: true,
            paymentId: payment.id,
          },
        });
      }

      return this.mapToResponseDto(updatedPayment);
    } catch (error) {
      // Mark payment as failed
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
          processedAt: new Date(),
        },
      });

      throw new BadRequestException(`Payment processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refundPayment(
    paymentId: string,
    refundPaymentDto: RefundPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment is not in completed status');
    }

    const refundAmount = refundPaymentDto.amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    try {
      // Mock refund processing (replace with actual gateway)
      const refundResult = await this.processRefundWithGateway(
        payment,
        refundAmount,
        refundPaymentDto.reason,
      );

      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          refundAmount,
          refundReason: refundPaymentDto.reason,
          refundedAt: new Date(),
          gatewayResponse: JSON.stringify({
            ...JSON.parse(payment.gatewayResponse || '{}'),
            refund: refundResult,
          }),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // If payment was for class enrollment, cancel enrollment
      const metadata = JSON.parse(payment.metadata || '{}');
      if (metadata.classId) {
        await this.prisma.enrollment.updateMany({
          where: {
            classId: metadata.classId,
            studentId: payment.userId,
            paymentId: payment.id,
          },
          data: {
            status: 'CANCELLED',
          },
        });
      }

      return this.mapToResponseDto(updatedPayment);
    } catch (error) {
      throw new BadRequestException(`Refund processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findUserPayments(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: PaymentResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    return {
      data: payments.map(payment => this.mapToResponseDto(payment)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findPaymentById(id: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.mapToResponseDto(payment);
  }

  async getPaymentStats(userId?: string): Promise<{
    totalRevenue: number;
    totalPayments: number;
    completedPayments: number;
    refundedPayments: number;
    pendingPayments: number;
  }> {
    const whereClause = userId ? { userId } : {};

    const [
      totalRevenue,
      totalPayments,
      completedPayments,
      refundedPayments,
      pendingPayments,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { ...whereClause, status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({ where: whereClause }),
      this.prisma.payment.count({
        where: { ...whereClause, status: PaymentStatus.COMPLETED },
      }),
      this.prisma.payment.count({
        where: { ...whereClause, status: PaymentStatus.REFUNDED },
      }),
      this.prisma.payment.count({
        where: { ...whereClause, status: PaymentStatus.PENDING },
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalPayments,
      completedPayments,
      refundedPayments,
      pendingPayments,
    };
  }

  private async processWithGateway(
    payment: Payment,
    processPaymentDto: ProcessPaymentDto,
  ): Promise<PaymentGatewayResult> {
    // Mock payment gateway processing
    // In real implementation, integrate with Stripe, PayPal, etc.
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock success/failure based on token (for testing)
    const success = !processPaymentDto.gatewayToken.includes('fail');

    return {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: success ? 'success' : 'failed',
      gatewayResponse: {
        gatewayToken: processPaymentDto.gatewayToken,
        amount: payment.amount,
        currency: 'USD',
        processedAt: new Date().toISOString(),
        mockResult: success ? 'Payment processed successfully' : 'Payment failed - insufficient funds',
      },
    };
  }

  private async processRefundWithGateway(
    payment: Payment,
    refundAmount: number,
    reason: string,
  ): Promise<any> {
    // Mock refund processing
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      refundId: `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      amount: refundAmount,
      reason,
      processedAt: new Date().toISOString(),
    };
  }

  private mapToResponseDto(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      method: payment.method,
      gatewayTransactionId: payment.gatewayTransactionId || '',
      createdAt: payment.createdAt,
      user: payment.user,
    };
  }
}