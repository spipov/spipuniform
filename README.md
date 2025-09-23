# Spip Boilerplate

Modern fullstack boilerplate with TanStack Start, PostgreSQL, Drizzle ORM, Better Auth, and Tailwind CSS.

## ✨ Features

- **First-Admin Setup**: Automatic admin promotion for first registered user
- **Dynamic URLs**: Environment-aware URL handling for all deployment targets
- **Modern Stack**: React 19, TanStack Router, PostgreSQL, Drizzle ORM, Better Auth
- **Production Ready**: Optimized for Vercel, Netlify, and other platforms

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/spipov/spipboiler.git your-project-name
cd your-project-name
pnpm install

# 2. Set up your git repository
rm -rf .git
git init
git remote add origin https://github.com/yourusername/your-project-name.git

# 3. Database setup
createdb your_project_name
cp .env.example .env
# Edit .env with your database credentials

# 4. Create tables and admin user
pnpm db:reset

# 5. Start development
pnpm dev
```

Your app runs at `http://localhost:3350`

## Database Commands

```bash
pnpm db:reset      # Create tables + seed admin user (recommended)
pnpm db:migrate    # Create tables only
pnpm seed-admin    # Create/update admin user only
```

## 🆕 First-Admin Setup

This boilerplate includes an intelligent first-admin setup system that automatically promotes the first registered user to admin.

### How It Works

1. **Fresh Database**: When no admin exists, the registration form shows a green banner
2. **First User**: The first user to register is automatically promoted to admin
3. **Subsequent Users**: Regular users go through the normal approval workflow
4. **Safety**: Prevents multiple admins from being accidentally created

### Testing First-Admin Setup

```bash
# 1. Clear database for fresh start
pnpm tsx scripts/clear-for-first-admin-test.ts

# 2. Verify no admin exists
curl http://localhost:3350/api/auth/admin-exists
# Should return: {"success":true,"exists":false}

# 3. Test registration at:
# http://localhost:3350/auth/signup

# 4. First user will see "first admin" banner and be auto-promoted
```

### API Endpoints

- `GET /api/auth/admin-exists` - Check if admin exists
- `POST /api/auth/upgrade-first-admin` - Promote user to admin (first user only)

## Environment Setup

Copy `.env.example` to `.env` and update:

### Required Variables

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3350

# Base URLs (adapt to your framework)
VITE_BASE_URL=http://localhost:3350                 # Vite/TanStack
VITE_BETTER_AUTH_URL=http://localhost:3350          # Vite

# Default Admin User Configuration
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=Admin123!
DEFAULT_ADMIN_NAME=Admin User
```

### Optional SMTP Configuration

For email functionality, add these variables:

```env
# SMTP Configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_SECURE=false
SMTP_FROM_NAME=Your App Name
SMTP_FROM_EMAIL=noreply@yourapp.com
SMTP_REPLY_TO=support@yourapp.com
```

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Run production build
pnpm test         # Run tests

# Database
pnpm db:reset     # Create tables + seed admin user (recommended)
pnpm db:migrate   # Create tables only

# First-Admin Setup Testing
pnpm tsx scripts/clear-for-first-admin-test.ts  # Clear DB for testing
pnpm tsx scripts/test-first-admin-setup.ts      # Test first-admin flow
```

## Tech Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS
- **Backend**: TanStack Start (SSR)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth with First-Admin Setup
- **Testing**: Vitest
- **Package Manager**: pnpm

## 🆕 First-Admin Setup Features

- ✅ **No hardcoded credentials** - Dynamic admin creation
- ✅ **Environment-aware URLs** - Works in any deployment target
- ✅ **Automatic promotion** - First user becomes admin seamlessly
- ✅ **Safety checks** - Prevents multiple admins
- ✅ **Visual feedback** - Clear indication for first admin signup
- ✅ **Framework agnostic** - Universal solution for JS frameworks

## 🔧 Troubleshooting

### First-Admin Setup Issues

**Problem**: Admin-exists endpoint returns `{"success":true,"exists":true}` after clearing
**Solution**: Run the proper clearing script:
```bash
pnpm tsx scripts/clear-for-first-admin-test.ts
```

**Problem**: Registration form doesn't show first-admin banner
**Solution**: Ensure database is completely cleared and no admin exists

**Problem**: Upgrade endpoint fails
**Solution**: Check that no admin exists first, then try with a valid user ID

### Environment Issues

**Problem**: Dynamic URLs not working
**Solution**: Ensure `VITE_BASE_URL` and `VITE_BETTER_AUTH_URL` are set in `.env`

**Problem**: Auth client using wrong port
**Solution**: Update `.env` with correct port (3350 for development)
