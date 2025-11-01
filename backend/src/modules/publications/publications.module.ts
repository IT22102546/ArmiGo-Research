import { Module } from "@nestjs/common";
import { PublicationsController } from "./publications.controller";
import { PublicationsService } from "./publications.service";
import { DatabaseModule } from "../../database/database.module";
import { WalletModule } from "../wallet/wallet.module";
import { StorageModule } from "../storage/storage.module";
import { WebSocketModule } from "../../websocket/websocket.module";

@Module({
  imports: [DatabaseModule, WalletModule, StorageModule, WebSocketModule],
  controllers: [PublicationsController],
  providers: [PublicationsService],
  exports: [PublicationsService],
})
export class PublicationsModule {}
