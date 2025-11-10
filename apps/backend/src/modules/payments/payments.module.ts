import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripePaymentService } from "./services/stripe-payment.service";
import { StripeWebhookController } from "./webhooks/stripe-webhook.controller";
import { WalletModule } from "../wallet/wallet.module";
import { StorageModule } from "../../infrastructure/storage/storage.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [ConfigModule, WalletModule, StorageModule, NotificationsModule],
  controllers: [PaymentsController, StripeWebhookController],
  providers: [PaymentsService, StripePaymentService],
  exports: [PaymentsService, StripePaymentService],
})
export class PaymentsModule {}
