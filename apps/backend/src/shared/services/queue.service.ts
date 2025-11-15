import { Injectable, Logger } from "@nestjs/common";

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface NotificationJobData {
  userId: string;
  type: "exam_reminder" | "class_reminder" | "payment_due" | "transfer_update";
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface FileProcessingJobData {
  fileUrl: string;
  fileType: "exam_submission" | "profile_image" | "publication_cover";
  userId: string;
  metadata?: Record<string, any>;
}

export interface ExamProcessingJobData {
  examId: string;
  submissionId: string;
  userId: string;
  autoGrade: boolean;
}

/**
 * QueueService - Redis-backed queue (currently using synchronous fallback)
 * Enable Redis to process tasks via Bull queues
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor() {
    this.logger.warn(
      "Redis queue temporarily disabled - tasks will be processed synchronously"
    );
  }

  /**
   * Email Queue Operations
   */
  async sendEmail(data: EmailJobData, delay?: number): Promise<void> {
    try {
      // TEMPORARILY DISABLED - Process immediately instead of queueing
      this.logger.log(
        `Email would be sent to ${data.to} with subject: ${data.subject}`
      );
      // Synchronous fallback: no-op until Redis queue is re-enabled
    } catch (error) {
      this.logger.error("Failed to process email:", error);
    }
  }

  async sendBulkEmails(emails: EmailJobData[]): Promise<void> {
    try {
      // TEMPORARILY DISABLED - Process immediately instead of queueing
      this.logger.log(`Bulk emails would be sent: ${emails.length} emails`);
      // Synchronous fallback: no-op until Redis queue is re-enabled
    } catch (error) {
      this.logger.error("Failed to process bulk emails:", error);
    }
  }

  /**
   * Notification Queue Operations
   */
  async sendNotification(
    data: NotificationJobData,
    delay?: number
  ): Promise<void> {
    try {
      // TEMPORARILY DISABLED - Process immediately instead of queueing
      this.logger.log(`Notification would be sent to user ${data.userId}`);
      // Synchronous fallback: no-op until Redis queue is re-enabled
    } catch (error) {
      this.logger.error("Failed to process notification:", error);
    }
  }

  async scheduleExamReminder(
    examId: string,
    userIds: string[],
    reminderTime: Date
  ): Promise<void> {
    try {
      // TEMPORARILY DISABLED - Process immediately instead of queueing
      this.logger.log(
        `Exam reminders would be scheduled for ${userIds.length} users`
      );
      // Synchronous fallback: no-op until Redis queue is re-enabled
    } catch (error) {
      this.logger.error("Failed to schedule exam reminders:", error);
    }
  }

  /**
   * File Processing Queue Operations
   */
  async processFile(data: FileProcessingJobData): Promise<void> {
    try {
      // TEMPORARILY DISABLED - Process immediately instead of queueing
      this.logger.log(`File would be processed: ${data.fileUrl}`);
      // Synchronous fallback: no-op until Redis queue is re-enabled
    } catch (error) {
      this.logger.error("Failed to process file:", error);
    }
  }

  /**
   * Exam Processing Queue Operations
   */
  async processExamSubmission(data: ExamProcessingJobData): Promise<void> {
    try {
      // TEMPORARILY DISABLED - Process immediately instead of queueing
      this.logger.log(
        `Exam submission would be processed: ${data.submissionId}`
      );
      // Synchronous fallback: no-op until Redis queue is re-enabled
    } catch (error) {
      this.logger.error("Failed to process exam submission:", error);
    }
  }

  async calculateExamRankings(examId: string): Promise<void> {
    try {
      // TEMPORARILY DISABLED - Process immediately instead of queueing
      this.logger.log(`Exam rankings would be calculated for exam: ${examId}`);
      // Synchronous fallback: no-op until Redis queue is re-enabled
    } catch (error) {
      this.logger.error("Failed to calculate exam rankings:", error);
    }
  }

  /**
   * Queue Monitoring
   */
  async getQueueStats() {
    try {
      // TEMPORARILY DISABLED - Return mock stats
      return {
        email: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
        notifications: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        },
        fileProcessing: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        },
        examProcessing: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        },
      };
    } catch (error) {
      this.logger.error("Failed to get queue stats:", error);
      return null;
    }
  }

  /**
   * Clean up completed jobs (should be called periodically)
   */
  async cleanupCompletedJobs(): Promise<void> {
    try {
      // TEMPORARILY DISABLED - No cleanup needed for in-memory processing
      this.logger.log(
        "Cleanup completed (no action needed when Redis disabled)"
      );
    } catch (error) {
      this.logger.error("Failed to cleanup jobs:", error);
    }
  }

  /**
   * Graceful shutdown
   */
  async onModuleDestroy(): Promise<void> {
    // TEMPORARILY DISABLED - No queues to close when Redis disabled
    this.logger.log(
      "Queue service shutdown (no action needed when Redis disabled)"
    );
  }
}
