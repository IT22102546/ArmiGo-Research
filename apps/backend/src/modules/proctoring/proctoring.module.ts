import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ProctoringController } from "./proctoring.controller";
import { ProctoringService } from "./proctoring.service";
import { ExamProctoringController } from "./exam-proctoring.controller";
import { ExamProctoringService } from "./exam-proctoring.service";
import { PrismaModule } from "../../database/prisma.module";
import { FaceRecognitionModule } from "../face-recognition/face-recognition.module";

@Module({
  imports: [PrismaModule, ConfigModule, FaceRecognitionModule],
  controllers: [ProctoringController, ExamProctoringController],
  providers: [ProctoringService, ExamProctoringService],
  exports: [ProctoringService, ExamProctoringService],
})
export class ProctoringModule {}
