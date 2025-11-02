/**
 * Health Check Domain Models
 */

/**
 * Service health status
 */
export type HealthStatus = "healthy" | "unhealthy" | "unknown";

/**
 * Individual service health information
 */
export interface ServiceHealth {
  readonly status: HealthStatus;
  readonly lastCheck: Date;
  readonly message?: string;
  readonly error?: string;
}

/**
 * Overall system health
 */
export interface SystemHealth {
  readonly emailService: ServiceHealth;
  readonly mapService: ServiceHealth;
  readonly printerService: ServiceHealth;
  readonly lastUpdated: Date;
}
