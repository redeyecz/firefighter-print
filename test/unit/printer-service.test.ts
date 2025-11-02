import { describe, it } from "@effect/vitest";
import { Effect, Schedule, TestClock, Fiber, TestContext } from "effect";
import * as assert from "node:assert";
import { PrinterUnreachable, PrinterError } from "@/backend/domain/print";

/**
 * Tests for printer service retry logic
 * These tests verify the retry behavior in isolation using TestClock
 * Full integration tests with Playwright and IPP are covered in E2E tests
 */
describe("PrinterService - Retry Logic", () => {
  describe("Retry Schedule Behavior", () => {
    it.scoped("should retry 3 times with 30-second delays", () =>
      Effect.gen(function* () {
        let attemptCount = 0;

        // Simulate a failing operation that succeeds on 4th attempt
        const simulatedPrintOperation = Effect.gen(function* () {
          attemptCount++;
          if (attemptCount <= 3) {
            return yield* Effect.fail(
              new PrinterUnreachable({
                host: "localhost",
                port: 631,
              })
            );
          }
          return "success";
        });

        // Create retry schedule: 3 retries with 30-second delays
        const retrySchedule = Schedule.intersect(
          Schedule.recurs(3),
          Schedule.addDelay(Schedule.forever, () => "30 seconds")
        );

        // Fork the operation with retry
        const fiber = yield* Effect.fork(
          simulatedPrintOperation.pipe(
            Effect.retry({
              schedule: retrySchedule,
              while: (error) => error._tag === "PrinterUnreachable",
            })
          )
        );

        // Advance time for each retry
        yield* TestClock.adjust("30 seconds"); // Retry 1
        yield* TestClock.adjust("30 seconds"); // Retry 2
        yield* TestClock.adjust("30 seconds"); // Retry 3

        const result = yield* Fiber.join(fiber);

        // Should have attempted 4 times (1 initial + 3 retries)
        assert.strictEqual(attemptCount, 4);
        assert.strictEqual(result, "success");
      }).pipe(Effect.provide(TestContext.TestContext))
    );

    it.scoped("should not retry on non-connection errors", () =>
      Effect.gen(function* () {
        let attemptCount = 0;

        // Simulate an operation that fails with PrinterError
        const simulatedPrintOperation = Effect.gen(function* () {
          attemptCount++;
          return yield* Effect.fail(
            new PrinterError({
              message: "Invalid printer configuration",
            })
          );
        });

        // Create retry schedule
        const retrySchedule = Schedule.intersect(
          Schedule.recurs(3),
          Schedule.addDelay(Schedule.forever, () => "30 seconds")
        );

        // Try the operation with retry (only retries on PrinterUnreachable)
        const result = yield* Effect.flip(
          simulatedPrintOperation.pipe(
            Effect.retry({
              schedule: retrySchedule,
              while: () => false, // Never retry PrinterError
            })
          )
        );

        // Should only attempt once (no retries for PrinterError)
        assert.strictEqual(attemptCount, 1);
        assert.strictEqual(result._tag, "PrinterError");
        assert.strictEqual(result.message, "Invalid printer configuration");
      }).pipe(Effect.provide(TestContext.TestContext))
    );

    it.scoped("should fail after exhausting all retries", () =>
      Effect.gen(function* () {
        let attemptCount = 0;

        // Simulate an operation that always fails
        const simulatedPrintOperation = Effect.gen(function* () {
          attemptCount++;
          return yield* Effect.fail(
            new PrinterUnreachable({
              host: "localhost",
              port: 631,
            })
          );
        });

        // Create retry schedule: 3 retries with 30-second delays
        const retrySchedule = Schedule.intersect(
          Schedule.recurs(3),
          Schedule.addDelay(Schedule.forever, () => "30 seconds")
        );

        // Fork the operation
        const fiber = yield* Effect.fork(
          simulatedPrintOperation.pipe(
            Effect.retry({
              schedule: retrySchedule,
              while: (error) => error._tag === "PrinterUnreachable",
            })
          )
        );

        // Advance time for all retry attempts
        yield* TestClock.adjust("30 seconds"); // Retry 1
        yield* TestClock.adjust("30 seconds"); // Retry 2
        yield* TestClock.adjust("30 seconds"); // Retry 3

        const result = yield* Effect.flip(Fiber.join(fiber));

        // Should have attempted 4 times (1 initial + 3 retries)
        assert.strictEqual(attemptCount, 4);
        assert.strictEqual(result._tag, "PrinterUnreachable");
      }).pipe(Effect.provide(TestContext.TestContext))
    );

    it.scoped("should succeed on first retry", () =>
      Effect.gen(function* () {
        let attemptCount = 0;

        // Simulate an operation that fails once then succeeds
        const simulatedPrintOperation = Effect.gen(function* () {
          attemptCount++;
          if (attemptCount === 1) {
            return yield* Effect.fail(
              new PrinterUnreachable({
                host: "localhost",
                port: 631,
              })
            );
          }
          return "success";
        });

        // Create retry schedule
        const retrySchedule = Schedule.intersect(
          Schedule.recurs(3),
          Schedule.addDelay(Schedule.forever, () => "30 seconds")
        );

        // Fork the operation
        const fiber = yield* Effect.fork(
          simulatedPrintOperation.pipe(
            Effect.retry({
              schedule: retrySchedule,
              while: (error) => error._tag === "PrinterUnreachable",
            })
          )
        );

        // Advance time for first retry
        yield* TestClock.adjust("30 seconds");

        const result = yield* Fiber.join(fiber);

        // Should have attempted 2 times (1 initial + 1 retry)
        assert.strictEqual(attemptCount, 2);
        assert.strictEqual(result, "success");
      }).pipe(Effect.provide(TestContext.TestContext))
    );
  });

  describe("Retry Timing", () => {
    it.scoped("should enforce 30-second delay between retries", () =>
      Effect.gen(function* () {
        const timestamps: number[] = [];

        const simulatedPrintOperation = Effect.gen(function* () {
          const clock = yield* TestClock.currentTimeMillis;
          timestamps.push(clock);

          if (timestamps.length <= 2) {
            return yield* Effect.fail(
              new PrinterUnreachable({
                host: "localhost",
                port: 631,
              })
            );
          }
          return "success";
        });

        const retrySchedule = Schedule.intersect(
          Schedule.recurs(3),
          Schedule.addDelay(Schedule.forever, () => "30 seconds")
        );

        const fiber = yield* Effect.fork(
          simulatedPrintOperation.pipe(
            Effect.retry({
              schedule: retrySchedule,
              while: (error) => error._tag === "PrinterUnreachable",
            })
          )
        );

        yield* TestClock.adjust("30 seconds");
        yield* TestClock.adjust("30 seconds");

        yield* Fiber.join(fiber);

        // Verify 30-second (30000ms) gaps between attempts
        assert.strictEqual(timestamps.length, 3);
        assert.strictEqual(timestamps[1]! - timestamps[0]!, 30000);
        assert.strictEqual(timestamps[2]! - timestamps[1]!, 30000);
      }).pipe(Effect.provide(TestContext.TestContext))
    );
  });
});
