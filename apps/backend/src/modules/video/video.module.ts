import { Module } from "@nestjs/common";
import { VideoService } from "./video.service";
import { VideoController } from "./video.controller";
import { StorageModule } from "../../infrastructure/storage/storage.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [StorageModule, NotificationsModule],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
