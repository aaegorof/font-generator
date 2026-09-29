# Supabase (Local Development)

This project uses Supabase for auth, Postgres, and storage. Local stack runs via Supabase CLI + Docker.

Related docs: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) · [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) · [STORAGE_SETUP.md](./STORAGE_SETUP.md)

## Prerequisites

- Docker Desktop running
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)

## Quick Start

```bash
cp .env.example .env
supabase start          # or: npm run supabase:start
supabase status         # copy URL + anon key into .env
```

Then start the app (`npm run dev` / `npm run dev:full`).

| Service | URL |
| ------- | --- |
| Studio | http://127.0.0.1:54323 |
| API | http://127.0.0.1:54321 |
| Mailpit (emails) | http://127.0.0.1:54324 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

**Never commit real keys.** Put `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` from `supabase status` (local only).

Stop: `supabase stop` · wipe data: `supabase stop --no-backup` · reset DB: `supabase db reset`

## Schema & migrations

Migrations live in `supabase/migrations/`. After a fresh start they usually apply automatically; if not:

```bash
supabase db reset
# or apply via Studio SQL Editor / docker exec into supabase_db_font-generator
```

Public tables: `user_profiles`, `user_fonts`, `user_images`, `user_favorites`.

Generate types:

```bash
npm run db:types   # → src/types/database.types.ts
```

## Database helpers

```bash
./scripts/db-info.sh
./scripts/db-query.sh "\dt"
./scripts/db-query.sh "SELECT * FROM user_fonts LIMIT 5;"
```

Direct access: Studio, `psql` with the connection string above, or:

```bash
docker exec -i supabase_db_font-generator psql -U postgres
```

## Storage

| Bucket | Purpose | Limits |
| ------ | ------- | ------ |
| `user-fonts` | Uploaded fonts | ~5 MB · woff2/woff/ttf |
| `user-images` | Background images | ~10 MB · jpg/png/webp |

Public read; writes are RLS-scoped to the user’s folder. Smoke test: `./scripts/test-storage.sh`.

## Config

- `supabase/config.toml` — ports (API `54321`, DB `54322`, Studio `54323`), Postgres 17
- `.env` / `.env.example` — Vite + OAuth + Google Fonts API keys

## Troubleshooting

- **Docker not running** — start Docker Desktop, then `supabase start`
- **Port in use** — `lsof -i :54321` (also 54322–54324); change ports in `config.toml` if needed
- **Broken local state** — `supabase stop`, remove supabase Docker volumes, `supabase start`

Official docs: [Local development](https://supabase.com/docs/guides/local-development) · [CLI](https://supabase.com/docs/reference/cli)
