# End-to-End Testing Guide

This document describes the E2E testing strategy for the Firefighter Alarm System.

## Overview

End-to-end tests verify the complete system workflow from email receipt to print output. Tests cover both happy paths and failure scenarios.

## Test Framework

- **Framework**: Vitest with @effect/vitest for Effect-TS integration
- **Browser Testing**: Playwright (for admin panel UI)
- **API Testing**: Direct HTTP calls to Next.js API routes
- **Mocking**: Mock email server, map service, and CUPS printer

## Test Environment Setup

### Prerequisites

```bash
# Install test dependencies
bun add -D @playwright/test
bun add -D mailhog  # Mock email server

# Start test environment
docker-compose -f docker-compose.test.yml up -d
```

### Test Configuration

Create `vitest.e2e.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "e2e",
    include: ["test/e2e/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: true,
    setupFiles: ["./test/e2e/setup.ts"],
  },
});
```

### Test Environment Variables

Create `.env.test`:

```env
NODE_ENV=test
DATABASE_PATH=./test/data/test.db
EMAIL_HOST=localhost
EMAIL_PORT=1025
CUPS_HOST=localhost
CUPS_PORT=6310
MAP_API_KEY=test_api_key_mock
LOG_LEVEL=debug
```

## Test Fixtures

### Email Fixtures

Located in `test/fixtures/emails/`:

**1. Valid Dispatch Email** (`valid-dispatch.eml`)

```
From: dispatch@emergency.com
To: station@firestation.com
Subject: DISPATCH - Structure Fire
Date: Mon, 1 Jan 2024 12:00:00 +0000

Emergency at 123 Main Street, Prague
GPS Coordinates: 50.0755, 14.4378
Type: Structure Fire
Units Required: 2
Contact: John Doe - 555-0123
```

**2. Multiple GPS Coordinates** (`multiple-gps.eml`)

```
From: dispatch@emergency.com
Subject: DISPATCH - Multi-location incident

Incident at multiple locations:
Location 1: 50.0755, 14.4378
Location 2: 50.0800, 14.4400

Respond to first location.
```

**3. No GPS Coordinates** (`no-gps.eml`)

```
From: dispatch@emergency.com
Subject: DISPATCH - No location info

Emergency reported but GPS coordinates not available.
Address: Somewhere in Prague
```

**4. Filtered Out Email** (`spam.eml`)

```
From: newsletter@company.com
Subject: Weekly Newsletter

This should be filtered out.
```

## Test Scenarios

### Happy Path Test

**File**: `test/e2e/happy-path.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestServer, stopTestServer } from "./helpers/server";
import { sendTestEmail } from "./helpers/email";
import { waitForJobCompletion } from "./helpers/jobs";

describe("Happy Path: Complete workflow", () => {
  let serverUrl: string;

  beforeAll(async () => {
    serverUrl = await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  it("should process dispatch email end-to-end", async () => {
    // 1. Send test email
    const emailId = await sendTestEmail("valid-dispatch.eml");

    // 2. Wait for processing (max 30 seconds)
    const job = await waitForJobCompletion(emailId, 30000);

    // 3. Verify job status
    expect(job.status).toBe("Printed");
    expect(job.error).toBeNull();

    // 4. Verify GPS extraction
    expect(job.gpsCoordinates).toEqual({
      latitude: 50.0755,
      longitude: 14.4378,
    });

    // 5. Verify map was generated
    expect(job.mapUrl).toBeDefined();

    // 6. Verify document was assembled
    expect(job.finalHtml).toContain("50.0755");
    expect(job.finalHtml).toContain("14.4378");

    // 7. Verify print job was created
    const printJobs = await getPrintJobs();
    expect(printJobs).toHaveLength(1);
    expect(printJobs[0].jobId).toBe(job.id);
  }, 35000);
});
```

### Failure Scenarios

**File**: `test/e2e/failure-scenarios.test.ts`

