import { DateTime, Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { DispatchJob, JobNotFound, JobRepositoryError, JobStatus } from "@/backend/domain/job";
import { JobRepository } from "@/backend/services/job-repository";

/**
 * SQLite implementation of JobRepository
 */
export const JobRepositoryLive = Layer.effect(
  JobRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const createJob = (job: DispatchJob): Effect.Effect<DispatchJob, JobRepositoryError> =>
      Effect.gen(function* () {
        yield* sql`
          INSERT INTO jobs (
            id, email_uid, email_subject, email_from, email_to, email_received_date,
            email_html, email_text, status, received_at
          ) VALUES (
            ${job.id},
            ${job.email.uid},
            ${job.email.subject},
            ${job.email.from},
            ${job.email.to},
            ${job.email.receivedDate.toISOString()},
            ${job.email.html || null},
            ${job.email.text || null},
            ${job.status},
            ${DateTime.formatIso(job.receivedAt)}
          )
        `.pipe(
          Effect.mapError(
            (cause) =>
              new JobRepositoryError({
                message: "Failed to create job",
                cause,
              })
          )
        );

        return job;
      }).pipe(Effect.withSpan("JobRepository.createJob"));

    const updateJob = (job: DispatchJob): Effect.Effect<DispatchJob, JobRepositoryError> =>
      Effect.gen(function* () {
        const gpsResult = job.results?.gpsResult;
        const mapResult = job.results?.mapResult;
        const printResult = job.results?.printResult;

        yield* sql`
          UPDATE jobs SET
            status = ${job.status},
            processed_at = ${job.processedAt ? DateTime.formatIso(job.processedAt) : null},
            printed_at = ${job.printedAt ? DateTime.formatIso(job.printedAt) : null},
            gps_success = ${gpsResult?.success ? 1 : 0},
            gps_coordinates_lat = ${gpsResult?.coordinates?.latitude || null},
            gps_coordinates_lon = ${gpsResult?.coordinates?.longitude || null},
            gps_warning = ${gpsResult?.warning || null},
            gps_error = ${gpsResult?.error || null},
            map_success = ${mapResult?.success ? 1 : 0},
            map_image_url = ${mapResult?.imageUrl || null},
            map_error = ${mapResult?.error || null},
            print_success = ${printResult?.success ? 1 : 0},
            print_error = ${printResult?.error || null},
            error_message = ${job.errorMessage || null},
            updated_at = datetime('now')
          WHERE id = ${job.id}
        `.pipe(
          Effect.mapError(
            (cause) =>
              new JobRepositoryError({
                message: "Failed to update job",
                cause,
              })
          )
        );

        // Insert retry history if present
        if (printResult && printResult.automaticRetries.length > 0) {
          for (const retry of printResult.automaticRetries) {
            yield* sql`
              INSERT INTO retry_history (
                job_id, timestamp, attempt_number, retry_type, error_message, result
              ) VALUES (
                ${job.id},
                ${DateTime.formatIso(retry.timestamp)},
                ${retry.attemptNumber},
                ${"automatic"},
                ${retry.errorMessage},
                ${retry.result}
              )
            `.pipe(
              Effect.mapError(
                (cause) =>
                  new JobRepositoryError({
                    message: "Failed to insert retry history",
                    cause,
                  })
              )
            );
          }
        }

        return job;
      }).pipe(Effect.withSpan("JobRepository.updateJob"));

    const getJob = (jobId: string): Effect.Effect<DispatchJob, JobNotFound | JobRepositoryError> =>
      Effect.gen(function* () {
        const rows = yield* sql<{
          id: string;
          email_uid: number;
          email_subject: string;
          email_from: string;
          email_to: string;
          email_received_date: string;
          email_html: string | null;
          email_text: string | null;
          status: JobStatus;
          received_at: string;
          processed_at: string | null;
          printed_at: string | null;
          error_message: string | null;
        }>`
          SELECT * FROM jobs WHERE id = ${jobId}
        `.pipe(
          Effect.mapError(
            (cause) =>
              new JobRepositoryError({
                message: "Failed to get job",
                cause,
              })
          )
        );

        if (rows.length === 0) {
          return yield* Effect.fail(new JobNotFound({ jobId }));
        }

        const row = rows[0]!;

        // TODO: Reconstruct full DispatchJob with results and retry history
        // For now, return minimal job
        return new DispatchJob({
          id: row.id,
          email: {
            uid: row.email_uid,
            subject: row.email_subject,
            from: row.email_from,
            to: row.email_to,
            receivedDate: new Date(row.email_received_date),
            flags: [],
            html: row.email_html || undefined,
            text: row.email_text || undefined,
          },
          status: row.status,
          receivedAt: DateTime.unsafeMake(row.received_at),
          processedAt: row.processed_at ? DateTime.unsafeMake(row.processed_at) : undefined,
          printedAt: row.printed_at ? DateTime.unsafeMake(row.printed_at) : undefined,
          retryHistory: [], // TODO: Load from retry_history table
          errorMessage: row.error_message || undefined,
        });
      }).pipe(Effect.withSpan("JobRepository.getJob"));

    const listJobs = (options: {
      readonly status?: JobStatus;
      readonly limit?: number;
      readonly offset?: number;
    }): Effect.Effect<ReadonlyArray<DispatchJob>, JobRepositoryError> =>
      Effect.gen(function* () {
        const limit = options.limit || 50;
        const offset = options.offset || 0;

        // Build WHERE clause
        const whereClause = options.status ? sql`WHERE status = ${options.status}` : sql``;

        const rows = yield* sql<{
          id: string;
          email_uid: number;
          email_subject: string;
          email_from: string;
          email_to: string;
          email_received_date: string;
          email_html: string | null;
          email_text: string | null;
          status: JobStatus;
          received_at: string;
          processed_at: string | null;
          printed_at: string | null;
          error_message: string | null;
        }>`
          SELECT * FROM jobs
          ${whereClause}
          ORDER BY received_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `.pipe(
          Effect.mapError(
            (cause) =>
              new JobRepositoryError({
                message: "Failed to list jobs",
                cause,
              })
          )
        );

        return rows.map(
          (row) =>
            new DispatchJob({
              id: row.id,
              email: {
                uid: row.email_uid,
                subject: row.email_subject,
                from: row.email_from,
                to: row.email_to,
                receivedDate: new Date(row.email_received_date),
                flags: [],
                html: row.email_html || undefined,
                text: row.email_text || undefined,
              },
              status: row.status,
              receivedAt: DateTime.unsafeMake(row.received_at),
              processedAt: row.processed_at ? DateTime.unsafeMake(row.processed_at) : undefined,
              printedAt: row.printed_at ? DateTime.unsafeMake(row.printed_at) : undefined,
              retryHistory: [],
              errorMessage: row.error_message || undefined,
            })
        );
      }).pipe(Effect.withSpan("JobRepository.listJobs"));

    const get24HourStats = (): Effect.Effect<
      {
        readonly total: number;
        readonly successful: number;
        readonly failed: number;
        readonly successRate: number;
      },
      JobRepositoryError
    > =>
      Effect.gen(function* () {
        const rows = yield* sql<{
          total: number;
          successful: number;
          failed: number;
        }>`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Printed' THEN 1 ELSE 0 END) as successful,
            SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed
          FROM jobs
          WHERE received_at >= datetime('now', '-24 hours')
        `.pipe(
          Effect.mapError(
            (cause) =>
              new JobRepositoryError({
                message: "Failed to get 24-hour stats",
                cause,
              })
          )
        );

        const stats = rows[0]!;
        const successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;

        return {
          total: stats.total,
          successful: stats.successful,
          failed: stats.failed,
          successRate: Math.round(successRate * 100) / 100,
        };
      }).pipe(Effect.withSpan("JobRepository.get24HourStats"));

    return {
      createJob,
      updateJob,
      getJob,
      listJobs,
      get24HourStats,
    } as const;
  })
);
