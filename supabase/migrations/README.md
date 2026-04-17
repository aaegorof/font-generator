# Database Migrations

This directory contains SQL migration files for the Font Generator database schema.

## Migration Files

- `00001_initial_schema.sql` - Initial database schema with tables, RLS policies, triggers, and helper functions

## Applying Migrations

### Option 1: Via Supabase Studio (Recommended for Development)

1. Open Supabase Studio: `http://localhost:54323`
2. Navigate to SQL Editor
3. Copy the contents of the migration file
4. Paste and execute

### Option 2: Via Supabase CLI

```bash
# Apply all pending migrations
npx supabase db push

# Or apply a specific migration
npx supabase db execute --file supabase/migrations/00001_initial_schema.sql
```

### Option 3: Via Docker Exec

```bash
# Copy migration file to container
docker cp supabase/migrations/00001_initial_schema.sql supabase_db_font-generator:/tmp/

# Execute migration
docker exec supabase_db_font-generator psql -U postgres -d postgres -f /tmp/00001_initial_schema.sql
```

## Verifying Migrations

After applying a migration, verify the schema:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'user_fonts', 'user_images', 'user_favorites');

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check all policies exist (should be 16 total: 4 tables × 4 operations)
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';

-- List all policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

## Schema Overview

### Tables

- **user_profiles** - User settings and preferences (1 row per user)
- **user_fonts** - User font definitions (Google Fonts, local, uploaded)
- **user_images** - User uploaded images
- **user_favorites** - User favorite tiles

### Security

All tables have Row Level Security (RLS) enabled with policies that:

- Allow users to view only their own data
- Allow users to insert only their own data
- Allow users to update only their own data
- Allow users to delete only their own data

### Triggers

- **handle_updated_at** - Automatically updates `updated_at` timestamp on `user_profiles` table
- **handle_new_user** - Automatically creates a user profile when a new user signs up

## Migration Naming Convention

Migrations are numbered sequentially with 5 digits:

- `00001_initial_schema.sql`
- `00002_add_feature_x.sql`
- `00003_modify_table_y.sql`

Always increment the number for new migrations to maintain order.
