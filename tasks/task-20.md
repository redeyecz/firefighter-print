# Task 20: Authentication and Security

## Story

**As a** system administrator
**I want** the admin panel to be password-protected
**So that** unauthorized users cannot access sensitive dispatch information or change settings

## Acceptance Criteria

**Given** I access the admin panel
**When** I am not authenticated
**Then** I am redirected to a login page

**Given** I enter correct credentials
**When** I submit the login form
**Then** I am granted access to the admin panel

**Given** I enter incorrect credentials
**When** I submit the login form
**Then** I see an error message "Invalid username or password"

**Given** I am authenticated
**When** my session expires
**Then** I am redirected to the login page

## Subtasks

20.1. Design authentication approach

- Choose authentication method (JWT, session-based, or basic auth)
- Document security considerations for local network deployment
- Plan password storage (hashed with bcrypt/argon2)

  20.2. Create authentication UI

- Create Login page component (Next.js)
- Add username and password fields
- Add "Login" button
- Style for simplicity

  20.3. Implement authentication backend

- Create POST /api/auth/login endpoint
- Verify credentials against stored hash
- Generate session token/JWT
- Return token to client

  20.4. Implement authentication middleware

- Create middleware to check authentication on protected routes
- Return 401 Unauthorized if not authenticated
- Apply to all /api routes except /api/auth/login

  20.5. Implement session management

- Store session in cookie or localStorage
- Set session expiration (e.g., 8 hours)
- Implement logout functionality
- Clear session on logout

  20.6. Add password management

- Create initial admin password on first run
- Store password hash securely
- Add ability to change password in config UI
- Require current password to change

  20.7. Test security

- Test unauthenticated access blocked
- Test session expiration
- Test logout
- Test password change
