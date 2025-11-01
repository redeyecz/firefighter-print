/**
 * Email Client Unit Tests
 */

import { describe, it, expect } from "vitest";
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
    it("should connect successfully", async () => {
      const mockClient = createMockEmailClient();
      const layer = Layer.succeed(EmailClient, mockClient);

      const program = Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const connected = yield* client.isConnected();
        return connected;
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toBe(true);
    });

    it("should disconnect successfully", async () => {
      const mockClient = createMockEmailClient();
      const layer = Layer.succeed(EmailClient, mockClient);

      const program = Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        yield* client.disconnect();
        const connected = yield* client.isConnected();
        return connected;
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toBe(false);
    });

    it("should fail to connect with invalid credentials", async () => {
      const mockClient = createFailingMockEmailClient();
      const layer = Layer.succeed(EmailClient, mockClient);

      const program = Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
      });

      await expect(Effect.runPromise(Effect.provide(program, layer))).rejects.toThrow(
        "Mock connection failed"
      );
    });
  });

  describe("Email Fetching", () => {
    it("should fetch new emails", async () => {
      const mockClient = createMockEmailClient();
      const layer = Layer.succeed(EmailClient, mockClient);

      const program = Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const emails = yield* client.fetchNewEmails();
        return emails;
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toHaveLength(3);
      expect(result[0]?.subject).toContain("DISPATCH");
    });

    it("should fetch emails since specific UID", async () => {
      const mockClient = createMockEmailClient();
      const layer = Layer.succeed(EmailClient, mockClient);

      const program = Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const emails = yield* client.fetchNewEmails(1);
        return emails;
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result).toHaveLength(2);
      expect(result.every((email) => email.uid > 1)).toBe(true);
    });

    it("should handle fetch errors", async () => {
      const mockClient = createFetchFailingMockEmailClient();
      const layer = Layer.succeed(EmailClient, mockClient);

      const program = Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const emails = yield* client.fetchNewEmails();
        return emails;
      });

      await expect(Effect.runPromise(Effect.provide(program, layer))).rejects.toThrow(
        "Mock fetch failed"
      );
    });
  });

  describe("Email Parsing", () => {
    it("should parse email with GPS coordinates", async () => {
      const mockClient = createMockEmailClient({
        emails: [mockDispatchEmailWithGPS],
      });
      const layer = Layer.succeed(EmailClient, mockClient);

      const program = Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const emails = yield* client.fetchNewEmails();
        return emails;
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result[0]).toMatchObject({
        uid: 1,
        subject: "DISPATCH: Structure Fire at Main St",
        from: "dispatch@firedept.com",
      });
      expect(result[0]?.text).toContain("49.947014 N, 17.885027 E");
    });

    it("should parse email metadata correctly", async () => {
      const mockClient = createMockEmailClient({
        emails: [mockDispatchEmailWithGPS],
      });
      const layer = Layer.succeed(EmailClient, mockClient);

      const program = Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const emails = yield* client.fetchNewEmails();
        return emails;
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result[0]).toHaveProperty("uid");
      expect(result[0]).toHaveProperty("subject");
      expect(result[0]).toHaveProperty("from");
      expect(result[0]).toHaveProperty("to");
      expect(result[0]).toHaveProperty("receivedDate");
      expect(result[0]?.receivedDate).toBeInstanceOf(Date);
    });
  });

  describe("Health Check", () => {
    it("should return connected health status", async () => {
      const mockClient = createMockEmailClient();
      const layer = Layer.succeed(EmailClient, mockClient);

      const program = Effect.gen(function* () {
        const client = yield* EmailClient;
        yield* client.connect();
        const health = yield* client.getHealth();
        return health;
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.status).toBe("connected");
      expect(result.message).toBeTruthy();
    });

    it("should return disconnected health status", async () => {
      const mockClient = createMockEmailClient();
      const layer = Layer.succeed(EmailClient, mockClient);

      const program = Effect.gen(function* () {
        const client = yield* EmailClient;
        const health = yield* client.getHealth();
        return health;
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));
      expect(result.status).toBe("disconnected");
    });
  });
});
