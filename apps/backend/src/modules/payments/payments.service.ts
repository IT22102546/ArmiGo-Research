import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { ConfigService } from "@nestjs/config";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";
import {
  CreatePaymentDto,
  ProcessPaymentDto,
  RefundPaymentDto,
  PaymentResponseDto,
  PaymentIntentDto,
} from "./dto";
import { Payment, PaymentStatus, PaymentMethod } from "@prisma/client";

// Mock Payment Gateway Interface (replace with actual gateway like Stripe)
interface PaymentGatewayResult {
  transactionId: string;
  status: "success" | "failed" | "pending";
  gatewayResponse: any;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  async createPaymentIntent(
    createPaymentDto: CreatePaymentDto
  ): Promise<PaymentIntentDto> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createPaymentDto.userId },
    });

    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND);
    }

    // Validate class exists if classId provided
    if (createPaymentDto.classId) {
      const classExists = await this.prisma.class.findUnique({
        where: { id: createPaymentDto.classId },
      });

      if (!classExists) {
        throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND);
      }

      // Check if user is already enrolled
      const existingEnrollment = await this.prisma.enrollment.findFirst({
        where: {
          classId: createPaymentDto.classId,
          studentId: createPaymentDto.userId,
          status: { in: ["ACTIVE", "PENDING"] },
        },
      });

      if (existingEnrollment) {
        throw AppException.badRequest(ErrorCode.ALREADY_ENROLLED_CLASS);
      }
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        amount: createPaymentDto.amount,
        method: createPaymentDto.method,
        status: PaymentStatus.PENDING,
        userId: createPaymentDto.userId,
        description:
          createPaymentDto.description ||
          `Payment for ${createPaymentDto.classId ? "class enrollment" : "service"}`,
        metadata: JSON.stringify({
          createdAt: new Date(),
          userAgent: "web-app",
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
    processPaymentDto: ProcessPaymentDto
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
      throw AppException.notFound(ErrorCode.PAYMENT_NOT_FOUND);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw AppException.badRequest(ErrorCode.PAYMENT_NOT_PENDING);
    }

    try {
      // Mock payment processing (replace with actual gateway)
      const gatewayResult = await this.processWithGateway(
        payment,
        processPaymentDto
      );

      // Update payment status based on gateway result
      const status =
        gatewayResult.status === "success"
          ? PaymentStatus.COMPLETED
          : PaymentStatus.FAILED;

      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          gatewayTransactionId: gatewayResult.transactionId,
          gatewayResponse: JSON.stringify(gatewayResult.gatewayResponse),
          processedAt: new Date(),
          metadata: {
            ...(typeof payment.metadata === "string"
              ? JSON.parse(payment.metadata || "{}")
              : payment.metadata || {}),
            processedAt: new Date(),
            billingAddress: processPaymentDto.billingAddress,
          },
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
      const metadata =
        typeof payment.metadata === "string"
          ? JSON.parse(payment.metadata || "{}")
          : (payment.metadata as any) || {};
      if (status === PaymentStatus.COMPLETED && metadata.classId) {
        await this.prisma.enrollment.create({
          data: {
            classId: metadata.classId,
            studentId: payment.userId,
            status: "ACTIVE",
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
          gatewayResponse: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
          processedAt: new Date(),
        },
      });

      throw AppException.badRequest(
        ErrorCode.PAYMENT_FAILED,
        `Payment processing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async refundPayment(
    paymentId: string,
    refundPaymentDto: RefundPaymentDto
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
      throw AppException.notFound(ErrorCode.PAYMENT_NOT_FOUND);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw AppException.badRequest(ErrorCode.PAYMENT_NOT_COMPLETED);
    }

    const refundAmount = refundPaymentDto.amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "Refund amount cannot exceed payment amount"
      );
    }

    try {
      // Mock refund processing (replace with actual gateway)
      const refundResult = await this.processRefundWithGateway(
        payment,
        refundAmount,
        refundPaymentDto.reason
      );

      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          refundAmount,
          refundReason: refundPaymentDto.reason,
          refundedAt: new Date(),
          gatewayResponse: JSON.stringify({
            ...JSON.parse(payment.gatewayResponse || "{}"),
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
      const metadata =
        typeof payment.metadata === "string"
          ? JSON.parse(payment.metadata || "{}")
          : (payment.metadata as any) || {};
      if (metadata.classId) {
        await this.prisma.enrollment.updateMany({
          where: {
            classId: metadata.classId,
            studentId: payment.userId,
            paymentId: payment.id,
          },
          data: {
            status: "CANCELLED",
          },
        });
      }

      return this.mapToResponseDto(updatedPayment);
    } catch (error) {
      throw AppException.badRequest(
        ErrorCode.PAYMENT_FAILED,
        `Refund processing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findUserPayments(
    userId: string,
    page: number = 1,
    limit: number = 10
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    return {
      data: payments.map((payment) => this.mapToResponseDto(payment)),
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
      throw AppException.notFound(ErrorCode.PAYMENT_NOT_FOUND);
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
    processPaymentDto: ProcessPaymentDto
  ): Promise<PaymentGatewayResult> {
    // Mock payment gateway processing
    // In real implementation, integrate with Stripe, PayPal, etc.

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock success/failure based on token (for testing)
    const success = !processPaymentDto.gatewayToken.includes("fail");

    return {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: success ? "success" : "failed",
      gatewayResponse: {
        gatewayToken: processPaymentDto.gatewayToken,
        amount: payment.amount,
        currency: "USD",
        processedAt: new Date().toISOString(),
        mockResult: success
          ? "Payment processed successfully"
          : "Payment failed - insufficient funds",
      },
    };
  }

  private async processRefundWithGateway(
    payment: Payment,
    refundAmount: number,
    reason: string
  ): Promise<any> {
    // Mock refund processing
    await new Promise((resolve) => setTimeout(resolve, 500));

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
      gatewayTransactionId: payment.gatewayTransactionId || "",
      createdAt: payment.createdAt,
      user: payment.user,
    };
  }

  // Admin Management Methods
  async getAllPaymentsAdmin(filters: {
    status?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
    userType?: string;
    referenceType?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {
      // Note: deletedAt removed from Payment model - payments are immutable
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.method) {
      where.method = filters.method;
    }

    if (filters.referenceType) {
      where.referenceType = filters.referenceType;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    if (filters.userType) {
      where.user = {
        userType: filters.userType,
      };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    };
  }

  async approveBankSlip(
    paymentId: string,
    verifierId: string,
    note?: string
  ): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw AppException.notFound(ErrorCode.PAYMENT_NOT_FOUND);
    }

    if (payment.method !== PaymentMethod.BANK_SLIP) {
      throw AppException.badRequest(ErrorCode.BANK_SLIP_REQUIRED);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw AppException.badRequest(ErrorCode.PAYMENT_NOT_PENDING);
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.COMPLETED,
        bankSlipVerifiedBy: verifierId,
        bankSlipVerifiedAt: new Date(),
        processedAt: new Date(),
        description: note
          ? `${payment.description || ""}\nAdmin Note: ${note}`.trim()
          : payment.description,
      },
      include: {
        user: true,
      },
    });
  }

  async rejectBankSlip(
    paymentId: string,
    verifierId: string,
    reason: string
  ): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw AppException.notFound(ErrorCode.PAYMENT_NOT_FOUND);
    }

    if (payment.method !== PaymentMethod.BANK_SLIP) {
      throw AppException.badRequest(ErrorCode.BANK_SLIP_REQUIRED);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw AppException.badRequest(ErrorCode.PAYMENT_NOT_PENDING);
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        bankSlipVerifiedBy: verifierId,
        bankSlipVerifiedAt: new Date(),
        bankSlipRejectionReason: reason,
      },
      include: {
        user: true,
      },
    });
  }

  async syncTrackerPlus(paymentId: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw AppException.notFound(ErrorCode.PAYMENT_NOT_FOUND);
    }

    if (payment.method !== PaymentMethod.TRACKER_PLUS) {
      throw AppException.badRequest(ErrorCode.TRACKER_PLUS_REQUIRED);
    }

    if (!payment.gatewayTransactionId) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "Payment does not have a gateway transaction ID"
      );
    }

    // Sync with Tracker Plus API (using mock until production integration)
    const syncResult = await this.mockTrackerPlusSync(
      payment.gatewayTransactionId
    );

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: syncResult.status as PaymentStatus,
        gatewayResponse: syncResult.response,
        processedAt: syncResult.status === "COMPLETED" ? new Date() : null,
      },
      include: {
        user: true,
      },
    });
  }

  private async mockTrackerPlusSync(transactionId: string): Promise<{
    status: string;
    response: any;
  }> {
    // Mock implementation - replace with actual Tracker Plus API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      status: "COMPLETED",
      response: {
        transactionId,
        syncedAt: new Date().toISOString(),
        gatewayStatus: "success",
      },
    };
  }

  async bulkApproveBankSlips(
    paymentIds: string[],
    verifierId: string
  ): Promise<{ approved: number; failed: string[] }> {
    const failed: string[] = [];
    let approved = 0;

    for (const paymentId of paymentIds) {
      try {
        await this.approveBankSlip(paymentId, verifierId);
        approved++;
      } catch (error) {
        failed.push(paymentId);
      }
    }

    return { approved, failed };
  }

  async markPaymentSuspicious(
    paymentId: string,
    adminId: string,
    reason: string
  ): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw AppException.notFound(ErrorCode.PAYMENT_NOT_FOUND);
    }

    // Store suspicious flag in metadata
    const metadata = payment.metadata
      ? typeof payment.metadata === "string"
        ? JSON.parse(payment.metadata)
        : payment.metadata
      : {};

    metadata.suspicious = true;
    metadata.suspiciousReason = reason;
    metadata.markedSuspiciousBy = adminId;
    metadata.markedSuspiciousAt = new Date().toISOString();

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        metadata: JSON.stringify(metadata),
        description: payment.description
          ? `${payment.description}\n[SUSPICIOUS: ${reason}]`
          : `[SUSPICIOUS: ${reason}]`,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find payment by gateway transaction ID (e.g., Stripe payment intent ID)
   * Used by webhook handlers to locate payment records
   */
  async findByGatewayTransactionId(
    gatewayTransactionId: string
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        gatewayTransactionId: gatewayTransactionId,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Update payment status from webhook event
   * Used by Stripe/payment gateway webhooks to update payment status
   */
  async updatePaymentStatusFromWebhook(
    paymentId: string,
    status: PaymentStatus,
    webhookData: {
      stripePaymentIntentId?: string;
      amount?: number;
      currency?: string;
      paymentMethod?: any;
      receiptEmail?: string | null;
      failureReason?: string;
      cancellationReason?: string | null;
      chargeId?: string;
      refundAmount?: number;
      refundedAt?: string;
      metadata?: any;
      disputed?: boolean;
      disputeId?: string;
      disputeAmount?: number;
      disputeReason?: string;
      disputeStatus?: string;
      disputeCreatedAt?: string;
    }
  ): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw AppException.notFound(
        ErrorCode.PAYMENT_NOT_FOUND,
        `Payment with ID ${paymentId} not found`
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Update metadata with webhook information
    const existingMetadata = payment.metadata
      ? typeof payment.metadata === "string"
        ? JSON.parse(payment.metadata)
        : payment.metadata
      : {};

    const updatedMetadata = {
      ...existingMetadata,
      webhookUpdate: {
        timestamp: new Date().toISOString(),
        status,
        ...webhookData,
      },
    };

    updateData.metadata = JSON.stringify(updatedMetadata);

    // Store Stripe payment intent ID if provided
    if (webhookData.stripePaymentIntentId && !payment.gatewayTransactionId) {
      updateData.gatewayTransactionId = webhookData.stripePaymentIntentId;
    }

    // Update amount if provided (convert from cents if needed)
    if (webhookData.amount && webhookData.amount !== payment.amount) {
      updateData.amount = webhookData.amount;
    }

    // Add failure reason if payment failed
    if (status === PaymentStatus.FAILED && webhookData.failureReason) {
      updateData.description = payment.description
        ? `${payment.description}\nFailure: ${webhookData.failureReason}`
        : `Payment failed: ${webhookData.failureReason}`;
    }

    // Update refund information if refunded
    if (status === PaymentStatus.REFUNDED && webhookData.refundAmount) {
      updateData.description = payment.description
        ? `${payment.description}\nRefunded: $${webhookData.refundAmount} on ${webhookData.refundedAt}`
        : `Refunded: $${webhookData.refundAmount}`;
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        user: true,
      },
    });
  }

  /**
   * Record a new subscription from Stripe webhook
   */
  async recordSubscription(data: {
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    items: Array<{ priceId: string; quantity: number | null }>;
  }) {
    this.logger.log(`Recording subscription: ${data.stripeSubscriptionId}`);

    // Find user by looking at payments with this Stripe customer ID in metadata
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        gatewayTransactionId: { contains: data.stripeCustomerId },
      },
      select: { userId: true },
    });

    const userId = existingPayment?.userId;
    if (!userId) {
      this.logger.warn(
        `No user found for Stripe customer: ${data.stripeCustomerId}`
      );
      return;
    }

    // Create a subscription record as a payment entry
    await this.prisma.payment.create({
      data: {
        userId,
        amount: 0, // Amount will be handled by invoice webhooks
        currency: "USD",
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.CREDIT_CARD,
        gatewayTransactionId: data.stripeSubscriptionId,
        description: `Subscription created: ${data.stripeSubscriptionId}`,
        referenceType: "SUBSCRIPTION",
        metadata: {
          type: "subscription",
          stripeSubscriptionId: data.stripeSubscriptionId,
          stripeCustomerId: data.stripeCustomerId,
          status: data.status,
          currentPeriodStart: data.currentPeriodStart.toISOString(),
          currentPeriodEnd: data.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          items: data.items,
        },
      },
    });
  }

  /**
   * Update subscription status from Stripe webhook
   */
  async updateSubscriptionStatus(
    stripeSubscriptionId: string,
    data: {
      status: string;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
      canceledAt?: Date;
    }
  ) {
    this.logger.log(`Updating subscription status: ${stripeSubscriptionId}`);

    // Find subscription payment record
    const subscription = await this.prisma.payment.findFirst({
      where: {
        gatewayTransactionId: stripeSubscriptionId,
        referenceType: "SUBSCRIPTION",
      },
    });

    if (subscription) {
      const existingMetadata =
        (subscription.metadata as Record<string, any>) || {};

      await this.prisma.payment.update({
        where: { id: subscription.id },
        data: {
          status:
            data.status === "canceled"
              ? PaymentStatus.CANCELLED
              : PaymentStatus.COMPLETED,
          metadata: {
            ...existingMetadata,
            status: data.status,
            currentPeriodStart: data.currentPeriodStart.toISOString(),
            currentPeriodEnd: data.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
            canceledAt: data.canceledAt?.toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }
  }

  /**
   * Cancel a subscription from Stripe webhook
   */
  async cancelSubscription(stripeSubscriptionId: string) {
    this.logger.log(`Cancelling subscription: ${stripeSubscriptionId}`);

    const subscription = await this.prisma.payment.findFirst({
      where: {
        gatewayTransactionId: stripeSubscriptionId,
        referenceType: "SUBSCRIPTION",
      },
    });

    if (subscription) {
      const existingMetadata =
        (subscription.metadata as Record<string, any>) || {};

      await this.prisma.payment.update({
        where: { id: subscription.id },
        data: {
          status: PaymentStatus.CANCELLED,
          metadata: {
            ...existingMetadata,
            status: "canceled",
            canceledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }
  }

  /**
   * Get user ID by Stripe customer ID
   */
  async getUserIdByStripeCustomerId(
    stripeCustomerId: string
  ): Promise<string | null> {
    // Look for a payment with this customer ID in metadata
    const payments = await this.prisma.payment.findMany({
      where: {
        method: PaymentMethod.CREDIT_CARD,
      },
      select: { userId: true, metadata: true },
    });

    for (const payment of payments) {
      const metadata = payment.metadata as Record<string, any>;
      if (metadata?.stripeCustomerId === stripeCustomerId) {
        return payment.userId;
      }
    }

    return null;
  }

  /**
   * Record invoice payment from Stripe webhook
   */
  async recordInvoicePayment(data: {
    stripeInvoiceId: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    amountPaid?: number;
    amountDue?: number;
    currency: string;
    status: "paid" | "failed";
    paidAt?: Date;
    attemptCount?: number;
    nextPaymentAttempt?: Date;
    periodStart?: Date;
    periodEnd?: Date;
    hostedInvoiceUrl?: string | null;
    invoicePdf?: string | null;
  }) {
    this.logger.log(
      `Recording invoice payment: ${data.stripeInvoiceId} - Status: ${data.status}`
    );

    if (!data.stripeCustomerId) {return;}

    // Find user ID by customer ID
    const userId = await this.getUserIdByStripeCustomerId(
      data.stripeCustomerId
    );
    if (!userId) {
      this.logger.warn(
        `No user found for Stripe customer: ${data.stripeCustomerId}`
      );
      return;
    }

    // Check if we already have this invoice
    const existingPayment = await this.prisma.payment.findFirst({
      where: { gatewayTransactionId: data.stripeInvoiceId },
    });

    if (existingPayment) {
      // Update existing payment
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status:
            data.status === "paid"
              ? PaymentStatus.COMPLETED
              : PaymentStatus.FAILED,
          amount: data.amountPaid || data.amountDue || 0,
          processedAt: data.paidAt,
        },
      });
    } else {
      // Create a payment record for the invoice
      await this.prisma.payment.create({
        data: {
          userId,
          amount: data.amountPaid || data.amountDue || 0,
          currency: data.currency.toUpperCase(),
          status:
            data.status === "paid"
              ? PaymentStatus.COMPLETED
              : PaymentStatus.FAILED,
          method: PaymentMethod.CREDIT_CARD,
          gatewayTransactionId: data.stripeInvoiceId,
          description: `Subscription invoice ${data.stripeInvoiceId}`,
          referenceType: "INVOICE",
          processedAt: data.paidAt,
          metadata: {
            type: "invoice",
            stripeInvoiceId: data.stripeInvoiceId,
            stripeSubscriptionId: data.stripeSubscriptionId,
            stripeCustomerId: data.stripeCustomerId,
            periodStart: data.periodStart?.toISOString(),
            periodEnd: data.periodEnd?.toISOString(),
            hostedInvoiceUrl: data.hostedInvoiceUrl,
            invoicePdf: data.invoicePdf,
            attemptCount: data.attemptCount,
            nextPaymentAttempt: data.nextPaymentAttempt?.toISOString(),
          },
        },
      });
    }
  }
}
