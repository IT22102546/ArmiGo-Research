import { Module } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { UsersModule } from '@modules/users/users.module';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';

@Module({
  imports: [UsersModule],
  controllers: [PatientController],
  providers: [PatientService, PrismaService],
  exports: [PatientService],
})
export class PatientModule {}
