import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database";
import { CreateGradeDto, UpdateGradeDto, GradeQueryDto } from "./dto/grade.dto";
import { Grade } from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGradeDto: CreateGradeDto): Promise<Grade> {
    // Ensure name uniqueness
    const existing = await this.prisma.grade.findUnique({
      where: { name: createGradeDto.name },
    });
    if (existing)
      {throw AppException.conflict(
        ErrorCode.GRADE_ALREADY_EXISTS,
        "Grade with this name already exists"
      );}

    // Ensure level uniqueness if provided
    if (createGradeDto.level !== undefined) {
      const existingLevel = await this.prisma.grade.findUnique({
        where: { level: createGradeDto.level },
      });
      if (existingLevel)
        {throw AppException.conflict(
          ErrorCode.GRADE_ALREADY_EXISTS,
          "Grade with this level already exists"
        );}
    }

    const max: any = await this.prisma.grade.aggregate({
      _max: { sortOrder: true },
    } as any);
    const nextOrder = ((max?._max?.sortOrder ?? 0) as number) + 1;
    const payload: any = {
      ...createGradeDto,
      sortOrder:
        createGradeDto?.sortOrder ?? createGradeDto?.level ?? nextOrder,
    };
    return this.prisma.grade.create({ data: payload });
  }

  async findAll(query?: GradeQueryDto) {
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

    const [grades, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: "asc" } as any,
      }),
      this.prisma.grade.count({ where }),
    ]);

    return {
      grades,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Grade> {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            batches: true,
            classes: true,
            exams: true,
            studentProfiles: true,
          },
        },
      },
    });

    if (!grade) {
      throw AppException.notFound(
        ErrorCode.GRADE_NOT_FOUND,
        `Grade with ID ${id} not found`
      );
    }

    return grade as any;
  }

  async update(id: string, updateGradeDto: UpdateGradeDto): Promise<Grade> {
    const grade = await this.findOne(id); // Check if exists

    // Ensure name uniqueness
    if (updateGradeDto.name && updateGradeDto.name !== grade.name) {
      const existing = await this.prisma.grade.findUnique({
        where: { name: updateGradeDto.name },
      });
      if (existing)
        {throw AppException.conflict(
          ErrorCode.GRADE_ALREADY_EXISTS,
          "Grade with this name already exists"
        );}
    }

    // Ensure level uniqueness
    if (
      updateGradeDto.level !== undefined &&
      updateGradeDto.level !== grade.level
    ) {
      const existingLevel = await this.prisma.grade.findUnique({
        where: { level: updateGradeDto.level },
      });
      if (existingLevel)
        {throw AppException.conflict(
          ErrorCode.GRADE_ALREADY_EXISTS,
          "Grade with this level already exists"
        );}
    }

    return this.prisma.grade.update({
      where: { id },
      data: updateGradeDto,
    });
  }

  async remove(id: string): Promise<Grade> {
    await this.findOne(id); // Check if exists

    // Soft delete by setting isActive to false
    return this.prisma.grade.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string): Promise<Grade> {
    await this.findOne(id); // Check if exists

    return this.prisma.grade.delete({
      where: { id },
    });
  }
}
