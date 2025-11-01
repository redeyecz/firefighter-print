/**
 * Document Assembly Service
 * Combines original email with maps, errors, and warnings into printable HTML
 */

import { Effect, Context, Layer } from "effect";
import { PrintDocument, DocumentSection } from "@/backend/domain/document";
import type { MapResponse } from "@/backend/domain/map";
import type { GPSExtractionResult } from "@/backend/domain/gps";
import { DocumentError } from "@/lib/errors";
import { createErrorTemplate, createMapTemplate, assembleDocument } from "./document-templates";
import { ConfigService } from "@/backend/config/loader";

/**
 * Document Assembler Service interface
 */
export interface IDocumentAssembler {
  /**
   * Assemble complete print document from email, GPS result, and map result
   */
  readonly assemble: (
    emailHtml: string,
    gpsResult: Effect.Effect<GPSExtractionResult, Error>,
    mapResult: Effect.Effect<MapResponse, Error>
  ) => Effect.Effect<PrintDocument, DocumentError, ConfigService>;
}

/**
 * DocumentAssembler tag
 */
export class DocumentAssembler extends Context.Tag("DocumentAssembler")<
  DocumentAssembler,
  IDocumentAssembler
>() {}

/**
 * Create Document Assembler implementation
 */
const makeDocumentAssembler = (): IDocumentAssembler => {
  /**
   * Assemble the document
   */
  const assemble = (
    emailHtml: string,
    gpsResult: Effect.Effect<GPSExtractionResult, Error>,
    mapResult: Effect.Effect<MapResponse, Error>
  ): Effect.Effect<PrintDocument, DocumentError, ConfigService> =>
    Effect.gen(function* () {
      const config = yield* ConfigService;
      const appConfig = yield* Effect.mapError(
        config.getConfig(),
        (configError) =>
          new DocumentError({
            message: `Configuration error: ${configError.message}`,
            cause: configError,
          })
      );

      const layout = "single-page" as "single-page" | "two-page"; // TODO: Get from appConfig.print.format when print config is added
      const warnings: string[] = [];
      const sections: DocumentSection[] = [];

      // Try to get GPS result
      const gps = yield* Effect.either(gpsResult);

      if (gps._tag === "Left") {
        // GPS extraction failed - add error section
        const errorHtml = createErrorTemplate({
          title: "GPS Coordinates Not Found",
          message: "GPS coordinates not found in email",
          details: gps.left.message,
        });

        sections.push(
          new DocumentSection({
            type: "error",
            content: errorHtml,
            title: "GPS Error",
          })
        );
      } else {
        // GPS extraction succeeded
        const gpsData = gps.right;

        // Check for warnings
        if (gpsData.warning) {
          warnings.push(gpsData.warning);
        }

        // Try to get map result
        const map = yield* Effect.either(mapResult);

        if (map._tag === "Left") {
          // Map generation failed - add error section
          const errorHtml = createErrorTemplate({
            title: "Map Generation Failed",
            message: map.left.message,
            details:
              "The route map could not be generated. Please use GPS coordinates above for navigation.",
          });

          sections.push(
            new DocumentSection({
              type: "error",
              content: errorHtml,
              title: "Map Error",
            })
          );
        } else {
          // Map generation succeeded - add map section
          const mapData = map.right;

          const mapHtml = createMapTemplate({
            imageUrl: mapData.imageUrl,
            startPoint: {
              latitude: appConfig.station.location.latitude,
              longitude: appConfig.station.location.longitude,
            },
            destination: gpsData.coordinates,
            distance: mapData.route?.distance,
            duration: mapData.route?.duration,
          });

          sections.push(
            new DocumentSection({
              type: "map",
              content: mapHtml,
              title: "Route Map",
            })
          );
        }
      }

      // Assemble final HTML
      const sectionHtmls = sections.map((s) => s.content);
      const finalHtml = assembleDocument(emailHtml, sectionHtmls, warnings, layout);

      return new PrintDocument({
        originalHtml: emailHtml,
        appendedContent: sections,
        warnings,
        layout,
        finalHtml,
      });
    });

  return {
    assemble,
  };
};

/**
 * DocumentAssembler Layer
 */
export const DocumentAssemblerLive = Layer.effect(
  DocumentAssembler,
  Effect.gen(function* () {
    return makeDocumentAssembler();
  })
);
