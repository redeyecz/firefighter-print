import { Context, DateTime, Effect, Layer } from "effect";
import { HttpClient } from "@effect/platform";
import { Email } from "@/backend/domain/email";
import {
  DispatchJob,
  GPSResult,
  JobProcessingError,
  JobRepositoryError,
  JobResult,
  MapResult,
  PrintResult,
} from "@/backend/domain/job";
import { PrintConfig, RetryAttempt } from "@/backend/domain/print";
import { GPSExtraction } from "./gps-extraction";
import { MapService } from "./map-service";
import { DocumentAssembler } from "./document-assembler";
import { PrinterService } from "./printer-service";
import { JobRepository } from "./job-repository";
import { ConfigService } from "@/backend/config/loader";

/**
 * Job Orchestrator Service
 * Coordinates the entire workflow from email to printed output
 *
 * Complete workflow per PRD:
 * 1. Create job record
 * 2. Extract GPS coordinates
 * 3. Generate route map (if GPS succeeded)
 * 4. Assemble document (original email + map/errors)
 * 5. Print document
 * 6. Update job with all results
 *
 * Error Handling (per PRD):
 * - If GPS fails: continue with error message
 * - If map fails: continue with error message
 * - Always attempt to print (even if previous steps failed)
 */
export class JobOrchestrator extends Context.Tag("JobOrchestrator")<
  JobOrchestrator,
  {
    readonly processDispatchEmail: (
      email: Email,
      printConfig: PrintConfig
    ) => Effect.Effect<DispatchJob, JobProcessingError | JobRepositoryError>;
  }
>() {
  /**
   * Default implementation of JobOrchestrator
   */
  static readonly Default = Layer.effect(
    JobOrchestrator,
    Effect.gen(function* () {
      const gpsExtraction = yield* GPSExtraction;
      const mapService = yield* MapService;
      const documentAssembler = yield* DocumentAssembler;
      const printerService = yield* PrinterService;
      const jobRepository = yield* JobRepository;
      const configService = yield* ConfigService;
      const httpClient = yield* HttpClient.HttpClient;

      // Load config once at service initialization
      const config = yield* configService.getConfig().pipe(
        Effect.mapError(
          (error) =>
            new JobProcessingError({
              jobId: "initialization",
              step: "configuration",
              message: `Failed to load configuration: ${error.message}`,
              cause: error,
            })
        )
      );

      // Create a layer with the required services for map operations
      const serviceLayer = Layer.succeed(ConfigService, configService).pipe(
        Layer.merge(Layer.succeed(HttpClient.HttpClient, httpClient))
      );

      /**
       * Process a dispatch email through the entire workflow
       */
      const processDispatchEmail = (
        email: Email,
        printConfig: PrintConfig
      ): Effect.Effect<DispatchJob, JobProcessingError | JobRepositoryError> =>
        Effect.gen(function* () {
          // Generate unique job ID
          const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;

          // Create initial job record
          const job = new DispatchJob({
            id: jobId,
            email,
            status: "Received",
            receivedAt: DateTime.unsafeNow(),
            retryHistory: [],
          });

          // Persist initial job
          yield* jobRepository.createJob(job);

          // Update status to Processing
          yield* jobRepository.updateJob(
            new DispatchJob({
              ...job,
              status: "Processing",
            })
          );

          // Step 1: Extract GPS coordinates (capture result or error)
          const gpsResultEffect = gpsExtraction.extractGPS(email).pipe(
            Effect.map(
              (result) =>
                new GPSResult({
                  success: true,
                  coordinates: result.coordinates,
                  warning: result.warning,
                })
            ),
            Effect.catchAll((error) =>
              Effect.succeed(
                new GPSResult({
                  success: false,
                  error: error.message || "GPS extraction failed",
                })
              )
            )
          );

          const gpsResult = yield* gpsResultEffect;

          // Step 2: Generate map (only if GPS succeeded)
          const mapResultEffect =
            gpsResult.success && gpsResult.coordinates
              ? mapService.generateRouteMap(config.station.location, gpsResult.coordinates).pipe(
                  Effect.map(
                    (mapResponse) =>
                      new MapResult({
                        success: true,
                        imageUrl: mapResponse.imageUrl,
                      })
                  ),
                  Effect.catchAll((error) =>
                    Effect.succeed(
                      new MapResult({
                        success: false,
                        error: `Map generation failed: ${error.message}`,
                      })
                    )
                  ),
                  Effect.provide(serviceLayer)
                )
              : Effect.succeed(
                  new MapResult({
                    success: false,
                    error: "No valid GPS coordinates for map generation",
                  })
                );

          const mapResult = yield* mapResultEffect;

          // Step 3: Assemble document
          // DocumentAssembler expects Effects as parameters, so we create them
          const gpsEffect =
            gpsResult.success && gpsResult.coordinates
              ? Effect.succeed({
                  coordinates: gpsResult.coordinates,
                  warning: gpsResult.warning,
                })
              : Effect.fail(new Error(gpsResult.error || "GPS not found"));

          const mapEffect =
            mapResult.success && mapResult.imageUrl
              ? Effect.succeed({
                  imageUrl: mapResult.imageUrl,
                  format: "png" as const,
                  width: config.map.width,
                  height: config.map.height,
                })
              : Effect.fail(new Error(mapResult.error || "Map not generated"));

          const documentEffect = documentAssembler
            .assemble(email.html || email.text || "", gpsEffect, mapEffect)
            .pipe(
              Effect.map((doc) => doc.finalHtml),
              Effect.catchAll(() =>
                // Fallback: use original email if assembly fails
                Effect.succeed(email.html || email.text || "")
              ),
              Effect.provide(serviceLayer)
            );

          const documentHtml = yield* documentEffect;

          // Step 4: Print document (always attempt, even if previous steps failed)
          const printResultEffect = printerService.printDocument(documentHtml, printConfig).pipe(
            Effect.map(
              (result) =>
                new PrintResult({
                  success: result.success,
                  automaticRetries: Array.from(result.retryHistory) as RetryAttempt[],
                })
            ),
            Effect.catchAll((error) =>
              Effect.succeed(
                new PrintResult({
                  success: false,
                  error:
                    error._tag === "PrinterUnreachable"
                      ? `Printer unreachable: ${error.host}:${error.port}`
                      : error.message,
                  automaticRetries: [],
                })
              )
            )
          );

          const printResult = yield* printResultEffect;

          // Determine final status
          const finalStatus = printResult.success ? "Printed" : "Failed";
          const errorMessage = printResult.success ? undefined : printResult.error;

          // Create final job record with all results
          const finalJob = new DispatchJob({
            ...job,
            status: finalStatus,
            processedAt: DateTime.unsafeNow(),
            printedAt: printResult.success ? DateTime.unsafeNow() : undefined,
            results: new JobResult({
              gpsResult,
              mapResult,
              printResult,
            }),
            errorMessage,
          });

          // Persist final state
          return yield* jobRepository.updateJob(finalJob);
        }).pipe(
          Effect.withSpan("JobOrchestrator.processDispatchEmail"),
          Effect.annotateLogs({
            jobId: `${Date.now()}`,
            emailSubject: email.subject,
          })
        );

      return { processDispatchEmail } as const;
    })
  );
}
