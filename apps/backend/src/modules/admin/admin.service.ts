import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";
import {
  CreateGradeDto,
  UpdateGradeDto,
  CreateProvinceDto,
  UpdateProvinceDto,
  CreateDistrictDto,
  UpdateDistrictDto,
  CreateZoneDto,
  UpdateZoneDto,
  CreateMediumDto,
  UpdateMediumDto,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  CreateSubjectCodeDto,
  UpdateSubjectCodeDto,
  CreateInstitutionDto,
  UpdateInstitutionDto,
  CreateTeacherSubjectAssignmentDto,
  UpdateTeacherSubjectAssignmentDto,
} from "./dto/admin.dto";

@Injectable()
export class AdminService {
  constructor(
    public prisma: PrismaService,
    private readonly walletService: WalletService
  ) {}

  // ==================== GRADES ====================
  async getGrades() {
    const grades = await this.prisma.grade.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return {
      total: grades.length,
      grades,
    };
  }

  async createGrade(dto: CreateGradeDto) {
    const existing = await this.prisma.grade.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw AppException.badRequest(
        ErrorCode.GRADE_ALREADY_EXISTS,
        "Grade with this name already exists"
      );
    }

    // Find the next available level (1-11)
    const existingGrades = await this.prisma.grade.findMany({
      select: { level: true },
      orderBy: { level: "desc" },
    });

    const usedLevels = new Set(existingGrades.map((g) => g.level));
    let nextLevel = 1;
    while (nextLevel <= 11 && usedLevels.has(nextLevel)) {
      nextLevel++;
    }

    if (nextLevel > 11) {
      throw AppException.badRequest(
        ErrorCode.MAX_GRADES_REACHED,
        "Maximum number of grades (11) reached"
      );
    }

    const computedCode = (dto.code || dto.name)
      .replace(/\s+/g, "-")
      .toUpperCase();

    const max: any = await this.prisma.grade.aggregate({
      _max: { sortOrder: true },
    } as any);
    const nextOrder = ((max?._max?.sortOrder ?? 0) as number) + 1;

    const grade = await this.prisma.grade.create({
      data: {
        name: dto.name,
        code: computedCode,
        level: nextLevel,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? nextOrder,
      },
    });

