import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@database/prisma.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  namespace: "/notifications",
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSocketMap = new Map<string, Set<string>>(); // userId -> Set of socket IDs

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractTokenFromHandshake(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      client.userRole = payload.role;

      // Ensure userId is defined before proceeding
      if (!client.userId) {
        this.logger.warn(`Connection rejected: Invalid token payload`);
        client.disconnect();
        return;
      }

      // Track this socket for the user
      if (!this.userSocketMap.has(client.userId)) {
        this.userSocketMap.set(client.userId, new Set());
      }
      this.userSocketMap.get(client.userId)!.add(client.id);

      // Join user-specific room
      client.join(`user:${client.userId}`);

      this.logger.log(
        `Client connected: ${client.id} (User: ${client.userId}, Role: ${client.userRole})`
      );

      // Send unread count on connection
      await this.sendUnreadCount(client.userId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Connection error: ${errorMessage}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSocketMap.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSocketMap.delete(client.userId);
        }
      }
      this.logger.log(
        `Client disconnected: ${client.id} (User: ${client.userId})`
      );
    }
  }

  @SubscribeMessage("markAsRead")
  async handleMarkAsRead(
    client: AuthenticatedSocket,
    notificationId: string
  ): Promise<void> {
    try {
      if (!client.userId) {return;}

      await this.prisma.notification.update({
        where: {
          id: notificationId,
          userId: client.userId,
        },
        data: {
          status: "READ",
          readAt: new Date(),
        },
      });

      // Send updated unread count
      await this.sendUnreadCount(client.userId);

      this.logger.log(
        `Notification ${notificationId} marked as read by ${client.userId}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Error marking notification as read: ${errorMessage}`);
    }
  }

  @SubscribeMessage("markAllAsRead")
  async handleMarkAllAsRead(client: AuthenticatedSocket): Promise<void> {
    try {
      if (!client.userId) {return;}

      await this.prisma.notification.updateMany({
        where: {
          userId: client.userId,
          status: "UNREAD",
        },
        data: {
          status: "READ",
          readAt: new Date(),
        },
      });

      // Send updated unread count (should be 0)
      await this.sendUnreadCount(client.userId);

      this.logger.log(
        `All notifications marked as read for user ${client.userId}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Error marking all notifications as read: ${errorMessage}`
      );
    }
  }

  @SubscribeMessage("getNotifications")
  async handleGetNotifications(
    client: AuthenticatedSocket,
    payload: { limit?: number; offset?: number }
  ): Promise<void> {
    try {
      if (!client.userId) {return;}

      const { limit = 20, offset = 0 } = payload;

      const notifications = await this.prisma.notification.findMany({
        where: { userId: client.userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      client.emit("notifications", notifications);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Error fetching notifications: ${errorMessage}`);
    }
  }

  /**
   * Send a notification to a specific user in real-time
   */
  async sendNotificationToUser(
    userId: string,
    notification: any
  ): Promise<void> {
    try {
      this.server.to(`user:${userId}`).emit("newNotification", notification);
      await this.sendUnreadCount(userId);
      this.logger.log(`Real-time notification sent to user ${userId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Error sending real-time notification: ${errorMessage}`
      );
    }
  }

  /**
   * Send notifications to multiple users
   */
  async sendNotificationToUsers(
    userIds: string[],
    notification: any
  ): Promise<void> {
    try {
      for (const userId of userIds) {
        await this.sendNotificationToUser(userId, notification);
      }
      this.logger.log(
        `Real-time notifications sent to ${userIds.length} users`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Error sending bulk notifications: ${errorMessage}`);
    }
  }

  /**
   * Send unread notification count to user
   */
  private async sendUnreadCount(userId: string): Promise<void> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId,
          status: "UNREAD",
        },
      });

      this.server.to(`user:${userId}`).emit("unreadCount", count);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Error sending unread count: ${errorMessage}`);
    }
  }

  /**
   * Extract JWT token from socket handshake
   * Checks in order: Authorization header -> query params -> cookies
   */
  private extractTokenFromHandshake(client: Socket): string | null {
    // 1. Check Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    // 2. Check query params
    const queryToken = client.handshake.query.token as string;
    if (queryToken) {
      return queryToken;
    }

    // 3. Check cookies (for browser-based connections)
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const cookieMatch = cookies.match(/access_token=([^;]+)/);
      if (cookieMatch) {
        return cookieMatch[1];
      }
    }

    return null;
  }

  /**
   * Check if user is currently connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSocketMap.has(userId);
  }

  /**
   * Get number of active connections for a user
   */
  getUserConnectionCount(userId: string): number {
    return this.userSocketMap.get(userId)?.size || 0;
  }

  /**
   * Force logout a user by sending a forceLogout event to all their connected sockets
   * This is called when a session is terminated by an admin or the user themselves from another device
   */
  forceLogoutUser(userId: string, reason?: string): void {
    try {
      this.server.to(`user:${userId}`).emit("forceLogout", {
        reason: reason || "Your session has been terminated",
        timestamp: new Date().toISOString(),
      });
      this.logger.log(
        `Force logout sent to user: ${userId}, reason: ${reason}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Error sending force logout: ${errorMessage}`);
    }
  }

  /**
   * Force logout a specific session by socket ID
   */
  forceLogoutSession(userId: string, sessionId: string, reason?: string): void {
    try {
      // We can't target a specific session directly, but we can send the sessionId
      // and let the client check if it matches their session
      this.server.to(`user:${userId}`).emit("forceLogout", {
        sessionId,
        reason: reason || "Your session has been terminated",
        timestamp: new Date().toISOString(),
      });
      this.logger.log(
        `Force logout sent to user: ${userId} for session: ${sessionId}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Error sending session force logout: ${errorMessage}`);
    }
  }
}
