import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { RoleHelper } from "../../shared/helpers/role.helper";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";
import {
  CreateTimetableDto,
  UpdateTimetableDto,
  CreateTimetableChangeDto,
  QueryTimetableDto,
  TimetableResponseDto,
  TimetableChangeResponseDto,
} from "./dto/timetable.dto";
import { UserRole, ChangeType } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class TimetableService {
  private readonly logger = new Logger(TimetableService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  private readonly DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  /**
   * Create a new timetable entry
   */
  async create(
    dto: CreateTimetableDto,
    creatorId: string
  ): Promise<TimetableResponseDto> {
    // Verify teacher exists - first check without profile
    const teacherUser = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacherUser) {
      throw AppException.notFound(ErrorCode.TEACHER_NOT_FOUND);
    }

    if (!RoleHelper.isTeacher(teacherUser.role)) {
      throw AppException.badRequest(ErrorCode.USER_MUST_BE_TEACHER);
    }

    // Validate time format
    this.validateTimeFormat(dto.startTime);
    this.validateTimeFormat(dto.endTime);

    // Validate required FK fields
    if (!dto.gradeId) {
      throw AppException.badRequest(ErrorCode.GRADE_ID_REQUIRED);
    }
    if (!dto.subjectId) {
      throw AppException.badRequest(ErrorCode.SUBJECT_ID_REQUIRED);
    }
    if (!dto.mediumId) {
      throw AppException.badRequest(ErrorCode.MEDIUM_ID_REQUIRED);
    }

    // Find teacher profile
    const teacher = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
      include: { teacherProfile: true },
    });

    if (!teacher?.teacherProfile) {
      throw AppException.notFound(ErrorCode.TEACHER_PROFILE_NOT_FOUND);
    }

    // Find or create teacher assignment
    const teacherAssignment =
      await this.prisma.teacherSubjectAssignment.findFirst({
        where: {
          teacherProfileId: teacher.teacherProfile.id,
          subjectId: dto.subjectId,
          gradeId: dto.gradeId,
          mediumId: dto.mediumId,
          academicYear: {
            year: dto.academicYear.toString(),
          },
          isActive: true,
        },
      });

    if (!teacherAssignment) {
      // Previously we auto-created teacher assignments when missing;
      // this is a dangerous behavior that grants teacher permissions implicitly.
      // Instead, require an explicit teacher assignment via the admin endpoints.
      throw AppException.badRequest(
        ErrorCode.TEACHER_NO_ACTIVE_ASSIGNMENT,
        "No active TeacherSubjectAssignment found for the provided teacher/subject/grade/medium - please create a TeacherSubjectAssignment first"
      );
    }

    // Check for conflicts
    await this.checkConflicts(
      dto.teacherId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
      dto.validFrom,
      dto.validUntil
    );

    // Lookup academicYearId from the year integer
    const academicYearRecord = await this.prisma.academicYear.findFirst({
      where: { year: dto.academicYear.toString() },
    });
    if (!academicYearRecord) {
      throw AppException.notFound(
        ErrorCode.ACADEMIC_YEAR_NOT_FOUND,
        `Academic year ${dto.academicYear} not found`
      );
    }

    // Create timetable entry
    const timetable = await this.prisma.timetable.create({
      data: {
        gradeId: dto.gradeId,
        academicYearId: academicYearRecord.id,
        term: dto.term ?? 1,
        classLink: dto.classLink,
        subjectId: dto.subjectId,
        mediumId: dto.mediumId,
        teacherId: dto.teacherId,
        teacherAssignmentId: teacherAssignment.id,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
        recurring: dto.recurring ?? true,
        recurrencePattern: dto.recurrencePattern,
        excludeDates: dto.excludeDates,
        color: dto.color,
        notes: dto.notes,
        active: dto.active ?? true,
        createdBy: creatorId,
        lastModifiedBy: creatorId,
      },
      include: this.timetableInclude,
    });

    // Send notifications to affected students
    // Note: Relations need to be fetched separately or included in query
    // Skipping notification for now to avoid errors

    return this.mapToResponseDto(timetable);
  }

  /**
   * Get all timetable entries with optional filters
   */
  async findAll(query: QueryTimetableDto): Promise<TimetableResponseDto[]> {
    const where: any = {};

    // Handle gradeId directly if provided, otherwise convert grade name
    if (query.gradeId) {
      where.gradeId = query.gradeId;
    } else if (query.grade) {
      const grade = await this.prisma.grade.findFirst({
        where: {
          OR: [
            { name: { equals: query.grade, mode: "insensitive" } },
            { code: { equals: query.grade, mode: "insensitive" } },
          ],
        },
      });
      if (grade) {
        where.gradeId = grade.id;
      }
    }

    // Convert academicYear (year number) to academicYearId
    if (query.academicYear !== undefined) {
      const academicYearRecord = await this.prisma.academicYear.findFirst({
        where: { year: query.academicYear.toString() },
      });
      if (academicYearRecord) {
        where.academicYearId = academicYearRecord.id;
      }
    }
    if (query.term !== undefined) {where.term = query.term;}

    // Handle subjectId directly if provided, otherwise convert subject name
    if (query.subjectId) {
      where.subjectId = query.subjectId;
    } else if (query.subject) {
      const subject = await this.prisma.subject.findFirst({
        where: {
          OR: [
            { name: { equals: query.subject, mode: "insensitive" } },
            { code: { equals: query.subject, mode: "insensitive" } },
          ],
        },
      });
      if (subject) {
        where.subjectId = subject.id;
      }
    }

    // Handle mediumId filter
    if (query.mediumId) {
      where.mediumId = query.mediumId;
    }

    if (query.teacherId) {where.teacherId = query.teacherId;}
    if (query.dayOfWeek !== undefined) {where.dayOfWeek = query.dayOfWeek;}
    if (query.active !== undefined) {where.active = query.active;}

    // Date filtering
    if (query.date) {
      const date = new Date(query.date);
      where.validFrom = { lte: date };
      where.validUntil = { gte: date };
    }

    const timetables = await this.prisma.timetable.findMany({
      where,
      include: this.timetableInclude,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return timetables.map((t) => this.mapToResponseDto(t));
  }

  /**
   * Get today's timetable
   */
  async getTodaySchedule(userId?: string): Promise<TimetableResponseDto[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const where: any = {
      dayOfWeek,
      active: true,
      validFrom: { lte: today },
      validUntil: { gte: today },
    };

    if (userId) {
      where.teacherId = userId;
    }

    const timetables = await this.prisma.timetable.findMany({
      where,
      include: {
        ...this.timetableInclude,
        changes: {
          where: {
            changeDate: {
              gte: new Date(today.setHours(0, 0, 0, 0)),
              lte: new Date(today.setHours(23, 59, 59, 999)),
            },
          },
          include: {
            newTeacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return timetables.map((t) => this.mapToResponseDto(t));
  }

  /**
   * Get week's schedule
   */
  async getWeekSchedule(
    startDate: Date,
    userId?: string
  ): Promise<Record<string, TimetableResponseDto[]>> {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const where: any = {
      active: true,
      validFrom: { lte: endDate },
      validUntil: { gte: startDate },
    };

    if (userId) {
      where.teacherId = userId;
    }

    const timetables = await this.prisma.timetable.findMany({
      where,
      include: {
        ...this.timetableInclude,
        changes: {
          where: {
            changeDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            newTeacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // Group by day
    const schedule: Record<string, TimetableResponseDto[]> = {};
    this.DAY_NAMES.forEach((day) => {
      schedule[day] = [];
    });

    timetables.forEach((t) => {
      const dayName = this.DAY_NAMES[t.dayOfWeek];
      schedule[dayName].push(this.mapToResponseDto(t));
    });

    return schedule;
  }

  /**
   * Get timetable by ID
   */
  async findOne(id: string): Promise<TimetableResponseDto> {
    const timetable = await this.prisma.timetable.findUnique({
      where: { id },
      include: this.timetableInclude,
    });

    if (!timetable) {
      throw AppException.notFound(ErrorCode.TIMETABLE_NOT_FOUND);
    }

    return this.mapToResponseDto(timetable);
  }

  /**
   * Get teacher's schedule
   */
  async getTeacherSchedule(teacherId: string): Promise<TimetableResponseDto[]> {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw AppException.notFound(ErrorCode.TEACHER_NOT_FOUND);
    }

    const today = new Date();

    const timetables = await this.prisma.timetable.findMany({
      where: {
        teacherId,
        active: true,
        validFrom: { lte: today },
        validUntil: { gte: today },
      },
      include: this.timetableInclude,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return timetables.map((t) => this.mapToResponseDto(t));
  }

  /**
   * Update timetable entry
   */
  async update(
    id: string,
    dto: UpdateTimetableDto,
    userId: string,
    userRole: UserRole
  ): Promise<TimetableResponseDto> {
    const existing = await this.prisma.timetable.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppException.notFound(ErrorCode.TIMETABLE_NOT_FOUND);
    }

    // Only admin or the teacher can update
    if (userRole !== UserRole.ADMIN && existing.teacherId !== userId) {
      throw AppException.forbidden(ErrorCode.ONLY_OWN_TIMETABLE);
    }

    // Validate time format if provided
    if (dto.startTime) {this.validateTimeFormat(dto.startTime);}
    if (dto.endTime) {this.validateTimeFormat(dto.endTime);}

    // Check for conflicts if teacher/time/day changed
    if (
      dto.teacherId ||
      dto.dayOfWeek !== undefined ||
      dto.startTime ||
      dto.endTime
    ) {
      const teacherId = dto.teacherId || existing.teacherId;
      const dayOfWeek = dto.dayOfWeek ?? existing.dayOfWeek;
      const startTime = dto.startTime || existing.startTime;
      const endTime = dto.endTime || existing.endTime;
      const validFrom = dto.validFrom || existing.validFrom.toISOString();
      const validUntil = dto.validUntil || existing.validUntil.toISOString();

      await this.checkConflicts(
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        validFrom,
        validUntil,
        id
      );
    }

    // Lookup academicYearId if academicYear is being updated
    let academicYearId: string | undefined;
    if (dto.academicYear !== undefined) {
      const academicYearRecord = await this.prisma.academicYear.findFirst({
        where: { year: dto.academicYear.toString() },
      });
      if (!academicYearRecord) {
        throw AppException.notFound(
          ErrorCode.ACADEMIC_YEAR_NOT_FOUND,
          `Academic year ${dto.academicYear} not found`
        );
      }
      academicYearId = academicYearRecord.id;
    }

    const updated = await this.prisma.timetable.update({
      where: { id },
      data: {
        ...(academicYearId !== undefined && {
          academicYearId,
        }),
        ...(dto.term !== undefined && { term: dto.term }),
        ...(dto.classLink && { classLink: dto.classLink }),
        // teacherId is immutable - create new assignment to change teacher
        ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
        ...(dto.startTime && { startTime: dto.startTime }),
        ...(dto.endTime && { endTime: dto.endTime }),
        ...(dto.validFrom && { validFrom: new Date(dto.validFrom) }),
        ...(dto.validUntil && { validUntil: new Date(dto.validUntil) }),
        ...(dto.recurring !== undefined && { recurring: dto.recurring }),
        ...(dto.recurrencePattern !== undefined && {
          recurrencePattern: dto.recurrencePattern,
        }),
        ...(dto.excludeDates !== undefined && {
          excludeDates: dto.excludeDates,
        }),
        ...(dto.roomNumber !== undefined && { roomNumber: dto.roomNumber }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.active !== undefined && { active: dto.active }),
        lastModifiedBy: userId,
      },
      include: this.timetableInclude,
    });

    // Send notifications about schedule update to affected students
    await this.sendTimetableNotifications(updated.id, "schedule_update", {
      gradeId: updated.gradeId,
      gradeName: updated.grade?.name || "Unknown",
      subject: updated.subject?.name || "Unknown",
      teacher: `${updated.teacher?.firstName} ${updated.teacher?.lastName}`,
      dayOfWeek: this.DAY_NAMES[updated.dayOfWeek],
      startTime: updated.startTime,
      endTime: updated.endTime,
      changes: Object.keys(dto).join(", "),
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Delete timetable entry
   */
  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const existing = await this.prisma.timetable.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
        grade: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existing) {
      throw AppException.notFound(ErrorCode.TIMETABLE_NOT_FOUND);
    }

    // Only admin or the teacher can delete
    if (userRole !== UserRole.ADMIN && existing.teacherId !== userId) {
      throw AppException.forbidden(ErrorCode.ONLY_OWN_TIMETABLE);
    }

    // Send notifications about schedule cancellation before deletion
    await this.sendTimetableNotifications(id, "schedule_cancelled", {
      gradeId: existing.gradeId,
      gradeName: existing.grade?.name || "Unknown",
      subject: existing.subject?.name || "Unknown",
      teacher: `${existing.teacher?.firstName} ${existing.teacher?.lastName}`,
      dayOfWeek: this.DAY_NAMES[existing.dayOfWeek],
      startTime: existing.startTime,
      endTime: existing.endTime,
    });

    await this.prisma.timetable.delete({
      where: { id },
    });
  }

  /**
   * Create a timetable change (cancel, subject change, teacher change, etc.)
   */
  async createChange(
    dto: CreateTimetableChangeDto,
    creatorId: string
  ): Promise<TimetableChangeResponseDto> {
    const timetable = await this.prisma.timetable.findUnique({
      where: { id: dto.timetableId },
    });

    if (!timetable) {
      throw AppException.notFound(ErrorCode.TIMETABLE_NOT_FOUND);
    }

    // Validate based on change type
    if (dto.changeType === ChangeType.SUBJECT_CHANGE && !dto.newSubject) {
      throw AppException.badRequest(
        ErrorCode.SUBJECT_ID_REQUIRED,
        "New subject is required for subject change"
      );
    }

    if (dto.changeType === ChangeType.TEACHER_CHANGE && !dto.newTeacherId) {
      throw AppException.badRequest(
        ErrorCode.CHANGE_TYPE_REQUIRED,
        "New teacher is required for teacher change"
      );
    }

    if (
      dto.changeType === ChangeType.TIME_CHANGE &&
      (!dto.newStartTime || !dto.newEndTime)
    ) {
      throw AppException.badRequest(
        ErrorCode.RESCHEDULE_DATE_REQUIRED,
        "New start time and end time are required for time change"
      );
    }

    // Verify new teacher exists if changing teacher
    if (dto.newTeacherId) {
      const newTeacher = await this.prisma.user.findUnique({
        where: { id: dto.newTeacherId },
      });

      if (!newTeacher || !RoleHelper.isTeacher(newTeacher.role)) {
        throw AppException.badRequest(ErrorCode.INVALID_NEW_TEACHER);
      }
    }

    // Create the change
    const change = await this.prisma.timetableChange.create({
      data: {
        timetableId: dto.timetableId,
        changeType: dto.changeType,
        changeDate: new Date(dto.changeDate),
        newSubject: dto.newSubject,
        newTeacherId: dto.newTeacherId,
        newStartTime: dto.newStartTime,
        newEndTime: dto.newEndTime,
        newClassLink: dto.newClassLink,
        reason: dto.reason,
        createdBy: creatorId,
        notificationSent: false,
      },
      include: {
        newTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send notifications to enrolled students about the schedule change
    await this.sendTimetableNotifications(
      change.timetableId,
      "schedule_change",
      {
        changeType: change.changeType,
        changeDate: change.changeDate.toISOString(),
        newSubject: change.newSubject,
        newTeacherId: change.newTeacherId,
        newStartTime: change.newStartTime,
        newEndTime: change.newEndTime,
        newClassLink: change.newClassLink,
        reason: change.reason,
      }
    );

    return this.mapChangeToResponseDto(change);
  }

  /**
   * Get all changes for a timetable entry
   */
  async getChanges(timetableId: string): Promise<TimetableChangeResponseDto[]> {
    const changes = await this.prisma.timetableChange.findMany({
      where: { timetableId },
      include: {
        newTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { changeDate: "desc" },
    });

    return changes.map((c) => this.mapChangeToResponseDto(c));
  }

  /**
   * Delete a timetable change
   */
  async removeChange(
    changeId: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const change = await this.prisma.timetableChange.findUnique({
      where: { id: changeId },
      include: {
        timetable: true,
      },
    });

    if (!change) {
      throw AppException.notFound(ErrorCode.TIMETABLE_CHANGE_NOT_FOUND);
    }

    // Only admin or the original teacher can delete
    if (userRole !== UserRole.ADMIN && change.createdBy !== userId) {
      throw AppException.forbidden(ErrorCode.ONLY_OWN_CHANGES);
    }

    await this.prisma.timetableChange.delete({
      where: { id: changeId },
    });
  }

  /**
   * Check for scheduling conflicts
   */
  private async checkConflicts(
    teacherId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    validFrom: string,
    validUntil: string,
    excludeId?: string
  ): Promise<void> {
    const conflicts = await this.prisma.timetable.findMany({
      where: {
        teacherId,
        dayOfWeek,
        active: true,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          {
            // Overlapping validity periods
            AND: [
              { validFrom: { lte: new Date(validUntil) } },
              { validUntil: { gte: new Date(validFrom) } },
            ],
          },
        ],
      },
    });

    // Check for time conflicts
    for (const conflict of conflicts) {
      if (
        this.timesOverlap(
          startTime,
          endTime,
          conflict.startTime,
          conflict.endTime
        )
      ) {
        throw AppException.badRequest(
          ErrorCode.TIMETABLE_CONFLICT,
          `Schedule conflict: Teacher already has a class on ${this.DAY_NAMES[dayOfWeek]} from ${conflict.startTime} to ${conflict.endTime}`
        );
      }
    }
  }

  /**
   * Check if two time ranges overlap
   */
  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const [h1, m1] = start1.split(":").map(Number);
    const [h2, m2] = end1.split(":").map(Number);
    const [h3, m3] = start2.split(":").map(Number);
    const [h4, m4] = end2.split(":").map(Number);

    const time1Start = h1 * 60 + m1;
    const time1End = h2 * 60 + m2;
    const time2Start = h3 * 60 + m3;
    const time2End = h4 * 60 + m4;

    return time1Start < time2End && time1End > time2Start;
  }

  /**
   * Find scheduling conflicts (without throwing error)
   */
  async findConflicts(
    teacherId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<any[]> {
    const conflicts = await this.prisma.timetable.findMany({
      where: {
        teacherId,
        dayOfWeek,
        active: true,
        id: excludeId ? { not: excludeId } : undefined,
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
    });

    // Filter for time conflicts
    const timeConflicts = conflicts.filter((conflict) =>
      this.timesOverlap(
        startTime,
        endTime,
        conflict.startTime,
        conflict.endTime
      )
    );

    return timeConflicts.map((conflict) => ({
      type: "TEACHER_BUSY",
      message: `Teacher already has a class on ${this.DAY_NAMES[dayOfWeek]} from ${conflict.startTime} to ${conflict.endTime} (${conflict.subject?.name || "N/A"})`,
      conflictingEntry: this.mapToResponseDto(conflict),
    }));
  }

  /**
   * Find available teachers for a time slot
   */
  async findAvailableTeachers(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    subject?: string
  ): Promise<any[]> {
    // Get all teachers
    const teachers = await this.prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER],
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Get teachers who are busy at this time
    const busyTimetables = await this.prisma.timetable.findMany({
      where: {
        dayOfWeek,
        active: true,
      },
      select: {
        teacherId: true,
        startTime: true,
        endTime: true,
      },
    });

    // Filter out busy teachers
    const busyTeacherIds = busyTimetables
      .filter((tt) =>
        this.timesOverlap(startTime, endTime, tt.startTime, tt.endTime)
      )
      .map((tt) => tt.teacherId);

    // Return available teachers
    const availableTeachers = teachers.filter(
      (t) => !busyTeacherIds.includes(t.id)
    );

    return availableTeachers;
  }

  /**
   * Validate time format (HH:MM)
   */
  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      throw AppException.badRequest(
        ErrorCode.INVALID_FORMAT,
        `Invalid time format: ${time}. Expected format: HH:MM (24-hour)`
      );
    }
  }

  /**
   * Send notifications to students enrolled in a timetable entry
   */
  private async sendTimetableNotifications(
    timetableId: string,
    notificationType:
      | "new_schedule"
      | "schedule_update"
      | "schedule_cancelled"
      | "schedule_change",
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      // Get enrolled students for this timetable entry
      const enrolledStudents = await this.getEnrolledStudents(
        timetableId,
        metadata.gradeId
      );

      if (!enrolledStudents || enrolledStudents.length === 0) {
        this.logger.log(
          `No enrolled students found for timetable ${timetableId}`
        );
        return;
      }

      // Prepare notification title and message based on type
      let title: string;
      let message: string;

      switch (notificationType) {
        case "new_schedule":
          title = "New Class Scheduled";
          message = `A new ${metadata.subject} class has been scheduled on ${metadata.dayOfWeek} at ${metadata.startTime}-${metadata.endTime} with ${metadata.teacher}`;
          break;
        case "schedule_update":
          title = "Class Schedule Updated";
          message = `Your ${metadata.subject} class schedule has been updated. Changes: ${metadata.changes}`;
          break;
        case "schedule_cancelled":
          title = "Class Cancelled";
          message = `The ${metadata.subject} class on ${metadata.dayOfWeek} at ${metadata.startTime}-${metadata.endTime} has been cancelled`;
          break;
        case "schedule_change":
          title = "Class Change Notice";
          message = `There is a change to your class schedule. Type: ${metadata.changeType}. ${metadata.reason || "Please check for details"}`;
          break;
        default:
          title = "Schedule Notification";
          message = "Your class schedule has been updated";
      }

      // Send notifications to all enrolled students
      const notifications = enrolledStudents.map((student) => ({
        userId: student.id,
        type: notificationType,
        title,
        message,
        metadata: {
          timetableId,
          ...metadata,
        },
      }));

      await this.notificationsService.sendBulkNotifications(notifications);

      this.logger.log(
        `Sent ${notifications.length} notifications for timetable ${timetableId}`
      );
    } catch (error) {
      // Don't fail the main operation if notification sending fails
      this.logger.error(
        `Failed to send notifications for timetable ${timetableId}:`,
        error
      );
    }
  }

  /**
   * Get students enrolled in classes matching this timetable entry
   */
  private async getEnrolledStudents(
    timetableId: string,
    gradeId?: string
  ): Promise<{ id: string }[]> {
    try {
      // If gradeId is not provided in metadata, fetch it from timetable
      let targetGradeId = gradeId;

      if (!targetGradeId) {
        const timetable = await this.prisma.timetable.findUnique({
          where: { id: timetableId },
          select: { gradeId: true },
        });
        targetGradeId = timetable?.gradeId || undefined;
      }

      if (!targetGradeId) {
        return [];
      }

      // Find students enrolled in this grade
      const students = await this.prisma.user.findMany({
        where: {
          role: { in: ["INTERNAL_STUDENT", "EXTERNAL_STUDENT"] },
          status: "ACTIVE",
          studentProfile: {
            gradeId: targetGradeId,
          },
        },
        select: {
          id: true,
        },
      });

      return students;
    } catch (error) {
      this.logger.error(
        `Failed to get enrolled students for timetable ${timetableId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Map database model to response DTO
   */
  /**
   * Common include object for timetable queries
   */
  private readonly timetableInclude = {
    teacher: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    grade: {
      select: {
        id: true,
        name: true,
        level: true,
      },
    },
    subject: {
      select: {
        id: true,
        name: true,
        code: true,
      },
    },
    medium: {
      select: {
        id: true,
        name: true,
      },
    },
    academicYear: {
      select: {
        id: true,
        year: true,
      },
    },
    changes: {
      orderBy: { changeDate: "desc" as const },
      include: {
        newTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  };

  private mapToResponseDto(timetable: any): TimetableResponseDto {
    // Some query variants include 'changes', others may alias or not include relation arrays.
    // Normalize to always return an array (empty if none) rather than throwing when undefined.
    const rawChanges =
      (timetable).changes ?? (timetable).timetable_changes;
    const mappedChanges = Array.isArray(rawChanges)
      ? rawChanges.map((c: any) => this.mapChangeToResponseDto(c))
      : [];

    // Extract grade object from relation
    const gradeObj =
      typeof timetable.grade === "object" && timetable.grade
        ? {
            id: timetable.grade.id,
            name: timetable.grade.name,
            level: timetable.grade.level ?? 0,
          }
        : { id: timetable.gradeId, name: "Unknown", level: 0 };

    // Extract subject object from relation
    const subjectObj =
      typeof timetable.subject === "object" && timetable.subject
        ? {
            id: timetable.subject.id,
            name: timetable.subject.name,
            code: timetable.subject.code,
          }
        : { id: timetable.subjectId, name: "Unknown" };

    // Extract medium object from relation
    const mediumObj =
      typeof timetable.medium === "object" && timetable.medium
        ? {
            id: timetable.medium.id,
            name: timetable.medium.name,
          }
        : timetable.mediumId
          ? { id: timetable.mediumId, name: "Unknown" }
          : undefined;

    // academicYear: extract year as number from relation, or use existing value if already a number
    let academicYearValue: number;
    if (
      typeof timetable.academicYear === "object" &&
      timetable.academicYear?.year
    ) {
      academicYearValue = parseInt(timetable.academicYear.year, 10);
    } else if (typeof timetable.academicYear === "number") {
      academicYearValue = timetable.academicYear;
    } else {
      // Fallback to current year if not available
      academicYearValue = new Date().getFullYear();
    }

    return {
      id: timetable.id,
      gradeId: timetable.gradeId,
      grade: gradeObj,
      academicYear: academicYearValue,
      term: timetable.term,
      classLink: timetable.classLink,
      subjectId: timetable.subjectId,
      subject: subjectObj,
      mediumId: timetable.mediumId,
      medium: mediumObj,
      teacherId: timetable.teacherId,
      teacher: timetable.teacher,
      teacherAssignmentId: timetable.teacherAssignmentId,
      dayOfWeek: timetable.dayOfWeek,
      dayOfWeekName: this.DAY_NAMES[timetable.dayOfWeek],
      startTime: timetable.startTime,
      endTime: timetable.endTime,
      validFrom: timetable.validFrom,
      validUntil: timetable.validUntil,
      recurring: timetable.recurring,
      recurrencePattern: timetable.recurrencePattern,
      excludeDates: timetable.excludeDates,
      roomNumber: timetable.roomNumber,
      color: timetable.color,
      notes: timetable.notes,
      active: timetable.active,
      changes: mappedChanges,
      createdAt: timetable.createdAt,
      updatedAt: timetable.updatedAt,
    };
  }

  /**
   * Map change model to response DTO
   */
  private mapChangeToResponseDto(change: any): TimetableChangeResponseDto {
    return {
      id: change.id,
      timetableId: change.timetableId,
      changeType: change.changeType,
      changeDate: change.changeDate,
      newSubject: change.newSubject,
      newTeacherId: change.newTeacherId,
      newTeacher: change.newTeacher,
      newStartTime: change.newStartTime,
      newEndTime: change.newEndTime,
      newClassLink: change.newClassLink,
      reason: change.reason,
      notificationSent: change.notificationSent,
      createdBy: change.createdBy,
      createdAt: change.createdAt,
    };
  }
}
