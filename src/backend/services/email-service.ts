/**
 * Email Service
 * High-level service for email monitoring and management
 */

import { Effect, Context, Layer } from "effect";
import { EmailClient } from "@/backend/infrastructure/email-client";
import { makeEmailPollingService } from "./email-polling";
import { EmailError } from "@/lib/errors";
import type { Email, EmailServiceHealth } from "@/backend/domain/email";

/**
 * EmailService interface
 */
export interface IEmailService {
  readonly startMonitoring: (
    onNewEmail: (email: Email) => Effect.Effect<void, never>
  ) => Effect.Effect<void, EmailError, EmailClient | ConfigService>;
  readonly stopMonitoring: () => Effect.Effect<void, never>;
  readonly getHealth: () => Effect.Effect<EmailServiceHealth, never, EmailClient>;
  readonly testConnection: () => Effect.Effect<boolean, EmailError, EmailClient>;
}

// Import ConfigService for types
import { ConfigService } from "@/backend/config/loader";

/**
 * EmailService tag
 */
export class EmailService extends Context.Tag("EmailService")<EmailService, IEmailService>() {}

/**
 * Create EmailService implementation
 */
const makeEmailService = (): IEmailService => {
  const pollingService = makeEmailPollingService();

  const startMonitoring = (
    onNewEmail: (email: Email) => Effect.Effect<void, never>
  ): Effect.Effect<void, EmailError, EmailClient | ConfigService> =>
    Effect.gen(function* () {
      console.log("Starting email monitoring service...");
      yield* pollingService.startPolling(onNewEmail);
    });

  const stopMonitoring = (): Effect.Effect<void, never> =>
    Effect.gen(function* () {
      console.log("Stopping email monitoring service...");
      yield* pollingService.stopPolling();
    });

  const getHealth = (): Effect.Effect<EmailServiceHealth, never, EmailClient> =>
    Effect.gen(function* () {
      const emailClient = yield* EmailClient;
      return yield* emailClient.getHealth();
    });

  const testConnection = (): Effect.Effect<boolean, EmailError, EmailClient> =>
    Effect.gen(function* () {
      const emailClient = yield* EmailClient;
      yield* emailClient.connect();
      const connected = yield* emailClient.isConnected();
      yield* emailClient.disconnect();
      return connected;
    });

  return {
    startMonitoring,
    stopMonitoring,
    getHealth,
    testConnection,
  };
};

/**
 * EmailService Layer
 */
export const EmailServiceLive = Layer.succeed(EmailService, makeEmailService());
