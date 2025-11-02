/**
 * Configuration API Routes
 * GET: Returns current configuration (with secrets masked)
 * PUT: Updates configuration
 */

import { NextRequest, NextResponse } from "next/server";
import type { SystemConfig, ConfigValidationError } from "@/types/config";

/**
 * Masks sensitive fields in configuration
 */
function maskSecrets(config: SystemConfig): SystemConfig {
  return {
    ...config,
    email: {
      ...config.email,
      password: config.email.password ? "********" : "",
    },
    map: {
      ...config.map,
      apiKey: config.map.apiKey ? "********" : "",
    },
  };
}

/**
 * Validates email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates GPS coordinates
 */
function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Validates configuration and returns errors
 */
function validateConfig(config: SystemConfig): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  // Email validation
  if (!isValidEmail(config.email.username)) {
    errors.push({
      field: "email.username",
      message: "Invalid email address format",
    });
  }

  if (config.email.port < 1 || config.email.port > 65535) {
    errors.push({
      field: "email.port",
      message: "Port must be between 1 and 65535",
    });
  }

  // Filter validation - subject contains and regex are mutually exclusive
  if (config.filter.subjectContains && config.filter.subjectRegex) {
    errors.push({
      field: "filter",
      message: "Subject contains and subject regex are mutually exclusive",
    });
  }

  // Station location validation
  if (!isValidCoordinate(config.station.latitude, config.station.longitude)) {
    errors.push({
      field: "station",
      message: "Invalid GPS coordinates",
    });
  }

  // CUPS validation
  if (config.cups.port < 1 || config.cups.port > 65535) {
    errors.push({
      field: "cups.port",
      message: "Port must be between 1 and 65535",
    });
  }

  // Print config validation
  if (config.print.autoRetryCount < 0 || config.print.autoRetryCount > 10) {
    errors.push({
      field: "print.autoRetryCount",
      message: "Retry count must be between 0 and 10",
    });
  }

  return errors;
}

export async function GET() {
  try {
    // TODO: Load configuration from database or encrypted config file
    const mockConfig: SystemConfig = {
      email: {
        host: "imap.example.com",
        port: 993,
        username: "dispatch@firestation.com",
        password: "secret123",
        checkIntervalSeconds: 30,
      },
      filter: {
        subjectContains: "DISPATCH",
        fromAddress: "dispatch@emergency.com",
      },
      station: {
        latitude: 50.0755,
        longitude: 14.4378,
        name: "Prague Fire Station 1",
      },
      cups: {
        host: "localhost",
        port: 631,
        printerName: "DispatchPrinter",
      },
      print: {
        autoRetryCount: 3,
        retryDelaySeconds: 5,
      },
      map: {
        apiKey: "mapy-api-key-secret",
        provider: "mapy.cz",
      },
    };

    // Mask secrets before returning
    const maskedConfig = maskSecrets(mockConfig);

    return NextResponse.json(maskedConfig);
  } catch (error) {
    console.error("Error fetching configuration:", error);
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const config: SystemConfig = await request.json();

    // Validate configuration
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // TODO: Save configuration to database or encrypted config file
    // TODO: Trigger hot-reload of services with new configuration
    // TODO: Log configuration change

    console.log("Configuration updated:", config);

    // Return success with masked config
    const maskedConfig = maskSecrets(config);
    return NextResponse.json({
      success: true,
      message: "Configuration updated successfully",
      config: maskedConfig,
    });
  } catch (error) {
    console.error("Error updating configuration:", error);
    return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 });
  }
}
