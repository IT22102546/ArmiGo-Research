import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UseGuards, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ChatService } from "./chat.service";
import { MessageApprovalStatus } from "@prisma/client";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        this.logger.warn("Client connection rejected: No token provided");
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      client.userRole = payload.role;

      // Track online user
      if (client.userId) {
        this.onlineUsers.set(client.userId, client.id);
      }

      // Join user's personal room
      if (client.userId) {
        client.join(`user:${client.userId}`);
      }

      // Notify online status
      this.server.emit("user:online", { userId: client.userId });

      this.logger.log(
        `Client connected: ${client.id} (User: ${client.userId})`
      );
    } catch (error: unknown) {
      this.logger.error(
        "Authentication failed during connection",
        error as Error
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.onlineUsers.delete(client.userId);
      this.server.emit("user:offline", { userId: client.userId });
      this.logger.log(
        `Client disconnected: ${client.id} (User: ${client.userId})`
      );
    }
  }

  /**
   * Send a direct message
   */
  @SubscribeMessage("message:send")
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      toId: string;
      content: string;
      messageType?: string;
      attachments?: string[];
    }
  ) {
    try {
      const message = await this.chatService.sendMessage({
        fromId: client.userId!,
        toId: data.toId,
        content: data.content,
        messageType: data.messageType || "DIRECT",
        attachments: data.attachments || [],
      });

      // If message requires approval, notify admins
      if (message.approvalStatus === MessageApprovalStatus.PENDING) {
        this.server.to("admins").emit("message:pending", message);

        // Send acknowledgment to sender
        client.emit("message:pending", {
          messageId: message.id,
          status: "pending_approval",
        });
      } else {
        // Message is auto-approved, deliver immediately
        // Send to recipient
        this.server.to(`user:${data.toId}`).emit("message:new", message);

        // Send confirmation to sender
        client.emit("message:sent", message);
      }

      return { success: true, message };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Error sending message", error as Error);
      client.emit("message:error", { error: errMsg });
      return { success: false, error: errMsg };
    }
  }

  /**
   * Mark message as read
   */
  @SubscribeMessage("message:read")
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string }
  ) {
    try {
      const message = await this.chatService.markAsRead(
        data.messageId,
        client.userId!
      );

      // Notify sender that message was read
      this.server.to(`user:${message.fromId}`).emit("message:read", {
        messageId: message.id,
        readAt: message.readAt,
        readBy: client.userId,
      });

      return { success: true };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Error marking message as read", error as Error);
      return { success: false, error: errMsg };
    }
  }

  /**
   * Typing indicator
   */
  @SubscribeMessage("typing:start")
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { toId: string }
  ) {
    this.server.to(`user:${data.toId}`).emit("typing:start", {
      fromId: client.userId,
    });
  }

  @SubscribeMessage("typing:stop")
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { toId: string }
  ) {
    this.server.to(`user:${data.toId}`).emit("typing:stop", {
      fromId: client.userId,
    });
  }

  /**
   * Get conversation history
   */
  @SubscribeMessage("conversation:load")
  async handleLoadConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { withUserId: string; page?: number; limit?: number }
  ) {
    try {
      const conversation = await this.chatService.getConversation(
        client.userId!,
        data.withUserId,
        data.page || 1,
        data.limit || 50
      );

      return { success: true, conversation };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Error loading conversation", error as Error);
      return { success: false, error: errMsg };
    }
  }

  /**
   * Get list of conversations (recent chats)
   */
  @SubscribeMessage("conversations:list")
  async handleListConversations(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { page?: number; limit?: number }
  ) {
    try {
      const conversations = await this.chatService.getConversations(
        client.userId!,
        data.page || 1,
        data.limit || 20
      );

      return { success: true, conversations };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Error listing conversations", error as Error);
      return { success: false, error: errMsg };
    }
  }

  /**
   * Delete a message
   */
  @SubscribeMessage("message:delete")
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string }
  ) {
    try {
      const message = await this.chatService.deleteMessage(
        data.messageId,
        client.userId!
      );

      // Notify recipient about deletion
      this.server.to(`user:${message.toId}`).emit("message:deleted", {
        messageId: message.id,
      });

      return { success: true };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Error deleting message", error as Error);
      return { success: false, error: errMsg };
    }
  }

  /**
   * Get online users
   */
  @SubscribeMessage("users:online")
  handleGetOnlineUsers(@ConnectedSocket() client: AuthenticatedSocket) {
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    return { success: true, onlineUsers: onlineUserIds };
  }

  /**
   * Admin: Broadcast approved message to recipient
   */
  async broadcastApprovedMessage(message: any) {
    this.server.to(`user:${message.toId}`).emit("message:new", message);
    this.server.to(`user:${message.fromId}`).emit("message:approved", message);
  }

  /**
   * Admin: Notify sender about message rejection
   */
  async notifyMessageRejected(message: any) {
    this.server.to(`user:${message.fromId}`).emit("message:rejected", {
      messageId: message.id,
      reason: message.rejectionReason,
    });
  }
}
