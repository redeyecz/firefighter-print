# Task 4: GPS Coordinate Extraction Service

## Story
**As a** system
**I want** to extract GPS coordinates from email content
**So that** I can generate route maps to emergency locations

## Acceptance Criteria

**Given** an email contains GPS coordinates in Decimal Degrees format (e.g., "49.947014 N, 17.885027 E")
**When** the system parses the email
**Then** it extracts the coordinates as {latitude: 49.947014, longitude: 17.885027}

**Given** an email contains multiple GPS coordinate sets
**When** the system parses the email
**Then** it extracts the first set and returns a warning "Multiple GPS locations found; please verify"

**Given** an email contains no GPS coordinates
**When** the system parses the email
**Then** it returns an error "GPS coordinates not found in email"

**Given** an email contains malformed coordinates
**When** the system parses the email
**Then** it returns an error with details about the parsing failure

## Subtasks

4.1. Create GPS domain models
   - Define GPSCoordinates type (latitude, longitude)
   - Define GPSExtractionResult type (coordinates, warning?)
   - Create validation schema for coordinate ranges (-90 to 90, -180 to 180)

4.2. Implement coordinate regex patterns
   - Create regex for Decimal Degrees format
   - Support variations: "N/S", "E/W", with/without spaces
   - Handle both comma and space separators
   - Test against sample dispatch emails

4.3. Implement GPS extraction service
   - Create extractGPS(emailBody) function returning Effect<GPSExtractionResult, GPSError>
   - Parse HTML to plain text if needed
   - Find all coordinate matches
   - Return first match with warning if multiple found

4.4. Add coordinate validation
   - Validate latitude range (-90 to 90)
   - Validate longitude range (-180 to 180)
   - Check for realistic values
   - Return typed errors for invalid coordinates

4.5. Add unit tests
   - Test various Decimal Degrees formats
   - Test multiple coordinates (warning scenario)
   - Test no coordinates found
   - Test malformed coordinates
   - Test edge cases (exactly 90°, 180°, etc.)
