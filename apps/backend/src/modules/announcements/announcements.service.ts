import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  AnnouncementListQueryDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './dtos/announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnnouncements(query: AnnouncementListQueryDto) {
    const page = Number(query?.page || 1);
    const limit = Number(query?.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.type && query.type !== 'ALL') {
      where.type = query.type;
    }

    if (query?.status === 'ACTIVE') {
      where.isActive = true;
    } else if (query?.status === 'INACTIVE') {
      where.isActive = false;
    }

    if (query?.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      items: rows.map((item) => this.toAnnouncementResponse(item)),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAnnouncementById(id: string) {
    const row = await this.prisma.announcement.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return this.toAnnouncementResponse(row);
  }

  async createAnnouncement(body: CreateAnnouncementDto) {
    const row = await this.prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        type: body.type || 'GENERAL',
        priority: body.priority || 'NORMAL',
        targetRoles: body.targetRoles || [],
        isActive: true,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    return this.toAnnouncementResponse(row);
  }

  async updateAnnouncement(id: string, body: UpdateAnnouncementDto) {
    await this.ensureExists(id);

    const row = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.targetRoles !== undefined ? { targetRoles: body.targetRoles } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.publishedAt !== undefined
          ? { publishedAt: body.publishedAt ? new Date(body.publishedAt) : null }
          : {}),
        ...(body.expiresAt !== undefined
          ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }
          : {}),
      },
    });

    return this.toAnnouncementResponse(row);
  }

  async updateAnnouncementStatus(id: string, isActive: boolean) {
    await this.ensureExists(id);

    const row = await this.prisma.announcement.update({
      where: { id },
      data: { isActive },
    });

    return this.toAnnouncementResponse(row);
  }

  async extendAnnouncementExpiry(id: string, days = 30) {
    await this.ensureExists(id);

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + days);

    const row = await this.prisma.announcement.update({
      where: { id },
      data: { expiresAt: baseDate },
    });

    return this.toAnnouncementResponse(row);
  }

  async deleteAnnouncement(id: string) {
    await this.ensureExists(id);

    await this.prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted successfully' };
  }

  async getAnnouncementStats(id: string) {
    const row = await this.prisma.announcement.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return {
      total: 0,
      unread: 0,
      byRole: (row.targetRoles || []).map((role) => ({ role, count: 0 })),
    };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.announcement.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }
  }

  private toAnnouncementResponse(item: any) {
    return {
      id: item.id,
      title: item.title,
      content: item.content,
      type: item.type,
      priority: item.priority,
      targetRoles: item.targetRoles || [],
      isActive: item.isActive,
      publishedAt: item.publishedAt,
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
      _count: {
        reads: 0,
      },
    };
  }
}
