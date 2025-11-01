# Task 18: End-to-End Testing

## Story

**As a** developer
**I want** comprehensive end-to-end tests
**So that** I can verify the entire system works correctly

## Acceptance Criteria

**Given** a test dispatch email
**When** it is sent to the monitored inbox
**Then** the system processes it and produces a printed output within 30 seconds

**Given** the test suite runs
**When** I execute all E2E tests
**Then** all critical paths are verified (success, GPS failure, map failure, print failure)

## Subtasks

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
