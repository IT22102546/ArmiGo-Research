import { Module } from "@nestjs/common";
import { MediumsController, MediumsControllerUser } from "./mediums.controller";
import { MediumsService } from "./mediums.service";
import { DatabaseModule } from "../../database";

@Module({
  imports: [DatabaseModule],
  controllers: [MediumsController,MediumsControllerUser],
  providers: [MediumsService],
  exports: [MediumsService],
})
export class MediumsModule {}
