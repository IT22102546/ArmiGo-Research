import { UserRole } from "@prisma/client";

/**
 * Token payload structure
 */
export interface TokenPayload {
  sub: string; // user id
  email: string | null;
  role: UserRole;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Device information for security tracking
 */
export interface DeviceInfo {
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Token pair response
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication response structure
 */
export interface AuthResponse {
  user: {
    id: string;
    phone: string;
    email?: string | null;
    firstName: string;
    lastName: string;
    role: string;
    dateOfBirth?: string | Date | null;
    status?: string | null;
    registrationNumber?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * User data for token generation
 */
export interface TokenUser {
  id: string;
  email: string | null;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

/**
 * Security event logging structure
 */
export interface SecurityEvent {
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, unknown>;
}

/**
 * OTP verification result
 */
export interface OtpVerificationResult {
  success: boolean;
  message: string;
  tempToken?: string;
  tempUserId?: string;
}

/**
 * Password reset token data
 */
export interface PasswordResetToken {
  userId: string;
  token: string;
  expiresAt: Date;
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  valid: boolean;
  userId?: string;
  reason?: string;
}
