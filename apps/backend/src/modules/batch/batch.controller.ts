import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { BatchService } from "./batch.service";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";

@Controller("batches")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async findAll(
    @Query("gradeId") gradeId?: string,
    @Query("isActive") isActive?: string
  ) {
    return this.batchService.findAll({
      gradeId,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
    });
  }

  @Get("by-grade/:gradeId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async findByGrade(@Param("gradeId") gradeId: string) {
    return this.batchService.findByGrade(gradeId);
  }

  @Get(":id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async findOne(@Param("id") id: string) {
    return this.batchService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(
    @Body()
    data: {
      name: string;
      code?: string;
      gradeId: string;
    }
  ) {
    return this.batchService.create(data);
  }

  @Put(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(
    @Param("id") id: string,
    @Body()
    data: {
      name?: string;
      code?: string;
      gradeId?: string;
      isActive?: boolean;
    }
  ) {
    return this.batchService.update(id, data);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(@Param("id") id: string) {
    return this.batchService.remove(id);
  }
}
