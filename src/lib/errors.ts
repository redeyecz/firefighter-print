/**
 * Base error types for the application
 * Using Effect's Data module for tagged errors
 */

import { Data } from "effect";

/**
 * Base application error
 */
export class AppError extends Data.TaggedError("AppError")<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Configuration errors
 */
export class ConfigError extends Data.TaggedError("ConfigError")<{
  message: string;
  field?: string;
}> {}

/**
 * Email service errors
 */
export class EmailError extends Data.TaggedError("EmailError")<{
  message: string;
  cause?: unknown;
}> {}

/**
 * GPS extraction errors
 */
export class GPSError extends Data.TaggedError("GPSError")<{
  message: string;
  coordinates?: string;
}> {}

/**
 * Map service errors
 */
export class MapError extends Data.TaggedError("MapError")<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Print service errors
 */
export class PrintError extends Data.TaggedError("PrintError")<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Database errors
 */
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Document assembly errors
 */
export class DocumentError extends Data.TaggedError("DocumentError")<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Error codes for support and debugging
 */
export enum ErrorCode {
  // Email Service Errors
  EMAIL_CONNECTION_FAILED = "EMAIL_001",
  EMAIL_AUTHENTICATION_FAILED = "EMAIL_002",
  EMAIL_FETCH_FAILED = "EMAIL_003",

  // GPS Extraction Errors
  GPS_NOT_FOUND = "GPS_001",
  GPS_INVALID_FORMAT = "GPS_002",

  // Map Service Errors
  MAP_SERVICE_UNAVAILABLE = "MAP_001",
  MAP_API_KEY_INVALID = "MAP_002",
  MAP_GENERATION_FAILED = "MAP_003",
  MAP_TIMEOUT = "MAP_004",

  // Printer Errors
  PRINTER_UNREACHABLE = "PRINT_001",
  PRINTER_BUSY = "PRINT_002",
  PRINTER_OUT_OF_PAPER = "PRINT_003",
  PRINT_JOB_FAILED = "PRINT_004",

  // Database Errors
  DATABASE_CONNECTION_FAILED = "DB_001",
  DATABASE_QUERY_FAILED = "DB_002",

  // Generic Errors
  UNKNOWN_ERROR = "SYS_001",
  CONFIG_ERROR = "SYS_002",
  DOCUMENT_ERROR = "SYS_003",
}

/**
 * Detailed error information with user and technical messages
 */
export interface ErrorMessage {
  userMessage: string;
  technicalMessage: string;
  errorCode: string;
}

/**
 * Helper to convert errors to user-friendly messages
 */
export const toUserMessage = (
  error:
    | AppError
    | ConfigError
    | EmailError
    | GPSError
    | MapError
    | PrintError
    | DatabaseError
    | DocumentError
): string => {
  switch (error._tag) {
    case "EmailError":
      if (error.message.toLowerCase().includes("connection")) {
        return "Cannot connect to email server";
      }
      if (error.message.toLowerCase().includes("auth")) {
        return "Email authentication failed";
      }
      return "Failed to retrieve emails";
    case "GPSError":
      return "GPS coordinates not found in email";
    case "MapError":
      if (
        error.message.toLowerCase().includes("503") ||
        error.message.toLowerCase().includes("unavailable")
      ) {
        return "Map could not be generated: Mapping service is unavailable";
      }
      if (
        error.message.toLowerCase().includes("api key") ||
        error.message.toLowerCase().includes("unauthorized")
      ) {
        return "Map could not be generated: Invalid API key";
      }
      if (error.message.toLowerCase().includes("timeout")) {
        return "Map could not be generated: Request timed out";
      }
      return "Map could not be generated: Generation failed";
    case "PrintError":
      if (error.message.toLowerCase().includes("unreachable")) {
        return "Printing failed: Printer is unreachable";
      }
      if (error.message.toLowerCase().includes("busy")) {
        return "Printing failed: Printer is busy";
      }
      if (error.message.toLowerCase().includes("paper")) {
        return "Printing failed: Printer is out of paper";
      }
      return "Printing failed: Job could not be completed";
    case "ConfigError":
      return `Configuration error: ${error.message}`;
    case "DatabaseError":
      return "Database connection failed";
    case "DocumentError":
      return "Document could not be assembled";
    default:
      return "An unexpected error occurred";
  }
};

