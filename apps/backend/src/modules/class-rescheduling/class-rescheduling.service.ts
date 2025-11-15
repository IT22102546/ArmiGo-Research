import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RescheduleStatus, RescheduleReason } from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

// DTOs
export interface CreateReschedulingDto {
  originalClassId: string;
  originalDate: string;
  originalStartTime: string;
  originalEndTime: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  reason: RescheduleReason;
  reasonDetails?: string;
}

export interface UpdateReschedulingDto {
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  reason?: RescheduleReason;
  reasonDetails?: string;
}

export interface ReschedulingFilterDto {
  originalClassId?: string;
  teacherId?: string;
  status?: RescheduleStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ApproveReschedulingDto {
  notifyStudents?: boolean;
}

export interface RejectReschedulingDto {
  rejectionReason: string;
}

@Injectable()
export class ClassReschedulingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new class rescheduling request
   */
  async createRescheduling(data: CreateReschedulingDto, userId: string) {
    // Validate dates
    const originalDate = new Date(data.originalDate);
    const newDate = new Date(data.newDate);
    const originalStartTime = new Date(data.originalStartTime);
    const originalEndTime = new Date(data.originalEndTime);
    const newStartTime = new Date(data.newStartTime);
    const newEndTime = new Date(data.newEndTime);

    if (newStartTime >= newEndTime) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "New start time must be before new end time"
      );
    }

    if (newDate < new Date()) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "New date cannot be in the past"
      );
    }

    // Check if original class exists
    const originalClass = await this.prisma.class.findUnique({
      where: { id: data.originalClassId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        enrollments: {
          where: { status: "ACTIVE" },
          select: {
            studentId: true,
            student: {
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

    if (!originalClass) {
      throw AppException.notFound(
        ErrorCode.CLASS_NOT_FOUND,
        "Original class not found"
      );
    }

    // Check for existing rescheduling for this class on the same date
    const existingRescheduling = await this.prisma.classRescheduling.findFirst({
      where: {
        originalClassId: data.originalClassId,
        originalDate: originalDate,
        status: {
          in: [RescheduleStatus.PENDING, RescheduleStatus.APPROVED],
        },
      },
    });

    if (existingRescheduling) {
      throw AppException.badRequest(
        ErrorCode.RESCHEDULING_CONFLICT,
        "A rescheduling request already exists for this class on this date"
      );
    }

    // Check for conflicts at the new time slot
    const conflicts = await this.checkConflicts(
      originalClass.teacherId,
      newDate,
      newStartTime,
      newEndTime
    );

    const affectedStudentIds = originalClass.enrollments.map(
      (enrollment: any) => enrollment.studentId
    );

    // Create the rescheduling request
    const rescheduling = await this.prisma.classRescheduling.create({
      data: {
        originalClassId: data.originalClassId,
        originalDate: originalDate,
        originalStartTime: originalStartTime,
        originalEndTime: originalEndTime,
        newDate: newDate,
        newStartTime: newStartTime,
        newEndTime: newEndTime,
        teacherId: originalClass.teacherId,
        reason: data.reason,
        reasonDetails: data.reasonDetails,
        status: RescheduleStatus.PENDING,
        hasConflicts: conflicts.length > 0,
        conflictResolution:
          conflicts.length > 0 ? JSON.stringify(conflicts) : null,
        affectedStudentIds: affectedStudentIds,
        requestedBy: userId,
      },
      include: {
        originalClass: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return rescheduling;
  }

  /**
   * Get list of rescheduling requests with filters
   */
  async getReschedulingList(filters?: ReschedulingFilterDto) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.originalClassId) {
      where.originalClassId = filters.originalClassId;
    }

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate && filters?.endDate) {
      where.newDate = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters?.startDate) {
      where.newDate = {
        gte: new Date(filters.startDate),
      };
    } else if (filters?.endDate) {
      where.newDate = {
        lte: new Date(filters.endDate),
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.classRescheduling.count({ where }),
      this.prisma.classRescheduling.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          originalClass: {
            select: {
              id: true,
              name: true,
              description: true,
              subject: {
                select: {
                  id: true,
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
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          rejector: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get rescheduling by ID
   */
  async getReschedulingById(id: string) {
    const rescheduling = await this.prisma.classRescheduling.findUnique({
      where: { id },
      include: {
        originalClass: {
          include: {
            subject: true,
            grade: true,
            medium: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                student: {
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
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        rejector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!rescheduling) {
      throw AppException.notFound(
        ErrorCode.RESCHEDULING_NOT_FOUND,
        "Rescheduling not found"
      );
    }

    return rescheduling;
  }

  /**
   * Update rescheduling request (only for pending requests)
   */
  async updateRescheduling(
    id: string,
    data: UpdateReschedulingDto,
    userId: string
  ) {
    const rescheduling = await this.prisma.classRescheduling.findUnique({
      where: { id },
      include: {
        originalClass: true,
      },
    });

    if (!rescheduling) {
      throw AppException.notFound(
        ErrorCode.RESCHEDULING_NOT_FOUND,
        "Rescheduling not found"
      );
    }

    if (rescheduling.status !== RescheduleStatus.PENDING) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "Only pending rescheduling requests can be updated"
      );
    }

    const updateData: any = {};

    if (data.newDate) {
      updateData.newDate = new Date(data.newDate);
    }

    if (data.newStartTime) {
      updateData.newStartTime = new Date(data.newStartTime);
    }

    if (data.newEndTime) {
      updateData.newEndTime = new Date(data.newEndTime);
    }

    if (data.reason) {
      updateData.reason = data.reason;
    }

    if (data.reasonDetails !== undefined) {
      updateData.reasonDetails = data.reasonDetails;
    }

    // Re-check for conflicts if time/date changed
    if (
      updateData.newDate ||
      updateData.newStartTime ||
      updateData.newEndTime
    ) {
      const newDate = updateData.newDate || rescheduling.newDate;
      const newStartTime = updateData.newStartTime || rescheduling.newStartTime;
      const newEndTime = updateData.newEndTime || rescheduling.newEndTime;

      const conflicts = await this.checkConflicts(
        rescheduling.teacherId,
        newDate,
        newStartTime,
        newEndTime,
        id
      );

      updateData.hasConflicts = conflicts.length > 0;
      updateData.conflictResolution =
        conflicts.length > 0 ? JSON.stringify(conflicts) : null;
    }

    const updated = await this.prisma.classRescheduling.update({
      where: { id },
      data: updateData,
      include: {
        originalClass: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Approve rescheduling request
   */
  async approveRescheduling(
    id: string,
    userId: string,
    approveData?: ApproveReschedulingDto
  ) {
    const rescheduling = await this.prisma.classRescheduling.findUnique({
      where: { id },
    });

    if (!rescheduling) {
      throw AppException.notFound(
        ErrorCode.RESCHEDULING_NOT_FOUND,
        "Rescheduling not found"
      );
    }

    if (rescheduling.status !== RescheduleStatus.PENDING) {
      throw AppException.badRequest(
        ErrorCode.ONLY_PENDING_CAN_APPROVE,
        "Only pending requests can be approved"
      );
    }

    const updateData: any = {
      status: RescheduleStatus.APPROVED,
      approvedBy: userId,
      approvedAt: new Date(),
    };

    // If notify students is requested, mark as notified
    if (approveData?.notifyStudents) {
      updateData.studentsNotified = true;
      updateData.notificationSentAt = new Date();
    }

    const approved = await this.prisma.classRescheduling.update({
      where: { id },
      data: updateData,
      include: {
        originalClass: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return approved;
  }

  /**
   * Reject rescheduling request
   */
  async rejectRescheduling(
    id: string,
    userId: string,
    rejectData: RejectReschedulingDto
  ) {
    const rescheduling = await this.prisma.classRescheduling.findUnique({
      where: { id },
    });

    if (!rescheduling) {
      throw AppException.notFound(
        ErrorCode.RESCHEDULING_NOT_FOUND,
        "Rescheduling not found"
      );
    }

    if (rescheduling.status !== RescheduleStatus.PENDING) {
      throw AppException.badRequest(
        ErrorCode.ONLY_PENDING_CAN_REJECT,
        "Only pending requests can be rejected"
      );
    }

    const rejected = await this.prisma.classRescheduling.update({
      where: { id },
      data: {
        status: RescheduleStatus.REJECTED,
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: rejectData.rejectionReason,
      },
      include: {
        originalClass: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        rejector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return rejected;
  }

  /**
   * Cancel rescheduling request
   */
  async cancelRescheduling(id: string, userId: string) {
    const rescheduling = await this.prisma.classRescheduling.findUnique({
      where: { id },
    });

    if (!rescheduling) {
      throw AppException.notFound(
        ErrorCode.RESCHEDULING_NOT_FOUND,
        "Rescheduling not found"
      );
    }

    if (
      rescheduling.status !== RescheduleStatus.PENDING &&
      rescheduling.status !== RescheduleStatus.APPROVED
    ) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "Only pending or approved requests can be cancelled"
      );
    }

    const cancelled = await this.prisma.classRescheduling.update({
      where: { id },
      data: {
        status: RescheduleStatus.CANCELLED,
      },
      include: {
        originalClass: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
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

    return cancelled;
  }

  /**
   * Mark rescheduling as completed
   */
  async completeRescheduling(id: string) {
    const rescheduling = await this.prisma.classRescheduling.findUnique({
      where: { id },
    });

    if (!rescheduling) {
      throw AppException.notFound(
        ErrorCode.RESCHEDULING_NOT_FOUND,
        "Rescheduling not found"
      );
    }

    if (rescheduling.status !== RescheduleStatus.APPROVED) {
      throw AppException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        "Only approved requests can be marked as completed"
      );
    }

    const completed = await this.prisma.classRescheduling.update({
      where: { id },
      data: {
        status: RescheduleStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return completed;
  }

  /**
   * Get rescheduling history for a class
   */
  async getClassReschedulingHistory(classId: string) {
    const history = await this.prisma.classRescheduling.findMany({
      where: {
        originalClassId: classId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return history;
  }

  /**
   * Get rescheduling statistics
   */
  async getReschedulingStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.startDate && filters?.endDate) {
      where.newDate = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    } else if (filters?.startDate) {
      where.newDate = {
        gte: filters.startDate,
      };
    } else if (filters?.endDate) {
      where.newDate = {
        lte: filters.endDate,
      };
    }

    const [total, byStatus, byReason] = await Promise.all([
      this.prisma.classRescheduling.count({ where }),
      this.prisma.classRescheduling.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),
      this.prisma.classRescheduling.groupBy({
        by: ["reason"],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce(
        (acc: any, item: any) => {
          acc[item.status] = item._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
      byReason: byReason.reduce(
        (acc: any, item: any) => {
          acc[item.reason] = item._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  /**
   * Check for conflicts at the new time slot
   */
  private async checkConflicts(
    teacherId: string,
    newDate: Date,
    newStartTime: Date,
    newEndTime: Date,
    excludeReschedulingId?: string
  ) {
    // Check for existing class sessions at the same time
    const existingClassSessions = await this.prisma.classSession.findMany({
      where: {
        class: {
          teacherId,
        },
        date: newDate,
      },
      select: {
        id: true,
        classId: true,
        date: true,
        startTime: true,
        endTime: true,
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    // Check for other approved reschedulings at the same time
    const whereClause: any = {
      teacherId,
      newDate: newDate,
      status: RescheduleStatus.APPROVED,
    };

    if (excludeReschedulingId) {
      whereClause.id = {
        not: excludeReschedulingId,
      };
    }

    const existingReschedulings = await this.prisma.classRescheduling.findMany({
      where: whereClause,
      select: {
        id: true,
        originalClass: {
          select: {
            name: true,
          },
        },
        newStartTime: true,
        newEndTime: true,
      },
    });

    const conflicts: any[] = [];

    // Check time overlaps with existing reschedulings
    existingReschedulings.forEach((reschedule: any) => {
      const startOverlap = newStartTime < reschedule.newEndTime;
      const endOverlap = newEndTime > reschedule.newStartTime;

      if (startOverlap && endOverlap) {
        conflicts.push({
          type: "rescheduled_class",
          name: reschedule.originalClass.name,
          date: newDate,
          startTime: reschedule.newStartTime,
          endTime: reschedule.newEndTime,
        });
      }
    });

    return conflicts;
  }
}
