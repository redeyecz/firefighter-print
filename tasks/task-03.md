# Task 3: Email Filtering Service

## Story
**As a** system
**I want** to filter emails based on configurable rules
**So that** I only process relevant dispatch emails

## Acceptance Criteria

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

## Subtasks

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
