import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import {
  UserRole,
  AnnouncementPriority,
  AnnouncementType,
} from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementFiltersDto,
} from "./dto";

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAnnouncementDto, createdById: string) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        priority: dto.priority,
        targetRoles: dto.targetRoles || [],
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        attachments: dto.attachments || [],
        metadata: dto.metadata || {},
        createdById,
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        grades: {
          include: {
            grade: true,
          },
        },
      },
    });

    // Create grade associations if provided
    if (dto.targetGrades && dto.targetGrades.length > 0) {
      await this.prisma.announcementGrade.createMany({
        data: dto.targetGrades.map((gradeId) => ({
          announcementId: announcement.id,
          gradeId,
        })),
        skipDuplicates: true,
      });
    }

    this.logger.log(`Announcement created: ${announcement.id}`);
    return announcement;
  }

  async getAll(filters: AnnouncementFiltersDto) {
    const {
      page = 1,
      limit = 20,
      type,
      isActive,
      search,
      priorityMin,
      targetRole,
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (targetRole) {
      where.targetRoles = { has: targetRole };
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          grades: {
            include: {
              grade: true,
            },
          },
          _count: {
            select: {
              reads: true,
            },
          },
        },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      data: announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserAnnouncements(
    userId: string,
    userRole: UserRole,
    filters: AnnouncementFiltersDto
  ) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const now = new Date();

    // Get user's grade if they are a student
    let userGradeId: string | null = null;
    if (
      userRole === UserRole.INTERNAL_STUDENT ||
      userRole === UserRole.EXTERNAL_STUDENT
    ) {
      const studentProfile = await this.prisma.studentProfile.findFirst({
        where: { userId },
        select: { gradeId: true },
      });
      userGradeId = studentProfile?.gradeId || null;
    }

    const where: any = {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [
        {
          OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
        },
        {
          OR: [
            { targetRoles: { isEmpty: true } },
            { targetRoles: { has: userRole } },
          ],
        },
      ],
    };

    // Add grade filter for students
    if (userGradeId) {
      where.AND.push({
        OR: [
          { grades: { none: {} } },
          { grades: { some: { gradeId: userGradeId } } },
        ],
      });
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          reads: {
            where: { userId },
            select: { readAt: true },
          },
        },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      data: announcements.map((a) => ({
        ...a,
        isRead: a.reads.length > 0,
        readAt: a.reads[0]?.readAt || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    // Get user's role and grade
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        studentProfile: {
          select: { gradeId: true },
        },
      },
    });

    if (!user) {
      return { unreadCount: 0 };
    }

    const now = new Date();
    const userGradeId = user.studentProfile?.gradeId;

    const where: any = {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [
        {
          OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
        },
        {
          OR: [
            { targetRoles: { isEmpty: true } },
            { targetRoles: { has: user.role } },
          ],
        },
        {
          reads: {
            none: { userId },
          },
        },
      ],
    };

    if (userGradeId) {
      where.AND.push({
        OR: [
          { grades: { none: {} } },
          { grades: { some: { gradeId: userGradeId } } },
        ],
      });
    }

    const unreadCount = await this.prisma.announcement.count({ where });

    return { unreadCount };
  }

  async getDetail(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        grades: {
          include: {
            grade: true,
          },
        },
        _count: {
          select: {
            reads: true,
          },
        },
      },
    });

    if (!announcement) {
      throw AppException.notFound(
        ErrorCode.ANNOUNCEMENT_NOT_FOUND,
        "Announcement not found"
      );
    }

    return announcement;
  }

  async getStatistics(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reads: true,
          },
        },
      },
    });

    if (!announcement) {
      throw AppException.notFound(
        ErrorCode.ANNOUNCEMENT_NOT_FOUND,
        "Announcement not found"
      );
    }

    // Get target user count
    const targetCount = await this.getTargetUserCount(announcement);

    return {
      id: announcement.id,
      title: announcement.title,
      readCount: announcement._count.reads,
      targetCount,
      readPercentage:
        targetCount > 0
          ? Math.round((announcement._count.reads / targetCount) * 100)
          : 0,
    };
  }

  private async getTargetUserCount(announcement: any): Promise<number> {
    const where: any = {};

    if (announcement.targetRoles && announcement.targetRoles.length > 0) {
      where.role = { in: announcement.targetRoles };
    }

    return this.prisma.user.count({ where });
  }

  async markAsRead(announcementId: string, userId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw AppException.notFound(
        ErrorCode.ANNOUNCEMENT_NOT_FOUND,
        "Announcement not found"
      );
    }

    await this.prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
      create: {
        announcementId,
        userId,
      },
      update: {
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw AppException.notFound(
        ErrorCode.ANNOUNCEMENT_NOT_FOUND,
        "Announcement not found"
      );
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        priority: dto.priority,
        targetRoles: dto.targetRoles,
        isActive: dto.isActive,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        attachments: dto.attachments,
        metadata: dto.metadata,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update grade associations if provided
    if (dto.targetGrades !== undefined) {
      await this.prisma.announcementGrade.deleteMany({
        where: { announcementId: id },
      });

      if (dto.targetGrades.length > 0) {
        await this.prisma.announcementGrade.createMany({
          data: dto.targetGrades.map((gradeId) => ({
            announcementId: id,
            gradeId,
          })),
        });
      }
    }

    this.logger.log(`Announcement updated: ${id}`);
    return updated;
  }

  async delete(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw AppException.notFound(
        ErrorCode.ANNOUNCEMENT_NOT_FOUND,
        "Announcement not found"
      );
    }

    // Delete related reads and grades
    await this.prisma.announcementRead.deleteMany({
      where: { announcementId: id },
    });
    await this.prisma.announcementGrade.deleteMany({
      where: { announcementId: id },
    });

    await this.prisma.announcement.delete({
      where: { id },
    });

    this.logger.log(`Announcement deleted: ${id}`);
    return { success: true };
  }

  async deactivate(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw AppException.notFound(
        ErrorCode.ANNOUNCEMENT_NOT_FOUND,
        "Announcement not found"
      );
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Announcement deactivated: ${id}`);
    return updated;
  }

  async extendExpiry(id: string, expiresAt: Date) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw AppException.notFound(
        ErrorCode.ANNOUNCEMENT_NOT_FOUND,
        "Announcement not found"
      );
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { expiresAt: new Date(expiresAt) },
    });

    this.logger.log(`Announcement expiry extended: ${id}`);
    return updated;
  }
}
