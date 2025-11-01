# Task 6: HTML Document Assembly Service

## Story
**As a** system
**I want** to combine the original email with the generated map into a printable HTML document
**So that** firefighters receive all information in a clear, organized format

## Acceptance Criteria

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

## Subtasks

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
