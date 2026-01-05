import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FaceRecognitionService } from "./face-recognition.service";
import { FaceRecognitionController } from "./face-recognition.controller";
import { PrismaModule } from "@/database/prisma.module";

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [FaceRecognitionController],
  providers: [FaceRecognitionService],
  exports: [FaceRecognitionService],
})
export class FaceRecognitionModule {}
