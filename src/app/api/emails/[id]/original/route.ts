/**
 * Original Email HTML API Route
 * Returns the original unmodified email HTML for a job
 */

import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { JobRepository } from "@/backend/services/job-repository";
import { JobRepositoryLive } from "@/backend/infrastructure/job-repository-impl";
import { runApiEffect } from "@/lib/effect-runtime";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const effect = Effect.gen(function* () {
      const repo = yield* JobRepository;
      const job = yield* repo.getJob(id);

      // Return original email HTML or fallback
      const html =
        job.email.html ||
        `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Original Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Email from ${job.email.from}</h1>
          <p><strong>Subject:</strong> ${job.email.subject}</p>
          <p><strong>Received:</strong> ${job.email.receivedDate.toISOString()}</p>
          <hr>
          <pre>${job.email.text || "No content available"}</pre>
        </body>
      </html>
    `;

      return { html };
    });

    return runApiEffect(effect, JobRepositoryLive);
  } catch (error) {
    console.error("Error fetching original email:", error);
    return NextResponse.json({ error: "Failed to fetch original email" }, { status: 500 });
  }
}
