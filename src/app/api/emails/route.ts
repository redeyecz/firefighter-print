/**
 * Email Log API Route
 * Returns paginated list of processed emails
 */

import { NextRequest, NextResponse } from "next/server";
import { DateTime, Effect } from "effect";
import type { EmailLogResponse, EmailLogEntry } from "@/types/dashboard";
import { JobRepository } from "@/backend/services/job-repository";
import { JobRepositoryLive } from "@/backend/infrastructure/job-repository-impl";
import { runApiEffect } from "@/lib/effect-runtime";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const effect = Effect.gen(function* () {
      const repo = yield* JobRepository;

      // Get jobs for current page and total count in parallel
      const [jobs, stats] = yield* Effect.all([
        repo.listJobs({ limit, offset }),
        repo.get24HourStats(), // This returns total count among other things
      ]);

      // For now, get all jobs count by requesting without filter
      // In production, we'd add a separate getTotalCount method
      const total = stats.total;
      const totalPages = Math.ceil(total / limit);

      // Map jobs to frontend format
      const emailLogJobs: EmailLogEntry[] = jobs.map((job) => ({
        id: job.id,
        subject: job.email.subject,
        status: job.status,
        receivedDate: DateTime.formatIso(job.receivedAt),
        printedDate: job.printedAt ? DateTime.formatIso(job.printedAt) : undefined,
        error: job.errorMessage,
      }));

      const response: EmailLogResponse = {
        jobs: emailLogJobs,
        total,
        page,
        limit,
        totalPages,
      };

      return response;
    });

    // Provide JobRepositoryLive which includes SqlClient dependency
    return runApiEffect(effect, JobRepositoryLive);
  } catch (error) {
    console.error("Error fetching email log:", error);
    return NextResponse.json({ error: "Failed to fetch email log" }, { status: 500 });
  }
}
