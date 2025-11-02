import { Context, Effect, Layer } from "effect";
import { chromium } from "playwright";
import { ConversionError } from "@/backend/domain/print";

/**
 * PDF Converter Service using Playwright
 * Converts HTML content to PDF format for printing
 */
export class PdfConverter extends Context.Tag("PdfConverter")<
  PdfConverter,
  {
    readonly convertHtmlToPdf: (html: string) => Effect.Effect<Buffer, ConversionError>;
  }
>() {
  /**
   * Default implementation of PdfConverter using Playwright
   */
  static readonly Default = Layer.scoped(
    PdfConverter,
    Effect.gen(function* () {
      // Launch browser in scoped context for automatic cleanup
      const browser = yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: () => chromium.launch({ headless: true }),
          catch: (cause) =>
            new ConversionError({
              message: "Failed to launch browser",
              cause,
            }),
        }),
        (browser) => Effect.promise(() => browser.close()).pipe(Effect.catchAll(() => Effect.void))
      );

      const convertHtmlToPdf = (html: string): Effect.Effect<Buffer, ConversionError> =>
        Effect.gen(function* () {
          // Create page
          const page = yield* Effect.tryPromise({
            try: () => browser.newPage(),
            catch: (cause) =>
              new ConversionError({
                message: "Failed to create browser page",
                cause,
              }),
          });

          // Set HTML content
          yield* Effect.tryPromise({
            try: () => page.setContent(html, { waitUntil: "networkidle" }),
            catch: (cause) =>
              new ConversionError({
                message: "Failed to set HTML content",
                cause,
              }),
          });

          // Generate PDF
          const pdfBuffer = yield* Effect.tryPromise({
            try: () =>
              page.pdf({
                format: "A4",
                printBackground: true,
                margin: {
                  top: "1cm",
                  right: "1cm",
                  bottom: "1cm",
                  left: "1cm",
                },
              }),
            catch: (cause) =>
              new ConversionError({
                message: "Failed to generate PDF",
                cause,
              }),
          });

          // Close page
          yield* Effect.promise(() => page.close()).pipe(Effect.catchAll(() => Effect.void));

          // Convert Uint8Array to Buffer
          return Buffer.from(pdfBuffer);
        }).pipe(
          Effect.withSpan("PdfConverter.convertHtmlToPdf"),
          Effect.annotateLogs({ htmlLength: html.length })
        );

      return { convertHtmlToPdf } as const;
    })
  );
}
