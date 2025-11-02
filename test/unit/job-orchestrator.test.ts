/**
 * Job Orchestrator Integration Tests
 * Tests the complete workflow orchestration from email to print
 * Mocks external services (GPS, Map, Document, Printer, Config) and JobRepository
 */

import { describe, it } from "vitest";
import { Effect, Layer } from "effect";
import * as assert from "node:assert";
import { HttpClient } from "@effect/platform";
import { JobOrchestrator } from "@/backend/services/job-orchestrator";
import { GPSExtraction } from "@/backend/services/gps-extraction";
import { MapService } from "@/backend/services/map-service";
import { DocumentAssembler } from "@/backend/services/document-assembler";
import { PrinterService } from "@/backend/services/printer-service";
import { JobRepository } from "@/backend/services/job-repository";
import { ConfigService } from "@/backend/config/loader";
import { MapResponse, RouteGeometry } from "@/backend/domain/map";
import { PrintDocument, DocumentSection } from "@/backend/domain/document";
import { PrintConfig, PrinterUnreachable } from "@/backend/domain/print";
import type { Email } from "@/backend/domain/email";
import type { AppConfig } from "@/backend/config/schema";
import { GPSError } from "@/lib/errors";

describe("JobOrchestrator", () => {
  // Mock email for testing
  const mockEmail: Email = {
    uid: 123,
    subject: "Dispatch: Fire at Main St",
    from: "dispatch@fire.com",
    to: "station@fire.com",
    receivedDate: new Date("2024-01-01T10:00:00Z"),
    flags: [],
    html: "<p>Fire at Main St. GPS: 50.0755, 14.4378</p>",
    text: "Fire at Main St. GPS: 50.0755, 14.4378",
  };

  const mockPrintConfig = new PrintConfig({
    cupsHost: "localhost",
    cupsPort: 631,
    printerName: "test-printer",
  });

  const mockAppConfig: AppConfig = {
    email: {
      host: "imap.test.com",
      port: 993,
      user: "test@test.com",
      password: "password",
      monitoredEmail: "dispatch@test.com",
      pollingIntervalMs: 5000,
    },
    filter: {
      senderEmail: "dispatch@fire.com",
    },
    station: {
      name: "Station 1",
      location: {
        latitude: 50.0755,
        longitude: 14.4378,
      },
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

  it("should process dispatch email successfully (happy path)", async () => {
    await Effect.gen(function* () {
      const orchestrator = yield* JobOrchestrator;

      const job = yield* orchestrator.processDispatchEmail(mockEmail, mockPrintConfig);

      // Verify job was created with correct status
      assert.ok(job.id);
      assert.strictEqual(job.status, "Printed");
      assert.strictEqual(job.email.subject, mockEmail.subject);

      // Verify all results are present
      assert.ok(job.results);
      if (!job.results) throw new Error("Results should exist");
      const { gpsResult, mapResult, printResult } = job.results;
      assert.ok(gpsResult);
      assert.ok(mapResult);
      assert.ok(printResult);
      if (!gpsResult || !mapResult || !printResult) {
        throw new Error("All results should be defined");
      }

      // Verify GPS succeeded
      assert.strictEqual(gpsResult.success, true);
      assert.ok(gpsResult.coordinates);

      // Verify map succeeded
      assert.strictEqual(mapResult.success, true);
      assert.ok(mapResult.imageUrl);

      // Verify print succeeded
      assert.strictEqual(printResult.success, true);
    })
      .pipe(
        Effect.provide(
          JobOrchestrator.Default.pipe(
            Layer.provide(
              Layer.mergeAll(
                // Mock external services
                Layer.succeed(GPSExtraction, {
                  extractGPS: () =>
                    Effect.succeed({
                      coordinates: { latitude: 50.0755, longitude: 14.4378 },
                      warning: undefined,
                    }),
                }),
                Layer.succeed(MapService, {
                  generateRouteMap: () =>
                    Effect.succeed(
                      new MapResponse({
                        imageUrl: "https://api.mapy.cz/static-map/test.png",
                        format: "png",
                        width: 800,
                        height: 600,
                      })
                    ),
                  getRoute: () =>
                    Effect.succeed(
                      new RouteGeometry({
                        type: "polyline",
                        data: "encoded_polyline_data",
                        distance: 1000,
                        duration: 300,
                      })
                    ),
                  generateStaticMapUrl: () =>
                    Effect.succeed("https://api.mapy.cz/static-map/test.png"),
                }),
                Layer.succeed(DocumentAssembler, {
                  assemble: () =>
                    Effect.succeed(
                      new PrintDocument({
                        originalHtml: "<p>Fire at Main St</p>",
                        appendedContent: [],
                        warnings: [],
                        layout: "single-page",
                        finalHtml: "<html><body>Dispatch Document</body></html>",
                      })
                    ),
                }),
                Layer.succeed(PrinterService, {
                  printDocument: () =>
                    Effect.succeed({
                      success: true,
                      retryHistory: [],
                    }),
                }),
                Layer.succeed(ConfigService, {
                  getConfig: () => Effect.succeed(mockAppConfig),
                  updateConfig: () => Effect.void,
                }),
                Layer.succeed(HttpClient.HttpClient, {} as HttpClient.HttpClient),
                // Mock JobRepository - just pass through the job without database operations
                Layer.succeed(JobRepository, {
                  createJob: (job) => Effect.succeed(job),
                  updateJob: (job) => Effect.succeed(job),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  getJob: (_jobId) => Effect.succeed({} as any), // Not used in these tests
                  listJobs: () => Effect.succeed([]), // Not used
                  get24HourStats: () =>
                    Effect.succeed({ total: 0, successful: 0, failed: 0, successRate: 0 }), // Not used
                })
              )
            )
          )
        )
      )
      .pipe(Effect.scoped)
      .pipe(Effect.runPromise);
  });

  it("should continue printing even when GPS extraction fails", async () => {
    await Effect.gen(function* () {
      const orchestrator = yield* JobOrchestrator;

      const job = yield* orchestrator.processDispatchEmail(mockEmail, mockPrintConfig);

      // Job should still complete with Printed status despite GPS failure
      assert.strictEqual(job.status, "Printed");

      // Verify results exist
      assert.ok(job.results);
      if (!job.results) throw new Error("Results should exist");
      const { gpsResult, mapResult, printResult } = job.results;
      assert.ok(gpsResult);
      assert.ok(mapResult);
      assert.ok(printResult);
      if (!gpsResult || !mapResult || !printResult) {
        throw new Error("All results should be defined");
      }

      // GPS should have failed
      assert.strictEqual(gpsResult.success, false);
      assert.ok(gpsResult.error);

      // Map should have failed (no GPS coordinates)
      assert.strictEqual(mapResult.success, false);

      // Print should still succeed
      assert.strictEqual(printResult.success, true);
    })
      .pipe(
        Effect.provide(
          JobOrchestrator.Default.pipe(
            Layer.provide(
              Layer.mergeAll(
                // Mock external services
                Layer.succeed(GPSExtraction, {
                  extractGPS: () =>
                    Effect.fail(
                      new GPSError({
                        message: "GPS coordinates not found",
                      })
                    ),
                }),
                Layer.succeed(MapService, {
                  generateRouteMap: () =>
                    Effect.succeed(
                      new MapResponse({
                        imageUrl: "https://api.mapy.cz/static-map/test.png",
                        format: "png",
                        width: 800,
                        height: 600,
                      })
                    ),
                  getRoute: () =>
                    Effect.succeed(
                      new RouteGeometry({
                        type: "polyline",
                        data: "encoded_polyline_data",
                        distance: 1000,
                        duration: 300,
                      })
                    ),
                  generateStaticMapUrl: () =>
                    Effect.succeed("https://api.mapy.cz/static-map/test.png"),
                }),
                Layer.succeed(DocumentAssembler, {
                  assemble: () =>
                    Effect.succeed(
                      new PrintDocument({
                        originalHtml: "<p>Fire at Main St</p>",
                        appendedContent: [
                          new DocumentSection({
                            type: "error",
                            content: "<p>GPS coordinates not found</p>",
                            title: "GPS Error",
                          }),
                        ],
                        warnings: [],
                        layout: "single-page",
                        finalHtml: "<html><body>Dispatch Document with Error</body></html>",
                      })
                    ),
                }),
                Layer.succeed(PrinterService, {
                  printDocument: () =>
                    Effect.succeed({
                      success: true,
                      retryHistory: [],
                    }),
                }),
                Layer.succeed(ConfigService, {
                  getConfig: () => Effect.succeed(mockAppConfig),
                  updateConfig: () => Effect.void,
                }),
                Layer.succeed(HttpClient.HttpClient, {} as HttpClient.HttpClient),
                // Mock JobRepository - just pass through the job without database operations
                Layer.succeed(JobRepository, {
                  createJob: (job) => Effect.succeed(job),
                  updateJob: (job) => Effect.succeed(job),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  getJob: (_jobId) => Effect.succeed({} as any), // Not used in these tests
                  listJobs: () => Effect.succeed([]), // Not used
                  get24HourStats: () =>
                    Effect.succeed({ total: 0, successful: 0, failed: 0, successRate: 0 }), // Not used
                })
              )
            )
          )
        )
      )
      .pipe(Effect.scoped)
      .pipe(Effect.runPromise);
  });

  it("should mark job as Failed when print fails", async () => {
    await Effect.gen(function* () {
      const orchestrator = yield* JobOrchestrator;

      const job = yield* orchestrator.processDispatchEmail(mockEmail, mockPrintConfig);

      // Job should be marked as Failed when printing fails
      assert.strictEqual(job.status, "Failed");
      assert.ok(job.errorMessage);

      // Verify results exist
      assert.ok(job.results);
      if (!job.results) throw new Error("Results should exist");
      const { gpsResult, mapResult, printResult } = job.results;
      assert.ok(gpsResult);
      assert.ok(mapResult);
      assert.ok(printResult);
      if (!gpsResult || !mapResult || !printResult) {
        throw new Error("All results should be defined");
      }

      // GPS and map should have succeeded
      assert.strictEqual(gpsResult.success, true);
      assert.strictEqual(mapResult.success, true);

      // Print should have failed
      assert.strictEqual(printResult.success, false);
      assert.ok(printResult.error);
    })
      .pipe(
        Effect.provide(
          JobOrchestrator.Default.pipe(
            Layer.provide(
              Layer.mergeAll(
                // Mock external services
                Layer.succeed(GPSExtraction, {
                  extractGPS: () =>
                    Effect.succeed({
                      coordinates: { latitude: 50.0755, longitude: 14.4378 },
                      warning: undefined,
                    }),
                }),
                Layer.succeed(MapService, {
                  generateRouteMap: () =>
                    Effect.succeed(
                      new MapResponse({
                        imageUrl: "https://api.mapy.cz/static-map/test.png",
                        format: "png",
                        width: 800,
                        height: 600,
                      })
                    ),
                  getRoute: () =>
                    Effect.succeed(
                      new RouteGeometry({
                        type: "polyline",
                        data: "encoded_polyline_data",
                        distance: 1000,
                        duration: 300,
                      })
                    ),
                  generateStaticMapUrl: () =>
                    Effect.succeed("https://api.mapy.cz/static-map/test.png"),
                }),
                Layer.succeed(DocumentAssembler, {
                  assemble: () =>
                    Effect.succeed(
                      new PrintDocument({
                        originalHtml: "<p>Fire at Main St</p>",
                        appendedContent: [],
                        warnings: [],
                        layout: "single-page",
                        finalHtml: "<html><body>Dispatch Document</body></html>",
                      })
                    ),
                }),
                Layer.succeed(PrinterService, {
                  printDocument: () =>
                    Effect.fail(
                      new PrinterUnreachable({
                        host: "localhost",
                        port: 631,
                      })
                    ),
                }),
                Layer.succeed(ConfigService, {
                  getConfig: () => Effect.succeed(mockAppConfig),
                  updateConfig: () => Effect.void,
                }),
                Layer.succeed(HttpClient.HttpClient, {} as HttpClient.HttpClient),
                // Mock JobRepository - just pass through the job without database operations
                Layer.succeed(JobRepository, {
                  createJob: (job) => Effect.succeed(job),
                  updateJob: (job) => Effect.succeed(job),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  getJob: (_jobId) => Effect.succeed({} as any), // Not used in these tests
                  listJobs: () => Effect.succeed([]), // Not used
                  get24HourStats: () =>
                    Effect.succeed({ total: 0, successful: 0, failed: 0, successRate: 0 }), // Not used
                })
              )
            )
          )
        )
      )
      .pipe(Effect.scoped)
      .pipe(Effect.runPromise);
  });
});
