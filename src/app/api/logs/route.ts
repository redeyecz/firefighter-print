/**
 * Logs API Route
 * Returns system logs with optional filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { getLogEntries, LogLevel } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit");
    const level = searchParams.get("level");
    const jobId = searchParams.get("jobId");

    const logs = getLogEntries(
      limit ? parseInt(limit) : undefined,
      level as LogLevel | undefined,
      jobId || undefined
    );

    return NextResponse.json({
      logs,
      total: logs.length,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
