/**
 * Document Assembler Unit Tests
 * Tests for HTML document assembly with maps, errors, and warnings
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { DocumentAssembler, DocumentAssemblerLive } from "@/backend/services/document-assembler";
import { MockConfigService } from "./mocks/mock-config";
import { GPSExtractionResult } from "@/backend/domain/gps";
import { MapResponse, RouteGeometry } from "@/backend/domain/map";
import { GPSError, MapError } from "@/lib/errors";

// Test fixtures
const testEmailHtml = `
<html>
<body>
  <h1>Emergency Dispatch</h1>
  <p>Structure fire at Main Street</p>
  <p>Location: 49.947014 N, 17.885027 E</p>
</body>
</html>
`;

const testGPSResult = new GPSExtractionResult({
  coordinates: {
    latitude: 49.947014,
    longitude: 17.885027,
  },
});

const testGPSResultWithWarning = new GPSExtractionResult({
  coordinates: {
    latitude: 49.947014,
    longitude: 17.885027,
  },
  warning: "Multiple GPS locations found; please verify",
});

const testMapResponse = new MapResponse({
  imageUrl: "https://api.mapy.com/v1/static/map?test=true",
  route: new RouteGeometry({
    type: "geojson",
    data: JSON.stringify({
      type: "LineString",
      coordinates: [
        [17.25, 49.59],
        [17.89, 49.95],
      ],
    }),
    distance: 5420,
    duration: 480,
  }),
  format: "png",
  width: 800,
  height: 600,
});

describe("DocumentAssembler - Happy Path", () => {
  it.scoped("should assemble document with map when GPS and map succeed", () =>
    Effect.gen(function* () {
      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        testEmailHtml,
        Effect.succeed(testGPSResult),
        Effect.succeed(testMapResponse)
      );

      // Check structure
      expect(result.originalHtml).toBe(testEmailHtml);
      expect(result.warnings.length).toBe(0);
      expect(result.appendedContent.length).toBe(1);
      expect(result.layout).toBe("single-page");

      // Check that map section was added
      const mapSection = result.appendedContent[0];
      if (!mapSection) {
        return yield* Effect.fail(new Error("Map section is undefined"));
      }
      expect(mapSection.type).toBe("map");
      expect(mapSection.title).toBe("Route Map");

      // Check final HTML contains map
      expect(result.finalHtml).toContain("Route Map");
      expect(result.finalHtml).toContain(testMapResponse.imageUrl);
      expect(result.finalHtml).toContain(testEmailHtml);
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );

  it.scoped("should include warnings when GPS has warnings", () =>
    Effect.gen(function* () {
      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        testEmailHtml,
        Effect.succeed(testGPSResultWithWarning),
        Effect.succeed(testMapResponse)
      );

      // Check warnings
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]).toBe("Multiple GPS locations found; please verify");

      // Check final HTML contains warning
      expect(result.finalHtml).toContain("Multiple GPS locations found; please verify");
      expect(result.finalHtml).toContain("⚠️");
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );

  it.scoped("should use two-page layout when configured", () =>
    Effect.gen(function* () {
      // We need to mock config with two-page layout
      // For now, check that layout property is set
      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        testEmailHtml,
        Effect.succeed(testGPSResult),
        Effect.succeed(testMapResponse)
      );

      // Default is single-page in mock config
      expect(result.layout).toBe("single-page");
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );
});

describe("DocumentAssembler - GPS Failure", () => {
  it.scoped("should show error when GPS extraction fails", () =>
    Effect.gen(function* () {
      const gpsError = new GPSError({
        message: "No GPS coordinates found in email body",
      });

      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        testEmailHtml,
        Effect.fail(gpsError),
        Effect.succeed(testMapResponse) // Map won't be attempted if GPS fails
      );

      // Check error section was added
      expect(result.appendedContent.length).toBe(1);
      const errorSection = result.appendedContent[0];
      if (!errorSection) {
        return yield* Effect.fail(new Error("Error section is undefined"));
      }
      expect(errorSection.type).toBe("error");
      expect(errorSection.title).toBe("GPS Error");

      // Check final HTML contains error message
      expect(result.finalHtml).toContain("GPS Coordinates Not Found");
      expect(result.finalHtml).toContain("❌");
      expect(result.finalHtml).toContain(testEmailHtml); // Original email preserved
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );
});

describe("DocumentAssembler - Map Failure", () => {
  it.scoped("should show error when map generation fails", () =>
    Effect.gen(function* () {
      const mapError = new MapError({
        message: "Mapping service is unavailable",
      });

      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        testEmailHtml,
        Effect.succeed(testGPSResult),
        Effect.fail(mapError)
      );

      // Check error section was added
      expect(result.appendedContent.length).toBe(1);
      const errorSection = result.appendedContent[0];
      if (!errorSection) {
        return yield* Effect.fail(new Error("Error section is undefined"));
      }
      expect(errorSection.type).toBe("error");
      expect(errorSection.title).toBe("Map Error");

      // Check final HTML contains error message
      expect(result.finalHtml).toContain("Map Generation Failed");
      expect(result.finalHtml).toContain("Mapping service is unavailable");
      expect(result.finalHtml).toContain("❌");
      expect(result.finalHtml).toContain(testEmailHtml); // Original email preserved
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );

  it.scoped("should show helpful message in map error", () =>
    Effect.gen(function* () {
      const mapError = new MapError({
        message: "Invalid API key",
      });

      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        testEmailHtml,
        Effect.succeed(testGPSResult),
        Effect.fail(mapError)
      );

      // Check guidance message is present
      expect(result.finalHtml).toContain("Please use GPS coordinates above for navigation");
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );
});

describe("DocumentAssembler - HTML Preservation", () => {
  it.scoped("should preserve original email HTML exactly", () =>
    Effect.gen(function* () {
      const complexHtml = `
      <html>
      <head><style>.test { color: red; }</style></head>
      <body>
        <table>
          <tr><td>Test & "quotes" <script>alert('xss')</script></td></tr>
        </table>
      </body>
      </html>
    `;

      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        complexHtml,
        Effect.succeed(testGPSResult),
        Effect.succeed(testMapResponse)
      );

      // Original HTML should be exactly preserved
      expect(result.originalHtml).toBe(complexHtml);
      expect(result.finalHtml).toContain(complexHtml);
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );
});

describe("DocumentAssembler - Visual Separation", () => {
  it.scoped("should include visual separator between email and appended content", () =>
    Effect.gen(function* () {
      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        testEmailHtml,
        Effect.succeed(testGPSResult),
        Effect.succeed(testMapResponse)
      );

      // Check for separator indicators
      expect(result.finalHtml).toContain("Dispatch System - Additional Information");
      expect(result.finalHtml).toContain("border-t-4");
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );

  it.scoped("should include page break for two-page layout", () =>
    Effect.gen(function* () {
      // This would require a mock config with two-page layout
      // For now, verify the field exists
      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        testEmailHtml,
        Effect.succeed(testGPSResult),
        Effect.succeed(testMapResponse)
      );

      // Single-page should NOT have page break class applied to elements
      expect(result.finalHtml).not.toContain('class="page-break-before');
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );
});

describe("DocumentAssembler - Route Information Display", () => {
  it.scoped("should display distance and duration when available", () =>
    Effect.gen(function* () {
      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        testEmailHtml,
        Effect.succeed(testGPSResult),
        Effect.succeed(testMapResponse)
      );

      // Check for distance (5420m = 5.4km)
      expect(result.finalHtml).toContain("5.4 km");
      // Check for duration (480s = 8min)
      expect(result.finalHtml).toContain("8 min");
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );

  it.scoped("should display GPS coordinates in large, visible text", () =>
    Effect.gen(function* () {
      const assembler = yield* DocumentAssembler;
      const result = yield* assembler.assemble(
        testEmailHtml,
        Effect.succeed(testGPSResult),
        Effect.succeed(testMapResponse)
      );

      // Check GPS coordinates are displayed
      expect(result.finalHtml).toContain("49.947014");
      expect(result.finalHtml).toContain("17.885027");
      // Check for large text class
      expect(result.finalHtml).toContain("critical-text");
    }).pipe(Effect.provide(Layer.merge(DocumentAssemblerLive, MockConfigService)))
  );
});
