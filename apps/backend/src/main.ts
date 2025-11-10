import "../bootstrap.js";

import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  // Create the NestJS application
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // Security middleware
  app.use(helmet());
  app.use(cookieParser());

  // PERFORMANCE: Enable gzip/deflate compression for responses
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses > 1KB
      level: 6, // Balanced compression level (1-9)
    })
  );

  // Enable raw body parsing for file uploads
  app.useBodyParser("raw", {
    limit: "50mb",
    type: ["application/octet-stream", "image/*", "application/pdf"],
  });

  // CORS configuration
  // SECURITY: Restrict origins in production
  const frontendUrl = configService.get<string>(
    "FRONTEND_URL",
    "http://localhost:3000"
  );
  const allowedOrigins =
    configService.get<string>("NODE_ENV") === "production"
      ? [frontendUrl]
      : [frontendUrl, "http://localhost:3000", "http://localhost:3001"];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-Device-Id",
      "X-Fingerprint",
      "X-Correlation-Id",
      "X-CSRF-Token", // SECURITY: Add CSRF token header support
      "X-Client-Type", // For mobile/web client differentiation
      "X-Return-Tokens", // For token return in response
    ],
    // SECURITY: Expose headers needed by frontend
    exposedHeaders: ["X-Request-Id", "X-Correlation-Id"],
  });

  // Static file serving for local uploads (development mode)
  const storageType = configService.get<string>("STORAGE_TYPE");
  if (storageType !== "s3") {
    const uploadsDir = join(process.cwd(), "uploads");
    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    app.useStaticAssets(uploadsDir, {
      prefix: "/uploads/",
    });
    logger.log(`📁 Static file serving enabled for: ${uploadsDir}`);
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validateCustomDecorators: true,
    })
  );

  // Swagger documentation (development only)
  if (configService.get<string>("NODE_ENV") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("LearnUp Platform API")
      .setDescription("API documentation for LearnUp Platform")
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "Authorization",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth"
      )
      .addCookieAuth("refreshToken", {
        type: "apiKey",
        in: "cookie",
        name: "refreshToken",
      })
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
      },
    });
    logger.log("Swagger documentation available at /api/docs");
  }

  // Start the server
  const port = configService.get<number>("PORT", 5000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API documentation: http://localhost:${port}/api/docs`);
  logger.log(
    `🔧 Environment: ${configService.get<string>("NODE_ENV", "development")}`
  );
}

const bootstrapLogger = new Logger("Bootstrap");
bootstrap().catch((error) => {
  bootstrapLogger.error("Failed to start application:", error);
  process.exit(1);
});
