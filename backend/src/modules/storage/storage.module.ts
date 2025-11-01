import { Module } from '@nestjs/common';
import { StorageService } from "./storage.service";

@Module({
  controllers: [],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
