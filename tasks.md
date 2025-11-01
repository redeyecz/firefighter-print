# Automated Dispatch Printing System - Task Breakdown

## Overview

This document breaks down the PRD v1.3 into individual tasks following ATDD (Acceptance Test Driven Development) methodology. Each task includes acceptance criteria in Given-When-Then format and implementation subtasks.

**Tech Stack:** TypeScript, Effect-TS, Next.js (frontend)

---

## Task 1: Project Setup and Core Infrastructure

### Story

**As a** developer
**I want** to set up the project structure with TypeScript and Effect-TS
**So that** I have a solid foundation for building the dispatch system with type safety and functional error handling

### Acceptance Criteria

**Given** a new project repository
**When** I run the build command
**Then** TypeScript compiles successfully with strict mode enabled

**Given** Effect-TS is configured
**When** I create an Effect program
**Then** it executes with proper error handling and type inference

**Given** the project structure is set up
**When** I examine the directory layout
**Then** I see organized folders for: services, domain, infrastructure, admin-panel, config

### Subtasks

1.1. Initialize Node.js project with TypeScript

- Create package.json with TypeScript, Effect-TS dependencies
- Configure tsconfig.json with strict mode
- Set up build scripts (build, dev, test)

  1.2. Set up project directory structure

- Create `/src` with subdirectories: `/services`, `/domain`, `/infrastructure`, `/admin-panel`, `/config`
- Create `/tests` directory with same structure
- Add README.md with setup instructions

  1.3. Configure Effect-TS

- Install @effect/schema, @effect/platform
- Create base Effect utilities (error handling, logging)
- Set up Effect runtime configuration

  1.4. Set up development tooling

- Configure ESLint for TypeScript
- Configure Prettier
- Add pre-commit hooks (husky)
- Set up nodemon for development

  1.5. Create configuration management system

- Design configuration schema using @effect/schema
- Implement config loader from environment variables
- Create validation for all required settings
- Add config type definitions

---

## Task 2: Email Monitoring Service - Basic Connection

### Story

**As a** system
**I want** to continuously monitor an email inbox
**So that** I can detect new dispatch emails in real-time

### Acceptance Criteria

**Given** valid IMAP credentials are configured
**When** the email service starts
**Then** it successfully connects to the email server

**Given** the email service is running
**When** a new email arrives in the inbox
**Then** the system detects it within 5 seconds

**Given** the email connection fails
**When** attempting to connect
**Then** the system logs a clear error and retries with exponential backoff

### Subtasks

2.1. Create Email domain models

- Define Email type (subject, from, body, receivedDate)
- Define EmailConfig type (host, port, user, password)
- Create validation schemas using @effect/schema

  2.2. Implement IMAP client wrapper

- Create EmailClient service using Effect
- Implement connect() method with error handling
- Add connection health check
- Implement disconnect() for cleanup

  2.3. Implement email polling mechanism

- Create polling service that checks for new emails
- Use Effect.repeat for interval-based polling
- Handle connection errors with retry logic
- Add logging for monitoring

  2.4. Create email fetcher

- Implement fetchNewEmails() returning Effect<Email[], EmailError>
- Parse raw email into domain model
- Preserve original HTML content
- Extract metadata (subject, from, receivedDate)

  2.5. Add unit tests

- Test connection success/failure scenarios
- Test email parsing
- Test polling mechanism
- Mock IMAP responses

---

## Task 3: Email Filtering Service

### Story

**As a** system
**I want** to filter emails based on configurable rules
**So that** I only process relevant dispatch emails

### Acceptance Criteria

**Given** a sender email filter is configured
**When** an email from that sender arrives
**Then** it passes the filter

**Given** a "subject contains" filter is configured
**When** an email with matching subject arrives
**Then** it passes the filter

**Given** both sender and subject filters are configured
**When** an email matches both conditions
**Then** it passes the filter (AND logic)

**Given** a "subject regex" filter is configured
**When** an email subject matches the regex pattern
**Then** it passes the filter

**Given** both "subject contains" and "subject regex" are configured
**When** validating the configuration
**Then** it returns an error (mutually exclusive)

### Subtasks

3.1. Create filter domain models

