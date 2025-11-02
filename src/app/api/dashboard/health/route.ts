/**
 * Service Health Check API Route
 * Returns health status of all system services
 */

import { Effect } from "effect";
import { ConfigService, ConfigServiceLive } from "@/backend/config/loader";
import type { SystemHealth } from "@/backend/domain/health";
import { Layer } from "effect";
import { runApiEffect } from "@/lib/effect-runtime";

export async function GET() {
  const effect = Effect.gen(function* () {
    const config = yield* ConfigService;
    const appConfig = yield* Effect.either(config.getConfig());

    const now = new Date();

    // Simplified health check based on configuration validity
    const health: SystemHealth = {
      emailService: {
        status: appConfig._tag === "Right" && appConfig.right.email.host ? "healthy" : "unhealthy",
        message:
          appConfig._tag === "Right" && appConfig.right.email.host
            ? "Email service is configured"
            : "Email service not configured",
        lastCheck: now,
      },
      mapService: {
        status: appConfig._tag === "Right" && appConfig.right.map.apiKey ? "healthy" : "unhealthy",
        message:
          appConfig._tag === "Right" && appConfig.right.map.apiKey
            ? "Map service is configured"
            : "Map service not configured",
        lastCheck: now,
      },
      printerService: {
        status:
          appConfig._tag === "Right" && appConfig.right.cups.printerName ? "healthy" : "unhealthy",
        message:
          appConfig._tag === "Right" && appConfig.right.cups.printerName
            ? "Printer is configured"
            : "Printer not configured",
        lastCheck: now,
      },
      lastUpdated: now,
    };

    return health;
  });

  return runApiEffect(effect, Layer.succeed(ConfigService, ConfigServiceLive));
}
