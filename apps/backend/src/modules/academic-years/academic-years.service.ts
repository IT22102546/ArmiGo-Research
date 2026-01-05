import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database";
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  AcademicYearQueryDto,
} from "./dto/academic-year.dto";
import { AcademicYear } from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createAcademicYearDto: CreateAcademicYearDto
  ): Promise<AcademicYear> {
    // If setting as current, unset all other current academic years
    if (createAcademicYearDto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.create({
      data: createAcademicYearDto,
    });
  }

  async findAll(query?: AcademicYearQueryDto) {
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
      where.year = { contains: search, mode: "insensitive" };
    }

    const [academicYears, total] = await Promise.all([
      this.prisma.academicYear.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
      }),
      this.prisma.academicYear.count({ where }),
    ]);

    return {
      academicYears,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<any> {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
    });

    if (!academicYear) {
      throw AppException.notFound(
        ErrorCode.ACADEMIC_YEAR_NOT_FOUND,
        `Academic Year with ID ${id} not found`
      );
    }

    // Get related counts separately
    const [classesCount, examsCount] = await Promise.all([
      this.prisma.class.count({ where: { deletedAt: null } }),
      this.prisma.exam.count({ where: { deletedAt: null } }),
    ]);

    return {
      ...academicYear,
      _count: {
        classes: classesCount,
        exams: examsCount,
        studentProfiles: 0, // These don't have FK relations to AcademicYear yet
      },
    };
  }

  async findCurrent(): Promise<AcademicYear | null> {
    return this.prisma.academicYear.findFirst({
      where: { isCurrent: true, isActive: true },
    });
  }

  async update(
    id: string,
    updateAcademicYearDto: UpdateAcademicYearDto
  ): Promise<AcademicYear> {
    await this.findOne(id); // Check if exists

    // If setting as current, unset all other current academic years
    if (updateAcademicYearDto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: {
          isCurrent: true,
          id: { not: id },
        },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.update({
      where: { id },
      data: updateAcademicYearDto,
    });
  }

  async remove(id: string): Promise<AcademicYear> {
    await this.findOne(id); // Check if exists

    // Soft delete by setting isActive to false
    return this.prisma.academicYear.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string): Promise<AcademicYear> {
    await this.findOne(id); // Check if exists

    return this.prisma.academicYear.delete({
      where: { id },
    });
  }
}