- Define FilterRule type (senderEmail, subjectContains, subjectRegex)
- Add validation: subjectContains and subjectRegex are mutually exclusive
- Create FilterConfig schema

  3.2. Implement email filter service

- Create EmailFilter service
- Implement matchesSender() function
- Implement matchesSubject() function
- Implement matchesRegex() function with error handling

  3.3. Implement filter application logic

- Create applyFilters(email, filterConfig) function
- Implement AND logic for multiple filters
- Return Effect<boolean, FilterError>
- Add detailed logging for filter decisions

  3.4. Add unit tests

- Test sender email matching (exact match, case sensitivity)
- Test subject contains matching
- Test regex matching (valid and invalid patterns)
- Test AND logic with multiple filters
- Test mutual exclusivity validation

---

## Task 4: GPS Coordinate Extraction Service

### Story

**As a** system
**I want** to extract GPS coordinates from email content
**So that** I can generate route maps to emergency locations

### Acceptance Criteria

**Given** an email contains GPS coordinates in Decimal Degrees format (e.g., "49.947014 N, 17.885027 E")
**When** the system parses the email
**Then** it extracts the coordinates as {latitude: 49.947014, longitude: 17.885027}

**Given** an email contains multiple GPS coordinate sets
**When** the system parses the email
**Then** it extracts the first set and returns a warning "Multiple GPS locations found; please verify"

**Given** an email contains no GPS coordinates
**When** the system parses the email
**Then** it returns an error "GPS coordinates not found in email"

**Given** an email contains malformed coordinates
**When** the system parses the email
**Then** it returns an error with details about the parsing failure

### Subtasks

4.1. Create GPS domain models

- Define GPSCoordinates type (latitude, longitude)
- Define GPSExtractionResult type (coordinates, warning?)
- Create validation schema for coordinate ranges (-90 to 90, -180 to 180)

  4.2. Implement coordinate regex patterns

- Create regex for Decimal Degrees format
- Support variations: "N/S", "E/W", with/without spaces
- Handle both comma and space separators
- Test against sample dispatch emails

  4.3. Implement GPS extraction service

- Create extractGPS(emailBody) function returning Effect<GPSExtractionResult, GPSError>
- Parse HTML to plain text if needed
- Find all coordinate matches
- Return first match with warning if multiple found

  4.4. Add coordinate validation

- Validate latitude range (-90 to 90)
- Validate longitude range (-180 to 180)
- Check for realistic values
- Return typed errors for invalid coordinates

  4.5. Add unit tests

- Test various Decimal Degrees formats
- Test multiple coordinates (warning scenario)
- Test no coordinates found
- Test malformed coordinates
- Test edge cases (exactly 90°, 180°, etc.)

---

## Task 5: Map Generation Service

### Story

**As a** system
**I want** to generate static route maps from a starting point to the emergency location
**So that** firefighters have visual navigation guidance

### Acceptance Criteria

**Given** valid GPS coordinates and a mapping service API key
**When** the system requests a route map
**Then** it receives a static map image showing the route from station to destination

**Given** the mapping service is unavailable
**When** the system requests a map
**Then** it returns an error "Map could not be generated: Mapping service is unavailable"

**Given** an invalid API key is configured
**When** the system requests a map
**Then** it returns an error "Map could not be generated: Invalid API key"

**Given** a network timeout occurs
**When** the system requests a map
**Then** it returns an error after the configured timeout period

### Subtasks

5.1. Create map domain models

- Define MapRequest type (startPoint, destination, apiKey)
- Define MapResponse type (imageUrl or imageData, format)
- Define MapError types (ServiceUnavailable, InvalidKey, Timeout, etc.)

  5.2. Research and select mapping service

- Evaluate options: Google Maps Static API, Mapbox, OpenStreetMap
- Document API requirements and pricing
- Create configuration for selected service

  5.3. Implement mapping service client

- Create MapService using Effect
- Implement generateRouteMap(start, destination) returning Effect<MapResponse, MapError>
- Add HTTP client with timeout configuration
- Handle API-specific error responses

  5.4. Implement retry logic for transient failures

