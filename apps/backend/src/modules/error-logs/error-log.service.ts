import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ErrorLevel, Prisma } from "@prisma/client";

export interface ErrorLogFilters {
  level?: ErrorLevel;
  resolved?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  route?: string;
  method?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface ErrorLogStats {
  total: number;
  today: number;
  warnings: number;
  unresolved: number;
  byLevel: { level: ErrorLevel; count: number }[];
  byRoute: { route: string; count: number }[];
}

@Injectable()
export class ErrorLogService {
  constructor(private prisma: PrismaService) {}

  async logError(data: {
    level: ErrorLevel;
    message: string;
    stackTrace?: string;
    route?: string;
    method?: string;
    statusCode?: number;
    userId?: string;
    userAgent?: string;
    ipAddress?: string;
    requestBody?: string;
    responseBody?: string;
    errorCode?: string;
    context?: any;
  }) {
    // Check if similar error exists (same message + route within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const existingError = await this.prisma.systemErrorLog.findFirst({
      where: {
        message: data.message,
        route: data.route || null,
        lastSeen: {
          gte: fiveMinutesAgo,
        },
      },
      orderBy: {
        lastSeen: "desc",
      },
    });

    if (existingError) {
      // Update existing error
      return this.prisma.systemErrorLog.update({
        where: { id: existingError.id },
        data: {
          occurrences: existingError.occurrences + 1,
          lastSeen: new Date(),
          stackTrace: data.stackTrace || existingError.stackTrace,
          context: data.context || existingError.context,
        },
      });
    }

    // Create new error log
    return this.prisma.systemErrorLog.create({
      data: {
        level: data.level,
        message: data.message,
        stackTrace: data.stackTrace,
        route: data.route,
        method: data.method,
        statusCode: data.statusCode,
        userId: data.userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        requestBody: data.requestBody,
        responseBody: data.responseBody,
        errorCode: data.errorCode,
        context: data.context,
      },
    });
  }

  async getErrorLogs(filters: ErrorLogFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.SystemErrorLogWhereInput = {};

    if (filters.level) {
      where.level = filters.level;
    }

    if (filters.resolved !== undefined) {
      where.resolved = filters.resolved;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.lastSeen = {};
      if (filters.dateFrom) {
        where.lastSeen.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.lastSeen.lte = filters.dateTo;
      }
    }

    if (filters.search) {
      where.OR = [
        { message: { contains: filters.search, mode: "insensitive" } },
        { route: { contains: filters.search, mode: "insensitive" } },
        { errorCode: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.route) {
      where.route = { contains: filters.route, mode: "insensitive" };
    }

    if (filters.method) {
      where.method = filters.method;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    const [logs, total] = await Promise.all([
      this.prisma.systemErrorLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          resolver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          lastSeen: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.systemErrorLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getErrorById(id: string) {
    const error = await this.prisma.systemErrorLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        resolver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!error) {
      throw new Error("Error log not found");
    }

    return error;
  }

  async markAsResolved(id: string, resolvedBy: string, notes?: string) {
    return this.prisma.systemErrorLog.update({
      where: { id },
      data: {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        notes,
      },
    });
  }

  async getErrorStats(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<ErrorLogStats> {
    const where: Prisma.SystemErrorLogWhereInput = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.lastSeen = {};
      if (filters.dateFrom) {
        where.lastSeen.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.lastSeen.lte = filters.dateTo;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, warnings, unresolved, byLevel, byRoute] =
      await Promise.all([
        this.prisma.systemErrorLog.count({ where }),
        this.prisma.systemErrorLog.count({
          where: {
            ...where,
            lastSeen: { gte: today },
          },
        }),
        this.prisma.systemErrorLog.count({
          where: {
            ...where,
            level: ErrorLevel.WARNING,
          },
        }),
        this.prisma.systemErrorLog.count({
          where: {
            ...where,
            resolved: false,
          },
        }),
        this.prisma.systemErrorLog.groupBy({
          by: ["level"],
          where,
          _count: {
            id: true,
          },
        }),
        this.prisma.systemErrorLog.groupBy({
          by: ["route"],
          where: {
            ...where,
            route: { not: null },
          },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: "desc",
            },
          },
          take: 10,
        }),
      ]);

    return {
      total,
      today: todayCount,
      warnings,
      unresolved,
      byLevel: byLevel.map((item) => ({
        level: item.level,
        count: item._count.id,
      })),
      byRoute: byRoute.map((item) => ({
        route: item.route || "Unknown",
        count: item._count.id,
      })),
    };
  }

  async getGroupedErrors(filters?: ErrorLogFilters) {
    const where: Prisma.SystemErrorLogWhereInput = {};

    if (filters?.level) {
      where.level = filters.level;
    }

    if (filters?.resolved !== undefined) {
      where.resolved = filters.resolved;
    }

    // Group by message and route
    const grouped = await this.prisma.systemErrorLog.groupBy({
      by: ["message", "route"],
      where,
      _count: {
        id: true,
      },
      _max: {
        lastSeen: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 50,
    });

    // Get representative error for each group
    const groupedWithDetails = await Promise.all(
      grouped.map(async (group) => {
        const representative = await this.prisma.systemErrorLog.findFirst({
          where: {
            message: group.message,
            route: group.route,
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
          },
          orderBy: {
            lastSeen: "desc",
          },
        });

        return {
          message: group.message,
          route: group.route,
          count: group._count.id,
          lastSeen: group._max.lastSeen,
          representative,
        };
      })
    );

    return groupedWithDetails;
  }

  async deleteOldLogs(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.systemErrorLog.deleteMany({
      where: {
        resolved: true,
        resolvedAt: {
          lt: cutoffDate,
        },
      },
    });

    return { deleted: result.count };
  }
}
