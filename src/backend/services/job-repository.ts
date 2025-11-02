import { Context, Effect } from "effect";
import { DispatchJob, JobNotFound, JobRepositoryError, JobStatus } from "@/backend/domain/job";

/**
 * Job Repository Interface
 * Defines operations for persisting and retrieving dispatch jobs
 * Actual implementation will be provided in Task 9 with SQLite
 */
export class JobRepository extends Context.Tag("JobRepository")<
  JobRepository,
  {
    /**
     * Create a new job in the repository
     */
    readonly createJob: (job: DispatchJob) => Effect.Effect<DispatchJob, JobRepositoryError>;

    /**
     * Update an existing job
     */
    readonly updateJob: (job: DispatchJob) => Effect.Effect<DispatchJob, JobRepositoryError>;

    /**
     * Get a job by ID
     */
    readonly getJob: (
      jobId: string
    ) => Effect.Effect<DispatchJob, JobNotFound | JobRepositoryError>;

    /**
     * List jobs with pagination and optional filtering
     */
    readonly listJobs: (options: {
      readonly status?: JobStatus;
      readonly limit?: number;
      readonly offset?: number;
    }) => Effect.Effect<ReadonlyArray<DispatchJob>, JobRepositoryError>;

    /**
     * Get 24-hour statistics
     */
    readonly get24HourStats: () => Effect.Effect<
      {
        readonly total: number;
        readonly successful: number;
        readonly failed: number;
        readonly successRate: number;
      },
      JobRepositoryError
    >;
  }
>() {}
