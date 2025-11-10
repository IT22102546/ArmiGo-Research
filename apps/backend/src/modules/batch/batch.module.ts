import { Module } from "@nestjs/common";
import { BatchController } from "./batch.controller";
import { BatchService } from "./batch.service";
import { PrismaModule } from "@database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService],
})
export class BatchModule {}
