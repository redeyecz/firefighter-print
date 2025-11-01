# Task 1: Project Setup and Core Infrastructure

## Story

**As a** developer
**I want** to set up the project structure with TypeScript and Effect-TS
**So that** I have a solid foundation for building the dispatch system with type safety and functional error handling

## Acceptance Criteria

**Given** a new project repository
**When** I run the build command
**Then** TypeScript compiles successfully with strict mode enabled

**Given** Effect-TS is configured
**When** I create an Effect program
**Then** it executes with proper error handling and type inference

**Given** the project structure is set up
**When** I examine the directory layout
**Then** I see organized folders for: services, domain, infrastructure, admin-panel, config

## Subtasks

1.1. Initialize Node.js project with TypeScript

- Create package.json with TypeScript, Effect-TS dependencies
- Configure tsconfig.json with strict mode
- Set up build scripts (build, dev, test)

  1.2. Set up project directory structure

- Create `/src` with subdirectories: `/services`, `/domain`, `/infrastructure`, `/admin-panel`, `/config`
- Create `/tests` directory with same structure
- Add README.md with setup instructions

  1.3. Configure Effect-TS

- Install @effect/schema, @effect/platform
- Create base Effect utilities (error handling, logging)
- Set up Effect runtime configuration

  1.4. Set up development tooling

- Configure ESLint for TypeScript
- Configure Prettier
- Add pre-commit hooks (husky)
- Set up nodemon for development

  1.5. Create configuration management system

- Design configuration schema using @effect/schema
- Implement config loader from environment variables
- Create validation for all required settings
- Add config type definitions
