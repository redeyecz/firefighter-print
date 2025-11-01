/**
 * IMAP Email Client
 * Wrapper around ImapFlow with Effect-TS integration
 */

import { Effect, Context, Layer } from "effect";
import { ImapFlow } from "imapflow";
import type { FetchMessageObject, FetchQueryObject } from "imapflow";
import { EmailError } from "@/lib/errors";
import type { Email, EmailServiceHealth, ConnectionStatus } from "@/backend/domain/email";
import type { EmailConfig } from "@/backend/config/schema";

/**
 * EmailClient service interface
 */
export interface EmailClientService {
  readonly connect: () => Effect.Effect<void, EmailError>;
  readonly disconnect: () => Effect.Effect<void, EmailError>;
  readonly isConnected: () => Effect.Effect<boolean, never>;
  readonly fetchNewEmails: (sinceUid?: number) => Effect.Effect<Email[], EmailError>;
  readonly getHealth: () => Effect.Effect<EmailServiceHealth, never>;
}

/**
 * EmailClient service tag
 */
export class EmailClient extends Context.Tag("EmailClient")<EmailClient, EmailClientService>() {}

/**
 * Parse ImapFlow message to our Email domain model
 */
const parseMessage = (msg: FetchMessageObject, uid: number): Email => {
  const email: Email = {
    uid,
    subject: msg.envelope?.subject || "(No Subject)",
    from: msg.envelope?.from?.[0]?.address || "unknown@unknown",
    to: msg.envelope?.to?.[0]?.address || "unknown@unknown",
    receivedDate: new Date(msg.envelope?.date || msg.internalDate || new Date()),
    flags: msg.flags ? Array.from(msg.flags) : [],
    text: undefined,
    html: undefined,
    raw: undefined,
  };

  return email;
};

/**
 * Create live implementation of EmailClient
 */
export const makeEmailClient = (config: EmailConfig): EmailClientService => {
  let client: ImapFlow | null = null;
  let connectionStatus: ConnectionStatus = "disconnected";
  let lastHealthCheck = new Date();

  const getClient = (): Effect.Effect<ImapFlow, EmailError> =>
    Effect.gen(function* () {
      if (!client) {
        return yield* Effect.fail(
          new EmailError({
            message: "Email client not connected",
          })
        );
      }
      return client;
    });

  const connect = (): Effect.Effect<void, EmailError> =>
    Effect.gen(function* () {
      connectionStatus = "connecting";

      yield* Effect.tryPromise({
        try: async () => {
          client = new ImapFlow({
            host: config.host,
            port: config.port,
            secure: true,
            auth: {
              user: config.user,
              pass: config.password,
            },
            logger: false,
          });

          await client.connect();
          connectionStatus = "connected";
          lastHealthCheck = new Date();
        },
        catch: (error) =>
          new EmailError({
            message: `Failed to connect to email server: ${error}`,
            cause: error,
          }),
      });
    });

  const disconnect = (): Effect.Effect<void, EmailError> =>
    Effect.gen(function* () {
      const c = client;
      if (!c) {
        return;
      }

      yield* Effect.tryPromise({
        try: async () => {
          await c.logout();
          client = null;
          connectionStatus = "disconnected";
          lastHealthCheck = new Date();
        },
        catch: (error) =>
          new EmailError({
            message: `Failed to disconnect from email server: ${error}`,
            cause: error,
          }),
      });
    });

  const isConnected = (): Effect.Effect<boolean, never> =>
    Effect.succeed(client !== null && connectionStatus === "connected");

  const fetchNewEmails = (sinceUid?: number): Effect.Effect<Email[], EmailError> =>
    Effect.gen(function* () {
      const c = yield* getClient();

      const emails = yield* Effect.tryPromise({
        try: async () => {
          // Lock and select INBOX
          const lock = await c.getMailboxLock("INBOX");

          try {
            // Build search query
            const searchQuery: string = sinceUid ? `${sinceUid + 1}:*` : "1:*";

            // Fetch emails
            const fetchQuery: FetchQueryObject = {
              uid: true,
              flags: true,
              envelope: true,
              bodyStructure: true,
              source: false,
            };

            const messages: Email[] = [];

            for await (const msg of c.fetch(searchQuery, fetchQuery, { uid: true })) {
              const email = parseMessage(msg, msg.uid);
              messages.push(email);
            }

            return messages;
          } finally {
            lock.release();
          }
        },
        catch: (error) =>
          new EmailError({
            message: `Failed to fetch emails: ${error}`,
            cause: error,
          }),
      });

      lastHealthCheck = new Date();
      return emails;
    });

  const getHealth = (): Effect.Effect<EmailServiceHealth, never> =>
    Effect.succeed({
      status: connectionStatus,
      lastCheck: lastHealthCheck,
      message:
        connectionStatus === "connected"
          ? "Email service is healthy"
          : "Email service is not connected",
    });

  return {
    connect,
    disconnect,
    isConnected,
    fetchNewEmails,
    getHealth,
  };
};

/**
 * Create EmailClient layer from configuration
 */
export const EmailClientLive = (config: EmailConfig): Layer.Layer<EmailClient> =>
  Layer.succeed(EmailClient, makeEmailClient(config));