```typescript
import { describe, it, expect } from "vitest";

describe("Failure Scenarios", () => {
  it("should handle GPS not found gracefully", async () => {
    const emailId = await sendTestEmail("no-gps.eml");
    const job = await waitForJobCompletion(emailId, 30000);

    expect(job.status).toBe("Failed");
    expect(job.error).toContain("GPS coordinates not found in email");

    // Verify error document was still created
    expect(job.finalHtml).toContain("GPS coordinates not found");
    expect(job.finalHtml).toContain("Error");
  });

  it("should handle map service unavailable", async () => {
    // Mock map service to return 503
    mockMapService.setResponse(503, "Service Unavailable");

    const emailId = await sendTestEmail("valid-dispatch.eml");
    const job = await waitForJobCompletion(emailId, 30000);

    expect(job.status).toBe("Failed");
    expect(job.error).toContain("Map could not be generated");
    expect(job.error).toContain("Mapping service is unavailable");
  });

  it("should retry printer failures", async () => {
    // Mock printer to fail twice, succeed on third attempt
    mockCups.setFailureCount(2);

    const emailId = await sendTestEmail("valid-dispatch.eml");
    const job = await waitForJobCompletion(emailId, 40000);

    expect(job.status).toBe("Printed");
    expect(job.retryCount).toBe(2);
  });

  it("should fail after max retries", async () => {
    // Mock printer to always fail
    mockCups.setFailureCount(Infinity);

    const emailId = await sendTestEmail("valid-dispatch.eml");
    const job = await waitForJobCompletion(emailId, 60000);

    expect(job.status).toBe("Failed");
    expect(job.error).toContain("Printing failed");
    expect(job.retryCount).toBe(3);
  });
});
```

### Admin Panel E2E Tests

**File**: `test/e2e/admin-panel.test.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");
  });

  test("should display dashboard with stats", async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('[data-testid="stats-card"]');

    // Verify stats cards are visible
    const totalCard = page.locator("text=Total (24h)");
    await expect(totalCard).toBeVisible();

    const successCard = page.locator("text=Successful");
    await expect(successCard).toBeVisible();
  });

  test("should display email processing log", async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector("table");

    // Verify table has rows
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(5); // Assuming 5 test jobs
  });

  test("should open preview modal", async ({ page }) => {
    // Click preview button on first job
    await page.locator('button:has-text("Preview")').first().click();

    // Verify modal opened
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verify tabs are present
    await expect(page.locator("text=Original Email")).toBeVisible();
    await expect(page.locator("text=Final Output")).toBeVisible();
  });

  test("should retry failed job", async ({ page }) => {
    // Find failed job
    await page.locator("text=Failed").first().click();

    // Click retry button
    await page.locator('button:has-text("Retry")').click();

    // Verify button shows "Retrying..."
    await expect(page.locator('button:has-text("Retrying...")')).toBeVisible();

    // Wait for completion
    await page.waitForTimeout(5000);

    // Verify status updated
    await expect(page.locator("text=Printed").first()).toBeVisible();
  });

  test("should update configuration", async ({ page }) => {
    await page.goto("http://localhost:3000/settings");

    // Update station name
    const stationNameInput = page.locator('input[id="station-name"]');
    await stationNameInput.fill("Test Fire Station");

    // Save
    await page.locator('button:has-text("Save Configuration")').click();

    // Verify success message
    await expect(page.locator("text=Configuration saved successfully")).toBeVisible();
  });
});
```

### Performance Tests

**File**: `test/e2e/performance.test.ts`

```typescript
import { describe, it, expect } from "vitest";

describe("Performance Tests", () => {
  it("should handle 10 concurrent emails", async () => {
    const startTime = Date.now();

    // Send 10 emails concurrently
    const promises = Array.from({ length: 10 }, (_, i) =>
      sendTestEmail("valid-dispatch.eml", `test-${i}`)
    );

    const emailIds = await Promise.all(promises);

    // Wait for all to complete
    const jobs = await Promise.all(emailIds.map((id) => waitForJobCompletion(id, 60000)));

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all completed successfully
    expect(jobs.every((j) => j.status === "Printed")).toBe(true);

    // Verify average processing time < 30 seconds
    const avgTime = duration / 10;
    expect(avgTime).toBeLessThan(30000);

    console.log(`Processed 10 emails in ${duration}ms (avg: ${avgTime}ms)`);
  });

  it("should process single email within 30 seconds", async () => {
    const startTime = Date.now();

    const emailId = await sendTestEmail("valid-dispatch.eml");
    const job = await waitForJobCompletion(emailId, 30000);

    const duration = Date.now() - startTime;

    expect(job.status).toBe("Printed");
    expect(duration).toBeLessThan(30000);

    console.log(`Email processed in ${duration}ms`);
  });

  it("should not leak memory during processing", async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Process 50 emails
    for (let i = 0; i < 50; i++) {
      const emailId = await sendTestEmail("valid-dispatch.eml", `mem-test-${i}`);
      await waitForJobCompletion(emailId, 30000);
    }

    // Force garbage collection (requires --expose-gc)
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

    // Memory increase should be less than 50MB
    expect(memoryIncrease).toBeLessThan(50);

    console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
  });
});
```

