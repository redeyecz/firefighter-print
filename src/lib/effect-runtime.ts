/**
 * Central Effect runtime configuration
 * This file sets up the Effect runtime with proper error handling and logging
 */

import { Effect, Layer, Logger, LogLevel } from "effect";

/**
 * Configure the default logger with appropriate log levels
 */
export const LoggerLive = Logger.replace(
  Logger.defaultLogger,
  Logger.make(({ logLevel, message }) => {
    const timestamp = new Date().toISOString();
    const level = logLevel.label.toUpperCase();
    console.log(`[${timestamp}] ${level}: ${message}`);
  })
);

/**
 * Set the minimum log level based on environment
 */
export const MinimumLogLevelLive = Logger.minimumLogLevel(
  process.env.NODE_ENV === "production" ? LogLevel.Info : LogLevel.Debug
);

/**
 * Combined runtime layer with logging configuration
 */
export const RuntimeLive = Layer.mergeAll(LoggerLive, MinimumLogLevelLive);

/**
 * Helper to run an Effect with the default runtime
 */
export const runEffect = <A, E>(effect: Effect.Effect<A, E>) =>
  Effect.runPromise(Effect.provide(effect, RuntimeLive));

/**
 * Helper to run an Effect and catch errors with a fallback
 */
export const runEffectSafe = <A, E>(
  effect: Effect.Effect<A, E>,
  onError: (error: E) => A
): Promise<A> =>
  Effect.runPromise(
    Effect.provide(Effect.catchAll(effect, (e) => Effect.succeed(onError(e))), RuntimeLive)
  );
