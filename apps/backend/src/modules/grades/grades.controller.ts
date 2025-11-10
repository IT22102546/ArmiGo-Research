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
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { GradesService } from "./grades.service";
import { CreateGradeDto, UpdateGradeDto, GradeQueryDto } from "./dto/grade.dto";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";

@Controller("admin/grades")
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  /**
   * Create a new grade (Admin/Super Admin only)
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createGradeDto: CreateGradeDto) {
    const grade = await this.gradesService.create(createGradeDto);
    return {
      success: true,
      data: grade,
      message: "Grade created successfully",
    };
  }

  /**
   * Get all grades with pagination and filtering
   * Available to all authenticated users
   */
  @Get()
  async findAll(@Query() query: GradeQueryDto) {
    const result = await this.gradesService.findAll(query);
    return {
      success: true,
      data: result,
      message: "Grades retrieved successfully",
    };
  }

  /**
   * Get a single grade by ID
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    const grade = await this.gradesService.findOne(id);
    return {
      success: true,
      data: grade,
      message: "Grade retrieved successfully",
    };
  }

  /**
   * Update a grade (Admin/Super Admin only)
   */
  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param("id") id: string,
    @Body() updateGradeDto: UpdateGradeDto
  ) {
    const grade = await this.gradesService.update(id, updateGradeDto);
    return {
      success: true,
      data: grade,
      message: "Grade updated successfully",
    };
  }

  /**
   * Soft delete a grade (Admin/Super Admin only)
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param("id") id: string) {
    const grade = await this.gradesService.remove(id);
    return {
      success: true,
      data: grade,
      message: "Grade deactivated successfully",
    };
  }

  /**
   * Hard delete a grade (Super Admin only)
   */
  @Delete(":id/hard")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async hardDelete(@Param("id") id: string) {
    const grade = await this.gradesService.hardDelete(id);
    return {
      success: true,
      data: grade,
      message: "Grade permanently deleted",
    };
  }
}

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesControllerUser {
  constructor(private readonly gradesService: GradesService) {}

  /**
   * Get all grades with pagination and filtering
   * Available to all authenticated users
   */
  @Get()
  async findAll(@Query() query: GradeQueryDto) {
    const result = await this.gradesService.findAll(query);
    return {
      success: true,
      data: result,
      message: 'Grades retrieved successfully',
    };
  }

  /**
   * Get a single grade by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const grade = await this.gradesService.findOne(id);
    return {
      success: true,
      data: grade,
      message: 'Grade retrieved successfully',
    };
  }
}
