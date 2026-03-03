import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaService } from '@database/prisma.service';
import { UsersModule } from '@modules/users/users.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';

@Module({
  imports: [UsersModule, StorageModule, MulterModule.register({})],
  // MulterModule with no options → defaults to MemoryStorage so file.buffer is populated
  controllers: [PatientController],
  providers: [PatientService, PrismaService],
  exports: [PatientService],
})
export class PatientModule {}
