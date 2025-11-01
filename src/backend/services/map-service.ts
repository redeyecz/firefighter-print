/**
 * Map Service - Mapy.cz Integration
 * Generates route maps using Mapy.cz API (Seznam)
 */

import { Effect, Context, Layer, Schedule } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientError } from "@effect/platform";
import type { GPSCoordinates } from "@/backend/domain/gps";
import { MapResponse, RouteGeometry } from "@/backend/domain/map";
import { MapError } from "@/lib/errors";
import { ConfigService } from "@/backend/config/loader";

/**
 * Mapy.cz API Response Types (based on official OpenAPI spec)
 * See: https://api.mapy.com/v1/docs/routing/openapi.json
 */
interface MapyCzRoutingResponse {
  length: number; // Route length in meters
  duration: number; // Route duration in seconds
  geometry: {
    type: "Feature";
    geometry: {
      type: "LineString";
      coordinates: number[][]; // Array of [longitude, latitude] pairs
    };
    properties: Record<string, unknown>;
  };
}

/**
 * Map Service interface
 */
export interface IMapService {
  /**
   * Generate a route map from start to destination
   */
  readonly generateRouteMap: (
    startPoint: GPSCoordinates,
    destination: GPSCoordinates
  ) => Effect.Effect<MapResponse, MapError, ConfigService | HttpClient.HttpClient>;

  /**
   * Get routing path between two points
   */
  readonly getRoute: (
    startPoint: GPSCoordinates,
    destination: GPSCoordinates
  ) => Effect.Effect<RouteGeometry, MapError, ConfigService | HttpClient.HttpClient>;

  /**
   * Generate static map URL with route
   */
  readonly generateStaticMapUrl: (
    startPoint: GPSCoordinates,
    destination: GPSCoordinates,
    routePath?: string
  ) => Effect.Effect<string, MapError, ConfigService>;
}

/**
 * MapService tag
 */
export class MapService extends Context.Tag("MapService")<MapService, IMapService>() {}

/**
 * Encode coordinates as polyline for Mapy.cz
 */
const coordinatesToPolylineParam = (
  startPoint: GPSCoordinates,
  destination: GPSCoordinates,
  routeCoords?: number[][]
): string => {
  if (!routeCoords || routeCoords.length === 0) {
    // Simple line from start to destination
    return `color:blue;width:3;path:[(${startPoint.longitude},${startPoint.latitude};${destination.longitude},${destination.latitude})]`;
  }

  // Convert route coordinates to path string
  const pathPoints = routeCoords.map(([lon, lat]) => `${lon},${lat}`).join(";");
  return `color:blue;width:3;path:[(${pathPoints})]`;
};

/**
 * Parse HTTP error to MapError
 */
const parseHttpError = (error: unknown): MapError => {
  if (HttpClientError.isHttpClientError(error)) {
    if (error._tag === "RequestError") {
      return new MapError({
        message: "Network error while connecting to mapping service",
        cause: error,
      });
    }

    if (error._tag === "ResponseError") {
      const status = error.response.status;

      if (status === 401 || status === 403) {
        return new MapError({
          message: "Invalid API key",
          cause: error,
        });
      }

      if (status === 404) {
        return new MapError({
          message: "Route not found between coordinates",
          cause: error,
        });
      }

      if (status >= 500) {
        return new MapError({
          message: "Mapping service is unavailable",
          cause: error,
        });
      }

      return new MapError({
        message: `Mapping service error: ${status}`,
        cause: error,
      });
    }
  }

  return new MapError({
    message: "Unknown mapping service error",
    cause: error,
  });
};

/**
 * Create MapService implementation
 */
