import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as path from "path";
import * as crypto from "crypto";

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private useS3: boolean;

  constructor(private configService: ConfigService) {
    this.useS3 = this.configService.get<string>("STORAGE_TYPE") === "s3";
    this.region = this.configService.get<string>("AWS_REGION") || "us-east-1";
    this.bucketName =
      this.configService.get<string>("AWS_S3_BUCKET") || "learnup-storage";

    if (this.useS3) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.configService.get<string>("AWS_ACCESS_KEY_ID"),
          secretAccessKey: this.configService.get<string>(
            "AWS_SECRET_ACCESS_KEY"
          ),
        },
      });
      this.logger.log(
        `S3 Storage initialized - Region: ${this.region}, Bucket: ${this.bucketName}`
      );
    } else {
      this.logger.warn("S3 disabled - Using mock storage for development");
    }
  }

  /**
   * Upload file to S3 or return mock URL for development
   */
  async uploadFile(
    file: Buffer,
    filename: string,
    mimeType: string,
    folder: string = "files"
  ): Promise<UploadResult> {
    try {
      // Generate unique filename to prevent collisions
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString("hex");
      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
      const uniqueFilename = `${sanitizedBaseName}-${timestamp}-${randomString}${ext}`;
      const key = `${folder}/${uniqueFilename}`;

      if (this.useS3) {
        // Upload to S3
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file,
          ContentType: mimeType,
          // Optional: Set ACL (remove if bucket has BlockPublicAcls enabled)
          // ACL: 'public-read',
        });

        await this.s3Client.send(command);

        const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

        this.logger.log(`File uploaded to S3: ${key}`);

        return {
          url,
          key,
          bucket: this.bucketName,
        };
      } else {
        // Development mode: return mock URL
        const mockUrl = `https://storage.example.com/${key}`;
        this.logger.log(`Mock upload: ${mockUrl}`);

        return {
          url: mockUrl,
          key,
          bucket: "mock-bucket",
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to upload file: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(
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
        this.logger.log(`Mock delete: ${key}`);
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
      throw new BadRequestException(
        `Failed to generate download URL: ${(error as Error).message}`
      );
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; filename: string; mimeType: string }>,
    folder: string = "files"
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file.buffer, file.filename, file.mimeType, folder)
    );

    return Promise.all(uploadPromises);
  }
}
