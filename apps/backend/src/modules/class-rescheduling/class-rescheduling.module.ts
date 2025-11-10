import { Module } from "@nestjs/common";
import { ClassReschedulingService } from "./class-rescheduling.service";
import { ClassReschedulingController } from "./class-rescheduling.controller";
import { PrismaModule } from "../../database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ClassReschedulingController],
  providers: [ClassReschedulingService],
  exports: [ClassReschedulingService],
})
export class ClassReschedulingModule {}
