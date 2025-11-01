# Task 11: Admin Panel - Email Processing Log

## Story
**As a** dispatch administrator
**I want** to view a log of all processed emails
**So that** I can verify dispatches were handled correctly

## Acceptance Criteria

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

## Subtasks

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
