import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";
import {
  CreditWalletDto,
  DebitWalletDto,
  RefundWalletDto,
  FreezeWalletDto,
  TransactionHistoryDto,
} from "./dto/wallet.dto";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";

@Controller("wallet")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * Get current user's wallet
   */
  @Get()
  async getMyWallet(@Request() req: { user: { id: string } }) {
    return this.walletService.getOrCreateWallet(req.user.id);
  }

  /**
   * Get wallet balance
   */
  @Get("balance")
  async getBalance(@Request() req: { user: { id: string } }) {
    const balance = await this.walletService.getBalance(req.user.id);
    return { balance };
  }

  /**
   * Get wallet statistics
   */
  @Get("stats")
  async getStats(@Request() req: { user: { id: string } }) {
    return this.walletService.getWalletStats(req.user.id);
  }

  /**
   * Get transaction history
   */
  @Get("transactions")
  async getTransactionHistory(
    @Request() req: { user: { id: string } },
    @Query() query: TransactionHistoryDto
  ) {
    return this.walletService.getTransactionHistory(
      req.user.id,
      query.page,
      query.limit
    );
  }

  /**
   * Credit wallet (Admin only - for manual top-ups)
   */
  @Post("credit")
  @Roles(UserRole.ADMIN)
  async creditWallet(
    @Body() dto: CreditWalletDto,
    @Request() req: { user: { id: string } }
  ) {
    // Admin can credit any wallet, but needs userId in the dto
    // For now, using the admin's own wallet as an example
    return this.walletService.credit(
      req.user.id,
      dto.amount,
      dto.description,
      dto.reference,
      dto.referenceType
    );
  }

  /**
   * Admin: Credit another user's wallet
   */
  @Post("admin/credit/:userId")
  @Roles(UserRole.ADMIN)
  async creditUserWallet(
    @Param("userId") userId: string,
    @Body() dto: CreditWalletDto,
    @Request() req: { user: { id: string } }
  ) {
    return this.walletService.credit(
      userId,
      dto.amount,
      dto.description,
      dto.reference,
      dto.referenceType,
      { adminId: req.user.id }
    );
  }

  /**
   * Debit wallet (Internal use - called by payment system)
   * Users cannot directly debit their wallet
   */
  @Post("debit")
  @Roles(UserRole.ADMIN)
  async debitWallet(
    @Body() dto: DebitWalletDto,
    @Request() req: { user: { id: string } }
  ) {
    return this.walletService.debit(
      req.user.id,
      dto.amount,
      dto.description,
      dto.reference,
      dto.referenceType
    );
  }

  /**
   * Refund to wallet (Admin only)
   */
  @Post("refund")
  @Roles(UserRole.ADMIN)
  async refundWallet(
    @Body() dto: RefundWalletDto,
    @Request() req: { user: { id: string } }
  ) {
    return this.walletService.refund(
      req.user.id,
      dto.amount,
      dto.description,
      dto.reference,
      dto.referenceType
    );
  }

  /**
   * Admin: Refund to another user's wallet
   */
  @Post("admin/refund/:userId")
  @Roles(UserRole.ADMIN)
  async refundUserWallet(
    @Param("userId") userId: string,
    @Body() dto: RefundWalletDto,
    @Request() req: { user: { id: string } }
  ) {
    return this.walletService.refund(
      userId,
      dto.amount,
      dto.description,
      dto.reference,
      dto.referenceType
    );
  }

  /**
   * Admin: Freeze a wallet
   */
  @Post("admin/freeze/:userId")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async freezeWallet(
    @Param("userId") userId: string,
    @Body() dto: FreezeWalletDto,
    @Request() req: { user: { id: string } }
  ) {
    return this.walletService.freezeWallet(userId, dto.reason, req.user.id);
  }

  /**
   * Admin: Unfreeze a wallet
   */
  @Post("admin/unfreeze/:userId")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async unfreezeWallet(@Param("userId") userId: string) {
    return this.walletService.unfreezeWallet(userId);
  }

  /**
   * Admin: Get any user's wallet
   */
  @Get("admin/:userId")
  @Roles(UserRole.ADMIN)
  async getUserWallet(@Param("userId") userId: string) {
    return this.walletService.getOrCreateWallet(userId);
  }

  /**
   * Admin: Get any user's transaction history
   */
  @Get("admin/:userId/transactions")
  @Roles(UserRole.ADMIN)
  async getUserTransactionHistory(
    @Param("userId") userId: string,
    @Query() query: TransactionHistoryDto
  ) {
    return this.walletService.getTransactionHistory(
      userId,
      query.page,
      query.limit
    );
  }

  /**
   * Admin: Get any user's wallet stats
   */
  @Get("admin/:userId/stats")
  @Roles(UserRole.ADMIN)
  async getUserWalletStats(@Param("userId") userId: string) {
    return this.walletService.getWalletStats(userId);
  }

  /**
   * Admin: Get wallet usage analytics
   */
  @Get("admin/analytics")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getWalletAnalytics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.walletService.getWalletUsageAnalytics(start, end);
  }

  /**
   * Admin: Search wallets by user name or phone
   */
  @Get("admin/search")
  @Roles(UserRole.ADMIN)
  async searchWallets(@Query("searchTerm") searchTerm: string) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw AppException.badRequest(
        ErrorCode.INVALID_INPUT,
        "Search term must be at least 2 characters"
      );
    }
    return this.walletService.searchWallets(searchTerm);
  }

  /**
   * Admin: Adjust wallet balance (credit or debit)
   */
  @Post("admin/:userId/adjust")
  @Roles(UserRole.ADMIN)
  async adjustBalance(
    @Param("userId") userId: string,
    @Body()
    dto: {
      amount: number;
      type: "CREDIT" | "DEBIT";
      reason: string;
      metadata?: Record<string, unknown>;
    },
    @Request() req: { user: { id: string } }
  ) {
    if (dto.type === "CREDIT") {
      return this.walletService.credit(
        userId,
        dto.amount,
        dto.reason,
        undefined,
        "ADMIN_ADJUSTMENT",
        { adminId: req.user.id, metadata: dto.metadata }
      );
    } else {
      return this.walletService.debit(
        userId,
        dto.amount,
        dto.reason,
        undefined,
        "ADMIN_ADJUSTMENT"
      );
    }
  }
}
