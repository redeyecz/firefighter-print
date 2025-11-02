import { Schema } from "@effect/schema";
import { Data } from "effect";

/**
 * Represents a retry attempt for a print job
 */
export class RetryAttempt extends Schema.Class<RetryAttempt>("RetryAttempt")({
  timestamp: Schema.DateTimeUtc,
  attemptNumber: Schema.Number,
  errorMessage: Schema.String,
  result: Schema.Literal("success", "failure"),
}) {}

/**
 * Represents a print job configuration
 */
export class PrintConfig extends Schema.Class<PrintConfig>("PrintConfig")({
  cupsHost: Schema.String,
  cupsPort: Schema.Number,
  printerName: Schema.String,
}) {}

/**
 * Represents the status of a print job
 */
export const PrintJobStatus = Schema.Literal("Pending", "Processing", "Printed", "Failed");
export type PrintJobStatus = typeof PrintJobStatus.Type;

/**
 * Represents a print job
 */
export class PrintJob extends Schema.Class<PrintJob>("PrintJob")({
  documentId: Schema.String,
  html: Schema.String,
  status: PrintJobStatus,
  attemptCount: Schema.Number,
  retryHistory: Schema.Array(RetryAttempt),
}) {}

/**
 * Error: CUPS server is unreachable
 */
export class PrinterUnreachable extends Data.TaggedError("PrinterUnreachable")<{
  readonly host: string;
  readonly port: number;
  readonly cause?: unknown;
}> {}

/**
 * Error: Generic printer error
 */
export class PrinterError extends Data.TaggedError("PrinterError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Error: PDF conversion failed
 */
export class ConversionError extends Data.TaggedError("ConversionError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Union of all print-related errors
 */
export type PrintError = PrinterUnreachable | PrinterError | ConversionError;
