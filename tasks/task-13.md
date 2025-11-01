# Task 13: Admin Panel - Manual Retry Feature

## Story

**As a** dispatch administrator
**I want** to manually retry failed jobs
**So that** I can recover from transient errors without waiting for a new dispatch

## Acceptance Criteria

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

## Subtasks

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
