/**
 * Retry Job API Route
 * Re-processes a failed job through the entire workflow
 */

import { NextRequest } from "next/server";
import { DateTime, Effect, Layer } from "effect";
import { JobRepository } from "@/backend/services/job-repository";
import { JobRepositoryLive } from "@/backend/infrastructure/job-repository-impl";
import { JobOrchestrator } from "@/backend/services/job-orchestrator";
import { ConfigService, ConfigServiceLive } from "@/backend/config/loader";
import { DispatchJob, RetryHistoryEntry } from "@/backend/domain/job";
import { PrintConfig } from "@/backend/domain/print";
import { runApiEffect } from "@/lib/effect-runtime";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const effect = Effect.gen(function* () {
    const { id } = params;
    const jobRepository = yield* JobRepository;
    const jobOrchestrator = yield* JobOrchestrator;
    const config = yield* ConfigService;
    const appConfig = yield* config.getConfig();

    // Fetch the existing job
    const job = yield* jobRepository.getJob(id);

    // Check if job is in a retriable state
    if (job.status === "Processing") {
      return yield* Effect.fail(new Error("Job is currently being processed"));
    }

    // Extract the original email from the job
    const email = job.email;

    // Create print config from app config
    const printConfig = new PrintConfig({
      cupsHost: appConfig.cups.host,
      cupsPort: appConfig.cups.port,
      printerName: appConfig.cups.printerName,
    });

    // Re-run the entire workflow
    const retryStartTime = DateTime.unsafeNow();
    const retriedJob = yield* Effect.either(
      jobOrchestrator.processDispatchEmail(email, printConfig)
    );

    // Create retry history entry
    const retryEntry = new RetryHistoryEntry({
      timestamp: retryStartTime,
      attemptNumber: job.retryHistory.length + 1,
      retryType: "manual",
      errorMessage: retriedJob._tag === "Left" ? retriedJob.left.message : "",
      result:
        retriedJob._tag === "Right" && retriedJob.right.status === "Printed"
          ? "success"
          : "failure",
    });

    // Update job with retry history
    if (retriedJob._tag === "Right") {
      const updatedJob = new DispatchJob({
        ...retriedJob.right,
        retryHistory: [...job.retryHistory, retryEntry],
      });
      yield* jobRepository.updateJob(updatedJob);

      return {
        success: true,
        message: `Job ${id} retried successfully`,
        status: updatedJob.status,
        job: updatedJob,
      };
    } else {
      // Update existing job with failed retry
      const updatedJob = new DispatchJob({
        ...job,
        retryHistory: [...job.retryHistory, retryEntry],
      });
      yield* jobRepository.updateJob(updatedJob);

      return {
        success: false,
        message: `Job ${id} retry failed`,
        status: job.status,
        error: retriedJob.left.message,
      };
    }
  });

  // Provide only the layers the effect directly needs
  // JobOrchestrator.Default will handle its own dependencies
  const serviceLayers = Layer.mergeAll(
    JobRepositoryLive,
    Layer.succeed(ConfigService, ConfigServiceLive)
  ).pipe(Layer.provideMerge(JobOrchestrator.Default));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return runApiEffect(effect, serviceLayers as any);
}
