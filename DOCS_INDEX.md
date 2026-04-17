# Documentation Index

Complete guide to Font Generator project documentation.

## For Developers

### Getting Started

- **[QUICK_START.md](./QUICK_START.md)** — 5-minute overview, common tasks, troubleshooting
- **[README.md](./README.md)** — Project overview and quick commands
- **[docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md)** — Local dev setup with Supabase (one command!)

### Architecture Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Complete project architecture, components, and patterns
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** — Visual diagrams of data flow and component hierarchy

### Infrastructure

- **[docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md)** — Local dev environment setup (Supabase + Frontend + Backend)
- **[docs/SUPABASE.md](./docs/SUPABASE.md)** — Supabase setup, database access, and troubleshooting
- **[docs/STORAGE_SETUP.md](./docs/STORAGE_SETUP.md)** — Storage buckets, RLS policies, and file upload
- **[docs/GOOGLE_OAUTH_SETUP.md](./docs/GOOGLE_OAUTH_SETUP.md)** — Complete Google OAuth configuration guide
- **[docs/GOOGLE_OAUTH_QUICKSTART.md](./docs/GOOGLE_OAUTH_QUICKSTART.md)** — Quick 5-minute OAuth setup

## For AI Agents

### Implementation Rules

- **[.cursor/rules/project-architecture.md](./.cursor/rules/project-architecture.md)** — Quick reference for AI agents
- **[\_bmad-output/project-context.md](./_bmad-output/project-context.md)** — Critical rules (tech stack, TypeScript, React, Zustand)
- **[.cursor/rules/README.md](./.cursor/rules/README.md)** — Overview of available rules

## By Topic

### Getting Started

1. [QUICK_START.md](./QUICK_START.md) — Installation, dev setup, first steps
2. [README.md](./README.md) — Project overview and quick commands
3. [docs/SUPABASE.md](./docs/SUPABASE.md) — Supabase local development setup

### Understanding the Codebase

1. [ARCHITECTURE.md](./ARCHITECTURE.md) — Full architecture documentation
2. [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) — Visual diagrams
3. [\_bmad-output/project-context.md](./_bmad-output/project-context.md) — Implementation rules

### Working with Specific Features

#### State Management

- [ARCHITECTURE.md](./ARCHITECTURE.md) → "Управление состоянием (Zustand Store)"
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) → "Zustand Store diagram"

#### Fonts

- [ARCHITECTURE.md](./ARCHITECTURE.md) → "Работа со шрифтами"
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) → "Font Injection Flow"
- [\_bmad-output/project-context.md](./_bmad-output/project-context.md) → "Font Pipeline Rules"
- [public/fonts/README.md](./public/fonts/README.md) → "Custom fonts setup"

#### Components

- [ARCHITECTURE.md](./ARCHITECTURE.md) → "Основные компоненты"
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) → "Component Hierarchy"

#### Tile Generation

- [ARCHITECTURE.md](./ARCHITECTURE.md) → "Генерация тайлов"
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) → "Data Flow: Adding a Font"

#### Export

- [ARCHITECTURE.md](./ARCHITECTURE.md) → "Экспорт тайлов"
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) → "Data Flow: Exporting a Tile"

#### Database & Infrastructure

- [docs/SUPABASE.md](./docs/SUPABASE.md) — Complete Supabase guide
- [docs/STORAGE_SETUP.md](./docs/STORAGE_SETUP.md) — Storage buckets and file upload
- [docs/GOOGLE_OAUTH_SETUP.md](./docs/GOOGLE_OAUTH_SETUP.md) — Google OAuth configuration
- [docs/GOOGLE_OAUTH_QUICKSTART.md](./docs/GOOGLE_OAUTH_QUICKSTART.md) — Quick OAuth setup

## Reading Paths

### Path 1: "I'm new here"

1. [README.md](./README.md) — What is this project?
2. [docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md) — Set up local environment (one command!)
3. [QUICK_START.md](./QUICK_START.md) — How do I get started?
4. [docs/GOOGLE_OAUTH_QUICKSTART.md](./docs/GOOGLE_OAUTH_QUICKSTART.md) — Configure Google OAuth (5 min)
5. [ARCHITECTURE.md](./ARCHITECTURE.md) — How does it work?

### Path 2: "I need to implement a feature"

1. [QUICK_START.md](./QUICK_START.md) → "Common Tasks"
2. [ARCHITECTURE.md](./ARCHITECTURE.md) → Find relevant component/pattern
3. [\_bmad-output/project-context.md](./_bmad-output/project-context.md) → Check implementation rules
4. Look at existing code for similar features

### Path 3: "I'm an AI agent"

1. [.cursor/rules/project-architecture.md](./.cursor/rules/project-architecture.md) — Quick reference
2. [QUICK_START.md](./QUICK_START.md) — Overview and common tasks
3. [ARCHITECTURE.md](./ARCHITECTURE.md) — Detailed architecture
4. [\_bmad-output/project-context.md](./_bmad-output/project-context.md) — Critical rules

### Path 4: "I need to understand data flow"

1. [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) — All visual diagrams
2. [ARCHITECTURE.md](./ARCHITECTURE.md) → "Управление состоянием"

### Path 5: "I'm debugging an issue"

1. [QUICK_START.md](./QUICK_START.md) → "Troubleshooting"
2. [ARCHITECTURE.md](./ARCHITECTURE.md) → Find relevant section
3. [\_bmad-output/project-context.md](./_bmad-output/project-context.md) → "Critical Don't-Miss Rules"

## File Structure

```
/
├── README.md                          # Project overview
├── DOCS_INDEX.md                      # This file
├── QUICK_START.md                     # Quick start guide
├── ARCHITECTURE.md                    # Full architecture docs
├── ARCHITECTURE_DIAGRAM.md            # Visual diagrams
│
├── docs/
│   ├── LOCAL_DEVELOPMENT.md           # Local dev setup (one command!)
│   ├── SUPABASE.md                    # Supabase setup and database guide
│   ├── STORAGE_SETUP.md               # Storage buckets and file upload
│   ├── GOOGLE_OAUTH_SETUP.md          # Google OAuth configuration
│   └── GOOGLE_OAUTH_QUICKSTART.md     # Quick OAuth setup
│
├── public/fonts/
│   └── README.md                      # Custom fonts guide
│
├── _bmad-output/
│   └── project-context.md             # AI agent rules (detailed)
│
└── .cursor/
    └── rules/
        ├── README.md                  # Rules overview
        └── project-architecture.md    # AI agent quick reference
```

## Maintenance

### When to Update Documentation

- **README.md**: When changing project description or adding major features
- **QUICK_START.md**: When adding common tasks or changing dev workflow
- **ARCHITECTURE.md**: When adding/removing components or changing patterns
- **ARCHITECTURE_DIAGRAM.md**: When data flow or component hierarchy changes
- **docs/SUPABASE.md**: When changing database setup or adding new infrastructure
- **project-context.md**: When adding critical rules or changing tech stack
- **.cursor/rules/**: When adding rules for AI agents
- **DOCS_INDEX.md**: When adding/removing/moving documentation files

### Documentation Principles

1. **DRY**: Don't repeat information. Link to other docs instead.
2. **Hierarchy**: Quick Start → Architecture → Detailed Rules
3. **Examples**: Show, don't just tell
4. **Maintenance**: Remove outdated info, keep it current

## Questions?

1. Check this index for relevant documentation
2. Read the suggested files
3. Look at existing code
4. TypeScript compiler will catch most mistakes

---

**Last Updated**: 2026-04-16
