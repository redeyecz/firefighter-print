/**
 * Email Filter Service
 * Filters emails based on configurable rules
 */

import { Effect, Context, Layer } from "effect";
import type { Email } from "@/backend/domain/email";
import type { FilterConfig } from "@/backend/config/schema";
import { FilterMatchResult } from "@/backend/domain/filter";
import { ConfigError } from "@/lib/errors";

/**
 * EmailFilter service interface
 */
export interface IEmailFilter {
  readonly matchesSender: (email: Email, senderEmail: string) => Effect.Effect<boolean, never>;
  readonly matchesSubject: (email: Email, subjectContains: string) => Effect.Effect<boolean, never>;
  readonly matchesRegex: (
    email: Email,
    subjectRegex: string
  ) => Effect.Effect<boolean, ConfigError>;
  readonly applyFilters: (
    email: Email,
    filterConfig: FilterConfig
  ) => Effect.Effect<FilterMatchResult, ConfigError>;
}

/**
 * EmailFilter service tag
 */
export class EmailFilter extends Context.Tag("EmailFilter")<EmailFilter, IEmailFilter>() {}

/**
 * Validate filter configuration for mutual exclusivity
 */
export const validateFilterConfig = (
  filterConfig: FilterConfig
): Effect.Effect<void, ConfigError> =>
  Effect.gen(function* () {
    if (filterConfig.subjectContains && filterConfig.subjectRegex) {
      return yield* Effect.fail(
        new ConfigError({
          message: "subjectContains and subjectRegex are mutually exclusive",
          field: "filter",
        })
      );
    }
  });

/**
 * Create EmailFilter implementation
 */
const makeEmailFilter = (): IEmailFilter => {
  /**
   * Check if email sender matches the filter
   * Case-insensitive exact match
   */
  const matchesSender = (email: Email, senderEmail: string): Effect.Effect<boolean, never> =>
    Effect.sync(() => {
      return email.from.toLowerCase() === senderEmail.toLowerCase();
    });

  /**
   * Check if email subject contains the filter string
   * Case-insensitive partial match
   */
  const matchesSubject = (email: Email, subjectContains: string): Effect.Effect<boolean, never> =>
    Effect.sync(() => {
      return email.subject.toLowerCase().includes(subjectContains.toLowerCase());
    });

  /**
   * Check if email subject matches the regex pattern
   */
  const matchesRegex = (email: Email, subjectRegex: string): Effect.Effect<boolean, ConfigError> =>
    Effect.gen(function* () {
      try {
        const regex = new RegExp(subjectRegex);
        return regex.test(email.subject);
      } catch {
        return yield* Effect.fail(
          new ConfigError({
            message: `Invalid regex pattern: ${subjectRegex}`,
            field: "subjectRegex",
          })
        );
      }
    });

  /**
   * Apply all filters with AND logic
   * If both sender and subject filters are present, both must match
   */
  const applyFilters = (
    email: Email,
    filterConfig: FilterConfig
  ): Effect.Effect<FilterMatchResult, ConfigError> =>
    Effect.gen(function* () {
      // Validate configuration first
      yield* validateFilterConfig(filterConfig);

      const matchedFilters: string[] = [];
      let allMatched = true;

      // Check sender filter
      if (filterConfig.senderEmail) {
        const senderMatches = yield* matchesSender(email, filterConfig.senderEmail);
        if (senderMatches) {
          matchedFilters.push("sender");
        } else {
          allMatched = false;
        }
      }

      // Check subject contains filter
      if (filterConfig.subjectContains) {
        const subjectMatches = yield* matchesSubject(email, filterConfig.subjectContains);
        if (subjectMatches) {
          matchedFilters.push("subjectContains");
        } else {
          allMatched = false;
        }
      }

      // Check subject regex filter
      if (filterConfig.subjectRegex) {
        const regexMatches = yield* matchesRegex(email, filterConfig.subjectRegex);
        if (regexMatches) {
          matchedFilters.push("subjectRegex");
        } else {
          allMatched = false;
        }
      }

      // If no filters are configured, accept all emails
      const noFiltersConfigured =
        !filterConfig.senderEmail && !filterConfig.subjectContains && !filterConfig.subjectRegex;

      if (noFiltersConfigured) {
        return new FilterMatchResult({
          matched: true,
          reason: "No filters configured, accepting all emails",
          matchedFilters: ["all"],
        });
      }

      // Return result with AND logic
      return new FilterMatchResult({
        matched: allMatched,
        reason: allMatched
          ? `Email matched all configured filters: ${matchedFilters.join(", ")}`
          : `Email did not match all filters. Matched: ${matchedFilters.join(", ") || "none"}`,
        matchedFilters,
      });
    });

  return {
    matchesSender,
    matchesSubject,
    matchesRegex,
    applyFilters,
  };
};

/**
 * EmailFilter Layer
 */
export const EmailFilterLive = Layer.succeed(EmailFilter, makeEmailFilter());
