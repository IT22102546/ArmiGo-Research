import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { StorageModule } from "../storage/storage.module";
import { WebSocketModule } from "../../websocket/websocket.module";

@Module({
  imports: [StorageModule, WebSocketModule],
  controllers: [],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