    return {
      message: "Grade created successfully",
      grade,
    };
  }

  async updateGrade(id: string, dto: UpdateGradeDto) {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) {
      throw AppException.notFound(ErrorCode.GRADE_NOT_FOUND, "Grade not found");
    }

    if (dto.name && dto.name !== grade.name) {
      const existing = await this.prisma.grade.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw AppException.badRequest(
          ErrorCode.GRADE_ALREADY_EXISTS,
          "Grade with this name already exists"
        );
      }
    }

    // Ensure level uniqueness
    if (dto.level && dto.level !== grade.level) {
      const existingLevel = await this.prisma.grade.findUnique({
        where: { level: dto.level },
      });
      if (existingLevel) {
        throw AppException.badRequest(
          ErrorCode.GRADE_ALREADY_EXISTS,
          "Grade with this level already exists"
        );
      }
    }

    const updated = await this.prisma.grade.update({
      where: { id },
      data: dto,
    });

    return {
      message: "Grade updated successfully",
      grade: updated,
    };
  }

  async deleteGrade(id: string) {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) {
      throw AppException.notFound(ErrorCode.GRADE_NOT_FOUND, "Grade not found");
    }

    await this.prisma.grade.delete({ where: { id } });

    return {
      message: "Grade deleted successfully",
    };
  }

  // ==================== PROVINCES ====================
  async getProvinces() {
    const provinces = await this.prisma.province.findMany({
      include: {
        _count: {
          select: { districts: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return {
      total: provinces.length,
      provinces,
    };
  }

  async createProvince(dto: CreateProvinceDto) {
    const existing = await this.prisma.province.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw AppException.badRequest(
        ErrorCode.DUPLICATE_ENTRY,
        "Province with this name already exists"
      );
    }

    // Generate unique code
    let code = (dto.code || dto.name).replace(/\s+/g, "-").toUpperCase();
    const codeExists = await this.prisma.province.findUnique({
      where: { code },
    });
    if (codeExists) {
      // Append a unique suffix
      const count = await this.prisma.province.count();
      code = `${code}-${count + 1}`;
    }

    // Find max sortOrder
    const max = await this.prisma.province.aggregate({
      _max: { sortOrder: true },
    });
    const nextOrder = (max._max.sortOrder ?? 0) + 1;
    const province = await this.prisma.province.create({
      data: {
        name: dto.name,
        code,
        sortOrder: dto.sortOrder ?? nextOrder,
      },
    });

    return {
      message: "Province created successfully",
      province,
    };
  }

  async updateProvince(id: string, dto: UpdateProvinceDto) {
    const province = await this.prisma.province.findUnique({ where: { id } });
    if (!province) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Province not found"
      );
    }

    if (dto.name && dto.name !== province.name) {
      const existing = await this.prisma.province.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw AppException.badRequest(
          ErrorCode.DUPLICATE_ENTRY,
          "Province with this name already exists"
        );
      }
    }

    if (dto.code && dto.code !== province.code) {
      const codeExists = await this.prisma.province.findUnique({
        where: { code: dto.code },
      });
      if (codeExists) {
        throw AppException.badRequest(
          ErrorCode.DUPLICATE_ENTRY,
          "Province with this code already exists"
        );
      }
    }

    const updated = await this.prisma.province.update({
      where: { id },
      data: dto,
    });

    return {
      message: "Province updated successfully",
      province: updated,
    };
  }

  async deleteProvince(id: string) {
    const province = await this.prisma.province.findUnique({ where: { id } });
    if (!province) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Province not found"
      );
    }

    await this.prisma.province.delete({ where: { id } });

    return {
      message: "Province deleted successfully",
    };
  }

  async reorderProvinces(items: { id: string; sortOrder: number }[]) {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.province.update({
          where: { id: it.id },
          data: { sortOrder: it.sortOrder },
        })
      )
    );

    const provinces = await this.prisma.province.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { message: "Province order updated successfully", provinces };
  }

  // ==================== DISTRICTS ====================
  async getDistricts(provinceId?: string) {
    const where = provinceId ? { provinceId } : {};

    const districts = await this.prisma.district.findMany({
      where,
      include: {
        province: true,
        _count: {
          select: { zones: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return {
      total: districts.length,
      districts,
    };
  }

  async createDistrict(dto: CreateDistrictDto) {
    const existing = await this.prisma.district.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw AppException.badRequest(
        ErrorCode.DUPLICATE_ENTRY,
        "District with this name already exists"
      );
    }

    // Generate unique code
    let code = (dto.code || dto.name).replace(/\s+/g, "-").toUpperCase();
    const codeExists = await this.prisma.district.findUnique({
      where: { code },
    });
    if (codeExists) {
      const count = await this.prisma.district.count();
      code = `${code}-${count + 1}`;
    }

    // determine next sort order within province
    const max = await this.prisma.district.aggregate({
      _max: { sortOrder: true },
      where: { provinceId: dto.provinceId ?? undefined },
    });
    const nextOrder = (max._max.sortOrder ?? 0) + 1;
    const district = await this.prisma.district.create({
      data: {
        name: dto.name,
        code,
        provinceId: dto.provinceId,
        sortOrder: dto.sortOrder ?? nextOrder,
      },
      include: {
        province: true,
      },
    });

    return {
      message: "District created successfully",
      district,
    };
  }

  async updateDistrict(id: string, dto: UpdateDistrictDto) {
    const district = await this.prisma.district.findUnique({ where: { id } });
    if (!district) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "District not found"
      );
    }

    if (dto.name && dto.name !== district.name) {
      const existing = await this.prisma.district.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw AppException.badRequest(
          ErrorCode.DUPLICATE_ENTRY,
          "District with this name already exists"
        );
      }
    }

    if (dto.code && dto.code !== district.code) {
      const codeExists = await this.prisma.district.findUnique({
        where: { code: dto.code },
      });
      if (codeExists) {
        throw AppException.badRequest(
          ErrorCode.DUPLICATE_ENTRY,
          "District with this code already exists"
        );
      }
    }

    const updated = await this.prisma.district.update({
      where: { id },
      data: dto,
      include: {
        province: true,
      },
    });

    return {
      message: "District updated successfully",
      district: updated,
    };
  }

  async reorderDistricts(items: { id: string; sortOrder: number }[]) {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.district.update({
          where: { id: it.id },
          data: { sortOrder: it.sortOrder },
        })
      )
    );
    const districts = await this.prisma.district.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { message: "District order updated successfully", districts };
  }

  async deleteDistrict(id: string) {
    const district = await this.prisma.district.findUnique({ where: { id } });
    if (!district) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "District not found"
      );
    }

    await this.prisma.district.delete({ where: { id } });

    return {
      message: "District deleted successfully",
    };
  }

  // ==================== ZONES ====================
  async getZones(districtId?: string) {
    const where = districtId ? { districtId } : {};

    const zones = await this.prisma.zone.findMany({
      where,
      include: {
        district: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return {
      total: zones.length,
      zones,
    };
  }

  async createZone(dto: CreateZoneDto) {
    const existing = await this.prisma.zone.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw AppException.badRequest(
        ErrorCode.DUPLICATE_ENTRY,
        "Zone with this name already exists"
      );
    }

    // Generate unique code
    let code = (dto.code || dto.name).replace(/\s+/g, "-").toUpperCase();
    const codeExists = await this.prisma.zone.findUnique({
      where: { code },
    });
    if (codeExists) {
      const count = await this.prisma.zone.count();
      code = `${code}-${count + 1}`;
    }

    const max = await this.prisma.zone.aggregate({
      _max: { sortOrder: true },
      where: { districtId: dto.districtId ?? undefined },
    });
    const nextOrder = (max._max.sortOrder ?? 0) + 1;
    const zone = await this.prisma.zone.create({
      data: {
        name: dto.name,
        code,
        districtId: dto.districtId,
        sortOrder: dto.sortOrder ?? nextOrder,
      },
      include: {
        district: true,
      },
    });

    return {
      message: "Zone created successfully",
      zone,
    };
  }

  async updateZone(id: string, dto: UpdateZoneDto) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) {
      throw AppException.notFound(ErrorCode.ZONE_NOT_FOUND, "Zone not found");
    }

    if (dto.name && dto.name !== zone.name) {
      const existing = await this.prisma.zone.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw AppException.badRequest(
          ErrorCode.DUPLICATE_ENTRY,
          "Zone with this name already exists"
        );
      }
    }

    if (dto.code && dto.code !== zone.code) {
      const codeExists = await this.prisma.zone.findUnique({
        where: { code: dto.code },
      });
      if (codeExists) {
        throw AppException.badRequest(
          ErrorCode.DUPLICATE_ENTRY,
          "Zone with this code already exists"
        );
      }
    }

    const updated = await this.prisma.zone.update({
      where: { id },
      data: dto,
      include: {
        district: true,
      },
    });

    return {
      message: "Zone updated successfully",
      zone: updated,
    };
  }

  async reorderZones(items: { id: string; sortOrder: number }[]) {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.zone.update({
          where: { id: it.id },
          data: { sortOrder: it.sortOrder },
        })
      )
    );
    const zones = await this.prisma.zone.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { message: "Zone order updated successfully", zones };
  }

  async deleteZone(id: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) {
      throw AppException.notFound(ErrorCode.ZONE_NOT_FOUND, "Zone not found");
    }

    await this.prisma.zone.delete({ where: { id } });

    return {
      message: "Zone deleted successfully",
    };
  }

  // ==================== MEDIUMS ====================
  async getMediums() {
    const mediums = await this.prisma.medium.findMany({
      orderBy: { name: "asc" },
    });

    return {
      total: mediums.length,
      mediums,
    };
  }

  async createMedium(dto: CreateMediumDto) {
    const existing = await this.prisma.medium.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw AppException.badRequest(
        ErrorCode.DUPLICATE_ENTRY,
        "Medium with this name already exists"
      );
    }

    const medium = await this.prisma.medium.create({
      data: {
        name: dto.name,
        code: (dto.code || dto.name).replace(/\s+/g, "-").toUpperCase(),
        isActive: dto.isActive ?? true,
      },
    });

    return {
      message: "Medium created successfully",
      medium,
    };
  }

  async updateMedium(id: string, dto: UpdateMediumDto) {
    const medium = await this.prisma.medium.findUnique({ where: { id } });
    if (!medium) {
      throw AppException.notFound(
        ErrorCode.MEDIUM_NOT_FOUND,
        "Medium not found"
      );
    }

    if (dto.name && dto.name !== medium.name) {
      const existing = await this.prisma.medium.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw AppException.badRequest(
          ErrorCode.DUPLICATE_ENTRY,
          "Medium with this name already exists"
        );
      }
    }

    const updated = await this.prisma.medium.update({
      where: { id },
      data: dto,
    });

    return {
      message: "Medium updated successfully",
      medium: updated,
    };
  }

  async deleteMedium(id: string) {
    const medium = await this.prisma.medium.findUnique({ where: { id } });
    if (!medium) {
      throw AppException.notFound(
        ErrorCode.MEDIUM_NOT_FOUND,
        "Medium not found"
      );
    }

    await this.prisma.medium.delete({ where: { id } });

    return {
      message: "Medium deleted successfully",
    };
  }

  // ==================== ACADEMIC YEARS ====================
  async getAcademicYears() {
    const academicYears = await this.prisma.academicYear.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return {
      total: academicYears.length,
      academicYears,
    };
  }

  async createAcademicYear(dto: CreateAcademicYearDto) {
    const existing = await this.prisma.academicYear.findUnique({
      where: { year: dto.year },
    });

    if (existing) {
      throw AppException.badRequest(
        ErrorCode.DUPLICATE_ENTRY,
        "Academic year with this year already exists"
      );
    }

    // If marking as current, unmark all others
    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const max = await this.prisma.academicYear.aggregate({
      _max: { sortOrder: true },
    });
    const nextOrder = (max._max.sortOrder ?? 0) + 1;
    const academicYear = await this.prisma.academicYear.create({
      data: {
        year: dto.year,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent ?? false,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? nextOrder,
      },
    });

    return {
      message: "Academic year created successfully",
      academicYear,
    };
  }

  async updateAcademicYear(id: string, dto: UpdateAcademicYearDto) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
    });
    if (!academicYear) {
      throw AppException.notFound(
        ErrorCode.ACADEMIC_YEAR_NOT_FOUND,
        "Academic year not found"
      );
    }

    if (dto.year && dto.year !== academicYear.year) {
      const existing = await this.prisma.academicYear.findUnique({
        where: { year: dto.year },
      });
      if (existing) {
        throw AppException.badRequest(
          ErrorCode.DUPLICATE_ENTRY,
          "Academic year with this year already exists"
        );
      }
    }

    // If marking as current, unmark all others
    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { isCurrent: true, id: { not: id } },
        data: { isCurrent: false },
      });
    }

    const updateData: any = {};
    if (dto.year) {updateData.year = dto.year;}
    if (dto.startDate) {updateData.startDate = new Date(dto.startDate);}
    if (dto.endDate) {updateData.endDate = new Date(dto.endDate);}
    if (dto.isCurrent !== undefined) {updateData.isCurrent = dto.isCurrent;}
    if (typeof (dto as any).sortOrder !== "undefined")
      {updateData.sortOrder = (dto as any).sortOrder;}
    if (dto.isActive !== undefined) {updateData.isActive = dto.isActive;}

    const updated = await this.prisma.academicYear.update({
      where: { id },
      data: updateData,
    });

    return {
      message: "Academic year updated successfully",
      academicYear: updated,
    };
  }

  async deleteAcademicYear(id: string) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
    });
    if (!academicYear) {
      throw AppException.notFound(
        ErrorCode.ACADEMIC_YEAR_NOT_FOUND,
        "Academic year not found"
      );
    }

    await this.prisma.academicYear.delete({ where: { id } });

    return {
      message: "Academic year deleted successfully",
    };
  }

  async reorderAcademicYears(items: { id: string; sortOrder: number }[]) {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.academicYear.update({
          where: { id: it.id },
          data: { sortOrder: it.sortOrder },
        })
      )
    );
    const years = await this.prisma.academicYear.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return {
      message: "Academic years order updated successfully",
      academicYears: years,
    };
  }

  // ==================== ENROLLMENT STATS ====================
  async getEnrollmentStats() {
    // Get all enrollments with related data
    const [
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      allEnrollments,
      recentEnrollments,
    ] = await Promise.all([
      this.prisma.enrollment.count(),
      this.prisma.enrollment.count({ where: { status: "ACTIVE" } }),
      this.prisma.enrollment.count({ where: { status: "COMPLETED" } }),
      // Get all enrollments with class info for grade grouping
      this.prisma.enrollment.findMany({
        include: {
          class: {
            select: {
              grade: true,
            },
          },
        },
      }),
      // Recent enrollments with full details
      this.prisma.enrollment.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              subject: {
                select: { name: true },
              },
              grade: {
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    // Calculate average completion rate
    const totalProgress = allEnrollments.reduce(
      (sum, e) => sum + (e.progress || 0),
      0
    );
    const averageCompletionRate =
      allEnrollments.length > 0 ? totalProgress / allEnrollments.length : 0;

    // Group enrollments by grade
    const gradeMap = new Map<
      string,
      { count: number; totalProgress: number }
    >();
    allEnrollments.forEach((enrollment) => {
      const gradeName = enrollment.class.grade?.name || "Unknown";
      const current = gradeMap.get(gradeName) || { count: 0, totalProgress: 0 };
      gradeMap.set(gradeName, {
        count: current.count + 1,
        totalProgress: current.totalProgress + (enrollment.progress || 0),
      });
    });

    const byGrade = Array.from(gradeMap.entries())
      .map(([gradeStr, data]) => ({
        grade:
          gradeStr === "Unknown"
            ? 0
            : parseInt(gradeStr.replace(/\D/g, "")) || 0,
        count: data.count,
        completionRate: data.count > 0 ? data.totalProgress / data.count : 0,
      }))
      .sort((a, b) => a.grade - b.grade);

    // Format recent enrollments
    const recentFormatted = recentEnrollments.map((enrollment) => ({
      id: enrollment.id,
      studentId: enrollment.studentId,
      subjectId: enrollment.classId, // Using classId as subjectId for now
      createdAt: enrollment.createdAt.toISOString(),
      student: {
        name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        email: enrollment.student.email || "",
      },
      subject: {
        name: enrollment.class.subject?.name || enrollment.class.name,
        grade: enrollment.class.grade?.name
          ? parseInt(enrollment.class.grade.name.replace(/\D/g, "")) || 0
          : 0,
      },
    }));

    return {
      overview: {
        totalEnrolled: totalEnrollments,
        activeEnrollments: activeEnrollments,
        completedEnrollments: completedEnrollments,
        averageCompletionRate: averageCompletionRate,
      },
      byGrade,
      recentEnrollments: recentFormatted,
    };
  }

  // ==================== ENROLLMENT ANALYTICS ====================
  async getEnhancedEnrollmentStats() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Get basic stats
    const basicStats = await this.getEnrollmentStats();

    // Calculate MoM and YoY growth
    const [currentMonthEnrollments, lastMonthEnrollments, lastYearEnrollments] =
      await Promise.all([
        this.prisma.enrollment.count({
          where: {
            createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
          },
        }),
        this.prisma.enrollment.count({
          where: {
            createdAt: {
              gte: lastMonth,
              lt: new Date(now.getFullYear(), now.getMonth(), 1),
            },
          },
        }),
        this.prisma.enrollment.count({
          where: {
            createdAt: {
              gte: lastYear,
              lt: new Date(now.getFullYear(), now.getMonth(), 1),
            },
          },
        }),
      ]);

    const momGrowth =
      lastMonthEnrollments > 0
        ? ((currentMonthEnrollments - lastMonthEnrollments) /
            lastMonthEnrollments) *
          100
        : 0;
    const yoyGrowth =
      lastYearEnrollments > 0
        ? ((currentMonthEnrollments - lastYearEnrollments) /
            lastYearEnrollments) *
          100
        : 0;

    // Get enrollment funnel data
    const funnel = await this.getEnrollmentFunnel();

    // Get cohort analysis
    const cohorts = await this.getEnrollmentCohorts();

    // Get capacity planning
    const capacityPlanning = await this.getCapacityPlanning();

    // Get health metrics
    const healthMetrics = await this.getEnrollmentHealthMetrics();

    // Get geographic distribution
    const geographicDistribution = await this.getGeographicDistribution();

    // Get demographics
    const demographics = await this.getDemographicBreakdown();

    // Get predictions
    const predictions = await this.getPredictiveEnrollments();

    // Get alerts
    const alerts = await this.getEnrollmentAlerts();

    // Get payment analytics
    const paymentAnalytics = await this.getPaymentEnrollmentAnalytics();

    // by grade data
    const enhancedByGrade = await this.getEnhancedGradeStats();

    return {
      overview: {
        ...basicStats.overview,
        monthOverMonthGrowth: momGrowth,
        yearOverYearGrowth: yoyGrowth,
      },
      funnel,
      cohorts,
      capacityPlanning,
      healthMetrics,
      geographicDistribution,
      demographics,
      predictions,
      alerts,
      paymentAnalytics,
      byGrade: enhancedByGrade,
      recentEnrollments: basicStats.recentEnrollments,
    };
  }

  private async getEnrollmentFunnel() {
    // Track student journey through enrollment process
    const totalUsers = await this.prisma.user.count({
      where: {
        role: { in: ["INTERNAL_STUDENT", "EXTERNAL_STUDENT"] },
      },
    });

    const usersWithProfile = await this.prisma.studentProfile.count();
    const verifiedUsers = await this.prisma.user.count({
      where: {
        role: { in: ["INTERNAL_STUDENT", "EXTERNAL_STUDENT"] },
        phoneVerified: true,
      },
    });
    const enrolledUsers = await this.prisma.enrollment.groupBy({
      by: ["studentId"],
    });
    const activeUsers = await this.prisma.enrollment.groupBy({
      by: ["studentId"],
      where: { status: "ACTIVE" },
    });

    const stages = [
      {
        stage: "Registration",
        count: totalUsers,
        percentage: 100,
        dropoffRate: 0,
        conversionRate: 100,
      },
      {
        stage: "Profile Completed",
        count: usersWithProfile,
        percentage: (usersWithProfile / totalUsers) * 100,
        dropoffRate: ((totalUsers - usersWithProfile) / totalUsers) * 100,
        conversionRate: (usersWithProfile / totalUsers) * 100,
      },
      {
        stage: "Verified",
        count: verifiedUsers,
        percentage: (verifiedUsers / totalUsers) * 100,
        dropoffRate: ((usersWithProfile - verifiedUsers) / totalUsers) * 100,
        conversionRate: (verifiedUsers / usersWithProfile) * 100,
      },
      {
        stage: "Enrolled",
        count: enrolledUsers.length,
        percentage: (enrolledUsers.length / totalUsers) * 100,
        dropoffRate:
          ((verifiedUsers - enrolledUsers.length) / totalUsers) * 100,
        conversionRate: (enrolledUsers.length / verifiedUsers) * 100,
      },
      {
        stage: "Active Learner",
        count: activeUsers.length,
        percentage: (activeUsers.length / totalUsers) * 100,
        dropoffRate:
          ((enrolledUsers.length - activeUsers.length) / totalUsers) * 100,
        conversionRate: (activeUsers.length / enrolledUsers.length) * 100,
      },
    ];

    return stages;
  }

  private async getEnrollmentCohorts() {
    // Group students by enrollment month and track retention
    const enrollments = await this.prisma.enrollment.findMany({
      include: {
        student: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const cohortMap = new Map<string, any>();

    enrollments.forEach((enrollment) => {
      const cohortDate = new Date(enrollment.createdAt);
      const key = `${cohortDate.getFullYear()}-${String(cohortDate.getMonth() + 1).padStart(2, "0")}`;

      if (!cohortMap.has(key)) {
        cohortMap.set(key, {
          cohortDate: key,
          students: new Set(),
          activeStudents: new Set(),
          totalRevenue: 0,
          completedCount: 0,
          churnCount: 0,
        });
      }

      const cohort = cohortMap.get(key);
      cohort.students.add(enrollment.studentId);

      if (enrollment.status === "ACTIVE") {
        cohort.activeStudents.add(enrollment.studentId);
      }
      if (enrollment.status === "COMPLETED") {
        cohort.completedCount++;
      }
      if (enrollment.status === "CANCELLED") {
        cohort.churnCount++;
      }
      if (enrollment.payment) {
        cohort.totalRevenue += Number(enrollment.payment.amount) || 0;
      }
    });

    return Array.from(cohortMap.values())
      .map((cohort) => ({
        cohortDate: cohort.cohortDate,
        totalStudents: cohort.students.size,
        activeStudents: cohort.activeStudents.size,
        retentionRate:
          cohort.students.size > 0
            ? (cohort.activeStudents.size / cohort.students.size) * 100
            : 0,
        averageRevenue:
          cohort.students.size > 0
            ? cohort.totalRevenue / cohort.students.size
            : 0,
        completionRate:
          cohort.students.size > 0
            ? (cohort.completedCount / cohort.students.size) * 100
            : 0,
        churnCount: cohort.churnCount,
      }))
      .slice(0, 12);
  }

  private async getCapacityPlanning() {
    const classes = await this.prisma.class.findMany({
      include: {
        grade: {
          select: { name: true },
        },
        enrollments: true,
        _count: {
          select: { enrollments: true },
        },
      },
    });

    const gradeCapacity = new Map<string, any>();

    classes.forEach((cls) => {
      const grade = cls.grade?.name || "Unknown";
      if (!gradeCapacity.has(grade)) {
        gradeCapacity.set(grade, {
          currentEnrollment: 0,
          maxCapacity: 0,
          classes: 0,
        });
      }

      const data = gradeCapacity.get(grade);
      data.currentEnrollment += cls._count.enrollments;
      data.maxCapacity += cls.maxStudents || 30;
      data.classes++;
    });

    return Array.from(gradeCapacity.entries()).map(([grade, data]) => {
      const utilizationRate =
        data.maxCapacity > 0
          ? (data.currentEnrollment / data.maxCapacity) * 100
          : 0;
      const projectedEnrollment = Math.round(data.currentEnrollment * 1.15);
      const capacityGap = data.maxCapacity - projectedEnrollment;

      const recommendations: string[] = [];
      if (utilizationRate > 85) {
        recommendations.push(
          `Add ${Math.ceil(data.classes * 0.3)} new classes`
        );
        recommendations.push("Hire additional teachers");
      }
      if (utilizationRate < 50) {
        recommendations.push("Consolidate underutilized classes");
        recommendations.push("Increase marketing efforts");
      }
      if (capacityGap < 0) {
        recommendations.push(
          `Increase capacity by ${Math.abs(capacityGap)} students`
        );
      }

      return {
        grade,
        currentEnrollment: data.currentEnrollment,
        maxCapacity: data.maxCapacity,
        utilizationRate,
        projectedEnrollment,
        capacityGap,
        recommendedActions: recommendations,
      };
    });
  }

  private async getEnrollmentHealthMetrics() {
    const enrollments = await this.prisma.enrollment.findMany({
      include: {
        class: {
          include: {
            grade: {
              select: { name: true },
            },
          },
        },
        student: {
          include: {
            attendanceRecords: true,
            examAttempts: true,
          },
        },
      },
    });

    const gradeHealth = new Map<string, any>();

    enrollments.forEach((enrollment) => {
      const grade = enrollment.class.grade?.name || "Unknown";
      if (!gradeHealth.has(grade)) {
        gradeHealth.set(grade, {
          totalEnrollments: 0,
          totalAttendance: 0,
          attendanceRecords: 0,
          examAttempts: 0,
          completedExams: 0,
          atRiskStudents: new Set(),
        });
      }

      const health = gradeHealth.get(grade);
      health.totalEnrollments++;

      const studentAttendance = enrollment.student.attendanceRecords.filter(
        (a) => a.present
      ).length;
      const totalRecords = enrollment.student.attendanceRecords.length;

      if (totalRecords > 0) {
        health.totalAttendance += (studentAttendance / totalRecords) * 100;
        health.attendanceRecords++;

        // Mark as at-risk if attendance < 75%
        if ((studentAttendance / totalRecords) * 100 < 75) {
          health.atRiskStudents.add(enrollment.studentId);
        }
      }

      health.examAttempts += enrollment.student.examAttempts.length;
      health.completedExams += enrollment.student.examAttempts.filter(
        (a) => a.status === "SUBMITTED"
      ).length;
    });

    return Array.from(gradeHealth.entries()).map(([grade, health]) => ({
      grade,
      totalEnrollments: health.totalEnrollments,
      attendanceRate:
        health.attendanceRecords > 0
          ? health.totalAttendance / health.attendanceRecords
          : 0,
      assignmentCompletionRate: 0, // Assignment system not yet implemented
      examParticipationRate:
        health.totalEnrollments > 0
          ? (health.examAttempts / health.totalEnrollments) * 100
          : 0,
      engagementScore:
        health.attendanceRecords > 0 && health.totalEnrollments > 0
          ? ((health.totalAttendance / health.attendanceRecords +
              (health.completedExams / health.totalEnrollments) * 100) /
              2) *
            0.7
          : 0,
      atRiskCount: health.atRiskStudents.size,
    }));
  }

  private async getGeographicDistribution() {
    const students = await this.prisma.studentProfile.findMany({
      include: {
        user: {
          include: {
            enrollments: {
              include: {
                payment: true,
              },
            },
          },
        },
      },
    });

    const distribution = new Map<string, any>();
    let totalStudents = 0;

    students.forEach((profile) => {
      const province = profile.user.districtId || "Unknown";
      if (!distribution.has(province)) {
        distribution.set(province, {
          enrollmentCount: 0,
          revenue: 0,
          ages: [],
        });
      }

      const data = distribution.get(province);
      data.enrollmentCount += profile.user.enrollments.length;
      totalStudents += profile.user.enrollments.length;

      profile.user.enrollments.forEach((enrollment) => {
        if (enrollment.payment) {
          data.revenue += Number(enrollment.payment.amount) || 0;
        }
      });

      if (profile.user.dateOfBirth) {
        const age =
          new Date().getFullYear() -
          new Date(profile.user.dateOfBirth).getFullYear();
        data.ages.push(age);
      }
    });

    return Array.from(distribution.entries()).map(([province, data]) => ({
      province,
      enrollmentCount: data.enrollmentCount,
      percentage:
        totalStudents > 0 ? (data.enrollmentCount / totalStudents) * 100 : 0,
      revenue: data.revenue,
      averageAge:
        data.ages.length > 0
          ? data.ages.reduce((a: number, b: number) => a + b, 0) /
            data.ages.length
          : 0,
    }));
  }

  private async getDemographicBreakdown() {
    const students = await this.prisma.user.findMany({
      where: {
        role: { in: ["INTERNAL_STUDENT", "EXTERNAL_STUDENT"] },
      },
      include: {
        studentProfile: true,
        enrollments: {
          include: {
            payment: true,
          },
        },
      },
    });

    const totalStudents = students.length;

    // By Student Type
    const internal = students.filter((s) => s.role === "INTERNAL_STUDENT");
    const external = students.filter((s) => s.role === "EXTERNAL_STUDENT");

    const byStudentType = [
      {
        category: "studentType",
        label: "Internal Students",
        count: internal.length,
        percentage: (internal.length / totalStudents) * 100,
        revenue: internal.reduce(
          (sum, s) =>
            sum +
            s.enrollments.reduce(
              (eSum, e) => eSum + (Number(e.payment?.amount) || 0),
              0
            ),
          0
        ),
      },
      {
        category: "studentType",
        label: "External Students",
        count: external.length,
        percentage: (external.length / totalStudents) * 100,
        revenue: external.reduce(
          (sum, s) =>
            sum +
            s.enrollments.reduce(
              (eSum, e) => eSum + (Number(e.payment?.amount) || 0),
              0
            ),
          0
        ),
      },
    ];

    // By Age Group
    const ageGroups = new Map<string, { count: number; revenue: number }>();
    students.forEach((student) => {
      if (student.dateOfBirth) {
        const age =
          new Date().getFullYear() -
          new Date(student.dateOfBirth).getFullYear();
        let ageGroup = "Unknown";
        if (age < 13) {ageGroup = "Under 13";}
        else if (age < 16) {ageGroup = "13-15";}
        else if (age < 18) {ageGroup = "16-17";}
        else {ageGroup = "18+";}

        if (!ageGroups.has(ageGroup)) {
          ageGroups.set(ageGroup, { count: 0, revenue: 0 });
        }

        const data = ageGroups.get(ageGroup)!;
        data.count++;
        data.revenue += student.enrollments.reduce(
          (sum, e) => sum + (Number(e.payment?.amount) || 0),
          0
        );
      }
    });

    const byAgeGroup = Array.from(ageGroups.entries()).map(([label, data]) => ({
      category: "ageGroup",
      label,
      count: data.count,
      percentage: (data.count / totalStudents) * 100,
      revenue: data.revenue,
    }));

    return {
      byMedium: [], // Medium breakdown not yet implemented
      byStudentType,
      byAgeGroup,
    };
  }

  private async getPredictiveEnrollments() {
    // Simple trend-based prediction (can be with ML)
    const last6Months = await this.prisma.enrollment.groupBy({
      by: ["createdAt"],
      _count: true,
      where: {
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        },
      },
    });

    const monthlyEnrollments = new Map<string, number>();
    last6Months.forEach((record) => {
      const month = new Date(record.createdAt).toISOString().substring(0, 7);
      monthlyEnrollments.set(
        month,
        (monthlyEnrollments.get(month) || 0) + record._count
      );
    });

    const values = Array.from(monthlyEnrollments.values());
    const avgGrowth =
      values.length > 1
        ? values.reduce((sum, val, i) => {
            if (i === 0) {return 0;}
            return sum + (val - values[i - 1]) / values[i - 1];
          }, 0) /
          (values.length - 1)
        : 0.05;

    const lastValue = values[values.length - 1] || 100;
    const predictions = [];

    for (let i = 1; i <= 3; i++) {
      const projectedValue = Math.round(lastValue * Math.pow(1 + avgGrowth, i));
      const confidenceInterval = {
        lower: Math.round(projectedValue * 0.85),
        upper: Math.round(projectedValue * 1.15),
      };

      const futureMonth = new Date();
      futureMonth.setMonth(futureMonth.getMonth() + i);

      predictions.push({
        month: futureMonth.toISOString().substring(0, 7),
        projectedEnrollments: projectedValue,
        confidenceInterval,
        trend: avgGrowth > 0.05 ? "up" : avgGrowth < -0.05 ? "down" : "stable",
        seasonalFactor: 1.0, // Seasonal patterns not yet implemented
      });
    }

    return predictions;
  }

  private async getEnrollmentAlerts() {
    const alerts: any[] = [];

    // Check for low attendance
    const lowAttendance = await this.prisma.attendanceSummary.count({
      where: { percentage: { lt: 75 } },
    });

    if (lowAttendance > 10) {
      alerts.push({
        type: "warning",
        title: "Low Attendance Alert",
        message: `${lowAttendance} students have attendance below 75%`,
        affectedCount: lowAttendance,
        priority: 2,
        actionRequired: "Review and contact at-risk students",
      });
    }

    // Check for underutilized classes
    const classes = await this.prisma.class.findMany({
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    const underutilized = classes.filter(
      (c) =>
        c.maxStudents &&
        c._count.enrollments < c.maxStudents * 0.5 &&
        c.status === "ACTIVE"
    );

    if (underutilized.length > 5) {
      alerts.push({
        type: "info",
        title: "Underutilized Classes",
        message: `${underutilized.length} classes are below 50% capacity`,
        affectedCount: underutilized.length,
        priority: 3,
        actionRequired: "Consider marketing or consolidation",
      });
    }

    // Check for pending payments
    const pendingPayments = await this.prisma.payment.count({
      where: { status: "PENDING" },
    });

    if (pendingPayments > 20) {
      alerts.push({
        type: "critical",
        title: "High Pending Payments",
        message: `${pendingPayments} payments are pending approval`,
        affectedCount: pendingPayments,
        priority: 1,
        actionRequired: "Review and process pending payments immediately",
      });
    }

    return alerts;
  }

  private async getPaymentEnrollmentAnalytics() {
    const enrollments = await this.prisma.enrollment.findMany({
      include: {
        payment: true,
      },
    });

    const totalRevenue = enrollments.reduce(
      (sum, e) => sum + (Number(e.payment?.amount) || 0),
      0
    );
    const paidEnrollments = enrollments.filter((e) => e.payment).length;
    const successfulPayments = enrollments.filter(
      (e) => e.payment?.status === "COMPLETED"
    ).length;

    const outstanding = enrollments.filter(
      (e) => !e.isPaid && e.status === "ACTIVE"
    );

    // Get wallet usage from WalletService
    const walletUsage = await this.walletService.getWalletPaymentUsage();

    // Get discount impact from invoices
    const discountImpact = await this.prisma.invoice.aggregate({
      _sum: { discount: true },
      where: {
        status: "PAID",
        discount: { gt: 0 },
      },
    });

    return {
      totalRevenue,
      averagePaymentPerStudent:
        paidEnrollments > 0 ? totalRevenue / paidEnrollments : 0,
      paymentSuccessRate:
        paidEnrollments > 0 ? (successfulPayments / paidEnrollments) * 100 : 0,
      outstandingPayments: outstanding.reduce(
        (sum, e) => sum + (Number(e.payment?.amount) || 0),
        0
      ),
      outstandingCount: outstanding.length,
      walletUsage,
      discountImpact: discountImpact._sum.discount || 0,
      paymentMethods: [
        {
          method: "Online",
          count: successfulPayments,
          amount: totalRevenue,
        },
      ],
    };
  }

  private async getEnhancedGradeStats() {
    const enrollments = await this.prisma.enrollment.findMany({
      include: {
        class: {
          include: {
            grade: {
              select: { name: true, code: true },
            },
          },
        },
        student: {
          include: {
            attendanceRecords: true,
          },
        },
      },
    });

    const gradeStats = new Map<number, any>();

    enrollments.forEach((enrollment) => {
      const grade = enrollment.class.grade?.name
        ? parseInt(enrollment.class.grade.name.replace(/\D/g, "")) || 0
        : 0;

      if (!gradeStats.has(grade)) {
        gradeStats.set(grade, {
          count: 0,
          totalProgress: 0,
          activeCount: 0,
          completedCount: 0,
          totalAttendance: 0,
          attendanceRecords: 0,
        });
      }

      const stats = gradeStats.get(grade);
      stats.count++;
      stats.totalProgress += enrollment.progress || 0;

      if (enrollment.status === "ACTIVE") {stats.activeCount++;}
      if (enrollment.status === "COMPLETED") {stats.completedCount++;}

      const studentAttendance = enrollment.student.attendanceRecords;
      if (studentAttendance.length > 0) {
        const presentCount = studentAttendance.filter((a) => a.present).length;
        stats.totalAttendance +=
          (presentCount / studentAttendance.length) * 100;
        stats.attendanceRecords++;
      }
    });

    return Array.from(gradeStats.entries())
      .map(([grade, stats]) => ({
        grade,
        count: stats.count,
        completionRate: stats.count > 0 ? stats.totalProgress / stats.count : 0,
        retentionRate:
          stats.count > 0 ? (stats.activeCount / stats.count) * 100 : 0,
        averageAttendance:
          stats.attendanceRecords > 0
            ? stats.totalAttendance / stats.attendanceRecords
            : 0,
      }))
      .sort((a, b) => a.grade - b.grade);
  }

  // ==================== INSTITUTIONS ====================
  async getInstitutions(zoneId?: string) {
    const where: any = {};
    if (zoneId) {where.zoneId = zoneId;}

    const institutions = await this.prisma.institution.findMany({
      where,
      include: {
        zone: {
          include: {
            district: {
              include: {
                province: true,
              },
            },
          },
        },
        _count: {
          select: {
            teachers: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return {
      total: institutions.length,
      institutions,
    };
  }

  async getInstitution(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        zone: {
          include: {
            district: {
              include: {
                province: true,
              },
            },
          },
        },
        teachers: {
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
        },
      },
    });

    if (!institution) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Institution not found"
      );
    }

    return institution;
  }

  async createInstitution(dto: CreateInstitutionDto) {
    // Generate unique code
    let code = dto.code;
    if (!code) {
      code = dto.name.replace(/\s+/g, "-").toUpperCase();
    }

    const codeExists = await this.prisma.institution.findUnique({
      where: { code },
    });
    if (codeExists) {
      const count = await this.prisma.institution.count();
      code = `${code}-${count + 1}`;
    }

    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({
        where: { id: dto.zoneId },
      });
      if (!zone) {
        throw AppException.notFound(ErrorCode.ZONE_NOT_FOUND, "Zone not found");
      }
    }

    // compute next sortOrder within zone (by zoneId) if not provided
    const max = await this.prisma.institution.aggregate({
      _max: { sortOrder: true },
      where: { zoneId: dto.zoneId ?? undefined },
    });
    const nextOrder = (max._max.sortOrder ?? 0) + 1;
    const institution = await this.prisma.institution.create({
      data: { ...dto, code, sortOrder: dto.sortOrder ?? nextOrder },
      include: {
        zone: {
          include: {
            district: {
              include: {
                province: true,
              },
            },
          },
        },
      },
    });

    return {
      message: "Institution created successfully",
      institution,
    };
  }

  async updateInstitution(id: string, dto: UpdateInstitutionDto) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });
    if (!institution) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Institution not found"
      );
    }

    if (dto.code && dto.code !== institution.code) {
      const existing = await this.prisma.institution.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw AppException.badRequest(
          ErrorCode.DUPLICATE_ENTRY,
          "Institution with this code already exists"
        );
      }
    }

    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({
        where: { id: dto.zoneId },
      });
      if (!zone) {
        throw AppException.notFound(ErrorCode.ZONE_NOT_FOUND, "Zone not found");
      }
    }

    const updated = await this.prisma.institution.update({
      where: { id },
      data: dto,
      include: {
        zone: {
          include: {
            district: {
              include: {
                province: true,
              },
            },
          },
        },
      },
    });

    return {
      message: "Institution updated successfully",
      institution: updated,
    };
  }

  async reorderInstitutions(items: { id: string; sortOrder: number }[]) {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.institution.update({
          where: { id: it.id },
          data: { sortOrder: it.sortOrder },
        })
      )
    );
    const institutions = await this.prisma.institution.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { message: "Institution order updated successfully", institutions };
  }

  async deleteInstitution(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            teachers: true,
          },
        },
      },
    });

    if (!institution) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Institution not found"
      );
    }

    if (institution._count.teachers > 0) {
      throw AppException.badRequest(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        "Cannot delete institution with assigned teachers"
      );
    }

    await this.prisma.institution.delete({ where: { id } });

    return {
      message: "Institution deleted successfully",
    };
  }

  // ==================== TEACHER SUBJECT ASSIGNMENTS ====================
  async getTeacherAssignments(filters?: {
    teacherProfileId?: string;
    subjectId?: string;
    gradeId?: string;
    mediumId?: string;
    includeInactive?: boolean;
    academicYear?: string;
  }) {
    const where: any = {};
    if (filters?.teacherProfileId)
      {where.teacherProfileId = filters.teacherProfileId;}
    if (filters?.subjectId) {where.subjectId = filters.subjectId;}
    if (filters?.gradeId) {where.gradeId = filters.gradeId;}
    if (filters?.mediumId) {where.mediumId = filters.mediumId;}
    if (filters?.academicYear) {where.academicYear = filters.academicYear;}
    if (!filters?.includeInactive) {where.isActive = true;}

    const assignments = await this.prisma.teacherSubjectAssignment.findMany({
      where,
      include: {
        teacherProfile: {
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
        },
        subject: true,
        grade: true,
        medium: true,
      },
      orderBy: [
        { teacherProfile: { user: { firstName: "asc" } } },
        { grade: { level: "asc" } },
        { subject: { name: "asc" } },
      ],
    });

    return {
      total: assignments.length,
      assignments,
    };
  }

  async getTeacherAssignmentById(id: string) {
    const assignment = await this.prisma.teacherSubjectAssignment.findUnique({
      where: { id },
      include: {
        teacherProfile: {
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
        },
        subject: true,
        grade: true,
        medium: true,
      },
    });

    if (!assignment) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Teacher assignment not found"
      );
    }

    return { assignment };
  }

  async createTeacherAssignment(dto: CreateTeacherSubjectAssignmentDto) {
    // Verify all foreign keys exist
    const [teacherProfile, subject, grade, medium] = await Promise.all([
      this.prisma.teacherProfile.findUnique({
        where: { id: dto.teacherProfileId },
      }),
      this.prisma.subject.findUnique({ where: { id: dto.subjectId } }),
      this.prisma.grade.findUnique({ where: { id: dto.gradeId } }),
      this.prisma.medium.findUnique({ where: { id: dto.mediumId } }),
    ]);

    if (!teacherProfile)
      {throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Teacher profile not found"
      );}
    if (!subject)
      {throw AppException.notFound(
        ErrorCode.SUBJECT_NOT_FOUND,
        "Subject not found"
      );}
    if (!grade)
      {throw AppException.notFound(ErrorCode.GRADE_NOT_FOUND, "Grade not found");}
    if (!medium)
      {throw AppException.notFound(
        ErrorCode.MEDIUM_NOT_FOUND,
        "Medium not found"
      );}

    // Check for duplicate
    const existing = await this.prisma.teacherSubjectAssignment.findFirst({
      where: {
        teacherProfileId: dto.teacherProfileId,
        subjectId: dto.subjectId,
        gradeId: dto.gradeId,
        mediumId: dto.mediumId,
        academicYear: {
          year: dto.academicYear,
        },
      },
    });

    if (existing) {
      throw AppException.conflict(
        ErrorCode.DUPLICATE_ENTRY,
        "This assignment already exists for the teacher"
      );
    }

    // Lookup academicYearId from the year string
    const academicYearRecord = await this.prisma.academicYear.findFirst({
      where: { year: dto.academicYear },
    });
    if (!academicYearRecord) {
      throw AppException.notFound(
        ErrorCode.ACADEMIC_YEAR_NOT_FOUND,
        `Academic year ${dto.academicYear} not found`
      );
    }

    const assignment = await this.prisma.teacherSubjectAssignment.create({
      data: {
        teacherProfileId: dto.teacherProfileId,
        subjectId: dto.subjectId,
        gradeId: dto.gradeId,
        mediumId: dto.mediumId,
        academicYearId: academicYearRecord.id,
        canCreateExams: dto.canCreateExams,
        isActive: dto.isActive,
      },
      include: {
        teacherProfile: {
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
        },
        subject: true,
        grade: true,
        medium: true,
      },
    });

    return {
      message: "Teacher assignment created successfully",
      assignment,
    };
  }

  async updateTeacherAssignment(
    id: string,
    dto: UpdateTeacherSubjectAssignmentDto
  ) {
    const assignment = await this.prisma.teacherSubjectAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Assignment not found"
      );
    }

    const updated = await this.prisma.teacherSubjectAssignment.update({
      where: { id },
      data: dto,
      include: {
        teacherProfile: {
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
        },
        subject: true,
        grade: true,
        medium: true,
      },
    });

    return {
      message: "Teacher assignment updated successfully",
      assignment: updated,
    };
  }

  async deleteTeacherAssignment(id: string) {
    const assignment = await this.prisma.teacherSubjectAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Assignment not found"
      );
    }

    await this.prisma.teacherSubjectAssignment.delete({ where: { id } });

    return {
      message: "Teacher assignment deleted successfully",
    };
  }

  // ==================== FILTERED DROPDOWNS ====================
  async getFilteredSubjects(gradeId?: string, mediumId?: string) {
    const where: any = {};

    if (gradeId || mediumId) {
      where.teacherAssignments = {
        some: {
          isActive: true,
          ...(gradeId && { gradeId }),
          ...(mediumId && { mediumId }),
        },
      };
    }

    where.isActive = true;

    const subjects = await this.prisma.subject.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return {
      total: subjects.length,
      subjects,
    };
  }

  // Get all internal teacher profiles
  async getTeachers() {
    const teachers = await this.prisma.teacherProfile.findMany({
      where: {},
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return {
      total: teachers.length,
      teachers,
    };
  }

  // Get filtered teachers based on subject/grade/medium capabilities
  async getFilteredTeachers(
    subjectId?: string,
    gradeId?: string,
    mediumId?: string
  ) {
    const where: any = {
      subjectAssignments: {
        some: {
          isActive: true,
          ...(subjectId && { subjectId }),
          ...(gradeId && { gradeId }),
          ...(mediumId && { mediumId }),
        },
      },
    };

    const teachers = await this.prisma.teacherProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        subjectAssignments: {
          where: {
            isActive: true,
            ...(subjectId && { subjectId }),
            ...(gradeId && { gradeId }),
            ...(mediumId && { mediumId }),
          },
          include: {
            subject: true,
            grade: true,
            medium: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return {
      total: teachers.length,
      teachers,
    };
  }

  async getTeacherCapabilities(teacherProfileId: string) {
    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subjectAssignments: {
          where: { isActive: true },
          include: {
            subject: true,
            grade: true,
            medium: true,
          },
          orderBy: [
            { grade: { level: "asc" } },
            { subject: { name: "asc" } },
            { medium: { name: "asc" } },
          ],
        },
      },
    });

    if (!teacherProfile) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Teacher profile not found"
      );
    }

    // Group by subject
    const capabilities = teacherProfile.subjectAssignments.reduce(
      (acc, assignment) => {
        const subjectName = assignment.subject.name;
        if (!acc[subjectName]) {
          acc[subjectName] = {
            subject: assignment.subject,
            grades: [],
            mediums: [],
            combinations: [],
          };
        }

        // Add unique grades
        if (
          !acc[subjectName].grades.find(
            (g: any) => g.id === assignment.grade.id
          )
        ) {
          acc[subjectName].grades.push(assignment.grade);
        }

        // Add unique mediums
        if (
          !acc[subjectName].mediums.find(
            (m: any) => m.id === assignment.medium.id
          )
        ) {
          acc[subjectName].mediums.push(assignment.medium);
        }

        // Add combination
        acc[subjectName].combinations.push({
          grade: assignment.grade,
          medium: assignment.medium,
          assignmentId: assignment.id,
        });

        return acc;
      },
      {} as any
    );

    return {
      teacherProfile: {
        id: teacherProfile.id,
        user: teacherProfile.user,
        employeeId: teacherProfile.employeeId,
      },
      capabilities: Object.values(capabilities),
    };
  }

  // ==================== SEMINARS ====================
  async getSeminars() {
    const seminars = await this.prisma.seminar.findMany({
      orderBy: { scheduledAt: "desc" },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });
    return seminars;
  }

  async createSeminar(data: any) {
    const seminar = await this.prisma.seminar.create({
      data: {
        title: data.title,
        description: data.description,
        topic: data.topic,
        speakerName: data.speakerName,
        speakerBio: data.speakerBio,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration || 60,
        meetingLink: data.meetingLink,
        status: data.status || "SCHEDULED",
        createdById: data.createdById || "system", // You may need to pass the actual user ID
      },
    });
    return seminar;
  }

  async updateSeminar(id: string, data: any) {
    const seminar = await this.prisma.seminar.findUnique({ where: { id } });
    if (!seminar)
      {throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Seminar with ID ${id} not found`
      );}

    const updated = await this.prisma.seminar.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.topic && { topic: data.topic }),
        ...(data.speakerName && { speakerName: data.speakerName }),
        ...(data.speakerBio && { speakerBio: data.speakerBio }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.duration && { duration: data.duration }),
        ...(data.meetingLink && { meetingLink: data.meetingLink }),
        ...(data.status && { status: data.status }),
      },
    });
    return updated;
  }

  async deleteSeminar(id: string) {
    const seminar = await this.prisma.seminar.findUnique({ where: { id } });
    if (!seminar)
      {throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Seminar with ID ${id} not found`
      );}

    await this.prisma.seminar.delete({ where: { id } });
    return { success: true, message: "Seminar deleted successfully" };
  }

  // ==================== BATCHES ====================
  async getBatches(gradeId?: string) {
    const where: any = {};
    if (gradeId) {where.gradeId = gradeId;}

    const batches = await this.prisma.batch.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        grade: true,
      },
    });

    return {
      total: batches.length,
      batches,
    };
  }

  async createBatch(data: { name: string; code?: string; gradeId: string }) {
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
      {throw AppException.conflict(
        ErrorCode.BATCH_ALREADY_EXISTS,
        "Batch with this code already exists in this grade"
      );}

    const max = await this.prisma.batch.aggregate({
      _max: { sortOrder: true },
      where: { gradeId: data.gradeId },
    });
    const nextOrder = (max._max.sortOrder ?? 0) + 1;
    const batch = await this.prisma.batch.create({
      data: {
        name: data.name,
        code,
        gradeId: data.gradeId,
        isActive: true,
        sortOrder: nextOrder,
      },
      include: { grade: true },
    });
    return batch;
  }

  async updateBatch(
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
        {throw AppException.conflict(
          ErrorCode.BATCH_ALREADY_EXISTS,
          "Batch with this code already exists in this grade"
        );}
    }

    const updated = await this.prisma.batch.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: newCode }),
        ...(data.gradeId && { gradeId: data.gradeId }),
        ...(typeof data.isActive === "boolean" && {
          isActive: data.isActive,
        }),
        ...(typeof (data as any).sortOrder !== "undefined" && {
          sortOrder: (data as any).sortOrder,
        }),
      },
      include: { grade: true },
    });
    return updated;
  }

  async reorderBatches(items: { id: string; sortOrder: number }[]) {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.batch.update({
          where: { id: it.id },
          data: { sortOrder: it.sortOrder },
        })
      )
    );
    const batches = await this.prisma.batch.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { message: "Batch order updated successfully", batches };
  }

  async reorderGrades(items: { id: string; sortOrder: number }[]) {
    if (!items || items.length === 0)
      {return { message: "No grades to reorder" };}

    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.grade.update({
          where: { id: it.id },
          data: { sortOrder: it.sortOrder },
        })
      )
    );
    const grades = await this.prisma.grade.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { message: "Grade order updated successfully", grades };
  }

  async deleteBatch(id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch)
      {throw AppException.notFound(
        ErrorCode.BATCH_NOT_FOUND,
        `Batch with ID ${id} not found`
      );}

    await this.prisma.batch.delete({ where: { id } });
    return { success: true, message: "Batch deleted successfully" };
  }

  // ==================== USER LOGIN RESTRICTIONS ====================
  async getUserRestrictions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        accountLockout: true,
      },
    });

    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    return {
      user,
      isBlocked: !!user.accountLockout,
      blockReason: user.accountLockout?.reason || null,
      blockedUntil: user.accountLockout?.unlockAt || null,
      isSuspended: user.status === "SUSPENDED",
    };
  }

  async blockUserLogin(userId: string, reason: string, duration?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const lockedUntil = duration
      ? new Date(Date.now() + duration * 60 * 60 * 1000) // duration in hours
      : null;

    // Create or update account lockout entry
    await this.prisma.accountLockout.upsert({
      where: { userId },
      update: {
        lockedAt: new Date(),
        unlockAt: lockedUntil || new Date(new Date().getFullYear() + 100, 0, 1),
        reason,
      },
      create: {
        userId,
        unlockAt: lockedUntil || new Date(new Date().getFullYear() + 100, 0, 1),
        reason,
        attemptCount: 0,
      },
    });

    // Log the restriction
    await this.prisma.securityAuditLog.create({
      data: {
        userId,
        action: "ACCOUNT_LOCKED",
        resource: "user",
        resourceId: userId,
        ipAddress: "system",
        success: true,
        metadata: {
          reason,
          duration: duration || "permanent",
          blockedUntil: lockedUntil?.toISOString(),
        },
      },
    });

    return {
      success: true,
      message: "User login blocked successfully",
      blockedUntil: lockedUntil,
    };
  }

  async unblockUserLogin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    // Remove any existing account lockout entries
    await this.prisma.accountLockout.deleteMany({ where: { userId } });

    // Log the unblock
    await this.prisma.securityAuditLog.create({
      data: {
        userId,
        action: "ACCOUNT_UNLOCKED",
        resource: "user",
        resourceId: userId,
        ipAddress: "system",
        success: true,
      },
    });

    return {
      success: true,
      message: "User login unblocked successfully",
    };
  }

  async suspendUser(userId: string, reason: string, until: Date) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: "SUSPENDED" },
    });

    await this.prisma.accountLockout.upsert({
      where: { userId },
      update: {
        lockedAt: new Date(),
        unlockAt: until,
        reason,
      },
      create: {
        userId,
        unlockAt: until,
        reason,
        attemptCount: 0,
      },
    });

    // Log the suspension
    await this.prisma.securityAuditLog.create({
      data: {
        userId,
        action: "ACCOUNT_SUSPENDED",
        resource: "user",
        resourceId: userId,
        ipAddress: "system",
        success: true,
        metadata: {
          reason,
          suspendedUntil: until.toISOString(),
        },
      },
    });

    return {
      success: true,
      message: "User suspended successfully",
      suspendedUntil: until,
    };
  }

  async getRestrictionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.securityAuditLog.findMany({
        where: {
          userId,
          action: {
            in: ["ACCOUNT_LOCKED", "ACCOUNT_UNLOCKED", "ACCOUNT_SUSPENDED"],
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.securityAuditLog.count({
        where: {
          userId,
          action: {
            in: ["ACCOUNT_LOCKED", "ACCOUNT_UNLOCKED", "ACCOUNT_SUSPENDED"],
          },
        },
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
