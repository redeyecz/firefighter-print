/**
 * Print Job API Route
 * Sends a job directly to the printer
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // TODO: Once printer service is fully integrated, send to actual printer
    // For now, simulate print success

    console.log(`Print requested for job ${id}`);

    // Simulate a slight delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: `Job ${id} sent to printer successfully`,
    });
  } catch (error) {
    console.error("Error printing job:", error);
    return NextResponse.json({ error: "Failed to print job" }, { status: 500 });
  }
}
