import { Module } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';

@Module({
  controllers: [PatientController],
  providers: [PatientService, PrismaService],
  exports: [PatientService],
})
export class PatientModule {}
