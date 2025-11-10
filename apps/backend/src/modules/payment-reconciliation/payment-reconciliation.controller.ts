import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { PaymentReconciliationService } from "./payment-reconciliation.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  UserRole,
  ReconciliationStatus,
  ReconciliationType,
} from "@prisma/client";

@Controller("payment-reconciliation")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentReconciliationController {
  constructor(
    private readonly reconciliationService: PaymentReconciliationService
  ) {}

  @Post("import")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async importTrackerPlusData(@Body() data: any, @Request() req: any) {
    return this.reconciliationService.importTrackerPlusData(
      data,
      req.user.userId
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getReconciliationList(
    @Query("status") status?: ReconciliationStatus,
    @Query("type") type?: ReconciliationType,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("minAmount") minAmount?: string,
    @Query("maxAmount") maxAmount?: string,
    @Query("studentId") studentId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.reconciliationService.getReconciliationList({
      status,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      studentId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get("statistics")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStatistics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.reconciliationService.getStatistics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getReconciliationById(@Param("id") id: string) {
    return this.reconciliationService.getReconciliationById(id);
  }

  @Get(":id/suggestions")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSuggestedMatches(@Param("id") id: string) {
    return this.reconciliationService.getSuggestedMatches(id);
  }

  @Patch(":id/match")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async manualMatch(
    @Param("id") id: string,
    @Body() data: any,
    @Request() req: any
  ) {
    return this.reconciliationService.manualMatch(id, data, req.user.userId);
  }

  @Patch(":id/unmatch")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async unmatch(@Param("id") id: string) {
    return this.reconciliationService.unmatch(id);
  }

  @Patch(":id/mark-suspicious")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markSuspicious(
    @Param("id") id: string,
    @Body() data: { reason: string },
    @Request() req: any
  ) {
    return this.reconciliationService.markSuspicious(
      id,
      data.reason,
      req.user.userId
    );
  }

  @Patch(":id/resolve")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async resolve(
    @Param("id") id: string,
    @Body() data: { notes: string },
    @Request() req: any
  ) {
    return this.reconciliationService.resolve(id, data.notes, req.user.userId);
  }

  @Post("bulk-match")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async bulkMatch(@Body() data: any, @Request() req: any) {
    return this.reconciliationService.bulkMatch(data, req.user.userId);
  }
}
