import { Prisma } from "@prisma/client";
import { AppException } from "./app-exception";
import { ErrorCode } from "./error-codes.enum";

/**
 * Maps Prisma errors to standardized AppException instances
 * Provides user-friendly error messages and appropriate HTTP status codes
 */
export function mapPrismaError(error: any): AppException {
  // Handle Prisma Client Known Request Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || "field";
        const message = `A record with this ${field} already exists.`;
        return AppException.conflict(ErrorCode.PHONE_ALREADY_EXISTS, message, {
          field,
          constraint: "unique",
        });
      }

      case "P2025": {
        // Record not found
        const cause = error.meta?.cause as string | undefined;
        const message = cause || "The requested record was not found.";
        return AppException.notFound(ErrorCode.RESOURCE_NOT_FOUND, message);
      }

      case "P2003": {
        // Foreign key constraint violation
        const field = error.meta?.field_name as string | undefined;
        const message = field
          ? `Invalid reference: ${field} does not exist.`
          : "Referenced record does not exist.";
        return AppException.badRequest(ErrorCode.VALIDATION_FAILED, message, {
          field,
          constraint: "foreign_key",
        });
      }

      case "P2014": {
        // Required relation violation
        const relation = error.meta?.relation_name as string | undefined;
        const message = relation
          ? `Cannot modify record: ${relation} is required.`
          : "Cannot modify record due to required relation.";
        return AppException.badRequest(
          ErrorCode.BUSINESS_RULE_VIOLATION,
          message,
          {
            relation,
          }
        );
      }

      case "P2016": {
        // Query interpretation error
        return AppException.badRequest(
          ErrorCode.VALIDATION_ERROR,
          "Invalid query parameters provided.",
          { details: error.message }
        );
      }

      case "P2021": {
        // Table does not exist
        const table = error.meta?.table as string | undefined;
        return AppException.internal(
          ErrorCode.DATABASE_ERROR,
          `Database schema error: Table ${table || "unknown"} does not exist.`,
          { table }
        );
      }

      case "P2022": {
        // Column does not exist
        const column = error.meta?.column as string | undefined;
        return AppException.internal(
          ErrorCode.DATABASE_ERROR,
          `Database schema error: Column ${column || "unknown"} does not exist.`,
          { column }
        );
      }

      default: {
        // Unknown Prisma error
        return AppException.internal(
          ErrorCode.DATABASE_ERROR,
          "A database error occurred.",
          {
            code: error.code,
            meta: error.meta,
          }
        );
      }
    }
  }

  // Handle Prisma Client Validation Errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return AppException.badRequest(
      ErrorCode.VALIDATION_ERROR,
      "Invalid data provided for database operation.",
      { details: error.message }
    );
  }

  // Handle Prisma Client Initialization Errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return AppException.internal(
      ErrorCode.TRANSACTION_FAILED,
      "Database connection failed.",
      {
        errorCode: error.errorCode,
      }
    );
  }

  // Handle Prisma Client Rust Panic Errors
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return AppException.internal(
      ErrorCode.SYS_9001,
      "A critical database engine error occurred.",
      { message: error.message }
    );
  }

  // Generic database error fallback
  if (error.name?.includes("Prisma") || error.code?.startsWith("P")) {
    return AppException.internal(
      ErrorCode.DATABASE_ERROR,
      "A database error occurred.",
      {
        name: error.name,
        code: error.code,
        message: error.message,
      }
    );
  }

  // Not a Prisma error, rethrow
  throw error;
}

/**
 * Wraps a database operation with Prisma error mapping
 * Usage: await withPrismaErrorHandling(() => prisma.user.create(...))
 */
export async function withPrismaErrorHandling<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw mapPrismaError(error);
  }
}
