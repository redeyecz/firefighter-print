/**
 * GPS Extraction Service Unit Tests
 */

import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { GPSExtraction, GPSExtractionLive } from "@/backend/services/gps-extraction";
import {
  mockDispatchEmailNoGPS,
  mockDispatchEmailMultipleGPS,
} from "./mocks/email-fixtures";
import type { Email } from "@/backend/domain/email";

describe("GPSExtraction", () => {
  const layer = GPSExtractionLive;

  describe("Decimal Degrees Format", () => {
    it("should extract GPS coordinates in standard format (49.947014 N, 17.885027 E)", async () => {
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

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBeCloseTo(49.947014, 5);
      expect(result.coordinates.longitude).toBeCloseTo(17.885027, 5);
      expect(result.warning).toBeUndefined();
    });

    it("should extract coordinates without spaces (49.947014N, 17.885027E)", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Emergency at location: 49.947014N, 17.885027E",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBeCloseTo(49.947014, 5);
      expect(result.coordinates.longitude).toBeCloseTo(17.885027, 5);
    });

    it("should extract coordinates with degree symbols (49.947014° N, 17.885027° E)", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Emergency at location: 49.947014° N, 17.885027° E",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBeCloseTo(49.947014, 5);
      expect(result.coordinates.longitude).toBeCloseTo(17.885027, 5);
    });

    it("should handle South and West directions (negative coordinates)", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Location: 33.5 S, 70.5 W",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBeCloseTo(-33.5, 5);
      expect(result.coordinates.longitude).toBeCloseTo(-70.5, 5);
    });

    it("should handle case-insensitive directions (n, s, e, w)", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Location: 49.947014 n, 17.885027 e",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBeCloseTo(49.947014, 5);
      expect(result.coordinates.longitude).toBeCloseTo(17.885027, 5);
    });
  });

  describe("HTML Parsing", () => {
    it("should extract coordinates from HTML content", async () => {
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

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBeCloseTo(49.947014, 5);
      expect(result.coordinates.longitude).toBeCloseTo(17.885027, 5);
    });

    it("should handle HTML entities and tags", async () => {
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

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBeCloseTo(49.947014, 5);
      expect(result.coordinates.longitude).toBeCloseTo(17.885027, 5);
    });
  });

  describe("Multiple Coordinates", () => {
    it("should return first coordinate with warning when multiple found", async () => {
      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(mockDispatchEmailMultipleGPS);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBeCloseTo(50.123456, 5);
      expect(result.coordinates.longitude).toBeCloseTo(18.654321, 5);
      expect(result.warning).toBe("Multiple GPS locations found; please verify");
    });
  });

  describe("No Coordinates Found", () => {
    it("should fail when no GPS coordinates are in email", async () => {
      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(mockDispatchEmailNoGPS);
      });

      await expect(Effect.runPromise(Effect.provide(program, layer))).rejects.toThrow(
        "GPS coordinates not found in email"
      );
    });
  });

  describe("Coordinate Validation", () => {
    it("should reject latitude outside valid range (> 90)", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Location: 95.0 N, 17.885027 E",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      await expect(Effect.runPromise(Effect.provide(program, layer))).rejects.toThrow();
    });

    it("should reject latitude outside valid range (< -90)", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Location: 95.0 S, 17.885027 E",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      await expect(Effect.runPromise(Effect.provide(program, layer))).rejects.toThrow();
    });

    it("should reject longitude outside valid range (> 180)", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Location: 49.947014 N, 185.0 E",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      await expect(Effect.runPromise(Effect.provide(program, layer))).rejects.toThrow();
    });

    it("should reject longitude outside valid range (< -180)", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Location: 49.947014 N, 185.0 W",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      await expect(Effect.runPromise(Effect.provide(program, layer))).rejects.toThrow();
    });

    it("should accept coordinates at valid boundaries (90, 180)", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Location: 90.0 N, 180.0 E",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBe(90);
      expect(result.coordinates.longitude).toBe(180);
    });

    it("should accept coordinates at valid boundaries (-90, -180)", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Location: 90.0 S, 180.0 W",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBe(-90);
      expect(result.coordinates.longitude).toBe(-180);
    });
  });

  describe("Edge Cases", () => {
    it("should extract from subject if no text or html", async () => {
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

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBeCloseTo(49.947014, 5);
      expect(result.coordinates.longitude).toBeCloseTo(17.885027, 5);
    });

    it("should handle coordinates with varying decimal precision", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Location: 49.9 N, 17.88 E",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBeCloseTo(49.9, 5);
      expect(result.coordinates.longitude).toBeCloseTo(17.88, 5);
    });

    it("should handle integer coordinates", async () => {
      const email: Email = {
        uid: 999,
        subject: "Test",
        from: "test@test.com",
        to: "test@test.com",
        receivedDate: new Date(),
        flags: [],
        text: "Location: 50 N, 18 E",
      };

      const program = Effect.gen(function* () {
        const gps = yield* GPSExtraction;
        return yield* gps.extractGPS(email);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.coordinates.latitude).toBe(50);
      expect(result.coordinates.longitude).toBe(18);
    });
  });
});
