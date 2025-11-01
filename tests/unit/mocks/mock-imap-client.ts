/**
 * Mock IMAP Client for testing
 * Simulates ImapFlow behavior without real network calls
 */

import { Effect } from "effect";
import type { EmailClientService } from "@/backend/infrastructure/email-client";
import { EmailError } from "@/lib/errors";
import type { Email } from "@/backend/domain/email";
import {
  mockDispatchEmailWithGPS,
  mockDispatchEmailNoGPS,
  mockDispatchEmailMultipleGPS,
} from "./email-fixtures";

/**
 * Mock email store
 */
const mockEmailStore = [
  mockDispatchEmailWithGPS,
  mockDispatchEmailNoGPS,
  mockDispatchEmailMultipleGPS,
];

/**
 * Create a mock EmailClient that succeeds
 */
export const createMockEmailClient = (
  options: {
    shouldFailConnection?: boolean;
    shouldFailFetch?: boolean;
    emails?: Email[];
  } = {}
): EmailClientService => {
  const { shouldFailConnection = false, shouldFailFetch = false, emails = mockEmailStore } =
    options;

  let connected = false;

  return {
    connect: () =>
      shouldFailConnection
        ? Effect.fail(
            new EmailError({
              message: "Mock connection failed",
            })
          )
        : Effect.sync(() => {
            connected = true;
          }),

    disconnect: () =>
      Effect.sync(() => {
        connected = false;
      }),

    isConnected: () => Effect.succeed(connected),

    fetchNewEmails: (sinceUid?: number) =>
      shouldFailFetch
        ? Effect.fail(
            new EmailError({
              message: "Mock fetch failed",
            })
          )
        : Effect.succeed(
            emails.filter((email) => (sinceUid !== undefined ? email.uid > sinceUid : true))
          ),

    getHealth: () =>
      Effect.succeed({
        status: connected ? "connected" : "disconnected",
        lastCheck: new Date(),
        message: connected ? "Mock client connected" : "Mock client disconnected",
      }),
  };
};

/**
 * Create a mock EmailClient that fails connection
 */
export const createFailingMockEmailClient = (): EmailClientService =>
  createMockEmailClient({ shouldFailConnection: true });

/**
 * Create a mock EmailClient that fails to fetch
 */
export const createFetchFailingMockEmailClient = (): EmailClientService =>
  createMockEmailClient({ shouldFailFetch: true });
