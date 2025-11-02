/**
 * Health Check Service Tests
 */

import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import * as assert from "node:assert";
import { HealthCheckService, HealthCheckServiceLive } from "@/backend/services/health-check";
import { EmailService } from "@/backend/services/email-service";
import { EmailClient } from "@/backend/infrastructure/email-client";
import { MapService } from "@/backend/services/map-service";
import { ConfigService } from "@/backend/config/loader";
import { makeTestLayer } from "../utils";
import { EmailError } from "@/lib/errors";
import type { AppConfig } from "@/backend/config/schema";

const mockConfig: AppConfig = {
  email: {
    host: "mail.example.com",
    port: 993,
    user: "test@example.com",
    password: "password",
    monitoredEmail: "dispatch@example.com",
    pollingIntervalMs: 5000,
  },
  filter: {
    senderEmail: "dispatch@example.com",
  },
  station: {
    name: "Station 1",
    location: { latitude: 50.0, longitude: 14.0 },
  },
  cups: {
    host: "localhost",
    port: 631,
    printerName: "test-printer",
    retryAttempts: 3,
    retryDelayMs: 30000,
  },
  printFormat: "single-page",
  map: {
    apiKey: "test-api-key",
    provider: "mapycz",
    timeoutMs: 10000,
    width: 800,
    height: 600,
    mapset: "basic",
    routeType: "car_fast",
  },
  database: {
    path: ":memory:",
  },
};

describe("HealthCheckService", () => {
  describe("checkEmail", () => {
    it.effect("should return healthy when email service is operational", () =>
      Effect.gen(function* () {
        const healthCheck = yield* HealthCheckService;
        const result = yield* healthCheck.checkEmail();

        assert.strictEqual(result.status, "healthy");
        assert.strictEqual(result.message, "Email service is operational");
      }).pipe(
        Effect.provide(
          makeTestLayer(EmailService)({
            testConnection: () => Effect.succeed(true),
          })
        ),
        Effect.provide(
          makeTestLayer(EmailClient)({
            connect: () => Effect.void,
            disconnect: () => Effect.void,
          })
        ),
        Effect.provide(
          makeTestLayer(ConfigService)({
            getConfig: () => Effect.succeed(mockConfig),
          })
        ),
        Effect.provide(HealthCheckServiceLive)
      )
    );

    it.effect("should return unhealthy when email service fails", () =>
      Effect.gen(function* () {
        const healthCheck = yield* HealthCheckService;
        const result = yield* healthCheck.checkEmail();

        assert.strictEqual(result.status, "unhealthy");
        assert.match(result.message ?? "", /not responding/);
      }).pipe(
        Effect.provide(
          makeTestLayer(EmailService)({
            testConnection: () => Effect.fail(new EmailError({ message: "Connection failed" })),
          })
        ),
        Effect.provide(
          makeTestLayer(EmailClient)({
            connect: () => Effect.void,
            disconnect: () => Effect.void,
          })
        ),
        Effect.provide(
          makeTestLayer(ConfigService)({
            getConfig: () => Effect.succeed(mockConfig),
          })
        ),
        Effect.provide(HealthCheckServiceLive)
      )
    );
  });

  describe("checkMap", () => {
    it.effect("should return healthy when map service is configured", () =>
      Effect.gen(function* () {
        const healthCheck = yield* HealthCheckService;
        const result = yield* healthCheck.checkMap();

        assert.strictEqual(result.status, "healthy");
        assert.match(result.message ?? "", /configured/);
      }).pipe(
        Effect.provide(
          makeTestLayer(MapService)({
            generateStaticMapUrl: () => Effect.succeed("https://api.mapy.cz/v1/staticmap?..."),
          })
        ),
        Effect.provide(
          makeTestLayer(ConfigService)({
            getConfig: () => Effect.succeed(mockConfig),
          })
        ),
        Effect.provide(HealthCheckServiceLive)
      )
    );

    it.effect("should return unhealthy when API key is missing", () =>
      Effect.gen(function* () {
        const healthCheck = yield* HealthCheckService;
        const result = yield* healthCheck.checkMap();

        assert.strictEqual(result.status, "unhealthy");
        assert.match(result.message ?? "", /not configured/);
      }).pipe(
        Effect.provide(
          makeTestLayer(MapService)({
            generateStaticMapUrl: () => Effect.succeed("https://api.mapy.cz/v1/staticmap?..."),
          })
        ),
        Effect.provide(
          makeTestLayer(ConfigService)({
            getConfig: () =>
              Effect.succeed({
                ...mockConfig,
                map: { ...mockConfig.map, apiKey: "" },
              }),
          })
        ),
        Effect.provide(HealthCheckServiceLive)
      )
    );
  });

  describe("checkPrinter", () => {
    it.effect("should return healthy when printer is configured", () =>
      Effect.gen(function* () {
        const healthCheck = yield* HealthCheckService;
        const result = yield* healthCheck.checkPrinter();

        assert.strictEqual(result.status, "healthy");
        assert.match(result.message ?? "", /configured/);
      }).pipe(
        Effect.provide(
          makeTestLayer(ConfigService)({
            getConfig: () => Effect.succeed(mockConfig),
          })
        ),
        Effect.provide(HealthCheckServiceLive)
      )
    );

    it.effect("should return unhealthy when printer is not configured", () =>
      Effect.gen(function* () {
        const healthCheck = yield* HealthCheckService;
        const result = yield* healthCheck.checkPrinter();

        assert.strictEqual(result.status, "unhealthy");
        assert.match(result.message ?? "", /not configured/);
      }).pipe(
        Effect.provide(
          makeTestLayer(ConfigService)({
            getConfig: () =>
              Effect.succeed({
                ...mockConfig,
                cups: { ...mockConfig.cups, host: "" },
              }),
          })
        ),
        Effect.provide(HealthCheckServiceLive)
      )
    );
  });

  describe("checkAll", () => {
    it.effect("should check all services in parallel", () =>
      Effect.gen(function* () {
        const healthCheck = yield* HealthCheckService;
        const result = yield* healthCheck.checkAll();

        assert.strictEqual(result.emailService.status, "healthy");
        assert.strictEqual(result.mapService.status, "healthy");
        assert.strictEqual(result.printerService.status, "healthy");
      }).pipe(
        Effect.provide(
          makeTestLayer(EmailService)({
            testConnection: () => Effect.succeed(true),
          })
        ),
        Effect.provide(
          makeTestLayer(EmailClient)({
            connect: () => Effect.void,
            disconnect: () => Effect.void,
          })
        ),
        Effect.provide(
          makeTestLayer(MapService)({
            generateStaticMapUrl: () => Effect.succeed("https://api.mapy.cz/v1/staticmap?..."),
          })
        ),
        Effect.provide(
          makeTestLayer(ConfigService)({
            getConfig: () => Effect.succeed(mockConfig),
          })
        ),
        Effect.provide(HealthCheckServiceLive)
      )
    );
  });
});
