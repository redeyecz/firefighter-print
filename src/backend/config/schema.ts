/**
 * Configuration schema using Effect Schema
 * Defines the structure and validation for all system configuration
 */

import { Schema as S } from "@effect/schema";

/**
 * Email configuration schema
 */
export const EmailConfigSchema = S.Struct({
  host: S.String.pipe(S.nonEmptyString()),
  port: S.Number.pipe(S.int(), S.positive()),
  user: S.String.pipe(S.nonEmptyString()),
  password: S.String.pipe(S.nonEmptyString()),
  monitoredEmail: S.String.pipe(S.nonEmptyString()),
  pollingIntervalMs: S.Number.pipe(S.int(), S.positive()).annotations({
    default: 5000,
    description: "Email polling interval in milliseconds",
  }),
});

export type EmailConfig = S.Schema.Type<typeof EmailConfigSchema>;

/**
 * Filter configuration schema
 * Note: subjectContains and subjectRegex are mutually exclusive
 */
export const FilterConfigSchema = S.Struct({
  senderEmail: S.optional(S.String.pipe(S.nonEmptyString())),
  subjectContains: S.optional(S.String.pipe(S.nonEmptyString())),
  subjectRegex: S.optional(S.String.pipe(S.nonEmptyString())),
}).annotations({
  description:
    "Email filter rules. If both sender and subject rules are present, both must match (AND logic).",
});

export type FilterConfig = S.Schema.Type<typeof FilterConfigSchema>;

/**
 * GPS coordinates schema
 */
export const GPSCoordinatesSchema = S.Struct({
  latitude: S.Number.pipe(S.greaterThanOrEqualTo(-90), S.lessThanOrEqualTo(90)),
  longitude: S.Number.pipe(S.greaterThanOrEqualTo(-180), S.lessThanOrEqualTo(180)),
});

export type GPSCoordinates = S.Schema.Type<typeof GPSCoordinatesSchema>;

/**
 * Station configuration schema
 */
export const StationConfigSchema = S.Struct({
  name: S.String.pipe(S.nonEmptyString()),
  location: GPSCoordinatesSchema,
});

export type StationConfig = S.Schema.Type<typeof StationConfigSchema>;

/**
 * CUPS printer configuration schema
 */
export const CUPSConfigSchema = S.Struct({
  host: S.String.pipe(S.nonEmptyString()),
  port: S.Number.pipe(S.int(), S.positive()).annotations({
    default: 631,
  }),
  printerName: S.String.pipe(S.nonEmptyString()),
  retryAttempts: S.Number.pipe(S.int(), S.positive()).annotations({
    default: 3,
  }),
  retryDelayMs: S.Number.pipe(S.int(), S.positive()).annotations({
    default: 30000,
  }),
});

export type CUPSConfig = S.Schema.Type<typeof CUPSConfigSchema>;

/**
 * Print format options
 */
export const PrintFormatSchema = S.Literal("single-page", "two-page");

export type PrintFormat = S.Schema.Type<typeof PrintFormatSchema>;

/**
 * Map service configuration schema
 */
export const MapConfigSchema = S.Struct({
  apiKey: S.String.pipe(S.nonEmptyString()),
  provider: S.Literal("mapycz", "openrouteservice").annotations({
    default: "mapycz",
  }),
  timeoutMs: S.Number.pipe(S.int(), S.positive()).annotations({
    default: 10000,
  }),
  width: S.Number.pipe(S.int(), S.positive()).annotations({ default: 800 }),
  height: S.Number.pipe(S.int(), S.positive()).annotations({ default: 600 }),
  mapset: S.Literal("basic", "outdoor", "winter", "aerial").annotations({
    default: "basic",
  }),
  routeType: S.Literal("car", "car_fast", "bicycle", "foot").annotations({
    default: "car_fast",
  }),
});

export type MapConfig = S.Schema.Type<typeof MapConfigSchema>;

/**
 * Database configuration schema
 */
export const DatabaseConfigSchema = S.Struct({
  path: S.String.pipe(S.nonEmptyString()).annotations({
    default: "./data/dispatch.db",
  }),
});

export type DatabaseConfig = S.Schema.Type<typeof DatabaseConfigSchema>;

/**
 * Complete application configuration schema
 */
export const AppConfigSchema = S.Struct({
  email: EmailConfigSchema,
  filter: FilterConfigSchema,
  station: StationConfigSchema,
  cups: CUPSConfigSchema,
  printFormat: PrintFormatSchema.annotations({
    default: "single-page",
  }),
  map: MapConfigSchema,
  database: DatabaseConfigSchema,
});

export type AppConfig = S.Schema.Type<typeof AppConfigSchema>;
