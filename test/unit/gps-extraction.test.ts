/**
 * GPS Extraction Service Unit Tests
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect } from "effect";
import { GPSExtraction, GPSExtractionLive } from "@/backend/services/gps-extraction";
import { mockDispatchEmailNoGPS, mockDispatchEmailMultipleGPS } from "./mocks/email-fixtures";
import type { Email } from "@/backend/domain/email";

describe("GPSExtraction", () => {
  const layer = GPSExtractionLive;

  // Helper to check if two numbers are close (precision of 5 decimal places)
  const assertCloseTo = (actual: number, expected: number, precision = 5) => {
    const factor = Math.pow(10, precision);
    const roundedActual = Math.round(actual * factor) / factor;
    const roundedExpected = Math.round(expected * factor) / factor;
    expect(roundedActual).toBe(roundedExpected);
  };

  describe("Decimal Degrees Format", () => {
    it.scoped("should extract GPS coordinates in standard format (49.947014 N, 17.885027 E)", () =>
      Effect.gen(function* () {
        // Use a fresh email to avoid multiple GPS from mock fixtures
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 49.947014 N, 17.885027 E",
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        assertCloseTo(result.coordinates.latitude, 49.947014, 5);
        assertCloseTo(result.coordinates.longitude, 17.885027, 5);
        expect(result.warning).toBeUndefined();
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should extract coordinates without spaces (49.947014N, 17.885027E)", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Emergency at location: 49.947014N, 17.885027E",
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        assertCloseTo(result.coordinates.latitude, 49.947014, 5);
        assertCloseTo(result.coordinates.longitude, 17.885027, 5);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should extract coordinates with degree symbols (49.947014° N, 17.885027° E)", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Emergency at location: 49.947014° N, 17.885027° E",
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        assertCloseTo(result.coordinates.latitude, 49.947014, 5);
        assertCloseTo(result.coordinates.longitude, 17.885027, 5);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should handle South and West directions (negative coordinates)", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 33.5 S, 70.5 W",
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        assertCloseTo(result.coordinates.latitude, -33.5, 5);
        assertCloseTo(result.coordinates.longitude, -70.5, 5);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should handle case-insensitive directions (n, s, e, w)", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 49.947014 n, 17.885027 e",
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        assertCloseTo(result.coordinates.latitude, 49.947014, 5);
        assertCloseTo(result.coordinates.longitude, 17.885027, 5);
      }).pipe(Effect.provide(layer))
    );
  });

  describe("HTML Parsing", () => {
    it.scoped("should extract coordinates from HTML content", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          html: "<p>Emergency dispatch</p><p>GPS: 49.947014 N, 17.885027 E</p>",
          text: undefined,
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        assertCloseTo(result.coordinates.latitude, 49.947014, 5);
        assertCloseTo(result.coordinates.longitude, 17.885027, 5);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should handle HTML entities and tags", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          html: "<div>Location:&nbsp;49.947014&nbsp;N,<br/>17.885027&nbsp;E</div>",
          text: undefined,
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        assertCloseTo(result.coordinates.latitude, 49.947014, 5);
        assertCloseTo(result.coordinates.longitude, 17.885027, 5);
      }).pipe(Effect.provide(layer))
    );
  });

  describe("Multiple Coordinates", () => {
    it.scoped("should return first coordinate with warning when multiple found", () =>
      Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(mockDispatchEmailMultipleGPS);
        assertCloseTo(result.coordinates.latitude, 50.123456, 5);
        assertCloseTo(result.coordinates.longitude, 18.654321, 5);
        expect(result.warning).toBe("Multiple GPS locations found; please verify");
      }).pipe(Effect.provide(layer))
    );
  });

  describe("No Coordinates Found", () => {
    it.scoped("should fail when no GPS coordinates are in email", () =>
      Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        const error = yield* Effect.flip(gps.extractGPS(mockDispatchEmailNoGPS));
        expect(error.message).toContain("GPS coordinates not found in email");
      }).pipe(Effect.provide(layer))
    );
  });

  describe("Coordinate Validation", () => {
    it.scoped("should reject latitude outside valid range (> 90)", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 95.0 N, 17.885027 E",
        };

        const gps = yield* GPSExtraction;
        const error = yield* Effect.flip(gps.extractGPS(email));
        expect(error).toBeDefined();
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should reject latitude outside valid range (< -90)", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 95.0 S, 17.885027 E",
        };

        const gps = yield* GPSExtraction;
        const error = yield* Effect.flip(gps.extractGPS(email));
        expect(error).toBeDefined();
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should reject longitude outside valid range (> 180)", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 49.947014 N, 185.0 E",
        };

        const gps = yield* GPSExtraction;
        const error = yield* Effect.flip(gps.extractGPS(email));
        expect(error).toBeDefined();
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should reject longitude outside valid range (< -180)", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 49.947014 N, 185.0 W",
        };

        const gps = yield* GPSExtraction;
        const error = yield* Effect.flip(gps.extractGPS(email));
        expect(error).toBeDefined();
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should accept coordinates at valid boundaries (90, 180)", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 90.0 N, 180.0 E",
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        expect(result.coordinates.latitude).toBe(90);
        expect(result.coordinates.longitude).toBe(180);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should accept coordinates at valid boundaries (-90, -180)", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 90.0 S, 180.0 W",
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        expect(result.coordinates.latitude).toBe(-90);
        expect(result.coordinates.longitude).toBe(-180);
      }).pipe(Effect.provide(layer))
    );
  });

  describe("Edge Cases", () => {
    it.scoped("should extract from subject if no text or html", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "DISPATCH: 49.947014 N, 17.885027 E",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: undefined,
          html: undefined,
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        assertCloseTo(result.coordinates.latitude, 49.947014, 5);
        assertCloseTo(result.coordinates.longitude, 17.885027, 5);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should handle coordinates with varying decimal precision", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 49.9 N, 17.88 E",
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        assertCloseTo(result.coordinates.latitude, 49.9, 5);
        assertCloseTo(result.coordinates.longitude, 17.88, 5);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should handle integer coordinates", () =>
      Effect.gen(function* () {
        const email: Email = {
          uid: 999,
          subject: "Test",
          from: "test@test.com",
          to: "test@test.com",
          receivedDate: new Date(),
          flags: [],
          text: "Location: 50 N, 18 E",
        };

        const gps = yield* GPSExtraction;
        const result = yield* gps.extractGPS(email);
        expect(result.coordinates.latitude).toBe(50);
        expect(result.coordinates.longitude).toBe(18);
      }).pipe(Effect.provide(layer))
    );
  });
});