## Test Helpers

### Server Helper

**File**: `test/e2e/helpers/server.ts`

```typescript
import { spawn, ChildProcess } from "child_process";

let serverProcess: ChildProcess | null = null;

export async function startTestServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    serverProcess = spawn("bun", ["run", "dev"], {
      env: { ...process.env, NODE_ENV: "test" },
    });

    serverProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      if (output.includes("ready on")) {
        resolve("http://localhost:3000");
      }
    });

    serverProcess.stderr?.on("data", (data) => {
      console.error("Server error:", data.toString());
    });

    setTimeout(() => reject(new Error("Server start timeout")), 30000);
  });
}

export async function stopTestServer(): Promise<void> {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}
```

### Email Helper

**File**: `test/e2e/helpers/email.ts`

```typescript
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 1025, // MailHog SMTP port
  ignoreTLS: true,
});

export async function sendTestEmail(fixtureName: string, customId?: string): Promise<string> {
  const fixturePath = path.join(__dirname, "../../fixtures/emails", fixtureName);
  const emailContent = fs.readFileSync(fixturePath, "utf-8");

  const emailId = customId || `test-${Date.now()}`;

  await transporter.sendMail({
    from: "dispatch@emergency.com",
    to: "station@firestation.com",
    subject: `[${emailId}] ${extractSubject(emailContent)}`,
    text: emailContent,
  });

  return emailId;
}

function extractSubject(content: string): string {
  const match = content.match(/^Subject: (.+)$/m);
  return match ? match[1] : "Test Email";
}
```

### Job Helper

**File**: `test/e2e/helpers/jobs.ts`

```typescript
export async function waitForJobCompletion(emailId: string, timeoutMs: number): Promise<Job> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const response = await fetch(`http://localhost:3000/api/emails?limit=100`);
    const data = await response.json();

    const job = data.jobs.find(
      (j: Job) => j.subject.includes(emailId) && (j.status === "Printed" || j.status === "Failed")
    );

    if (job) {
      return job;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Job ${emailId} did not complete within ${timeoutMs}ms`);
}

export async function getPrintJobs(): Promise<PrintJob[]> {
  // Mock implementation - would query CUPS in real scenario
  const response = await fetch("http://localhost:3000/api/print-jobs");
  return response.json();
}
```

## Running Tests

### All E2E Tests

```bash
bun run test:e2e
```

### Specific Test Suite

```bash
bun run test:e2e -- happy-path.test.ts
```

### With Coverage

```bash
bun run test:e2e -- --coverage
```

### Watch Mode

```bash
bun run test:e2e -- --watch
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      mailhog:
        image: mailhog/mailhog
        ports:
          - 1025:1025
          - 8025:8025

    steps:
      - uses: actions/checkout@v3

      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run E2E tests
        run: bun run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-results
          path: test-results/
```

## Test Data Cleanup

After each test run, clean up:

```bash
# Remove test database
rm -f test/data/test.db

# Clear test logs
rm -f test/logs/*.log

# Stop mock services
docker-compose -f docker-compose.test.yml down
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Timeouts**: Set appropriate timeouts (30s for processing)
4. **Fixtures**: Use realistic test data
5. **Assertions**: Verify all critical steps
6. **Logging**: Enable debug logs in test environment
7. **Performance**: Monitor test execution time
8. **Flakiness**: Retry flaky tests, investigate root cause

## Troubleshooting

### Tests Timing Out

- Increase timeout in test configuration
- Check if services are running (MailHog, CUPS mock)
- Verify network connectivity

### Mock Services Not Working

```bash
# Check if services are running
docker-compose -f docker-compose.test.yml ps

# View service logs
docker-compose -f docker-compose.test.yml logs mailhog
```

### Database Locked

- Ensure no other process is using test database
- Add retry logic with delays

### Tests Passing Locally But Failing in CI

- Check CI environment variables
- Verify service ports are available
- Add diagnostic logging

## Coverage Goals

- **Happy Path**: 100% coverage
- **Error Scenarios**: All major failure modes
- **Admin Panel**: All critical user flows
- **Performance**: 30-second target verified

## Future Enhancements

- Visual regression testing (screenshots)
- Load testing (100+ concurrent emails)
- Chaos engineering (random failures)
- Integration with real email server (staging)
