# Story 3.1 — Dynamic Google Fonts Management

**Status:** ready-for-dev  
**Priority:** Medium-Large  
**Estimate:** ~3 hours

---

## User Story

As Artemiy, I want to add and remove Google Fonts through the UI (including selecting which weights to load), without touching the source code, so I can experiment with new fonts without a redeploy.

## Current Behavior

- `GOOGLE_FONTS` array in `src/utils/fonts.ts` is hardcoded.
- `setupGoogleFonts()` builds a CSS URL from that hardcoded array and injects it once.
- There's no UI to add/remove Google Fonts dynamically.
- The project-context explicitly notes: **Never add `loadWeights` to `FontDef`** — it belongs only in `GoogleFontEntry`.

## Desired Behavior

1. A new "Google Fonts" section in `FontsPage` shows the currently loaded Google Fonts.
2. An "Add Google Font" form lets the user type a font name and optionally select weights, then click "Add".
3. When added, the font is injected into the page (via an updated Google Fonts CSS URL or individual `@import`) and added to `store.fonts`.
4. Fonts can be removed from this section (removes from store.fonts).
5. The list of Google Font entries (with `loadWeights`) is **persisted in the store** as `googleFontEntries`.
6. On app load, `setupGoogleFonts` uses the store's entries (not the hardcoded array).
7. The hardcoded `GOOGLE_FONTS` in `fonts.ts` becomes the **default seed** only — it initialises the store on first load but is never used directly after that.

---

## Acceptance Criteria

- [ ] `FontsPage` has a "Google Fonts" section showing existing Google fonts with a remove button each.
- [ ] "Add" form: text input for font name (family), checkboxes or multi-select for weights (100–900), "Add" button.
- [ ] On add: font is injected into the page and added to `store.fonts`; `googleFontEntries` in store is updated.
- [ ] On remove: font removed from `store.fonts` and `googleFontEntries`.
- [ ] `googleFontEntries` is persisted in localStorage.
- [ ] App.tsx uses `store.googleFontEntries` (not hardcoded array) for font setup on mount.
- [ ] The hardcoded `GOOGLE_FONTS` constant seeds the store's initial state only.
- [ ] Existing local and uploaded fonts are unaffected.

---

## Implementation Notes

### Architecture decision

We keep `GoogleFontEntry` as a separate type (not mixed into `FontDef`) as required by project rules. The store gets a new `googleFontEntries: GoogleFontEntry[]` field that is the canonical source for Google font configuration.

`store.fonts` (which includes Google fonts as `FontDef`) is derived from `googleFontEntries` on add/remove. On initial hydration from localStorage, if `googleFontEntries` exists, we rebuild Google `FontDef`s from it; if not, we fall back to `DEFAULT_FONTS`.

### Export `GoogleFontEntry` from `fonts.ts`

Currently `GoogleFontEntry` is a file-local interface. Export it:

```ts
// src/utils/fonts.ts
export interface GoogleFontEntry {
  id: string
  name: string
  family: string
  weight: number       // default/preview weight
  loadWeights: number[]
  isActive?: boolean
}
```

Export `GOOGLE_FONTS` as the default seed:

```ts
export const DEFAULT_GOOGLE_FONT_ENTRIES: GoogleFontEntry[] = GOOGLE_FONTS
```

### `setupGoogleFonts` becomes parameterised

```ts
export function setupGoogleFonts(entries: GoogleFontEntry[]) {
  const id = 'google-fonts-link'
  let link = document.getElementById(id) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  link.href = buildGoogleFontsUrl(entries)
}
```

(Changed from one-shot idempotent to always-update — safe since we replace `href`.)

### `fontEntryToFontDef` helper (in `fonts.ts`)

```ts
export function googleEntryToFontDef(entry: GoogleFontEntry): FontDef {
  return {
    id: entry.id,
    name: entry.name,
    family: entry.family,
    weight: entry.weight,
    source: 'google',
    isActive: entry.isActive ?? true,
  }
}
```

### Store changes — `src/store/useStore.ts`

#### New imports:

```ts
import {
  DEFAULT_FONTS,
  DEFAULT_GOOGLE_FONT_ENTRIES,
  injectUploadedFont,
  googleEntryToFontDef,
  setupGoogleFonts,
} from '../utils/fonts'
import type { GoogleFontEntry } from '../utils/fonts'
```

#### New state:

```ts
interface AppState {
  googleFontEntries: GoogleFontEntry[]
  // ... rest unchanged
}
```

#### New actions:

```ts
interface AppActions {
  addGoogleFontEntry: (entry: GoogleFontEntry) => void
  removeGoogleFontEntry: (id: string) => void
  // ... rest unchanged
}
```

#### Initial state:

```ts
googleFontEntries: DEFAULT_GOOGLE_FONT_ENTRIES,
```

#### Action implementations:

```ts
addGoogleFontEntry: (entry) => {
  const newFontDef = googleEntryToFontDef(entry)
  set((state) => ({
    googleFontEntries: [...state.googleFontEntries, entry],
    fonts: [...state.fonts, newFontDef],
  }))
  // Rebuild Google Fonts CSS
  setupGoogleFonts(get().googleFontEntries)
  // Regenerate tiles
  const { fonts, images, textInputs, disabledImages, layerFontPins } = get()
  const activeImages = images.filter((img) => !disabledImages.includes(img))
  set({ tiles: generateAllTiles(fonts, activeImages, textInputs.length, layerFontPins) })
},

removeGoogleFontEntry: (id) => {
  set((state) => ({
    googleFontEntries: state.googleFontEntries.filter((e) => e.id !== id),
    fonts: state.fonts.filter((f) => f.id !== id),
  }))
  setupGoogleFonts(get().googleFontEntries)
  const { fonts, images, textInputs, disabledImages, layerFontPins } = get()
  const activeImages = images.filter((img) => !disabledImages.includes(img))
  set({ tiles: generateAllTiles(fonts, activeImages, textInputs.length, layerFontPins) })
},
```