- Use Effect.retry for network errors
- Configure retry schedule (e.g., 3 attempts with exponential backoff)
- Don't retry on authentication errors
- Log each retry attempt

  5.5. Add image validation

- Verify response is valid image data
- Check image size is within acceptable range
- Validate image format (PNG/JPEG)
- Return error if image is corrupted

  5.6. Add unit tests

- Mock HTTP responses for success case
- Test service unavailable scenario
- Test invalid API key scenario
- Test timeout scenario
- Test retry logic

---

## Task 6: HTML Document Assembly Service

### Story

**As a** system
**I want** to combine the original email with the generated map into a printable HTML document
**So that** firefighters receive all information in a clear, organized format

### Acceptance Criteria

**Given** an original email and a generated map
**When** the system assembles the document
**Then** the map is appended after the email with a visual separator (horizontal line and padding)

**Given** a map generation error occurred
**When** the system assembles the document
**Then** a human-readable error message is appended instead of the map

**Given** a GPS extraction warning exists
**When** the system assembles the document
**Then** the warning "Multiple GPS locations found; please verify" is displayed prominently

**Given** the original email HTML content
**When** the system assembles the document
**Then** the original HTML is preserved without modification

### Subtasks

6.1. Create document domain models

- Define PrintDocument type (originalHtml, appendedContent, warnings)
- Define DocumentSection type for appended content
- Create templates for error messages

  6.2. Implement HTML template engine

- Create template for map section with separator
- Create template for error message section
- Create template for warning messages
- Use template literals or a lightweight template library

  6.3. Implement document assembler

- Create assembleDocument(email, mapResult, gpsWarnings) function
- Preserve original email HTML exactly
- Append visual separator (HR tag with styling)
- Append map or error message
- Include any warnings prominently

  6.4. Add print-friendly CSS

- Create inline CSS for high-contrast printing
- Ensure large fonts for critical data
- Add print media queries
- Test legibility on actual printouts

  6.5. Implement single-page vs two-page layout

- Create layout logic based on configuration
- Single-page: combine all content
- Two-page: add page break before appended section
- Use CSS page-break properties

  6.6. Add unit tests

- Test document assembly with map
- Test document assembly with error
- Test warning inclusion
- Test HTML preservation
- Test layout variations

---

## Task 7: CUPS Printing Service

### Story

**As a** system
**I want** to send assembled documents to a CUPS printer
**So that** dispatch information is automatically printed for firefighters

### Acceptance Criteria

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

### Subtasks

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

---

## Task 8: Job Processing Orchestration

### Story

**As a** system
**I want** to orchestrate the entire workflow from email to printed output
**So that** the dispatch process is fully automated

### Acceptance Criteria

**Given** a new dispatch email arrives
**When** the system processes it
**Then** it executes: filter → extract GPS → generate map → assemble document → print

**Given** any step fails
**When** the workflow continues
**Then** it proceeds to document assembly with error information and attempts to print

**Given** a job completes successfully
**When** examining the job record
**Then** it contains: email metadata, GPS coordinates, map status, print status, timestamps

**Given** a job fails
**When** examining the job record
**Then** it contains: error details, step where failure occurred, timestamp

**Given** a job has automatic or manual retries
**When** examining the job record
**Then** it contains: full retry history with timestamps, attempt numbers, and human-readable error messages

### Subtasks

8.1. Create job domain models

- Define DispatchJob type (id, email, status, timestamps, results, errors, retryHistory)
- Define JobStatus enum (Received, Processing, Printed, Failed)
- Define JobResult type (gpsResult, mapResult, printResult)
- Define RetryHistoryEntry type (timestamp, attemptNumber, retryType: 'automatic' | 'manual', errorMessage, result)

  8.2. Create job repository interface

- Define methods: createJob, updateJob, getJob, listJobs
- Use Effect for all operations
- Support filtering by status, date range
- Support pagination

  8.3. Implement job orchestrator

- Create processDispatchEmail(email) function
- Chain all services using Effect.flatMap
- Handle errors at each step gracefully
- Update job status throughout workflow
- Capture and store retry history from print service

  8.4. Implement workflow error handling

- Catch errors at each step
- Continue to printing even if map fails (print email + error)
- Log errors with context
- Update job record with error details
- Append automatic retry attempts to retryHistory
- Store human-readable error messages for each retry

  8.5. Add workflow logging

