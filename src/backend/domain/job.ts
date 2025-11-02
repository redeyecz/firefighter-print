import { Schema } from "@effect/schema";
import { Data } from "effect";
import { EmailSchema } from "./email";
import { GPSCoordinatesSchema } from "./gps";
import { RetryAttempt } from "./print";

/**
 * Represents the status of a dispatch job
 */
export const JobStatus = Schema.Literal("Received", "Processing", "Printed", "Failed");
export type JobStatus = typeof JobStatus.Type;

/**
 * Represents a retry history entry (automatic or manual)
 */
export class RetryHistoryEntry extends Schema.Class<RetryHistoryEntry>("RetryHistoryEntry")({
  timestamp: Schema.DateTimeUtc,
  attemptNumber: Schema.Number,
  retryType: Schema.Literal("automatic", "manual"),
  errorMessage: Schema.String,
  result: Schema.Literal("success", "failure"),
}) {}

/**
 * Represents the result of GPS extraction step
 */
export class GPSResult extends Schema.Class<GPSResult>("GPSResult")({
  success: Schema.Boolean,
  coordinates: Schema.optional(GPSCoordinatesSchema),
  warning: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
}) {}

/**
 * Represents the result of map generation step
 */
export class MapResult extends Schema.Class<MapResult>("MapResult")({
  success: Schema.Boolean,
  imageUrl: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
}) {}

/**
 * Represents the result of print step
 */
export class PrintResult extends Schema.Class<PrintResult>("PrintResult")({
  success: Schema.Boolean,
  error: Schema.optional(Schema.String),
  automaticRetries: Schema.Array(RetryAttempt),
}) {}

/**
 * Represents the results of all job processing steps
 */
export class JobResult extends Schema.Class<JobResult>("JobResult")({
  gpsResult: Schema.optional(GPSResult),
  mapResult: Schema.optional(MapResult),
  printResult: Schema.optional(PrintResult),
}) {}

/**
 * Represents a complete dispatch job
 */
export class DispatchJob extends Schema.Class<DispatchJob>("DispatchJob")({
  id: Schema.String,
  email: EmailSchema,
  status: JobStatus,
  receivedAt: Schema.DateTimeUtc,
  processedAt: Schema.optional(Schema.DateTimeUtc),
  printedAt: Schema.optional(Schema.DateTimeUtc),
  results: Schema.optional(JobResult),
  retryHistory: Schema.Array(RetryHistoryEntry),
  errorMessage: Schema.optional(Schema.String),
}) {}

/**
 * Error: Job processing failed
 */
export class JobProcessingError extends Data.TaggedError("JobProcessingError")<{
  readonly jobId: string;
  readonly step: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Error: Job not found
 */
export class JobNotFound extends Data.TaggedError("JobNotFound")<{
  readonly jobId: string;
}> {}

/**
 * Error: Job repository error
 */
export class JobRepositoryError extends Data.TaggedError("JobRepositoryError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Union of all job-related errors
 */
export type JobError = JobProcessingError | JobNotFound | JobRepositoryError;
