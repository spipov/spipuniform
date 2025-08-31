# Database Scripts

This directory contains automated scripts for database management and admin user creation.

## Available Scripts

### 1. Database Reset and Seeding (`pnpm db:reset`)

Automatically resets the database and creates an admin user in one command:

```bash
pnpm db:reset
```

This script:
- Runs database migrations (`drizzle-kit push`)
- Seeds the database with an admin user using environment variables
- Provides detailed logging of the process

### 2. Admin User Seeding (`pnpm seed-admin`)

Creates or updates an admin user without running migrations:

```bash
pnpm seed-admin
```

This script:
- Creates a new admin user if one doesn't exist
- Updates an existing user to admin role if they already exist
- Uses environment variables for admin credentials

### 3. Database Migrations Only (`pnpm db:migrate`)

Runs only the database migrations:

```bash
pnpm db:migrate
```

### 4. Manual Admin Creation (`pnpm create-admin`)

Interactive script for manually creating an admin user:

```bash
pnpm create-admin
```

## Environment Variables

The automated scripts use the following environment variables from your `.env` file:

```env
# Default admin user credentials for database seeding
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=Admin123!
DEFAULT_ADMIN_NAME=Admin User
```

### Password Requirements

The admin password must meet the following criteria:
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- Minimum length as defined in your validation schema

## Usage Scenarios

### Fresh Database Setup

```bash
# Complete database setup with admin user
pnpm db:reset
```

### Add Admin to Existing Database

```bash
# Just seed admin user
pnpm seed-admin
```

### Development Workflow

```bash
# Reset database during development
pnpm db:reset

# Your database is now ready with:
# - All tables created/updated
# - Admin user: admin@example.com
# - Password: Admin123!
```

## Script Details

### `seed-admin.ts`
- Reads admin credentials from environment variables
- Validates credentials against your auth schema
- Creates user using Better Auth's `signUp.email` method
- Sets user role to "admin" in the database
- Handles existing users gracefully

### `reset-and-seed.ts`
- Orchestrates the complete database reset workflow
- Runs migrations first, then seeding
- Provides comprehensive error handling and logging
- Exits with appropriate status codes

## Error Handling

All scripts include comprehensive error handling:
- Validation errors are clearly displayed
- Database connection issues are caught
- Process exits with appropriate status codes
- Detailed logging helps with troubleshooting

## Security Notes

- Default admin credentials are stored in `.env` file
- Change default credentials before production deployment
- The `.env` file should never be committed to version control
- Consider using stronger passwords in production environments