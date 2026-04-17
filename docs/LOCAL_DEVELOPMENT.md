# Local Development Guide

## Prerequisites

Before running the project locally, ensure you have:

1. **Node.js 18+** installed
2. **Docker Desktop** running (required for local Supabase)
3. **Supabase CLI** installed (check with `supabase --version`)

### Installing Supabase CLI

If not installed:

```bash
# macOS
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

## Quick Start (One Command)

```bash
# 1. Start Docker Desktop first!

# 2. Run everything
npm run dev:full
```

This command starts:

- **Supabase local stack** (Postgres, Auth, Storage, Realtime, Studio UI)
- **Vite dev server** (React frontend)
- **Express server** (Image processing backend)

## Access Points

Once `npm run dev:full` is running:

| Service             | URL                                                     | Description                                   |
| ------------------- | ------------------------------------------------------- | --------------------------------------------- |
| **Frontend**        | http://localhost:5173                                   | React application                             |
| **Backend API**     | http://localhost:3000                                   | Express server for image processing           |
| **Supabase Studio** | http://127.0.0.1:54323                                  | Database UI, Auth management, Storage browser |
| **Postgres**        | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct database connection                    |

## Alternative: Run Services Separately

If you prefer more control:

### Terminal 1: Supabase

```bash
npm run supabase:start
```

Wait for Supabase to fully start (you'll see URLs and credentials printed).

### Terminal 2: Frontend + Backend

```bash
npm run dev
```

## Common Commands

```bash
# Check what's running
npm run supabase:status

# Stop Supabase (keeps data)
npm run supabase:stop

# Completely reset Supabase (deletes all data!)
supabase db reset

# Regenerate TypeScript types from database schema
npm run db:types

# Run tests
npm test

# Format code
npm run format
```

## Troubleshooting

### "Cannot connect to Docker daemon"

**Solution**: Start Docker Desktop and wait for it to fully initialize.

```bash
# Check Docker is running
docker ps
```

### "Port already in use"

**Solution**: Stop the conflicting service or change ports in `supabase/config.toml`:

```bash
# Find what's using the port
lsof -i :54321  # Supabase API
lsof -i :54323  # Supabase Studio
lsof -i :5173   # Vite
lsof -i :3000   # Express

# Kill the process
kill -9 <PID>
```

### Supabase stuck or misbehaving

```bash
# Nuclear option: reset everything
npm run supabase:stop
docker system prune -a --volumes
npm run supabase:start
```

### Database types out of sync

After changing the database schema:

```bash
npm run db:types
```

This regenerates `src/types/database.types.ts` from your local Supabase instance.

## Environment Variables

For local development, use `.env.local`:

```bash
cp .env.example .env.local
```

Key variables:

```env
# Local Supabase (default values)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<get from 'supabase status'>

# Optional: Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Get your local `VITE_SUPABASE_ANON_KEY` from:

1. Run `npm run supabase:status`
2. Copy the `anon key` value
3. Paste into `.env.local`

## Development Workflow

1. **Start services**: `npm run dev:full`
2. **Make changes**: Edit code (hot reload enabled)
3. **Check database**: Open Supabase Studio → http://127.0.0.1:54323
4. **Test**: `npm test`
5. **Commit**: Format with `npm run format` first

## Database Migrations

When you modify the database schema:

```bash
# Create a new migration
supabase migration new your_migration_name

# Edit the migration file in supabase/migrations/

# Apply migrations
supabase db reset

# Generate TypeScript types
npm run db:types
```

## Next Steps

- Read [ARCHITECTURE.md](../ARCHITECTURE.md) for project structure
- Check [QUICK_START.md](../QUICK_START.md) for feature implementation guide
- Review [docs/GOOGLE_OAUTH_QUICKSTART.md](./GOOGLE_OAUTH_QUICKSTART.md) for auth setup
