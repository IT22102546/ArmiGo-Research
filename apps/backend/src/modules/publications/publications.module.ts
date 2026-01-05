import { Module } from "@nestjs/common";
import { PublicationsController } from "./publications.controller";
import { PublicationsService } from "./publications.service";
import { WalletModule } from "../wallet/wallet.module";
import { StorageModule } from "../../infrastructure/storage/storage.module";
import { WebSocketModule } from "../../infrastructure/websocket/websocket.module";

@Module({
  imports: [WalletModule, StorageModule, WebSocketModule],
  controllers: [PublicationsController],
  providers: [PublicationsService],
  exports: [PublicationsService],
})
export class PublicationsModule {}
