/**
 * Email Client Unit Tests
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { EmailClient } from "@/backend/infrastructure/email-client";
import {
  createMockEmailClient,
  createFailingMockEmailClient,
  createFetchFailingMockEmailClient,
} from "./mocks/mock-imap-client";
import { mockDispatchEmailWithGPS } from "./mocks/email-fixtures";

describe("EmailClient", () => {
  describe("Connection Management", () => {
    it.scoped("should connect successfully", () =>
      Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const connected = yield* client.isConnected();
        expect(connected).toBe(true);
      }).pipe(Effect.provide(Layer.succeed(EmailClient, createMockEmailClient())))
    );

    it.scoped("should disconnect successfully", () =>
      Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        yield* client.disconnect();
        const connected = yield* client.isConnected();
        expect(connected).toBe(false);
      }).pipe(Effect.provide(Layer.succeed(EmailClient, createMockEmailClient())))
    );

    it.scoped("should fail to connect with invalid credentials", () =>
      Effect.gen(function* () {
        const client = yield* EmailClient;
        const error = yield* Effect.flip(client.connect());
        expect(error.message).toContain("Mock connection failed");
      }).pipe(Effect.provide(Layer.succeed(EmailClient, createFailingMockEmailClient())))
    );
  });

  describe("Email Fetching", () => {
    it.scoped("should fetch new emails", () =>
      Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const emails = yield* client.fetchNewEmails();
        expect(emails.length).toBe(3);
        expect(emails[0]?.subject).toContain("DISPATCH");
      }).pipe(Effect.provide(Layer.succeed(EmailClient, createMockEmailClient())))
    );

    it.scoped("should fetch emails since specific UID", () =>
      Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const emails = yield* client.fetchNewEmails(1);
        expect(emails.length).toBe(2);
        expect(emails.every((email) => email.uid > 1)).toBe(true);
      }).pipe(Effect.provide(Layer.succeed(EmailClient, createMockEmailClient())))
    );

    it.scoped("should handle fetch errors", () =>
      Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const error = yield* Effect.flip(client.fetchNewEmails());
        expect(error.message).toContain("Mock fetch failed");
      }).pipe(Effect.provide(Layer.succeed(EmailClient, createFetchFailingMockEmailClient())))
    );
  });

  describe("Email Parsing", () => {
    it.scoped("should parse email with GPS coordinates", () =>
      Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const emails = yield* client.fetchNewEmails();
        const email = emails[0];
        if (!email) {
          return yield* Effect.fail(new Error("Email is undefined"));
        }
        expect(email.uid).toBe(1);
        expect(email.subject).toBe("DISPATCH: Structure Fire at Main St");
        expect(email.from).toBe("dispatch@firedept.com");
        expect(email.text).toContain("49.947014 N, 17.885027 E");
      }).pipe(
        Effect.provide(
          Layer.succeed(
            EmailClient,
            createMockEmailClient({
              emails: [mockDispatchEmailWithGPS],
            })
          )
        )
      )
    );

    it.scoped("should parse email metadata correctly", () =>
      Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const emails = yield* client.fetchNewEmails();
        const email = emails[0];
        if (!email) {
          return yield* Effect.fail(new Error("Email is undefined"));
        }
        expect("uid" in email).toBe(true);
        expect("subject" in email).toBe(true);
        expect("from" in email).toBe(true);
        expect("to" in email).toBe(true);
        expect("receivedDate" in email).toBe(true);
        expect(email.receivedDate instanceof Date).toBe(true);
      }).pipe(
        Effect.provide(
          Layer.succeed(
            EmailClient,
            createMockEmailClient({
              emails: [mockDispatchEmailWithGPS],
            })
          )
        )
      )
    );
  });

  describe("Health Check", () => {
    it.scoped("should return connected health status", () =>
      Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const health = yield* client.getHealth();
        expect(health.status).toBe("connected");
        expect(health.message).toBeTruthy();
      }).pipe(Effect.provide(Layer.succeed(EmailClient, createMockEmailClient())))
    );

    it.scoped("should return disconnected health status", () =>
      Effect.gen(function* () {
        const client = yield* EmailClient;
        const health = yield* client.getHealth();
        expect(health.status).toBe("disconnected");
      }).pipe(Effect.provide(Layer.succeed(EmailClient, createMockEmailClient())))
    );
  });
});
