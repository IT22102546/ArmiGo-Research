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
  HttpStatus,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SubjectsService } from "./subjects.service";
import { CreateSubjectDto, UpdateSubjectDto } from "./dto/subject.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../common/enums/user.enum";

@Controller("subjects")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /**
   * Create a new subject
   * Admin only
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  /**
   * Upload subject image
   * Admin and Teachers can upload images for their subjects
   */
  @Post("upload-image")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Only JPEG, PNG, and WebP images are allowed"
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException("Image too large. Maximum size is 5MB");
    }

    return this.subjectsService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      req.user.id,
      req.user.role
    );
  }

  /**
   * Get all subjects - Filtered by user role
   * - Admins: All subjects
   * - Teachers: Only subjects they teach
   * - Students: Only subjects from enrolled classes
   */
  @Get()
  async findAll(
    @Query("includeInactive") includeInactive?: string,
    @Request() req?: any
  ) {
    const userId = req?.user?.id;
    const userRole = req?.user?.role;
    return this.subjectsService.findAll(
      includeInactive === "true",
      userId,
      userRole
    );
  }

  /**
   * Search subjects
   */
  @Get("search")
  async search(@Query("q") query: string) {
    return this.subjectsService.search(query);
  }

  /**
   * Get all categories
   */
  @Get("categories")
  async getCategories() {
    return this.subjectsService.getCategories();
  }

  /**
   * Get subjects by category
   */
  @Get("category/:category")
  async findByCategory(@Param("category") category: string) {
    return this.subjectsService.findByCategory(category);
  }

  /**
   * Get subject by ID - With access control
   */
  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req?: any) {
    const userId = req?.user?.id;
    const userRole = req?.user?.role;
    return this.subjectsService.findOne(id, userId, userRole);
  }

  /**
   * Update a subject
   * Admins can update any subject
   * Teachers can update subjects they teach
   */
  @Put(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async update(
    @Param("id") id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @Request() req: any
  ) {
    return this.subjectsService.update(
      id,
      updateSubjectDto,
      req.user.id,
      req.user.role
    );
  }

  /**
   * Delete a subject (hard delete - permanent)
   * Admins can delete any subject
   * Teachers can delete subjects they teach
   * 
   * Note: This is a hard delete by default. Subject is permanently removed from database.
   * Use ?soft=true query parameter for soft delete (mark as inactive).
   */
  @Delete(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async remove(
    @Param("id") id: string,
    @Query("soft") soft: string,
    @Request() req: any
  ) {
    const isSoftDelete = soft === "true";
    return this.subjectsService.remove(
      id,
      req.user.id,
      req.user.role,
      isSoftDelete
    );
  }

  /**
   * Restore a soft-deleted subject
   * Admin only
   */
  @Post(":id/restore")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async restore(@Param("id") id: string) {
    return this.subjectsService.restore(id);
  }
}
