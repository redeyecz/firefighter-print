# Task 15: Error Handling and User-Friendly Messages

## Story
**As a** system
**I want** to provide clear, non-technical error messages
**So that** administrators and printed outputs show helpful information instead of technical jargon

## Acceptance Criteria

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

## Subtasks

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
