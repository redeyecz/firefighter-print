/**
 * Configuration Types
 * Types for system configuration
 */

export interface EmailConfig {
  host: string;
  port: number;
  username: string;
  password: string; // Will be masked in API responses
  checkIntervalSeconds: number;
}

export interface FilterConfig {
  subjectContains?: string;
  subjectRegex?: string;
  fromAddress?: string;
}

export interface StationConfig {
  latitude: number;
  longitude: number;
  name: string;
}

export interface CUPSConfig {
  host: string;
  port: number;
  printerName: string;
}

export interface PrintConfig {
  autoRetryCount: number;
  retryDelaySeconds: number;
}

export interface MapConfig {
  apiKey: string; // Will be masked in API responses
  provider: "mapy.cz";
}

export interface SystemConfig {
  email: EmailConfig;
  filter: FilterConfig;
  station: StationConfig;
  cups: CUPSConfig;
  print: PrintConfig;
  map: MapConfig;
}

export interface ConfigValidationError {
  field: string;
  message: string;
}
