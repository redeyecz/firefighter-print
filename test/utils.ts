/**
 * Test Utilities for Effect-TS Testing
 *
 * This utility creates test layers for mocking services in Effect tests.
 * It automatically handles unimplemented methods by creating a proxy that
 * will cause the test to fail if an unexpected method is called.
 */

import { Context, Layer } from "effect";

/**
 * Creates a test layer for a given service tag with partial mock implementation.
 *
 * Any methods not provided in the mock will throw an error if called,
 * preventing silent failures when unexpected methods are invoked.
 *
 * @param tag - The service tag (Context.Tag)
 * @returns A function that takes a partial implementation and returns a Layer
 *
 * @example
 * ```ts
 * import { assert, it } from "@effect/vitest"
 * import { makeTestLayer } from "@/test/utils"
 *
 * it.effect("should return a mocked user", () =>
 *   Effect.gen(function* () {
 *     const service = yield* MyService
 *     const result = yield* service.getUser("123")
 *     assert.strictEqual(result.name, "Mocked User")
 *   }).pipe(
 *     Effect.provide(
 *       makeTestLayer(MyService)({
 *         getUser: (id) => Effect.succeed({ id, name: "Mocked User" })
 *       })
 *     )
 *   )
 * )
 * ```
 */
export const makeTestLayer = <I, S>(tag: Context.Tag<I, S>) => {
  return (implementation: Partial<S>): Layer.Layer<I> => {
    // Create a proxy that throws for unimplemented methods
    const proxy = new Proxy(implementation, {
      get(target, prop) {
        if (prop in target) {
          return target[prop as keyof S];
        }
        // If method is not implemented, throw a descriptive error
        return () => {
          throw new Error(
            `Unexpected call to unimplemented method: ${String(prop)}. ` +
              `Please add this method to your test mock implementation.`
          );
        };
      },
    }) as S;

    return Layer.succeed(tag, proxy);
  };
};
