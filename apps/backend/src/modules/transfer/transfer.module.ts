import { Module } from "@nestjs/common";
import { TransferController } from "./transfer.controller";
import { TransferService } from "./transfer.service";
import { TransferInterestController } from "./controllers/transfer-interest.controller";
import { TransferPrivacyService } from "./services/transfer-privacy.service";
import { TransferInterestService } from "./services/transfer-interest.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [
    TransferController,
    TransferInterestController,
  ],
  providers: [
    TransferService,
    TransferPrivacyService,
    TransferInterestService,
  ],
  exports: [TransferService],
})
export class TransferModule {}
