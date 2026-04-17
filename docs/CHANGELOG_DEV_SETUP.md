# Development Setup Improvements

## Date: 2026-04-16

## Summary

Added one-command local development setup for running Supabase + Frontend + Backend simultaneously.

## Changes Made

### 1. New npm Scripts

Added to `package.json`:

```json
{
  "scripts": {
    "dev:full": "Run everything (Supabase + Vite + Express) in one command",
    "check": "Check if development environment is ready",
    "supabase:start": "Start Supabase only",
    "supabase:stop": "Stop Supabase",
    "supabase:status": "Check Supabase status"
  }
}
```

### 2. New Documentation

Created:

- **`docs/LOCAL_DEVELOPMENT.md`** - Comprehensive local development guide
- **`docs/RU_QUICKSTART.md`** - Quick start guide in Russian
- **`scripts/check-dev-env.sh`** - Environment validation script

Updated:

- **`README.md`** - Added one-command setup instructions
- **`DOCS_INDEX.md`** - Added references to new documentation

### 3. Environment Check Script

Created `scripts/check-dev-env.sh` that validates:

- ✅ Node.js installation and version
- ✅ npm installation and version
- ✅ Docker installation and daemon status
- ✅ Supabase CLI installation
- ✅ Dependencies installed (`node_modules`)
- ✅ Environment variables configured (`.env.local`)
- ✅ Supabase running status

Run with: `npm run check`

## Usage

### One Command Setup

```bash
# Check environment
npm run check

# Start everything
npm run dev:full
```

### What Gets Started

1. **Supabase** - Local database, auth, storage
   - Studio: http://127.0.0.1:54323
   - API: http://127.0.0.1:54321
   - Postgres: postgresql://postgres:postgres@127.0.0.1:54322/postgres

2. **Vite** - React frontend dev server
   - Frontend: http://localhost:5173

3. **Express** - Backend API for image processing
   - Backend: http://localhost:3000

### Separate Commands

If you prefer to run services individually:

```bash
# Terminal 1
npm run supabase:start

# Terminal 2
npm run dev
```

## Benefits

1. **Simplified Onboarding** - New developers can start with one command
2. **Environment Validation** - `npm run check` catches setup issues early
3. **Better Documentation** - Clear guides in both English and Russian
4. **Consistent Development** - Everyone uses the same setup

## Prerequisites

Before running, ensure:

1. Docker Desktop is installed and running
2. Supabase CLI is installed (`brew install supabase/tap/supabase`)
3. `.env.local` is configured (copy from `.env.example`)

## Next Steps

For more details, see:

- [docs/LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Full guide (English)
- [docs/RU_QUICKSTART.md](./RU_QUICKSTART.md) - Quick start (Russian)
