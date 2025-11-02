/**
 * Dashboard Statistics API Route
 * Returns 24-hour statistics for the dashboard
 */

import { Effect } from "effect";
import { JobRepository } from "@/backend/services/job-repository";
import { JobRepositoryLive } from "@/backend/infrastructure/job-repository-impl";
import { runApiEffect } from "@/lib/effect-runtime";

export async function GET() {
  const effect = Effect.gen(function* () {
    const jobRepository = yield* JobRepository;
    const stats = yield* jobRepository.get24HourStats();
    return stats;
  });

  return runApiEffect(effect, JobRepositoryLive);
}
