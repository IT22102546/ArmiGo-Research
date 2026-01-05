/** Application configuration. */

export const APP_CONFIG = {
  name: "LearnApp",
  version: "1.0.0",
  description: "Educational Management Platform",
  defaultLocale: "en",
  supportedLocales: ["en", "si", "ta"],
} as const;

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;
