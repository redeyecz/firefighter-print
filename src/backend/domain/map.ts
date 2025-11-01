/**
 * Map domain models
 * Defines map generation requests, responses, and routes
 */

import { Schema as S } from "@effect/schema";
import { Data } from "effect";

/**
 * Map Request - Parameters for generating a route map
 */
export const MapRequestSchema = S.Struct({
  startPoint: S.Struct({
    latitude: S.Number.pipe(S.greaterThanOrEqualTo(-90), S.lessThanOrEqualTo(90)),
    longitude: S.Number.pipe(S.greaterThanOrEqualTo(-180), S.lessThanOrEqualTo(180)),
  }),
  destination: S.Struct({
    latitude: S.Number.pipe(S.greaterThanOrEqualTo(-90), S.lessThanOrEqualTo(90)),
    longitude: S.Number.pipe(S.greaterThanOrEqualTo(-180), S.lessThanOrEqualTo(180)),
  }),
  routeType: S.Literal("car", "car_fast", "bicycle", "foot").annotations({
    default: "car_fast",
  }),
  width: S.Number.pipe(S.int(), S.greaterThan(0)).annotations({ default: 800 }),
  height: S.Number.pipe(S.int(), S.greaterThan(0)).annotations({ default: 600 }),
  mapset: S.Literal("basic", "outdoor", "winter", "aerial").annotations({
    default: "basic",
  }),
});

export type MapRequest = S.Schema.Type<typeof MapRequestSchema>;

/**
 * Route Geometry - Path coordinates returned from routing API
 */
export class RouteGeometry extends Data.Class<{
  type: "polyline" | "geojson" | "polyline6";
  data: string; // Encoded polyline or GeoJSON string
  distance: number; // Distance in meters
  duration: number; // Duration in seconds
}> {}

/**
 * Map Response - Result of map generation
 */
export class MapResponse extends Data.Class<{
  imageUrl: string; // URL to the static map image
  route?: RouteGeometry; // Optional route geometry data
  format: "png" | "jpeg";
  width: number;
  height: number;
}> {}

/**
 * Map Service Error Types
 */
export type MapErrorType =
  | "ServiceUnavailable"
  | "InvalidApiKey"
  | "Timeout"
  | "InvalidCoordinates"
  | "RouteNotFound"
  | "ImageGenerationFailed"
  | "NetworkError";

/**
 * Map Error - Errors that occur during map generation
 */
export class MapServiceError extends Data.Class<{
  type: MapErrorType;
  message: string;
  cause?: unknown;
  statusCode?: number;
}> {}
