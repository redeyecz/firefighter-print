/**
 * GPS Extraction Service
 * Extracts GPS coordinates from email content
 */

import { Effect, Context, Layer } from "effect";
import { Schema as S } from "@effect/schema";
import type { Email } from "@/backend/domain/email";
import {
  GPSCoordinatesSchema,
  type GPSCoordinates,
  GPSExtractionResult,
} from "@/backend/domain/gps";
import { GPSError } from "@/lib/errors";

/**
 * GPS Extraction Service interface
 */
export interface IGPSExtraction {
  readonly extractGPS: (email: Email) => Effect.Effect<GPSExtractionResult, GPSError>;
}

/**
 * GPSExtraction service tag
 */
export class GPSExtraction extends Context.Tag("GPSExtraction")<
  GPSExtraction,
  IGPSExtraction
>() {}

/**
 * Regex patterns for Decimal Degrees format
 * Supports various formats:
 * - 49.947014 N, 17.885027 E
 * - 49.947014N, 17.885027E
 * - 49.947014 n, 17.885027 e (case insensitive)
 * - With or without spaces
 */
const GPS_REGEX_PATTERNS = [
  // Pattern 1: 49.947014 N, 17.885027 E (with spaces and comma)
  /(\d+\.?\d*)\s*([NS])\s*,\s*(\d+\.?\d*)\s*([EW])/gi,
  // Pattern 2: 49.947014N, 17.885027E (no spaces)
  /(\d+\.?\d*)([NS])\s*,?\s*(\d+\.?\d*)([EW])/gi,
  // Pattern 3: More flexible with optional comma
  /(\d+\.?\d*)\s*°?\s*([NS])\s*,?\s*(\d+\.?\d*)\s*°?\s*([EW])/gi,
];

/**
 * Parse HTML to plain text
 */
const htmlToText = (html: string): string => {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Extract text from email (HTML or plain text)
 */
const extractEmailText = (email: Email): string => {
  if (email.html) {
    return htmlToText(email.html);
  }
  if (email.text) {
    return email.text;
  }
  return email.subject; // Fallback to subject
};

/**
 * Parse coordinate match to GPSCoordinates
 */
const parseCoordinates = (
  lat: string,
  latDir: string,
  lon: string,
  lonDir: string
): Effect.Effect<GPSCoordinates, GPSError> =>
  Effect.gen(function* () {
    let latitude = parseFloat(lat);
    let longitude = parseFloat(lon);

    // Apply direction (S = negative, W = negative)
    if (latDir.toUpperCase() === "S") {
      latitude = -latitude;
    }
    if (lonDir.toUpperCase() === "W") {
      longitude = -longitude;
    }

    // Validate using schema
    const validated = yield* S.decodeUnknown(GPSCoordinatesSchema)(
      { latitude, longitude },
      { errors: "all" }
    ).pipe(
      Effect.mapError(
        (error) =>
          new GPSError({
            message: `Invalid GPS coordinates: ${error}`,
            coordinates: `${lat}${latDir}, ${lon}${lonDir}`,
          })
      )
    );

    return validated;
  });

/**
 * Find all GPS coordinates in text
 */
const findAllCoordinates = (text: string): Effect.Effect<GPSCoordinates[], GPSError> =>
  Effect.gen(function* () {
    const allCoordinates: GPSCoordinates[] = [];
    const matchedPositions = new Set<number>();

    for (const pattern of GPS_REGEX_PATTERNS) {
      const matches = text.matchAll(pattern);

      for (const match of matches) {
        // Skip if we've already matched this position
        if (match.index !== undefined && matchedPositions.has(match.index)) {
          continue;
        }

        if (match.length >= 5) {
          const [, lat, latDir, lon, lonDir] = match;
          if (lat && latDir && lon && lonDir) {
            try {
              const coords = yield* parseCoordinates(lat, latDir, lon, lonDir);
              allCoordinates.push(coords);
              // Mark this position as matched
              if (match.index !== undefined) {
                matchedPositions.add(match.index);
              }
            } catch {
              // Skip invalid coordinates
              continue;
            }
          }
        }
      }
    }

    return allCoordinates;
  });

/**
 * Create GPS Extraction implementation
 */
const makeGPSExtraction = (): IGPSExtraction => {
  const extractGPS = (email: Email): Effect.Effect<GPSExtractionResult, GPSError> =>
    Effect.gen(function* () {
      const text = extractEmailText(email);

      // Find all coordinates
      const allCoordinates = yield* findAllCoordinates(text);

      // Handle no coordinates found
      if (allCoordinates.length === 0) {
        return yield* Effect.fail(
          new GPSError({
            message: "GPS coordinates not found in email",
            coordinates: text.substring(0, 100), // Include snippet for debugging
          })
        );
      }

      // Handle multiple coordinates (return first with warning)
      if (allCoordinates.length > 1) {
        return new GPSExtractionResult({
          coordinates: allCoordinates[0]!,
          warning: "Multiple GPS locations found; please verify",
          rawMatch: `Found ${allCoordinates.length} coordinate sets`,
        });
      }

      // Single coordinate found (success)
      return new GPSExtractionResult({
        coordinates: allCoordinates[0]!,
      });
    });

  return {
    extractGPS,
  };
};

/**
 * GPSExtraction Layer
 */
export const GPSExtractionLive = Layer.succeed(GPSExtraction, makeGPSExtraction());
