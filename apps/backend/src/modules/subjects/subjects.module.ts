import { Module } from "@nestjs/common";
import { SubjectsService } from "./subjects.service";
import { SubjectsController } from "./subjects.controller";
import { StorageModule } from "../../infrastructure/storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
