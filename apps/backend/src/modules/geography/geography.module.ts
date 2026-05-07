import { Module } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { GeographyService } from './geography.service';
import { GeographyController } from './geography.controller';

@Module({
  providers: [GeographyService, PrismaService],
  controllers: [GeographyController],
  exports: [GeographyService],
})
export class GeographyModule {}
