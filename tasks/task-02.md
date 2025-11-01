# Task 2: Email Monitoring Service - Basic Connection

## Story
**As a** system
**I want** to continuously monitor an email inbox
**So that** I can detect new dispatch emails in real-time

## Acceptance Criteria

**Given** valid IMAP credentials are configured
**When** the email service starts
**Then** it successfully connects to the email server

**Given** the email service is running
**When** a new email arrives in the inbox
**Then** the system detects it within 5 seconds

**Given** the email connection fails
**When** attempting to connect
**Then** the system logs a clear error and retries with exponential backoff

## Subtasks

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
