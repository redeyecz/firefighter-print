# Task 10: Admin Panel - Dashboard Overview

## Story
**As a** dispatch administrator
**I want** to see an overview of system status
**So that** I can quickly assess if the dispatch system is functioning properly

## Acceptance Criteria

**Given** I access the admin dashboard
**When** the page loads
**Then** I see: total emails processed (24h), successful jobs count, failed jobs count

**Given** the email service is healthy
**When** I view the dashboard
**Then** the email service indicator shows green

**Given** the CUPS server is unreachable
**When** I view the dashboard
**Then** the CUPS service indicator shows red

**Given** the mapping service is healthy
**When** I view the dashboard
**Then** the mapping service indicator shows green

## Subtasks

10.1. Set up admin panel with Next.js
   - Initialize Next.js project with TypeScript
   - Set up build configuration
   - Create basic page layout structure
   - Add CSS solution (Tailwind CSS or similar)

10.2. Create dashboard UI components
   - Create StatsCard component (24h processed, success/fail counts)
   - Create ServiceStatus component (colored indicators)
   - Create DashboardLayout component
   - Make responsive for mobile

10.3. Implement backend dashboard API
   - Create GET /api/dashboard/stats endpoint
   - Return 24-hour statistics
   - Calculate success/failure counts
   - Use Effect for data fetching

10.4. Implement service health checks
   - Create HealthCheck service
   - Check email service connection
   - Check CUPS server availability
   - Check mapping service (light ping/health endpoint)
   - Return Effect<HealthStatus, never>

10.5. Create GET /api/dashboard/health endpoint
   - Return status of all services
   - Include last check timestamp
   - Use green/yellow/red status codes
   - Update every 30 seconds

10.6. Connect frontend to backend
   - Fetch stats on dashboard load
   - Poll health status every 30 seconds
   - Display loading states
   - Handle API errors gracefully

10.7. Add styling for non-technical users
   - Use clear, large text
   - Color-code status (green = good, red = problem)
   - Add helpful tooltips
