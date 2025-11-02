/**
 * Central Effect runtime configuration
 * This file sets up the Effect runtime with proper error handling and logging
 */

import { Effect, Layer, Logger, LogLevel } from "effect";
import { NextResponse } from "next/server";
import { DatabaseLive } from "@/backend/infrastructure/database";
import { createErrorResponse } from "./errors";

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
 * Runtime layer with database support
 * DatabaseLive is fully self-contained, and we merge it with RuntimeLive
 */
export const AppRuntimeLive = DatabaseLive.pipe(Layer.merge(RuntimeLive));

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
    Effect.provide(
      Effect.catchAll(effect, (e) => Effect.succeed(onError(e))),
      RuntimeLive
    )
  );

/**
 * Run an Effect in a Next.js API route with automatic error handling
 * Returns NextResponse with proper error codes
 *
 * This is a simplified implementation that provides layers in sequence.
 * AppRuntimeLive provides SqlClient and other core services.
 *
 * Note: Uses `any` for layer composition due to TypeScript limitation with complex
 * Effect layer type inference. At runtime, all dependencies are correctly provided.
 */

export const runApiEffect = async <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layer: Layer.Layer<R, never, any>
): Promise<NextResponse> => {
  // Provide the service layer first, then the app runtime for its dependencies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program: any = effect.pipe(Effect.provide(layer), Effect.provide(AppRuntimeLive));

  // Convert to Either and run
  const result = await Effect.runPromise(Effect.either(program));

  if (result._tag === "Left") {
    const errorResponse = createErrorResponse(result.left);

    // Determine status code based on error type/code
    let status = 500;
    if (errorResponse.code?.includes("NOT_FOUND")) {
      status = 404;
    } else if (errorResponse.code?.startsWith("GPS_")) {
      status = 422; // Unprocessable Entity
    } else if (
      errorResponse.code?.startsWith("EMAIL_") ||
      errorResponse.code?.startsWith("MAP_") ||
      errorResponse.code?.startsWith("PRINT_")
    ) {
      status = 503; // Service Unavailable
    }

    return NextResponse.json(errorResponse, { status });
  }

  return NextResponse.json(result.right);
};
