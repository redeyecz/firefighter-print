# Firefighter Alarm System

**Automated Dispatch Location and Printing System**

A zero-touch system that accelerates dispatch-to-en-route time for fire crews by automatically processing dispatch emails, extracting GPS coordinates, generating route maps, and printing complete dispatch information.

## Overview

The Firefighter Alarm System monitors an email inbox for dispatch notifications, automatically extracts critical information including GPS coordinates, generates route maps from the fire station to the incident location, assembles a comprehensive dispatch document, and sends it directly to the station printer - all within seconds of receiving the dispatch email.

**Key Features:**

- 🔥 **Zero-Touch Operation**: Fully automated from email to print
- 📧 **Email Monitoring**: IMAP-based continuous monitoring with filtering
- 🗺️ **Route Mapping**: Automatic map generation with Mapy.cz integration
- 🖨️ **Direct Printing**: CUPS integration for immediate printouts
- 📊 **Admin Dashboard**: Real-time monitoring and job management
- ⚡ **Fast Processing**: < 30 seconds from email receipt to print
- 🔒 **Secure**: Environment-based configuration, password masking
- 📝 **Comprehensive Logging**: Structured logging with correlation IDs
- 🔄 **Retry Logic**: Automatic and manual retry capabilities
- 🎯 **Effect-TS**: Type-safe error handling and functional architecture

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
bun run lint:fix         # Fix ESLint issues
bun run format           # Format code with Prettier
bun run format:check     # Check code formatting
bun run typecheck        # Run TypeScript type checking

# Testing
bun test                 # Run all tests
bun run test:unit        # Run unit tests only
bun run test:e2e         # Run E2E tests
bun run test:e2e:watch   # Run E2E tests in watch mode
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

## Admin Panel

The system includes a comprehensive web-based admin panel for monitoring and management:

- **Dashboard** (`/dashboard`): Real-time system statistics and health checks
- **Email Log** (`/dashboard`): View all processed jobs with status, preview, and retry
- **Settings** (`/settings`): Configure email, filters, station location, printer, and map API
- **Logs** (`/logs`): System logs with filtering by level and job ID

### Dashboard Features:

- 24-hour statistics (total, successful, failed, success rate)
- Service health indicators (Email, Map, Printer)
- Email processing log with pagination
- Preview modal (original email + final output)
- Manual retry for failed jobs
- Real-time updates (30-second polling)

## Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Complete deployment guide for Linux/Raspberry Pi
- **[E2E_TESTING.md](./E2E_TESTING.md)**: End-to-end testing strategy and examples
- **[USER_GUIDE.md](./USER_GUIDE.md)**: User manual for administrators
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**: One-page quick reference card

## Architecture

The system follows a clean architecture pattern with Effect-TS:

```
Email Monitoring → Email Filtering → GPS Extraction → Map Generation → Document Assembly → Printing
       ↓                ↓                 ↓                ↓                  ↓             ↓
   Job Created    Filter Applied    Coordinates      Map URL          Final HTML      Print Job
                                     Extracted        Generated        Assembled        Created
```

### Key Components:

- **Backend Services** (Effect-TS): Email, GPS, Map, Document, Printer, Job Orchestrator
- **Frontend** (Next.js + React): Admin panel with SWR for data fetching
- **Database** (SQLite): Job persistence, configuration, logs
- **Infrastructure**: IMAP client, CUPS client, HTTP client, file system

## Task Implementation Status

✅ **Tasks 1-9**: Backend Infrastructure (Complete)

- Project setup, email monitoring, filtering, GPS extraction
- Map generation, document assembly, CUPS printing
- Job orchestration, database persistence

✅ **Tasks 10-14**: Admin Panel (Complete)

- Dashboard with stats and health checks
- Email processing log with pagination
- Email preview modal with tabs
- Manual retry functionality
- Configuration interface

✅ **Tasks 15-16**: Error Handling & Logging (Complete)

- User-friendly error messages with codes
- Structured logging with correlation IDs
- Log viewer in admin panel

✅ **Tasks 17-19**: Deployment & Documentation (Complete)

- Installation scripts and systemd service
- Comprehensive deployment guide
- E2E testing documentation
- User guides and reference materials

🔄 **Task 20**: Authentication and Security (Future)

- Login system
- Session management
- Password protection

## Production Deployment

For production deployment on Linux/Raspberry Pi:

```bash
cd deployment
sudo ./install.sh
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions.

## Support

For issues and questions:

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
2. Review system logs: `sudo journalctl -u firefighter-alarm -n 100`
3. Check service health: Visit `/dashboard` in admin panel
4. Review [E2E_TESTING.md](./E2E_TESTING.md) for testing issues

## License

MIT License (see LICENSE file)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow existing code style (ESLint + Prettier)
4. Add tests for new features
5. Submit a pull request

## Acknowledgments

- Built with [Effect-TS](https://effect.website/) for type-safe error handling
- Maps powered by [Mapy.cz](https://api.mapy.cz/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- IMAP client: [imapflow](https://github.com/postalsys/imapflow)
