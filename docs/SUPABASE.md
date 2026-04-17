# Supabase Local Development

This project uses Supabase for authentication, database, and storage. The setup uses Supabase CLI for local development with Docker.

> **Google OAuth Setup**: For configuring Google authentication, see [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

## Prerequisites

- Docker Desktop installed and running
- Supabase CLI installed (`brew install supabase/tap/supabase` on macOS)
- At least 4GB RAM available for Docker

## Quick Start

### 1. Start Supabase

```bash
supabase start
```

This command will:

- Pull all necessary Docker images (first time only)
- Start all Supabase services locally
- Display connection information and API keys

### 2. Access Services

After starting, you can access:

- **Supabase Studio**: http://127.0.0.1:54323
  - Web UI for managing your database, auth, and storage
- **REST API**: http://127.0.0.1:54321/rest/v1
  - Auto-generated REST API from your database schema
- **GraphQL API**: http://127.0.0.1:54321/graphql/v1
  - Auto-generated GraphQL API
- **Mailpit (Email Testing)**: http://127.0.0.1:54324
  - View emails sent during development

### 3. Apply Database Schema

After starting Supabase for the first time, apply the database schema:

```bash
# Copy migration file to database container
docker cp supabase/migrations/00001_initial_schema.sql supabase_db_font-generator:/tmp/

# Execute migration
docker exec supabase_db_font-generator psql -U postgres -d postgres -f /tmp/00001_initial_schema.sql
```

Or use Supabase Studio:

1. Open http://127.0.0.1:54323
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/00001_initial_schema.sql`
4. Paste and execute

**Verify schema:**

```bash
docker exec supabase_db_font-generator psql -U postgres -d postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

Expected output: `user_favorites`, `user_fonts`, `user_images`, `user_profiles`

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema documentation.

### 4. Access Database

#### Option 1: Supabase Studio (Recommended)

Open in browser: **http://127.0.0.1:54323**

This is the easiest way to:

- Browse and edit tables
- Run SQL queries
- Manage users and authentication
- Configure storage buckets
- View logs and metrics

#### Option 2: Command Line Scripts

We provide convenient scripts for database access:

```bash
# Show database information
./scripts/db-info.sh

# Execute a SQL query
./scripts/db-query.sh "SELECT version();"

# List all tables
./scripts/db-query.sh "\dt"

# List all databases
./scripts/db-query.sh "\l"

# Describe a table
./scripts/db-query.sh "\d table_name"
```

#### Option 3: Direct psql Connection

If you have PostgreSQL client installed:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Install PostgreSQL client:

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

#### Option 4: Docker Exec

Access database through Docker container:

```bash
docker exec -i supabase_db_font-generator psql -U postgres
```

#### Connection Details

- **Host**: 127.0.0.1
- **Port**: 54322
- **Database**: postgres
- **User**: postgres
- **Password**: postgres
- **Connection String**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### 4. Stop Supabase

```bash
supabase stop
```

To stop and remove all data:

```bash
supabase stop --no-backup
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and update values as needed:

```bash
cp .env.example .env
```

The default local development values are:

- **API URL**: http://127.0.0.1:54321
- **Anon Key**: `<local-anon-key-from-supabase-status>`
- **Service Role Key**: `<local-service-role-from-supabase-status>`

**⚠️ WARNING**: These keys are for local development only. Never use them in production!

### Configuration File

Supabase configuration is stored in `supabase/config.toml`. Key settings:

- **API Port**: 54321
- **Studio Port**: 54323
- **Database Port**: 54322
- **PostgreSQL Version**: 17

## Common Commands

### Check Status

```bash
supabase status
```

Shows all running services and their connection details.

### View Logs

```bash
supabase logs
```

View logs from all services.

### Reset Database

```bash
supabase db reset
```

Resets the database to initial state and runs migrations.

### Generate Types

```bash
supabase gen types typescript --local > src/types/supabase.ts
```

Generates TypeScript types from your database schema.

## Useful SQL Queries

### View Structure

```bash
# List all databases
./scripts/db-query.sh "\l"

# List all tables
./scripts/db-query.sh "\dt"

# Describe a table
./scripts/db-query.sh "\d table_name"

# List users
./scripts/db-query.sh "\du"
```

### Query Examples

```bash
# Check PostgreSQL version
./scripts/db-query.sh "SELECT version();"

# Show current database
./scripts/db-query.sh "SELECT current_database();"

# List all schemas
./scripts/db-query.sh "\dn"

# Show table sizes
./scripts/db-query.sh "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## Docker Containers

The following containers are created:

| Service      | Container Name                         | Port  | Description            |
| ------------ | -------------------------------------- | ----- | ---------------------- |
| Studio       | `supabase_studio_font-generator`       | 54323 | Web UI                 |
| Kong         | `supabase_kong_font-generator`         | 54321 | API Gateway            |
| Auth         | `supabase_auth_font-generator`         | -     | Authentication service |
| REST         | `supabase_rest_font-generator`         | -     | PostgREST API          |
| Realtime     | `supabase_realtime_font-generator`     | -     | Realtime subscriptions |
| Storage      | `supabase_storage_font-generator`      | -     | File storage           |
| Database     | `supabase_db_font-generator`           | 54322 | PostgreSQL 17          |
| Mailpit      | `supabase_inbucket_font-generator`     | 54324 | Email testing          |
| Meta         | `supabase_pg_meta_font-generator`      | -     | Database metadata      |
| Vector       | `supabase_vector_font-generator`       | -     | Vector embeddings      |
| Analytics    | `supabase_analytics_font-generator`    | 54327 | Analytics              |
| Edge Runtime | `supabase_edge_runtime_font-generator` | -     | Edge functions         |

## Project Structure

```
font-generator/
├── supabase/
│   ├── config.toml          # Supabase configuration
│   ├── .gitignore           # Ignores temp files
│   ├── config/              # Additional configs
│   └── volumes/             # Persistent data (git-ignored)
├── scripts/
│   ├── db-info.sh           # Show database info
│   └── db-query.sh          # Execute SQL queries
├── .env                     # Local environment variables (git-ignored)
└── .env.example             # Example environment variables
```

## Troubleshooting

### Port Conflicts

If you see port conflict errors, check if ports are already in use:

```bash
lsof -i :54321  # API
lsof -i :54322  # Database
lsof -i :54323  # Studio
```

You can change ports in `supabase/config.toml`.

### Docker Issues

If containers fail to start:

```bash
# Stop all Supabase containers
supabase stop

# Remove all Supabase volumes
docker volume ls | grep supabase | awk '{print $2}' | xargs docker volume rm

# Start fresh
supabase start
```

### Database Connection Issues

Ensure Docker is running and has enough resources:

- Minimum 4GB RAM
- At least 10GB disk space

### Common Errors

**Error: "Cannot connect to Docker daemon"**

- Make sure Docker Desktop is running
- Try restarting Docker Desktop

**Error: "Port already in use"**

- Check if another Supabase instance is running
- Check if other services are using ports 54321-54327
- Change ports in `supabase/config.toml`

**Error: "Database migration failed"**

- Check migration files in `supabase/migrations/`
- Run `supabase db reset` to start fresh
- Check logs with `supabase logs`

## Storage Buckets

Storage buckets are configured for user-uploaded fonts and images.

### Available Buckets

- **user-fonts**: Font file storage (5 MB limit, .woff2/.woff/.ttf)
- **user-images**: Background image storage (10 MB limit, .jpg/.png/.webp)

Both buckets have:

- Public read access (anyone can download)
- RLS-protected write access (users can only upload to their own folder)
- File size limits and MIME type validation

### Test Storage

```bash
./scripts/test-storage.sh
```

For detailed storage documentation, see [STORAGE_SETUP.md](./STORAGE_SETUP.md)

## Next Steps

1. **Configure Google OAuth** (Story 6.2) ✓
   - Set up Google OAuth credentials
   - Configure auth provider in Supabase

2. **Create Database Schema** (Story 6.3) ✓
   - Design tables for fonts, users, generations
   - Set up Row Level Security (RLS)

3. **Configure Storage Buckets** (Story 6.4) ✓
   - Create buckets for fonts and generated images
   - Set up access policies

## Resources

- [Supabase Local Development Docs](https://supabase.com/docs/guides/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Docker Compose Setup](https://github.com/supabase/supabase/tree/master/docker)
- [PostgreSQL 17 Documentation](https://www.postgresql.org/docs/17/)
