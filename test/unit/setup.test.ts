import { describe, it } from "@effect/vitest";
import * as assert from "node:assert";
import { Effect } from "effect";

describe("Project Setup", () => {
  it.scoped("should have Effect-TS configured correctly", () =>
    Effect.gen(function* () {
      const result = yield* Effect.succeed("Hello, Effect!");
      assert.strictEqual(result, "Hello, Effect!");
    })
  );

  it.scoped("should handle Effect errors", () =>
    Effect.gen(function* () {
      const result = yield* Effect.flip(Effect.fail("Test error"));
      assert.strictEqual(result, "Test error");
    })
  );
});
