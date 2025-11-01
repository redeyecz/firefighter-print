# Task 9: Job Persistence Layer

## Story

**As a** system
**I want** to persist job records to a database
**So that** the admin panel can display processing history

## Acceptance Criteria

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

## Subtasks

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
