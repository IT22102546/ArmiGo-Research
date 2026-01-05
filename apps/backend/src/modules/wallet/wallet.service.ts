import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { TransactionType, Prisma } from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create wallet for a user
   */
  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          totalCredits: 0,
          totalDebits: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });
    }

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance;
  }

  /**
   * Credit wallet (add funds)
   */
  async credit(
    userId: string,
    amount: number,
    description: string,
    reference?: string,
    referenceType?: string,
    metadata?: any
  ) {
    if (amount <= 0) {
      throw AppException.badRequest(ErrorCode.AMOUNT_MUST_BE_POSITIVE);
    }

    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.frozen) {
      throw AppException.forbidden(
        ErrorCode.WALLET_FROZEN,
        wallet.frozenReason || "No reason provided"
      );
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    // Check max balance if set
    if (wallet.maxBalance && balanceAfter > wallet.maxBalance) {
      throw AppException.badRequest(
        ErrorCode.MAX_BALANCE_EXCEEDED,
        `Transaction would exceed maximum balance of ${wallet.maxBalance}`
      );
    }

    // Use transaction to ensure consistency
    const result = await this.prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: TransactionType.CREDIT,
          balanceBefore,
          balanceAfter,
          description,
          reference,
          referenceType,
          metadata: metadata ?? undefined,
        },
      });

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          totalCredits: { increment: amount },
          lastTopUp: new Date(),
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

      return { transaction, wallet: updatedWallet };
    });

    return result;
  }

  /**
   * Debit wallet (deduct funds)
   */
  async debit(
    userId: string,
    amount: number,
    description: string,
    reference?: string,
    referenceType?: string,
    metadata?: any
  ) {
    if (amount <= 0) {
      throw AppException.badRequest(ErrorCode.AMOUNT_MUST_BE_POSITIVE);
    }

    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.frozen) {
      throw AppException.forbidden(
        ErrorCode.WALLET_FROZEN,
        wallet.frozenReason || "No reason provided"
      );
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    // Check minimum balance
    if (balanceAfter < wallet.minBalance) {
      throw AppException.badRequest(
        ErrorCode.INSUFFICIENT_WALLET_BALANCE,
        `Insufficient balance. Required: ${amount}, Available: ${wallet.balance}`
      );
    }

    // Use transaction to ensure consistency
    const result = await this.prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: TransactionType.DEBIT,
          balanceBefore,
          balanceAfter,
          description,
          reference,
          referenceType,
          metadata: metadata ?? undefined,
        },
      });

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          totalDebits: { increment: amount },
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

      return { transaction, wallet: updatedWallet };
    });

    return result;
  }

  /**
   * Refund to wallet
   */
  async refund(
    userId: string,
    amount: number,
    description: string,
    reference?: string,
    referenceType?: string
  ) {
    if (amount <= 0) {
      throw AppException.badRequest(ErrorCode.AMOUNT_MUST_BE_POSITIVE);
    }

    return this.credit(userId, amount, description, reference, referenceType, {
      type: "REFUND",
    });
  }

  /**
   * Get transaction history with pagination
   */
  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const wallet = await this.getOrCreateWallet(userId);

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        ...t,
        metadata: t.metadata ?? null,
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
   * Freeze wallet (admin only)
   */
  async freezeWallet(userId: string, reason: string, adminId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        frozen: true,
        frozenReason: reason,
        frozenAt: new Date(),
      },
    });
  }

  /**
   * Unfreeze wallet (admin only)
   */
  async unfreezeWallet(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        frozen: false,
        frozenReason: null,
        frozenAt: null,
      },
    });
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance >= amount && !wallet.frozen;
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const [creditTransactions, debitTransactions, refundTransactions] =
      await Promise.all([
        this.prisma.walletTransaction.count({
          where: { walletId: wallet.id, type: TransactionType.CREDIT },
        }),
        this.prisma.walletTransaction.count({
          where: { walletId: wallet.id, type: TransactionType.DEBIT },
        }),
        this.prisma.walletTransaction.count({
          where: { walletId: wallet.id, type: TransactionType.REFUND },
        }),
      ]);

    return {
      balance: wallet.balance,
      totalCredits: wallet.totalCredits,
      totalDebits: wallet.totalDebits,
      netBalance: wallet.totalCredits - wallet.totalDebits,
      frozen: wallet.frozen,
      frozenReason: wallet.frozenReason,
      lastTopUp: wallet.lastTopUp,
      transactions: {
        credits: creditTransactions,
        debits: debitTransactions,
        refunds: refundTransactions,
        total: creditTransactions + debitTransactions + refundTransactions,
      },
    };
  }

  /**
   * Search wallets by user name or phone number
   */
  async searchWallets(searchTerm: string) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            firstName: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: searchTerm,
            },
          },
          {
            email: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
      take: 20,
    });

    const wallets = await Promise.all(
      users.map(async (user) => {
        const wallet = await this.getOrCreateWallet(user.id);
        return {
          ...wallet,
          user,
        };
      })
    );

    return wallets;
  }

  /**
   * Get overall wallet usage analytics (admin)
   */
  async getWalletUsageAnalytics(startDate?: Date, endDate?: Date) {
    const dateFilter: Prisma.WalletTransactionWhereInput = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {dateFilter.createdAt.gte = startDate;}
      if (endDate) {dateFilter.createdAt.lte = endDate;}
    }

    // Get aggregated transaction data
    const [
      totalWallets,
      activeWallets,
      frozenWallets,
      totalCredits,
      totalDebits,
      totalRefunds,
      creditTransactions,
      debitTransactions,
      refundTransactions,
      recentTransactions,
    ] = await Promise.all([
      // Total wallets
      this.prisma.wallet.count(),
      // Active wallets (non-frozen with balance > 0)
      this.prisma.wallet.count({
        where: {
          frozen: false,
          balance: { gt: 0 },
        },
      }),
      // Frozen wallets
      this.prisma.wallet.count({
        where: { frozen: true },
      }),
      // Total credits
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: TransactionType.CREDIT,
          ...dateFilter,
        },
      }),
      // Total debits
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: TransactionType.DEBIT,
          ...dateFilter,
        },
      }),
      // Total refunds
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: TransactionType.REFUND,
          ...dateFilter,
        },
      }),
      // Credit transaction count
      this.prisma.walletTransaction.count({
        where: {
          type: TransactionType.CREDIT,
          ...dateFilter,
        },
      }),
      // Debit transaction count
      this.prisma.walletTransaction.count({
        where: {
          type: TransactionType.DEBIT,
          ...dateFilter,
        },
      }),
      // Refund transaction count
      this.prisma.walletTransaction.count({
        where: {
          type: TransactionType.REFUND,
          ...dateFilter,
        },
      }),
      // Recent transactions
      this.prisma.walletTransaction.findMany({
        where: dateFilter,
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          wallet: {
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
          },
        },
      }),
    ]);

    // Calculate total wallet balance across all users
    const totalBalance = await this.prisma.wallet.aggregate({
      _sum: { balance: true },
    });

    // Get top wallets by balance
    const topWalletsByBalance = await this.prisma.wallet.findMany({
      where: { balance: { gt: 0 } },
      orderBy: { balance: "desc" },
      take: 10,
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

    // Get daily transaction volume for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTransactions = await this.prisma.$queryRaw<
      Array<{ date: Date; credits: number; debits: number; count: number }>
    >`
      SELECT
        DATE(created_at) as date,
        SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) as credits,
        SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END) as debits,
        COUNT(*) as count
      FROM wallet_transactions
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return {
      summary: {
        totalWallets,
        activeWallets,
        frozenWallets,
        totalBalance: totalBalance._sum.balance || 0,
      },
      transactions: {
        totalCredits: totalCredits._sum.amount || 0,
        totalDebits: totalDebits._sum.amount || 0,
        totalRefunds: totalRefunds._sum.amount || 0,
        netFlow:
          (totalCredits._sum.amount || 0) - (totalDebits._sum.amount || 0),
        counts: {
          credits: creditTransactions,
          debits: debitTransactions,
          refunds: refundTransactions,
          total: creditTransactions + debitTransactions + refundTransactions,
        },
      },
      topWallets: topWalletsByBalance.map((w) => ({
        id: w.id,
        userId: w.userId,
        userName: `${w.user.firstName} ${w.user.lastName}`,
        email: w.user.email,
        balance: w.balance,
        totalCredits: w.totalCredits,
        totalDebits: w.totalDebits,
      })),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        userName: `${t.wallet.user.firstName} ${t.wallet.user.lastName}`,
        createdAt: t.createdAt,
      })),
      dailyVolume: dailyTransactions,
    };
  }

  /**
   * Get wallet usage for payment analytics
   * Returns total wallet usage for a specific time period
   */
  async getWalletPaymentUsage(
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const dateFilter: Prisma.WalletTransactionWhereInput = {
      type: TransactionType.DEBIT,
      referenceType: { in: ["PAYMENT", "ENROLLMENT", "CLASS_FEE", "COURSE"] },
    };

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {dateFilter.createdAt.gte = startDate;}
      if (endDate) {dateFilter.createdAt.lte = endDate;}
    }

    const result = await this.prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: dateFilter,
    });

    return result._sum.amount || 0;
  }
}
