import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export interface UploadUrlOptions {
  fileName: string;
  fileType: string;
  fileSize: number;
  userId: string;
  category:
    | "profile"
    | "exam-submission"
    | "publication"
    | "document"
    | "exam-question"
    | "class-materials";
  expiresIn?: number; // seconds
  maxSize?: number; // bytes
  allowedMimeTypes?: string[];
}

export interface FileUploadResult {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
  key: string;
  bucket: string;
  expiresAt: Date;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private useS3: boolean;
  private localUploadDir: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.useS3 = this.configService.get<string>("STORAGE_TYPE") === "s3";
    this.region = this.configService.get<string>("AWS_REGION") || "us-east-1";
    this.bucketName =
      this.configService.get<string>("AWS_S3_BUCKET") || "learnup-storage";

    // Local storage configuration
    this.localUploadDir = path.join(process.cwd(), "uploads");
    this.baseUrl =
      this.configService.get<string>("API_BASE_URL") || "http://localhost:5000";

    // Ensure local upload directory exists
    if (!this.useS3) {
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
      this.logger.log(
        `Local storage initialized - Upload directory: ${this.localUploadDir}`
      );
    }

    if (this.useS3) {
      const accessKeyId = this.configService.get<string>("AWS_ACCESS_KEY_ID");
      const secretAccessKey = this.configService.get<string>(
        "AWS_SECRET_ACCESS_KEY"
      );
      if (!accessKeyId || !secretAccessKey) {
        this.logger.warn(
          "AWS credentials missing; S3 client will not be initialized"
        );
      } else {
        this.s3Client = new S3Client({
          region: this.region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      }
      this.logger.log(
        `S3 Storage initialized - Region: ${this.region}, Bucket: ${this.bucketName}`
      );
    } else {
      this.logger.log("S3 disabled - Using local file storage for development");
    }
  }

  /**
   * Check if using local storage
   */
  isLocalStorage(): boolean {
    return !this.useS3;
  }

  /**
   * Get local upload directory
   */
  getLocalUploadDir(): string {
    return this.localUploadDir;
  }

  /**
   * Validate file based on type, size, and content
   */
  private validateFile(
    file: Buffer,
    filename: string,
    mimeType: string,
    options?: UploadUrlOptions
  ): void {
    const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options?.allowedMimeTypes || [];

    // Check file size
    if (file.length > maxSize) {
      throw AppException.badRequest(
        ErrorCode.FILE_TOO_LARGE,
        `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    // Check MIME type if restrictions are set
    if (allowedTypes.length > 0 && !allowedTypes.includes(mimeType)) {
      throw AppException.badRequest(
        ErrorCode.INVALID_FILE_TYPE,
        `File type ${mimeType} not allowed. Allowed types: ${allowedTypes.join(", ")}`
      );
    }

    // Basic file extension validation
    const ext = path.extname(filename).toLowerCase();
    const commonMimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
      ".mp4": "video/mp4",
      ".mp3": "audio/mpeg",
    };

    const expectedMime = commonMimeTypes[ext];
    if (expectedMime && expectedMime !== mimeType) {
      this.logger.warn(
        `MIME type mismatch: file extension suggests ${expectedMime} but received ${mimeType}`
      );
    }
  }

  /**
   * Generate organized file key with proper structure
   */
  private generateFileKey(
    filename: string,
    folder: string,
    userId?: string
  ): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const uniqueFilename = `${sanitizedBaseName}-${timestamp}-${randomString}${ext}`;

    // Organized structure: folder/year/month/[userId/]filename
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    let key = `${folder}/${year}/${month}`;
    if (userId) {
      key += `/${userId}`;
    }
    key += `/${uniqueFilename}`;

    return key;
  }

  /**
   * Get CloudFront URL if CDN is configured
   */
  private getCdnUrl(key: string): string {
    const cdnDomain = this.configService.get<string>("AWS_CLOUDFRONT_DOMAIN");
    if (cdnDomain) {
      return `https://${cdnDomain}/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Generate presigned URL for direct client uploads
   */
  async generateUploadUrl(
    filename: string,
    mimeType: string,
    folder: string = "files",
    options?: UploadUrlOptions
  ): Promise<FileUploadResult> {
    try {
      // Validate parameters
      if (!filename || !mimeType) {
        throw AppException.badRequest(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Filename and MIME type are required"
        );
      }

      // Generate file key
      const key = this.generateFileKey(filename, folder, options?.userId);

      if (this.useS3) {
        const expiresIn = options?.expiresIn || 300; // 5 minutes default

        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: mimeType,
          Metadata: {
            "original-filename": filename,
            "upload-timestamp": Date.now().toString(),
            ...(options?.userId && { "user-id": options.userId }),
          },
        });

        const uploadUrl = await awsGetSignedUrl(this.s3Client, command, {
          expiresIn,
        });

        const fileUrl = this.getCdnUrl(key);

        this.logger.log(`Generated upload URL for: ${key}`);

        return {
          uploadUrl,
          fileUrl,
          fileKey: key,
          key,
          bucket: this.bucketName,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
        };
      } else {
        // Local storage mode: return local upload endpoint URL
        // Generate a unique upload token for this file
        const uploadToken = uuidv4();
        const localUploadUrl = `${this.baseUrl}/storage/local-upload/${uploadToken}`;
        const localFileUrl = `${this.baseUrl}/uploads/${key}`;

        // Store the pending upload info (in production, use Redis or similar)
        // For now, we'll pass the key in the upload token
        const encodedKey = Buffer.from(
          JSON.stringify({ key, mimeType })
        ).toString("base64url");
        const uploadUrlWithKey = `${this.baseUrl}/storage/local-upload?key=${encodeURIComponent(key)}&type=${encodeURIComponent(mimeType)}`;

        this.logger.log(`Local upload URL generated: ${uploadUrlWithKey}`);

        return {
          uploadUrl: uploadUrlWithKey,
          fileUrl: localFileUrl,
          fileKey: key,
          key,
          bucket: "local",
          expiresAt: new Date(Date.now() + 300000), // 5 minutes
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to generate upload URL: ${(error as Error).message}`,
        (error as Error).stack
      );
      if (error instanceof AppException) {throw error;}
      throw AppException.badRequest(
        ErrorCode.UPLOAD_FAILED,
        `Failed to generate upload URL: ${(error as Error).message}`
      );
    }
  }

  /**
   * Upload file to S3 or return mock URL for development
   */
  async uploadFile(
    file: Buffer,
    filename: string,
    mimeType: string,
    folder: string = "files",
    options?: UploadUrlOptions
  ): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file, filename, mimeType, options);

      // Generate organized file key
      const key = this.generateFileKey(filename, folder, options?.userId);

      if (this.useS3) {
        // Upload to S3
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file,
          ContentType: mimeType,
          Metadata: {
            "original-filename": filename,
            "upload-timestamp": Date.now().toString(),
            ...(options?.userId && { "user-id": options.userId }),
          },
          // Set cache control for better CDN performance
          CacheControl: "max-age=31536000", // 1 year
        });

        await this.s3Client.send(command);

        const url = this.getCdnUrl(key);

        this.logger.log(`File uploaded to S3: ${key}`);

        return {
          url,
          key,
          bucket: this.bucketName,
        };
      } else {
        // Local storage mode: save to local file system
        const filePath = path.join(this.localUploadDir, key);

        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Write file
        fs.writeFileSync(filePath, file);

        const localUrl = `${this.baseUrl}/uploads/${key}`;
        this.logger.log(`Local upload saved: ${filePath}`);

        return {
          url: localUrl,
          key,
          bucket: "local",
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to upload file: ${(error as Error).message}`,
        (error as Error).stack
      );
      if (error instanceof AppException) {throw error;}
      throw AppException.badRequest(
        ErrorCode.UPLOAD_FAILED,
        `File upload failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(keyOrUrl: string): Promise<void> {
    try {
      // Extract key from URL if full URL is provided
      let key = keyOrUrl;
      if (keyOrUrl.includes("amazonaws.com")) {
        const urlParts = keyOrUrl.split(".amazonaws.com/");
        key = urlParts[1] || keyOrUrl;
      }

      if (this.useS3) {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        await this.s3Client.send(command);
        this.logger.log(`File deleted from S3: ${key}`);
      } else {
        // Local storage mode: delete local file
        const filePath = path.join(this.localUploadDir, key);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          this.logger.log(`Local file deleted: ${filePath}`);
        } else {
          this.logger.log(`Local file not found: ${filePath}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete file: ${(error as Error).message}`,
        (error as Error).stack
      );
      // Don't throw error for delete operations
    }
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(
    keyOrUrl: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      // Extract key from URL if full URL is provided
      let key = keyOrUrl;
      if (keyOrUrl.includes("amazonaws.com")) {
        const urlParts = keyOrUrl.split(".amazonaws.com/");
        key = urlParts[1] || keyOrUrl;
      }

      if (this.useS3) {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        const signedUrl = await awsGetSignedUrl(this.s3Client, command, {
          expiresIn,
        });

        return signedUrl;
      } else {
        // Development mode: return original URL
        return keyOrUrl;
      }
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw AppException.badRequest(
        ErrorCode.STORAGE_ERROR,
        `Failed to generate download URL: ${(error as Error).message}`
      );
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; filename: string; mimeType: string }>,
    folder: string = "files",
    options?: UploadUrlOptions
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(
        file.buffer,
        file.filename,
        file.mimeType,
        folder,
        options
      )
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(keyOrUrl: string): Promise<boolean> {
    try {
      // Extract key from URL if full URL is provided
      let key = keyOrUrl;
      if (keyOrUrl.includes("amazonaws.com")) {
        const urlParts = keyOrUrl.split(".amazonaws.com/");
        key = urlParts[1] || keyOrUrl;
      }

      if (this.useS3) {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        await this.s3Client.send(command);
        return true;
      } else {
        // Development mode: assume file exists
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Copy file within S3
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<string> {
    try {
      if (this.useS3) {
        const { CopyObjectCommand } = await import("@aws-sdk/client-s3");

        const command = new CopyObjectCommand({
          Bucket: this.bucketName,
          CopySource: `${this.bucketName}/${sourceKey}`,
          Key: destinationKey,
        });

        await this.s3Client.send(command);

        const url = this.getCdnUrl(destinationKey);
        this.logger.log(`File copied from ${sourceKey} to ${destinationKey}`);

        return url;
      } else {
        // Development mode: return mock URL
        const mockUrl = `https://storage.example.com/${destinationKey}`;
        this.logger.log(`Mock copy: ${sourceKey} to ${destinationKey}`);
        return mockUrl;
      }
    } catch (error) {
      this.logger.error(
        `Failed to copy file: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw AppException.badRequest(
        ErrorCode.STORAGE_ERROR,
        `File copy failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generate batch upload URLs for multiple files
   */
  async generateBatchUploadUrls(
    files: Array<{ filename: string; mimeType: string }>,
    folder: string = "files",
    options?: Omit<UploadUrlOptions, "fileName" | "fileType" | "fileSize">
  ): Promise<FileUploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.generateUploadUrl(file.filename, file.mimeType, folder, {
        ...options,
        fileName: file.filename,
        fileType: file.mimeType,
        fileSize: 0, // Size unknown for presigned URLs
      } as UploadUrlOptions)
    );

    return Promise.all(uploadPromises);
  }
}
