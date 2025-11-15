import { Module } from "@nestjs/common";
import { TemporaryAccessController } from "./temporary-access.controller";
import { TemporaryAccessService } from "./temporary-access.service";
import { PrismaModule } from "@database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [TemporaryAccessController],
  providers: [TemporaryAccessService],
  exports: [TemporaryAccessService],
})
export class TemporaryAccessModule {}
