# Task 5: Map Generation Service

## Story
**As a** system
**I want** to generate static route maps from a starting point to the emergency location
**So that** firefighters have visual navigation guidance

## Acceptance Criteria

**Given** valid GPS coordinates and a mapping service API key
**When** the system requests a route map
**Then** it receives a static map image showing the route from station to destination

**Given** the mapping service is unavailable
**When** the system requests a map
**Then** it returns an error "Map could not be generated: Mapping service is unavailable"

**Given** an invalid API key is configured
**When** the system requests a map
**Then** it returns an error "Map could not be generated: Invalid API key"

**Given** a network timeout occurs
**When** the system requests a map
**Then** it returns an error after the configured timeout period

## Subtasks

5.1. Create map domain models
   - Define MapRequest type (startPoint, destination, apiKey)
   - Define MapResponse type (imageUrl or imageData, format)
   - Define MapError types (ServiceUnavailable, InvalidKey, Timeout, etc.)

5.2. Research and select mapping service
   - Evaluate options: Google Maps Static API, Mapbox, OpenStreetMap
   - Document API requirements and pricing
   - Create configuration for selected service

5.3. Implement mapping service client
   - Create MapService using Effect
   - Implement generateRouteMap(start, destination) returning Effect<MapResponse, MapError>
   - Add HTTP client with timeout configuration
   - Handle API-specific error responses

5.4. Implement retry logic for transient failures
   - Use Effect.retry for network errors
   - Configure retry schedule (e.g., 3 attempts with exponential backoff)
   - Don't retry on authentication errors
   - Log each retry attempt

5.5. Add image validation
   - Verify response is valid image data
   - Check image size is within acceptable range
   - Validate image format (PNG/JPEG)
   - Return error if image is corrupted

5.6. Add unit tests
   - Mock HTTP responses for success case
   - Test service unavailable scenario
   - Test invalid API key scenario
   - Test timeout scenario
   - Test retry logic