- Log start of each workflow step
- Log completion with duration
- Log errors with full context
- Use structured logging for monitoring

  8.6. Add integration tests

- Test complete happy path
- Test GPS extraction failure path
- Test map generation failure path
- Test print failure path
- Test multiple concurrent jobs

---

## Task 9: Job Persistence Layer

### Story

**As a** system
**I want** to persist job records to a database
**So that** the admin panel can display processing history

### Acceptance Criteria

**Given** a job is created
**When** the system persists it
**Then** it can be retrieved by ID

**Given** multiple jobs exist
**When** querying with pagination (50 per page)
**Then** the correct subset of jobs is returned

**Given** jobs have various statuses
**When** filtering by status
**Then** only jobs matching that status are returned

**Given** jobs were processed in the last 24 hours
**When** querying for 24-hour statistics
**Then** the correct count and success rate are calculated

**Given** a job has retry attempts
**When** querying the job
**Then** the retry history is included with full details (timestamp, attempt number, retry type, error message, result)

### Subtasks

9.1. Select database technology

- Evaluate options: SQLite (simple, local), PostgreSQL (robust)
- Document choice rationale
- Consider deployment on Raspberry Pi

  9.2. Design database schema

- Create jobs table with all required fields
- Create retry_history table (jobId, timestamp, attemptNumber, retryType, errorMessage, result)
- Add indexes for common queries (status, receivedDate)
- Add foreign key relationship between retry_history and jobs
- Create migration scripts
- Document schema

  9.3. Implement repository with Effect-TS

- Create JobRepository service layer
- Implement createJob using Effect
- Implement updateJob using Effect
- Implement getJob using Effect (include retry history)
- Implement addRetryAttempt using Effect
- Implement getRetryHistory using Effect

  9.4. Implement query operations

- Implement listJobs with pagination
- Implement filterByStatus
- Implement filterByDateRange
- Implement get24HourStats

  9.5. Add database migrations

- Create initial schema migration
- Add migration runner
- Version migrations
- Document rollback procedures

  9.6. Add unit tests

- Test CRUD operations
- Test pagination
- Test filtering
- Test statistics calculations
- Use in-memory DB for tests

---

## Task 10: Admin Panel - Dashboard Overview

### Story

**As a** dispatch administrator
**I want** to see an overview of system status
**So that** I can quickly assess if the dispatch system is functioning properly

### Acceptance Criteria

**Given** I access the admin dashboard
**When** the page loads
**Then** I see: total emails processed (24h), successful jobs count, failed jobs count

**Given** the email service is healthy
**When** I view the dashboard
**Then** the email service indicator shows green

**Given** the CUPS server is unreachable
**When** I view the dashboard
**Then** the CUPS service indicator shows red

**Given** the mapping service is healthy
**When** I view the dashboard
**Then** the mapping service indicator shows green

### Subtasks

10.1. Set up admin panel with Next.js

- Initialize Next.js project with TypeScript
- Set up build configuration
- Create basic page layout structure
- Add CSS solution (Tailwind CSS or similar)

  10.2. Create dashboard UI components

- Create StatsCard component (24h processed, success/fail counts)
- Create ServiceStatus component (colored indicators)
- Create DashboardLayout component
- Make responsive for mobile

  10.3. Implement backend dashboard API

- Create GET /api/dashboard/stats endpoint
- Return 24-hour statistics
- Calculate success/failure counts
- Use Effect for data fetching

  10.4. Implement service health checks

- Create HealthCheck service
- Check email service connection
- Check CUPS server availability
- Check mapping service (light ping/health endpoint)
- Return Effect<HealthStatus, never>

  10.5. Create GET /api/dashboard/health endpoint

- Return status of all services
- Include last check timestamp
- Use green/yellow/red status codes
- Update every 30 seconds

  10.6. Connect frontend to backend

- Fetch stats on dashboard load
- Poll health status every 30 seconds
- Display loading states
- Handle API errors gracefully

  10.7. Add styling for non-technical users

- Use clear, large text
- Color-code status (green = good, red = problem)
- Add helpful tooltips

