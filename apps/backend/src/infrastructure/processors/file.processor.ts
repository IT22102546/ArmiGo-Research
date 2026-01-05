import { Process, Processor } from "@nestjs/bull";
import { Logger, Injectable } from "@nestjs/common";
import { Job } from "bull";
import { FileProcessingJobData } from "../../shared/services/queue.service";
import { StorageService } from "../storage/storage.service";
import { PrismaService } from "../../database/prisma.service";

@Processor("file-processing")
@Injectable()
export class FileProcessor {
  private readonly logger = new Logger(FileProcessor.name);

  constructor(
    private storageService: StorageService,
    private prisma: PrismaService
  ) {}

  @Process("process-file")
  async handleFileProcessing(job: Job<FileProcessingJobData>) {
    this.logger.log(`Processing file job ${job.id} for ${job.data.fileUrl}`);

    try {
      switch (job.data.fileType) {
        case "exam_submission":
          await this.processExamSubmission(job.data);
          break;
        case "profile_image":
          await this.processProfileImage(job.data);
          break;
        case "publication_cover":
          await this.processPublicationCover(job.data);
          break;
        default:
          throw new Error(`Unknown file type: ${job.data.fileType}`);
      }

      this.logger.log(`File processed successfully: ${job.data.fileUrl}`);
      return { success: true, fileUrl: job.data.fileUrl };
    } catch (error) {
      this.logger.error(`Failed to process file ${job.data.fileUrl}:`, error);
      throw error;
    }
  }

  private async processExamSubmission(
    data: FileProcessingJobData
  ): Promise<void> {
    this.logger.log(`Processing exam submission file:
      URL: ${data.fileUrl}
      User ID: ${data.userId}
      Metadata: ${JSON.stringify(data.metadata || {})}`);

    // Validate file exists and is accessible
    const fileExists = await this.validateFileAccess(data.fileUrl);
    if (!fileExists) {
      this.logger.error(`File not accessible: ${data.fileUrl}`);
      return;
    }

    // Update exam attempt with processing status if attemptId is provided
    if (data.metadata?.attemptId) {
      await this.prisma.examAttempt.update({
        where: { id: data.metadata.attemptId },
        data: {
          uploadedAt: new Date(),
        },
      });
    }

    this.logger.log(`Exam submission file processed: ${data.fileUrl}`);
  }

  private async processProfileImage(
    data: FileProcessingJobData
  ): Promise<void> {
    this.logger.log(`Processing profile image:
      URL: ${data.fileUrl}
      User ID: ${data.userId}`);

    // Validate file
    const fileExists = await this.validateFileAccess(data.fileUrl);
    if (!fileExists) {
      this.logger.error(`Profile image not accessible: ${data.fileUrl}`);
      return;
    }

    // Update user profile with the processed image URL
    // In a production environment with Sharp installed, we would:
    // 1. Download the image
    // 2. Resize to standard dimensions (e.g., 200x200 for avatar, 800x800 for profile)
    // 3. Create thumbnail (50x50)
    // 4. Optimize/compress
    // 5. Upload processed versions
    // 6. Update user record with new URLs

    // For now, just update the timestamp to indicate processing
    await this.prisma.user.update({
      where: { id: data.userId },
      data: {
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Profile image processed for user ${data.userId}`);
  }

  private async processPublicationCover(
    data: FileProcessingJobData
  ): Promise<void> {
    this.logger.log(`Processing publication cover:
      URL: ${data.fileUrl}
      User ID: ${data.userId}`);

    // Validate file
    const fileExists = await this.validateFileAccess(data.fileUrl);
    if (!fileExists) {
      this.logger.error(`Publication cover not accessible: ${data.fileUrl}`);
      return;
    }

    // In a production environment with Sharp installed, we would:
    // 1. Download the cover image
    // 2. Resize to standard cover dimensions (e.g., 600x800)
    // 3. Create thumbnail (150x200)
    // 4. Convert to WebP for web optimization
    // 5. Upload processed versions
    // 6. Update publication record with new URLs

    // Update publication if ID provided
    if (data.metadata?.publicationId) {
      await this.prisma.publication.update({
        where: { id: data.metadata.publicationId },
        data: {
          updatedAt: new Date(),
        },
      });
    }

    this.logger.log(`Publication cover processed: ${data.fileUrl}`);
  }

  /**
   * Validate that a file is accessible
   */
  private async validateFileAccess(fileUrl: string): Promise<boolean> {
    try {
      // For S3 URLs, we could use a HEAD request to check accessibility
      // For now, we assume the file exists if it has a valid URL format
      return Boolean(
        fileUrl && (fileUrl.startsWith("http") || fileUrl.startsWith("s3://"))
      );
    } catch (error) {
      this.logger.error(`File validation failed: ${error}`);
      return false;
    }
  }
}
