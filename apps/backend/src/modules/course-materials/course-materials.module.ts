import { Module } from "@nestjs/common";
import { CourseMaterialsService } from "./course-materials.service";
import { CourseMaterialsController } from "./course-materials.controller";
import { DatabaseModule } from "@database/database.module";
import { StorageModule } from "../../infrastructure/storage/storage.module";

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [CourseMaterialsController],
  providers: [CourseMaterialsService],
  exports: [CourseMaterialsService],
})
export class CourseMaterialsModule {}
