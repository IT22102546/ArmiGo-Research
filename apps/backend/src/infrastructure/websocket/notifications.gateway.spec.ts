import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { NotificationsGateway } from "./notifications.gateway";
import { PrismaService } from "@database/prisma.service";
import { Socket } from "socket.io";

describe("NotificationsGateway", () => {
  let gateway: NotificationsGateway;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockPrismaService = {
    notification: {
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockSocket = {
    id: "socket-123",
    handshake: {
      headers: {
        authorization: "Bearer valid-token",
      },
      query: {},
    },
    join: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
  } as unknown as Socket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Mock the server
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(gateway).toBeDefined();
  });

  describe("handleConnection", () => {
    it("should authenticate and connect a valid user", async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: "user-123",
        role: "INTERNAL_STUDENT",
      });

      mockPrismaService.notification.count.mockResolvedValue(5);

      await gateway.handleConnection(mockSocket as any);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith("valid-token");
      expect(mockSocket.join).toHaveBeenCalledWith("user:user-123");
      expect(gateway.isUserConnected("user-123")).toBe(true);
    });

    it("should disconnect socket with invalid token", async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error("Invalid token"));

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it("should disconnect socket with no token", async () => {
      const socketNoToken = {
        ...mockSocket,
        handshake: {
          headers: {},
          query: {},
        },
      } as unknown as Socket;

      await gateway.handleConnection(socketNoToken as any);

      expect(socketNoToken.disconnect).toHaveBeenCalled();
    });
  });

  describe("handleDisconnect", () => {
    it("should remove user from connection tracking", async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: "user-123",
        role: "INTERNAL_STUDENT",
      });

      mockPrismaService.notification.count.mockResolvedValue(0);

      await gateway.handleConnection(mockSocket as any);
      expect(gateway.isUserConnected("user-123")).toBe(true);

      gateway.handleDisconnect(mockSocket as any);
      expect(gateway.isUserConnected("user-123")).toBe(false);
    });
  });

  describe("handleMarkAsRead", () => {
    it("should mark notification as read", async () => {
      const authenticatedSocket = {
        ...mockSocket,
        userId: "user-123",
      } as any;

      mockPrismaService.notification.update.mockResolvedValue({
        id: "notif-123",
        status: "READ",
        readAt: new Date(),
      });

      mockPrismaService.notification.count.mockResolvedValue(4);

      await gateway.handleMarkAsRead(authenticatedSocket, "notif-123");

      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: {
          id: "notif-123",
          userId: "user-123",
        },
        data: {
          status: "READ",
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe("handleMarkAllAsRead", () => {
    it("should mark all notifications as read", async () => {
      const authenticatedSocket = {
        ...mockSocket,
        userId: "user-123",
      } as any;

      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });
      mockPrismaService.notification.count.mockResolvedValue(0);

      await gateway.handleMarkAllAsRead(authenticatedSocket);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          status: "UNREAD",
        },
        data: {
          status: "READ",
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe("handleGetNotifications", () => {
    it("should return user notifications", async () => {
      const authenticatedSocket = {
        ...mockSocket,
        userId: "user-123",
        emit: jest.fn(),
      } as any;

      const notifications = [
        {
          id: "1",
          userId: "user-123",
          type: "SYSTEM",
          title: "Test 1",
          message: "Message 1",
          status: "UNREAD",
          sentAt: new Date(),
          readAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(notifications);

      await gateway.handleGetNotifications(authenticatedSocket, {
        limit: 20,
        offset: 0,
      });

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        orderBy: { createdAt: "desc" },
        take: 20,
        skip: 0,
      });

      expect(authenticatedSocket.emit).toHaveBeenCalledWith(
        "notifications",
        notifications
      );
    });
  });

  describe("sendNotificationToUser", () => {
    it("should send real-time notification to specific user", async () => {
      const notification = {
        id: "notif-123",
        userId: "user-123",
        title: "Test",
        message: "Test message",
      };

      mockPrismaService.notification.count.mockResolvedValue(1);

      await gateway.sendNotificationToUser("user-123", notification);

      expect(gateway.server.to).toHaveBeenCalledWith("user:user-123");
    });
  });

  describe("getUserConnectionCount", () => {
    it("should return 0 for disconnected user", () => {
      const count = gateway.getUserConnectionCount("user-999");
      expect(count).toBe(0);
    });

    it("should return connection count for connected user", async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: "user-123",
        role: "INTERNAL_STUDENT",
      });

      mockPrismaService.notification.count.mockResolvedValue(0);

      await gateway.handleConnection(mockSocket as any);

      const count = gateway.getUserConnectionCount("user-123");
      expect(count).toBe(1);
    });
  });
});
