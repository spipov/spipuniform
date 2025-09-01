# SpipBoiler - Better Auth Authentication System

A modern full-stack application built with React, TanStack Start, and Better Auth for authentication.

## 🔐 Authentication System Overview

This project uses [Better Auth](https://www.better-auth.com/) - a comprehensive authentication library that provides:

- **Email/Password Authentication** with secure password hashing (scrypt)
- **Session Management** with secure HTTP-only cookies
- **Role-Based Access Control (RBAC)** with admin and user roles
- **Database Integration** via Drizzle ORM with PostgreSQL
- **Type Safety** with full TypeScript support
- **Server-Side Rendering** compatibility

## 🏗️ Architecture

### Authentication Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│   Better Auth    │───▶│   PostgreSQL    │
│  (React/TSX)    │    │   Server API     │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Auth Client     │    │ Session Cookies  │    │ User & Session  │
│ (better-auth/   │    │ (HTTP-only)      │    │ Tables          │
│  react)         │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

1. **Server-Side Auth Handler** (`/src/lib/auth.ts`)
   - Configures Better Auth with Drizzle adapter
   - Handles all authentication endpoints
   - Manages session creation and validation

2. **Client-Side Auth Client** (`/src/lib/auth-client.ts`)
   - React hooks for authentication state
   - Methods for sign in/up/out operations
   - Admin client for role management

3. **Database Schema** (`/src/db/schema/auth.ts`)
   - Better Auth required tables (user, session, account, verification)
   - Custom role field in user table
   - Proper indexing and constraints

## 📊 Database Schema

### User Table
```sql
CREATE TABLE "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "role" text DEFAULT 'user',
  "banned" boolean DEFAULT false,
  "banReason" text,
  "banExpires" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
```

### Session Table
```sql
CREATE TABLE "session" (
  "id" text PRIMARY KEY,
  "expiresAt" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
```

### Account Table (OAuth providers)
```sql
CREATE TABLE "account" (
  "id" text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope" text,
  "password" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ with pnpm
- PostgreSQL database
- Environment variables configured

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Configure required variables
DATABASE_URL="postgresql://username:password@localhost:5432/spipboiler"
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3100"
```

### Database Setup

```bash
# Install dependencies
pnpm install

# Reset database and run migrations
pnpm db:reset

# Seed admin user
pnpm seed-admin
```

### Development Server

```bash
# Start development server
pnpm dev

# Server runs on http://localhost:3100
```

## 🔑 Admin User Setup

### Default Admin Credentials

After running `pnpm seed-admin`, you can log in with:

- **Email**: `admin@example.com`
- **Password**: `Admin123`
- **Role**: `admin`

### Seeding Process

The seeding script (`scripts/seed-better-auth.ts`) uses Better Auth's server-side API to:

1. Check for existing admin user
2. Create new user via Better Auth's sign-up handler (ensures proper password hashing)
3. Update user role to "admin"
4. Handle existing users gracefully

```typescript
// Server-side seeding approach
const mockRequest = new Request(`${baseURL}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, name })
});

const response = await auth.handler(mockRequest);
```

## 🛡️ API Endpoints

### Authentication Endpoints

All authentication endpoints are handled by Better Auth at `/api/auth/*`:

- `POST /api/auth/sign-up/email` - User registration
- `POST /api/auth/sign-in/email` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/reset-password` - Password reset

### Protected Routes

Routes requiring authentication:

- `/dashboard` - User dashboard (authenticated users)
- `/admin` - Admin panel (admin role required)
- `/dashboard/user-management` - User management (admin role required)

### Session Validation

```typescript
// Server-side session validation
import { auth } from "@/lib/auth";

export const getSession = async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
};
```

## 🔒 Security Features

### Password Security
- **Scrypt hashing** - Industry-standard password hashing
- **Salt generation** - Unique salt per password
- **Minimum requirements** - 8+ characters, complexity validation

### Session Security
- **HTTP-only cookies** - Prevents XSS attacks
- **Secure flag** - HTTPS-only in production
- **SameSite protection** - CSRF protection
- **Session expiration** - Configurable timeout

### Role-Based Access Control
- **Default role**: `user`
- **Admin roles**: `admin`
- **Route protection** - Server-side validation
- **UI conditional rendering** - Based on user role

## 🚨 Critical Authentication Lessons Learned

### Previous Issues & Solutions

Based on the analysis of `Next-step.md`, several critical authentication issues were identified and resolved:

#### 1. Password Hashing Mismatch
**Problem**: Manual scrypt implementation didn't match Better Auth's internal hashing
**Solution**: Use Better Auth's server-side API for user creation

#### 2. Client-Side vs Server-Side APIs
**Problem**: Using client-side auth APIs in Node.js server environment
**Solution**: Use `auth.handler()` for server-side operations

#### 3. Database Schema Conflicts
**Problem**: Custom user tables conflicting with Better Auth's expected schema
**Solution**: Use Better Auth's standard schema with custom fields

#### 4. Session Management Issues
**Problem**: Manual session handling causing authentication failures
**Solution**: Let Better Auth handle all session operations

### Authentication Best Practices

1. **Always use Better Auth's APIs** - Don't implement custom auth logic
2. **Server-side for seeding** - Use `auth.handler()` for server operations
3. **Client-side for UI** - Use React hooks for frontend auth state
4. **Validate on both sides** - Server validation + client UX
5. **Test authentication flow** - Verify login/logout/session persistence

## 🧪 Testing Authentication

### Manual Testing

```bash
# Test login endpoint
curl -X POST http://localhost:3100/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}'

# Test session endpoint
curl -X GET http://localhost:3100/api/auth/session \
  -H "Cookie: better-auth.session_token=<token>"
```

### Automated Testing

```typescript
// Example test for authentication flow
import { auth } from "@/lib/auth";

test("admin user can authenticate", async () => {
  const mockRequest = new Request("http://localhost:3100/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "Admin123"
    })
  });

  const response = await auth.handler(mockRequest);
  expect(response.status).toBe(200);
});
```

## 🔧 Troubleshooting

### Common Issues

#### "401 Unauthorized" Errors
- Check if user exists in database
- Verify password is correct
- Ensure session cookie is being sent

#### "Column does not exist" Errors
- Run database migrations: `pnpm db:reset`
- Check Drizzle schema matches database

#### Session Not Persisting
- Verify `BETTER_AUTH_SECRET` is set
- Check cookie settings in browser
- Ensure HTTPS in production

### Debug Commands

```bash
# Check database tables
psql $DATABASE_URL -c "\dt"

# Verify admin user exists
psql $DATABASE_URL -c "SELECT email, role FROM user WHERE role = 'admin';"

# Check session table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM session;"
```

## 📚 Additional Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team/docs/overview)
- [TanStack Start Docs](https://tanstack.com/start/latest)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

When working on authentication-related features:

1. **Test thoroughly** - Authentication bugs affect entire application
2. **Follow Better Auth patterns** - Don't reinvent authentication logic
3. **Document changes** - Update this README for any auth modifications
4. **Consider security** - Review all auth-related code changes

---

**⚠️ Important**: Before implementing new features (branding, file management, etc.), ensure the authentication system is working correctly. Authentication issues can cascade and cause problems throughout the application, as documented in the `Next-step.md` analysis.