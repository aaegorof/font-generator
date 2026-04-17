---
project_name: 'font-generator'
user_name: 'Artemiy'
date: '2026-04-01'
sections_completed:
  [
    'technology_stack',
    'language_rules',
    'framework_rules',
    'testing_rules',
    'quality_rules',
    'font_pipeline',
    'anti_patterns',
    'task_standards',
    'ui_components',
  ]
status: 'complete'
rule_count: 43
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns that AI agents must follow when implementing code in this project. Focused on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **React** 19.2.4
- **TypeScript** ~5.9.3
- **Vite** 8.0.1
- **Tailwind CSS** 4.2.2 — via `@tailwindcss/vite` plugin (NOT PostCSS, no `tailwind.config.js`)
- **Zustand** 5.0.12 — with `persist` middleware and `createJSONStorage`
- **React Router DOM** 7.13.2
- **html-to-image** 1.11.13
- **Express** 5.2.1 + **Multer** 2.1.1 — upload server, port 3001
- Dev runner: `concurrently` — Vite dev server (5173) + Node server (3001)

---

## Critical Implementation Rules

### TypeScript Rules

- `verbatimModuleSyntax: true` — always use `import type { ... }` for type-only imports; mixing value and type imports will fail the build
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` — no dead code allowed
- `erasableSyntaxOnly: true` — no `const enum`, no decorators
- All shared types live in `src/types/index.ts` — add new shared types there, not inline in components

### React & State Rules

- Components use **named exports** — `export const Foo = ...`, never `export default`
- Component folder structure: `ComponentName/index.tsx` + co-located `ComponentName.css`
- Use `memo()` on components that receive tile/font/image data (high re-render risk)
- Use `useCallback` for event handlers in memo components or passed as props
- All app state lives in a **single Zustand store** at `src/store/useStore.ts` — do not create additional stores
- Store uses `partialize` to control persistence — add new persisted fields to the `partialize` list; transient UI state (modals, tiles) must be excluded
- After any mutation affecting tile generation (`fonts`, `images`, `textInputs`), call `generateAllTiles` and update `tiles` in the **same action**
- `App.tsx` is the font injection entry point — font setup runs in `useEffect` on mount

### UI Components & shadcn/ui

- **Prefer shadcn/ui components** — always use shadcn components instead of building custom UI from scratch
- Only write custom components when you need to **compose** multiple shadcn components together
- Custom wrapper components should have **clear, minimal props** — avoid complex or unclear APIs
- Examples of acceptable custom components:
  - A `<FormField>` that combines `<Label>` + `<Input>` + `<ErrorMessage>` from shadcn
  - A `<ConfirmDialog>` that wraps shadcn's `<AlertDialog>` with specific behavior
- When in doubt, check if shadcn provides the component first before writing custom code

### Font Pipeline Rules

Three font sources — each requires its own injection mechanism:

1. **Google Fonts** — `setupGoogleFonts()` injects a `<link>` tag (idempotent via id check). Add new fonts to `GOOGLE_FONTS` array in `src/utils/fonts.ts` — this is the single source of truth for Google Fonts.
2. **Local fonts** — `injectLocalFontFaces()` injects `@font-face` rules for files in `public/fonts/`. Add filename (without extension) to `localFontFileNames`. Files must exist as `.woff2`, `.woff`, and `.ttf`.
3. **Uploaded fonts** — `injectUploadedFont(font)` injects per-font `<style>` tags. Files are saved to `public/fonts/` via Express on port 3001. Re-injected on app load via `importAllSettings`.

Vite proxies `/upload-font` → `http://localhost:3001` in dev. Production requires a real server for this route.

### Code Quality & Style

**Prettier config (enforced — never skip):**

- No semicolons
- Single quotes
- 2-space indent
- Trailing commas everywhere (`"all"`)
- Print width: 100
- Tailwind class order sorted automatically by `prettier-plugin-tailwindcss`

**CSS conventions:**

- Existing components use BEM-style class names — **do not enforce BEM on new code**
- New components: use simple, flat, descriptive class names (e.g. `.actions`, `.label`, `.overlay`)
- CSS files co-located with their component
- Prefer Tailwind utility classes for layout; component CSS files for structural or stateful styles

**File naming:**

- Components: PascalCase folder + `index.tsx` (`Tile/index.tsx`)
- Utilities: camelCase (`exportTile.ts`, `tileGenerator.ts`)

### Testing Rules

- No test setup currently exists — do not add test files unless explicitly requested
- **Never write tests automatically** — tests should only be created when the user explicitly requests them
- **Never include test examples in task descriptions** — keep task artifacts focused on implementation only
- If test coverage is needed, the user will request it separately as a dedicated task

### Task & Documentation Standards

**Task Description Policy:**

- Keep task descriptions **minimal** — include only essential information needed for implementation
- Optimize for readability and token efficiency without sacrificing quality
- Avoid verbose explanations, unnecessary context, or speculative details
- Focus on what needs to be done, not how to test it (unless explicitly requested)

**Artifact Structure:**

Use hierarchical epic/task structure for all implementation artifacts:

```
Epic 1 - Name
  1.1 - Task name
  1.2 - Task name
Epic 2 - Name
  2.1 - Task name
  2.2 - Task name
```

**Task Status Tracking:**

- When all task conditions are completed, add **"Done-"** or **"✓-"** prefix before the task number in the filename
- Examples:
  - `Done-1.1-implement-auth.md`
  - `✓-1.1-implement-auth.md`
  - `Done-2.3-setup-storage.md`

**Documentation Policy:**

- **Never create large README files automatically** — write documentation only when explicitly requested
- If extensive documentation seems necessary, ask the user first whether they need a detailed guide
- Keep inline code comments minimal and focused on non-obvious logic only
- Avoid creating "how-to" guides, tutorials, or manuals unless the user specifically asks for them

### Critical Don't-Miss Rules

- **Never import types without `import type`** — `verbatimModuleSyntax` breaks the build on violations
- **Never persist `tiles` to localStorage** — tiles are always transient, regenerated on load; keep them out of `partialize`
- **Never add `loadWeights` to `FontDef`** — it exists only in `GoogleFontEntry` and is used exclusively to build the Google Fonts CSS URL
- **Local font filenames with spaces** — `injectLocalFontFaces` uses `localFile` as the path; `'Portico Regular'` maps to `/fonts/Portico Regular.woff2` — names must match exactly
- **Tailwind v4** — no `@tailwind base/components/utilities` directives; the vite plugin handles injection automatically
- **Two processes required in dev** — `npm run dev` starts both; font upload will silently fail if `server.js` is not running
- **Favorite matching is by fontIds + imageUrl** — not by tile id; this is intentional for deduplication logic in `Tile`

---

## Usage Guidelines

**For AI Agents:** Read this file before implementing any code. Follow all rules exactly. When in doubt, match existing patterns in the codebase.

**For Humans:** Update when the tech stack or conventions change. Keep it lean — remove rules that become obvious over time.

_Last Updated: 2026-04-17_
