import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";
import {
  AssignGradeDto,
  UpdateTeacherProfileDto,
  UpdateStudentProfileDto,
  UserSearchDto,
  BulkAssignGradesDto,
  TeacherWorkloadDto,
  GradeCapacityDto,
  AssignmentStatus,
  UpdateTeacherPaymentDto,
  PaymentMethod,
  PaymentStatus,
} from "./dto/user-management.dto";

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== Teacher Subject Assignment =====
  // NOTE: GradeAssignment model has been removed. Use TeacherSubjectAssignment instead.

  /**
   * Assign a subject to a teacher using TeacherSubjectAssignment model
   * This replaces the deprecated assignGradeToTeacher method
   */
  async assignSubjectToTeacher(data: AssignGradeDto) {
    // Validate teacher profile exists
    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { id: data.teacherProfileId },
      include: { user: true },
    });

    if (!teacherProfile) {
      throw AppException.notFound(
        ErrorCode.TEACHER_NOT_FOUND,
        "Teacher profile not found"
      );
    }

    // Find grade, subject, medium, and academic year by name/code
    const [grade, subject, medium, academicYear] = await Promise.all([
      this.prisma.grade.findFirst({ where: { name: data.grade } }),
      this.prisma.subject.findFirst({ where: { name: data.subject } }),
      data.section
        ? this.prisma.medium.findFirst({ where: { name: data.section } })
        : Promise.resolve(null),
      this.prisma.academicYear.findFirst({
        where: { year: data.academicYear },
      }),
    ]);

    if (!grade) {
      throw AppException.notFound(
        ErrorCode.GRADE_NOT_FOUND,
        `Grade "${data.grade}" not found`
      );
    }
    if (!subject) {
      throw AppException.notFound(
        ErrorCode.SUBJECT_NOT_FOUND,
        `Subject "${data.subject}" not found`
      );
    }
    if (!academicYear) {
      throw AppException.notFound(
        ErrorCode.ACADEMIC_YEAR_NOT_FOUND,
        `Academic year "${data.academicYear}" not found`
      );
    }

    // Use default medium if not provided
    const mediumId =
      medium?.id ||
      (await this.prisma.medium.findFirst({ where: { isActive: true } }))?.id;
    if (!mediumId) {
      throw AppException.notFound(
        ErrorCode.MEDIUM_NOT_FOUND,
        "No active medium found"
      );
    }

    // Check for existing assignment
    const existing = await this.prisma.teacherSubjectAssignment.findFirst({
      where: {
        subjectId: subject.id,
        gradeId: grade.id,
        mediumId: mediumId,
        academicYearId: academicYear.id,
        isActive: true,
        teacherProfileId: { not: data.teacherProfileId },
      },
    });

    if (existing) {
      throw AppException.conflict(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        `Subject ${data.subject} for Grade ${data.grade} is already assigned to another teacher`
      );
    }

    // Check teacher workload
    const currentAssignments = await this.prisma.teacherSubjectAssignment.count(
      {
        where: {
          teacherProfileId: data.teacherProfileId,
          academicYearId: academicYear.id,
          isActive: true,
        },
      }
    );

    if (currentAssignments >= (teacherProfile.maxClassesPerWeek || 20)) {
      throw AppException.badRequest(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        `Teacher has reached maximum assignment limit (${teacherProfile.maxClassesPerWeek || 20})`
      );
    }

    // Create teacher subject assignment
    const assignment = await this.prisma.teacherSubjectAssignment.create({
      data: {
        teacherProfileId: data.teacherProfileId,
        subjectId: subject.id,
        gradeId: grade.id,
        mediumId: mediumId,
        academicYearId: academicYear.id,
        maxStudents:
          data.maxStudents || teacherProfile.maxStudentsPerClass || 40,
        effectiveFrom: data.effectiveFrom
          ? new Date(data.effectiveFrom)
          : new Date(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        notes: data.notes,
      },
      include: {
        subject: true,
        grade: true,
        medium: true,
        academicYear: true,
      },
    });

    return assignment;
  }

  /**
   * @deprecated Use assignSubjectToTeacher instead
   */
  async assignGradeToTeacher(data: AssignGradeDto) {
    this.logger.warn(
      "assignGradeToTeacher is deprecated. Use assignSubjectToTeacher instead."
    );
    return this.assignSubjectToTeacher(data);
  }

  async bulkAssignGrades(data: BulkAssignGradesDto) {
    const results = [];
    const errors = [];

    for (const assignment of data.assignments) {
      try {
        const result = await this.assignGradeToTeacher(assignment);
        results.push(result);
      } catch (error: unknown) {
        errors.push({
          assignment,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      assignments: results,
      errors,
    };
  }

  async removeGradeAssignment(assignmentId: string) {
    const assignment = await this.prisma.teacherSubjectAssignment.findUnique({
      where: { id: assignmentId },
      include: { teacherProfile: true },
    });

    if (!assignment) {
      throw AppException.notFound(
        ErrorCode.TEACHER_ASSIGNMENT_NOT_FOUND,
        "Assignment not found"
      );
    }

    // Update status to inactive instead of deleting
    await this.prisma.teacherSubjectAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        effectiveTo: new Date(),
      },
    });

    return { message: "Subject assignment removed successfully" };
  }

  // ===== Teacher Profile Management =====

  async updateTeacherProfile(
    teacherProfileId: string,
    data: UpdateTeacherProfileDto
  ) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
    });

    if (!profile) {
      throw AppException.notFound(
        ErrorCode.TEACHER_NOT_FOUND,
        "Teacher profile not found"
      );
    }

    return this.prisma.teacherProfile.update({
      where: { id: teacherProfileId },
      data,
    });
  }

  async getTeacherProfile(teacherProfileId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        subjectAssignments: {
          where: { isActive: true },
          include: {
            subject: true,
            grade: true,
            medium: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      throw AppException.notFound(
        ErrorCode.TEACHER_NOT_FOUND,
        "Teacher profile not found"
      );
    }

    // Get active classes and student count
    const activeClasses = await this.prisma.class.count({
      where: {
        teacherId: profile.userId,
        status: "ACTIVE",
      },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        class: {
          teacherId: profile.userId,
          status: "ACTIVE",
        },
      },
      distinct: ["studentId"],
    });

    return {
      ...profile,
      activeClasses,
      totalStudents: enrollments.length,
    };
  }

  async getTeacherWorkload(
    teacherProfileId: string,
    academicYear: string
  ): Promise<TeacherWorkloadDto> {
    // Find academic year by name
    const academicYearRecord = await this.prisma.academicYear.findFirst({
      where: { year: academicYear },
    });

    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      include: {
        user: true,
        subjectAssignments: {
          where: {
            academicYearId: academicYearRecord?.id,
            isActive: true,
          },
          include: {
            subject: true,
            grade: true,
            medium: true,
          },
        },
      },
    });

    if (!profile) {
      throw AppException.notFound(
        ErrorCode.TEACHER_NOT_FOUND,
        "Teacher profile not found"
      );
    }

    const totalClasses = profile.subjectAssignments.length;

    // Get grade IDs from assignments
    const gradeIds = profile.subjectAssignments.map((a) => a.gradeId);

    // Count unique students across all assignments
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        class: {
          teacherId: profile.userId,
          gradeId: { in: gradeIds },
          status: "ACTIVE",
        },
      },
      distinct: ["studentId"],
    });

    const weeklyHours = totalClasses * 2; // Assuming 2 hours per class per week
    const maxHours = profile.maxClassesPerWeek || 20;
    const utilizationPercentage = (weeklyHours / maxHours) * 100;

    let status: "underutilized" | "optimal" | "overloaded" = "optimal";
    if (utilizationPercentage < 60) {status = "underutilized";}
    else if (utilizationPercentage > 90) {status = "overloaded";}

    return {
      teacherId: profile.userId,
      teacherName: `${profile.user.firstName} ${profile.user.lastName}`,
      totalClasses,
      totalStudents: enrollments.length,
      weeklyHours,
      gradeAssignments: profile.subjectAssignments.map((a) => ({
        grade: a.grade.name,
        subject: a.subject.name,
        section: a.medium.name,
        studentCount: 0, // Will be calculated per assignment if needed
      })),
      utilizationPercentage,
      status,
    };
  }

  // ===== Teacher Payment Management =====

  async updateTeacherPayment(
    teacherProfileId: string,
    data: UpdateTeacherPaymentDto
  ) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
    });

    if (!profile) {
      throw new NotFoundException("Teacher profile not found");
    }

    // FIXED: Comment out until schema is updated
    // return this.prisma.teacherProfile.update({
    //   where: { id: teacherProfileId },
    //   data: {
    //     paymentPerClass: data.paymentPerClass,
    //     paymentCurrency: data.paymentCurrency,
    //     paymentMethod: data.paymentMethod,
    //     autoApproveExams: data.autoApproveExams,
    //   },
    // });

    throw new BadRequestException(
      "Teacher payment features are currently disabled. Please update the Prisma schema first."
    );
  }

  async calculateMonthlyPayment(
    teacherProfileId: string,
    month: string // Format: "YYYY-MM"
  ) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException("Teacher profile not found");
    }

    // FIXED: Comment out entire payment calculation until schema is updated
    throw new BadRequestException(
      "Teacher payment calculation is currently disabled. Please update the Prisma schema first."
    );

    // // Calculate date range for the month
    // const startDate = new Date(`${month}-01`);
    // const endDate = new Date(startDate);
    // endDate.setMonth(endDate.getMonth() + 1);
    // endDate.setDate(endDate.getDate() - 1);

    // let totalClasses = 0;
    // let totalSessions = 0;
    // let totalAmount = 0;

    // // COUNT BASED ON PAYMENT METHOD
    // if (
    //   profile.paymentMethod === "PER_CLASS" ||
    //   profile.paymentMethod === "MONTHLY"
    // ) {
    //   // Count classes for PER_CLASS and MONTHLY (though MONTHLY doesn't use the count)
    //   totalClasses = await this.prisma.class.count({
    //     where: {
    //       teacherId: profile.userId,
    //       status: "ACTIVE",
    //       startDate: {
    //         gte: startDate,
    //         lte: endDate,
    //       },
    //     },
    //   });
    // }

    // if (profile.paymentMethod === "PER_SESSION") {
    //   // Count video sessions for PER_SESSION teachers
    //   totalSessions = await this.prisma.videoSession.count({
    //     where: {
    //       hostId: profile.userId,
    //       status: "ENDED", // Only count completed sessions
    //       scheduledStartTime: {
    //         gte: startDate,
    //         lte: endDate,
    //       },
    //     },
    //   });
    // }

    // // CALCULATE AMOUNT BASED ON PAYMENT METHOD
    // switch (profile.paymentMethod) {
    //   case "MONTHLY":
    //     totalAmount = profile.paymentPerClass || 0; // Fixed monthly amount
    //     break;
    //   case "PER_CLASS":
    //     totalAmount = totalClasses * (profile.paymentPerClass || 0);
    //     break;
    //   case "PER_SESSION":
    //     totalAmount = totalSessions * (profile.paymentPerClass || 0);
    //     break;
    //   default:
    //     totalAmount = 0;
    // }

    // // Create or update payment record
    // const existingPayment = await this.prisma.teacherMonthlyPayment.findUnique({
    //   where: {
    //     teacherProfileId_month: {
    //       teacherProfileId,
    //       month,
    //     },
    //   },
    // });

    // if (existingPayment) {
    //   return this.prisma.teacherMonthlyPayment.update({
    //     where: { id: existingPayment.id },
    //     data: {
    //       totalClasses:
    //         profile.paymentMethod === "PER_SESSION" ? 0 : totalClasses,
    //       totalAmount,
    //     },
    //   });
    // }

    // return this.prisma.teacherMonthlyPayment.create({
    //   data: {
    //     teacherProfileId,
    //     month,
    //     totalClasses:
    //       profile.paymentMethod === "PER_SESSION" ? 0 : totalClasses,
    //     paymentPerClass: profile.paymentPerClass || 0,
    //     totalAmount,
    //   },
    // });
  }

  async markPaymentAsPaid(paymentId: string, paidBy: string, notes?: string) {
    // FIXED: Comment out until schema is updated
    throw new BadRequestException(
      "Payment marking is currently disabled. Please update the Prisma schema first."
    );

    // const payment = await this.prisma.teacherMonthlyPayment.findUnique({
    //   where: { id: paymentId },
    //   include: { teacherProfile: true },
    // });

    // if (!payment) {
    //   throw new NotFoundException("Payment record not found");
    // }

    // if (payment.isPaid) {
    //   throw new BadRequestException("Payment is already marked as paid");
    // }

    // const updatedPayment = await this.prisma.teacherMonthlyPayment.update({
    //   where: { id: paymentId },
    //   data: {
    //     isPaid: true,
    //     paidAt: new Date(),
    //     paidBy,
    //     notes,
    //   },
    // });

    // // Update teacher profile with total earnings
    // await this.prisma.teacherProfile.update({
    //   where: { id: payment.teacherProfileId },
    //   data: {
    //     totalEarnings: {
    //       increment: payment.totalAmount,
    //     },
    //     lastPaymentDate: new Date(),
    //     pendingPayment: {
    //       decrement: payment.totalAmount,
    //     },
    //   },
    // });

    // return updatedPayment;
  }

  async getTeacherPaymentSummary(teacherProfileId: string, months: number = 6) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException("Teacher profile not found");
    }

    // FIXED: Return empty summary until schema is updated
    return {
      teacher: {
        id: profile.userId,
        name: `${profile.user.firstName} ${profile.user.lastName}`,
        paymentPerClass: 0,
        paymentMethod: PaymentMethod.PER_CLASS,
        autoApproveExams: false,
      },
      payments: [],
      summary: {
        totalEarnings: 0,
        pendingPayment: 0,
        totalClasses: 0,
      },
    };

    // // Generate last N months
    // const monthsList = [];
    // for (let i = 0; i < months; i++) {
    //   const date = new Date();
    //   date.setMonth(date.getMonth() - i);
    //   const month = date.toISOString().slice(0, 7); // "YYYY-MM"
    //   monthsList.push(month);
    // }

    // const payments = await this.prisma.teacherMonthlyPayment.findMany({
    //   where: {
    //     teacherProfileId,
    //     month: { in: monthsList },
    //   },
    //   orderBy: { month: "desc" },
    // });

    // // Calculate totals
    // const totalEarnings = payments
    //   .filter((p) => p.isPaid)
    //   .reduce((sum, p) => sum + p.totalAmount, 0);

    // const pendingPayment = payments
    //   .filter((p) => !p.isPaid)
    //   .reduce((sum, p) => sum + p.totalAmount, 0);

    // return {
    //   teacher: {
    //     id: profile.userId,
    //     name: `${profile.user.firstName} ${profile.user.lastName}`,
    //     paymentPerClass: profile.paymentPerClass,
    //     autoApproveExams: profile.autoApproveExams,
    //   },
    //   payments,
    //   summary: {
    //     totalEarnings,
    //     pendingPayment,
    //     totalClasses: payments.reduce((sum, p) => sum + p.totalClasses, 0),
    //   },
    // };
  }

  async getAllPendingPayments(month?: string) {
    // FIXED: Return empty pending payments until schema is updated
    return {
      payments: [],
      summary: {
        totalTeachers: 0,
        totalPendingAmount: 0,
        totalPendingClasses: 0,
      },
    };

    // const where: any = { isPaid: false };

    // if (month) {
    //   where.month = month;
    // }

    // const payments = await this.prisma.teacherMonthlyPayment.findMany({
    //   where,
    //   include: {
    //     teacherProfile: {
    //       include: {
    //         user: {
    //           select: {
    //             firstName: true,
    //             lastName: true,
    //             email: true,
    //             phone: true,
    //           },
    //         },
    //       },
    //     },
    //   },
    //   orderBy: { month: "desc" },
    // });

    // const totalPending = payments.reduce((sum, p) => sum + p.totalAmount, 0);

    // return {
    //   payments,
    //   summary: {
    //     totalTeachers: payments.length,
    //     totalPendingAmount: totalPending,
    //     totalPendingClasses: payments.reduce(
    //       (sum, p) => sum + p.totalClasses,
    //       0
    //     ),
    //   },
    // };
  }

  async exportPayments(month?: string): Promise<string> {
    // FIXED: Return empty CSV until schema is updated
    const headers = [
      "Teacher Name",
      "Email",
      "Phone",
      "Month",
      "Total Classes",
      "Payment Per Class",
      "Total Amount",
      "Status",
      "Paid At",
    ];
    return headers.join(",") + "\n";

    // const where: any = {};

    // if (month) {
    //   where.month = month;
    // }

    // const payments = await this.prisma.teacherMonthlyPayment.findMany({
    //   where,
    //   include: {
    //     teacherProfile: {
    //       include: {
    //         user: {
    //           select: {
    //             firstName: true,
    //             lastName: true,
    //             email: true,
    //             phone: true,
    //           },
    //         },
    //       },
    //     },
    //   },
    //   orderBy: { month: "desc" },
    // });

    // // Generate CSV
    // const headers = [
    //   "Teacher Name",
    //   "Email",
    //   "Phone",
    //   "Month",
    //   "Total Classes",
    //   "Payment Per Class",
    //   "Total Amount",
    //   "Status",
    //   "Paid At",
    // ];

    // const csvRows = [headers.join(",")];

    // for (const payment of payments) {
    //   const row = [
    //     `${payment.teacherProfile.user.firstName} ${payment.teacherProfile.user.lastName}`,
    //     payment.teacherProfile.user.email || "",
    //     payment.teacherProfile.user.phone || "",
    //     payment.month,
    //     payment.totalClasses.toString(),
    //     payment.paymentPerClass.toString(),
    //     payment.totalAmount.toString(),
    //     payment.isPaid ? "Paid" : "Pending",
    //     payment.paidAt ? new Date(payment.paidAt).toISOString() : "",
    //   ];

    //   const escapedRow = row.map((field) => {
    //     const fieldStr = String(field);
    //     if (
    //       fieldStr.includes(",") ||
    //       fieldStr.includes('"') ||
    //       fieldStr.includes("\n")
    //     ) {
    //       return `"${fieldStr.replace(/"/g, '""')}"`;
    //     }
    //     return fieldStr;
    //   });

    //   csvRows.push(escapedRow.join(","));
    // }

    // return csvRows.join("\n");
  }

  // Auto-calculate payments for all teachers for a specific month
  async calculateAllMonthlyPayments(month: string) {
    // FIXED: Return empty results until schema is updated
    return {
      success: 0,
      failed: 0,
      results: [],
      errors: [],
    };

    // const teachers = await this.prisma.teacherProfile.findMany({
    //   include: { user: true },
    //   where: {
    //     paymentPerClass: { gt: 0 }, // Only teachers with payment set
    //   },
    // });

    // const results = [];
    // const errors = [];

    // for (const teacher of teachers) {
    //   try {
    //     const payment = await this.calculateMonthlyPayment(teacher.id, month);
    //     results.push({
    //       teacherId: teacher.userId,
    //       teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
    //       payment,
    //     });
    //   } catch (error: unknown) {
    //     errors.push({
    //       teacherId: teacher.userId,
    //       teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
    //       error: error instanceof Error ? error.message : String(error),
    //     });
    //   }
    // }

    // return {
    //   success: results.length,
    //   failed: errors.length,
    //   results,
    //   errors,
    // };
  }

  // ===== Student Profile Management =====

  async updateStudentProfile(
    studentProfileId: string,
    data: UpdateStudentProfileDto
  ) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
    });

    if (!profile) {
      throw AppException.notFound(
        ErrorCode.STUDENT_NOT_FOUND,
        "Student profile not found"
      );
    }

    // Convert grade name to gradeId if provided
    const updateData: any = { ...data };
    if (data.grade) {
      const gradeRecord = await this.prisma.grade.findFirst({
        where: {
          OR: [
            { name: { equals: data.grade, mode: "insensitive" } },
            { code: { equals: data.grade, mode: "insensitive" } },
          ],
        },
      });
      if (gradeRecord) {
        updateData.gradeId = gradeRecord.id;
      }
      delete updateData.grade;
    }

    return this.prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: updateData,
    });
  }

  async getStudentProfile(studentProfileId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        user: {
          include: {
            enrollments: {
              include: {
                class: {
                  select: {
                    subject: true,
                    grade: true,
                    teacher: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
              where: {
                // Map legacy ENROLLED/IN_PROGRESS semantics to ACTIVE
                status: { in: ["ACTIVE"] },
              },
            },
            attendanceRecords: {
              where: {
                date: {
                  gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
                },
              },
            },
            examAttempts: {
              include: {
                exam: true,
              },
              orderBy: {
                submittedAt: "desc",
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw AppException.notFound(
        ErrorCode.STUDENT_NOT_FOUND,
        "Student profile not found"
      );
    }

    // Calculate attendance rate
    const attendanceRecords = profile.user.attendanceRecords;
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (a: any) => a.present === true
    ).length;
    const attendanceRate =
      totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    // Calculate exam performance
    // AttemptStatus does not have COMPLETED; using GRADED as final state
    const completedExams = profile.user.examAttempts.filter(
      (a: any) => a.status === "GRADED"
    );
    const averageScore =
      completedExams.length > 0
        ? completedExams.reduce(
            (sum: number, a: any) => sum + (a.score || 0),
            0
          ) / completedExams.length
        : 0;
    const passedExams = completedExams.filter(
      (a: any) => (a.score || 0) >= 40
    ).length;
    const passRate =
      completedExams.length > 0
        ? (passedExams / completedExams.length) * 100
        : 0;

    return {
      ...profile,
      enrolledSubjects: profile.user.enrollments.map((e: any) => ({
        subject: e.class.subject,
        grade: e.class.grade,
        teacher: `${e.class.teacher.firstName} ${e.class.teacher.lastName}`,
        status: e.status,
      })),
      attendanceRate,
      examPerformance: {
        averageScore,
        totalExams: completedExams.length,
        passRate,
      },
    };
  }

  // ===== Grade and Capacity Management =====

  async getGradeCapacity(
    grade: string,
    academicYear: string
  ): Promise<GradeCapacityDto> {
    // Lookup grade by name to get ID
    const gradeRecord = await this.prisma.grade.findFirst({
      where: {
        OR: [
          { name: { equals: grade, mode: "insensitive" } },
          { code: { equals: grade, mode: "insensitive" } },
        ],
      },
    });

    if (!gradeRecord) {
      throw AppException.notFound(
        ErrorCode.GRADE_NOT_FOUND,
        `Grade '${grade}' not found`
      );
    }

    // Get all students in this grade
    const students = await this.prisma.studentProfile.findMany({
      where: {
        gradeId: gradeRecord.id,
        academicYear,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get all assignments for this grade
    const academicYearRecord = await this.prisma.academicYear.findFirst({
      where: { year: academicYear },
    });

    const assignments = await this.prisma.teacherSubjectAssignment.findMany({
      where: {
        gradeId: gradeRecord.id,
        academicYearId: academicYearRecord?.id,
        isActive: true,
      },
      include: {
        subject: true,
        medium: true,
        teacherProfile: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Group by medium (replaces section)
    const mediums = [
      ...new Set(assignments.map((a) => a.medium?.name || "Default")),
    ];
    const sectionData = mediums.map((medium) => {
      const mediumAssignments = assignments.filter(
        (a) => (a.medium?.name || "Default") === medium
      );
      const maxCapacity = Math.max(
        ...mediumAssignments.map((a) => a.maxStudents || 40)
      );
      const studentsInSection = students.filter((s) => {
        // In real scenario, students would have section info
        return true; // Placeholder
      }).length;

      return {
        section: medium,
        students: Math.floor(students.length / mediums.length), // Simplified distribution
        capacity: maxCapacity,
        teacher: "Not assigned",
      };
    });

    const totalCapacity = sectionData.reduce((sum, s) => sum + s.capacity, 0);
    const totalStudents = students.length;

    // Group teachers by subject
    const teachersBySubject = assignments.reduce(
      (acc, a) => {
        const subjectName = a.subject?.name || "Unknown";
        const existing = acc.find((t) => t.subject === subjectName);
        const teacherName = `${a.teacherProfile.user.firstName} ${a.teacherProfile.user.lastName}`;
        const section = a.medium?.name || "All";

        if (existing) {
          if (!existing.sections.includes(section)) {
            existing.sections.push(section);
          }
        } else {
          acc.push({
            name: teacherName,
            subject: subjectName,
            sections: [section],
          });
        }
        return acc;
      },
      [] as Array<{ name: string; subject: string; sections: string[] }>
    );

    return {
      grade,
      totalStudents,
      totalCapacity,
      utilizationRate:
        totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0,
      sections: sectionData,
      teachers: teachersBySubject,
    };
  }

  // ===== Search and List =====

  async searchUsers(params: UserSearchDto) {
    const {
      query,
      role,
      grade,
      status,
      department,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const where: any = {};

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (
      grade &&
      (role === "STUDENT" ||
        role === "INTERNAL_STUDENT" ||
        role === "EXTERNAL_STUDENT")
    ) {
      where.studentProfile = {
        grade,
      };
    }

    if (department && role === "TEACHER") {
      where.teacherProfile = {
        department,
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          studentProfile: true,
          teacherProfile: {
            include: {
              subjectAssignments: {
                where: { isActive: true },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTeachersWithWorkload(academicYear: string) {
    const teachers = await this.prisma.teacherProfile.findMany({
      include: {
        user: true,
        subjectAssignments: {
          where: {
            isActive: true,
          },
        },
      },
    });

    const workloads = await Promise.all(
      teachers.map((teacher) =>
        this.getTeacherWorkload(teacher.id, academicYear)
      )
    );

    return workloads;
  }

  async getGradeDistribution() {
    const students = await this.prisma.studentProfile.groupBy({
      by: ["gradeId"],
      _count: {
        gradeId: true,
      },
      where: {
        gradeId: { not: null },
      },
      orderBy: {
        gradeId: "asc",
      },
    });

    // Lookup grade names
    const gradeIds = students
      .map((s) => s.gradeId)
      .filter((id): id is string => id !== null);
    const grades = await this.prisma.grade.findMany({
      where: {
        id: { in: gradeIds },
      },
    });

    const gradeMap = new Map(grades.map((g) => [g.id, g.name]));

    return students.map((s) => ({
      grade: s.gradeId ? gradeMap.get(s.gradeId) || s.gradeId : "",
      count: s._count.gradeId || 0,
    }));
  }
}
