import { Context, DateTime, Effect, Layer, Schedule } from "effect";
import * as IPP from "ipp";
import {
  PrintConfig,
  PrinterUnreachable,
  PrinterError,
  RetryAttempt,
} from "@/backend/domain/print";
import { PdfConverter } from "./pdf-converter";

/**
 * Result of a print operation with retry history
 */
export interface PrintResult {
  readonly success: boolean;
  readonly retryHistory: ReadonlyArray<RetryAttempt>;
}

/**
 * Printer Service using CUPS via IPP
 * Handles PDF printing with automatic retry logic
 */
export class PrinterService extends Context.Tag("PrinterService")<
  PrinterService,
  {
    readonly printDocument: (
      html: string,
      config: PrintConfig
    ) => Effect.Effect<PrintResult, PrinterUnreachable | PrinterError>;
  }
>() {
  /**
   * Default implementation of PrinterService
   */
  static readonly Default = Layer.effect(
    PrinterService,
    Effect.gen(function* () {
      const pdfConverter = yield* PdfConverter;

      /**
       * Send a PDF to the CUPS printer via IPP
       */
      const sendToPrinter = (
        pdf: Buffer,
        config: PrintConfig
      ): Effect.Effect<void, PrinterUnreachable | PrinterError> =>
        Effect.gen(function* () {
          const printer = new IPP.Printer(
            `http://${config.cupsHost}:${config.cupsPort}/printers/${config.printerName}`
          );

          yield* Effect.tryPromise({
            try: () =>
              new Promise<void>((resolve, reject) => {
                const msg = {
                  "operation-attributes-tag": {
                    "requesting-user-name": "firefighter-alarm",
                    "document-format": "application/pdf",
                  },
                  data: pdf,
                };

                // @ts-expect-error - IPP types are incomplete, Print-Job is a valid operation
                printer.execute("Print-Job", msg, (err: Error | null) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                });
              }),
            catch: (cause) => {
              // Check if it's a connection error (ECONNREFUSED, ETIMEDOUT, etc.)
              const errorCode =
                cause && typeof cause === "object" && "code" in cause ? cause.code : null;

              if (errorCode === "ECONNREFUSED") {
                return new PrinterUnreachable({
                  host: config.cupsHost,
                  port: config.cupsPort,
                  cause,
                });
              }

              // Generic printer error
              return new PrinterError({
                message: cause instanceof Error ? cause.message : String(cause),
                cause,
              });
            },
          });
        }).pipe(
          Effect.withSpan("PrinterService.sendToPrinter"),
          Effect.annotateLogs({
            printer: config.printerName,
            host: config.cupsHost,
            port: config.cupsPort,
          })
        );

      /**
       * Print a document with automatic retry logic
       * Retries 3 times with 30-second delays on failures
       */
      const printDocument = (
        html: string,
        config: PrintConfig
      ): Effect.Effect<PrintResult, PrinterUnreachable | PrinterError> =>
        Effect.gen(function* () {
          // Convert HTML to PDF
          const pdf = yield* pdfConverter.convertHtmlToPdf(html).pipe(
            Effect.mapError(
              (conversionError) =>
                new PrinterError({
                  message: `PDF conversion failed: ${conversionError.message}`,
                  cause: conversionError.cause,
                })
            )
          );

          // Track retry attempts
          const retryHistory: RetryAttempt[] = [];
          let attemptNumber = 1;

          // Create a retry schedule: 3 attempts with 30-second delays
          const retrySchedule = Schedule.intersect(
            Schedule.recurs(3), // Maximum 3 retries
            Schedule.addDelay(Schedule.forever, () => "30 seconds") // 30-second delay
          );

          // Attempt to print with retry logic
          const printEffect = sendToPrinter(pdf, config).pipe(
            Effect.tapError((error) =>
              Effect.sync(() => {
                // Only track retries for unreachable errors
                if (error._tag === "PrinterUnreachable") {
                  retryHistory.push(
                    new RetryAttempt({
                      timestamp: DateTime.unsafeNow(),
                      attemptNumber: attemptNumber++,
                      errorMessage: `Printer unreachable: ${error.host}:${error.port}`,
                      result: "failure",
                    })
                  );
                }
              })
            ),
            Effect.retry({
              schedule: retrySchedule,
              while: (error) => error._tag === "PrinterUnreachable",
            }),
            Effect.tap(() =>
              Effect.sync(() => {
                // If we had retries and final attempt succeeded
                if (retryHistory.length > 0) {
                  retryHistory.push(
                    new RetryAttempt({
                      timestamp: DateTime.unsafeNow(),
                      attemptNumber: attemptNumber,
                      errorMessage: "Print succeeded after retries",
                      result: "success",
                    })
                  );
                }
              })
            ),
            Effect.map(() => ({ success: true, retryHistory })),
            Effect.catchAll((error) =>
              Effect.sync(() => {
                // All retries failed
                retryHistory.push(
                  new RetryAttempt({
                    timestamp: DateTime.unsafeNow(),
                    attemptNumber: attemptNumber,
                    errorMessage:
                      error._tag === "PrinterUnreachable"
                        ? `Printer unreachable: ${error.host}:${error.port}`
                        : error.message,
                    result: "failure",
                  })
                );
              }).pipe(Effect.andThen(Effect.fail(error)))
            )
          );

          return yield* printEffect;
        }).pipe(
          Effect.withSpan("PrinterService.printDocument"),
          Effect.annotateLogs({ htmlLength: html.length })
        );

      return { printDocument } as const;
    })
  ).pipe(Layer.provide(PdfConverter.Default));
}
