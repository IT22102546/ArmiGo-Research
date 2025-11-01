import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
import {
  CreateBankSlipPaymentDto,
  VerifyBankSlipDto,
  CreateWalletPaymentDto,
  CreateTemporaryAccessDto,
  PaymentHistoryQueryDto,
} from "./dto/enhanced-payment.dto";

@Injectable()
export class EnhancedPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService
  ) {}

  /**
   * Create payment with bank slip
   */
  async createBankSlipPayment(userId: string, dto: CreateBankSlipPaymentDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Create payment with bank slip
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        method: PaymentMethod.BANK_SLIP,
        status: PaymentStatus.PENDING,
        description: dto.description,
        bankSlipUrl: dto.bankSlipUrl,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        metadata: JSON.stringify({
          uploadedAt: new Date(),
          awaitingVerification: true,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return payment;
  }

  /**
   * Admin verifies bank slip (approve or reject)
   */
  async verifyBankSlip(
    paymentId: string,
    adminId: string,
    dto: VerifyBankSlipDto
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    if (payment.method !== PaymentMethod.BANK_SLIP) {
      throw new BadRequestException("Payment is not a bank slip payment");
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException("Payment has already been processed");
    }

    if (dto.action === "APPROVE") {
      // Approve payment
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          bankSlipVerifiedBy: adminId,
          bankSlipVerifiedAt: new Date(),
          processedAt: new Date(),
        },
        include: { user: true },
      });

      // Credit user's wallet if this was a top-up
      if (!payment.referenceType || payment.referenceType === "WALLET_TOPUP") {
        await this.walletService.credit(
          payment.userId,
          payment.amount,
          `Bank slip payment approved - ${payment.description}`,
          payment.id,
          "PAYMENT",
          { adminId, paymentId: payment.id }
        );
      }

      // Handle enrollment or other reference types
      await this.handlePaymentSuccess(updatedPayment);

      return updatedPayment;
    } else {
      // Reject payment
      return this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          bankSlipVerifiedBy: adminId,
          bankSlipVerifiedAt: new Date(),
          bankSlipRejectionReason: dto.rejectionReason,
          processedAt: new Date(),
        },
        include: { user: true },
      });
    }
  }

  /**
   * Create payment using wallet credits
   */
  async createWalletPayment(userId: string, dto: CreateWalletPaymentDto) {
    // Check if user has sufficient balance
    const hasSufficient = await this.walletService.hasSufficientBalance(
      userId,
      dto.amount
    );

    if (!hasSufficient) {
      throw new BadRequestException("Insufficient wallet balance");
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Debit wallet
      const walletResult = await this.walletService.debit(
        userId,
        dto.amount,
        dto.description,
        dto.referenceId,
        dto.referenceType
      );

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          userId,
          amount: dto.amount,
          method: PaymentMethod.WALLET_CREDITS,
          status: PaymentStatus.COMPLETED,
          description: dto.description,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          walletTransactionId: walletResult.transaction.id,
          processedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Handle enrollment or other reference types
      await this.handlePaymentSuccess(payment);

      return { payment, wallet: walletResult.wallet };
    });
  }

  /**
   * Get payment history with advanced filtering
   */
  async getPaymentHistory(userId: string, query: PaymentHistoryQueryDto) {
    const { page = 1, limit = 20, status, method, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (method) {
      where.method = method;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          enrollments: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  grade: true,
                  subject: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments: payments.map((p) => ({
        ...p,
        metadata: p.metadata ? JSON.parse(p.metadata) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all pending bank slips (admin only)
   */
  async getPendingBankSlips(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          method: PaymentMethod.BANK_SLIP,
          status: PaymentStatus.PENDING,
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.payment.count({
        where: {
          method: PaymentMethod.BANK_SLIP,
          status: PaymentStatus.PENDING,
        },
      }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create temporary access for a user
   */
  async createTemporaryAccess(adminId: string, dto: CreateTemporaryAccessDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if user already has active temporary access
    const existing = await this.prisma.temporaryAccess.findFirst({
      where: {
        userId: dto.userId,
        active: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      throw new BadRequestException("User already has active temporary access");
    }

    // Create temporary access
    return this.prisma.temporaryAccess.create({
      data: {
        userId: dto.userId,
        grantedBy: adminId,
        expiresAt: dto.expiresAt,
        reason: dto.reason,
        accessType: dto.accessType || "ALL",
        active: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        grantor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Revoke temporary access
   */
  async revokeTemporaryAccess(accessId: string, adminId: string) {
    const access = await this.prisma.temporaryAccess.findUnique({
      where: { id: accessId },
    });

    if (!access) {
      throw new NotFoundException("Temporary access not found");
    }

    return this.prisma.temporaryAccess.update({
      where: { id: accessId },
      data: {
        active: false,
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Get user's temporary access status
   */
  async getUserTemporaryAccess(userId: string) {
    return this.prisma.temporaryAccess.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        grantor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Check if user has active access (considering temporary access)
   */
  async hasActiveAccess(userId: string): Promise<boolean> {
    // Check if user has paid or has active temporary access
    const [paidEnrollments, temporaryAccess] = await Promise.all([
      this.prisma.enrollment.count({
        where: {
          studentId: userId,
          isPaid: true,
          status: "ACTIVE",
        },
      }),
      this.prisma.temporaryAccess.count({
        where: {
          userId,
          active: true,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    return paidEnrollments > 0 || temporaryAccess > 0;
  }

  /**
   * Handle payment success actions (enrollment, publication access, etc.)
   */
  private async handlePaymentSuccess(payment: any) {
    if (payment.referenceType === "CLASS" && payment.referenceId) {
      // Create or update enrollment
      const existingEnrollment = await this.prisma.enrollment.findFirst({
        where: {
          classId: payment.referenceId,
          studentId: payment.userId,
        },
      });

      if (existingEnrollment) {
        await this.prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            isPaid: true,
            status: "ACTIVE",
            paymentId: payment.id,
          },
        });
      } else {
        await this.prisma.enrollment.create({
          data: {
            classId: payment.referenceId,
            studentId: payment.userId,
            isPaid: true,
            status: "ACTIVE",
            paymentId: payment.id,
          },
        });
      }
    } else if (payment.referenceType === "PUBLICATION" && payment.referenceId) {
      // Create publication purchase record
      await this.prisma.publicationPurchase.create({
        data: {
          publicationId: payment.referenceId,
          userId: payment.userId,
          amount: payment.amount,
          paymentId: payment.id,
        },
      });
    }
  }
}
