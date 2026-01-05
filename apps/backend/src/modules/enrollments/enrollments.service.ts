import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { DatabaseUtilsService } from "@database/database-utils.service";
import {
  EnrollmentStatus,
  AttemptStatus,
  SeminarStatus,
  UserRole,
} from "@prisma/client";

interface FindAllFilters {
  classId?: string;
  status?: EnrollmentStatus;
  studentId?: string;
}

interface GroupedEnrollmentsFilters {
  type?: "class" | "seminar" | "exam";
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface StudentEnrollmentSummary {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  classEnrollments: Array<{
    id: string;
    classId: string;
    className: string;
    subjectName: string;
    gradeName: string;
    status: EnrollmentStatus;
    enrolledAt: Date;
    completedAt?: Date;
    progress: number;
    isPaid: boolean;
  }>;
  seminarRegistrations: Array<{
    id: string;
    seminarId: string;
    seminarTitle: string;
    scheduledAt: Date;
    attended: boolean;
    joinedAt?: Date;
    leftAt?: Date;
    status: SeminarStatus;
  }>;
  examAttempts: Array<{
    id: string;
    examId: string;
    examTitle: string;
    status: AttemptStatus;
    attemptNumber: number;
    startedAt: Date;
    submittedAt?: Date;
    totalScore?: number;
    maxScore: number;
    percentage?: number;
    passed?: boolean;
    islandRank?: number;
    districtRank?: number;
    zoneRank?: number;
  }>;
  stats: {
    totalClassEnrollments: number;
    activeClassEnrollments: number;
    completedClassEnrollments: number;
    totalSeminarRegistrations: number;
    attendedSeminars: number;
    totalExamAttempts: number;
    passedExams: number;
  };
}

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private dbUtils: DatabaseUtilsService
  ) {}

  async findAll(filters: FindAllFilters) {
    const where: any = {
      deletedAt: null, // Only return non-deleted enrollments
    };

    if (filters.classId) {
      where.classId = filters.classId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            grade: true,
            subject: true,
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    return enrollments;
  }

  /**
   * Get all enrollments grouped by student with expandable details
   * This provides a student-centric view of all enrollment types
   */
  async findGroupedByStudent(filters: GroupedEnrollmentsFilters): Promise<{
    data: StudentEnrollmentSummary[];
    stats: {
      totalStudents: number;
      totalClassEnrollments: number;
      totalSeminarRegistrations: number;
      totalExamAttempts: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build search condition
    const searchCondition = filters.search
      ? {
          OR: [
            {
              firstName: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              lastName: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              email: { contains: filters.search, mode: "insensitive" as const },
            },
          ],
        }
      : {};

    // Get students with any type of enrollment based on filter
    let studentIds: string[] = [];

    if (!filters.type || filters.type === "class") {
      const classEnrollments = await this.prisma.enrollment.findMany({
        where: {
          deletedAt: null,
          ...(filters.status && filters.type === "class"
            ? { status: filters.status as EnrollmentStatus }
            : {}),
        },
        select: { studentId: true },
        distinct: ["studentId"],
      });
      studentIds.push(...classEnrollments.map((e) => e.studentId));
    }

    if (!filters.type || filters.type === "seminar") {
      const seminarRegs = await this.prisma.seminarRegistration.findMany({
        where: {
          userId: { not: null },
          ...(filters.status && filters.type === "seminar"
            ? { attended: filters.status === "attended" }
            : {}),
        },
        select: { userId: true },
        distinct: ["userId"],
      });
      studentIds.push(
        ...seminarRegs.filter((s) => s.userId).map((s) => s.userId as string)
      );
    }

    if (!filters.type || filters.type === "exam") {
      const examAttempts = await this.prisma.examAttempt.findMany({
        where: {
          ...(filters.status && filters.type === "exam"
            ? { status: filters.status as AttemptStatus }
            : {}),
        },
        select: { studentId: true },
        distinct: ["studentId"],
      });
      studentIds.push(...examAttempts.map((e) => e.studentId));
    }

    // Remove duplicates
    studentIds = [...new Set(studentIds)];

    // Get total count for pagination
    const totalStudents = await this.prisma.user.count({
      where: {
        id: { in: studentIds },
        role: { in: [UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT] },
        ...searchCondition,
      },
    });

    // Get paginated students
    const students = await this.prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: { in: [UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT] },
        ...searchCondition,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip,
      take: limit,
    });

    // Fetch all enrollment details for these students
    const studentIdsPage = students.map((s) => s.id);

    const [classEnrollments, seminarRegistrations, examAttempts] =
      await Promise.all([
        this.prisma.enrollment.findMany({
          where: {
            studentId: { in: studentIdsPage },
            deletedAt: null,
          },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                subject: { select: { name: true } },
                grade: { select: { name: true } },
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        }),
        this.prisma.seminarRegistration.findMany({
          where: {
            userId: { in: studentIdsPage },
          },
          include: {
            seminar: {
              select: {
                id: true,
                title: true,
                scheduledAt: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.examAttempt.findMany({
          where: {
            studentId: { in: studentIdsPage },
          },
          include: {
            exam: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { startedAt: "desc" },
        }),
      ]);

    // Group enrollments by student
    const groupedData: StudentEnrollmentSummary[] = students.map((student) => {
      const studentClassEnrollments = classEnrollments
        .filter((e) => e.studentId === student.id)
        .map((e) => ({
          id: e.id,
          classId: e.classId,
          className: e.class?.name || "Unknown",
          subjectName: e.class?.subject?.name || "Unknown",
          gradeName: e.class?.grade?.name || "Unknown",
          status: e.status,
          enrolledAt: e.enrolledAt,
          completedAt: e.completedAt || undefined,
          progress: e.progress,
          isPaid: e.isPaid,
        }));

      const studentSeminarRegs = seminarRegistrations
        .filter((s) => s.userId === student.id)
        .map((s) => ({
          id: s.id,
          seminarId: s.seminarId,
          seminarTitle: s.seminar?.title || "Unknown",
          scheduledAt: s.seminar?.scheduledAt || new Date(),
          attended: s.attended,
          joinedAt: s.joinedAt || undefined,
          leftAt: s.leftAt || undefined,
          status: s.seminar?.status || "SCHEDULED",
        }));

      const studentExamAttempts = examAttempts
        .filter((e) => e.studentId === student.id)
        .map((e) => ({
          id: e.id,
          examId: e.examId,
          examTitle: e.exam?.title || "Unknown",
          status: e.status,
          attemptNumber: e.attemptNumber,
          startedAt: e.startedAt,
          submittedAt: e.submittedAt || undefined,
          totalScore: e.totalScore || undefined,
          maxScore: e.maxScore,
          percentage: e.percentage || undefined,
          passed: e.passed || undefined,
          islandRank: e.islandRank || undefined,
          districtRank: e.districtRank || undefined,
          zoneRank: e.zoneRank || undefined,
        }));

      return {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email || "",
          phone: student.phone || undefined,
          avatar: student.avatar || undefined,
        },
        classEnrollments: studentClassEnrollments,
        seminarRegistrations: studentSeminarRegs,
        examAttempts: studentExamAttempts,
        stats: {
          totalClassEnrollments: studentClassEnrollments.length,
          activeClassEnrollments: studentClassEnrollments.filter(
            (e) => e.status === "ACTIVE"
          ).length,
          completedClassEnrollments: studentClassEnrollments.filter(
            (e) => e.status === "COMPLETED"
          ).length,
          totalSeminarRegistrations: studentSeminarRegs.length,
          attendedSeminars: studentSeminarRegs.filter((s) => s.attended).length,
          totalExamAttempts: studentExamAttempts.length,
          passedExams: studentExamAttempts.filter((e) => e.passed).length,
        },
      };
    });

    // Calculate overall stats
    const overallStats = {
      totalStudents,
      totalClassEnrollments: await this.prisma.enrollment.count({
        where: { deletedAt: null },
      }),
      totalSeminarRegistrations: await this.prisma.seminarRegistration.count(),
      totalExamAttempts: await this.prisma.examAttempt.count(),
    };

    return {
      data: groupedData,
      stats: overallStats,
      pagination: {
        page,
        limit,
        total: totalStudents,
        totalPages: Math.ceil(totalStudents / limit),
      },
    };
  }

  /**
   * Get enrollment details for a specific student
   */
  async findStudentEnrollments(
    studentId: string
  ): Promise<StudentEnrollmentSummary | null> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
      },
    });

    if (!student) {
      return null;
    }

    const [classEnrollments, seminarRegistrations, examAttempts] =
      await Promise.all([
        this.prisma.enrollment.findMany({
          where: {
            studentId,
            deletedAt: null,
          },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                subject: { select: { name: true } },
                grade: { select: { name: true } },
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        }),
        this.prisma.seminarRegistration.findMany({
          where: { userId: studentId },
          include: {
            seminar: {
              select: {
                id: true,
                title: true,
                scheduledAt: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.examAttempt.findMany({
          where: { studentId },
          include: {
            exam: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { startedAt: "desc" },
        }),
      ]);

    const studentClassEnrollments = classEnrollments.map((e) => ({
      id: e.id,
      classId: e.classId,
      className: e.class?.name || "Unknown",
      subjectName: e.class?.subject?.name || "Unknown",
      gradeName: e.class?.grade?.name || "Unknown",
      status: e.status,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt || undefined,
      progress: e.progress,
      isPaid: e.isPaid,
    }));

    const studentSeminarRegs = seminarRegistrations.map((s) => ({
      id: s.id,
      seminarId: s.seminarId,
      seminarTitle: s.seminar?.title || "Unknown",
      scheduledAt: s.seminar?.scheduledAt || new Date(),
      attended: s.attended,
      joinedAt: s.joinedAt || undefined,
      leftAt: s.leftAt || undefined,
      status: s.seminar?.status || "SCHEDULED",
    }));

    const studentExamAttempts = examAttempts.map((e) => ({
      id: e.id,
      examId: e.examId,
      examTitle: e.exam?.title || "Unknown",
      status: e.status,
      attemptNumber: e.attemptNumber,
      startedAt: e.startedAt,
      submittedAt: e.submittedAt || undefined,
      totalScore: e.totalScore || undefined,
      maxScore: e.maxScore,
      percentage: e.percentage || undefined,
      passed: e.passed || undefined,
      islandRank: e.islandRank || undefined,
      districtRank: e.districtRank || undefined,
      zoneRank: e.zoneRank || undefined,
    }));

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || "",
        phone: student.phone || undefined,
        avatar: student.avatar || undefined,
      },
      classEnrollments: studentClassEnrollments,
      seminarRegistrations: studentSeminarRegs,
      examAttempts: studentExamAttempts,
      stats: {
        totalClassEnrollments: studentClassEnrollments.length,
        activeClassEnrollments: studentClassEnrollments.filter(
          (e) => e.status === "ACTIVE"
        ).length,
        completedClassEnrollments: studentClassEnrollments.filter(
          (e) => e.status === "COMPLETED"
        ).length,
        totalSeminarRegistrations: studentSeminarRegs.length,
        attendedSeminars: studentSeminarRegs.filter((s) => s.attended).length,
        totalExamAttempts: studentExamAttempts.length,
        passedExams: studentExamAttempts.filter((e) => e.passed).length,
      },
    };
  }

  /**
   * Create a new enrollment for a student in a class
   */
  async createEnrollment(data: {
    studentId: string;
    classId: string;
    status?: EnrollmentStatus;
    isPaid?: boolean;
  }) {
    // Check if student exists
    const student = await this.prisma.user.findUnique({
      where: { id: data.studentId },
    });
    if (!student) {
      throw new Error("Student not found");
    }

    // Check if class exists
    const classEntity = await this.prisma.class.findUnique({
      where: { id: data.classId },
    });
    if (!classEntity) {
      throw new Error("Class not found");
    }

    // Check if enrollment already exists
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: data.studentId,
        classId: data.classId,
        deletedAt: null,
      },
    });
    if (existingEnrollment) {
      throw new Error("Student is already enrolled in this class");
    }

    // Create enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        status: data.status || EnrollmentStatus.ACTIVE,
        isPaid: data.isPaid || false,
        progress: 0,
      },
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
            subject: { select: { name: true } },
            grade: { select: { name: true } },
          },
        },
      },
    });

    return enrollment;
  }

  /**
   * Update an enrollment status or payment status
   */
  async updateEnrollment(
    enrollmentId: string,
    data: {
      status?: EnrollmentStatus;
      isPaid?: boolean;
      progress?: number;
    }
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment || enrollment.deletedAt) {
      throw new Error("Enrollment not found");
    }

    const updateData: any = {};
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === EnrollmentStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
    }
    if (data.isPaid !== undefined) {
      updateData.isPaid = data.isPaid;
    }
    if (data.progress !== undefined) {
      updateData.progress = data.progress;
    }

    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: updateData,
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
            subject: { select: { name: true } },
            grade: { select: { name: true } },
          },
        },
      },
    });

    return updatedEnrollment;
  }

  /**
   * Delete (soft delete) an enrollment using DatabaseUtilsService
   */
  async deleteEnrollment(enrollmentId: string) {
    const result = await this.dbUtils.softDelete("Enrollment", enrollmentId);

    if (!result) {
      throw new NotFoundException("Enrollment not found");
    }

    return { message: "Enrollment deleted successfully" };
  }

  /**
   * Get available classes for enrollment
   */
  async getAvailableClasses() {
    const classes = await this.prisma.class.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        maxStudents: true,
        subject: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true } },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        enrollments: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
      orderBy: [{ grade: { level: "asc" } }, { subject: { name: "asc" } }],
    });

    return classes.map((c: any) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      grade: c.grade,
      teacher: c.teacher,
      maxStudents: c.maxStudents,
      enrolledCount: c.enrollments?.length || 0,
      availableSlots: c.maxStudents
        ? c.maxStudents - (c.enrollments?.length || 0)
        : null,
    }));
  }

  /**
   * Get available students for enrollment with their grade info
   */
  async getAvailableStudents(search?: string) {
    const where: any = {
      role: { in: [UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT] },
      status: "ACTIVE",
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const students = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        studentProfile: {
          select: {
            gradeId: true,
            grade: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 50,
    });

    // Flatten the response for easier consumption
    return students.map((s: any) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      avatar: s.avatar,
      gradeId: s.studentProfile?.gradeId || null,
      grade: s.studentProfile?.grade || null,
    }));
  }

  /**
   * Get available classes for a specific student (strictly filtered by student's grade)
   * Only shows classes matching the student's grade level
   */
  async getAvailableClassesForStudent(studentId: string) {
    // First check if student exists
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!student) {
      return {
        studentGrade: null,
        classes: [],
        message: "Student not found.",
      };
    }

    // Get student's grade from their profile
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
      select: {
        gradeId: true,
        grade: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    if (!studentProfile) {
      // Student has no profile at all
      return {
        studentGrade: null,
        classes: [],
        message:
          "Student profile not found. Please create a student profile first.",
      };
    }

    if (!studentProfile.gradeId) {
      // Student profile exists but no grade assigned
      return {
        studentGrade: null,
        classes: [],
        message:
          "Student does not have a grade assigned. Please update the student profile first.",
      };
    }

    // Get student's existing enrollments to exclude already enrolled classes
    const existingEnrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        deletedAt: null,
      },
      select: { classId: true },
    });
    const enrolledClassIds = existingEnrollments.map((e) => e.classId);

    // Build the where clause
    const whereClause: any = {
      status: "ACTIVE",
      gradeId: studentProfile.gradeId,
    };

    // Only add notIn filter if student has existing enrollments
    if (enrolledClassIds.length > 0) {
      whereClause.id = { notIn: enrolledClassIds };
    }

    // Get only active classes that match the student's grade (strictly filtered)
    // Note: deletedAt: null is handled by the soft-delete middleware
    const classes = await this.prisma.class.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        maxStudents: true,
        subject: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true, level: true } },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        enrollments: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
      orderBy: [{ subject: { name: "asc" } }, { name: "asc" }],
    });

    // If no active classes found, check if there are draft classes (for better error message)
    let draftClassCount = 0;
    if (classes.length === 0) {
      draftClassCount = await this.prisma.class.count({
        where: {
          status: "DRAFT",
          gradeId: studentProfile.gradeId,
        },
      });
    }

    const formattedClasses = classes.map((c: any) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      grade: c.grade,
      teacher: c.teacher,
      maxStudents: c.maxStudents,
      enrolledCount: c.enrollments?.length || 0,
      availableSlots: c.maxStudents
        ? c.maxStudents - (c.enrollments?.length || 0)
        : null,
    }));

    // Provide helpful message if no classes found
    let message: string | undefined = undefined;
    if (formattedClasses.length === 0) {
      if (draftClassCount > 0) {
        message = `No active classes available for ${studentProfile.grade?.name}. There are ${draftClassCount} draft class(es) that need to be activated first.`;
      } else if (enrolledClassIds.length > 0) {
        message = `Student is already enrolled in all available classes for ${studentProfile.grade?.name}.`;
      } else {
        message = `No classes have been created for ${studentProfile.grade?.name} yet.`;
      }
    }

    return {
      studentGrade: studentProfile.grade,
      classes: formattedClasses,
      message,
    };
  }
}
