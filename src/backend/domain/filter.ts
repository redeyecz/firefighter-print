/**
 * Filter domain models
 * Defines filtering rules and results
 */

import { Data } from "effect";

/**
 * Filter match result
 */
export class FilterMatchResult extends Data.Class<{
  matched: boolean;
  reason?: string;
  matchedFilters: string[];
}> {}

/**
 * Filter validation result
 */
export class FilterValidationResult extends Data.Class<{
  isValid: boolean;
  errors: string[];
}> {}
