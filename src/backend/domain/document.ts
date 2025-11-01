/**
 * Document domain models
 * Defines structures for assembled print documents
 */

import { Schema as S } from "@effect/schema";
import { Data } from "effect";

/**
 * Document Section - Represents a section of appended content
 */
export class DocumentSection extends Data.Class<{
  type: "map" | "error" | "warning";
  content: string; // HTML content
  title?: string;
}> {}

/**
 * Print Document - Complete document ready for printing
 */
export class PrintDocument extends Data.Class<{
  originalHtml: string; // Original email HTML (unmodified)
  appendedContent: DocumentSection[]; // Sections to append
  warnings: string[]; // Warning messages to display
  layout: "single-page" | "two-page";
  finalHtml: string; // Complete assembled HTML
}> {}

/**
 * Document Assembly Input
 */
export const DocumentAssemblyInputSchema = S.Struct({
  emailHtml: S.String,
  emailSubject: S.String,
  gpsResult: S.optional(
    S.Struct({
      coordinates: S.Struct({
        latitude: S.Number,
        longitude: S.Number,
      }),
      warning: S.optional(S.String),
    })
  ),
  mapResult: S.optional(
    S.Struct({
      success: S.Boolean,
      data: S.optional(S.Unknown), // MapResponse
      error: S.optional(S.String),
    })
  ),
  layout: S.Literal("single-page", "two-page").annotations({
    default: "single-page",
  }),
});

export type DocumentAssemblyInput = S.Schema.Type<typeof DocumentAssemblyInputSchema>;

/**
 * Error template data
 */
export interface ErrorTemplateData {
  title: string;
  message: string;
  details?: string;
}

/**
 * Warning template data
 */
export interface WarningTemplateData {
  message: string;
}

/**
 * Map template data
 */
export interface MapTemplateData {
  imageUrl: string;
  startPoint: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  distance?: number; // in meters
  duration?: number; // in seconds
}
