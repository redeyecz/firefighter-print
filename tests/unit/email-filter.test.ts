/**
 * Email Filter Service Unit Tests
 */

import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { EmailFilter, EmailFilterLive } from "@/backend/services/email-filter";
import { mockDispatchEmailWithGPS } from "./mocks/email-fixtures";
import type { FilterConfig } from "@/backend/config/schema";

describe("EmailFilter", () => {
  const layer = EmailFilterLive;

  describe("Sender Email Matching", () => {
    it("should match sender email (exact match, case insensitive)", async () => {
      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.matchesSender(mockDispatchEmailWithGPS, "dispatch@firedept.com");
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toBe(true);
    });

    it("should match sender email with different case", async () => {
      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.matchesSender(mockDispatchEmailWithGPS, "DISPATCH@FIREDEPT.COM");
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toBe(true);
    });

    it("should not match different sender", async () => {
      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.matchesSender(mockDispatchEmailWithGPS, "other@firedept.com");
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toBe(false);
    });
  });

  describe("Subject Contains Matching", () => {
    it("should match subject contains (case insensitive)", async () => {
      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.matchesSubject(mockDispatchEmailWithGPS, "DISPATCH");
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toBe(true);
    });

    it("should match subject with different case", async () => {
      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.matchesSubject(mockDispatchEmailWithGPS, "structure fire");
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toBe(true);
    });

    it("should not match if subject doesn't contain string", async () => {
      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.matchesSubject(mockDispatchEmailWithGPS, "Medical");
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toBe(false);
    });
  });

  describe("Subject Regex Matching", () => {
    it("should match valid regex pattern", async () => {
      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.matchesRegex(mockDispatchEmailWithGPS, "^DISPATCH:.*");
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toBe(true);
    });

    it("should not match non-matching regex", async () => {
      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.matchesRegex(mockDispatchEmailWithGPS, "^MEDICAL:.*");
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toBe(false);
    });

    it("should fail with invalid regex pattern", async () => {
      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.matchesRegex(mockDispatchEmailWithGPS, "[invalid(regex");
      });

      await expect(Effect.runPromise(Effect.provide(program, layer))).rejects.toThrow(
        "Invalid regex pattern"
      );
    });
  });

  describe("Filter Application with AND Logic", () => {
    it("should match when only sender filter is configured and matches", async () => {
      const filterConfig: FilterConfig = {
        senderEmail: "dispatch@firedept.com",
      };

      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.matched).toBe(true);
      expect(result.matchedFilters).toContain("sender");
    });

    it("should match when only subject filter is configured and matches", async () => {
      const filterConfig: FilterConfig = {
        subjectContains: "DISPATCH",
      };

      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.matched).toBe(true);
      expect(result.matchedFilters).toContain("subjectContains");
    });

    it("should match when both sender and subject match (AND logic)", async () => {
      const filterConfig: FilterConfig = {
        senderEmail: "dispatch@firedept.com",
        subjectContains: "Structure Fire",
      };

      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.matched).toBe(true);
      expect(result.matchedFilters).toContain("sender");
      expect(result.matchedFilters).toContain("subjectContains");
    });

    it("should not match when sender matches but subject doesn't (AND logic)", async () => {
      const filterConfig: FilterConfig = {
        senderEmail: "dispatch@firedept.com",
        subjectContains: "Medical Emergency",
      };

      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.matched).toBe(false);
      expect(result.matchedFilters).toContain("sender");
      expect(result.matchedFilters).not.toContain("subjectContains");
    });

    it("should not match when subject matches but sender doesn't (AND logic)", async () => {
      const filterConfig: FilterConfig = {
        senderEmail: "other@firedept.com",
        subjectContains: "DISPATCH",
      };

      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.matched).toBe(false);
      expect(result.matchedFilters).not.toContain("sender");
      expect(result.matchedFilters).toContain("subjectContains");
    });

    it("should match with regex filter", async () => {
      const filterConfig: FilterConfig = {
        subjectRegex: "^DISPATCH:.*Fire.*",
      };

      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.matched).toBe(true);
      expect(result.matchedFilters).toContain("subjectRegex");
    });

    it("should accept all emails when no filters are configured", async () => {
      const filterConfig: FilterConfig = {};

      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.matched).toBe(true);
      expect(result.reason).toContain("No filters configured");
    });
  });

  describe("Mutual Exclusivity Validation", () => {
    it("should fail when both subjectContains and subjectRegex are configured", async () => {
      const filterConfig: FilterConfig = {
        subjectContains: "DISPATCH",
        subjectRegex: "^DISPATCH:.*",
      };

      const program = Effect.gen(function* () {
        const filter = yield* EmailFilter;
        return yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
      });

      await expect(Effect.runPromise(Effect.provide(program, layer))).rejects.toThrow(
        "mutually exclusive"
      );
    });
  });
});
