// src/modules/notifications/services/session-reminder.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@database/prisma.service';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class SessionReminderService {
  private readonly logger = new Logger(SessionReminderService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Runs every 30 minutes to check for sessions starting within the next hour.
   * Sends a reminder notification to the parent if one hasn't been sent yet.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleSessionReminders() {
    this.logger.log('Checking for upcoming sessions to send reminders...');

    try {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      // Find all active sessions scheduled for today
      const todaySessions = await this.prisma.admissionTracking.findMany({
        where: {
          admissionDate: { gte: todayStart, lte: todayEnd },
          status: { in: ['ACTIVE', 'SCHEDULED', 'active', 'scheduled'] },
          startTime: { not: null },
        },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              parentId: true,
            },
          },
          physiotherapist: { select: { id: true, name: true } },
        },
      });

      if (!todaySessions.length) {
        this.logger.log('No sessions found for today.');
        return;
      }

      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const session of todaySessions) {
        try {
          const parentId = session.child?.parentId;
          if (!parentId || !session.startTime) continue;

          // Parse startTime (expected formats: "HH:mm", "HH:mm:ss", "h:mm AM/PM")
          const sessionMinutes = this.parseTimeToMinutes(session.startTime);
          if (sessionMinutes === null) continue;

          const minutesUntilSession = sessionMinutes - currentMinutes;

          // Send reminder if session is 30-90 minutes away
          if (minutesUntilSession > 0 && minutesUntilSession <= 90) {
            // Check if reminder already sent for this session
            const existingReminder = await this.findExistingReminder(session.id);
            if (existingReminder) continue;

            const childName = `${session.child?.firstName || ''} ${session.child?.lastName || ''}`.trim();
            const isOnline = String(session.admissionType).toUpperCase() === 'ONLINE';
            const sessionType = isOnline ? 'online' : 'physical';
            const timeLabel = this.formatMinutesUntil(minutesUntilSession);

            await this.notificationsService.createNotification({
              userId: parentId,
              title: `Session Reminder`,
              message: `${childName}'s ${sessionType} session starts in ${timeLabel} (at ${session.startTime}).`,
              type: 'SESSION_REMINDER',
              metadata: {
                admissionTrackingId: session.id,
                admissionType: session.admissionType,
                childId: session.childId,
                startTime: session.startTime,
              },
            });

            this.logger.log(
              `Sent reminder for session ${session.id} to user ${parentId} (${minutesUntilSession} min away)`,
            );
          }
        } catch (err: any) {
          this.logger.warn(`Error processing reminder for session ${session.id}: ${err?.message}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Session reminder cron failed: ${err?.message}`, err?.stack);
    }
  }

  /**
   * Check if a SESSION_REMINDER notification was already sent for a given session today.
   */
  private async findExistingReminder(admissionTrackingId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const notificationModel = (this.prisma as any).notification;

    const existing = await notificationModel.findFirst({
      where: {
        type: 'SESSION_REMINDER',
        createdAt: { gte: todayStart },
        metadata: { path: ['admissionTrackingId'], equals: admissionTrackingId },
      },
      select: { id: true },
    });

    return existing;
  }

  /**
   * Parse a time string like "09:00", "14:30", "9:00 AM" into total minutes from midnight.
   */
  private parseTimeToMinutes(time: string): number | null {
    try {
      // Try HH:mm or HH:mm:ss
      const match24 = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (match24) {
        return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
      }

      // Try 12-hour format: "9:00 AM", "2:30 PM"
      const match12 = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match12) {
        let hours = parseInt(match12[1], 10);
        const mins = parseInt(match12[2], 10);
        const period = match12[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + mins;
      }

      return null;
    } catch {
      return null;
    }
  }

  private formatMinutesUntil(minutes: number): string {
    if (minutes < 60) return `${minutes} minutes`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h} hour${h > 1 ? 's' : ''}`;
    return `${h}h ${m}m`;
  }
}
