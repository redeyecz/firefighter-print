# Task 14: Admin Panel - Configuration Interface

## Story
**As a** dispatch administrator
**I want** to configure system settings through a web interface
**So that** I can adjust email filters, printer settings, and API keys without editing config files

## Acceptance Criteria

**Given** I access the configuration page
**When** the page loads
**Then** I see forms for: Email Settings, Filter Rules, Station Location, CUPS Settings, Print Format, Map API Key

**Given** I update the email address
**When** I save the configuration
**Then** the system uses the new email address for monitoring

**Given** I enter an invalid email address
**When** I attempt to save
**Then** I see a validation error

**Given** I configure both "subject contains" and "subject regex"
**When** I attempt to save
**Then** I see an error that they are mutually exclusive

## Subtasks

14.1. Create configuration UI components
   - Create ConfigurationForm component (Next.js)
   - Create sections: EmailConfig, FilterConfig, StationConfig, CUPSConfig, PrintConfig, MapConfig
   - Add form validation
   - Add save/cancel buttons

14.2. Implement backend configuration API
   - Create GET /api/config endpoint (returns current config, secrets masked)
   - Create PUT /api/config endpoint (updates configuration)
   - Validate configuration before saving
   - Return validation errors

14.3. Implement secure configuration storage
   - Store sensitive data encrypted (email password, API keys)
   - Use environment variables or encrypted config file
   - Never return plain-text secrets in API responses
   - Document encryption approach

14.4. Add configuration validation
   - Validate email address format
   - Validate CUPS host/port format
   - Validate GPS coordinates for station location
   - Enforce mutual exclusivity of subject filters
   - Return typed errors with helpful messages

14.5. Implement configuration hot-reload
   - When config is updated, reload services without restart
   - Reconnect to email server with new credentials
   - Update filter rules in memory
   - Log configuration changes

14.6. Add configuration test utilities
   - Add "Test Email Connection" button
   - Add "Test CUPS Connection" button
   - Add "Test Map API" button
   - Show immediate feedback on connection tests

14.7. Style for non-technical users
   - Use clear labels and help text
   - Add examples (e.g., "Example: dispatch@firedept.com")
   - Group related settings visually
   - Show success message after save
