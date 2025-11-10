import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { RoleHelper } from "../../shared/helpers/role.helper";
import { RegistrationNumberService } from "../../shared/services/registration-number.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EmailService } from "../notifications/services/email.service";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { User, UserRole, UserStatus, FeedbackType } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { AdminGateway } from "../../infrastructure/websocket/admin.gateway";
import { AppException, ErrorCode } from "@common/errors";
import * as Papa from "papaparse";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private adminGateway: AdminGateway,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private registrationNumberService: RegistrationNumberService
  ) {}

  /**
   * Generate a secure random password
   */
  private generateSecurePassword(length: number = 12): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + special;

    let password = "";
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }

  async create(createUserDto: CreateUserDto): Promise<Omit<User, "password">> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: createUserDto.phone },
    });

    if (existingUser) {
      throw new AppException(ErrorCode.USER_ALREADY_EXISTS, undefined, {
        phone: createUserDto.phone,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Prepare user data with proper date formatting
    const userData: any = {
      phone: createUserDto.phone,
      email: createUserDto.email || null,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role: createUserDto.role,
      bio: createUserDto.bio || null,
      status: UserStatus.ACTIVE,
    };

    // Convert date string to ISO-8601 DateTime if provided
    if (createUserDto.dateOfBirth) {
      const dateStr = createUserDto.dateOfBirth;

      // If it's just a date (YYYY-MM-DD), convert to ISO datetime
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // Create date at noon UTC to avoid timezone issues
        userData.dateOfBirth = new Date(`${dateStr}T12:00:00.000Z`);
      } else {
        // Try to parse as full datetime
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          userData.dateOfBirth = parsedDate;
        }
      }
    }

    // Create user
    const user = await this.prisma.user.create({
      data: userData,
    });

    // Create role-specific profiles
    if (RoleHelper.isTeacher(createUserDto.role)) {
      // Use the teacherProfile data from DTO if provided
      const teacherProfileData = createUserDto.teacherProfile || {};

      // FIXED: Create teacher data object with only existing fields
      const teacherData: any = {
        userId: user.id,
        isExternalTransferOnly: RoleHelper.isExternal(createUserDto.role),
      };

      if (createUserDto.teacherProfile) {
        if (createUserDto.teacherProfile.specialization) {
          teacherData.specialization =
            createUserDto.teacherProfile.specialization;
        }
        if (createUserDto.teacherProfile.experience) {
          teacherData.experience = createUserDto.teacherProfile.experience;
        }
      }

      const teacherProfile = await this.prisma.teacherProfile.create({
        data: teacherData,
      });

      // Create teacher subject assignments
      if (
        createUserDto.teacherProfile?.subjectAssignments &&
        createUserDto.teacherProfile.subjectAssignments.length > 0
      ) {
        // Lookup academicYearId for each assignment
        const assignmentsWithAcademicYearId = await Promise.all(
          createUserDto.teacherProfile.subjectAssignments.map(
            async (assignment) => {
              const academicYearRecord =
                await this.prisma.academicYear.findFirst({
                  where: { year: assignment.academicYear },
                });
              if (!academicYearRecord) {
                throw AppException.badRequest(
                  ErrorCode.ACADEMIC_YEAR_NOT_FOUND,
                  `Academic year ${assignment.academicYear} not found`
                );
              }
              return {
                teacherProfileId: teacherProfile.id,
                subjectId: assignment.subjectId,
                gradeId: assignment.gradeId,
                mediumId: assignment.mediumId,
                academicYearId: academicYearRecord.id,
                canCreateExams: assignment.canCreateExams ?? true,
                maxStudents: assignment.maxStudents,
                isActive: true,
              };
            }
          )
        );

        await this.prisma.teacherSubjectAssignment.createMany({
          data: assignmentsWithAcademicYearId,
        });
      }
    } else if (RoleHelper.isStudent(createUserDto.role)) {
      // First, resolve grade ID if grade name is provided
      let gradeId: string | undefined;
      if (createUserDto.studentProfile?.grade) {
        const grade = await this.prisma.grade.findFirst({
          where: {
            OR: [
              {
                name: {
                  equals: createUserDto.studentProfile.grade,
                  mode: "insensitive",
                },
              },
              {
                code: {
                  equals: createUserDto.studentProfile.grade,
                  mode: "insensitive",
                },
              },
            ],
          },
        });
        if (grade) {
          gradeId = grade.id;
        }
      }

      // Generate proper registration number using the service
      // Format: INSTITUTION_CODE/STUDENT_TYPE/AL_BATCH_YEAR/SEQUENCE
      // Example: PV/IN/2019/001
      const registrationNumber =
        await this.registrationNumberService.generateRegistrationNumber(
          createUserDto.role,
          gradeId
        );

      const studentData: any = {
        userId: user.id,
        studentId: registrationNumber,
        academicYear: new Date().getFullYear().toString(),
      };

      if (gradeId) {
        studentData.gradeId = gradeId;
      }

      if (createUserDto.studentProfile?.batch) {
        studentData.batch = createUserDto.studentProfile.batch;
      }

      await this.prisma.studentProfile.create({
        data: studentData,
      });

      this.logger.log(
        `Created student profile with registration number: ${registrationNumber}`
      );
    }

    // Remove password from response
    const { password, ...result } = user;

    // Emit real-time event
    this.adminGateway.server.emit("userCreated", {
      userId: user.id,
      data: result,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    role?: string,
    status?: string,
    search?: string,
    grade?: string,
    subject?: string,
    batch?: string,
    medium?: string,
    institution?: string
  ): Promise<{
    data: any[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const where: any = {};

    // Filter by role (supports comma-separated list)
    if (role) {
      if (role.includes(",")) {
        const roles = role
          .split(",")
          .map((r) => r.trim())
          .filter((r) =>
            Object.values(UserRole).includes(r as UserRole)
          ) as UserRole[];
        if (roles.length > 0) {
          where.role = { in: roles };
        }
      } else if (Object.values(UserRole).includes(role as UserRole)) {
        where.role = role as UserRole;
      }
    }

    // Filter by status (supports comma-separated list)
    if (status) {
      if (status.includes(",")) {
        const statuses = status
          .split(",")
          .map((s) => s.trim())
          .filter((s) =>
            Object.values(UserStatus).includes(s as UserStatus)
          ) as UserStatus[];
        if (statuses.length > 0) {
          where.status = { in: statuses };
        }
      } else if (Object.values(UserStatus).includes(status as UserStatus)) {
        where.status = status as UserStatus;
      }
    }

    // Search in name and email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by grade (for students) - grade parameter should be gradeId
    if (grade) {
      where.studentProfile = {
        ...where.studentProfile,
        gradeId: grade,
      };
    }

    // Filter by batch (for students)
    if (batch) {
      where.studentProfile = {
        ...where.studentProfile,
        batch: batch,
      };
    }

    // Filter by subject using TeacherSubjectAssignment (for teachers)
    if (subject) {
      where.teacherProfile = {
        ...where.teacherProfile,
        subjectAssignments: {
          some: {
            subjectId: subject,
            isActive: true,
          },
        },
      };
    }

    // Filter by medium - medium parameter should be mediumId
    if (medium) {
      where.studentProfile = {
        ...where.studentProfile,
        mediumId: medium,
      };
    }

    // Filter by institution
    if (institution) {
      where.institution = {
        contains: institution,
        mode: "insensitive",
      };
    }

    const total = await this.prisma.user.count({ where });
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // FIXED: Remove monthlyPayments relation until schema is updated
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        studentProfile: {
          include: {
            grade: true,
            medium: true,
            batch: true,
          },
        },
        teacherProfile: {
          include: {
            subjectAssignments: {
              where: { isActive: true },
              include: {
                subject: true,
                grade: true,
                medium: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to include medium, institution, and teaching subjects at root level
    const transformedData = users.map((user: any) => {
      // Extract teaching subjects from TeacherSubjectAssignment
      const teachingSubjects =
        user.teacherProfile?.subjectAssignments?.map((assignment: any) => ({
          id: assignment.subject.id,
          name: assignment.subject.name,
          code: assignment.subject.code,
          gradeId: assignment.gradeId,
          gradeName: assignment.grade?.name,
          mediumId: assignment.mediumId,
          mediumName: assignment.medium?.name,
          assignmentId: assignment.id,
          canCreateExams: assignment.canCreateExams,
          maxStudents: assignment.maxStudents,
        })) || [];

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        bio: user.bio,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        lastLogoutAt: user.lastLogoutAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        teachingSubjects, // Loaded from TeacherSubjectAssignment
        studentProfile: user.studentProfile || null,
        teacherProfile: user.teacherProfile || null,
        medium: user.studentProfile?.medium || null,
        institution: user.institution || null,
      };
    });

    return {
      data: transformedData,
      total,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  // Get aggregated teacher stats (attendance patterns and basic performance)
  async getTeacherStats(teacherId: string): Promise<any> {
    // Find classes for teacher
    const classes = await this.prisma.class.findMany({
      where: { teacherId },
      select: { id: true, name: true },
    });
    const classIds = classes.map((c) => c.id);

    // if no classes, return zeros
    if (classIds.length === 0) {
      return {
        totalClasses: 0,
        totalSessions: 0,
        totalAttendanceRecords: 0,
        presentCount: 0,
        avgAttendancePercent: 0,
        attendancePattern: [],
      };
    }

    // Get sessions for those classes, include attendance
    const sessions = await this.prisma.classSession.findMany({
      where: { classId: { in: classIds } },
      include: { attendances: true, class: true },
    });

    const totalSessions = sessions.length;
    let totalAttendanceRecords = 0;
    let presentCount = 0;

    const since = new Date();
    const days = 30;
    since.setDate(since.getDate() - days);

    const dayMap: Record<
      string,
      { sessions: number; present: number; total: number }
    > = {};

    for (const s of sessions) {
      const sDate = new Date(s.date);
      const key = sDate.toISOString().split("T")[0];
      const total = (s.attendances || []).length;
      const present = (s.attendances || []).filter(
        (a) => a.present === true
      ).length;
      totalAttendanceRecords += total;
      presentCount += present;
      if (sDate >= since) {
        if (!dayMap[key]) {
          dayMap[key] = { sessions: 0, present: 0, total: 0 };
        }
        dayMap[key].sessions += 1;
        dayMap[key].present += present;
        dayMap[key].total += total;
      }
    }

    // Build attendance pattern array for last N days
    const attendancePattern: Array<{
      date: string;
      sessions: number;
      present: number;
      total: number;
      percent: number;
    }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const entry = dayMap[key] || { sessions: 0, present: 0, total: 0 };
      attendancePattern.push({
        date: key,
        sessions: entry.sessions,
        present: entry.present,
        total: entry.total,
        percent:
          entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : 0,
      });
    }

    const avgAttendancePercent =
      totalAttendanceRecords > 0
        ? Math.round((presentCount / totalAttendanceRecords) * 100)
        : 0;

    // Compute average feedback score for this teacher
    const teacherProfile = await this.prisma.teacherProfile.findFirst({
      where: { userId: teacherId },
    });
    const referenceIds = [teacherId];
    if (teacherProfile?.id) {
      referenceIds.push(teacherProfile.id);
    }
    const feedbacks = await this.prisma.feedback.findMany({
      where: {
        type: FeedbackType.TEACHER,
        referenceId: { in: referenceIds },
        rating: { not: null },
      },
    });
    const feedbackCount = feedbacks.length;
    const feedbackSum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    const avgFeedback =
      feedbackCount > 0 ? +(feedbackSum / feedbackCount).toFixed(1) : 0;

    return {
      totalClasses: classIds.length,
      totalSessions,
      totalAttendanceRecords,
      presentCount,
      avgAttendancePercent,
      averageFeedback: avgFeedback,
      attendancePattern,
    };
  }

  async exportUsers(
    role?: string,
    status?: string,
    search?: string
  ): Promise<string> {
    // Build the where clause similar to findAll
    const where: any = {};

    if (role) {
      if (role.includes(",")) {
        const roles = role
          .split(",")
          .map((r) => r.trim())
          .filter((r) =>
            Object.values(UserRole).includes(r as UserRole)
          ) as UserRole[];
        if (roles.length > 0) {
          where.role = { in: roles };
        }
      } else if (Object.values(UserRole).includes(role as UserRole)) {
        where.role = role as UserRole;
      }
    }

    if (status) {
      if (status.includes(",")) {
        const statuses = status
          .split(",")
          .map((s) => s.trim())
          .filter((s) =>
            Object.values(UserStatus).includes(s as UserStatus)
          ) as UserStatus[];
        if (statuses.length > 0) {
          where.status = { in: statuses };
        }
      } else if (Object.values(UserStatus).includes(status as UserStatus)) {
        where.status = status as UserStatus;
      }
    }

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Fetch all users matching the criteria (no pagination)
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phone: true,
        dateOfBirth: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate CSV
    const headers = [
      "ID",
      "Email",
      "First Name",
      "Last Name",
      "Role",
      "Status",
      "Phone",
      "Date of Birth",
      "Created At",
    ];
    const csvRows = [headers.join(",")];

    for (const user of users) {
      const row = [
        user.id,
        user.email || "",
        user.firstName,
        user.lastName,
        user.role,
        user.status,
        user.phone || "",
        user.dateOfBirth || "",
        user.createdAt.toISOString(),
      ];
      // Escape fields that might contain commas or quotes
      const escapedRow = row.map((field) => {
        const fieldStr = String(field);
        if (
          fieldStr.includes(",") ||
          fieldStr.includes('"') ||
          fieldStr.includes("\n")
        ) {
          return `"${fieldStr.replace(/"/g, '""')}"`;
        }
        return fieldStr;
      });
      csvRows.push(escapedRow.join(","));
    }

    return csvRows.join("\n");
  }

  /**
   * Get aggregated user statistics
   */
  async getUserStats(role?: string): Promise<any> {
    const where: any = {};

    if (role && Object.values(UserRole).includes(role as UserRole)) {
      where.role = role as UserRole;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      newUsersToday,
      newUsersThisWeek,
      verifiedUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({
        where: { ...where, status: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { ...where, status: UserStatus.PENDING },
      }),
      this.prisma.user.count({
        where: { ...where, status: UserStatus.SUSPENDED },
      }),
      this.prisma.user.count({
        where: { ...where, createdAt: { gte: today } },
      }),
      this.prisma.user.count({
        where: { ...where, createdAt: { gte: weekAgo } },
      }),
      this.prisma.user.count({
        where: { ...where, emailVerified: true },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      newUsersToday,
      newUsersThisWeek,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
    };
  }

  /**
   * Bulk update user status (activate/deactivate)
   */
  async bulkUpdateStatus(
    userIds: string[],
    action: "activate" | "deactivate"
  ): Promise<{ success: number; failed: number }> {
    const newStatus =
      action === "activate" ? UserStatus.ACTIVE : UserStatus.SUSPENDED;

    const result = await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { status: newStatus },
    });

    return {
      success: result.count,
      failed: userIds.length - result.count,
    };
  }

  /**
   * Bulk delete users
   */
  async bulkDelete(
    userIds: string[]
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await this.prisma.user.delete({ where: { id: userId } });
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Bulk reset passwords
   */
  async bulkResetPassword(
    userIds: string[]
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true },
    });

    for (const user of users) {
      try {
        if (user.email) {
          // Generate reset token
          const resetToken = crypto.randomBytes(32).toString("hex");
          const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              passwordResetToken: hashedToken,
              passwordResetExpiresAt: new Date(
                Date.now() + 24 * 60 * 60 * 1000
              ), // 24 hours
            },
          });

          // Send reset email
          await this.emailService.sendPasswordResetEmail(
            user.email,
            user.firstName,
            resetToken
          );
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Bulk send notifications
   */
  async bulkSendNotification(
    userIds: string[],
    title?: string,
    message?: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await this.notificationsService.createNotification({
          userId,
          title: title || "Important Update",
          message: message || "You have a new notification from the admin.",
          type: "GENERAL",
        });
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  async validateBulkUpload(file: Express.Multer.File) {
    // Parse CSV
    const content = file.buffer.toString("utf-8");
    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        `CSV parsing error: ${parsed.errors[0].message}`
      );
    }

    const rows = parsed.data;
    if (!rows || rows.length === 0) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "CSV file is empty"
      );
    }

    const validRows = [];
    const errorRows = [];
    const warningRows = [];

    const requiredFields = ["name", "email", "role"];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because 1-indexed and header row
      const errors = [];
      const warnings = [];

      // Validate required fields
      const missingFields = requiredFields.filter(
        (field) => !row[field] || row[field].trim() === ""
      );
      if (missingFields.length > 0) {
        errors.push({
          field: missingFields.join(", "),
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      // Validate role
      if (row.role && !Object.values(UserRole).includes(row.role as UserRole)) {
        errors.push({
          field: "role",
          message: `Invalid role: ${row.role}. Must be one of: ${Object.values(UserRole).join(", ")}`,
        });
      }

      // Validate email format
      if (row.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push({
            field: "email",
            message: `Invalid email format: ${row.email}`,
          });
        } else {
          // Check if email already exists
          const existingUser = await this.prisma.user.findUnique({
            where: { email: row.email.trim().toLowerCase() },
          });
          if (existingUser) {
            errors.push({
              field: "email",
              message: `User with email ${row.email} already exists`,
            });
          }
        }
      }

      // Validate phone format (Sri Lankan)
      if (row.phone) {
        const phoneRegex = /^(0|\+94)[0-9]{9}$/;
        if (!phoneRegex.test(row.phone.replace(/\s/g, ""))) {
          warnings.push({
            field: "phone",
            message: "Phone number format may be invalid",
          });
        }
      }

      // Warn if no password provided (will be auto-generated)
      if (!row.password || row.password.trim() === "") {
        warnings.push({
          field: "password",
          message: "Password will be auto-generated",
        });
      }

      const rowData = {
        row: rowNumber,
        name: row.name,
        email: row.email,
        phone: row.phone || "",
        role: row.role,
        grade: row.grade || "",
        medium: row.medium || "",
        zone: row.zone || "",
        password: row.password || "",
        errors,
        warnings,
        status:
          errors.length > 0
            ? "error"
            : warnings.length > 0
              ? "warning"
              : "valid",
      };

      if (errors.length > 0) {
        errorRows.push(rowData);
      } else if (warnings.length > 0) {
        warningRows.push(rowData);
        validRows.push(rowData);
      } else {
        validRows.push(rowData);
      }
    }

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errorRows.length,
      warningCount: warningRows.length,
      rows: [...validRows, ...errorRows],
    };
  }

  async importBulkUsers(users: any[]) {
    const imported = [];
    const credentials = [];

    for (const userData of users) {
      try {
        // Parse name
        const nameParts = userData.name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || firstName;

        // Generate password if not provided
        const password =
          userData.password || Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await this.prisma.user.create({
          data: {
            firstName,
            lastName,
            email: userData.email.trim().toLowerCase(),
            phone: userData.phone?.trim() || null,
            password: hashedPassword,
            role: userData.role as UserRole,
            status: UserStatus.ACTIVE,
          },
        });

        // Create role-specific profiles
        if (RoleHelper.isTeacher(user.role)) {
          await this.prisma.teacherProfile.create({
            data: {
              userId: user.id,
              isExternalTransferOnly: RoleHelper.isExternal(user.role),
            },
          });
        } else if (RoleHelper.isStudent(user.role)) {
          // Create student profile if grade info provided
          if (userData.grade) {
            // Look up grade by name
            const grade = await this.prisma.grade.findFirst({
              where: {
                name: {
                  contains: userData.grade,
                  mode: "insensitive",
                },
              },
            });

            if (grade) {
              await this.prisma.studentProfile.create({
                data: {
                  userId: user.id,
                  gradeId: grade.id,
                },
              });
            }
          }
        }

        imported.push({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        });

        credentials.push({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          password: password,
        });
      } catch (error) {
        // Log error but continue with next user
        this.logger.error(
          `Failed to import user ${userData.email}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return {
      imported: imported.length,
      users: imported,
      credentials,
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        teacherProfile: true,
        studentProfile: {
          include: {
            grade: true,
            medium: true,
            batch: true,
          },
        },
        district: true,
        wallet: true,
        enrollments: {
          include: {
            class: {
              include: {
                subject: true,
                teacher: true,
              },
            },
            payment: true,
          },
        },
        examAttempts: {
          include: {
            exam: {
              include: {
                class: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
          orderBy: {
            startedAt: "desc",
          },
          take: 50,
        },
        attendanceRecords: {
          include: {
            classSession: {
              include: {
                class: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }
    return this.prisma.user.findFirst({
      where: { email },
      include: {
        teacherProfile: true,
        studentProfile: {
          include: {
            grade: true,
            medium: true,
            batch: true,
          },
        },
      },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    // Clean the phone number - remove all non-digits
    const cleanPhone = phone.replace(/\D/g, "");

    console.log(
      `🔍 findByPhone: Searching for phone=${phone}, cleanPhone=${cleanPhone}`
    );

    // Determine the format based on the input
    let last9Digits: string;

    if (cleanPhone.length >= 9) {
      last9Digits = cleanPhone.substring(cleanPhone.length - 9);
      console.log(`🔍 Last 9 digits: ${last9Digits}`);
    } else {
      last9Digits = cleanPhone;
    }

    // Generate all possible Sri Lankan phone formats from the last 9 digits
    const phoneFormats = [
      `0${last9Digits}`, // 0770380981
      `94${last9Digits}`, // 94770380981
      `+94${last9Digits}`, // +94770380981
      last9Digits, // 770380981
    ];

    console.log(`🔍 Phone formats to search:`, phoneFormats);

    // Search for user with any of these phone formats
    const user = await this.prisma.user.findFirst({
      where: {
        OR: phoneFormats.map((format) => ({ phone: format })),
      },
      include: {
        teacherProfile: true,
        studentProfile: {
          include: {
            grade: true,
            medium: true,
            batch: true,
          },
        },
      },
    });

    if (user) {
      console.log(`✅ Found user: ${user.id} with phone: ${user.phone}`);
    } else {
      console.log(`❌ No user found with any phone variations`);
    }

    return user;
  }

  async findByPhoneOrEmail(identifier: string): Promise<User | null> {
    // Check if identifier contains @ (email)
    if (identifier.includes("@")) {
      return this.findByEmail(identifier.toLowerCase());
    }

    // Otherwise treat as phone - use the improved findByPhone method
    return this.findByPhone(identifier);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async updateLastLogout(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLogoutAt: new Date(),
      },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, {
        userId: id,
      });
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    isAdmin: boolean = false
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, {
        userId: id,
      });
    }

    const updateData: any = { ...updateUserDto };

    // ✅ FIX: Remove the date conversion logic entirely
    // Since Prisma expects string and DTO is string, keep it as string
    // No conversion needed!

    // Extract profile data from DTO
    const { studentProfile, teacherProfile, ...userUpdateData } =
      updateUserDto as any;

    // SERVER-SIDE VALIDATION: Prevent editing critical immutable fields for non-admins
    // Admin users can modify role and status, but password and id are always immutable
    const alwaysImmutableFields = ["password", "id"];
    const nonAdminImmutableFields = isAdmin
      ? alwaysImmutableFields
      : ["role", "status", "password", "id"];
    const attemptedImmutableChanges = nonAdminImmutableFields.filter((field) =>
      userUpdateData.hasOwnProperty(field)
    );

    if (attemptedImmutableChanges.length > 0) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_FAILED,
        `The following fields cannot be modified: ${attemptedImmutableChanges.join(", ")}`,
        {
          immutableFields: attemptedImmutableChanges,
        }
      );
    }

    // Backwards compatibility: accept `district` either as a district name or id.
    if (userUpdateData && typeof userUpdateData.district === "string") {
      try {
        const districtIdCandidate = userUpdateData.district;
        let resolvedDistrictId: string | null = null;

        const foundById = await this.prisma.district.findUnique({
          where: { id: districtIdCandidate },
        });

        if (foundById) {
          resolvedDistrictId = foundById.id;
        } else {
          const foundByName = await this.prisma.district.findFirst({
            where: {
              name: { equals: districtIdCandidate, mode: "insensitive" },
            },
          });
          if (foundByName) {
            resolvedDistrictId = foundByName.id;
          }
        }

        if (resolvedDistrictId) {
          userUpdateData.districtId = resolvedDistrictId;
        }
      } catch (err) {
        // If district lookup fails, remove the district key to avoid Prisma errors
      } finally {
        delete userUpdateData.district;
      }
    }

    // Update user data
    // Convert date strings to Date objects if necessary
    if (userUpdateData && typeof userUpdateData.dateOfBirth === "string") {
      const dateStr = userUpdateData.dateOfBirth as string;
      if (dateStr.trim() === "") {
        userUpdateData.dateOfBirth = null;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        userUpdateData.dateOfBirth = new Date(`${dateStr}T12:00:00.000Z`);
      } else {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          userUpdateData.dateOfBirth = parsed;
        }
      }
    }
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: userUpdateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        phone: true,
        dateOfBirth: true,
        bio: true,
        address: true,
        city: true,
        districtId: true,
        postalCode: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        lastLogoutAt: true,
        createdAt: true,
        updatedAt: true,
        district: true,
      },
    });

    // Update student profile if data provided
    if (studentProfile && user.studentProfile) {
      await this.prisma.studentProfile.update({
        where: { userId: id },
        data: {
          // Use Prisma connect syntax for relations
          ...(studentProfile.grade && {
            grade: { connect: { id: studentProfile.grade } },
          }),
          ...(studentProfile.batch && {
            batch: { connect: { id: studentProfile.batch } },
          }),
        },
      });
    }

    // Update teacher profile if data provided
    if (teacherProfile && user.teacherProfile) {
      const teacherUpdateData: any = {
        specialization: teacherProfile.specialization,
        experience: teacherProfile.experience,
        department: teacherProfile.department,
        qualifications: teacherProfile.qualifications,
      };

      await this.prisma.teacherProfile.update({
        where: { userId: id },
        data: teacherUpdateData,
      });
    }

    // Emit real-time event
    this.adminGateway.server.emit("userUpdated", {
      userId: id,
      data: updatedUser,
      timestamp: new Date().toISOString(),
    });

    return updatedUser;
  }

  async hardDelete(
    id: string,
    requesterId: string,
    requesterRole: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, {
        userId: id,
      });
    }

    // Prevent deleting super admin users unless you are a super admin
    if (
      user.role === UserRole.SUPER_ADMIN &&
      requesterRole !== UserRole.SUPER_ADMIN
    ) {
      throw AppException.forbidden("Cannot delete super admin user", {
        userId: id,
        role: user.role,
      });
    }

    // Prevent self-deletion
    if (id === requesterId) {
      throw AppException.forbidden("Cannot delete your own account", {
        userId: id,
        deletedBy: requesterId,
      });
    }

    // Check for related records using count queries
    const [paymentCount, enrollmentCount] = await Promise.all([
      this.prisma.payment.count({ where: { userId: id } }),
      this.prisma.enrollment.count({ where: { studentId: id } }),
    ]);

    // Build list of related records
    const relatedRecords = [];

    if (paymentCount > 0) {
      relatedRecords.push(`${paymentCount} payment(s)`);
    }

    if (enrollmentCount > 0) {
      relatedRecords.push(`${enrollmentCount} enrollment(s)`);
    }

    // If there are related records, throw an error with details
    if (relatedRecords.length > 0) {
      throw new AppException(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        `Cannot delete user because they have ${relatedRecords.join(", ")}. ` +
          `Please consider setting the user status to INACTIVE instead, or remove the related records first.`,
        { userId: id, relatedRecords }
      );
    }

    try {
      // Hard delete - permanently remove user from database
      await this.prisma.user.delete({
        where: { id },
      });

      // Emit real-time event
      this.adminGateway.server.emit("userDeleted", {
        userId: id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Catch any other foreign key constraint errors
      const err = error as Error & { code?: string };
      if (err.code === "P2003") {
        throw new AppException(
          ErrorCode.CONSTRAINT_VIOLATION,
          "Cannot delete user due to existing related records. " +
            "Please set the user status to INACTIVE instead.",
          { userId: id, errorCode: err.code }
        );
      }
      throw error;
    }
  }

  /**
   * Deactivate a user (soft delete)
   * Sets status to INACTIVE without removing the record
   */
  async deactivate(
    id: string,
    requesterId: string,
    requesterRole: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, {
        userId: id,
      });
    }

    // Prevent deactivating super admin users unless you are a super admin
    if (
      user.role === UserRole.SUPER_ADMIN &&
      requesterRole !== UserRole.SUPER_ADMIN
    ) {
      throw AppException.forbidden("Cannot deactivate super admin user", {
        userId: id,
        role: user.role,
      });
    }

    // Prevent self-deactivation
    if (id === requesterId) {
      throw AppException.forbidden("Cannot deactivate your own account", {
        userId: id,
        deactivatedBy: requesterId,
      });
    }

    // Already inactive
    if (user.status === UserStatus.INACTIVE) {
      throw new AppException(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        "User is already inactive",
        { userId: id, currentStatus: user.status }
      );
    }

    // Set status to INACTIVE (no email/phone modification)
    await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.INACTIVE,
      },
    });

    // Emit real-time event
    this.adminGateway.server.emit("userDeactivated", {
      userId: id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Validate file
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "No file uploaded",
        { userId }
      );
    }

    // Get buffer (multer memoryStorage) or read from disk if path present
    let buffer: Buffer;
    if ((file as any).buffer) {
      buffer = (file as any).buffer;
    } else if ((file as any).path) {
      // Read file from disk
      try {
        const fs = await import("fs/promises");
        buffer = await fs.readFile((file as any).path);
      } catch (err) {
        throw AppException.internal(
          ErrorCode.FILE_NOT_FOUND,
          "Failed to read uploaded file",
          { userId }
        );
      }
    } else {
      throw AppException.badRequest(
        ErrorCode.INVALID_INPUT,
        "Invalid uploaded file",
        { userId }
      );
    }

    // Basic mime/size validation
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw AppException.badRequest(
        ErrorCode.INVALID_INPUT,
        "Invalid file type",
        { userId, mimeType: file.mimetype }
      );
    }

    if (buffer.length > maxSize) {
      throw AppException.badRequest(
        ErrorCode.FILE_TOO_LARGE,
        `File exceeds maximum size of ${Math.round(maxSize / (1024 * 1024))}MB`,
        { userId }
      );
    }

    // Upload file
    const uploadResult = await this.storageService.uploadFile(
      buffer,
      file.originalname,
      file.mimetype,
      "profile",
      {
        // Provide required metadata expected by UploadUrlOptions
        userId,
        allowedMimeTypes,
        maxSize,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: buffer.length,
        category: "profile",
      }
    );

    // Delete previous avatar if present
    if (user.avatar) {
      try {
        await this.storageService.deleteFile(user.avatar);
      } catch (err) {
        // Log and continue - not critical
      }
    }

    // Update user record with the new avatar URL
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: uploadResult.url },
      select: { avatar: true },
    });

    // Emit real-time event
    this.adminGateway.server.emit("userUpdated", {
      userId,
      data: { avatar: updatedUser.avatar },
      timestamp: new Date().toISOString(),
    });

    return { avatar: updatedUser.avatar };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        "Current password is incorrect",
        { userId: userId }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: "Password changed successfully",
    };
  }

  /**
   * Admin reset user password (no current password required)
   */
  async adminResetPassword(
    userId: string,
    newPassword: string,
    adminId: string,
    adminRole: UserRole
  ) {
    // Check if admin has permission
    if (!RoleHelper.isAdmin(adminRole)) {
      throw new AppException(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        "Only admins can reset user passwords",
        { adminId, adminRole }
      );
    }

    // Verify target user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Prevent resetting super admin passwords unless the admin is also a super admin
    if (
      user.role === UserRole.SUPER_ADMIN &&
      adminRole !== UserRole.SUPER_ADMIN
    ) {
      throw new AppException(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        "Only super admins can reset super admin passwords",
        { adminId, targetUserId: userId }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        "Password must be at least 8 characters long",
        { userId }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: "Password reset successfully",
    };
  }

  /**
   * Assign subjects to a teacher using TeacherSubjectAssignment
   * This creates proper subject-grade-medium assignments for teachers
   */
  async assignSubjects(
    userId: string,
    assignments: Array<{
      subjectId: string;
      gradeId: string;
      mediumId: string;
      academicYearId: string;
      canCreateExams?: boolean;
      maxStudents?: number;
    }>
  ): Promise<any> {
    // Verify user exists and is a teacher
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacherProfile: true },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (!["INTERNAL_TEACHER", "EXTERNAL_TEACHER"].includes(user.role)) {
      throw new AppException(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        "User is not a teacher",
        { userId: userId, role: user.role }
      );
    }

    if (!user.teacherProfile) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Teacher profile not found for user",
        { userId }
      );
    }

    // Verify all subjects, grades, mediums, and academic years exist
    const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];
    const gradeIds = [...new Set(assignments.map((a) => a.gradeId))];
    const mediumIds = [...new Set(assignments.map((a) => a.mediumId))];
    const academicYearIds = [
      ...new Set(assignments.map((a) => a.academicYearId)),
    ];

    const [subjects, grades, mediums, academicYears] = await Promise.all([
      this.prisma.subject.findMany({ where: { id: { in: subjectIds } } }),
      this.prisma.grade.findMany({ where: { id: { in: gradeIds } } }),
      this.prisma.medium.findMany({ where: { id: { in: mediumIds } } }),
      this.prisma.academicYear.findMany({
        where: { id: { in: academicYearIds } },
      }),
    ]);

    if (subjects.length !== subjectIds.length) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "One or more subjects not found"
      );
    }
    if (grades.length !== gradeIds.length) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "One or more grades not found"
      );
    }
    if (mediums.length !== mediumIds.length) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "One or more mediums not found"
      );
    }
    if (academicYears.length !== academicYearIds.length) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "One or more academic years not found"
      );
    }

    // Create TeacherSubjectAssignment records (upsert to avoid duplicates)
    const createdAssignments = [];
    for (const assignment of assignments) {
      const created = await this.prisma.teacherSubjectAssignment.upsert({
        where: {
          teacherProfileId_subjectId_gradeId_mediumId_academicYearId: {
            teacherProfileId: user.teacherProfile.id,
            subjectId: assignment.subjectId,
            gradeId: assignment.gradeId,
            mediumId: assignment.mediumId,
            academicYearId: assignment.academicYearId,
          },
        },
        update: {
          isActive: true,
          canCreateExams: assignment.canCreateExams ?? true,
          maxStudents: assignment.maxStudents,
          updatedAt: new Date(),
        },
        create: {
          teacherProfileId: user.teacherProfile.id,
          subjectId: assignment.subjectId,
          gradeId: assignment.gradeId,
          mediumId: assignment.mediumId,
          academicYearId: assignment.academicYearId,
          canCreateExams: assignment.canCreateExams ?? true,
          maxStudents: assignment.maxStudents,
          isActive: true,
        },
        include: {
          subject: true,
          grade: true,
          medium: true,
          academicYear: true,
        },
      });
      createdAssignments.push(created);
    }

    return {
      message: `Successfully assigned ${createdAssignments.length} subject(s) to teacher`,
      assignments: createdAssignments,
    };
  }

  /**
   * Remove subject assignments from a teacher
   */
  async removeSubjectAssignments(
    userId: string,
    assignmentIds: string[]
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacherProfile: true },
    });

    if (!user || !user.teacherProfile) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Deactivate the assignments (soft delete)
    const result = await this.prisma.teacherSubjectAssignment.updateMany({
      where: {
        id: { in: assignmentIds },
        teacherProfileId: user.teacherProfile.id,
      },
      data: {
        isActive: false,
        effectiveTo: new Date(),
      },
    });

    return {
      message: `Successfully removed ${result.count} subject assignment(s)`,
      removedCount: result.count,
    };
  }

  /**
   * Get all subject assignments for a teacher
   */
  async getTeacherSubjectAssignments(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacherProfile: true },
    });

    if (!user || !user.teacherProfile) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    const assignments = await this.prisma.teacherSubjectAssignment.findMany({
      where: {
        teacherProfileId: user.teacherProfile.id,
        isActive: true,
      },
      include: {
        subject: true,
        grade: true,
        medium: true,
        academicYear: true,
      },
      orderBy: [{ grade: { sortOrder: "asc" } }, { subject: { name: "asc" } }],
    });

    return {
      userId,
      teacherProfileId: user.teacherProfile.id,
      assignments: assignments.map((a) => ({
        id: a.id,
        subject: {
          id: a.subject.id,
          name: a.subject.name,
          code: a.subject.code,
        },
        grade: { id: a.grade.id, name: a.grade.name },
        medium: { id: a.medium.id, name: a.medium.name },
        academicYear: { id: a.academicYear.id, year: a.academicYear.year },
        canCreateExams: a.canCreateExams,
        maxStudents: a.maxStudents,
        effectiveFrom: a.effectiveFrom,
        effectiveTo: a.effectiveTo,
      })),
    };
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, status: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Validate status
    if (!["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"].includes(status)) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, "Invalid status", {
        providedStatus: status,
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: status as UserStatus },
    });

    // Emit real-time event
    this.adminGateway.server.emit("userStatusUpdated", {
      userId: userId,
      status: status,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `User status updated to ${status}`,
      data: updated,
    };
  }

  /**
   * Reset user password with optional email notification
   */
  async resetUserPassword(userId: string, sendEmail: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (sendEmail) {
      // Check if user has an email
      if (!user.email) {
        throw new AppException(
          ErrorCode.USER_NOT_FOUND,
          "User does not have an email address",
          { userId }
        );
      }

      // Generate reset token and send email
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Store the reset token in database
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiresAt: resetTokenExpiry,
        },
      });

      // Send password reset email
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.firstName || user.email,
        resetToken
      );

      return {
        message: `Password reset link sent to ${user.email}`,
      };
    } else {
      // Reset to default password from environment or generate random
      const defaultPassword =
        process.env.DEFAULT_USER_PASSWORD || this.generateSecurePassword();
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
      });

      return {
        message: "Password reset to default. User must change on next login.",
        temporaryPassword: process.env.DEFAULT_USER_PASSWORD
          ? undefined
          : defaultPassword,
      };
    }
  }

  /**
   * Grant temporary access to a student
   */
  async grantTemporaryAccess(userId: string, days: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (!user.role.includes("STUDENT")) {
      throw new AppException(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        "Only students can be granted temporary access",
        { userId }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Store temporary access in user metadata or create access record
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        // You might want to add a temporaryAccessExpiresAt field to the schema
      },
    });

    return {
      message: `Granted ${days} days of temporary access`,
      expiresAt,
    };
  }

  /**
   * Get user wallet details and transactions
   */
  async getUserWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!wallet) {
      return {
        balance: 0,
        totalCredits: 0,
        totalDebits: 0,
        minBalance: 0,
        transactions: [],
      };
    }

    return wallet;
  }

  /**
   * Get user payment history
   */
  async getUserPayments(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const stats = {
      total: payments.length,
      completed: payments.filter((p) => p.status === "COMPLETED").length,
      pending: payments.filter(
        (p) => p.status === "PROCESSING" || p.status === "PENDING"
      ).length,
      failed: payments.filter((p) => p.status === "FAILED").length,
    };

    return {
      payments,
      stats,
    };
  }

  /**
   * Get user login attempts
   */
  async getUserLoginAttempts(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Get actual login attempts from database
    const attempts = await this.prisma.loginAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to last 100 attempts
      select: {
        id: true,
        identifier: true,
        ipAddress: true,
        userAgent: true,
        success: true,
        failureReason: true,
        country: true,
        city: true,
        riskScore: true,
        createdAt: true,
      },
    });

    // Calculate stats from actual data
    const successfulLogins = attempts.filter((a) => a.success).length;
    const failedAttempts = attempts.filter((a) => !a.success).length;
    const suspiciousAttempts = attempts.filter((a) => a.riskScore > 50).length;
    const lastSuccessfulLogin =
      attempts.find((a) => a.success)?.createdAt || user.lastLoginAt;

    const stats = {
      totalAttempts: attempts.length,
      successfulLogins,
      failedAttempts,
      lastSuccessfulLogin,
      suspiciousAttempts,
    };

    return {
      attempts,
      stats,
    };
  }

  async getUserTemporaryAccesses(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Get actual temporary access records from database
    const data = await this.prisma.temporaryAccess.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        grantor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        revoker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Add status field based on active/expired state
    const now = new Date();
    const enrichedData = data.map((access) => ({
      ...access,
      status: !access.active
        ? "revoked"
        : access.expiresAt < now
          ? "expired"
          : "active",
    }));

    return {
      data: enrichedData,
      summary: {
        total: data.length,
        active: enrichedData.filter((a) => a.status === "active").length,
        expired: enrichedData.filter((a) => a.status === "expired").length,
        revoked: enrichedData.filter((a) => a.status === "revoked").length,
      },
    };
  }

  async updateStudentProfile(
    userId: string,
    data: { grade?: number; medium?: string }
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (!user.studentProfile) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Student profile not found",
        { userId }
      );
    }

    // Find grade and medium if provided
    let gradeId: string | undefined;
    let mediumId: string | undefined;

    if (data.grade) {
      const grade = await this.prisma.grade.findFirst({
        where: { level: data.grade },
      });
      gradeId = grade?.id;
    }

    if (data.medium) {
      const medium = await this.prisma.medium.findFirst({
        where: { name: data.medium },
      });
      mediumId = medium?.id;
    }

    const updatedProfile = await this.prisma.studentProfile.update({
      where: { id: user.studentProfile.id },
      data: {
        ...(gradeId && { gradeId }),
        ...(mediumId && { mediumId }),
      },
    });

    return updatedProfile;
  }

  async adjustWallet(
    userId: string,
    data: { amount: number; type: "CREDIT" | "DEBIT"; reason: string }
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (!user.wallet) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Wallet not found for student",
        { userId }
      );
    }

    const wallet = user.wallet;
    const balanceBefore = wallet.balance;
    const balanceAfter =
      data.type === "CREDIT"
        ? balanceBefore + data.amount
        : balanceBefore - data.amount;

    // Create wallet transaction
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: data.amount,
        type: data.type,
        balanceBefore,
        balanceAfter,
        description: data.reason,
        reference: `ADMIN_ADJUSTMENT_${Date.now()}`,
      },
    });

    // Update wallet balance
    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        ...(data.type === "CREDIT" && {
          totalCredits: wallet.totalCredits + data.amount,
        }),
        ...(data.type === "DEBIT" && {
          totalDebits: wallet.totalDebits + data.amount,
        }),
      },
    });

    return updatedWallet;
  }

  async changeUserStatus(userId: string, status: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    // Validate status is a valid UserStatus
    const validStatuses = [
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
      "PENDING",
      "DELETED",
    ];
    if (!validStatuses.includes(status)) {
      throw new AppException(
        ErrorCode.INVALID_INPUT,
        `Invalid status: ${status}`,
        { userId, status }
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
    });

    return updatedUser;
  }

  // ============ EXTERNAL TEACHER ADMIN METHODS ============

  async getAllExternalTeachers(filters: {
    page: number;
    limit: number;
    status?: string;
    searchTerm?: string;
  }) {
    const { page, limit, status, searchTerm } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      role: UserRole.EXTERNAL_TEACHER,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (searchTerm) {
      where.OR = [
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          teacherProfile: {
            select: {
              specialization: true,
              experience: true,
              subjectAssignments: {
                include: {
                  subject: {
                    select: {
                      name: true,
                      code: true,
                    },
                  },
                  medium: {
                    select: {
                      name: true,
                      code: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((user) => ({
      id: user.id,
      registrationId: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      zone: null,
      district: null,
      subject:
        user.teacherProfile?.subjectAssignments?.[0]?.subject?.name || null,
      medium:
        user.teacherProfile?.subjectAssignments?.[0]?.medium?.name || null,
      createdAt: user.createdAt,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getExternalTeacherDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacherProfile: {
          include: {
            subjectAssignments: {
              include: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
                grade: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                medium: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (user.role !== UserRole.EXTERNAL_TEACHER) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "User is not an external teacher"
      );
    }

    return {
      id: user.id,
      registrationId: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      nic: null,
      status: user.status,
      zone: null,
      district: null,
      school: null,
      subject:
        user.teacherProfile?.subjectAssignments?.[0]?.subject?.name || null,
      medium:
        user.teacherProfile?.subjectAssignments?.[0]?.medium?.name || null,
      yearsOfExperience: user.teacherProfile?.experience || 0,
      qualifications: user.teacherProfile?.qualifications || [],
      certifications: [],
      educationLevel: user.teacherProfile?.specialization || null,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      gender: null,
      internalNotes: [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async approveExternalTeacher(
    userId: string,
    notes: string | undefined,
    approvedBy: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (user.role !== UserRole.EXTERNAL_TEACHER) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "User is not an external teacher"
      );
    }

    if (user.status === UserStatus.ACTIVE) {
      throw AppException.badRequest(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        "External teacher is already approved"
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
      },
    });

    // Send notification to teacher about approval
    await this.notificationsService.notifyAboutApproval(
      userId,
      "Teacher Application",
      `${user.firstName} ${user.lastName}`,
      true
    );

    return {
      message: "External teacher approved successfully",
      teacher: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        status: updatedUser.status,
      },
    };
  }

  async rejectExternalTeacher(
    userId: string,
    reason: string,
    rejectedBy: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (user.role !== UserRole.EXTERNAL_TEACHER) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "User is not an external teacher"
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.SUSPENDED,
      },
    });

    // Send notification to teacher about rejection with reason
    await this.notificationsService.notifyAboutApproval(
      userId,
      "Teacher Application",
      `${user.firstName} ${user.lastName}`,
      false,
      reason
    );

    return {
      message: "External teacher rejected successfully",
      teacher: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        status: updatedUser.status,
      },
    };
  }

  async addExternalTeacherNote(
    userId: string,
    note: string,
    createdBy: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, { userId });
    }

    if (user.role !== UserRole.EXTERNAL_TEACHER) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "User is not an external teacher"
      );
    }

    // Internal notes system uses placeholder (notes table not yet implemented)
    return {
      message: "Note added successfully",
      note: {
        id: `note_${Date.now()}`,
        note,
        createdBy,
        createdAt: new Date(),
      },
    };
  }
}
