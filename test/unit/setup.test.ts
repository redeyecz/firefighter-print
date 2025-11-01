import { describe, it, assert } from "@effect/vitest";
import { Effect } from "effect";

describe("Project Setup", () => {
  it.effect("should have Effect-TS configured correctly", () =>
    Effect.gen(function* () {
      const result = yield* Effect.succeed("Hello, Effect!");
      assert.strictEqual(result, "Hello, Effect!");
    })
  );

  it.effect("should handle Effect errors", () =>
    Effect.gen(function* () {
      const result = yield* Effect.flip(Effect.fail("Test error"));
      assert.strictEqual(result, "Test error");
    })
  );
});
