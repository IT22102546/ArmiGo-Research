import { Module } from "@nestjs/common";
import { GradesController, GradesControllerUser} from "./grades.controller";
import { GradesService } from "./grades.service";
import { DatabaseModule } from "../../database";

@Module({
  imports: [DatabaseModule],
  controllers: [GradesController,GradesControllerUser],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
