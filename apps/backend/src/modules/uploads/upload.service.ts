import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import { promises as fsPromises } from "fs";

export interface SaveFileOptions {
  examId: string;
  gradeId?: string;
  questionId?: string;
  fileName?: string;
}

export interface UploadResponse {
  imageUrl: string;
  fileName: string;
  savedPath: string;
}

/**
 * UPLOAD SERVICE
 *
 * Handles file uploads for the exam system.
 * Supports local filesystem storage with built-in extensibility for S3.
 *
 * IMPORTANT DESIGN DECISIONS:
 * - Only accepts image files (jpg, jpeg, png, webp)
 * - Validates file size against MAX_FILE_SIZE env variable (default: 10MB)
 * - Stores files in: uploads/exams/{examId}/questions/{questionId}/
 * - Returns relative paths that work with static file serving
 * - Respects STORAGE_TYPE env variable (local | s3)
 *
 * FUTURE: S3 support can be added by implementing the s3Upload method
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  // Allowed MIME types for images
  private readonly ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  // Allowed file extensions
  private readonly ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

  // Default max file size: 10MB
  private readonly DEFAULT_MAX_FILE_SIZE = 10485760;

  constructor(private configService: ConfigService) {}

  /**
   * Save a file to storage (local or S3 based on STORAGE_TYPE)
   *
   * @param fileBuffer - File content as Buffer
   * @param originalFileName - Original file name from upload
   * @param mimeType - MIME type of the file
   * @param options - Save options (examId, questionId, etc.)
   * @returns UploadResponse with imageUrl and saved path
   */
  async saveFile(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    options: SaveFileOptions
  ): Promise<UploadResponse> {
    // Validate MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.ALLOWED_EXTENSIONS.join(", ")}`
      );
    }

    // Validate file size
    const maxFileSize = this.getMaxFileSize();
    if (fileBuffer.length > maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.formatFileSize(maxFileSize)}`
      );
    }

    // Get storage type
    const storageType = this.configService.get<string>("STORAGE_TYPE", "local");

    if (storageType === "s3") {
      return this.saveFileToS3(fileBuffer, originalFileName, mimeType, options);
    } else {
      return this.saveFileLocally(
        fileBuffer,
        originalFileName,
        mimeType,
        options
      );
    }
  }

  /**
   * Save file to local filesystem
   * Creates directory structure: uploads/exams/{examId}/questions/{questionId}/
   *
   * @returns Relative path for serving via /uploads static route
   */
  private async saveFileLocally(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    options: SaveFileOptions
  ): Promise<UploadResponse> {
    const uploadPath = this.configService.get<string>(
      "UPLOAD_PATH",
      "./uploads"
    );

    // Build storage directory path: uploads/exams/{examId}/questions/{questionId}/
    const examDir = path.join(uploadPath, "exams", options.examId);
    const questionDir = path.join(
      examDir,
      "questions",
      options.questionId || "temp"
    );

    try {
      // Ensure directories exist
      await fsPromises.mkdir(questionDir, { recursive: true });

      // Generate safe file name (preserve extension, sanitize name)
      const extension = this.getFileExtension(mimeType);
      const timestamp = Date.now();
      const sanitizedName = `image-${timestamp}${extension}`;
      const fullPath = path.join(questionDir, sanitizedName);

      // Save file to disk
      await fsPromises.writeFile(fullPath, fileBuffer);

      // Construct relative URL path for serving
      // Path format: /uploads/exams/{examId}/questions/{questionId}/image-timestamp.ext
      const relativeUrl = `/uploads/exams/${options.examId}/questions/${options.questionId || "temp"}/${sanitizedName}`;

      this.logger.log(
        `File saved locally: ${relativeUrl} (${this.formatFileSize(fileBuffer.length)})`
      );

      return {
        imageUrl: relativeUrl,
        fileName: sanitizedName,
        savedPath: fullPath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save file locally: ${errorMessage}`);
      throw new BadRequestException(
        `Failed to save file: ${errorMessage || "Unknown error"}`
      );
    }
  }

  /**
   * Save file to S3 (placeholder for future implementation)
   *
   * When implemented, should:
   * - Use AWS SDK to upload to S3 bucket
   * - Respect AWS_REGION, AWS_S3_BUCKET from env
   * - Return S3 URL that can be accessed publicly
   */
  private async saveFileToS3(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    options: SaveFileOptions
  ): Promise<UploadResponse> {
    // TODO: Implement S3 upload when needed
    // For now, fall back to local storage
    this.logger.warn(
      "S3 storage configured but not implemented. Falling back to local storage."
    );
    return this.saveFileLocally(
      fileBuffer,
      originalFileName,
      mimeType,
      options
    );
  }

  /**
   * Delete a file from storage
   *
   * @param imageUrl - The relative URL returned by saveFile
   */
  async deleteFile(imageUrl: string): Promise<void> {
    const storageType = this.configService.get<string>("STORAGE_TYPE", "local");

    if (storageType === "s3") {
      // TODO: Implement S3 deletion
      this.logger.warn("S3 deletion not yet implemented");
      return;
    }

    // Local deletion
    try {
      const uploadPath = this.configService.get<string>(
        "UPLOAD_PATH",
        "./uploads"
      );
      // Convert URL path back to filesystem path
      const filePath = path.join(
        uploadPath,
        imageUrl.replace(/^\/uploads\//, "")
      );
      await fsPromises.unlink(filePath);
      this.logger.log(`File deleted: ${imageUrl}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to delete file ${imageUrl}: ${errorMessage}`);
      // Don't throw - file deletion is best-effort
    }
  }

  /**
   * Get maximum allowed file size in bytes
   * Reads from MAX_FILE_SIZE env variable (default: 10MB)
   */
  private getMaxFileSize(): number {
    const maxSizeMb = this.configService.get<number>(
      "MAX_FILE_SIZE",
      this.DEFAULT_MAX_FILE_SIZE
    );
    // If it's already in bytes (larger value), use as-is
    // Otherwise assume it's in MB and convert to bytes
    if (maxSizeMb > 100) {
      return maxSizeMb;
    }
    return maxSizeMb * 1024 * 1024;
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    return mimeToExt[mimeType] || ".jpg";
  }

  /**
   * Format bytes to human-readable file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}
