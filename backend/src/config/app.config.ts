import { registerAs } from "@nestjs/config";

export const AppConfig = registerAs("app", () => ({
  port: parseInt(process.env.PORT, 10) || 5000,
  environment: process.env.NODE_ENV || "development",
  apiUrl: process.env.API_URL || "http://localhost:5000",
  webUrl: process.env.WEB_URL || "http://localhost:3000",
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:19006",
    "capacitor://localhost",
    "ionic://localhost",
  ],
}));