#### Partialize — add `googleFontEntries`:

```ts
partialize: (state) => ({
  ...
  googleFontEntries: state.googleFontEntries,
  ...
}),
```

#### Migration concern

When a user has localStorage without `googleFontEntries`, Zustand `persist` will produce `undefined` for it. The initial state `DEFAULT_GOOGLE_FONT_ENTRIES` handles this via `merge` strategy (Zustand merges shallow). However, to be safe, add a `version` and `migrate` to the persist config:

```ts
persist(
  (set, get) => ({ ... }),
  {
    name: 'font-generator-store',
    storage: createJSONStorage(() => localStorage),
    version: 2,   // bump from 1 (or 0 if never set)
    migrate: (persistedState, version) => {
      if (version < 2) {
        // Old store had no googleFontEntries — seed from DEFAULT
        return {
          ...(persistedState as object),
          googleFontEntries: DEFAULT_GOOGLE_FONT_ENTRIES,
        }
      }
      return persistedState
    },
    partialize: ...
  }
)
```

### App.tsx change

```ts
// Before:
setupGoogleFonts()

// After:
const googleFontEntries = useStore.getState().googleFontEntries
setupGoogleFonts(googleFontEntries)
```

Or better, read from store in the useEffect:

```ts
const { fonts, generateTiles, tiles, googleFontEntries } = useStore()

useEffect(() => {
  setupGoogleFonts(googleFontEntries)
  injectLocalFontFaces(fonts)
  fonts.filter((f) => f.source === 'upload' && f.uploadUrl).forEach((f) => injectUploadedFont(f))
  if (tiles.length === 0) generateTiles()
}, [])
```

### FontsPage UI — "Add Google Font" section

Split the font list into sections: Local/Uploaded fonts (existing UI) and Google Fonts (new management UI).

```tsx
// Google Fonts section (separate from the font list above)
const { googleFontEntries, addGoogleFontEntry, removeGoogleFontEntry } = useStore()

const AVAILABLE_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

const [gfName, setGfName] = useState('')
const [gfWeights, setGfWeights] = useState<number[]>([400, 700])
const [gfPreviewWeight, setGfPreviewWeight] = useState(400)
const [gfAdding, setGfAdding] = useState(false)

const handleAddGoogleFont = async () => {
  if (!gfName.trim() || gfWeights.length === 0) return
  setGfAdding(true)
  const family = gfName.trim()
  const id = family.toLowerCase().replace(/\s+/g, '-')
  
  // Check for duplicate
  if (googleFontEntries.find((e) => e.id === id)) {
    alert('This font is already added.')
    setGfAdding(false)
    return
  }

  const entry: GoogleFontEntry = {
    id,
    name: family,
    family,
    weight: gfWeights.includes(gfPreviewWeight) ? gfPreviewWeight : gfWeights[0],
    loadWeights: [...gfWeights].sort((a, b) => a - b),
    isActive: true,
  }
  addGoogleFontEntry(entry)
  setGfName('')
  setGfWeights([400, 700])
  setGfAdding(false)
}
```

Weight selector UI — a compact set of toggle buttons:

```tsx
<div className="toolbar__gf-weights">
  {AVAILABLE_WEIGHTS.map((w) => (
    <button
      key={w}
      className={`toolbar__gf-weight-btn ${gfWeights.includes(w) ? 'toolbar__gf-weight-btn--on' : ''}`}
      onClick={() =>
        setGfWeights((prev) =>
          prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]
        )
      }
    >
      {w}
    </button>
  ))}
</div>
```

### Fonts page structure after this story

```
FontsPage
├── [Search input] (Story 1.2)
├── [Layer Pins section] (Story 2.3)
├── [Font list: local + uploaded fonts]        ← existing, renamed section
└── [Google Fonts section]
    ├── List of current Google fonts (name + remove button)
    └── Add Google Font form (name input + weight picker + Add button)
```

### Files to change/create

| File | Change |
|------|--------|
| `src/utils/fonts.ts` | Export `GoogleFontEntry`, `DEFAULT_GOOGLE_FONT_ENTRIES`, `googleEntryToFontDef`; update `setupGoogleFonts` to accept `entries` param |
| `src/store/useStore.ts` | Add `googleFontEntries` state + actions + partialize + migrate |
| `src/components/Toolbar/pages/FontsPage.tsx` | Add Google Fonts management section |
| `src/App.tsx` | Pass `googleFontEntries` to `setupGoogleFonts()` |

### Critical rules

- `verbatimModuleSyntax` — `import type` for `GoogleFontEntry`.
- **Never add `loadWeights` to `FontDef`** — this rule remains in force. `GoogleFontEntry` and `FontDef` stay separate types.
- No semicolons, single quotes, 2-space indent.
- `googleFontEntries` must be in `partialize`; `tiles` must not.
- The `buildGoogleFontsUrl` function remains private (not exported) — called only from `setupGoogleFonts`.
