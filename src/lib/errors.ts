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
      return `Email service error: ${error.message}`;
    case "GPSError":
      return `GPS coordinates not found in email`;
    case "MapError":
      return `Map could not be generated: ${error.message}`;
    case "PrintError":
      return `Printing failed: ${error.message}`;
    case "ConfigError":
      return `Configuration error: ${error.message}`;
    case "DatabaseError":
      return `Database error: ${error.message}`;
    case "DocumentError":
      return `Document assembly error: ${error.message}`;
    default:
      return `An error occurred: ${error.message}`;
  }
};
