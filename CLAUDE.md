# Guideline for Building Applications with Effect-TS

This document provides the comprehensive set of rules, patterns, and workflows for developing robust, maintainable, and type-safe applications using the Effect-TS ecosystem.

## 🚨 HIGHEST PRIORITY RULES 🚨

These rules are non-negotiable and fundamental to writing safe and correct Effect code.

1.  **ABSOLUTELY FORBIDDEN: `try-catch` in `Effect.gen`**
    Use Effect's built-in error handling combinators (`Effect.result`, `Effect.catch`, etc.). Using `try-catch` in generators breaks Effect's error-handling mechanism.

2.  **ABSOLUTELY FORBIDDEN: Type Assertions**
    Never use `as any`, `as never`, or `as unknown`. Always fix the underlying type mismatch.

3.  **MANDATORY: `return yield*` Pattern for Errors**
    Always use `return yield*` when yielding terminal effects like `Effect.fail` or `Effect.interrupt` to make termination explicit and prevent unreachable code.

## Development Workflow & Tooling

### Spec-Driven Development

Every new feature must follow this 5-phase specification process to ensure clarity and alignment before implementation begins.

1.  **`instructions.md`**: Capture initial user requirements.
2.  **`requirements.md`**: Create a structured analysis of requirements.
3.  **`design.md`**: Develop the technical design and implementation strategy.
4.  **`plan.md`**: Break down the design into a detailed, actionable roadmap.
5.  **Implementation**: Execute the plan.

### Tooling & Commands

- **Dependency Management (`bun`)**: Use `bun install`, `bun add`, etc., for managing packages.
- **Script Execution (`bun`)**: Use `bun run <script>`, `bun run test`, etc., for all other commands.
- **Build & Run**:
  - `bun run build`: Creates a production-ready build in `dist/`.
  - `bun run start`: Runs the production build.
  - **CRITICAL WARNING**: **NEVER run `bun run dev`** during automated development. It is for manual, interactive testing only.

### 🚨 MANDATORY VALIDATION AFTER EVERY EDIT 🚨

**After editing ANY TypeScript file (.ts), you MUST IMMEDIATELY run the following commands and ensure they pass with ZERO errors before proceeding:**

1.  `bun run lint:fix <typescript_file.ts>`
2.  `bun run typecheck`

## Core Architectural Patterns

### Structured Error Handling with `Data.TaggedError`

Create custom, typed errors by extending `Data.TaggedError` for robust and inspectable error handling that integrates perfectly with Effect's error channel.

```typescript
import { Data, Effect } from "effect";

export class UserNotFound extends Data.TaggedError("UserNotFound")<{
  readonly userId: string;
}> {}

const findUser = (id: string): Effect.Effect<User, UserNotFound> =>
  Effect.gen(function* () {
    const user = yield* db.findUserById(id);
    if (!user) {
      return yield* Effect.fail(new UserNotFound({ userId: id }));
    }
    return user;
  });
```

### Service Definition Patterns

- **`Effect.Service`**: Use for services with a **single, default implementation**.
  ```typescript
  export class MyService extends Effect.Service<MyService>()("MyService", {
    // ... dependencies and effect implementation
  }) {}
  ```
- **`Context.Tag`**: Use for services with **multiple, interchangeable implementations**.
  ```typescript
  export class MediaStore extends Context.Tag("MediaStore")<
    MediaStore,
    {
      /* interface */
    }
  >() {
    static ImplA = MediaStore.of({
      /* ... */
    });
    static ImplB = MediaStore.of({
      /* ... */
    });
  }
  ```

### Service Usage in `Effect.gen`

**CRITICAL**: When using generators, yield effects directly. **NEVER** use the optional `_` helper parameter, as it is an anti-pattern.

```typescript
// ✅ CORRECT: Yield services and effects directly
const useCase = (id: string) =>
  Effect.gen(function* () {
    const myService = yield* MyService;
    const result = yield* myService.doSomething(id);
    return result;
  });

// ❌ WRONG: Do not use the '_' helper parameter
const antiPattern = (id: string) =>
  Effect.gen(function* (_) {
    // Don't use this parameter
    const myService = yield* _(MyService); // Don't wrap yields
    const result = yield* _(myService.doSomething(id));
    return result;
  });
```

### Resource Management (Automatic Cleanup)

Use `Effect.acquireRelease` within `Effect.scoped` to manage resources like database connections or file handles, guaranteeing that cleanup logic runs automatically.

## Testing

### Testing Framework Selection & Rules

- **Effect Tests**:
  - **MUST** use `@effect/vitest`.
  - **MUST** use `it.effect(...)`.
  - **MUST** use `assert` for assertions (e.g., `assert.strictEqual`).
  - **FORBIDDEN**: Never use `expect` in an Effect test.
  - **FORBIDDEN**: Never use `Effect.runSync` inside a plain `it` block.
- **Non-Effect / Pure TypeScript Tests**:
  - Use `vitest` with `it(...)` and `expect`.

### Testing Services

Use the `makeTestLayer` utility to create and provide mock service implementations for your tests. This utility automatically handles unimplemented methods by creating a proxy that will cause the test to fail if an unexpected method is called, preventing silent errors.

```typescript
import { assert, it } from "@effect/vitest";
import { makeTestLayer } from "@/test/utils"; // Assuming location of the utility

it.effect("should return a mocked user", () =>
  Effect.gen(function* () {
    const useCase = yield* makeUseCase(); // The function using MyService
    const user = yield* useCase.execute("123");
    assert.strictEqual(user.name, "Mocked User");
  }).pipe(
    Effect.provide(
      makeTestLayer(MyService)({
        // Provide the mocked implementation for the service
        getUser: (id) => Effect.succeed({ id, name: "Mocked User" }),
      })
    )
  )
);
```

### Time-Dependent Testing with `TestClock`

**CRITICAL**: When testing time-dependent code (delays, timeouts, schedules), **ALWAYS** use `TestClock` to prevent flaky tests and control the flow of time manually.

```ts
import { TestClock } from "effect/TestClock";

it.effect("should handle delays correctly", () =>
  Effect.gen(function* () {
    const fiber = yield* Effect.fork(Effect.sleep("5 seconds"));
    yield* TestClock.advance("5 seconds"); // Manually advance time
    const result = yield* Fiber.join(fiber);
    assert.isUndefined(result); // The effect completes successfully
  })
);
```

## JSDoc & Documentation Policy

Comprehensive JSDoc documentation is required, but **only for public-facing or shared APIs**. This includes core services, libraries, or utilities intended for reuse across multiple features (e.g., a `RepositoryService` or `HttpClient`).

Internal, feature-specific logic does not require JSDoc. When documenting, include a clear `@example` and `@category` tag.

## Project Structure & Configuration

- **`src/`**: Application source code (`app/`, `components/`, `lib/`, `backend/`, `frontend/`, `main.ts`).
- **`src/backend`**: Application backend source code (`core/`, `services/`, `lib/`).
- **`src/frontend`**: Application frontend source code (`core/`, `services/`, `lib/`).
- **`test/`**: Test files, mirroring the `src/` directory structure.
- **`.specs/`**: Feature specifications, with each feature in its own sub-directory.
- **`.patterns/`**: A reference directory of established, reusable implementation patterns for this project.
- **`scratchpad/`**: A directory for temporary, throwaway code used for prototyping.
- **`tsconfig.json`**: Configured with `strict: true` and a `@/*` path alias mapping to `src/`.

# Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Output for specs

- Sacrifice grammer for specs in favor of readability, for PRD breakdown use ATDD conventions
