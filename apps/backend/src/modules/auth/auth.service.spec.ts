import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { PrismaService } from "@database/prisma.service";
import { TokenBlacklistService } from "./services/token-blacklist.service";
import { EmailService } from "../notifications/services/email.service";
import { AdminGateway } from "@infrastructure/websocket/admin.gateway";
import { AppException } from "@common/errors/app-exception";
import * as bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";

jest.mock("bcryptjs");

describe("AuthService", () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let tokenBlacklistService: TokenBlacklistService;

  const mockUsersService = {
    create: jest.fn(),
    findByPhone: jest.fn(),
    findById: jest.fn(),
    findByPhoneOrEmail: jest.fn(),
    updateLastLogin: jest.fn(),
    updateLastLogout: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPrismaService: any = {
    $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) =>
      callback(mockPrismaService)
    ),
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    authSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        "jwt.secret": "test-secret-at-least-32-characters-long",
        "jwt.expiresIn": "15m",
        "jwt.refreshSecret": "refresh-secret-at-least-32-characters",
        "jwt.refreshExpiresIn": "7d",
        "jwt.issuer": "learnup",
        "jwt.audience": "learnup-users",
      };
      return config[key];
    }),
  };

  const mockTokenBlacklistService = {
    isBlacklisted: jest.fn(),
    blacklistToken: jest.fn(),
    blacklistAllUserTokens: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockAdminGateway = {
    notifyAdmins: jest.fn(),
    notifySessionCreated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AdminGateway,
          useValue: mockAdminGateway,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    tokenBlacklistService = module.get<TokenBlacklistService>(
      TokenBlacklistService
    );

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    it("should return auth response when credentials are valid", async () => {
      const mockUser = {
        id: "user-123",
        phone: "1234567890",
        password: "hashedPassword",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.INTERNAL_STUDENT,
        status: UserStatus.ACTIVE,
        email: "john@example.com",
      };

      mockUsersService.findByPhoneOrEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValueOnce("access-token");
      mockJwtService.signAsync.mockResolvedValueOnce("refresh-token");
      mockPrismaService.authSession.create.mockResolvedValue({
        id: "session-123",
        userId: mockUser.id,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: "token-123",
        token: "refresh-token",
      });

      const result = await service.login({
        identifier: "1234567890",
        password: "password123",
      });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("user");
      expect(result.user.id).toBe(mockUser.id);
      expect(mockUsersService.findByPhoneOrEmail).toHaveBeenCalledWith(
        "1234567890"
      );
    });

    it("should throw AppException for invalid password", async () => {
      const mockUser = {
        id: "user-123",
        phone: "1234567890",
        password: "hashedPassword",
        status: UserStatus.ACTIVE,
        role: UserRole.INTERNAL_STUDENT,
      };

      mockUsersService.findByPhoneOrEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ identifier: "1234567890", password: "wrongpassword" })
      ).rejects.toThrow(AppException);
    });

    it("should throw AppException for non-existent user", async () => {
      mockUsersService.findByPhoneOrEmail.mockResolvedValue(null);

      await expect(
        service.login({ identifier: "1234567890", password: "password123" })
      ).rejects.toThrow(AppException);
    });

    it("should throw AppException when admin tries to login with phone number", async () => {
      const mockAdmin = {
        id: "admin-123",
        phone: "1234567890",
        password: "hashedPassword",
        status: UserStatus.ACTIVE,
        role: UserRole.ADMIN,
        email: "admin@example.com",
      };

      mockUsersService.findByPhoneOrEmail.mockResolvedValue(mockAdmin);

      await expect(
        service.login({ identifier: "1234567890", password: "password123" })
      ).rejects.toThrow(AppException);
    });
  });

  describe("register", () => {
    it("should throw AppException when trying to register as internal teacher", async () => {
      const registerDto = {
        phone: "1234567890",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: "INTERNAL_TEACHER",
        email: "john@example.com",
      };

      await expect(service.register(registerDto as any)).rejects.toThrow(
        AppException
      );
    });

    it("should throw AppException when user already exists", async () => {
      const registerDto = {
        phone: "1234567890",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.INTERNAL_STUDENT,
        email: "john@example.com",
      };

      mockUsersService.findByPhone.mockResolvedValue({ id: "existing-user" });

      await expect(service.register(registerDto as any)).rejects.toThrow(
        AppException
      );
    });
  });

  describe("refreshToken", () => {
    it("should throw AppException for invalid/malformed refresh token", async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error("invalid signature");
      });

      await expect(service.refreshToken("invalid-token")).rejects.toThrow(
        AppException
      );
    });

    it("should throw AppException for revoked refresh token", async () => {
      const mockPayload = { sub: "user-123" };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: "token-123",
        token: "refresh-token",
        revoked: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await expect(service.refreshToken("revoked-token")).rejects.toThrow(
        AppException
      );
    });

    it("should throw AppException for expired refresh token", async () => {
      const mockPayload = { sub: "user-123" };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: "token-123",
        token: "refresh-token",
        revoked: false,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      await expect(service.refreshToken("expired-token")).rejects.toThrow(
        AppException
      );
    });
  });

  describe("logout", () => {
    it("should blacklist tokens, revoke refresh tokens, and update last logout", async () => {
      const userId = "user-123";

      mockTokenBlacklistService.blacklistAllUserTokens.mockResolvedValue(
        undefined
      );
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockUsersService.updateLastLogout.mockResolvedValue(undefined);

      await service.logout(userId);

      expect(
        mockTokenBlacklistService.blacklistAllUserTokens
      ).toHaveBeenCalledWith(userId, "User logout");
      expect(mockUsersService.updateLastLogout).toHaveBeenCalledWith(userId);
    });
  });

  describe("validateUserById", () => {
    it("should return user when found", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUserById("user-123");

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith("user-123");
    });

    it("should return null when user not found", async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await service.validateUserById("invalid-id");

      expect(result).toBeNull();
    });
  });

  describe("validateSession", () => {
    it("should return true for valid session", async () => {
      mockPrismaService.refreshToken.findFirst.mockResolvedValue({
        id: "token-123",
        sessionId: "session-123",
      });

      const result = await service.validateSession("session-123");

      expect(result).toBe(true);
    });

    it("should return false when session not found", async () => {
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);

      const result = await service.validateSession("invalid-session");

      expect(result).toBe(false);
    });

    it("should return false on database error", async () => {
      mockPrismaService.refreshToken.findFirst.mockRejectedValue(
        new Error("Database error")
      );

      const result = await service.validateSession("session-123");

      expect(result).toBe(false);
    });
  });
});
