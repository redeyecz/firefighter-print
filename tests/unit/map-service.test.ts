/**
 * Map Service Unit Tests
 * Tests for Mapy.cz routing and static map URL generation
 */

import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { MapService, MapServiceLive } from "@/backend/services/map-service";
import { MockConfigService, testAppConfig } from "./mocks/mock-config";
import {
  mockMapyCzRoutingSuccess,
  mockMapyCzRoutingShortRoute,
  mockMapyCzRouting404Error,
  mockMapyCzRouting401Error,
  mockMapyCzRouting503Error,
  testCoordinates,
} from "./mocks/mock-http-responses";

/**
 * Create a mock HttpClient that returns a specific response
 */
const createMockHttpClient = (
  responseData: unknown,
  status = 200,
  headers?: Record<string, string>
) => {
  const mockExecute = () =>
    Effect.succeed(
      HttpClientResponse.fromWeb(
        new Request("http://test.example.com"),
        new Response(JSON.stringify(responseData), {
          status,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        })
      )
    );

  return Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.HttpClient.of({
      execute: mockExecute,
      get: mockExecute,
      post: mockExecute,
      patch: mockExecute,
      put: mockExecute,
      del: mockExecute,
      head: mockExecute,
      options: mockExecute,
    } as any)
  );
};

/**
 * Create a mock HttpClient that times out (returns never)
 */
const createTimeoutHttpClient = () => {
  const neverExecute = () => Effect.never;

  return Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.HttpClient.of({
      execute: neverExecute,
      get: neverExecute,
      post: neverExecute,
      patch: neverExecute,
      put: neverExecute,
      del: neverExecute,
      head: neverExecute,
      options: neverExecute,
    } as any)
  );
};

