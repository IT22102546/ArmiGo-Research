import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Patch,
} from "@nestjs/common";
import { TransferService } from "./transfer.service";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "../../shared";
import {
  CreateMutualTransferDto,
  AcceptTransferDto,
  VerifyTransferDto,
  TransferRequestResponseDto,
  TransferMatchDto,
  TransferStatsDto,
  BrowseTransferFiltersDto,
  TransferRequestStatus,
  CreateTransferMessageDto,
  TransferMessageResponseDto,
} from "./dto/transfer.dto";

@Controller("transfer")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  /**
   * Create new mutual transfer request
   * Only for external teachers looking for swap opportunities
   */
  @Post()
  @Roles(UserRole.EXTERNAL_TEACHER)
  async create(
    @Body() dto: CreateMutualTransferDto,
    @Req() req: any
  ): Promise<TransferRequestResponseDto> {
    return this.transferService.createMutualTransfer(dto, req.user.id);
  }

  /**
   * Get all transfer requests with filters (Admin only)
   * Returns full list of transfers for admin management
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAllTransfers(
    @Query() filters: BrowseTransferFiltersDto
  ): Promise<TransferRequestResponseDto[]> {
    return this.transferService.getAllTransfers(filters);
  }

  /**
   * Browse mutual transfer requests with limited information
   * Shows only verified requests with basic details for matching
   */
  @Get("browse")
  @Roles(UserRole.EXTERNAL_TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async browseRequests(
    @Query() filters: BrowseTransferFiltersDto,
    @Req() req: any
  ) {
    return this.transferService.browseRequests(filters, req.user.id);
  }

  /**
   * Get my mutual transfer requests
   */
  @Get("my-requests")
  @Roles(UserRole.EXTERNAL_TEACHER)
  async getMyRequests(@Req() req: any): Promise<TransferRequestResponseDto[]> {
    return this.transferService.getMyRequests(req.user.id);
  }

  /**
   * Find matching mutual transfer opportunities
   * Returns compatible teachers looking for swaps
   */
  @Get("matches")
  @Roles(UserRole.EXTERNAL_TEACHER)
  async findMatches(@Req() req: any): Promise<TransferMatchDto[]> {
    return this.transferService.findMatches(req.user.id);
  }

  /**
   * Get transfer statistics (Admin only)
   */
  @Get("stats")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getStats(): Promise<TransferStatsDto> {
    return this.transferService.getStats();
  }

  /**
   * Get mutual transfer request by ID
   */
  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @Req() req: any
  ): Promise<TransferRequestResponseDto> {
    return this.transferService.findOne(id, req.user.id, req.user.role);
  }

  /**
   * Cancel mutual transfer request
   */
  @Delete(":id")
  @Roles(UserRole.EXTERNAL_TEACHER)
  async cancel(@Param("id") id: string, @Req() req: any): Promise<void> {
    return this.transferService.cancel(id, req.user.id);
  }

  /**
   * Accept mutual transfer match
   * Both teachers must accept for the swap to proceed
   */
  @Post(":id/accept")
  @Roles(UserRole.EXTERNAL_TEACHER)
  async acceptTransfer(
    @Param("id") id: string,
    @Body() dto: AcceptTransferDto,
    @Req() req: any
  ): Promise<TransferRequestResponseDto> {
    return this.transferService.acceptTransfer(id, dto, req.user.id);
  }

  /**
   * Verify mutual transfer request (Admin only)
   * Admin verifies the legitimacy of the request
   */
  @Post(":id/verify")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async verify(
    @Param("id") id: string,
    @Body() dto: VerifyTransferDto,
    @Req() req: any
  ): Promise<TransferRequestResponseDto> {
    return this.transferService.verify(id, dto, req.user.id);
  }

  /**
   * Mark mutual transfer as completed (Admin only)
   * Called after both teachers have physically swapped positions
   */
  @Post(":id/complete")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async complete(@Param("id") id: string): Promise<TransferRequestResponseDto> {
    return this.transferService.complete(id);
  }

  // ============ NEW ADMIN ENDPOINTS ============

  /**
   * Get all transfer requests with pagination and filters (Admin only)
   */
  @Get("admin/all")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAllAdmin(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
    @Query("status") status?: TransferRequestStatus,
    @Query("fromZoneId") fromZoneId?: string,
    @Query("subjectId") subjectId?: string,
    @Query("mediumId") mediumId?: string,
    @Query("level") level?: string,
    @Query("search") searchTerm?: string
  ) {
    return this.transferService.getAllAdminPaginated({
      page: Number(page),
      limit: Number(limit),
      status,
      fromZoneId,
      subjectId,
      mediumId,
      level,
      searchTerm,
    });
  }

  /**
   * Get detailed transfer request information (Admin only)
   */
  @Get("admin/:id/detail")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getDetailAdmin(@Param("id") id: string) {
    return this.transferService.getDetailAdmin(id);
  }

  /**
   * Verify transfer request (Admin only)
   */
  @Post("admin/:id/verify")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async verifyAdmin(
    @Param("id") id: string,
    @Body() dto: { notes?: string },
    @Req() req: any
  ) {
    return this.transferService.verifyTransferAdmin(id, dto.notes, req.user.id);
  }

  /**
   * Update transfer request status (Admin only)
   */
  @Post("admin/:id/status")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateStatusAdmin(
    @Param("id") id: string,
    @Body() dto: { status: TransferRequestStatus; notes?: string },
    @Req() req: any
  ) {
    return this.transferService.updateStatusAdmin(
      id,
      dto.status,
      dto.notes,
      req.user.id
    );
  }

  // ============ MESSAGING ENDPOINTS ============

  /**
   * Get messages for a transfer request
   * Only parties involved in the transfer can view messages
   */
  @Get(":id/messages")
  @Roles(UserRole.EXTERNAL_TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMessages(
    @Param("id") id: string,
    @Req() req: any
  ): Promise<TransferMessageResponseDto[]> {
    return this.transferService.getMessages(id, req.user.id);
  }

  /**
   * Send a message in transfer negotiation
   * Only parties involved in the transfer can send messages
   */
  @Post("messages")
  @Roles(UserRole.EXTERNAL_TEACHER)
  async sendMessage(
    @Body() dto: CreateTransferMessageDto,
    @Req() req: any
  ): Promise<TransferMessageResponseDto> {
    return this.transferService.sendMessage(
      dto.transferRequestId,
      dto.content,
      req.user.id
    );
  }

  /**
   * Mark a message as read
   */
  @Patch("messages/:messageId/read")
  @Roles(UserRole.EXTERNAL_TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markMessageAsRead(
    @Param("messageId") messageId: string,
    @Req() req: any
  ): Promise<{ success: boolean }> {
    return this.transferService.markMessageAsRead(messageId, req.user.id);
  }

  /**
   * Get unread message count for user's transfer requests
   */
  @Get("messages/unread-count")
  @Roles(UserRole.EXTERNAL_TEACHER)
  async getUnreadMessageCount(@Req() req: any): Promise<{ count: number }> {
    const count = await this.transferService.getUnreadMessageCount(req.user.id);
    return { count };
  }
}
