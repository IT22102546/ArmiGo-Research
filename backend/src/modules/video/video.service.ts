import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "../storage/storage.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RoleHelper } from "../../common/helpers/role.helper";
import {
  CreateRoomDto,
  TeacherControlDto,
  UpdateSessionDto,
  SessionQueryDto,
} from "./dto/video.dto";
import { SessionStatus, UserRole } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

interface JitsiTokenPayload {
  aud: string;
  iss: string;
  sub: string;
  room: string;
  exp: number;
  context: {
    user: {
      id: string;
      name: string;
      email?: string;
      avatar?: string;
      moderator: boolean;
    };
    features: {
      livestreaming?: boolean;
      recording?: boolean;
      transcription?: boolean;
    };
  };
}

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private notificationsService: NotificationsService
  ) {}

  /**
   * Generate unique Jitsi room name
   */
  private generateRoomName(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString("hex");
    return `learnup-${timestamp}-${random}`;
  }

  /**
   * Generate Jitsi JWT token for participant
   */
  private generateJitsiToken(
    roomName: string,
    userId: string,
    userName: string,
    userEmail: string | null,
    isModerator: boolean
  ): string {
    const appId = process.env.JITSI_APP_ID;
    const apiSecret = process.env.JITSI_API_SECRET;

    if (!appId || !apiSecret) {
      throw new Error("Jitsi configuration missing in environment variables");
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 7200; // Token valid for 2 hours

    const payload: JitsiTokenPayload = {
      aud: "jitsi",
      iss: appId,
      sub: process.env.JITSI_DOMAIN || "meet.jit.si",
      room: roomName,
      exp,
      context: {
        user: {
          id: userId,
          name: userName,
          email: userEmail || undefined,
          moderator: isModerator,
        },
        features: {
          livestreaming: isModerator,
          recording: isModerator,
          transcription: false,
        },
      },
    };

    return jwt.sign(payload, apiSecret, { algorithm: "HS256" });
  }

  /**
   * Create a new video session (room)
   */
  async createRoom(createRoomDto: CreateRoomDto, teacherId: string) {
    const {
      classId,
      title,
      description,
      scheduledStartTime,
      durationMinutes,
      recordSession,
    } = createRoomDto;

    // Verify class exists and teacher is assigned
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { teacher: true },
    });

    if (!classEntity) {
      throw new NotFoundException("Class not found");
    }

    if (classEntity.teacherId !== teacherId) {
      throw new ForbiddenException("You are not the teacher of this class");
    }

    // Generate unique room name
    const jitsiRoomName = this.generateRoomName();

    // Create video session
    const session = await this.prisma.videoSession.create({
      data: {
        classId,
        hostId: teacherId,
        createdById: teacherId, // Track creator for ownership
        title,
        description,
        scheduledStartTime: scheduledStartTime
          ? new Date(scheduledStartTime)
          : undefined,
        durationMinutes,
        status: SessionStatus.SCHEDULED,
        recordSession: recordSession ?? false,
        jitsiRoomName,
        muteAll: false,
        videoDisabled: false,
        locked: false,
      },
      include: {
        class: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
            enrollments: {
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
      },
    });

    // Send notifications to enrolled students
    const enrolledStudents = session.class.enrollments.map((e) => e.student);
    for (const student of enrolledStudents) {
      await this.notificationsService.createNotification({
        userId: student.id,
        type: "class_scheduled",
        title: "New Class Scheduled",
        message: `${session.title} has been scheduled${scheduledStartTime ? ` for ${new Date(scheduledStartTime).toLocaleString()}` : ""}`,
        metadata: { sessionId: session.id, classId: session.classId },
      });
    }

    this.logger.log(`Created video session ${session.id} for class ${classId}`);

    return session;
  }

  /**
   * Start a video session (teacher only)
   */
  async startSession(sessionId: string, teacherId: string) {
    const session = await this.prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: { class: true },
    });

    if (!session) {
      throw new NotFoundException("Video session not found");
    }

    if (session.class.teacherId !== teacherId) {
      throw new ForbiddenException(
        "Only the class teacher can start the session"
      );
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot start session with status: ${session.status}`
      );
    }

    // Update session status
    const updatedSession = await this.prisma.videoSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ACTIVE,
        startedAt: new Date(),
      },
      include: {
        class: {
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
        },
      },
    });

    // Generate moderator token for teacher
    const teacher = updatedSession.class.teacher;
    const teacherName = `${teacher.firstName} ${teacher.lastName}`;
    const jitsiToken = this.generateJitsiToken(
      updatedSession.jitsiRoomName,
      teacher.id,
      teacherName,
      teacher.email,
      true // moderator
    );

    this.logger.log(`Started video session ${sessionId}`);

    return {
      ...updatedSession,
      jitsiToken,
      jitsiDomain: process.env.JITSI_DOMAIN || "meet.jit.si",
    };
  }

  /**
   * End a video session (teacher only)
   */
  async endSession(sessionId: string, teacherId: string) {
    const session = await this.prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: { class: true, participants: true },
    });

    if (!session) {
      throw new NotFoundException("Video session not found");
    }

    if (session.class.teacherId !== teacherId) {
      throw new ForbiddenException(
        "Only the class teacher can end the session"
      );
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot end session with status: ${session.status}`
      );
    }

    // Update session status
    const endedAt = new Date();
    const actualDuration = session.startedAt
      ? Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 60000)
      : null;

    const updatedSession = await this.prisma.videoSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ENDED,
        endedAt,
        actualDuration,
      },
      include: {
        class: true,
        participants: true,
      },
    });

    // If recording is enabled, set delete date (30 days from now)
    if (session.recordSession && session.recordingUrl) {
      const deleteAt = new Date();
      deleteAt.setDate(deleteAt.getDate() + 30);

      await this.prisma.videoSession.update({
        where: { id: sessionId },
        data: { recordingDeleteAt: deleteAt },
      });

      this.logger.log(
        `Recording for session ${sessionId} will be deleted on ${deleteAt.toISOString()}`
      );
    }

    this.logger.log(
      `Ended video session ${sessionId}, actual duration: ${actualDuration} minutes`
    );

    return updatedSession;
  }

  /**
   * Generate join token for participant (student or admin)
   */
  async getJoinToken(sessionId: string, userId: string, displayName?: string) {
    const session = await this.prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            enrollments: { where: { studentId: userId } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Video session not found");
    }

    // Check if session is active
    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException("Session is not currently active");
    }

    // Verify user has access (enrolled or admin)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const isEnrolled = session.class.enrollments.length > 0;
    const isTeacher = session.class.teacherId === userId;

    if (!isAdmin && !isEnrolled && !isTeacher) {
      throw new ForbiddenException("You do not have access to this session");
    }

    // Check if session is locked
    if (session.locked && !isTeacher && !isAdmin) {
      throw new ForbiddenException(
        "This session is currently locked by the teacher"
      );
    }

    // Generate participant token
    const userName = displayName || `${user.firstName} ${user.lastName}`;
    const isModerator = isAdmin || isTeacher;

    const jitsiToken = this.generateJitsiToken(
      session.jitsiRoomName,
      user.id,
      userName,
      user.email,
      isModerator
    );

    // Create participant record
    await this.prisma.sessionParticipant.upsert({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: user.id,
        },
      },
      create: {
        sessionId: session.id,
        userId: user.id,
        joinedAt: new Date(),
      },
      update: {
        joinedAt: new Date(),
        leftAt: null, // Reset left time if rejoining
      },
    });

    this.logger.log(
      `Generated join token for user ${userId} in session ${sessionId}`
    );

    return {
      sessionId: session.id,
      jitsiToken,
      jitsiRoomName: session.jitsiRoomName,
      jitsiDomain: process.env.JITSI_DOMAIN || "meet.jit.si",
      title: session.title,
      description: session.description,
      muteAll: session.muteAll,
      videoDisabled: session.videoDisabled,
    };
  }

  /**
   * Apply teacher controls (mute all, disable video, lock room)
   */
  async applyTeacherControls(controlDto: TeacherControlDto, teacherId: string) {
    const { sessionId, muteAll, videoDisabled, locked } = controlDto;

    const session = await this.prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: { class: true },
    });

    if (!session) {
      throw new NotFoundException("Video session not found");
    }

    if (session.class.teacherId !== teacherId) {
      throw new ForbiddenException("Only the class teacher can apply controls");
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException(
        "Controls can only be applied to active sessions"
      );
    }

    // Update controls
    const updateData: any = {};
    if (muteAll !== undefined) updateData.muteAll = muteAll;
    if (videoDisabled !== undefined) updateData.videoDisabled = videoDisabled;
    if (locked !== undefined) updateData.locked = locked;

    const updatedSession = await this.prisma.videoSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    this.logger.log(
      `Applied controls to session ${sessionId}: ${JSON.stringify(updateData)}`
    );

    return updatedSession;
  }

  /**
   * Get session details
   */
  async getSessionDetails(sessionId: string, userId: string) {
    const session = await this.prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
            enrollments: {
              where: { studentId: userId },
            },
          },
        },
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Video session not found");
    }

    // Check access
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const hasAccess =
      user?.role === UserRole.ADMIN ||
      session.class.teacherId === userId ||
      session.class.enrollments.length > 0;

    if (!hasAccess) {
      throw new ForbiddenException("You do not have access to this session");
    }

    return session;
  }

  /**
   * List sessions (with filters and pagination)
   */
  async listSessions(
    queryDto: SessionQueryDto,
    userId: string,
    userRole: UserRole
  ) {
    const {
      status,
      classId,
      teacherId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = queryDto;

    const where: any = {};

    // Role-based filtering
    if (RoleHelper.isStudent(userRole)) {
      // Students see only their enrolled classes
      where.class = {
        enrollments: {
          some: { userId },
        },
      };
    } else if (RoleHelper.isTeacher(userRole)) {
      // Teachers see only their classes
      where.class = { teacherId: userId };
    }
    // Admins see all

    // Apply filters
    if (status) where.status = status;
    if (classId) where.classId = classId;
    if (teacherId) where.class = { ...where.class, teacherId };
    if (startDate || endDate) {
      where.scheduledStartTime = {};
      if (startDate) where.scheduledStartTime.gte = new Date(startDate);
      if (endDate) where.scheduledStartTime.lte = new Date(endDate);
    }

    const [sessions, total] = await Promise.all([
      this.prisma.videoSession.findMany({
        where,
        include: {
          class: {
            include: {
              teacher: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          _count: { select: { participants: true } },
        },
        orderBy: { scheduledStartTime: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.videoSession.count({ where }),
    ]);

    return {
      sessions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update session details (before it starts)
   */
  async updateSession(
    sessionId: string,
    updateDto: UpdateSessionDto,
    teacherId: string
  ) {
    const session = await this.prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: { class: true },
    });

    if (!session) {
      throw new NotFoundException("Video session not found");
    }

    if (session.class.teacherId !== teacherId) {
      throw new ForbiddenException(
        "Only the class teacher can update the session"
      );
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException("Can only update scheduled sessions");
    }

    const updatedSession = await this.prisma.videoSession.update({
      where: { id: sessionId },
      data: {
        ...updateDto,
        scheduledStartTime: updateDto.scheduledStartTime
          ? new Date(updateDto.scheduledStartTime)
          : undefined,
      },
    });

    this.logger.log(`Updated session ${sessionId}`);

    return updatedSession;
  }

  /**
   * Get recording URL (after session ends)
   */
  async getRecordingUrl(sessionId: string, userId: string) {
    const session = await this.prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            enrollments: { where: { studentId: userId } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Video session not found");
    }

    // Check access
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const hasAccess =
      user?.role === UserRole.ADMIN ||
      session.class.teacherId === userId ||
      session.class.enrollments.length > 0;

    if (!hasAccess) {
      throw new ForbiddenException("You do not have access to this recording");
    }

    if (!session.recordingUrl) {
      throw new NotFoundException("Recording not available for this session");
    }

    if (session.status !== SessionStatus.ENDED) {
      throw new BadRequestException(
        "Recording is only available after the session ends"
      );
    }

    // Generate signed URL for recording (valid for 1 hour)
    // TODO: Implement actual S3 signed URL generation
    const signedUrl = session.recordingUrl; // Placeholder

    return {
      recordingUrl: signedUrl,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      sessionTitle: session.title,
      duration: session.actualDuration,
    };
  }

  /**
   * Cron job: Delete recordings older than 30 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteOldRecordings() {
    this.logger.log("Running scheduled task: Delete old recordings");

    const now = new Date();

    const sessionsToDelete = await this.prisma.videoSession.findMany({
      where: {
        recordingDeleteAt: {
          lte: now,
        },
        recordingUrl: {
          not: null,
        },
      },
    });

    for (const session of sessionsToDelete) {
      try {
        // Delete from S3
        if (session.recordingUrl) {
          // Extract key from URL
          const url = new URL(session.recordingUrl);
          const key = url.pathname.substring(1); // Remove leading '/'

          await this.storageService.deleteFile(key);
        }

        // Update database
        await this.prisma.videoSession.update({
          where: { id: session.id },
          data: {
            recordingUrl: null,
            recordingDeleteAt: null,
          },
        });

        this.logger.log(`Deleted recording for session ${session.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to delete recording for session ${session.id}:`,
          error
        );
      }
    }

    this.logger.log(`Deleted ${sessionsToDelete.length} old recordings`);
  }

  /**
   * Record participant leaving (called via webhook or manually)
   */
  async recordParticipantLeft(sessionId: string, userId: string) {
    const participant = await this.prisma.sessionParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new NotFoundException("Participant record not found");
    }

    const leftAt = new Date();
    const duration = participant.joinedAt
      ? Math.floor((leftAt.getTime() - participant.joinedAt.getTime()) / 60000)
      : 0;

    await this.prisma.sessionParticipant.update({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
      data: {
        leftAt,
        duration,
      },
    });

    this.logger.log(
      `Recorded participant ${userId} left session ${sessionId}, duration: ${duration} minutes`
    );
  }

  /**
   * Get session metrics (for admin/teacher)
   */
  async getSessionMetrics(sessionId: string, userId: string) {
    const session = await this.prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            enrollments: true,
          },
        },
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Video session not found");
    }

    // Check if user is teacher or admin
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const canViewMetrics =
      user?.role === UserRole.ADMIN || session.class.teacherId === userId;

    if (!canViewMetrics) {
      throw new ForbiddenException(
        "Only teachers and admins can view session metrics"
      );
    }

    const totalEnrolled = session.class.enrollments.length;
    const totalParticipants = session.participants.length;
    const participationRate =
      totalEnrolled > 0 ? (totalParticipants / totalEnrolled) * 100 : 0;

    const averageDuration =
      session.participants.length > 0
        ? session.participants.reduce((sum, p) => sum + (p.duration || 0), 0) /
          session.participants.length
        : 0;

    return {
      sessionId: session.id,
      title: session.title,
      status: session.status,
      scheduledStartTime: session.scheduledStartTime,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      plannedDuration: session.durationMinutes,
      actualDuration: session.actualDuration,
      totalEnrolled,
      totalParticipants,
      participationRate: Math.round(participationRate * 100) / 100,
      averageDuration: Math.round(averageDuration * 100) / 100,
      participants: session.participants.map((p) => ({
        userId: p.user.id,
        name: `${p.user.firstName} ${p.user.lastName}`,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        duration: p.duration,
      })),
      recordingAvailable: !!session.recordingUrl,
    };
  }

  /**
   * Delete a video session
   * Only creator, class teacher, or admin can delete
   */
  async deleteSession(sessionId: string, user: any) {
    const session = await this.prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          select: { teacherId: true }
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Video session not found');
    }

    // Check permissions
    const isCreator = session.createdById === user.id;
    const isClassTeacher = session.class?.teacherId === user.id;
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

    if (!isCreator && !isClassTeacher && !isAdmin) {
      throw new ForbiddenException(
        'Only the session creator, class teacher, or admin can delete this session'
      );
    }

    // If session is active, end it first
    if (session.status === SessionStatus.ACTIVE) {
      await this.endSession(sessionId, user.id);
    }

    // Delete the session
    await this.prisma.videoSession.delete({
      where: { id: sessionId }
    });

    return { message: 'Video session deleted successfully' };
  }
}
