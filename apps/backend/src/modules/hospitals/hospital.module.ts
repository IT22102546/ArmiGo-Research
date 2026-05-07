import { Module } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';

@Module({
  providers: [HospitalService, PrismaService],
  controllers: [HospitalController],
  exports: [HospitalService],
})
export class HospitalModule {}