describe("MapService - Routing API", () => {
  describe("getRoute - Success Cases", () => {
    it("should successfully fetch route between two points", async () => {
      const mockHttpClient = createMockHttpClient(mockMapyCzRoutingSuccess);

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.getRoute(
          testCoordinates.fireStationOlomouc,
          testCoordinates.emergencyLocationOlomouc
        );
      });

      const result = await Effect.runPromise(
        Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
      );

      expect(result.distance).toBe(198450);
      expect(result.duration).toBe(7200);
      expect(result.type).toBe("geojson");

      const geometry = JSON.parse(result.data);
      expect(geometry.type).toBe("LineString");
      expect(geometry.coordinates).toBeInstanceOf(Array);
      expect(geometry.coordinates.length).toBeGreaterThan(0);
    });

    it("should handle short routes correctly", async () => {
      const mockHttpClient = createMockHttpClient(mockMapyCzRoutingShortRoute);

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.getRoute(
          testCoordinates.fireStationOlomouc,
          testCoordinates.emergencyLocationOlomouc
        );
      });

      const result = await Effect.runPromise(
        Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
      );

      expect(result.distance).toBe(5420);
      expect(result.duration).toBe(480);
    });
  });

  describe("getRoute - Error Cases", () => {
    it("should return error when API returns 404 (route not found)", async () => {
      const mockHttpClient = createMockHttpClient(mockMapyCzRouting404Error, 404);

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.getRoute(
          testCoordinates.pragueCastle,
          testCoordinates.brnoCathedral
        );
      });

      await expect(
        Effect.runPromise(
          Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
        )
      ).rejects.toThrow("No route found");
    });

    it("should return error when API returns 401 (invalid API key)", async () => {
      const mockHttpClient = createMockHttpClient(mockMapyCzRouting401Error, 401);

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.getRoute(
          testCoordinates.pragueCastle,
          testCoordinates.brnoCathedral
        );
      });

      await expect(
        Effect.runPromise(
          Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
        )
      ).rejects.toThrow("Invalid API key");
    });

    it("should return error when API returns 500 (service unavailable)", async () => {
      const mockHttpClient = createMockHttpClient(mockMapyCzRouting503Error, 500);

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.getRoute(
          testCoordinates.pragueCastle,
          testCoordinates.brnoCathedral
        );
      });

      await expect(
        Effect.runPromise(
          Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
        )
      ).rejects.toThrow("Mapping service is unavailable");
    });

    it("should timeout after configured duration", async () => {
      const mockHttpClient = createTimeoutHttpClient(15000); // Longer than 10s timeout

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.getRoute(
          testCoordinates.pragueCastle,
          testCoordinates.brnoCathedral
        );
      });

      await expect(
        Effect.runPromise(
          Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
        )
      ).rejects.toThrow("timed out");
    });

    it("should fail when response has no geometry", async () => {
      const invalidResponse = {
        length: 5000,
        duration: 300,
        geometry: null, // Invalid!
      };
      const mockHttpClient = createMockHttpClient(invalidResponse);

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.getRoute(
          testCoordinates.pragueCastle,
          testCoordinates.brnoCathedral
        );
      });

      await expect(
        Effect.runPromise(
          Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
        )
      ).rejects.toThrow("No route found");
    });
  });

  describe("getRoute - Retry Logic", () => {
    it("should NOT retry on auth errors (401)", async () => {
      let callCount = 0;
      const mockExecute = () => {
        callCount++;
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            new Request("http://test.example.com"),
            new Response(JSON.stringify(mockMapyCzRouting401Error), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            })
          )
        );
      };

      const mockHttpClient = Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.HttpClient.of({
          execute: mockExecute,
          get: mockExecute,
          post: mockExecute,
          patch: mockExecute,
          put: mockExecute,
          del: mockExecute,
          head: mockExecute,
          options: mockExecute,
        } as any)
      );

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.getRoute(
          testCoordinates.pragueCastle,
          testCoordinates.brnoCathedral
        );
      });

      await expect(
        Effect.runPromise(
          Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
        )
      ).rejects.toThrow("Invalid API key");

      // Should only call once (no retries for auth errors)
      expect(callCount).toBe(1);
    });

    it("should NOT retry on 404 errors (route not found)", async () => {
      let callCount = 0;
      const mockExecute = () => {
        callCount++;
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            new Request("http://test.example.com"),
            new Response(JSON.stringify(mockMapyCzRouting404Error), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            })
          )
        );
      };

      const mockHttpClient = Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.HttpClient.of({
          execute: mockExecute,
          get: mockExecute,
          post: mockExecute,
          patch: mockExecute,
          put: mockExecute,
          del: mockExecute,
          head: mockExecute,
          options: mockExecute,
        } as any)
      );

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.getRoute(
          testCoordinates.pragueCastle,
          testCoordinates.brnoCathedral
        );
      });

      await expect(
        Effect.runPromise(
          Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
        )
      ).rejects.toThrow("No route found");

      // Should only call once (no retries for 404)
      expect(callCount).toBe(1);
    });

    it("should retry on network errors with exponential backoff", async () => {
      let callCount = 0;
      const mockExecute = () => {
        callCount++;
        // Fail first 2 times, succeed on 3rd
        if (callCount < 3) {
          return Effect.fail(
            new Error("Network failure")
          );
        }
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            new Request("http://test.example.com"),
            new Response(JSON.stringify(mockMapyCzRoutingSuccess), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          )
        );
      };

      const mockHttpClient = Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.HttpClient.of({
          execute: mockExecute,
          get: mockExecute,
          post: mockExecute,
          patch: mockExecute,
          put: mockExecute,
          del: mockExecute,
          head: mockExecute,
          options: mockExecute,
        } as any)
      );

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.getRoute(
          testCoordinates.pragueCastle,
          testCoordinates.brnoCathedral
        );
      });

      const result = await Effect.runPromise(
        Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
      );

      // Should succeed after retries
      expect(result.distance).toBe(198450);
      // Should have called 3 times (initial + 2 retries)
      expect(callCount).toBe(3);
    });
  });
});

