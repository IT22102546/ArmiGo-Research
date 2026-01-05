import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UserManagementService } from "./user-management.service";
import { UsersController } from "./users.controller";
import { StorageModule } from "../../infrastructure/storage/storage.module";
import { WebSocketModule } from "../../infrastructure/websocket/websocket.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [StorageModule, WebSocketModule, NotificationsModule],
  controllers: [UsersController],
  providers: [UsersService, UserManagementService],
  exports: [UsersService, UserManagementService],
})
export class UsersModule {}
