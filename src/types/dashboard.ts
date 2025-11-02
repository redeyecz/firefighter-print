/**
 * Dashboard API Response Types
 */

export type HealthStatus = "healthy" | "unhealthy" | "unknown";

export interface ServiceHealth {
  status: HealthStatus;
  message?: string;
  error?: string;
  lastCheck: string;
}

export interface SystemHealth {
  emailService: ServiceHealth;
  mapService: ServiceHealth;
  printerService: ServiceHealth;
  lastUpdated: string;
}

export interface DashboardStats {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
}

export type JobStatus = "Received" | "Processing" | "Printed" | "Failed";

export interface EmailLogEntry {
  id: string;
  subject: string;
  status: JobStatus;
  receivedDate: string;
  printedDate?: string;
  error?: string;
}

export interface EmailLogResponse {
  jobs: EmailLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
