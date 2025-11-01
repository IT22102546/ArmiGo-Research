import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DatabaseModule } from '../../database/database.module';
import { WalletModule } from "../wallet/wallet.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [DatabaseModule, WalletModule, StorageModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
