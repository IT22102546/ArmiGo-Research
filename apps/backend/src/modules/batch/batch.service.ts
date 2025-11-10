import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class BatchService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: { gradeId?: string; isActive?: boolean }) {
    const where: any = {};
    if (filters?.gradeId) {where.gradeId = filters.gradeId;}
    if (typeof filters?.isActive === "boolean")
      {where.isActive = filters.isActive;}

    const batches = await this.prisma.batch.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        grade: true,
      },
    });
    return batches;
  }

  async findByGrade(gradeId: string) {
    return this.prisma.batch.findMany({
      where: { gradeId },
      orderBy: { name: "asc" },
      include: { grade: true },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: { grade: true },
    });
    if (!batch)
      {throw AppException.notFound(
        ErrorCode.BATCH_NOT_FOUND,
        `Batch with ID ${id} not found`
      );}
    return batch;
  }

  async create(data: { name: string; code?: string; gradeId: string }) {
    // Ensure grade exists
    const grade = await this.prisma.grade.findUnique({
      where: { id: data.gradeId },
    });
    if (!grade)
      {throw AppException.notFound(ErrorCode.GRADE_NOT_FOUND, "Grade not found");}

    // Generate code if not provided
    const code = (data.code || data.name).replace(/\s+/g, "-").toUpperCase();

    // Check uniqueness within the same grade
    const existing = await this.prisma.batch.findFirst({
      where: {
        gradeId: data.gradeId,
        code: code,
      },
    });
    if (existing)
      {throw AppException.badRequest(
        ErrorCode.BATCH_ALREADY_EXISTS,
        "Batch with this code already exists in this grade"
      );}

    const batch = await this.prisma.batch.create({
      data: {
        name: data.name,
        code,
        gradeId: data.gradeId,
        isActive: true,
      },
      include: { grade: true },
    });
    return batch;
  }

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      gradeId?: string;
      isActive?: boolean;
    }
  ) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch)
      {throw AppException.notFound(
        ErrorCode.BATCH_NOT_FOUND,
        `Batch with ID ${id} not found`
      );}

    // Check if code is being changed and validate uniqueness within the grade
    const targetGradeId = data.gradeId || batch.gradeId;
    const newCode = data.code
      ? data.code.replace(/\s+/g, "-").toUpperCase()
      : batch.code;

    if (newCode !== batch.code || targetGradeId !== batch.gradeId) {
      const existing = await this.prisma.batch.findFirst({
        where: {
          gradeId: targetGradeId,
          code: newCode,
          NOT: { id: batch.id },
        },
      });
      if (existing)
        {throw AppException.badRequest(
          ErrorCode.BATCH_ALREADY_EXISTS,
          "Batch with this code already exists in this grade"
        );}
    }

    const updated = await this.prisma.batch.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code
          ? data.code.replace(/\s+/g, "-").toUpperCase()
          : undefined,
        gradeId: data.gradeId,
        isActive: data.isActive,
      },
      include: { grade: true },
    });
    return updated;
  }

  async remove(id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch)
      {throw AppException.notFound(
        ErrorCode.BATCH_NOT_FOUND,
        `Batch with ID ${id} not found`
      );}
    await this.prisma.batch.delete({ where: { id } });
    return { message: "Batch deleted successfully" };
  }
}