/**
 * Helper to get error code from error object
 */
export const toErrorCode = (
  error:
    | AppError
    | ConfigError
    | EmailError
    | GPSError
    | MapError
    | PrintError
    | DatabaseError
    | DocumentError
): ErrorCode => {
  const message = error.message.toLowerCase();

  switch (error._tag) {
    case "EmailError":
      if (message.includes("connection")) return ErrorCode.EMAIL_CONNECTION_FAILED;
      if (message.includes("auth")) return ErrorCode.EMAIL_AUTHENTICATION_FAILED;
      return ErrorCode.EMAIL_FETCH_FAILED;
    case "GPSError":
      if (message.includes("invalid")) return ErrorCode.GPS_INVALID_FORMAT;
      return ErrorCode.GPS_NOT_FOUND;
    case "MapError":
      if (message.includes("503") || message.includes("unavailable"))
        return ErrorCode.MAP_SERVICE_UNAVAILABLE;
      if (message.includes("api key") || message.includes("unauthorized"))
        return ErrorCode.MAP_API_KEY_INVALID;
      if (message.includes("timeout")) return ErrorCode.MAP_TIMEOUT;
      return ErrorCode.MAP_GENERATION_FAILED;
    case "PrintError":
      if (message.includes("unreachable")) return ErrorCode.PRINTER_UNREACHABLE;
      if (message.includes("busy")) return ErrorCode.PRINTER_BUSY;
      if (message.includes("paper")) return ErrorCode.PRINTER_OUT_OF_PAPER;
      return ErrorCode.PRINT_JOB_FAILED;
    case "DatabaseError":
      if (message.includes("connection")) return ErrorCode.DATABASE_CONNECTION_FAILED;
      return ErrorCode.DATABASE_QUERY_FAILED;
    case "ConfigError":
      return ErrorCode.CONFIG_ERROR;
    case "DocumentError":
      return ErrorCode.DOCUMENT_ERROR;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
};

/**
 * Converts error to detailed error message with user and technical info
 */
export const toErrorMessage = (
  error:
    | AppError
    | ConfigError
    | EmailError
    | GPSError
    | MapError
    | PrintError
    | DatabaseError
    | DocumentError
): ErrorMessage => {
  return {
    userMessage: toUserMessage(error),
    technicalMessage: error.message,
    errorCode: toErrorCode(error),
  };
};

/**
 * Logs error with technical details
 */
export const logError = (error: unknown, context?: string): void => {
  const prefix = context ? `[${context}]` : "";

  if (
    error instanceof AppError ||
    error instanceof ConfigError ||
    error instanceof EmailError ||
    error instanceof GPSError ||
    error instanceof MapError ||
    error instanceof PrintError ||
    error instanceof DatabaseError ||
    error instanceof DocumentError
  ) {
    const errorMsg = toErrorMessage(error);
    console.error(`${prefix} Error ${errorMsg.errorCode}:`, errorMsg.technicalMessage);
  } else if (error instanceof Error) {
    console.error(`${prefix} Error:`, error.message, error.stack);
  } else {
    console.error(`${prefix} Unknown error:`, error);
  }
};

/**
 * Creates a standardized error response for API routes
 */
export const createErrorResponse = (error: unknown) => {
  if (
    error instanceof AppError ||
    error instanceof ConfigError ||
    error instanceof EmailError ||
    error instanceof GPSError ||
    error instanceof MapError ||
    error instanceof PrintError ||
    error instanceof DatabaseError ||
    error instanceof DocumentError
  ) {
    const errorMsg = toErrorMessage(error);
    logError(error);

    return {
      error: errorMsg.userMessage,
      code: errorMsg.errorCode,
      // Only include technical details in development
      ...(process.env.NODE_ENV === "development" && {
        details: errorMsg.technicalMessage,
      }),
    };
  }

  // Handle unknown errors
  logError(error);
  return {
    error: "An unexpected error occurred",
    code: ErrorCode.UNKNOWN_ERROR,
    ...(process.env.NODE_ENV === "development" && {
      details: String(error),
    }),
  };
};