---

## Task 11: Admin Panel - Email Processing Log

### Story

**As a** dispatch administrator
**I want** to view a log of all processed emails
**So that** I can verify dispatches were handled correctly

### Acceptance Criteria

**Given** processed emails exist
**When** I view the email log
**Then** I see a paginated list (50 items per page) with: Status, Subject, Date Received, Date Printed, Error, Actions

**Given** I'm viewing a page of results
**When** I click "Next"
**Then** the next 50 items are displayed

**Given** a job has status "Success"
**When** I view the log
**Then** the status indicator is green

**Given** a job has status "Failed"
**When** I view the log
**Then** the status indicator is red and an error message is displayed

### Subtasks

11.1. Create email log UI components

- Create EmailLogTable component (Next.js)
- Create EmailLogRow component (status, subject, dates, error, actions)
- Create Pagination component
- Create StatusBadge component (color-coded)

  11.2. Implement backend email log API

- Create GET /api/emails?page=1&limit=50 endpoint
- Return paginated job records
- Include total count for pagination
- Sort by receivedDate descending (newest first)

  11.3. Connect frontend to backend

- Fetch email log on page load
- Handle pagination controls
- Display loading spinner
- Handle empty state (no emails)

  11.4. Add filtering options (optional enhancement)

- Filter by status (Success/Failed)
- Filter by date range
- Update API to support filters
- Add filter UI controls

  11.5. Style for clarity

- Use clear column headers
- Truncate long subjects with tooltip
- Format dates consistently
- Make action buttons prominent

---

## Task 12: Admin Panel - Email Preview Feature

### Story

**As a** dispatch administrator
**I want** to preview the original email and final printed output
**So that** I can diagnose why a job failed or verify the output

### Acceptance Criteria

**Given** I click "Preview" on an email log entry
**When** the preview modal opens
**Then** I see the original unmodified email HTML

**Given** a job was successful
**When** I view the preview
**Then** I see the final printed document with the map

**Given** a job failed
**When** I view the preview
**Then** I see the final document with the error message

**Given** I click "Print" on an email log entry
**When** the print action is triggered
**Then** the document is sent directly to the printer without showing a preview

### Subtasks

12.1. Create preview UI components

- Create EmailPreviewModal component (Next.js)
- Create tabs for "Original Email" and "Final Output"
- Add close button
- Make modal responsive

  12.2. Implement backend preview API

- Create GET /api/emails/:id/original endpoint (returns original HTML)
- Create GET /api/emails/:id/output endpoint (returns final document)
- Store original email HTML in database
- Store final assembled HTML in database

  12.3. Update job persistence

- Add originalHtml field to jobs table
- Add finalHtml field to jobs table
- Update job creation to store original email
- Update document assembly to store final HTML

  12.4. Connect frontend to backend

- Fetch original/output HTML when preview clicked
- Render HTML safely (consider iframe or sanitization)
- Show loading state while fetching
- Handle missing data gracefully

  12.5. Add print button functionality

- Add "Print" button separate from "Preview" button
- Create POST /api/emails/:id/print endpoint
- Send document directly to printer (bypass browser dialog)
- Show success/error notification after print attempt

---

## Task 13: Admin Panel - Manual Retry Feature

### Story

**As a** dispatch administrator
**I want** to manually retry failed jobs
**So that** I can recover from transient errors without waiting for a new dispatch

### Acceptance Criteria

**Given** a job with status "Failed"
**When** I click the "Retry" button
**Then** the system reprocesses that email through the entire workflow

**Given** a retry is initiated
**When** the job completes successfully
**Then** the status updates to "Success" and the error message clears

**Given** a retry is initiated
**When** the job fails again
**Then** the status remains "Failed" and the error message updates

**Given** a job is currently being retried
**When** I view the log
**Then** the status shows "Processing" and the Retry button is disabled

**Given** a job has been retried multiple times
**When** I hover over the retry indicator
**Then** I see a tooltip with retry count and human-readable messages for each attempt

### Subtasks

13.1. Create retry UI

- Add "Retry" button to failed jobs in email log
- Disable button during retry
- Show processing spinner
- Update UI when retry completes

  13.2. Implement backend retry API

