# Task 12: Admin Panel - Email Preview Feature

## Story
**As a** dispatch administrator
**I want** to preview the original email and final printed output
**So that** I can diagnose why a job failed or verify the output

## Acceptance Criteria

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

## Subtasks

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
