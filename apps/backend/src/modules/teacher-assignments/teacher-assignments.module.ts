import { Module } from "@nestjs/common";
import { TeacherAssignmentsController } from "./teacher-assignments.controller";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [AdminModule],
  controllers: [TeacherAssignmentsController],
})
export class TeacherAssignmentsModule {}