- Create POST /api/emails/:id/retry endpoint
- Fetch original email from database
- Re-run entire workflow (GPS extraction → map → print)
- Update job status and results

  13.3. Handle concurrent retries

- Prevent multiple simultaneous retries of same job
- Use job locking or status check
- Return error if job is already processing

  13.4. Add retry tracking with tooltip

- Track each manual retry attempt with timestamp
- Store human-readable message for each retry result
- Store retry count in job record
- Display retry indicator icon when retries exist
- Show tooltip popup on hover with full retry history

  13.5. Add success/error notifications

- Show toast notification on retry success
- Show toast notification on retry failure
- Include error details in notification

---

## Task 14: Admin Panel - Configuration Interface

### Story

**As a** dispatch administrator
**I want** to configure system settings through a web interface
**So that** I can adjust email filters, printer settings, and API keys without editing config files

### Acceptance Criteria

**Given** I access the configuration page
**When** the page loads
**Then** I see forms for: Email Settings, Filter Rules, Station Location, CUPS Settings, Print Format, Map API Key

**Given** I update the email address
**When** I save the configuration
**Then** the system uses the new email address for monitoring

**Given** I enter an invalid email address
**When** I attempt to save
**Then** I see a validation error

**Given** I configure both "subject contains" and "subject regex"
**When** I attempt to save
**Then** I see an error that they are mutually exclusive

### Subtasks

14.1. Create configuration UI components

- Create ConfigurationForm component (Next.js)
- Create sections: EmailConfig, FilterConfig, StationConfig, CUPSConfig, PrintConfig, MapConfig
- Add form validation
- Add save/cancel buttons

  14.2. Implement backend configuration API

- Create GET /api/config endpoint (returns current config, secrets masked)
- Create PUT /api/config endpoint (updates configuration)
- Validate configuration before saving
- Return validation errors

  14.3. Implement secure configuration storage

- Store sensitive data encrypted (email password, API keys)
- Use environment variables or encrypted config file
- Never return plain-text secrets in API responses
- Document encryption approach

  14.4. Add configuration validation

- Validate email address format
- Validate CUPS host/port format
- Validate GPS coordinates for station location
- Enforce mutual exclusivity of subject filters
- Return typed errors with helpful messages

  14.5. Implement configuration hot-reload

- When config is updated, reload services without restart
- Reconnect to email server with new credentials
- Update filter rules in memory
- Log configuration changes

  14.6. Add configuration test utilities

- Add "Test Email Connection" button
- Add "Test CUPS Connection" button
- Add "Test Map API" button
- Show immediate feedback on connection tests

  14.7. Style for non-technical users

- Use clear labels and help text
- Add examples (e.g., "Example: dispatch@firedept.com")
- Group related settings visually
- Show success message after save

---

## Task 20: Authentication and Security

### Story

**As a** system administrator
**I want** the admin panel to be password-protected
**So that** unauthorized users cannot access sensitive dispatch information or change settings

### Acceptance Criteria

**Given** I access the admin panel
**When** I am not authenticated
**Then** I am redirected to a login page

**Given** I enter correct credentials
**When** I submit the login form
**Then** I am granted access to the admin panel

**Given** I enter incorrect credentials
**When** I submit the login form
**Then** I see an error message "Invalid username or password"

**Given** I am authenticated
**When** my session expires
**Then** I am redirected to the login page

### Subtasks

20.1. Design authentication approach

- Choose authentication method (JWT, session-based, or basic auth)
- Document security considerations for local network deployment
- Plan password storage (hashed with bcrypt/argon2)

  20.2. Create authentication UI

- Create Login page component (Next.js)
- Add username and password fields
- Add "Login" button
- Style for simplicity

  20.3. Implement authentication backend

- Create POST /api/auth/login endpoint
- Verify credentials against stored hash
- Generate session token/JWT
- Return token to client

  20.4. Implement authentication middleware

- Create middleware to check authentication on protected routes
- Return 401 Unauthorized if not authenticated
- Apply to all /api routes except /api/auth/login

  20.5. Implement session management

- Store session in cookie or localStorage
- Set session expiration (e.g., 8 hours)
- Implement logout functionality
- Clear session on logout

  20.6. Add password management

