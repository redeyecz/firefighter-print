/**
 * GPS domain models
 * Defines GPS coordinates and extraction results
 */

import { Schema as S } from "@effect/schema";
import { Data } from "effect";

/**
 * GPS Coordinates schema with validation
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
export const GPSCoordinatesSchema = S.Struct({
  latitude: S.Number.pipe(S.greaterThanOrEqualTo(-90), S.lessThanOrEqualTo(90)),
  longitude: S.Number.pipe(S.greaterThanOrEqualTo(-180), S.lessThanOrEqualTo(180)),
});

export type GPSCoordinates = S.Schema.Type<typeof GPSCoordinatesSchema>;

/**
 * GPS Extraction Result with optional warning
 */
export class GPSExtractionResult extends Data.Class<{
  coordinates: GPSCoordinates;
  warning?: string;
  rawMatch?: string; // The original text that was matched
}> {}

/**
 * GPS Not Found Result
 */
export class GPSNotFound extends Data.Class<{
  message: string;
  searchedText: string;
}> {}

/**
 * Multiple GPS coordinates found
 */
export class MultipleGPSFound extends Data.Class<{
  coordinates: GPSCoordinates[];
  warning: string;
}> {}
