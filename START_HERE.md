# 🚀 Start Here

## Quick Start (3 steps)

```bash
# 1. Check environment
npm run check

# 2. Start everything
npm run dev:full

# 3. Open browser
open http://localhost:5173
```

## Access Points

| Service             | URL                    |
| ------------------- | ---------------------- |
| **Frontend**        | http://localhost:5173  |
| **Backend API**     | http://localhost:3000  |
| **Supabase Studio** | http://127.0.0.1:54323 |

## Common Commands

```bash
npm run check           # Check if environment is ready
npm run dev:full        # Start everything (Supabase + Frontend + Backend)
npm run dev             # Start Frontend + Backend only
npm run supabase:start  # Start Supabase only
npm run supabase:stop   # Stop Supabase
npm run db:types        # Regenerate database types
npm test               # Run tests
npm run format         # Format code
```

## Documentation

📖 **English**

- [docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md) - Full setup guide
- [QUICK_START.md](./QUICK_START.md) - Development guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Project architecture

🇷🇺 **Русский**

- [docs/RU_QUICKSTART.md](./docs/RU_QUICKSTART.md) - Быстрый старт
- [DOCS_INDEX.md](./DOCS_INDEX.md) - Индекс документации

## Prerequisites

Before running, make sure you have:

- ✅ Docker Desktop running
- ✅ Supabase CLI installed (`brew install supabase/tap/supabase`)
- ✅ `.env.local` configured (copy from `.env.example`)

## Troubleshooting

### "Cannot connect to Docker daemon"

→ Start Docker Desktop

### "Port already in use"

→ Kill the process: `lsof -i :PORT` then `kill -9 PID`

### Supabase not working

→ Reset: `npm run supabase:stop && docker system prune -a --volumes && npm run supabase:start`

## BMad Agents

Talk to AI agents for help:

```
talk to John          # Product Manager (PRD creation)
talk to Winston       # Architect (technical design)
talk to Amelia        # Developer (implementation)
talk to Quinn         # QA Engineer (testing)
talk to Paige         # Tech Writer (documentation)
talk to Sally         # UX Designer (UI/UX)
```

Or use BMad workflows:

```
create PRD
create architecture
create UX
run sprint planning
dev story [story-id]
run code review
```

---

**Need help?** Check [DOCS_INDEX.md](./DOCS_INDEX.md) for all documentation.
