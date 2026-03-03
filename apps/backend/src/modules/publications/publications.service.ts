import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { CreatePublicationDto, UpdatePublicationDto } from "./dtos/publication.dto";

@Injectable()
export class PublicationsService {
  constructor(private readonly prisma: PrismaService) {}

  private get publicationModel() {
    const model = (this.prisma as any).publication;
    if (!model) {
      throw new InternalServerErrorException(
        "Publication model is not available in Prisma client. Run 'pnpm db:generate' and apply migrations, then restart backend."
      );
    }
    return model;
  }

  private getSkipTake(page?: number, limit?: number) {
    const resolvedPage = Number(page || 1);
    const resolvedLimit = Number(limit || 20);
    return {
      page: resolvedPage,
      limit: resolvedLimit,
      skip: (resolvedPage - 1) * resolvedLimit,
      take: resolvedLimit,
    };
  }

  async getAll(options: {
    userId: string;
    role?: string;
    scopedHospitalId?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip, take } = this.getSkipTake(options.page, options.limit);

    const where: any = {};

    if (options.search?.trim()) {
      const search = options.search.trim();
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }

    const role = options.role || "";

    if (role === "PARENT") {
      where.status = "PUBLISHED";

      const parent = await this.prisma.user.findUnique({
        where: { id: options.userId },
        select: {
          parentProfile: {
            select: {
              children: {
                select: {
                  hospitalId: true,
                },
              },
            },
          },
        },
      });

      const hospitalIds = Array.from(
        new Set(
          (parent?.parentProfile?.children || [])
            .map((child) => child.hospitalId)
            .filter((value): value is string => Boolean(value))
        )
      );

      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { hospitalId: null },
            ...(hospitalIds.length > 0 ? [{ hospitalId: { in: hospitalIds } }] : []),
          ],
        },
      ];
    } else if (options.scopedHospitalId) {
      if (options.status && options.status !== "all") {
        where.status = options.status;
      }
      where.AND = [
        ...(where.AND || []),
        {
          OR: [{ hospitalId: null }, { hospitalId: options.scopedHospitalId }],
        },
      ];
    } else if (options.status && options.status !== "all") {
      where.status = options.status;
    }

    const [rows, total] = await Promise.all([
      this.publicationModel.findMany({
        where,
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take,
      }),
      this.publicationModel.count({ where }),
    ]);

    return {
      publications: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string, options: { userId: string; role?: string; scopedHospitalId?: string }) {
    const publication = await this.publicationModel.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException("Publication not found");
    }

    if (options.role === "PARENT") {
      const parent = await this.prisma.user.findUnique({
        where: { id: options.userId },
        select: {
          parentProfile: {
            select: {
              children: {
                select: {
                  hospitalId: true,
                },
              },
            },
          },
        },
      });

      const hospitalIds = new Set(
        (parent?.parentProfile?.children || [])
          .map((child) => child.hospitalId)
          .filter((value): value is string => Boolean(value))
      );

      const canView =
        publication.status === "PUBLISHED" &&
        (publication.hospitalId === null || hospitalIds.has(publication.hospitalId));

      if (!canView) {
        throw new ForbiddenException("You do not have access to this publication");
      }
    }

    if (
      options.scopedHospitalId &&
      publication.hospitalId !== null &&
      publication.hospitalId !== options.scopedHospitalId
    ) {
      throw new ForbiddenException("You do not have access to this publication");
    }

    return publication;
  }

  async create(
    data: CreatePublicationDto,
    options: { userId: string; scopedHospitalId?: string }
  ) {
    if (!data.fileUrl?.trim()) {
      throw new BadRequestException("Publication file URL is required");
    }

    return this.publicationModel.create({
      data: {
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price ?? 0,
        discountPrice: data.discountPrice,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        fileType: data.fileType,
        coverImage: data.coverImage,
        gradeId: data.gradeId,
        subjectId: data.subjectId,
        mediumId: data.mediumId,
        author: data.author,
        publisher: data.publisher,
        status: data.status || "DRAFT",
        createdById: options.userId,
        hospitalId: options.scopedHospitalId || null,
        publishedAt: (data.status || "DRAFT") === "PUBLISHED" ? new Date() : null,
      },
    });
  }

  async update(
    id: string,
    data: UpdatePublicationDto,
    options: { userId: string; role?: string; scopedHospitalId?: string }
  ) {
    const existing = await this.publicationModel.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        hospitalId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Publication not found");
    }

    const isSuperAdmin = options.role === "SUPER_ADMIN";
    const isOwner = existing.createdById === options.userId;

    if (!isSuperAdmin && !isOwner) {
      throw new ForbiddenException("You can update only your own publication");
    }

    if (
      options.scopedHospitalId &&
      existing.hospitalId !== options.scopedHospitalId
    ) {
      throw new ForbiddenException("You can update only your hospital publications");
    }

    return this.publicationModel.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.shortDescription !== undefined
          ? { shortDescription: data.shortDescription }
          : {}),
        ...(data.price !== undefined ? { price: data.price } : { price: 0 }),
        ...(data.discountPrice !== undefined
          ? { discountPrice: data.discountPrice }
          : { discountPrice: null }),
        ...(data.fileUrl !== undefined ? { fileUrl: data.fileUrl } : {}),
        ...(data.fileSize !== undefined ? { fileSize: data.fileSize } : {}),
        ...(data.fileType !== undefined ? { fileType: data.fileType } : {}),
        ...(data.coverImage !== undefined ? { coverImage: data.coverImage } : {}),
        ...(data.gradeId !== undefined ? { gradeId: data.gradeId } : {}),
        ...(data.subjectId !== undefined ? { subjectId: data.subjectId } : {}),
        ...(data.mediumId !== undefined ? { mediumId: data.mediumId } : {}),
        ...(data.author !== undefined ? { author: data.author } : {}),
        ...(data.publisher !== undefined ? { publisher: data.publisher } : {}),
        ...(data.status !== undefined
          ? {
              status: data.status,
              ...(data.status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
            }
          : {}),
      },
    });
  }

  async delete(id: string, options: { userId: string; role?: string; scopedHospitalId?: string }) {
    const existing = await this.publicationModel.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        hospitalId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Publication not found");
    }

    const isSuperAdmin = options.role === "SUPER_ADMIN";
    const isOwner = existing.createdById === options.userId;

    if (!isSuperAdmin && !isOwner) {
      throw new ForbiddenException("You can delete only your own publication");
    }

    if (
      options.scopedHospitalId &&
      existing.hospitalId !== options.scopedHospitalId
    ) {
      throw new ForbiddenException("You can delete only your hospital publications");
    }

    await this.publicationModel.delete({ where: { id } });
    return { message: "Publication deleted successfully" };
  }
}
