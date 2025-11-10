import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { TemporaryAccessResource, Prisma } from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

export interface CreateTemporaryAccessDto {
  userId: string;
  resourceType: TemporaryAccessResource;
  resourceId: string;
  startDate: Date;
  expiresAt: Date;
  reason?: string;
  grantedBy: string;
}

export interface TemporaryAccessFilterDto {
  userId?: string;
  resourceType?: TemporaryAccessResource;
  active?: boolean;
  page?: number;
  limit?: number;
}

export interface RevokeAccessDto {
  revokedBy: string;
  revocationNote?: string;
}

@Injectable()
export class TemporaryAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async createAccess(data: CreateTemporaryAccessDto) {
    // Validate dates
    const now = new Date();
    const startDate = new Date(data.startDate);
    const expiresAt = new Date(data.expiresAt);

    if (startDate >= expiresAt) {
      throw AppException.badRequest(
        ErrorCode.INVALID_DATE_RANGE,
        "Start date must be before expiry date"
      );
    }

    // Check for existing active access
    const existingAccess = await this.prisma.temporaryAccess.findFirst({
      where: {
        userId: data.userId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        active: true,
        expiresAt: {
          gte: now,
        },
      },
    });

    if (existingAccess) {
      throw AppException.badRequest(
        ErrorCode.ACCESS_ALREADY_ACTIVE,
        "User already has active access to this resource"
      );
    }

    return this.prisma.temporaryAccess.create({
      data: {
        userId: data.userId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        startDate,
        expiresAt,
        reason: data.reason,
        grantedBy: data.grantedBy,
        active: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentProfile: {
              select: {
                studentId: true,
              },
            },
          },
        },
        grantor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getAccessList(filters: TemporaryAccessFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TemporaryAccessWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters.active !== undefined) {
      where.active = filters.active;
      if (filters.active) {
        where.expiresAt = {
          gte: new Date(),
        };
      }
    }

    const [accesses, total] = await Promise.all([
      this.prisma.temporaryAccess.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              studentProfile: {
                select: {
                  studentId: true,
                },
              },
            },
          },
          grantor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          revoker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.temporaryAccess.count({ where }),
    ]);

    return {
      data: accesses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAccessById(id: string) {
    const access = await this.prisma.temporaryAccess.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentProfile: {
              select: {
                studentId: true,
              },
            },
          },
        },
        grantor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        revoker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!access) {
      throw AppException.notFound(
        ErrorCode.TEMPORARY_ACCESS_NOT_FOUND,
        "Temporary access not found"
      );
    }

    return access;
  }

  async getAccessByUser(userId: string) {
    return this.prisma.temporaryAccess.findMany({
      where: {
        userId,
        active: true,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        grantor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });
  }

  async checkAccess(
    userId: string,
    resourceType: TemporaryAccessResource,
    resourceId: string
  ): Promise<boolean> {
    const access = await this.prisma.temporaryAccess.findFirst({
      where: {
        userId,
        resourceType,
        resourceId,
        active: true,
        startDate: {
          lte: new Date(),
        },
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    return !!access;
  }

  async revokeAccess(id: string, revokeData: RevokeAccessDto) {
    const access = await this.prisma.temporaryAccess.findUnique({
      where: { id },
    });

    if (!access) {
      throw AppException.notFound(
        ErrorCode.TEMPORARY_ACCESS_NOT_FOUND,
        "Temporary access not found"
      );
    }

    if (!access.active) {
      throw AppException.badRequest(
        ErrorCode.ACCESS_ALREADY_REVOKED,
        "Access is already revoked or expired"
      );
    }

    return this.prisma.temporaryAccess.update({
      where: { id },
      data: {
        active: false,
        revokedBy: revokeData.revokedBy,
        revokedAt: new Date(),
        revocationNote: revokeData.revocationNote,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        revoker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async cleanupExpiredAccess() {
    const result = await this.prisma.temporaryAccess.updateMany({
      where: {
        active: true,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        active: false,
      },
    });

    return {
      deactivated: result.count,
      timestamp: new Date(),
    };
  }

  async getAccessStatistics() {
    const now = new Date();

    const [total, active, expired, byResourceType] = await Promise.all([
      this.prisma.temporaryAccess.count(),
      this.prisma.temporaryAccess.count({
        where: {
          active: true,
          expiresAt: {
            gte: now,
          },
        },
      }),
      this.prisma.temporaryAccess.count({
        where: {
          OR: [
            { active: false },
            {
              active: true,
              expiresAt: {
                lt: now,
              },
            },
          ],
        },
      }),
      this.prisma.temporaryAccess.groupBy({
        by: ["resourceType"],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      expired,
      byResourceType: byResourceType.reduce(
        (acc, item) => {
          acc[item.resourceType] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
