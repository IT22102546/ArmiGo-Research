import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { TransferService } from "./transfer.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../common";
import {
  CreateTransferRequestDto,
  UpdateTransferRequestDto,
  QueryTransferRequestDto,
  AcceptTransferDto,
  RejectTransferDto,
  VerifyTransferDto,
  SendMessageDto,
  MarkMessageReadDto,
  TransferRequestResponseDto,
  TransferMessageResponseDto,
  TransferMatchDto,
  TransferStatsDto,
} from "./dto/transfer.dto";

@Controller("transfer")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  /**
   * Create new transfer request
   */
  @Post()
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async create(
    @Body() dto: CreateTransferRequestDto,
    @Req() req: any
  ): Promise<TransferRequestResponseDto> {
    return this.transferService.create(dto, req.user.id);
  }

  /**
   * Get all transfer requests with filters
   */
  @Get()
  async findAll(
    @Query() query: QueryTransferRequestDto,
    @Req() req: any
  ): Promise<TransferRequestResponseDto[]> {
    return this.transferService.findAll(query, req.user.id, req.user.role);
  }

  /**
   * Get my transfer requests
   */
  @Get("my-requests")
  async getMyRequests(@Req() req: any): Promise<TransferRequestResponseDto[]> {
    const query: QueryTransferRequestDto = {
      requesterId: req.user.id,
    };
    return this.transferService.findAll(query, req.user.id, req.user.role);
  }

  /**
   * Get transfer requests where I'm the receiver
   */
  @Get("received")
  async getReceivedRequests(
    @Req() req: any
  ): Promise<TransferRequestResponseDto[]> {
    const query: QueryTransferRequestDto = {
      receiverId: req.user.id,
    };
    return this.transferService.findAll(query, req.user.id, req.user.role);
  }

  /**
   * Find matching transfer requests
   */
  @Get("matches")
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async findMatches(@Req() req: any): Promise<TransferMatchDto[]> {
    return this.transferService.findMatches(req.user.id);
  }

  /**
   * Get transfer statistics (Admin only)
   */
  @Get("stats")
  @Roles(UserRole.ADMIN)
  async getStats(): Promise<TransferStatsDto> {
    return this.transferService.getStats();
  }

  /**
   * Get transfer request by ID
   */
  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @Req() req: any
  ): Promise<TransferRequestResponseDto> {
    return this.transferService.findOne(id, req.user.id, req.user.role);
  }

  /**
   * Update transfer request
   */
  @Put(":id")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateTransferRequestDto,
    @Req() req: any
  ): Promise<TransferRequestResponseDto> {
    return this.transferService.update(id, dto, req.user.id, req.user.role);
  }

  /**
   * Cancel transfer request
   */
  @Delete(":id")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  async cancel(@Param("id") id: string, @Req() req: any): Promise<void> {
    return this.transferService.cancel(id, req.user.id, req.user.role);
  }

  /**
   * Accept transfer match
   */
  @Post("accept")
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async acceptTransfer(
    @Body() dto: AcceptTransferDto,
    @Req() req: any
  ): Promise<TransferRequestResponseDto> {
    return this.transferService.acceptTransfer(dto, req.user.id);
  }

  /**
   * Reject transfer match
   */
  @Post("reject")
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async rejectTransfer(
    @Body() dto: RejectTransferDto,
    @Req() req: any
  ): Promise<void> {
    return this.transferService.rejectTransfer(dto, req.user.id);
  }

  /**
   * Verify transfer request (Admin only)
   */
  @Post("verify")
  @Roles(UserRole.ADMIN)
  async verify(
    @Body() dto: VerifyTransferDto,
    @Req() req: any
  ): Promise<TransferRequestResponseDto> {
    return this.transferService.verify(dto, req.user.id);
  }

  /**
   * Mark transfer as completed (Admin only)
   */
  @Post(":id/complete")
  @Roles(UserRole.ADMIN)
  async complete(@Param("id") id: string): Promise<TransferRequestResponseDto> {
    return this.transferService.complete(id);
  }

  /**
   * Send message in transfer request
   */
  @Post("messages")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Req() req: any
  ): Promise<TransferMessageResponseDto> {
    return this.transferService.sendMessage(dto, req.user.id);
  }

  /**
   * Get messages for a transfer request
   */
  @Get(":id/messages")
  async getMessages(
    @Param("id") id: string,
    @Req() req: any
  ): Promise<TransferMessageResponseDto[]> {
    return this.transferService.getMessages(id, req.user.id, req.user.role);
  }

  /**
   * Mark message as read
   */
  @Post("messages/:messageId/read")
  async markMessageRead(
    @Param("messageId") messageId: string,
    @Req() req: any
  ): Promise<void> {
    return this.transferService.markMessageRead(messageId, req.user.id);
  }
}
