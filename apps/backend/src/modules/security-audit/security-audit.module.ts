import { Module } from "@nestjs/common";
import { SecurityAuditController } from "./security-audit.controller";
import { SecurityAuditService } from "./security-audit.service";
import { DatabaseModule } from "@database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [SecurityAuditController],
  providers: [SecurityAuditService],
  exports: [SecurityAuditService],
})
export class SecurityAuditModule {}