- Create initial admin password on first run
- Store password hash securely
- Add ability to change password in config UI
- Require current password to change

  20.7. Test security

- Test unauthenticated access blocked
- Test session expiration
- Test logout
- Test password change

---

## Task 15: Error Handling and User-Friendly Messages

### Story

**As a** system
**I want** to provide clear, non-technical error messages
**So that** administrators and printed outputs show helpful information instead of technical jargon

### Acceptance Criteria

**Given** the mapping service returns a 503 error
**When** the system handles the error
**Then** the user sees "Map could not be generated: Mapping service is unavailable"

**Given** the CUPS server is unreachable
**When** a print job fails
**Then** the admin panel shows "Printing failed: Printer is unreachable"

**Given** GPS coordinates are not found
**When** the document is assembled
**Then** it shows "GPS coordinates not found in email"

**Given** an unexpected error occurs
**When** the system logs the error
**Then** it includes technical details for debugging but shows a generic message to users

### Subtasks

15.1. Create error message mapping

- Define map of technical errors to user-friendly messages
- Create ErrorMessage type with user/technical fields
- Document all error scenarios from PRD

  15.2. Implement error translation service

- Create toUserFriendlyMessage(error) function
- Map known errors to friendly messages
- Return generic message for unknown errors
- Preserve technical details for logging

  15.3. Update all error handling

- Apply error translation in document assembly
- Apply error translation in admin panel
- Apply error translation in printed output
- Log technical details, show friendly message

  15.4. Add error templates for printing

- Create HTML template for GPS not found
- Create HTML template for map service errors
- Create HTML template for generic errors
- Ensure high visibility (red border, large text)

  15.5. Add error documentation

- Document all possible error messages
- Create troubleshooting guide
- Add error codes for support reference

---

## Task 16: Logging and Monitoring

### Story

**As a** system administrator
**I want** comprehensive logging of all system activities
**So that** I can troubleshoot issues and monitor system health

### Acceptance Criteria

**Given** the system is running
**When** I examine the logs
**Then** I see structured logs with timestamps, severity levels, and context

**Given** an error occurs
**When** I examine the logs
**Then** I see the full error stack trace and relevant context

**Given** a job is processed
**When** I examine the logs
**Then** I see a log entry for each major step (received, filtered, GPS extracted, map generated, printed)

### Subtasks

16.1. Set up logging framework

- Choose logging library compatible with Effect (e.g., pino)
- Configure log levels (debug, info, warn, error)
- Configure log output (console, file)
- Set up log rotation for file logs

  16.2. Implement structured logging

- Add context to all log entries (jobId, step, timestamp)
- Use consistent log format (JSON for parsing)
- Include correlation IDs for tracking jobs
- Log performance metrics (duration of each step)

  16.3. Add logging to all services

- Log email monitoring events
- Log GPS extraction results
- Log map generation requests/responses
- Log print job attempts
- Log configuration changes

  16.4. Implement log aggregation (optional)

- Consider log aggregation for production (e.g., Loki, ELK)
- Document how to access logs
- Add log search capability

  16.5. Add monitoring alerts (future enhancement)

- Define alert conditions (e.g., 5 consecutive failures)
- Document alerting strategy
- Out of scope for v1.3 but plan for future

---

## Task 17: Deployment and System Integration

### Story

**As a** system administrator
**I want** to deploy the system on a Linux server
**So that** it runs reliably in the fire department's environment

### Acceptance Criteria

**Given** a fresh Raspberry Pi with Linux
**When** I follow the deployment guide
**Then** the system installs successfully and starts processing emails

**Given** the system is deployed
**When** the server restarts
**Then** the system automatically starts

**Given** the system crashes
**When** the crash is detected
**Then** the system automatically restarts

### Subtasks

17.1. Create deployment documentation

- Write step-by-step installation guide
- Document system requirements (Node.js version, CUPS, etc.)
- Document network requirements
- Create troubleshooting section

  17.2. Create systemd service

- Write systemd unit file for the application
- Configure auto-restart on failure
- Configure startup on boot
- Set up logging to systemd journal

  17.3. Create installation script

