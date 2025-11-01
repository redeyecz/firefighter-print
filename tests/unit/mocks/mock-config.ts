/**
 * Mock Configuration for Map Service Tests
 */

import { Effect, Layer } from "effect";
import { ConfigService } from "@/backend/config/loader";
import type { AppConfig } from "@/backend/config/schema";

/**
 * Test configuration with realistic values
 */
export const testAppConfig: AppConfig = {
  email: {
    host: "test.example.com",
    port: 993,
    user: "test@example.com",
    password: "test-password",
    monitoredEmail: "test@example.com",
    pollingIntervalMs: 5000,
  },
  filter: {
    senderEmail: "dispatch@test.com",
    subjectContains: "DISPATCH",
  },
  station: {
    name: "Test Fire Station",
    location: {
      latitude: 49.947014,
      longitude: 17.885027,
    },
  },
  cups: {
    host: "localhost",
    port: 631,
    printerName: "TestPrinter",
    retryAttempts: 3,
    retryDelayMs: 30000,
  },
  printFormat: "single-page",
  map: {
    apiKey: "test-api-key-12345",
    provider: "mapycz",
    timeoutMs: 10000,
    width: 800,
    height: 600,
    mapset: "basic",
    routeType: "car_fast",
  },
  database: {
    path: "./data/test-dispatch.db",
  },
};

/**
 * Mock ConfigService Layer for testing
 */
export const MockConfigService = Layer.succeed(
  ConfigService,
  ConfigService.of({
    getConfig: () => Effect.succeed(testAppConfig),
  })
);
