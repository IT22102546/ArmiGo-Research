import {
  Controller,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Req,
  Res,
  HttpStatus,
  SetMetadata,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "@common/guards";
import { Public } from "@common/decorators";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";
import {
  StorageService,
  UploadUrlOptions,
  FileUploadResult,
} from "./storage.service";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";

class BatchFileDto {
  @IsString()
  filename: string;

  @IsString()
  mimeType: string;
}

export class GenerateUploadUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  @IsIn([
    "profile",
    "exam-submission",
    "publication",
    "document",
    "exam-question",
    "class-materials",
  ])
  category:
    | "profile"
    | "exam-submission"
    | "publication"
    | "document"
    | "exam-question"
    | "class-materials";

  @IsOptional()
  @IsNumber()
  expiresIn?: number;
}

export class BatchUploadUrlDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchFileDto)
  files: BatchFileDto[];

  @IsOptional()
  @IsString()
  folder?: string;

  @IsString()
  @IsIn([
    "profile",
    "exam-submission",
    "publication",
    "document",
    "exam-question",
    "class-materials",
  ])
  category:
    | "profile"
    | "exam-submission"
    | "publication"
    | "document"
    | "exam-question"
    | "class-materials";
}

@ApiTags("Storage")
@ApiBearerAuth()
@Controller("storage")
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("upload-url")
  @ApiOperation({
    summary: "Generate presigned upload URL for direct client uploads",
  })
  @ApiResponse({
    status: 201,
    description: "Upload URL generated successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid request parameters" })
  async generateUploadUrl(
    @Body() dto: GenerateUploadUrlDto,
    @Request() req: { user?: { id: string } }
  ): Promise<FileUploadResult> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw AppException.badRequest(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "User ID is required"
        );
      }

      // Validate file size (50MB limit for most files, 500MB for videos)
      const maxSize = dto.fileType.startsWith("video/")
        ? 500 * 1024 * 1024
        : 50 * 1024 * 1024;
      if (dto.fileSize > maxSize) {
        throw AppException.badRequest(
          ErrorCode.FILE_TOO_LARGE,
          `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`
        );
      }

      // Define allowed MIME types per category
      const allowedMimeTypes: Record<string, string[]> = {
        profile: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
        "exam-submission": [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ],
        "exam-question": [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/svg+xml",
        ],
        publication: [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        document: [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        "class-materials": [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-powerpoint",
          "text/plain",
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/zip",
          "video/mp4",
          "video/quicktime",
          "audio/mpeg",
          "audio/wav",
        ],
      };

      const options: UploadUrlOptions = {
        fileName: dto.fileName,
        fileType: dto.fileType,
        fileSize: dto.fileSize,
        userId,
        category: dto.category,
        expiresIn: dto.expiresIn || 300, // 5 minutes default
        maxSize,
        allowedMimeTypes: allowedMimeTypes[dto.category] || [],
      };

      return await this.storageService.generateUploadUrl(
        dto.fileName,
        dto.fileType,
        dto.category,
        options
      );
    } catch (error) {
      if (error instanceof AppException) {throw error;}
      throw AppException.badRequest(
        ErrorCode.UPLOAD_FAILED,
        `Failed to generate upload URL: ${(error as Error).message}`
      );
    }
  }

  @Post("upload-direct")
  @ApiOperation({
    summary: "Direct file upload (alternative to presigned URL)",
  })
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body("category")
    category:
      | "profile"
      | "exam-submission"
      | "publication"
      | "document"
      | "exam-question"
      | "class-materials",
    @Request() req: { user?: { id: string } }
  ) {
    try {
      if (!file) {
        throw AppException.badRequest(
          ErrorCode.UPLOAD_FAILED,
          "No file provided"
        );
      }

      const userId = req.user?.id;
      if (!userId) {
        throw AppException.badRequest(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "User ID is required"
        );
      }

      // Define allowed MIME types per category
      const allowedMimeTypes: Record<string, string[]> = {
        profile: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
        "exam-submission": [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ],
        "exam-question": [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/svg+xml",
        ],
        publication: [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        document: [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        "class-materials": [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-powerpoint",
          "text/plain",
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/zip",
          "video/mp4",
          "video/quicktime",
          "audio/mpeg",
          "audio/wav",
        ],
      };

      const options: UploadUrlOptions = {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        userId,
        category,
        maxSize: file.mimetype.startsWith("video/")
          ? 500 * 1024 * 1024
          : 50 * 1024 * 1024,
        allowedMimeTypes: allowedMimeTypes[category] || [],
      };

      return await this.storageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        category,
        options
      );
    } catch (error) {
      if (error instanceof AppException) {throw error;}
      throw AppException.badRequest(
        ErrorCode.UPLOAD_FAILED,
        `Failed to upload file: ${(error as Error).message}`
      );
    }
  }

  @Post("batch-upload-urls")
  @ApiOperation({ summary: "Generate multiple presigned upload URLs" })
  @ApiResponse({
    status: 201,
    description: "Batch upload URLs generated successfully",
  })
  async generateBatchUploadUrls(
    @Body() dto: BatchUploadUrlDto,
    @Request() req: { user?: { id: string } }
  ): Promise<FileUploadResult[]> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw AppException.badRequest(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "User ID is required"
        );
      }

      if (!dto.files || dto.files.length === 0) {
        throw AppException.badRequest(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "At least one file must be specified"
        );
      }

      if (dto.files.length > 10) {
        throw AppException.badRequest(
          ErrorCode.INVALID_INPUT,
          "Maximum 10 files per batch"
        );
      }

      return await this.storageService.generateBatchUploadUrls(
        dto.files,
        dto.folder || dto.category,
        {
          userId,
          category: dto.category,
        }
      );
    } catch (error) {
      if (error instanceof AppException) {throw error;}
      throw AppException.badRequest(
        ErrorCode.UPLOAD_FAILED,
        `Failed to generate batch upload URLs: ${(error as Error).message}`
      );
    }
  }

  /**
   * Local upload endpoint for development mode
   * This endpoint receives PUT requests from the frontend when using local storage
   * Marked as Public since it mimics S3 presigned URL behavior (no auth needed)
   */
  @Public()
  @Put("local-upload")
  @ApiOperation({
    summary: "Local file upload endpoint (development only)",
  })
  @ApiResponse({ status: 200, description: "File uploaded successfully" })
  @ApiConsumes("application/octet-stream", "image/*", "application/pdf")
  async localUpload(
    @Query("key") key: string,
    @Query("type") mimeType: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      // Only allow in local storage mode
      if (!this.storageService.isLocalStorage()) {
        return res.status(HttpStatus.FORBIDDEN).json({
          error: "Local upload not available in S3 mode",
        });
      }

      if (!key) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: "Missing key parameter",
        });
      }

      const uploadDir = this.storageService.getLocalUploadDir();
      const filePath = path.join(uploadDir, key);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Check if body is already parsed (Buffer)
      if (Buffer.isBuffer(req.body)) {
        fs.writeFileSync(filePath, req.body);
        return res.status(HttpStatus.OK).json({
          success: true,
          key,
          message: "File uploaded successfully",
        });
      }

      // Otherwise, collect the request body as a buffer (streaming)
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        const fileBuffer = Buffer.concat(chunks);
        fs.writeFileSync(filePath, fileBuffer);

        return res.status(HttpStatus.OK).json({
          success: true,
          key,
          message: "File uploaded successfully",
        });
      });
      req.on("error", (err: Error) => {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: `Upload failed: ${err.message}`,
        });
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: `Failed to upload file: ${(error as Error).message}`,
      });
    }
  }
}
