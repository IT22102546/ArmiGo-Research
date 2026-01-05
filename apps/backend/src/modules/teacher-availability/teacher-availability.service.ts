import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { LeaveType, LeaveStatus, Prisma } from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

export interface CreateAvailabilityDto {
  teacherId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string;
  replacementTeacherId?: string;
  requestedBy: string;
}

export interface UpdateAvailabilityDto {
  leaveType?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  replacementTeacherId?: string;
}

export interface AvailabilityFilterDto {
  teacherId?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface ApproveLeaveDto {
  approvedBy: string;
  replacementTeacherId?: string;
}

export interface RejectLeaveDto {
  rejectedBy: string;
  rejectionReason: string;
}

@Injectable()
export class TeacherAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async createLeaveRequest(data: CreateAvailabilityDto) {
    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      throw AppException.badRequest(ErrorCode.START_BEFORE_END_DATE);
    }

    // Check for overlapping leave requests
    const overlapping = await this.prisma.teacherAvailability.findFirst({
      where: {
        teacherId: data.teacherId,
        status: {
          in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw AppException.badRequest(
        ErrorCode.LEAVE_CONFLICT,
        "Teacher already has a leave request for this period"
      );
    }

    // Find affected classes
    const affectedClasses = await this.findAffectedClasses(
      data.teacherId,
      startDate,
      endDate
    );

    return this.prisma.teacherAvailability.create({
      data: {
        teacherId: data.teacherId,
        leaveType: data.leaveType,
        startDate,
        endDate,
        reason: data.reason,
        replacementTeacherId: data.replacementTeacherId,
        requestedBy: data.requestedBy,
        affectedClassIds: affectedClasses.map((c) => c.id),
        status: LeaveStatus.PENDING,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: {
              select: {
                employeeId: true,
                department: true,
              },
            },
          },
        },
        replacementTeacher: {
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
  }

  async getAvailabilityList(filters: AvailabilityFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TeacherAvailabilityWhereInput = {};

    if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.leaveType) {
      where.leaveType = filters.leaveType;
    }

    if (filters.startDate || filters.endDate) {
      where.AND = [];
      if (filters.startDate) {
        where.AND.push({
          endDate: { gte: new Date(filters.startDate) },
        });
      }
      if (filters.endDate) {
        where.AND.push({
          startDate: { lte: new Date(filters.endDate) },
        });
      }
    }

    const [leaves, total] = await Promise.all([
      this.prisma.teacherAvailability.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              teacherProfile: {
                select: {
                  employeeId: true,
                  department: true,
                },
              },
            },
          },
          replacementTeacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
      this.prisma.teacherAvailability.count({ where }),
    ]);

    return {
      data: leaves,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAvailabilityById(id: string) {
    const leave = await this.prisma.teacherAvailability.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: {
              select: {
                employeeId: true,
                department: true,
                specialization: true,
              },
            },
          },
        },
        replacementTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: {
              select: {
                employeeId: true,
                department: true,
              },
            },
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

    if (!leave) {
      throw AppException.notFound(ErrorCode.LEAVE_NOT_FOUND);
    }

    return leave;
  }

  async updateLeaveRequest(id: string, data: UpdateAvailabilityDto) {
    const leave = await this.prisma.teacherAvailability.findUnique({
      where: { id },
    });

    if (!leave) {
      throw AppException.notFound(ErrorCode.LEAVE_NOT_FOUND);
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw AppException.badRequest(
        ErrorCode.ONLY_PENDING_CAN_CANCEL,
        "Only pending leave requests can be updated"
      );
    }

    const updateData: any = {};

    if (data.leaveType) {updateData.leaveType = data.leaveType;}
    if (data.reason !== undefined) {updateData.reason = data.reason;}
    if (data.replacementTeacherId !== undefined)
      {updateData.replacementTeacherId = data.replacementTeacherId;}

    if (data.startDate || data.endDate) {
      const startDate = data.startDate
        ? new Date(data.startDate)
        : leave.startDate;
      const endDate = data.endDate ? new Date(data.endDate) : leave.endDate;

      if (startDate >= endDate) {
        throw AppException.badRequest(ErrorCode.START_BEFORE_END_DATE);
      }

      // Find new affected classes
      const affectedClasses = await this.findAffectedClasses(
        leave.teacherId,
        startDate,
        endDate
      );

      updateData.startDate = startDate;
      updateData.endDate = endDate;
      updateData.affectedClassIds = affectedClasses.map((c) => c.id);
    }

    return this.prisma.teacherAvailability.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        replacementTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async approveLeave(id: string, approveData: ApproveLeaveDto) {
    const leave = await this.prisma.teacherAvailability.findUnique({
      where: { id },
    });

    if (!leave) {
      throw AppException.notFound(ErrorCode.LEAVE_NOT_FOUND);
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw AppException.badRequest(ErrorCode.ONLY_PENDING_CAN_APPROVE);
    }

    const updateData: any = {
      status: LeaveStatus.APPROVED,
      approvedBy: approveData.approvedBy,
      approvedAt: new Date(),
    };

    if (approveData.replacementTeacherId) {
      updateData.replacementTeacherId = approveData.replacementTeacherId;
      updateData.replacementApproved = true;
    }

    return this.prisma.teacherAvailability.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        replacementTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
  }

  async rejectLeave(id: string, rejectData: RejectLeaveDto) {
    const leave = await this.prisma.teacherAvailability.findUnique({
      where: { id },
    });

    if (!leave) {
      throw AppException.notFound(ErrorCode.LEAVE_NOT_FOUND);
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw AppException.badRequest(ErrorCode.ONLY_PENDING_CAN_REJECT);
    }

    return this.prisma.teacherAvailability.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        rejectedBy: rejectData.rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: rejectData.rejectionReason,
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
        rejector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async cancelLeave(id: string, userId: string) {
    const leave = await this.prisma.teacherAvailability.findUnique({
      where: { id },
    });

    if (!leave) {
      throw AppException.notFound(ErrorCode.LEAVE_NOT_FOUND);
    }

    // Only the teacher or admin can cancel
    if (leave.teacherId !== userId && leave.requestedBy !== userId) {
      throw AppException.forbidden(
        ErrorCode.ONLY_PENDING_CAN_CANCEL,
        "Only the teacher or requester can cancel this leave"
      );
    }

    if (leave.status === LeaveStatus.CANCELLED) {
      throw AppException.badRequest(ErrorCode.LEAVE_ALREADY_CANCELLED);
    }

    return this.prisma.teacherAvailability.update({
      where: { id },
      data: {
        status: LeaveStatus.CANCELLED,
      },
    });
  }

  async getTeacherLeaveCalendar(
    teacherId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this.prisma.teacherAvailability.findMany({
      where: {
        teacherId,
        status: {
          in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
      orderBy: {
        startDate: "asc",
      },
      include: {
        replacementTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async suggestReplacementTeachers(
    teacherId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Get the teacher's profile first
    const teacherUser = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    });

    if (!teacherUser?.teacherProfile) {
      return [];
    }

    // Get the teacher's subjects
    const teacherSubjects = await this.prisma.teacherSubjectAssignment.findMany(
      {
        where: { teacherProfileId: teacherUser.teacherProfile.id },
        select: { subjectId: true },
      }
    );

    const subjectIds = teacherSubjects.map((ts) => ts.subjectId);

    // Find teachers who teach the same subjects and are available
    const availableTeachers = await this.prisma.user.findMany({
      where: {
        role: {
          in: ["INTERNAL_TEACHER", "EXTERNAL_TEACHER"],
        },
        status: "ACTIVE",
        id: {
          not: teacherId,
        },
        teacherProfile: {
          isNot: null,
        },
      },
      include: {
        teacherProfile: {
          include: {
            subjectAssignments: {
              where: {
                subjectId: {
                  in: subjectIds,
                },
              },
              include: {
                subject: true,
              },
            },
          },
        },
        teacherLeaves: {
          where: {
            status: {
              in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
            },
            OR: [
              {
                AND: [
                  { startDate: { lte: endDate } },
                  { endDate: { gte: startDate } },
                ],
              },
            ],
          },
        },
      },
    });

    // Filter out teachers who have overlapping leaves
    const suggestions = availableTeachers
      .filter((teacher) => teacher.teacherLeaves.length === 0)
      .map((teacher) => ({
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        employeeId: teacher.teacherProfile?.employeeId,
        department: teacher.teacherProfile?.department,
        specialization: teacher.teacherProfile?.specialization,
        commonSubjects: teacher.teacherProfile?.subjectAssignments.length || 0,
        subjects: teacher.teacherProfile?.subjectAssignments.map(
          (sa) => sa.subject.name
        ),
      }))
      .sort((a, b) => b.commonSubjects - a.commonSubjects);

    return suggestions;
  }

  async getLeaveStatistics(filters?: { startDate?: Date; endDate?: Date }) {
    const where: Prisma.TeacherAvailabilityWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.AND = [];
      if (filters.startDate) {
        where.AND.push({
          endDate: { gte: new Date(filters.startDate) },
        });
      }
      if (filters.endDate) {
        where.AND.push({
          startDate: { lte: new Date(filters.endDate) },
        });
      }
    }

    const [total, byStatus, byType] = await Promise.all([
      this.prisma.teacherAvailability.count({ where }),
      this.prisma.teacherAvailability.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      this.prisma.teacherAvailability.groupBy({
        by: ["leaveType"],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      byType: byType.reduce(
        (acc, item) => {
          acc[item.leaveType] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  private async findAffectedClasses(
    teacherId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Find timetable entries for this teacher
    const timetableEntries = await this.prisma.timetable.findMany({
      where: {
        teacherId,
        active: true,
        dayOfWeek: {
          // This would need to be more sophisticated to handle specific dates
          // For now, just return all classes taught by this teacher
          in: [0, 1, 2, 3, 4, 5, 6],
        },
      },
      select: {
        classId: true,
        subject: {
          select: {
            name: true,
          },
        },
        grade: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get unique class IDs and fetch class details
    const classIds = timetableEntries
      .filter((entry) => entry.classId)
      .map((entry) => entry.classId as string);

    if (classIds.length === 0) {
      return [];
    }

    const classes = await this.prisma.class.findMany({
      where: {
        id: {
          in: classIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return classes;
  }
}
