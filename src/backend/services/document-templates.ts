/**
 * HTML Templates for Document Assembly
 * Uses Tailwind CSS for styling with print-specific optimizations
 */

import type {
  ErrorTemplateData,
  WarningTemplateData,
  MapTemplateData,
} from "@/backend/domain/document";

/**
 * Tailwind CSS Configuration for Print Documents
 * Inline styles for maximum compatibility
 */
const TAILWIND_CDN = `<script src="https://cdn.tailwindcss.com"></script>`;

/**
 * Print-specific CSS styles
 * - High contrast for printing
 * - Large fonts for critical information
 * - Print media queries
 */
const PRINT_STYLES = `
<style>
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-break-before {
      page-break-before: always;
    }

    .page-break-after {
      page-break-after: always;
    }

    .no-print {
      display: none;
    }

    /* Ensure backgrounds print */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }

  /* Large, high-contrast fonts for critical data */
  .critical-text {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.5;
  }

  .error-text {
    font-size: 24px;
    font-weight: 800;
  }

  .warning-text {
    font-size: 18px;
    font-weight: 600;
  }
</style>
`;

/**
 * Visual separator between original email and appended content
 */
const createSeparator = (): string => `
<div class="my-8 border-t-4 border-gray-800 pt-6">
  <div class="text-center text-gray-600 font-bold text-sm uppercase tracking-wider mb-4">
    Dispatch System - Additional Information
  </div>
</div>
`;

/**
 * Warning message template
 * Displays prominently with yellow background
 */
export const createWarningTemplate = (data: WarningTemplateData): string => `
<div class="bg-yellow-100 border-l-4 border-yellow-600 p-6 mb-6">
  <div class="flex items-start">
    <div class="flex-shrink-0">
      <svg class="h-8 w-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-4">
      <p class="warning-text text-yellow-800">
        ⚠️ ${escapeHtml(data.message)}
      </p>
    </div>
  </div>
</div>
`;

/**
 * Error message template
 * Displays with red border and large text for visibility
 */
export const createErrorTemplate = (data: ErrorTemplateData): string => `
<div class="bg-red-50 border-4 border-red-600 rounded-lg p-8 mb-6">
  <div class="flex items-start">
    <div class="flex-shrink-0">
      <svg class="h-10 w-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-4 flex-1">
      <h3 class="error-text text-red-800 mb-3">
        ❌ ${escapeHtml(data.title)}
      </h3>
      <p class="critical-text text-red-700 mb-2">
        ${escapeHtml(data.message)}
      </p>
      ${data.details ? `<p class="text-base text-red-600 mt-3 font-mono">${escapeHtml(data.details)}</p>` : ""}
    </div>
  </div>
</div>
`;

/**
 * Map display template
 * Shows the route map with distance and duration information
 */
export const createMapTemplate = (data: MapTemplateData): string => {
  const distanceKm = data.distance ? (data.distance / 1000).toFixed(1) : null;
  const durationMin = data.duration ? Math.ceil(data.duration / 60) : null;

  return `
<div class="bg-white border-2 border-gray-300 rounded-lg overflow-hidden mb-6">
  <div class="bg-blue-600 text-white p-4">
    <h3 class="text-xl font-bold">🗺️ Route Map</h3>
  </div>

  <div class="p-6">
    <!-- Route Information -->
    <div class="grid grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded">
      <div>
        <p class="text-sm text-gray-600 font-semibold">Starting Point</p>
        <p class="critical-text text-gray-900">
          ${data.startPoint.latitude.toFixed(6)}°, ${data.startPoint.longitude.toFixed(6)}°
        </p>
      </div>
      <div>
        <p class="text-sm text-gray-600 font-semibold">Emergency Location</p>
        <p class="critical-text text-red-600">
          ${data.destination.latitude.toFixed(6)}°, ${data.destination.longitude.toFixed(6)}°
        </p>
      </div>
    </div>

    ${
      distanceKm && durationMin
        ? `
    <div class="grid grid-cols-2 gap-4 mb-6 bg-green-50 p-4 rounded">
      <div>
        <p class="text-sm text-gray-600 font-semibold">Distance</p>
        <p class="critical-text text-green-700">${distanceKm} km</p>
      </div>
      <div>
        <p class="text-sm text-gray-600 font-semibold">Estimated Time</p>
        <p class="critical-text text-green-700">${durationMin} min</p>
      </div>
    </div>
    `
        : ""
    }

    <!-- Map Image -->
    <div class="border-4 border-gray-400 rounded overflow-hidden">
      <img
        src="${escapeHtml(data.imageUrl)}"
        alt="Route Map"
        class="w-full h-auto"
        style="max-width: 100%; height: auto;"
      />
    </div>
  </div>
</div>
`;
};

/**
 * Assemble complete HTML document
 */
export const assembleDocument = (
  originalHtml: string,
  appendedSections: string[],
  warnings: string[],
  layout: "single-page" | "two-page"
): string => {
  const separator = createSeparator();
  const warningBlocks = warnings.map((w) => createWarningTemplate({ message: w })).join("\n");

  // Add page break for two-page layout
  const pageBreak = layout === "two-page" ? '<div class="page-break-before"></div>' : "";

  const appendedContent = `
    ${pageBreak}
    ${separator}
    ${warningBlocks}
    ${appendedSections.join("\n")}
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Firefighter Dispatch</title>
  ${TAILWIND_CDN}
  ${PRINT_STYLES}
</head>
<body class="bg-white p-8">
  <!-- Original Email Content (Unmodified) -->
  <div id="original-email">
    ${originalHtml}
  </div>

  <!-- Appended Content (Map or Errors) -->
  <div id="appended-content" class="mt-4">
    ${appendedContent}
  </div>
</body>
</html>
`;
};

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
