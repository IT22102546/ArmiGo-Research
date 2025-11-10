import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards';
import { RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';
import { UserRole } from '../../../shared';
import { TransferInterestService } from '../services/transfer-interest.service';
import {
  SendInterestDto,
  RespondToInterestDto,
  PauseTransferDto,
  UpdateTransferRequestDto,
} from "../dto/send-interest.dto";

/**
 * Controller for managing transfer interests and advanced operations
 * Implements FR-023.2: Interest-Based Matching System
 */
@Controller('transfer/interests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransferInterestController {
  constructor(private readonly interestService: TransferInterestService) {}

  /**
   * Send interest to a transfer request
   * POST /transfer/interests/:transferRequestId
   */
  @Post(':transferRequestId')
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async sendInterest(
    @Param('transferRequestId') transferRequestId: string,
    @Body() dto: SendInterestDto,
    @Req() req: any,
  ) {
    return this.interestService.sendInterest(
      transferRequestId,
      dto,
      req.user.userId,
    );
  }

  /**
   * Accept an interest
   * POST /transfer/interests/:acceptanceId/accept
   */
  @Post(':acceptanceId/accept')
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async acceptInterest(
    @Param('acceptanceId') acceptanceId: string,
    @Req() req: any,
  ) {
    return this.interestService.acceptInterest(
      acceptanceId,
      req.user.userId,
    );
  }

  /**
   * Reject an interest
   * POST /transfer/interests/:acceptanceId/reject
   */
  @Post(':acceptanceId/reject')
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async rejectInterest(
    @Param('acceptanceId') acceptanceId: string,
    @Body() dto: { message?: string },
    @Req() req: any,
  ) {
    return this.interestService.rejectInterest(
      acceptanceId,
      req.user.userId,
      dto.message,
    );
  }

  /**
   * Get received interests for a transfer request
   * GET /transfer/interests/received/:transferRequestId
   */
  @Get('received/:transferRequestId')
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async getReceivedInterests(
    @Param('transferRequestId') transferRequestId: string,
    @Req() req: any,
  ) {
    return this.interestService.getReceivedInterests(
      transferRequestId,
      req.user.userId,
    );
  }

  /**
   * Get sent interests by the current user
   * GET /transfer/interests/sent
   */
  @Get('sent')
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async getSentInterests(@Req() req: any) {
    return this.interestService.getSentInterests(req.user.userId);
  }

  /**
   * Pause a transfer request
   * PATCH /transfer/interests/:transferRequestId/pause
   */
  @Patch(':transferRequestId/pause')
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async pauseRequest(
    @Param('transferRequestId') transferRequestId: string,
    @Body() dto: PauseTransferDto,
    @Req() req: any,
  ) {
    return this.interestService.pauseRequest(
      transferRequestId,
      req.user.userId,
      dto,
    );
  }

  /**
   * Edit a transfer request
   * PATCH /transfer/interests/:transferRequestId/edit
   */
  @Patch(':transferRequestId/edit')
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  async editRequest(
    @Param('transferRequestId') transferRequestId: string,
    @Body() dto: UpdateTransferRequestDto,
    @Req() req: any,
  ) {
    return this.interestService.editRequest(
      transferRequestId,
      dto,
      req.user.userId,
    );
  }
}
