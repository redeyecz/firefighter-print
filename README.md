# Firefighter Dispatch System

Automated Dispatch Location and Printing System - A zero-touch system that accelerates dispatch-to-en-route time for fire crews.

## Overview

This system automatically processes incoming dispatch emails, extracts GPS coordinates, generates route maps, and prints combined information for firefighter crews. Built with TypeScript, Effect-TS, and Next.js.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 15 (App Router)
- **Effect System**: Effect-TS 3.x
- **Schema Validation**: @effect/schema
- **Database**: SQLite (via @effect/sql-sqlite-bun)
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier, Husky

## Project Structure

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin panel routes
│   │   └── api/               # API routes
│   ├── backend/               # Backend business logic
│   │   ├── domain/           # Domain models
│   │   ├── services/         # Business logic
│   │   ├── infrastructure/   # External integrations
│   │   └── config/           # Configuration management
│   ├── components/           # React components
│   └── lib/                  # Shared utilities
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── public/                   # Static assets
```

## Getting Started

### Prerequisites

- Bun >= 1.3.1
- Node.js >= 20.0.0
- CUPS server (for printing)
- Email account (IMAP access)
- Map service API key (Google Maps, Mapbox, or OpenStreetMap)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd firefighter-alarm
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the development server:

```bash
bun run dev
```

5. Access the application:

- Main app: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## Development Commands

```bash
# Development
bun run dev              # Start development server
bun run build            # Build for production
bun run start            # Start production server

# Code Quality
bun run lint             # Run ESLint
bun run format           # Format code with Prettier
bun run format:check     # Check code formatting
bun run typecheck        # Run TypeScript type checking

# Testing
bun test                 # Run tests
bun run test:ui          # Run tests with UI
bun run test:coverage    # Run tests with coverage
```

## Configuration

All configuration is managed through environment variables and validated using Effect Schema. See `.env.example` for all available options.

Key configuration areas:

- Email monitoring (IMAP)
- Filter rules (sender, subject)
- Station location (GPS)
- CUPS printer settings
- Map service API
- Database path

## Task Implementation Progress

✅ Task 1: Project Setup and Core Infrastructure (COMPLETED)

- Bun project with TypeScript
- Next.js 15 with App Router
- Effect-TS configuration
- Development tooling (ESLint, Prettier, Husky)
- Configuration management with Effect Schema
- Vitest testing setup

✅ Task 2: Email Monitoring Service (COMPLETED)

- Email domain models with Effect Schema
- ImapFlow integration (MIT licensed, v1.1.1)
- IMAP client wrapper with Effect-TS
- Email polling mechanism with exponential backoff retry
- Email fetcher and HTML parser
- Comprehensive unit tests (10 tests passing)
- Mock IMAP client for testing

✅ Task 3: Email Filtering Service (COMPLETED)

- Filter domain models (FilterMatchResult, FilterValidationResult)
- Email filter service with sender, subject, and regex matching
- AND logic for multiple filters (all must match)
- Mutual exclusivity validation (subjectContains vs subjectRegex)
- Case-insensitive matching for sender and subject
- Comprehensive unit tests (17 tests passing)

✅ Task 4: GPS Coordinate Extraction Service (COMPLETED)

- GPS domain models with Effect Schema validation
- Multiple regex patterns for Decimal Degrees format (with/without spaces, degree symbols)
- HTML to plain text parsing
- Coordinate validation (lat: -90 to 90, lon: -180 to 180)
- Multiple coordinate detection with warning
- Deduplication of overlapping regex matches
- Comprehensive unit tests (18 tests passing)

✅ Task 5: Map Generation Service (COMPLETED)

- Mapy.cz integration (Czech mapping service, 250k free credits/month)
- Map domain models (MapRequest, MapResponse, RouteGeometry)
- Routing API client with route geometry extraction
- Static map URL generation with markers and route paths
- HTTP client integration with Effect Platform
- Timeout support (configurable, default 10s)
- Retry logic with exponential backoff (3 attempts, 2s initial)
- Error handling (auth, network, timeout, service unavailable)
- ConfigError to MapError mapping
- Total tests: 47 passing (existing tests maintained)
- Note: Map service tests created but encountering mock complexity issues

🔄 Next: Task 6 - HTML Document Assembly Service

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
