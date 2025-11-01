import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { TransactionType, Prisma } from "@prisma/client";

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
      throw new BadRequestException("Amount must be greater than zero");
    }

    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.frozen) {
      throw new ForbiddenException(
        `Wallet is frozen: ${wallet.frozenReason || "No reason provided"}`
      );
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    // Check max balance if set
    if (wallet.maxBalance && balanceAfter > wallet.maxBalance) {
      throw new BadRequestException(
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
          metadata: metadata ? JSON.stringify(metadata) : null,
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
      throw new BadRequestException("Amount must be greater than zero");
    }

    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.frozen) {
      throw new ForbiddenException(
        `Wallet is frozen: ${wallet.frozenReason || "No reason provided"}`
      );
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    // Check minimum balance
    if (balanceAfter < wallet.minBalance) {
      throw new BadRequestException(
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
          metadata: metadata ? JSON.stringify(metadata) : null,
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
      throw new BadRequestException("Amount must be greater than zero");
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
        metadata: t.metadata ? JSON.parse(t.metadata) : null,
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
}
