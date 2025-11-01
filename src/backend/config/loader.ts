/**
 * Configuration loader
 * Loads and validates configuration from environment variables and config files
 */

import { Effect, Context } from "effect";
import { Schema as S } from "@effect/schema";
import { AppConfigSchema, type AppConfig } from "./schema";
import { ConfigError } from "@/lib/errors";

/**
 * Configuration service tag
 */
export class ConfigService extends Context.Tag("ConfigService")<
  ConfigService,
  {
    readonly getConfig: () => Effect.Effect<AppConfig, ConfigError>;
    readonly updateConfig: (config: AppConfig) => Effect.Effect<void, ConfigError>;
  }
>() {}

/**
 * Load configuration from environment variables
 */
const loadFromEnv = (): Effect.Effect<Partial<AppConfig>, ConfigError> =>
  Effect.try({
    try: () => {
      const config: Partial<AppConfig> = {
        email: {
          host: process.env.EMAIL_HOST || "",
          port: parseInt(process.env.EMAIL_PORT || "993"),
          user: process.env.EMAIL_USER || "",
          password: process.env.EMAIL_PASSWORD || "",
          monitoredEmail: process.env.MONITORED_EMAIL || "",
          pollingIntervalMs: parseInt(process.env.EMAIL_POLLING_INTERVAL_MS || "5000"),
        },
        filter: {
          senderEmail: process.env.FILTER_SENDER_EMAIL,
          subjectContains: process.env.FILTER_SUBJECT_CONTAINS,
          subjectRegex: process.env.FILTER_SUBJECT_REGEX,
        },
        station: {
          name: process.env.STATION_NAME || "",
          location: {
            latitude: parseFloat(process.env.STATION_LAT || "0"),
            longitude: parseFloat(process.env.STATION_LON || "0"),
          },
        },
        cups: {
          host: process.env.CUPS_HOST || "localhost",
          port: parseInt(process.env.CUPS_PORT || "631"),
          printerName: process.env.CUPS_PRINTER_NAME || "",
          retryAttempts: parseInt(process.env.CUPS_RETRY_ATTEMPTS || "3"),
          retryDelayMs: parseInt(process.env.CUPS_RETRY_DELAY_MS || "30000"),
        },
        printFormat: (process.env.PRINT_FORMAT as "single-page" | "two-page") || "single-page",
        map: {
          apiKey: process.env.MAP_API_KEY || "",
          provider: (process.env.MAP_PROVIDER as "mapycz" | "openrouteservice") || "mapycz",
          timeoutMs: parseInt(process.env.MAP_TIMEOUT_MS || "10000"),
          width: parseInt(process.env.MAP_WIDTH || "800"),
          height: parseInt(process.env.MAP_HEIGHT || "600"),
          mapset: (process.env.MAP_MAPSET as "basic" | "outdoor" | "winter" | "aerial") || "basic",
          routeType:
            (process.env.MAP_ROUTE_TYPE as "car" | "car_fast" | "bicycle" | "foot") || "car_fast",
        },
        database: {
          path: process.env.DATABASE_PATH || "./data/dispatch.db",
        },
      };
      return config;
    },
    catch: (error) =>
      new ConfigError({
        message: "Failed to load configuration from environment",
        field: String(error),
      }),
  });

/**
 * Validate configuration using Effect Schema
 */
const validateConfig = (config: unknown): Effect.Effect<AppConfig, ConfigError> =>
  Effect.flatMap(S.decodeUnknown(AppConfigSchema)(config), (validatedConfig) =>
    Effect.succeed(validatedConfig)
  ).pipe(
    Effect.catchAll((error) =>
      Effect.fail(
        new ConfigError({
          message: `Configuration validation failed: ${error}`,
        })
      )
    )
  );

/**
 * Validate filter configuration for mutual exclusivity
 */
const validateFilterMutualExclusivity = (
  config: AppConfig
): Effect.Effect<AppConfig, ConfigError> => {
  if (config.filter.subjectContains && config.filter.subjectRegex) {
    return Effect.fail(
      new ConfigError({
        message: "subjectContains and subjectRegex are mutually exclusive",
        field: "filter",
      })
    );
  }
  return Effect.succeed(config);
};

/**
 * Load and validate complete configuration
 */
export const loadConfig = (): Effect.Effect<AppConfig, ConfigError> =>
  Effect.gen(function* () {
    const envConfig = yield* loadFromEnv();
    const validated = yield* validateConfig(envConfig);
    const checked = yield* validateFilterMutualExclusivity(validated);
    return checked;
  });

/**
 * In-memory configuration store (to be replaced with database later)
 */
let configCache: AppConfig | null = null;

/**
 * Live implementation of ConfigService
 */
export const ConfigServiceLive = ConfigService.of({
  getConfig: () =>
    Effect.gen(function* () {
      if (configCache) {
        return configCache;
      }
      const config = yield* loadConfig();
      configCache = config;
      return config;
    }),
  updateConfig: (config: AppConfig) =>
    Effect.gen(function* () {
      const validated = yield* validateConfig(config);
      const checked = yield* validateFilterMutualExclusivity(validated);
      configCache = checked;
      return;
    }),
});
