/**
 * API Helper utilities for Next.js API routes
 * Provides a bridge between Effect-TS backend and HTTP responses
 */

import { Effect, Exit } from "effect";
import { NextResponse } from "next/server";

/**
 * Run an Effect program and convert the result to a NextResponse
 * Handles errors gracefully and returns appropriate HTTP status codes
 */
export async function runEffectHandler<A, E>(
  program: Effect.Effect<A, E, never>,
  options: {
    onError?: (error: E) => { message: string; status: number };
  } = {}
): Promise<NextResponse> {
  const exit = await Effect.runPromiseExit(program);

  if (Exit.isSuccess(exit)) {
    return NextResponse.json(exit.value);
  }

  // Handle errors
  const error = exit.cause;
  console.error("API Error:", error);

  if (options.onError && Exit.isFailure(exit)) {
    const errorResponse = options.onError(error as unknown as E);
    return NextResponse.json({ error: errorResponse.message }, { status: errorResponse.status });
  }

  // Default error response
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