describe("MapService - Static Map URL Generation", () => {
  describe("generateStaticMapUrl", () => {
    it("should generate URL with correct base parameters", async () => {
      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.generateStaticMapUrl(
          testCoordinates.fireStationOlomouc,
          testCoordinates.emergencyLocationOlomouc
        );
      });

      const url = await Effect.runPromise(
        Effect.provide(program, Layer.merge(MapServiceLive, MockConfigService))
      );

      expect(url).toContain("https://api.mapy.com/v1/static/map");
      expect(url).toContain(`apikey=${testAppConfig.map.apiKey}`);
      expect(url).toContain(`width=${testAppConfig.map.width}`);
      expect(url).toContain(`height=${testAppConfig.map.height}`);
      expect(url).toContain(`mapset=${testAppConfig.map.mapset}`);
    });

    it("should include markers for start and destination", async () => {
      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.generateStaticMapUrl(
          testCoordinates.fireStationOlomouc,
          testCoordinates.emergencyLocationOlomouc
        );
      });

      const url = await Effect.runPromise(
        Effect.provide(program, Layer.merge(MapServiceLive, MockConfigService))
      );

      // Check for start marker (green, label A)
      expect(url).toContain("color:green");
      expect(url).toContain("label:A");
      expect(url).toContain(`${testCoordinates.fireStationOlomouc.longitude},${testCoordinates.fireStationOlomouc.latitude}`);

      // Check for end marker (red, label B)
      expect(url).toContain("color:red");
      expect(url).toContain("label:B");
      expect(url).toContain(`${testCoordinates.emergencyLocationOlomouc.longitude},${testCoordinates.emergencyLocationOlomouc.latitude}`);
    });

    it("should include route path when provided", async () => {
      const routeGeometry = mockMapyCzRoutingSuccess.geometry.geometry;
      const routePath = JSON.stringify(routeGeometry);

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.generateStaticMapUrl(
          testCoordinates.fireStationOlomouc,
          testCoordinates.emergencyLocationOlomouc,
          routePath
        );
      });

      const url = await Effect.runPromise(
        Effect.provide(program, Layer.merge(MapServiceLive, MockConfigService))
      );

      // Should contain paths parameter (URL encoded)
      expect(url).toContain("paths=");
      expect(url).toMatch(/color.*blue/); // URL encoded
      expect(url).toMatch(/width.*3/);
      expect(url).toMatch(/path/);
    });

    it("should work without route path (markers only)", async () => {
      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.generateStaticMapUrl(
          testCoordinates.fireStationOlomouc,
          testCoordinates.emergencyLocationOlomouc
          // No routePath parameter
        );
      });

      const url = await Effect.runPromise(
        Effect.provide(program, Layer.merge(MapServiceLive, MockConfigService))
      );

      expect(url).toContain("https://api.mapy.com/v1/static/map");
      expect(url).toContain("markers=");
      expect(url).not.toContain("paths=");
    });

    it("should handle invalid route path gracefully", async () => {
      const invalidRoutePath = "not valid JSON";

      const program = Effect.gen(function* () {
        const mapService = yield* MapService;
        return yield* mapService.generateStaticMapUrl(
          testCoordinates.fireStationOlomouc,
          testCoordinates.emergencyLocationOlomouc,
          invalidRoutePath
        );
      });

      const url = await Effect.runPromise(
        Effect.provide(program, Layer.merge(MapServiceLive, MockConfigService))
      );

      // Should still generate URL without paths
      expect(url).toContain("https://api.mapy.com/v1/static/map");
      expect(url).not.toContain("paths=");
    });
  });
});

describe("MapService - Complete Flow", () => {
  it("should generate complete route map with imageUrl", async () => {
    const mockHttpClient = createMockHttpClient(mockMapyCzRoutingSuccess);

    const program = Effect.gen(function* () {
      const mapService = yield* MapService;
      return yield* mapService.generateRouteMap(
        testCoordinates.fireStationOlomouc,
        testCoordinates.emergencyLocationOlomouc
      );
    });

    const result = await Effect.runPromise(
      Effect.provide(program, Layer.mergeAll(MapService.Default, MockConfigService, mockHttpClient))
    );

    // Check MapResponse structure
    expect(result.imageUrl).toContain("https://api.mapy.com/v1/static/map");
    expect(result.imageUrl).toContain("apikey=");
    expect(result.imageUrl).toContain("paths="); // Should include route
    expect(result.format).toBe("png");
    expect(result.width).toBe(testAppConfig.map.width);
    expect(result.height).toBe(testAppConfig.map.height);

    // Check embedded route data
    expect(result.route).toBeDefined();
    expect(result.route?.distance).toBe(198450);
    expect(result.route?.duration).toBe(7200);
  });

  it("should propagate routing errors to generateRouteMap", async () => {
    const mockHttpClient = createMockHttpClient(mockMapyCzRouting401Error, 401);

    const program = Effect.gen(function* () {
      const mapService = yield* MapService;
      return yield* mapService.generateRouteMap(
        testCoordinates.pragueCastle,
        testCoordinates.brnoCathedral
      );
    });

    await expect(
      Effect.runPromise(
        Effect.provide(program, Layer.merge(MapServiceLive, Layer.merge(MockConfigService, mockHttpClient)))
      )
    ).rejects.toThrow("Invalid API key");
  });
});
