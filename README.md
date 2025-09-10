# Spip Boilerplate

Modern fullstack boilerplate with TanStack Start, PostgreSQL, Drizzle ORM, Better Auth, and Tailwind CSS.

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

Your app runs at `http://localhost:3100`

## Database Commands

```bash
pnpm db:reset      # Create tables + seed admin user (recommended)
pnpm db:migrate    # Create tables only
pnpm seed-admin    # Create/update admin user only
```

## Environment Setup

Copy `.env.example` to `.env` and update:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3350
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=Admin123!
DEFAULT_ADMIN_NAME=Admin User
```

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Run production build
pnpm test         # Run tests
```

## Tech Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS
- **Backend**: TanStack Start (SSR)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth
- **Testing**: Vitest
- **Package Manager**: pnpm
