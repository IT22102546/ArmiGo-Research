import { Module } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, PrismaService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
