# Project Architecture Context

## Critical Files for All Agents

Before implementing any code changes, ALWAYS read these files first:

1. **QUICK_START.md** (root) — 5-minute overview and common tasks
2. **ARCHITECTURE.md** (root) — Complete project architecture, component structure, and data flow
3. **ARCHITECTURE_DIAGRAM.md** (root) — Visual diagrams of data flow and component hierarchy
4. **_bmad-output/project-context.md** — Critical implementation rules, tech stack, and patterns

### Reading Strategy
- **Quick task?** → Read QUICK_START.md only
- **New to project?** → Read QUICK_START.md → ARCHITECTURE.md
- **Complex feature?** → Read all files above + ARCHITECTURE_DIAGRAM.md
- **Need visual reference?** → ARCHITECTURE_DIAGRAM.md

## Quick Reference

### Project Type
React + TypeScript + Vite application for font preview generation

### Key Technologies
- React 19.2.4 + TypeScript 5.9.3
- Zustand (single store pattern)
- Tailwind CSS 4.2.2 (via Vite plugin)
- Express server for font uploads (port 3001)

### Architecture Principles
1. **Single Zustand Store** — All state in `src/store/useStore.ts`
2. **Three Font Sources** — Google Fonts, local fonts, uploaded fonts (each with unique injection)
3. **Tile Generation** — Always call `generateAllTiles()` after mutations
4. **Named Exports Only** — No default exports for components
5. **Type-Only Imports** — Always use `import type` for types (verbatimModuleSyntax)

### Common Tasks

#### Adding a new component:
- Create folder: `src/components/ComponentName/`
- Files: `index.tsx` + optional `ComponentName.css`
- Use named export: `export const ComponentName = ...`
- Use `memo()` if component receives tile/font/image data

#### Modifying state:
- All changes through Zustand store actions in `useStore.ts`
- After mutations affecting tiles, call `generateAllTiles()`
- Check `partialize` if adding persisted fields

#### Working with fonts:
- Google Fonts: Add to `GOOGLE_FONTS` array in `utils/fonts.ts`
- Local fonts: Add filename to `localFontFileNames` + place files in `public/fonts/`
- Uploaded fonts: Use Express endpoint `/upload-font`

#### Adding types:
- All shared types go in `src/types/index.ts`
- Import with `import type { TypeName } from '@/types'`

### Code Style (Enforced by Prettier)
- No semicolons
- Single quotes
- 2-space indent
- Trailing commas everywhere
- Print width: 100

### Critical Don'ts
- ❌ Never create additional Zustand stores
- ❌ Never persist `tiles` to localStorage
- ❌ Never use default exports for components
- ❌ Never import types without `import type`
- ❌ Never add `loadWeights` to `FontDef` type
- ❌ Never skip `generateAllTiles()` after state mutations

## File Locations

```
src/
├── components/     # React components (Grid, Tile, Toolbar, etc.)
├── hooks/          # Custom hooks (useFontFilter)
├── store/          # useStore.ts (single source of truth)
├── types/          # index.ts (all shared types)
└── utils/          # fonts, images, tileGenerator, exportTile, exportSettings
```

## When in Doubt

1. Read `ARCHITECTURE.md` for component structure and data flow
2. Read `_bmad-output/project-context.md` for implementation rules
3. Check existing code patterns in similar components
4. Follow TypeScript strict mode — compiler will catch most mistakes
