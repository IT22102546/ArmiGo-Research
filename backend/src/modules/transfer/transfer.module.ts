import { Module } from "@nestjs/common";
import { TransferController } from "./transfer.controller";
import { TransferService } from "./transfer.service";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [TransferController],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
