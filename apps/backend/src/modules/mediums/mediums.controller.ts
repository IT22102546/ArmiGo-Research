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
import { MediumsService } from "./mediums.service";
import {
  CreateMediumDto,
  UpdateMediumDto,
  MediumQueryDto,
} from "./dto/medium.dto";
import { ReorderDto } from "../admin/dto/admin.dto";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";

@Controller("admin/mediums")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediumsController {
  constructor(private readonly mediumsService: MediumsService) {}

  /**
   * Create a new medium (Admin/Super Admin only)
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createMediumDto: CreateMediumDto) {
    const medium = await this.mediumsService.create(createMediumDto);
    return {
      success: true,
      data: medium,
      message: "Medium created successfully",
    };
  }

  /**
   * Get all mediums with pagination and filtering
   * Available to all authenticated users
   */
  @Get()
  async findAll(@Query() query: MediumQueryDto) {
    const result = await this.mediumsService.findAll(query);
    return {
      success: true,
      data: result,
      message: "Mediums retrieved successfully",
    };
  }

  /**
   * Get a single medium by ID
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    const medium = await this.mediumsService.findOne(id);
    return {
      success: true,
      data: medium,
      message: "Medium retrieved successfully",
    };
  }

  /**
   * Update a medium (Admin/Super Admin only)
   */
  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param("id") id: string,
    @Body() updateMediumDto: UpdateMediumDto
  ) {
    const medium = await this.mediumsService.update(id, updateMediumDto);
    return {
      success: true,
      data: medium,
      message: "Medium updated successfully",
    };
  }

  /**
   * Soft delete a medium (Admin/Super Admin only)
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param("id") id: string) {
    const medium = await this.mediumsService.remove(id);
    return {
      success: true,
      data: medium,
      message: "Medium deactivated successfully",
    };
  }

  /**
   * Hard delete a medium (Super Admin only)
   */
  @Delete(":id/hard")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async hardDelete(@Param("id") id: string) {
    const medium = await this.mediumsService.hardDelete(id);
    return {
      success: true,
      data: medium,
      message: "Medium permanently deleted",
    };
  }

  /**
   * Reorder mediums (Admin)
   */
  @Post("reorder")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async reorder(@Body() dto: ReorderDto) {
    const result = await this.mediumsService.reorder(dto.items);
    return {
      success: true,
      data: result,
      message: "Mediums reordered successfully",
    };
  }
};


@Controller('mediums')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediumsControllerUser {
  constructor(private readonly mediumsService: MediumsService) {}

  /**
   * Create a new medium (Admin/Super Admin only)
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createMediumDto: CreateMediumDto) {
    const medium = await this.mediumsService.create(createMediumDto);
    return {
      success: true,
      data: medium,
      message: 'Medium created successfully',
    };
  }

  /**
   * Get all mediums with pagination and filtering
   * Available to all authenticated users
   */
  @Get()
  async findAll(@Query() query: MediumQueryDto) {
    const result = await this.mediumsService.findAll(query);
    return {
      success: true,
      data: result,
      message: 'Mediums retrieved successfully',
    };
  }

  /**
   * Get a single medium by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const medium = await this.mediumsService.findOne(id);
    return {
      success: true,
      data: medium,
      message: 'Medium retrieved successfully',
    };
  }
};
