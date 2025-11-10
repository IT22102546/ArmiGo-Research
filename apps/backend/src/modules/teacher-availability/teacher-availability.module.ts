import { Module } from "@nestjs/common";
import { TeacherAvailabilityController } from "./teacher-availability.controller";
import { TeacherAvailabilityService } from "./teacher-availability.service";
import { PrismaModule } from "@database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [TeacherAvailabilityController],
  providers: [TeacherAvailabilityService],
  exports: [TeacherAvailabilityService],
})
export class TeacherAvailabilityModule {}
