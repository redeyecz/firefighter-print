# Task 8: Job Processing Orchestration

## Story
**As a** system
**I want** to orchestrate the entire workflow from email to printed output
**So that** the dispatch process is fully automated

## Acceptance Criteria

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

## Subtasks

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
