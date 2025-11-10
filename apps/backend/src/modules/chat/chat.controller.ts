import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "../../shared";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";

@Controller("chat")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get pending messages for moderation (Admin only)
   */
  @Get("moderation/pending")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getPendingMessages(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
    @Query("fromRole") fromRole?: UserRole,
    @Query("messageType") messageType?: string
  ) {
    return this.chatService.getPendingMessages({
      page: Number(page),
      limit: Number(limit),
      fromRole,
      messageType,
    });
  }

  /**
   * Approve a pending message (Admin only)
   */
  @Patch("moderation/:id/approve")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async approveMessage(
    @Param("id") id: string,
    @Req() req: { user: { id: string } }
  ) {
    return this.chatService.approveMessage(id, req.user.id);
  }

  /**
   * Reject a pending message (Admin only)
   */
  @Patch("moderation/:id/reject")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async rejectMessage(
    @Param("id") id: string,
    @Body() dto: { reason: string },
    @Req() req: { user: { id: string } }
  ) {
    if (!dto.reason) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Rejection reason is required"
      );
    }
    return this.chatService.rejectMessage(id, dto.reason, req.user.id);
  }

  /**
   * Bulk approve multiple messages (Admin only)
   */
  @Post("moderation/bulk-approve")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async bulkApproveMessages(
    @Body() dto: { messageIds: string[] },
    @Req() req: { user: { id: string } }
  ) {
    if (!dto.messageIds || dto.messageIds.length === 0) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "messageIds array is required"
      );
    }
    return this.chatService.bulkApproveMessages(dto.messageIds, req.user.id);
  }

  /**
   * Get moderation statistics (Admin only)
   */
  @Get("moderation/stats")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getModerationStats() {
    return this.chatService.getModerationStats();
  }

  /**
   * Get conversations list for current user
   */
  @Get("conversations")
  async getConversations(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
    @Req() req: { user: { id: string } }
  ) {
    return this.chatService.getConversations(
      req.user.id,
      Number(page),
      Number(limit)
    );
  }

  /**
   * Get conversation with specific user
   */
  @Get("conversation/:userId")
  async getConversation(
    @Param("userId") userId: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 50,
    @Req() req: { user: { id: string } }
  ) {
    return this.chatService.getConversation(
      req.user.id,
      userId,
      Number(page),
      Number(limit)
    );
  }

  /**
   * Get unread message count
   */
  @Get("unread-count")
  async getUnreadCount(@Req() req: { user: { id: string } }) {
    const count = await this.chatService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  /**
   * Search messages
   */
  @Get("search")
  async searchMessages(
    @Query("q") query: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
    @Req() req: { user: { id: string } }
  ) {
    if (!query) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Search query is required"
      );
    }
    return this.chatService.searchMessages(
      req.user.id,
      query,
      Number(page),
      Number(limit)
    );
  }

  /**
   * Mark message as read
   */
  @Patch(":messageId/read")
  async markAsRead(
    @Param("messageId") messageId: string,
    @Req() req: { user: { id: string } }
  ) {
    return this.chatService.markAsRead(messageId, req.user.id);
  }

  /**
   * Delete message
   */
  @Patch(":messageId/delete")
  async deleteMessage(
    @Param("messageId") messageId: string,
    @Req() req: { user: { id: string } }
  ) {
    return this.chatService.deleteMessage(messageId, req.user.id);
  }
}
