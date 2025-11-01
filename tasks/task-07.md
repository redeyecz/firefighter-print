# Task 7: CUPS Printing Service

## Story
**As a** system
**I want** to send assembled documents to a CUPS printer
**So that** dispatch information is automatically printed for firefighters

## Acceptance Criteria

**Given** a printable HTML document and a reachable CUPS server
**When** the system sends the document to print
**Then** the document is successfully queued for printing

**Given** the CUPS server is unreachable
**When** the system attempts to print
**Then** it returns an error "Printing failed: Printer is unreachable"

**Given** a print job fails
**When** the system detects the failure
**Then** it retries 3 times with 30-second delays between attempts

**Given** all 3 retry attempts fail
**When** the final retry fails
**Then** the job is marked as "Failed" and no further automatic retries occur

**Given** automatic retries occur
**When** I hover over the retry indicator in the admin panel
**Then** I see a tooltip with retry count and human-readable messages for each automatic retry attempt

## Subtasks

7.1. Create printing domain models
   - Define PrintJob type (documentId, html, status, attemptCount)
   - Define PrintConfig type (cupsHost, cupsPort, printerName)
   - Define PrintError types (Unreachable, PrinterError, etc.)
   - Define RetryAttempt type (timestamp, attemptNumber, errorMessage, result)

7.2. Research CUPS integration options
   - Evaluate Node.js CUPS libraries
   - Test HTML to PDF conversion (wkhtmltopdf, puppeteer, or similar)
   - Document required system dependencies

7.3. Implement HTML to PDF converter
   - Create convertHtmlToPdf(html) function
   - Configure PDF options (page size, margins)
   - Handle conversion errors
   - Return Effect<Buffer, ConversionError>

7.4. Implement CUPS client
   - Create PrinterService using Effect
   - Implement printDocument(pdf, config) returning Effect<void, PrintError>
   - Handle CUPS-specific errors
   - Add connection health check

7.5. Implement retry logic with tracking
   - Create retryPrint() with 3 attempts
   - Add 30-second delay between retries (Effect.sleep)
   - Track each retry attempt with timestamp and error message
   - Store retry attempts in RetryAttempt array
   - Return retry history along with final result
   - Log each attempt

7.6. Add unit tests
   - Mock CUPS responses
   - Test successful print
   - Test unreachable server
   - Test retry logic (1st fails, 2nd succeeds)
   - Test all retries fail