- Write bash script to install dependencies
- Set up database
- Configure initial admin password
- Test on clean system

  17.4. Create configuration template

- Provide example .env file
- Document all required settings
- Include sensible defaults
- Add validation for required settings

  17.5. Create backup and restore procedures

- Document database backup
- Document configuration backup
- Create restore script
- Test recovery procedures

---

## Task 18: End-to-End Testing

### Story

**As a** developer
**I want** comprehensive end-to-end tests
**So that** I can verify the entire system works correctly

### Acceptance Criteria

**Given** a test dispatch email
**When** it is sent to the monitored inbox
**Then** the system processes it and produces a printed output within 30 seconds

**Given** the test suite runs
**When** I execute all E2E tests
**Then** all critical paths are verified (success, GPS failure, map failure, print failure)

### Subtasks

18.1. Set up E2E test framework

- Choose testing framework (e.g., Vitest, Jest)
- Set up test environment with test database
- Configure mock email server
- Configure mock CUPS server

  18.2. Create test fixtures

- Create sample dispatch emails with valid GPS
- Create emails with multiple GPS coordinates
- Create emails with no GPS coordinates
- Create emails that fail filters

  18.3. Write happy path E2E test

- Send test email
- Verify it's filtered correctly
- Verify GPS extraction
- Mock map service response
- Verify document assembly
- Verify print job created

  18.4. Write failure scenario tests

- Test GPS not found scenario
- Test map service unavailable
- Test CUPS unreachable (with retries)
- Verify error messages in output

  18.5. Write admin panel E2E tests

- Test dashboard loads with correct stats
- Test email log displays jobs
- Test preview functionality
- Test retry functionality
- Test configuration updates

  18.6. Create performance tests

- Test system handles 10 concurrent emails
- Verify 30-second processing target
- Measure memory usage
- Identify bottlenecks

---

## Task 19: Documentation and User Training Materials

### Story

**As a** fire department administrator
**I want** clear documentation and training materials
**So that** I can operate and maintain the system without technical support

### Acceptance Criteria

**Given** I am a new administrator
**When** I read the user guide
**Then** I understand how to monitor the system, retry failed jobs, and adjust settings

**Given** I encounter an error
**When** I consult the troubleshooting guide
**Then** I find clear steps to resolve common issues

### Subtasks

19.1. Write user guide

- Explain system overview and purpose
- Document how to access admin panel
- Explain dashboard metrics
- Document how to view email log
- Explain how to retry failed jobs
- Document how to preview emails

  19.2. Write administrator guide

- Document how to configure email settings
- Explain filter rules with examples
- Document how to update station location
- Explain printer configuration
- Document security best practices

  19.3. Create troubleshooting guide

- List common errors with solutions
- "Email service indicator is red" → check credentials, network
- "CUPS indicator is red" → verify CUPS server running
- "Map indicator is yellow" → check API key
- Document how to access logs

  19.4. Create quick reference card

- One-page overview of key functions
- Dashboard color codes
- Common actions (retry, preview, configure)
- Emergency contact for technical support

---

## Implementation Priority

Recommended order of implementation:

**Phase 1: Core Infrastructure (Tasks 1-4)**

- Establishes foundation and basic email processing

**Phase 2: Map and Document Generation (Tasks 5-6)**

- Adds route visualization and document assembly

**Phase 3: Printing and Orchestration (Tasks 7-9)**

- Completes the automated workflow and adds persistence

**Phase 4: Admin Panel - Viewing (Tasks 10-12)**

- Provides visibility into system operation

**Phase 5: Admin Panel - Actions (Tasks 13-14)**

- Adds retry and configuration capabilities

**Phase 6: Production Readiness (Tasks 15-17)**

- Error handling, logging, and deployment preparation

**Phase 7: Testing and Documentation (Tasks 18-19)**

- Validates system and enables user adoption

**Phase 8: Security (Task 20)**

- Implements authentication and secures the system

---

## Notes

- Each task is designed to be independently testable
- Tasks follow ATDD with clear acceptance criteria
- TypeScript + Effect-TS ensures type safety and functional error handling
- All error messages prioritize clarity for non-technical users
- System designed for reliability in emergency response context
