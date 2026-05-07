import { Module } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { StorageService } from "@infrastructure/storage/storage.service";
import { UsersModule } from "@modules/users/users.module";
import { PublicationsController } from "./publications.controller";
import { PublicationsService } from "./publications.service";

@Module({
  imports: [UsersModule],
  controllers: [PublicationsController],
  providers: [PublicationsService, PrismaService, StorageService],
  exports: [PublicationsService],
})
export class PublicationsModule {}
