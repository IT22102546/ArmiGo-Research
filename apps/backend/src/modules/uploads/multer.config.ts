import { ConfigService } from "@nestjs/config";
import * as multer from "multer";

/**
 * MULTER CONFIGURATION
 *
 * Configures multer middleware for file uploads.
 * - MAX_FILE_SIZE validated by middleware
 * - MIME type validation before processing
 * - Files stored in memory buffer (not disk) for immediate handling
 *
 * IMPORTANT: This is a memory storage - files are held in RAM briefly
 * before being persisted by UploadService.
 */
export const createMulterConfig = (configService: ConfigService): any => {
  // Get max file size from env (default 10MB)
  const maxFileSizeMb = configService.get<number>("MAX_FILE_SIZE", 10);
  const maxFileSize =
    maxFileSizeMb > 100 ? maxFileSizeMb : maxFileSizeMb * 1024 * 1024; // Convert to bytes if needed

  return {
    // Store files in memory buffer for processing
    storage: multer.memoryStorage(),

    // File size limit
    limits: {
      fileSize: maxFileSize,
      files: 1, // Max 1 file per request
    },

    // MIME type validation
    fileFilter: (req: any, file: any, callback: any) => {
      const ALLOWED_MIME_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(
          new Error(
            `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
          ),
          false
        );
      }
    },
  };
};
