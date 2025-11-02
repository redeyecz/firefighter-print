import { Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { SqliteClient } from "@effect/sql-sqlite-bun";

/**
 * Database Layer
 * Provides SQLite connection using Bun's built-in SQLite
 */

/**
 * Create SQLite client layer with configuration
 */
export const SqlLive = SqliteClient.layer({
  filename: process.env.DATABASE_PATH || "firefighter-alarm.db",
});

/**
 * Database initialization - creates tables if they don't exist
 */
export const initializeDatabase = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Create jobs table
  yield* sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      email_uid INTEGER NOT NULL,
      email_subject TEXT NOT NULL,
      email_from TEXT NOT NULL,
      email_to TEXT NOT NULL,
      email_received_date TEXT NOT NULL,
      email_html TEXT,
      email_text TEXT,
      status TEXT NOT NULL CHECK(status IN ('Received', 'Processing', 'Printed', 'Failed')),
      received_at TEXT NOT NULL,
      processed_at TEXT,
      printed_at TEXT,
      gps_success INTEGER,
      gps_coordinates_lat REAL,
      gps_coordinates_lon REAL,
      gps_warning TEXT,
      gps_error TEXT,
      map_success INTEGER,
      map_image_url TEXT,
      map_error TEXT,
      print_success INTEGER,
      print_error TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `;

  // Create retry history table
  yield* sql`
    CREATE TABLE IF NOT EXISTS retry_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      retry_type TEXT NOT NULL CHECK(retry_type IN ('automatic', 'manual')),
      error_message TEXT NOT NULL,
      result TEXT NOT NULL CHECK(result IN ('success', 'failure')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `;

  // Create index on job status for filtering
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)
  `;

  // Create index on received_at for date range queries
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_jobs_received_at ON jobs(received_at)
  `;

  yield* Effect.logInfo("Database initialized successfully");
}).pipe(Effect.withSpan("Database.initialize"));

/**
 * Database Layer that includes initialization
 * The initialization runs on top of SqlLive, then returns SqlLive itself
 */
export const DatabaseLive = SqlLive.pipe(
  Layer.tap(() =>
    Effect.gen(function* () {
      yield* initializeDatabase;
      yield* Effect.logInfo("Database initialized successfully");
    })
  ),
  Layer.orDie
); // Convert errors to defects since database init must succeed
