import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { SecurityAuditFiltersDto } from "./dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class SecurityAuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all security audit logs with filtering
   */
  async getAll(filters: SecurityAuditFiltersDto) {
    const {
      page = 1,
      limit = 50,
      action,
      success,
      riskScoreMin,
      riskScoreMax,
      ipAddress,
      resource,
      userId,
      dateFrom,
      dateTo,
      search,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.SecurityAuditLogWhereInput = {};

    if (action) {
      where.action = action;
    }

    if (success !== undefined) {
      where.success = success;
    }

    if (riskScoreMin !== undefined || riskScoreMax !== undefined) {
      where.riskScore = {};
      if (riskScoreMin !== undefined) {
        where.riskScore.gte = riskScoreMin;
      }
      if (riskScoreMax !== undefined) {
        where.riskScore.lte = riskScoreMax;
      }
    }

    if (ipAddress) {
      where.ipAddress = { contains: ipAddress };
    }

    if (resource) {
      where.resource = { contains: resource, mode: "insensitive" };
    }

    if (userId) {
      where.userId = userId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { resource: { contains: search, mode: "insensitive" } },
        { errorMessage: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.securityAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.securityAuditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get security audit log detail
   */
  async getDetail(id: string) {
    const log = await this.prisma.securityAuditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new Error("Security audit log not found");
    }

    return log;
  }

  /**
   * Get security statistics
   */
  async getStats(filters?: { dateFrom?: string; dateTo?: string }) {
    const where: Prisma.SecurityAuditLogWhereInput = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const [total, byAction, bySuccess, highRisk] = await Promise.all([
      this.prisma.securityAuditLog.count({ where }),
      this.prisma.securityAuditLog.groupBy({
        by: ["action"],
        where,
        _count: true,
      }),
      this.prisma.securityAuditLog.groupBy({
        by: ["success"],
        where,
        _count: true,
      }),
      this.prisma.securityAuditLog.count({
        where: {
          ...where,
          riskScore: { gte: 70 },
        },
      }),
    ]);

    const actionCounts = byAction.reduce(
      (acc, item) => {
        acc[item.action] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const successCounts = bySuccess.reduce(
      (acc, item) => {
        acc[item.success ? "success" : "failed"] = item._count;
        return acc;
      },
      { success: 0, failed: 0 }
    );

    return {
      total,
      byAction: actionCounts,
      bySuccess: successCounts,
      highRiskCount: highRisk,
    };
  }

  /**
   * Get logs for a specific user
   */
  async getUserLogs(userId: string, filters: SecurityAuditFiltersDto) {
    return this.getAll({ ...filters, userId });
  }

  /**
   * Get high-risk logs
   */
  async getHighRisk(filters: SecurityAuditFiltersDto) {
    return this.getAll({
      ...filters,
      riskScoreMin: filters.riskScoreMin || 70,
    });
  }
}
