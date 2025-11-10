import { Module } from "@nestjs/common";
import { PaymentReconciliationController } from "./payment-reconciliation.controller";
import { PaymentReconciliationService } from "./payment-reconciliation.service";
import { PrismaModule } from "../../database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [PaymentReconciliationController],
  providers: [PaymentReconciliationService],
  exports: [PaymentReconciliationService],
})
export class PaymentReconciliationModule {}
