import { describe, it, expect } from "vitest";
import { Effect } from "effect";

describe("Project Setup", () => {
  it("should have Effect-TS configured correctly", async () => {
    const program = Effect.succeed("Hello, Effect!");
    const result = await Effect.runPromise(program);
    expect(result).toBe("Hello, Effect!");
  });

  it("should handle Effect errors", async () => {
    const program = Effect.fail("Test error");
    await expect(Effect.runPromise(program)).rejects.toThrow();
  });
});
