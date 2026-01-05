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
import { AcademicYearsService } from "./academic-years.service";
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  AcademicYearQueryDto,
} from "./dto/academic-year.dto";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";

@Controller("admin/academic-years")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  /**
   * Create a new academic year (Admin/Super Admin only)
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createAcademicYearDto: CreateAcademicYearDto) {
    const academicYear = await this.academicYearsService.create(
      createAcademicYearDto
    );
    return {
      success: true,
      data: academicYear,
      message: "Academic year created successfully",
    };
  }

  /**
   * Get all academic years with pagination and filtering
   * Available to all authenticated users
   */
  @Get()
  async findAll(@Query() query: AcademicYearQueryDto) {
    const result = await this.academicYearsService.findAll(query);
    return {
      success: true,
      data: result,
      message: "Academic years retrieved successfully",
    };
  }

  /**
   * Get the current academic year
   */
  @Get("current")
  async findCurrent() {
    const academicYear = await this.academicYearsService.findCurrent();
    return {
      success: true,
      data: academicYear,
      message: academicYear
        ? "Current academic year retrieved successfully"
        : "No current academic year set",
    };
  }

  /**
   * Get a single academic year by ID
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    const academicYear = await this.academicYearsService.findOne(id);
    return {
      success: true,
      data: academicYear,
      message: "Academic year retrieved successfully",
    };
  }

  /**
   * Update an academic year (Admin/Super Admin only)
   */
  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param("id") id: string,
    @Body() updateAcademicYearDto: UpdateAcademicYearDto
  ) {
    const academicYear = await this.academicYearsService.update(
      id,
      updateAcademicYearDto
    );
    return {
      success: true,
      data: academicYear,
      message: "Academic year updated successfully",
    };
  }

  /**
   * Soft delete an academic year (Admin/Super Admin only)
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param("id") id: string) {
    const academicYear = await this.academicYearsService.remove(id);
    return {
      success: true,
      data: academicYear,
      message: "Academic year deactivated successfully",
    };
  }

  /**
   * Hard delete an academic year (Super Admin only)
   */
  @Delete(":id/hard")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async hardDelete(@Param("id") id: string) {
    const academicYear = await this.academicYearsService.hardDelete(id);
    return {
      success: true,
      data: academicYear,
      message: "Academic year permanently deleted",
    };
  }
}
