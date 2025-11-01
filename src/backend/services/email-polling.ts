/**
 * Email Polling Service
 * Continuously monitors email inbox for new messages with retry logic
 */

import { Effect, Schedule, Duration } from "effect";
import { EmailClient } from "@/backend/infrastructure/email-client";
import { ConfigService } from "@/backend/config/loader";
import { EmailError } from "@/lib/errors";
import type { Email } from "@/backend/domain/email";

/**
 * Email polling service interface
 */
export interface EmailPollingService {
  readonly startPolling: (
    onNewEmail: (email: Email) => Effect.Effect<void, never>
  ) => Effect.Effect<void, EmailError, EmailClient | ConfigService>;
  readonly stopPolling: () => Effect.Effect<void, never>;
}

/**
 * In-memory storage for last processed UID (temporary until database is implemented)
 * TODO: Remove this when Task 9 (database persistence) is implemented
 */
let lastProcessedUid = 0;

/**
 * Create email polling service
 */
export const makeEmailPollingService = (): EmailPollingService => {
  let isPolling = false;

  const stopPolling = (): Effect.Effect<void, never> =>
    Effect.sync(() => {
      isPolling = false;
    });

  const startPolling = (
    onNewEmail: (email: Email) => Effect.Effect<void, never>
  ): Effect.Effect<void, EmailError, EmailClient | ConfigService> =>
    Effect.gen(function* () {
      const emailClient = yield* EmailClient;
      const config = yield* ConfigService;
      const appConfig = yield* Effect.mapError(
        config.getConfig(),
        (configError) =>
          new EmailError({
            message: `Configuration error: ${configError.message}`,
            cause: configError,
          })
      );

      isPolling = true;

      // Connect to email server with retry
      yield* Effect.retry(
        emailClient.connect(),
        Schedule.exponential(Duration.seconds(5)).pipe(Schedule.intersect(Schedule.recurs(3)))
      ).pipe(
        Effect.tapError((error) =>
          Effect.sync(() =>
            console.error("Failed to connect to email server after 3 retries:", error)
          )
        )
      );

      // Polling loop
      yield* Effect.repeat(
        Effect.gen(function* () {
          if (!isPolling) {
            return yield* Effect.fail(new EmailError({ message: "Polling stopped" }));
          }

          // Fetch new emails
          const emails = yield* emailClient.fetchNewEmails(lastProcessedUid);

          // Process each email
          for (const email of emails) {
            if (email.uid > lastProcessedUid) {
              yield* onNewEmail(email);
              lastProcessedUid = email.uid;
            }
          }
        }).pipe(
          Effect.retry(
            Schedule.exponential(Duration.seconds(2)).pipe(Schedule.intersect(Schedule.recurs(2)))
          ),
          Effect.catchAll((error) =>
            Effect.gen(function* () {
              console.error("Error during email polling:", error);
              // Continue polling even after errors
              return yield* Effect.void;
            })
          )
        ),
        Schedule.fixed(Duration.millis(appConfig.email.pollingIntervalMs))
      );
    });

  return {
    startPolling,
    stopPolling,
  };
};

/**
 * Helper to get last processed UID (for testing/monitoring)
 */
export const getLastProcessedUid = (): number => lastProcessedUid;

/**
 * Helper to reset last processed UID (for testing)
 */
export const resetLastProcessedUid = (): void => {
  lastProcessedUid = 0;
};
