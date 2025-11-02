/**
 * Email Filter Service Unit Tests
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect } from "effect";
import { EmailFilter, EmailFilterLive } from "@/backend/services/email-filter";
import { mockDispatchEmailWithGPS } from "./mocks/email-fixtures";
import type { FilterConfig } from "@/backend/config/schema";

describe("EmailFilter", () => {
  const layer = EmailFilterLive;

  describe("Sender Email Matching", () => {
    it.scoped("should match sender email (exact match, case insensitive)", () =>
      Effect.gen(function* () {
        const filter = yield* EmailFilter;
        const result = yield* filter.matchesSender(
          mockDispatchEmailWithGPS,
          "dispatch@firedept.com"
        );
        expect(result).toBe(true);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should match sender email with different case", () =>
      Effect.gen(function* () {
        const filter = yield* EmailFilter;
        const result = yield* filter.matchesSender(
          mockDispatchEmailWithGPS,
          "DISPATCH@FIREDEPT.COM"
        );
        expect(result).toBe(true);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should not match different sender", () =>
      Effect.gen(function* () {
        const filter = yield* EmailFilter;
        const result = yield* filter.matchesSender(mockDispatchEmailWithGPS, "other@firedept.com");
        expect(result).toBe(false);
      }).pipe(Effect.provide(layer))
    );
  });

  describe("Subject Contains Matching", () => {
    it.scoped("should match subject contains (case insensitive)", () =>
      Effect.gen(function* () {
        const filter = yield* EmailFilter;
        const result = yield* filter.matchesSubject(mockDispatchEmailWithGPS, "DISPATCH");
        expect(result).toBe(true);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should match subject with different case", () =>
      Effect.gen(function* () {
        const filter = yield* EmailFilter;
        const result = yield* filter.matchesSubject(mockDispatchEmailWithGPS, "structure fire");
        expect(result).toBe(true);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should not match if subject doesn't contain string", () =>
      Effect.gen(function* () {
        const filter = yield* EmailFilter;
        const result = yield* filter.matchesSubject(mockDispatchEmailWithGPS, "Medical");
        expect(result).toBe(false);
      }).pipe(Effect.provide(layer))
    );
  });

  describe("Subject Regex Matching", () => {
    it.scoped("should match valid regex pattern", () =>
      Effect.gen(function* () {
        const filter = yield* EmailFilter;
        const result = yield* filter.matchesRegex(mockDispatchEmailWithGPS, "^DISPATCH:.*");
        expect(result).toBe(true);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should not match non-matching regex", () =>
      Effect.gen(function* () {
        const filter = yield* EmailFilter;
        const result = yield* filter.matchesRegex(mockDispatchEmailWithGPS, "^MEDICAL:.*");
        expect(result).toBe(false);
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should fail with invalid regex pattern", () =>
      Effect.gen(function* () {
        const filter = yield* EmailFilter;
        const error = yield* Effect.flip(
          filter.matchesRegex(mockDispatchEmailWithGPS, "[invalid(regex")
        );
        expect(error.message).toContain("Invalid regex pattern");
      }).pipe(Effect.provide(layer))
    );
  });

  describe("Filter Application with AND Logic", () => {
    it.scoped("should match when only sender filter is configured and matches", () =>
      Effect.gen(function* () {
        const filterConfig: FilterConfig = {
          senderEmail: "dispatch@firedept.com",
        };

        const filter = yield* EmailFilter;
        const result = yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
        expect(result.matched).toBe(true);
        expect(result.matchedFilters).toContain("sender");
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should match when only subject filter is configured and matches", () =>
      Effect.gen(function* () {
        const filterConfig: FilterConfig = {
          subjectContains: "DISPATCH",
        };

        const filter = yield* EmailFilter;
        const result = yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
        expect(result.matched).toBe(true);
        expect(result.matchedFilters).toContain("subjectContains");
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should match when both sender and subject match (AND logic)", () =>
      Effect.gen(function* () {
        const filterConfig: FilterConfig = {
          senderEmail: "dispatch@firedept.com",
          subjectContains: "Structure Fire",
        };

        const filter = yield* EmailFilter;
        const result = yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
        expect(result.matched).toBe(true);
        expect(result.matchedFilters).toContain("sender");
        expect(result.matchedFilters).toContain("subjectContains");
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should not match when sender matches but subject doesn't (AND logic)", () =>
      Effect.gen(function* () {
        const filterConfig: FilterConfig = {
          senderEmail: "dispatch@firedept.com",
          subjectContains: "Medical Emergency",
        };

        const filter = yield* EmailFilter;
        const result = yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
        expect(result.matched).toBe(false);
        expect(result.matchedFilters).toContain("sender");
        expect(result.matchedFilters).not.toContain("subjectContains");
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should not match when subject matches but sender doesn't (AND logic)", () =>
      Effect.gen(function* () {
        const filterConfig: FilterConfig = {
          senderEmail: "other@firedept.com",
          subjectContains: "DISPATCH",
        };

        const filter = yield* EmailFilter;
        const result = yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
        expect(result.matched).toBe(false);
        expect(result.matchedFilters).not.toContain("sender");
        expect(result.matchedFilters).toContain("subjectContains");
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should match with regex filter", () =>
      Effect.gen(function* () {
        const filterConfig: FilterConfig = {
          subjectRegex: "^DISPATCH:.*Fire.*",
        };

        const filter = yield* EmailFilter;
        const result = yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
        expect(result.matched).toBe(true);
        expect(result.matchedFilters).toContain("subjectRegex");
      }).pipe(Effect.provide(layer))
    );

    it.scoped("should accept all emails when no filters are configured", () =>
      Effect.gen(function* () {
        const filterConfig: FilterConfig = {};

        const filter = yield* EmailFilter;
        const result = yield* filter.applyFilters(mockDispatchEmailWithGPS, filterConfig);
        expect(result.matched).toBe(true);
        expect(result.reason !== undefined && result.reason).toContain("No filters configured");
      }).pipe(Effect.provide(layer))
    );
  });

  describe("Mutual Exclusivity Validation", () => {
    it.scoped("should fail when both subjectContains and subjectRegex are configured", () =>
      Effect.gen(function* () {
        const filterConfig: FilterConfig = {
          subjectContains: "DISPATCH",
          subjectRegex: "^DISPATCH:.*",
        };

        const filter = yield* EmailFilter;
        const error = yield* Effect.flip(
          filter.applyFilters(mockDispatchEmailWithGPS, filterConfig)
        );
        expect(error.message).toContain("mutually exclusive");
      }).pipe(Effect.provide(layer))
    );
  });
});
