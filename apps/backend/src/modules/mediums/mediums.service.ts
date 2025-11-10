import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database";
import {
  CreateMediumDto,
  UpdateMediumDto,
  MediumQueryDto,
} from "./dto/medium.dto";
import { Medium } from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class MediumsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMediumDto: CreateMediumDto): Promise<Medium> {
    // Determine next sortOrder
    const max = await this.prisma.medium.aggregate({
      _max: { sortOrder: true },
    });
    const nextOrder = (max._max.sortOrder ?? 0) + 1;
    return this.prisma.medium.create({
      data: { ...createMediumDto, sortOrder: nextOrder },
    });
  }

  async findAll(query?: MediumQueryDto) {
    const {
      page = 1,
      limit = 100,
      search,
      includeInactive = false,
    } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [mediums, total] = await Promise.all([
      this.prisma.medium.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.medium.count({ where }),
    ]);

    return {
      mediums,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Medium> {
    const medium = await this.prisma.medium.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classes: true,
            exams: true,
            studentProfiles: true,
          },
        },
      },
    });

    if (!medium) {
      throw AppException.notFound(
        ErrorCode.MEDIUM_NOT_FOUND,
        `Medium with ID ${id} not found`
      );
    }

    return medium as any;
  }

  async update(id: string, updateMediumDto: UpdateMediumDto): Promise<Medium> {
    await this.findOne(id); // Check if exists

    return this.prisma.medium.update({
      where: { id },
      data: updateMediumDto,
    });
  }

  async remove(id: string): Promise<Medium> {
    await this.findOne(id); // Check if exists

    // Soft delete by setting isActive to false
    return this.prisma.medium.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string): Promise<Medium> {
    await this.findOne(id); // Check if exists

    return this.prisma.medium.delete({
      where: { id },
    });
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    if (!items || items.length === 0)
      {return { message: "No mediums to reorder" };}

    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.medium.update({
          where: { id: it.id },
          data: { sortOrder: it.sortOrder },
        })
      )
    );

    const mediums = await this.prisma.medium.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { message: "Medium order updated successfully", mediums };
  }
}
