import { Injectable, forwardRef, Inject } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { MessageApprovalStatus, UserRole } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => "ChatGateway"))
    private chatGateway?: any,
    private notificationsService?: NotificationsService
  ) {}

  /**
   * Send a message (with auto-approval for teachers/admins)
   */
  async sendMessage(data: {
    fromId: string;
    toId: string;
    content: string;
    messageType: string;
    attachments: string[];
  }) {
    // Get sender role
    const sender = await this.prisma.user.findUnique({
      where: { id: data.fromId },
      select: { role: true },
    });

    if (!sender) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "Sender not found");
    }

    // Auto-approve messages from admins and teachers
    const requiresApproval = ![
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.INTERNAL_TEACHER,
      UserRole.EXTERNAL_TEACHER,
    ].includes(sender.role as any);

    const message = await this.prisma.chatMessage.create({
      data: {
        fromId: data.fromId,
        toId: data.toId,
        content: data.content,
        messageType: data.messageType as any,
        attachments: data.attachments,
        approvalStatus: requiresApproval
          ? MessageApprovalStatus.PENDING
          : MessageApprovalStatus.APPROVED,
        approvedAt: requiresApproval ? null : new Date(),
      },
      include: {
        from: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        to: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Get conversation between two users
   */
  async getConversation(
    userId: string,
    withUserId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: {
          OR: [
            { fromId: userId, toId: withUserId },
            { fromId: withUserId, toId: userId },
          ],
          deleted: false,
          approvalStatus: MessageApprovalStatus.APPROVED,
        },
        skip,
        take: limit,
        include: {
          from: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          to: {
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
      }),
      this.prisma.chatMessage.count({
        where: {
          OR: [
            { fromId: userId, toId: withUserId },
            { fromId: withUserId, toId: userId },
          ],
          deleted: false,
          approvalStatus: MessageApprovalStatus.APPROVED,
        },
      }),
    ]);

    return {
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get list of conversations (recent chats with last message)
   */
  async getConversations(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get all messages where user is sender or receiver
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        OR: [{ fromId: userId }, { toId: userId }],
        deleted: false,
        approvalStatus: MessageApprovalStatus.APPROVED,
      },
      include: {
        from: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        to: {
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
    });

    // Group by conversation partner
    const conversationsMap = new Map();

    messages.forEach((message) => {
      const partnerId =
        message.fromId === userId ? message.toId : message.fromId;
      const partner = message.fromId === userId ? message.to : message.from;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      // Count unread messages from partner
      if (message.toId === userId && !message.readAt) {
        conversationsMap.get(partnerId).unreadCount++;
      }
    });

    // Convert to array and paginate
    const conversations = Array.from(conversationsMap.values())
      .sort(
        (a, b) =>
          b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
      )
      .slice(skip, skip + limit);

    return {
      data: conversations,
      pagination: {
        page,
        limit,
        total: conversationsMap.size,
        pages: Math.ceil(conversationsMap.size / limit),
      },
    };
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw AppException.notFound(
        ErrorCode.MESSAGE_NOT_FOUND,
        "Message not found"
      );
    }

    // Only recipient can mark as read
    if (message.toId !== userId) {
      throw AppException.forbidden(
        ErrorCode.ONLY_OWN_MESSAGES,
        "You can only mark your own messages as read"
      );
    }

    // Already read
    if (message.readAt) {
      return message;
    }

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { readAt: new Date() },
      include: {
        from: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw AppException.notFound(
        ErrorCode.MESSAGE_NOT_FOUND,
        "Message not found"
      );
    }

    // Only sender can delete
    if (message.fromId !== userId) {
      throw AppException.forbidden(
        ErrorCode.ONLY_OWN_MESSAGES,
        "You can only delete your own messages"
      );
    }

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string) {
    return this.prisma.chatMessage.count({
      where: {
        toId: userId,
        readAt: null,
        deleted: false,
        approvalStatus: MessageApprovalStatus.APPROVED,
      },
    });
  }

  /**
   * Search messages
   */
  async searchMessages(
    userId: string,
    query: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: {
          OR: [{ fromId: userId }, { toId: userId }],
          content: {
            contains: query,
            mode: "insensitive",
          },
          deleted: false,
          approvalStatus: MessageApprovalStatus.APPROVED,
        },
        skip,
        take: limit,
        include: {
          from: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          to: {
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
      }),
      this.prisma.chatMessage.count({
        where: {
          OR: [{ fromId: userId }, { toId: userId }],
          content: {
            contains: query,
            mode: "insensitive",
          },
          deleted: false,
          approvalStatus: MessageApprovalStatus.APPROVED,
        },
      }),
    ]);

    return {
      data: messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get pending messages for moderation with pagination and filters
   */
  async getPendingMessages(filters: {
    page: number;
    limit: number;
    fromRole?: UserRole;
    messageType?: string;
  }) {
    const { page, limit, fromRole, messageType } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      approvalStatus: MessageApprovalStatus.PENDING,
      deleted: false,
    };

    if (fromRole) {
      where.from = {
        role: fromRole,
      };
    }

    if (messageType && messageType !== "ALL") {
      where.messageType = messageType;
    }

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        skip,
        take: limit,
        include: {
          from: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          to: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.chatMessage.count({ where }),
    ]);

    return {
      data: messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approve a pending message
   */
  async approveMessage(messageId: string, approvedBy: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Message not found"
      );
    }

    if (message.approvalStatus !== MessageApprovalStatus.PENDING) {
      throw AppException.badRequest(
        ErrorCode.MESSAGE_NOT_PENDING,
        "Message is not pending approval"
      );
    }

    const updatedMessage = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        approvalStatus: MessageApprovalStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        from: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        to: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send notification to sender about approval
    if (this.notificationsService) {
      await this.notificationsService.createNotification({
        userId: updatedMessage.from.id,
        title: "Message Approved",
        message: "Your message has been approved and delivered.",
        type: "CHAT_UPDATE",
        priority: "NORMAL",
      });

      // Notify recipient about new message
      await this.notificationsService.createNotification({
        userId: updatedMessage.to.id,
        title: "New Message",
        message: `You have a new message from ${updatedMessage.from.firstName} ${updatedMessage.from.lastName}`,
        type: "CHAT_UPDATE",
        priority: "NORMAL",
      });
    }

    // Broadcast approved message via WebSocket
    if (this.chatGateway) {
      this.chatGateway.broadcastApprovedMessage(updatedMessage);
    }

    return {
      message: "Message approved successfully",
      chatMessage: updatedMessage,
    };
  }

  /**
   * Reject a pending message
   */
  async rejectMessage(messageId: string, reason: string, rejectedBy: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Message not found"
      );
    }

    if (message.approvalStatus !== MessageApprovalStatus.PENDING) {
      throw AppException.badRequest(
        ErrorCode.MESSAGE_NOT_PENDING,
        "Message is not pending approval"
      );
    }

    const updatedMessage = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        approvalStatus: MessageApprovalStatus.REJECTED,
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        from: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        to: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send notification to sender about rejection with reason
    if (this.notificationsService) {
      await this.notificationsService.createNotification({
        userId: updatedMessage.from.id,
        title: "Message Rejected",
        message: `Your message was not approved. Reason: ${reason}`,
        type: "CHAT_UPDATE",
        priority: "NORMAL",
      });
    }

    // Notify sender via WebSocket
    if (this.chatGateway) {
      this.chatGateway.notifyMessageRejected(updatedMessage);
    }

    return {
      message: "Message rejected successfully",
      chatMessage: updatedMessage,
    };
  }

  /**
   * Bulk approve multiple messages
   */
  async bulkApproveMessages(messageIds: string[], approvedBy: string) {
    // Verify all messages exist and are pending
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        id: { in: messageIds },
      },
    });

    if (messages.length !== messageIds.length) {
      throw AppException.badRequest(
        ErrorCode.MESSAGE_NOT_FOUND,
        "Some messages were not found"
      );
    }

    const notPending = messages.filter(
      (m) => m.approvalStatus !== MessageApprovalStatus.PENDING
    );
    if (notPending.length > 0) {
      throw AppException.badRequest(
        ErrorCode.MESSAGE_NOT_PENDING,
        `${notPending.length} message(s) are not pending approval`
      );
    }

    // Approve all messages
    const result = await this.prisma.chatMessage.updateMany({
      where: {
        id: { in: messageIds },
        approvalStatus: MessageApprovalStatus.PENDING,
      },
      data: {
        approvalStatus: MessageApprovalStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Send notifications to senders and recipients
    if (this.notificationsService && result.count > 0) {
      // Get approved messages with user info
      const approvedMessages = await this.prisma.chatMessage.findMany({
        where: { id: { in: messageIds } },
        include: {
          from: { select: { id: true, firstName: true, lastName: true } },
          to: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Notify all unique senders and recipients
      const notifications: Array<{
        userId: string;
        title: string;
        message: string;
      }> = [];
      const senderIds = new Set<string>();
      const recipientNotifications = new Map<string, string[]>();

      for (const msg of approvedMessages) {
        if (!senderIds.has(msg.from.id)) {
          senderIds.add(msg.from.id);
          notifications.push({
            userId: msg.from.id,
            title: "Messages Approved",
            message: "Your message(s) have been approved and delivered.",
          });
        }

        const recipientMsgs = recipientNotifications.get(msg.to.id) || [];
        recipientMsgs.push(`${msg.from.firstName} ${msg.from.lastName}`);
        recipientNotifications.set(msg.to.id, recipientMsgs);
      }

      for (const [recipientId, senders] of recipientNotifications) {
        const uniqueSenders = [...new Set(senders)];
        notifications.push({
          userId: recipientId,
          title: "New Messages",
          message: `You have new messages from ${uniqueSenders.join(", ")}`,
        });
      }

      // Create all notifications
      for (const notif of notifications) {
        await this.notificationsService.createNotification({
          ...notif,
          type: "CHAT_UPDATE",
          priority: "NORMAL",
        });
      }
    }

    return {
      message: `Successfully approved ${result.count} message(s)`,
      approved: result.count,
      failed: messageIds.length - result.count,
    };
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.chatMessage.count({
        where: { deleted: false },
      }),
      this.prisma.chatMessage.count({
        where: {
          approvalStatus: MessageApprovalStatus.PENDING,
          deleted: false,
        },
      }),
      this.prisma.chatMessage.count({
        where: {
          approvalStatus: MessageApprovalStatus.APPROVED,
          deleted: false,
        },
      }),
      this.prisma.chatMessage.count({
        where: {
          approvalStatus: MessageApprovalStatus.REJECTED,
          deleted: false,
        },
      }),
    ]);

    // Get by message type
    const byMessageType = await this.prisma.chatMessage.groupBy({
      by: ["messageType"],
      where: { deleted: false },
      _count: true,
    });

    // Get by from role (requires a more complex query)
    const messagesByRole = await this.prisma.chatMessage.findMany({
      where: { deleted: false },
      include: {
        from: {
          select: { role: true },
        },
      },
    });

    const byFromRole: Record<string, number> = {};
    messagesByRole.forEach((msg) => {
      const role = msg.from.role;
      byFromRole[role] = (byFromRole[role] || 0) + 1;
    });

    return {
      total,
      pending,
      approved,
      rejected,
      byMessageType: Object.fromEntries(
        byMessageType.map((item) => [item.messageType, item._count])
      ),
      byFromRole,
    };
  }
}
