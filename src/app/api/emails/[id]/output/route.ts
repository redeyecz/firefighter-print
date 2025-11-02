/**
 * Final Output HTML API Route
 * Returns the final assembled document HTML for a job
 */

import { NextRequest } from "next/server";
import { Effect, Layer } from "effect";
import { JobRepository } from "@/backend/services/job-repository";
import { JobRepositoryLive } from "@/backend/infrastructure/job-repository-impl";
import { DocumentAssembler } from "@/backend/services/document-assembler";
import { DocumentAssemblerLive } from "@/backend/services/document-assembler";
import { ConfigService, ConfigServiceLive } from "@/backend/config/loader";
import { runApiEffect } from "@/lib/effect-runtime";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const effect = Effect.gen(function* () {
    const { id } = params;
    const jobRepository = yield* JobRepository;
    const documentAssembler = yield* DocumentAssembler;

    // Fetch job from database
    const job = yield* jobRepository.getJob(id);

    // If job has results, regenerate the final HTML from them
    const emailHtml = job.email.html || job.email.text || "";

    // Create GPS effect from job results
    const gpsEffect =
      job.results?.gpsResult?.success && job.results.gpsResult.coordinates
        ? Effect.succeed({
            coordinates: job.results.gpsResult.coordinates,
            warning: job.results.gpsResult.warning,
          })
        : Effect.fail(new Error(job.results?.gpsResult?.error || "GPS not found"));

    // Create map effect from job results
    const mapEffect =
      job.results?.mapResult?.success && job.results.mapResult.imageUrl
        ? Effect.succeed({
            imageUrl: job.results.mapResult.imageUrl,
            format: "png" as const,
            width: 800,
            height: 600,
          })
        : Effect.fail(new Error(job.results?.mapResult?.error || "Map not generated"));

    // Assemble the document
    const document = yield* documentAssembler.assemble(emailHtml, gpsEffect, mapEffect);

    return { html: document.finalHtml };
  });

  // Provide all required layers
  const serviceLayers = Layer.mergeAll(
    JobRepositoryLive,
    DocumentAssemblerLive,
    Layer.succeed(ConfigService, ConfigServiceLive)
  );

  return runApiEffect(effect, serviceLayers);
}
