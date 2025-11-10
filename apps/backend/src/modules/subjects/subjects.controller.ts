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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SubjectsService } from "./subjects.service";
import { CreateSubjectDto, UpdateSubjectDto } from "./dto/subject.dto";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";

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
    @Request() req: { user: { id: string; role: UserRole } }
  ) {
    if (!file) {
      throw AppException.badRequest(
        ErrorCode.UPLOAD_FAILED,
        "No file uploaded"
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      throw AppException.badRequest(
        ErrorCode.INVALID_FILE_TYPE,
        "Only JPEG, PNG, and WebP images are allowed"
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw AppException.badRequest(
        ErrorCode.FILE_TOO_LARGE,
        "Image too large. Maximum size is 5MB"
      );
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
    @Request() req?: { user?: { id: string; role: UserRole } }
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
  async findOne(
    @Param("id") id: string,
    @Request() req?: { user?: { id: string; role: UserRole } }
  ) {
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
    @Request() req: { user: { id: string; role: UserRole } }
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
    @Request() req: { user: { id: string; role: UserRole } }
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
