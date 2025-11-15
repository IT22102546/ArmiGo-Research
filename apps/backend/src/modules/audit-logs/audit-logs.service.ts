import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { AuditAction } from "@prisma/client";

export interface CreateAuditLogDto {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  httpMethod?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

export interface AuditLogQueryDto {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async create(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        endpoint: data.endpoint,
        httpMethod: data.httpMethod,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  /**
   * Get audit logs with filtering
   */
  async findAll(query: AuditLogQueryDto) {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = query;

    const where: any = {};

    if (userId) {where.userId = userId;}
    if (action) {where.action = action;}
    if (resource) {where.resource = resource;}
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {where.createdAt.gte = startDate;}
      if (endDate) {where.createdAt.lte = endDate;}
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
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
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
        newValues: log.newValues ? JSON.parse(log.newValues) : null,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit log by ID
   */
  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
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
      },
    });

    if (!log) {return null;}

    return {
      ...log,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    };
  }

  /**
   * Get audit logs for a specific user
   */
  async findByUser(userId: string, limit = 50) {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return logs.map((log) => ({
      ...log,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
  }

  /**
   * Get audit logs for a specific resource
   */
  async findByResource(resource: string, resourceId: string, limit = 50) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        resource,
        resourceId,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
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
    });

    return logs.map((log) => ({
      ...log,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 100) {
    const logs = await this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
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
      },
    });

    return logs.map((log) => ({
      id: log.id,
      userName: log.user
        ? `${log.user.firstName} ${log.user.lastName}`
        : "System",
      userEmail: log.user?.email,
      userRole: log.user?.role,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      createdAt: log.createdAt,
      ipAddress: log.ipAddress,
    }));
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {where.createdAt.gte = startDate;}
      if (endDate) {where.createdAt.lte = endDate;}
    }

    const [actionStats, resourceStats, totalLogs, uniqueUserStats] =
      await Promise.all([
        this.prisma.auditLog.groupBy({
          by: ["action"],
          where,
          _count: true,
        }),
        this.prisma.auditLog.groupBy({
          by: ["resource"],
          where,
          _count: true,
        }),
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.groupBy({
          by: ["userId"],
          where: { ...where, userId: { not: null } },
        }),
      ]);

    return {
      totalLogs,
      uniqueUsers: uniqueUserStats.length,
      actionCounts: actionStats.reduce(
        (acc, stat) => {
          acc[stat.action] = stat._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      resourceCounts: resourceStats.reduce(
        (acc, stat) => {
          acc[stat.resource] = stat._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
