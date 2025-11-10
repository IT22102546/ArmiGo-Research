import { Module, Global } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { DatabaseUtilsService } from "./database-utils.service";
import { IncrementalSeedService } from "./incremental-seed.service";

@Global()
@Module({
  providers: [PrismaService, DatabaseUtilsService, IncrementalSeedService],
  exports: [PrismaService, DatabaseUtilsService, IncrementalSeedService],
})
export class DatabaseModule {}
