/**
 * Health Check Service
 * Provides lightweight health checks for all system services
 */

import { Context, Effect, Layer } from "effect";
import { EmailService } from "./email-service";
import { EmailClient } from "@/backend/infrastructure/email-client";
import { MapService } from "./map-service";
import { ConfigService } from "@/backend/config/loader";
import type { SystemHealth, ServiceHealth, HealthStatus } from "@/backend/domain/health";
import { GPSCoordinates } from "@/backend/domain/gps";

/**
 * HealthCheckService interface
 */
export interface IHealthCheckService {
  /**
   * Check health of all services
   */
  readonly checkAll: () => Effect.Effect<
    SystemHealth,
    never,
    EmailService | EmailClient | MapService | ConfigService
  >;

  /**
   * Check email service health
   */
  readonly checkEmail: () => Effect.Effect<
    ServiceHealth,
    never,
    EmailService | EmailClient | ConfigService
  >;

  /**
   * Check map service health
   */
  readonly checkMap: () => Effect.Effect<ServiceHealth, never, MapService | ConfigService>;

  /**
   * Check printer service health
   */
  readonly checkPrinter: () => Effect.Effect<ServiceHealth, never, ConfigService>;
}

/**
 * HealthCheckService tag
 */
export class HealthCheckService extends Context.Tag("HealthCheckService")<
  HealthCheckService,
  IHealthCheckService
>() {}

/**
 * Create a service health result
 */
const createHealthResult = (
  status: HealthStatus,
  message?: string,
  error?: string
): ServiceHealth => ({
  status,
  lastCheck: new Date(),
  message,
  error,
});

/**
 * Create HealthCheckService implementation
 */
const makeHealthCheckService = (): IHealthCheckService => {
  /**
   * Check email service health
   */
  const checkEmail = (): Effect.Effect<
    ServiceHealth,
    never,
    EmailService | EmailClient | ConfigService
  > =>
    Effect.gen(function* () {
      const emailService = yield* EmailService;

      const result = yield* Effect.either(emailService.testConnection());

      if (result._tag === "Right" && result.right) {
        return createHealthResult("healthy", "Email service is operational");
      }

      if (result._tag === "Left") {
        return createHealthResult(
          "unhealthy",
          "Email service is not responding",
          result.left.message
        );
      }

      return createHealthResult("unhealthy", "Email service connection test failed");
    });

  /**
   * Check map service health with a lightweight test
   * We'll attempt to generate a simple static map URL without making a full request
   */
  const checkMap = (): Effect.Effect<ServiceHealth, never, MapService | ConfigService> =>
    Effect.gen(function* () {
      const mapService = yield* MapService;
      const config = yield* ConfigService;

      // Get the config to check if API key is set
      const appConfig = yield* Effect.either(config.getConfig());

      if (appConfig._tag === "Left") {
        return createHealthResult("unhealthy", "Configuration error", appConfig.left.message);
      }

      // Check if API key is configured
      if (!appConfig.right.map.apiKey || appConfig.right.map.apiKey.trim() === "") {
        return createHealthResult("unhealthy", "Map API key not configured");
      }

      // Try to generate a test static map URL (this doesn't make a network request)
      const testStart: GPSCoordinates = { latitude: 50.0, longitude: 14.0 };
      const testDest: GPSCoordinates = { latitude: 50.1, longitude: 14.1 };

      const urlResult = yield* Effect.either(mapService.generateStaticMapUrl(testStart, testDest));

      if (urlResult._tag === "Right") {
        return createHealthResult("healthy", "Map service is configured");
      }

      return createHealthResult(
        "unhealthy",
        "Map service configuration error",
        urlResult.left.message
      );
    });

  /**
   * Check printer service health
   * We'll try to verify the printer configuration
   */
  const checkPrinter = (): Effect.Effect<ServiceHealth, never, ConfigService> =>
    Effect.gen(function* () {
      const config = yield* ConfigService;

      // Get the config to check if printer is configured
      const appConfig = yield* Effect.either(config.getConfig());

      if (appConfig._tag === "Left") {
        return createHealthResult("unhealthy", "Configuration error", appConfig.left.message);
      }

      const printerConfig = appConfig.right.cups;

      // Validate printer configuration
      if (!printerConfig.host || !printerConfig.port || !printerConfig.printerName) {
        return createHealthResult("unhealthy", "Printer not configured");
      }

      // For a lightweight check, we just verify the configuration is present
      // A full connection test would require sending a test job, which we'll skip for health checks
      return createHealthResult("healthy", "Printer is configured");
    });

  /**
   * Check all services
   */
  const checkAll = (): Effect.Effect<
    SystemHealth,
    never,
    EmailService | EmailClient | MapService | ConfigService
  > =>
    Effect.gen(function* () {
      // Run all health checks in parallel
      const [emailHealth, mapHealth, printerHealth] = yield* Effect.all(
        [checkEmail(), checkMap(), checkPrinter()],
        { concurrency: "unbounded" }
      );

      return {
        emailService: emailHealth,
        mapService: mapHealth,
        printerService: printerHealth,
        lastUpdated: new Date(),
      };
    });

  return {
    checkAll,
    checkEmail,
    checkMap,
    checkPrinter,
  };
};

/**
 * HealthCheckService layer
 */
export const HealthCheckServiceLive = Layer.effect(
  HealthCheckService,
  Effect.gen(function* () {
    return makeHealthCheckService();
  })
);
