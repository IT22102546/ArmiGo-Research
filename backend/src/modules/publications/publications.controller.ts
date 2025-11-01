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
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { PublicationsService } from "./publications.service";
import { StorageService } from "../storage/storage.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../common/enums/user.enum";
import {
  CreatePublicationDto,
  UpdatePublicationDto,
  PublicationQueryDto,
  CreateReviewDto,
} from "./dto/publication.dto";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("publications")
export class PublicationsController {
  constructor(
    private readonly publicationsService: PublicationsService,
    private readonly storageService: StorageService
  ) {}

  /**
   * Create publication (Admin/Teacher only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  create(
    @Body() createPublicationDto: CreatePublicationDto,
    @Request() req: any
  ) {
    return this.publicationsService.create(createPublicationDto, req.user.id);
  }

  /**
   * Upload file for publication (cover image or publication file)
   * Integrated with S3 storage
   */
  @Post("upload")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Validate file type based on upload type
    if (body.type === "publication") {
      const allowedTypes = ["application/pdf", "application/epub+zip"];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          "Only PDF and EPUB files are allowed for publications"
        );
      }
      if (file.size > 50 * 1024 * 1024) {
        throw new BadRequestException("Publication file too large. Max 50MB");
      }
    } else if (body.type === "cover") {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          "Only JPEG, PNG, and WebP images are allowed for covers"
        );
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException("Cover image too large. Max 5MB");
      }
    }

    // Upload to S3 using StorageService
    const folder = body.type === "publication" ? "publications" : "covers";
    const result = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder
    );

    return {
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Get all publications with filtering
   */
  @Get()
  findAll(@Query() query: PublicationQueryDto, @Request() req) {
    // Pass userId if authenticated
    return this.publicationsService.findAll(query);
  }

  /**
   * Get publication by ID
   */
  @Get(":id")
  findOne(@Param("id") id: string, @Request() req) {
    const userId = req.user?.userId;
    return this.publicationsService.findOne(id, userId);
  }

  /**
   * Update publication (Admin/Teacher only)
   */
  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  update(
    @Param("id") id: string,
    @Body() updatePublicationDto: UpdatePublicationDto
  ) {
    return this.publicationsService.update(id, updatePublicationDto);
  }

  /**
   * Purchase publication
   */
  @Post(":id/purchase")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  purchase(@Param("id") id: string, @Request() req) {
    return this.publicationsService.purchase(id, req.user.id);
  }

  /**
   * Get download URL for purchased publication
   */
  @Get(":id/download")
  @UseGuards(JwtAuthGuard)
  getDownloadUrl(@Param("id") id: string, @Request() req) {
    return this.publicationsService.getDownloadUrl(id, req.user.id);
  }

  /**
   * Create or update review
   */
  @Post(":id/review")
  @UseGuards(JwtAuthGuard)
  createReview(
    @Param("id") id: string,
    @Body() createReviewDto: CreateReviewDto,
    @Request() req
  ) {
    return this.publicationsService.createReview(
      id,
      req.user.id,
      createReviewDto
    );
  }

  /**
   * Get user's purchases
   */
  @Get("user/purchases")
  @UseGuards(JwtAuthGuard)
  getUserPurchases(
    @Request() req,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.publicationsService.getUserPurchases(req.user.id, page, limit);
  }

  /**
   * Get publication purchasers (Admin only)
   */
  @Get(":id/purchasers")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getPublicationPurchasers(
    @Param("id") id: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.publicationsService.getPublicationPurchasers(id, page, limit);
  }

  /**
   * Delete publication (Admin/Teacher)
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  remove(@Param("id") id: string, @Request() req) {
    return this.publicationsService.remove(id, req.user);
  }
}
