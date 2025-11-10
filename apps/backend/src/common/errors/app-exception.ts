import { HttpException, HttpStatus } from "@nestjs/common";
import { ErrorCode, ERROR_MESSAGES } from "./error-codes.enum";

/**
 * Custom application exception with structured error information
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly context?: Record<string, any>,
    statusCode?: HttpStatus
  ) {
    const errorMessage = message || ERROR_MESSAGES[code] || "An error occurred";
    const status = statusCode || AppException.getStatusFromCode(code);

    super(
      {
        code,
        message: errorMessage,
        ...(context && { context }),
      },
      status
    );
  }

  /**
   * Map error codes to HTTP status codes
   */
  private static getStatusFromCode(code: ErrorCode): HttpStatus {
    const codePrefix = code.split("_")[0];

    switch (codePrefix) {
      case "AUTH":
        if (
          code === ErrorCode.UNAUTHORIZED ||
          code === ErrorCode.TOKEN_EXPIRED ||
          code === ErrorCode.TOKEN_INVALID
        ) {
          return HttpStatus.UNAUTHORIZED;
        }
        if (code === ErrorCode.FORBIDDEN) {
          return HttpStatus.FORBIDDEN;
        }
        return HttpStatus.BAD_REQUEST;

      case "USER":
        if (code === ErrorCode.USER_NOT_FOUND) {
          return HttpStatus.NOT_FOUND;
        }
        if (
          code === ErrorCode.USER_ALREADY_EXISTS ||
          code === ErrorCode.EMAIL_ALREADY_EXISTS ||
          code === ErrorCode.PHONE_ALREADY_EXISTS
        ) {
          return HttpStatus.CONFLICT;
        }
        return HttpStatus.BAD_REQUEST;

      case "VAL":
        return HttpStatus.BAD_REQUEST;

      case "RES":
        return HttpStatus.NOT_FOUND;

      case "BIZ":
        if (
          code === ErrorCode.ENROLLMENT_FULL ||
          code === ErrorCode.ENROLLMENT_CLOSED
        ) {
          return HttpStatus.CONFLICT;
        }
        return HttpStatus.BAD_REQUEST;

      case "FILE":
        if (code === ErrorCode.FILE_NOT_FOUND) {
          return HttpStatus.NOT_FOUND;
        }
        if (code === ErrorCode.FILE_TOO_LARGE) {
          return HttpStatus.PAYLOAD_TOO_LARGE;
        }
        return HttpStatus.BAD_REQUEST;

      case "DB":
        if (code === ErrorCode.DUPLICATE_ENTRY) {
          return HttpStatus.CONFLICT;
        }
        return HttpStatus.INTERNAL_SERVER_ERROR;

      case "EXT":
        return HttpStatus.BAD_GATEWAY;

      case "RATE":
        return HttpStatus.TOO_MANY_REQUESTS;

      case "SYS":
        if (
          code === ErrorCode.SERVICE_UNAVAILABLE ||
          code === ErrorCode.MAINTENANCE_MODE
        ) {
          return HttpStatus.SERVICE_UNAVAILABLE;
        }
        return HttpStatus.INTERNAL_SERVER_ERROR;

      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Factory methods for common errors
   */
  static unauthorized(
    message?: string,
    context?: Record<string, any>
  ): AppException {
    return new AppException(ErrorCode.UNAUTHORIZED, message, context);
  }

  static forbidden(
    codeOrMessage?: ErrorCode | string,
    messageOrContext?: string | Record<string, any>,
    context?: Record<string, any>
  ): AppException {
    // Overload: forbidden() or forbidden("message") or forbidden("message", context)
    if (codeOrMessage === undefined || typeof codeOrMessage === "string") {
      return new AppException(
        ErrorCode.FORBIDDEN,
        codeOrMessage,
        messageOrContext as Record<string, any> | undefined
      );
    }
    // Overload: forbidden(ErrorCode.X) or forbidden(ErrorCode.X, "message") or forbidden(ErrorCode.X, "message", context)
    return new AppException(
      codeOrMessage,
      messageOrContext as string | undefined,
      context,
      HttpStatus.FORBIDDEN
    );
  }

  static notFound(
    code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND,
    message?: string,
    context?: Record<string, any>
  ): AppException {
    return new AppException(code, message, context);
  }

  static badRequest(
    code: ErrorCode = ErrorCode.INVALID_INPUT,
    message?: string,
    context?: Record<string, any>
  ): AppException {
    return new AppException(code, message, context);
  }

  static conflict(
    code: ErrorCode = ErrorCode.DUPLICATE_ENTRY,
    message?: string,
    context?: Record<string, any>
  ): AppException {
    return new AppException(code, message, context);
  }

  static validationError(
    message?: string,
    context?: Record<string, any>
  ): AppException {
    return new AppException(ErrorCode.VALIDATION_ERROR, message, context);
  }

  static internal(
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    message?: string,
    context?: Record<string, any>
  ): AppException {
    return new AppException(code, message, context);
  }
}
