import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { ScheduledNotificationService } from "../../infrastructure/push/scheduled-notification.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ExamStatus } from "@prisma/client";

@Injectable()
export class ExamNotificationService {
  private readonly logger = new Logger(ExamNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private scheduledNotificationService: ScheduledNotificationService
  ) {}

  /**
   * Schedule reminders when an exam is published
   * Called from ExamsService.publishExam
   */
  async scheduleExamReminders(
    examId: string,
    examTitle: string,
    startTime: Date,
    classId?: string | null
  ): Promise<void> {
    try {
      // Get all enrolled students for this exam
      let studentIds: string[] = [];

      if (classId) {
        // Get students enrolled in the class
        const enrollments = await this.prisma.enrollment.findMany({
          where: {
            classId,
            status: "APPROVED",
            deletedAt: null,
          },
          select: { studentId: true },
        });
        studentIds = enrollments.map((e) => e.studentId);
      } else {
        // For grade-wide exams, get all students in that grade
        const exam = await this.prisma.exam.findUnique({
          where: { id: examId },
          select: { gradeId: true },
        });

        if (exam?.gradeId) {
          const students = await this.prisma.studentProfile.findMany({
            where: {
              gradeId: exam.gradeId,
              user: { deletedAt: null, status: "ACTIVE" },
            },
            select: { userId: true },
          });
          studentIds = students.map((s) => s.userId);
        }
      }

      if (studentIds.length === 0) {
        this.logger.warn(
          `No students found for exam ${examId}, skipping reminders`
        );
        return;
      }

      // Schedule reminders at 5min, 15min, 30min, and 1hr before exam
      await this.scheduledNotificationService.scheduleExamReminders(
        examId,
        examTitle,
        startTime,
        studentIds,
        [5, 15, 30, 60] // 5 min, 15 min, 30 min, 1 hour before
      );

      this.logger.log(
        `📅 Scheduled exam reminders for ${studentIds.length} students, exam: ${examId}`
      );
    } catch (error) {
      this.logger.error(`Failed to schedule exam reminders: ${error}`);
    }
  }

  /**
   * Cancel reminders when an exam is cancelled or deleted
   */
  async cancelExamReminders(examId: string): Promise<void> {
    try {
      const count =
        await this.scheduledNotificationService.cancelScheduledNotifications(
          examId,
          "exam_reminder"
        );
      this.logger.log(
        `❌ Cancelled ${count} reminders for cancelled exam: ${examId}`
      );
    } catch (error) {
      this.logger.error(`Failed to cancel exam reminders: ${error}`);
    }
  }

  /**
   * Send immediate notification when exam results are published
   */
  async notifyExamResultsPublished(examId: string): Promise<void> {
    try {
      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
        include: {
          attempts: {
            where: { status: "SUBMITTED" },
            select: { studentId: true },
          },
        },
      });

      if (!exam) {
        return;
      }

      const studentIds = exam.attempts.map((a) => a.studentId);

      if (studentIds.length === 0) {
        return;
      }

      // Schedule immediate notification (now)
      await this.scheduledNotificationService.scheduleBulkNotifications({
        userIds: studentIds,
        title: "📊 Exam Results Available",
        body: `Results for "${exam.title}" have been published. Check your scores now!`,
        data: {
          examId,
          type: "exam_results",
        },
        triggerType: "custom",
        referenceId: examId,
        scheduledFor: new Date(), // Immediate
        priority: "high",
      });
    } catch (error) {
      this.logger.error(`Failed to notify exam results: ${error}`);
    }
  }

  /**
   * Cron job: Check for upcoming exams and ensure reminders are scheduled
   * Runs every hour to catch any missed scheduling
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkUpcomingExams(): Promise<void> {
    try {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      // Find published exams starting in the next 2 hours
      const upcomingExams = await this.prisma.exam.findMany({
        where: {
          status: ExamStatus.PUBLISHED,
          startTime: {
            gte: now,
            lte: twoHoursFromNow,
          },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          classId: true,
        },
      });

      for (const exam of upcomingExams) {
        // Check if reminders already exist for this exam
        const existingReminders = await this.prisma.scheduledNotification.count(
          {
            where: {
              referenceId: exam.id,
              triggerType: "exam_reminder",
              status: "PENDING",
            },
          }
        );

        // If no reminders exist, schedule them
        if (existingReminders === 0) {
          this.logger.warn(
            `Missing reminders for exam ${exam.id}, scheduling now`
          );
          await this.scheduleExamReminders(
            exam.id,
            exam.title,
            exam.startTime,
            exam.classId
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to check upcoming exams: ${error}`);
    }
  }

  /**
   * Notify when exam is about to start (for proctored exams)
   */
  async notifyExamStartingSoon(examId: string): Promise<void> {
    try {
      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
        include: {
          class: {
            include: {
              enrollments: {
                where: { status: "APPROVED" },
                select: { studentId: true },
              },
            },
          },
        },
      });

      if (!exam || !exam.class) {
        return;
      }

      const studentIds = exam.class.enrollments.map((e) => e.studentId);

      await this.scheduledNotificationService.scheduleBulkNotifications({
        userIds: studentIds,
        title: "🎯 Exam Starting Now",
        body: `"${exam.title}" is starting. Join now to begin your exam!`,
        data: {
          examId,
          type: "exam_start",
          action: "join_exam",
        },
        triggerType: "exam_reminder",
        referenceId: examId,
        scheduledFor: new Date(),
        priority: "high",
      });
    } catch (error) {
      this.logger.error(`Failed to notify exam starting: ${error}`);
    }
  }
}
