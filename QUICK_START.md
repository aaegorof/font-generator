# Quick Start Guide for Developers & AI Agents

## Essential Reading (in order)

1. **This file** — Quick orientation
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Full project structure
3. **[_bmad-output/project-context.md](./_bmad-output/project-context.md)** — Critical implementation rules

## 5-Minute Overview

### What is this?
Web app for generating font preview tiles with custom images and text. Users can:
- Select fonts (Google Fonts, local, or upload custom)
- Add background images
- Enter custom text
- Generate preview tiles
- Export tiles as PNG
- Save favorites

### How it works
1. **State**: Single Zustand store (`src/store/useStore.ts`)
2. **Tiles**: Generated on-the-fly from combinations of fonts × images × text
3. **Fonts**: Three sources (Google, local, uploaded) with different injection methods
4. **Export**: HTML → PNG via `html-to-image`

### Key Files

```
src/
├── store/useStore.ts          # ⭐ Single source of truth (all state + actions)
├── types/index.ts             # ⭐ All TypeScript types
├── utils/
│   ├── fonts.ts               # Font injection logic
│   ├── tileGenerator.ts       # Tile generation logic
│   └── exportTile.ts          # PNG export logic
├── components/
│   ├── Grid/                  # Main tile grid
│   ├── Tile/                  # Individual tile component
│   └── Toolbar/               # Settings panel
└── App.tsx                    # Entry point, font setup

server.js                      # Express server for font uploads (port 3001)
```

## Common Tasks

### Adding a Feature
1. Check if state needs updating → modify `useStore.ts`
2. Create component in `src/components/FeatureName/`
3. Add types to `src/types/index.ts` if needed
4. Use named exports: `export const FeatureName = ...`

### Modifying State
```typescript
// In useStore.ts
addSomething: (item) => {
  set((state) => ({
    items: [...state.items, item],
  }))
  get().generateAllTiles() // ⚠️ Always call after mutations!
}
```

### Adding a Font Source
- **Google**: Add to `GOOGLE_FONTS` in `utils/fonts.ts`
- **Local**: Add to `localFontFileNames` + place files in `public/fonts/`
- **Upload**: Already handled by Express server

### Adding a Type
```typescript
// In src/types/index.ts
export interface MyType {
  id: string
  name: string
}

// In your component
import type { MyType } from '@/types' // ⚠️ Always use 'import type'
```

## Critical Rules

### TypeScript
- ✅ Always `import type { ... }` for types
- ✅ All shared types in `src/types/index.ts`
- ❌ Never mix value and type imports

### React
- ✅ Named exports only: `export const Foo`
- ✅ Use `memo()` for components with tile/font/image data
- ❌ Never use default exports

### Zustand
- ✅ Single store pattern
- ✅ Call `generateAllTiles()` after mutations
- ❌ Never persist `tiles` (always regenerate)
- ❌ Never create additional stores

### Code Style
- No semicolons
- Single quotes
- 2-space indent
- Prettier enforced

## Development

```bash
# Start dev (runs Vite + Express)
npm run dev

# Vite: http://localhost:5173
# Express: http://localhost:3001

# Build
npm run build

# Format
npm run format
```

## Troubleshooting

### Fonts not loading?
- Check both processes are running (`npm run dev` starts both)
- Verify font files exist in `public/fonts/`
- Check browser console for 404s

### TypeScript errors?
- Make sure you're using `import type` for types
- Check `src/types/index.ts` for type definitions
- Run `npm run build` to see all errors

### State not updating?
- Did you call `generateAllTiles()` after mutation?
- Check if field is in `partialize` (for persistence)
- Use React DevTools to inspect Zustand state

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed component docs
- Read [_bmad-output/project-context.md](./_bmad-output/project-context.md) for implementation rules
- Read [docs/SUPABASE.md](./docs/SUPABASE.md) for database setup
- Check [.cursor/rules/](./.cursor/rules/) for AI agent guidelines

## Questions?

1. Check [DOCS_INDEX.md](./DOCS_INDEX.md) for navigation
2. Check ARCHITECTURE.md for component structure
3. Check project-context.md for implementation rules
4. Look at similar existing code
5. TypeScript compiler is your friend