const makeMapService = (): IMapService => {
  /**
   * Get route from Mapy.cz Routing API
   */
  const getRoute = (
    startPoint: GPSCoordinates,
    destination: GPSCoordinates
  ): Effect.Effect<RouteGeometry, MapError, ConfigService | HttpClient.HttpClient> =>
    Effect.gen(function* () {
      const config = yield* ConfigService;
      const appConfig = yield* Effect.mapError(
        config.getConfig(),
        (configError) =>
          new MapError({
            message: `Configuration error: ${configError.message}`,
            cause: configError,
          })
      );
      const mapConfig = appConfig.map;

      // Build routing API URL
      const routingUrl = new URL("https://api.mapy.com/v1/routing");
      routingUrl.searchParams.set("apikey", mapConfig.apiKey);
      routingUrl.searchParams.set("start", `${startPoint.longitude},${startPoint.latitude}`);
      routingUrl.searchParams.set("end", `${destination.longitude},${destination.latitude}`);
      routingUrl.searchParams.set("routeType", mapConfig.routeType);
      routingUrl.searchParams.set("format", "geojson");

      // Make HTTP request with timeout
      const response = yield* HttpClientRequest.get(routingUrl.toString()).pipe(
        HttpClient.execute,
        Effect.flatMap((res) => res.json),
        Effect.timeout(`${mapConfig.timeoutMs} millis`),
        Effect.mapError((error) => {
          if (error._tag === "TimeoutException") {
            return new MapError({
              message: "Mapping service request timed out",
              cause: error,
            });
          }
          return parseHttpError(error);
        })
      );

      // Parse response
      const routingData = response as MapyCzRoutingResponse;

      // Validate response has required fields
      if (!routingData.geometry || !routingData.geometry.geometry) {
        return yield* Effect.fail(
          new MapError({
            message: "No route found between coordinates",
          })
        );
      }

      // Convert GeoJSON Feature to string for storage
      const geometryString = JSON.stringify(routingData.geometry.geometry);

      return new RouteGeometry({
        type: "geojson",
        data: geometryString,
        distance: routingData.length,
        duration: routingData.duration,
      });
    }).pipe(
      // Retry on transient failures (not on auth errors)
      Effect.retry({
        schedule: Schedule.exponential("2 seconds").pipe(Schedule.compose(Schedule.recurs(3))),
        while: (error) => {
          // Don't retry on auth errors or invalid coordinates
          return (
            !error.message.includes("Invalid API key") &&
            !error.message.includes("Route not found") &&
            !error.message.includes("Configuration error")
          );
        },
      })
    );

  /**
   * Generate static map URL
   */
  const generateStaticMapUrl = (
    startPoint: GPSCoordinates,
    destination: GPSCoordinates,
    routePath?: string
  ): Effect.Effect<string, MapError, ConfigService> =>
    Effect.gen(function* () {
      const config = yield* ConfigService;
      const appConfig = yield* Effect.mapError(
        config.getConfig(),
        (configError) =>
          new MapError({
            message: `Configuration error: ${configError.message}`,
            cause: configError,
          })
      );
      const mapConfig = appConfig.map;

      const staticMapUrl = new URL("https://api.mapy.com/v1/static/map");
      staticMapUrl.searchParams.set("apikey", mapConfig.apiKey);
      staticMapUrl.searchParams.set("width", mapConfig.width.toString());
      staticMapUrl.searchParams.set("height", mapConfig.height.toString());
      staticMapUrl.searchParams.set("mapset", mapConfig.mapset);

      // Add markers for start and destination
      const startMarker = `color:green;size:large;label:A;${startPoint.longitude},${startPoint.latitude}`;
      const endMarker = `color:red;size:large;label:B;${destination.longitude},${destination.latitude}`;
      staticMapUrl.searchParams.set("markers", `${startMarker}|${endMarker}`);

      // Add route path if provided
      if (routePath) {
        try {
          const geometry = JSON.parse(routePath);
          const pathParam = coordinatesToPolylineParam(
            startPoint,
            destination,
            geometry.coordinates
          );
          staticMapUrl.searchParams.set("paths", pathParam);
        } catch {
          // If parsing fails, just show markers without path
        }
      }

      return staticMapUrl.toString();
    });

  /**
   * Generate complete route map
   */
  const generateRouteMap = (
    startPoint: GPSCoordinates,
    destination: GPSCoordinates
  ): Effect.Effect<MapResponse, MapError, ConfigService | HttpClient.HttpClient> =>
    Effect.gen(function* () {
      const config = yield* ConfigService;
      const appConfig = yield* Effect.mapError(
        config.getConfig(),
        (configError) =>
          new MapError({
            message: `Configuration error: ${configError.message}`,
            cause: configError,
          })
      );
      const mapConfig = appConfig.map;

      // Get route geometry
      const route = yield* getRoute(startPoint, destination);

      // Generate static map URL with route
      const imageUrl = yield* generateStaticMapUrl(startPoint, destination, route.data);

      return new MapResponse({
        imageUrl,
        route,
        format: "png",
        width: mapConfig.width,
        height: mapConfig.height,
      });
    });

  return {
    getRoute,
    generateStaticMapUrl,
    generateRouteMap,
  };
};

/**
 * MapService Layer (without HttpClient - for testing)
 * Use this in tests to provide your own HttpClient mock
 */
export const MapServiceLayer = Layer.effect(
  MapService,
  Effect.gen(function* () {
    return makeMapService();
  })
);

/**
 * MapService Layer (with FetchHttpClient)
 * Use this in production
 */
export const MapServiceLive = MapServiceLayer.pipe(Layer.provide(FetchHttpClient.layer));
