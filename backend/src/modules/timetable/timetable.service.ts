import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RoleHelper } from "../../common/helpers/role.helper";
import {
  CreateTimetableDto,
  UpdateTimetableDto,
  CreateTimetableChangeDto,
  QueryTimetableDto,
  TimetableResponseDto,
  TimetableChangeResponseDto,
  ChangeType,
} from "./dto/timetable.dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

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
    // Verify teacher exists
    const teacher = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }

    if (!RoleHelper.isTeacher(teacher.role)) {
      throw new BadRequestException("User is not a teacher");
    }

    // Validate time format
    this.validateTimeFormat(dto.startTime);
    this.validateTimeFormat(dto.endTime);

    // Check for conflicts
    await this.checkConflicts(
      dto.teacherId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
      dto.validFrom,
      dto.validUntil
    );

    // Create timetable entry
    const timetable = await this.prisma.timetable.create({
      data: {
        grade: dto.grade,
        classLink: dto.classLink,
        subject: dto.subject,
        teacherId: dto.teacherId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
        recurring: dto.recurring ?? true,
        active: dto.active ?? true,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return this.mapToResponseDto(timetable);
  }

  /**
   * Get all timetable entries with optional filters
   */
  async findAll(query: QueryTimetableDto): Promise<TimetableResponseDto[]> {
    const where: any = {};

    if (query.grade) where.grade = query.grade;
    if (query.subject) where.subject = query.subject;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.dayOfWeek !== undefined) where.dayOfWeek = query.dayOfWeek;
    if (query.active !== undefined) where.active = query.active;

    // Date filtering
    if (query.date) {
      const date = new Date(query.date);
      where.validFrom = { lte: date };
      where.validUntil = { gte: date };
    }

    const timetables = await this.prisma.timetable.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        changes: {
          orderBy: { changeDate: "desc" },
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
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        changes: {
          orderBy: { changeDate: "desc" },
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
    });

    if (!timetable) {
      throw new NotFoundException("Timetable entry not found");
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
      throw new NotFoundException("Teacher not found");
    }

    const today = new Date();

    const timetables = await this.prisma.timetable.findMany({
      where: {
        teacherId,
        active: true,
        validFrom: { lte: today },
        validUntil: { gte: today },
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        changes: {
          orderBy: { changeDate: "desc" },
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
      throw new NotFoundException("Timetable entry not found");
    }

    // Only admin or the teacher can update
    if (userRole !== UserRole.ADMIN && existing.teacherId !== userId) {
      throw new ForbiddenException(
        "You can only update your own timetable entries"
      );
    }

    // Validate time format if provided
    if (dto.startTime) this.validateTimeFormat(dto.startTime);
    if (dto.endTime) this.validateTimeFormat(dto.endTime);

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

    const updated = await this.prisma.timetable.update({
      where: { id },
      data: {
        ...(dto.grade && { grade: dto.grade }),
        ...(dto.classLink && { classLink: dto.classLink }),
        ...(dto.subject && { subject: dto.subject }),
        ...(dto.teacherId && { teacherId: dto.teacherId }),
        ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
        ...(dto.startTime && { startTime: dto.startTime }),
        ...(dto.endTime && { endTime: dto.endTime }),
        ...(dto.validFrom && { validFrom: new Date(dto.validFrom) }),
        ...(dto.validUntil && { validUntil: new Date(dto.validUntil) }),
        ...(dto.recurring !== undefined && { recurring: dto.recurring }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Delete timetable entry
   */
  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const existing = await this.prisma.timetable.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Timetable entry not found");
    }

    // Only admin or the teacher can delete
    if (userRole !== UserRole.ADMIN && existing.teacherId !== userId) {
      throw new ForbiddenException(
        "You can only delete your own timetable entries"
      );
    }

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
      throw new NotFoundException("Timetable entry not found");
    }

    // Validate based on change type
    if (dto.changeType === ChangeType.SUBJECT_CHANGE && !dto.newSubject) {
      throw new BadRequestException(
        "New subject is required for subject change"
      );
    }

    if (dto.changeType === ChangeType.TEACHER_CHANGE && !dto.newTeacherId) {
      throw new BadRequestException(
        "New teacher is required for teacher change"
      );
    }

    if (
      dto.changeType === ChangeType.TIME_CHANGE &&
      (!dto.newStartTime || !dto.newEndTime)
    ) {
      throw new BadRequestException(
        "New start time and end time are required for time change"
      );
    }

    // Verify new teacher exists if changing teacher
    if (dto.newTeacherId) {
      const newTeacher = await this.prisma.user.findUnique({
        where: { id: dto.newTeacherId },
      });

      if (!newTeacher || !RoleHelper.isTeacher(newTeacher.role)) {
        throw new BadRequestException("Invalid new teacher");
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

    // TODO: Send notifications to enrolled students
    // This would integrate with NotificationService

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
      throw new NotFoundException("Timetable change not found");
    }

    // Only admin or the original teacher can delete
    if (userRole !== UserRole.ADMIN && change.createdBy !== userId) {
      throw new ForbiddenException("You can only delete your own changes");
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
        throw new BadRequestException(
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
   * Validate time format (HH:MM)
   */
  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      throw new BadRequestException(
        `Invalid time format: ${time}. Expected format: HH:MM (24-hour)`
      );
    }
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponseDto(timetable: any): TimetableResponseDto {
    return {
      id: timetable.id,
      grade: timetable.grade,
      classLink: timetable.classLink,
      subject: timetable.subject,
      teacherId: timetable.teacherId,
      teacher: timetable.teacher,
      dayOfWeek: timetable.dayOfWeek,
      dayOfWeekName: this.DAY_NAMES[timetable.dayOfWeek],
      startTime: timetable.startTime,
      endTime: timetable.endTime,
      validFrom: timetable.validFrom,
      validUntil: timetable.validUntil,
      recurring: timetable.recurring,
      active: timetable.active,
      changes: timetable.changes
        ? timetable.changes.map((c: any) => this.mapChangeToResponseDto(c))
        : undefined,
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
