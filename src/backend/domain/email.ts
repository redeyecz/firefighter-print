/**
 * Email domain models
 * Defines the structure and types for email entities
 */

import { Schema as S } from "@effect/schema";
import { Data } from "effect";

/**
 * Email metadata schema
 */
export const EmailMetadataSchema = S.Struct({
  uid: S.Number,
  subject: S.String,
  from: S.String,
  to: S.String,
  receivedDate: S.Date,
  flags: S.Array(S.String),
});

export type EmailMetadata = S.Schema.Type<typeof EmailMetadataSchema>;

/**
 * Email content schema
 */
export const EmailContentSchema = S.Struct({
  text: S.optional(S.String),
  html: S.optional(S.String),
});

export type EmailContent = S.Schema.Type<typeof EmailContentSchema>;

/**
 * Complete email schema
 */
export const EmailSchema = S.Struct({
  uid: S.Number,
  subject: S.String,
  from: S.String,
  to: S.String,
  receivedDate: S.Date,
  flags: S.Array(S.String),
  text: S.optional(S.String),
  html: S.optional(S.String),
  raw: S.optional(S.String), // Store original raw email if needed
});

export type Email = S.Schema.Type<typeof EmailSchema>;

/**
 * Email fetch result
 * Used to return emails with metadata about the fetch operation
 */
export class EmailFetchResult extends Data.Class<{
  emails: Email[];
  lastUid: number;
  fetchedAt: Date;
}> {}

/**
 * Email connection status
 */
export const ConnectionStatusSchema = S.Literal("connected", "disconnected", "connecting", "error");

export type ConnectionStatus = S.Schema.Type<typeof ConnectionStatusSchema>;

/**
 * Email service health status
 */
export class EmailServiceHealth extends Data.Class<{
  status: ConnectionStatus;
  lastCheck: Date;
  message?: string;
}> {}
