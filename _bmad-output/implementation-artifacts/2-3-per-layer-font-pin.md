# Story 2.3 — Per-Layer Font Pinning

**Status:** review  
**Priority:** Medium  
**Estimate:** ~2 hours

---

## User Story

As Artemiy, I want to optionally pin a specific font to a text layer, so that layer always uses that font in tile generation — reducing the combination matrix and letting me focus on exploring variations in the remaining layers.

## Background / Current Behavior

Current `generateAllTiles` with 2 layers and F active fonts produces F² combinations:
```
Layer1 × Layer2 = [f1f1, f1f2, f1f3, f2f1, f2f2, f2f3, f3f1, f3f2, f3f3]
```

If I pin Layer 2 to "Bebas Neue", the matrix becomes F combinations:
```
Layer1 × [bebas-neue] = [f1-bebas, f2-bebas, f3-bebas]
```

---

## Desired Behavior

1. In the **Fonts page**, at the top, a section "Font pins per layer" shows one row per text layer.
2. Each row has a dropdown (or clear button) to pin that layer to a specific active font or leave it as "All" (free).
3. When a layer is pinned, `generateAllTiles` only uses the pinned font for that layer's slot.
4. Pins are persisted across sessions.
5. When the pinned font is later disabled or removed, the pin is automatically cleared for that layer.

---

## Acceptance Criteria

- [x] `FontsPage` shows a "Layer Pins" section with one row per text layer.
- [x] Each row has a font selector (dropdown or button list) with "All active" + each active font as options.
- [x] Selecting a font pins that layer; selecting "All active" removes the pin.
- [x] Tile generation respects pins: pinned layers use only their pinned font.
- [x] Pins are persisted.
- [x] When a font is removed or deactivated, any pins to that font are auto-cleared.
- [x] The total tile count shown in StatusBar reflects the reduced matrix.

---

## Implementation Notes

### Type / Store changes

#### New state: `layerFontPins`

```ts
// in AppState:
layerFontPins: Record<number, string>   // layerIndex → fontId; absence = not pinned
```

This is a plain object mapping `layerIndex` (0-based) → `fontId`. If a layer index is absent from the object, it is free (uses all active fonts).

#### New actions:

```ts
interface AppActions {
  setLayerFontPin: (layerIndex: number, fontId: string | null) => void
}
```

```ts
// Initial state:
layerFontPins: {},

// Action:
setLayerFontPin: (layerIndex, fontId) => {
  set((state) => {
    const pins = { ...state.layerFontPins }
    if (fontId === null) {
      delete pins[layerIndex]
    } else {
      pins[layerIndex] = fontId
    }
    return { layerFontPins: pins }
  })
  // Regenerate tiles with new pins
  const { fonts, images, textInputs, disabledImages, layerFontPins } = get()
  const activeImages = images.filter((img) => !get().disabledImages.includes(img))
  set({ tiles: generateAllTiles(fonts, activeImages, textInputs.length, get().layerFontPins) })
},
```

#### Partialize — add `layerFontPins`:

```ts
partialize: (state) => ({
  ...
  layerFontPins: state.layerFontPins,
  ...
}),
```

#### Auto-clear pins when font removed/deactivated:

In `removeFont`:
```ts
removeFont: (id) => {
  set((state) => {
    const fonts = state.fonts.filter((f) => f.id !== id)
    // Clear any pins referencing this font
    const layerFontPins = Object.fromEntries(
      Object.entries(state.layerFontPins).filter(([, fId]) => fId !== id)
    )
    return { fonts, layerFontPins }
  })
  // ... regenerate
},
```

In `toggleFontActive` — when deactivating, clear pins for that font:
```ts
toggleFontActive: (id) => {
  set((state) => {
    const fonts = state.fonts.map((f) => (f.id === id ? { ...f, isActive: !f.isActive } : f))
    const deactivated = state.fonts.find((f) => f.id === id)?.isActive !== false
    const layerFontPins = deactivated
      ? Object.fromEntries(Object.entries(state.layerFontPins).filter(([, fId]) => fId !== id))
      : state.layerFontPins
    return { fonts, layerFontPins }
  })
  // ... regenerate
},
```

### `generateAllTiles` signature update — `src/utils/tileGenerator.ts`

```ts
export function generateAllTiles(
  fonts: FontDef[],
  images: string[],
  numInputs: number,
  layerPins: Record<number, string> = {},
): TileData[]
```

**New logic:**

```ts
const activeFonts = fonts.filter((f) => f.isActive !== false)
const n = Math.max(numInputs, 1)

// Build per-layer font pools
const layerPools: string[][] = Array.from({ length: n }, (_, i) => {
  const pinId = layerPins[i]
  if (pinId) {
    const pinFont = activeFonts.find((f) => f.id === pinId)
    return pinFont ? [pinFont.id] : activeFonts.map((f) => f.id)
  }
  return activeFonts.map((f) => f.id)
})

// Generate combinations: Cartesian product of layerPools[0] × layerPools[1] × ...
// But cap at 100 for 3+ layers (existing cap behavior)
function cartesian(pools: string[][]): string[][] {
  return pools.reduce<string[][]>(
    (acc, pool) => acc.flatMap((combo) => pool.map((id) => [...combo, id])),
    [[]]
  )
}

const combinations =
  n <= 2
    ? cartesian(layerPools)
    : (() => {
        const result: string[][] = []
        outer: for (const id0 of layerPools[0]) {
          for (const id1 of layerPools[1]) {
            const combo = [id0, id1]
            for (let k = 2; k < n; k++) {
              const pool = layerPools[k]
              combo.push(pool[Math.floor(Math.random() * pool.length)])
            }
            result.push(combo)
            if (result.length >= 100) break outer
          }
        }
        return result
      })()
```

### `randomizeSingleTile` — also needs to respect pins:

```ts
fontIds: Array.from({ length: numInputs }, (_, i) => {
  const pinId = layerFontPins[i]
  if (pinId) {
    const pinFont = activeFonts.find((f) => f.id === pinId)
    if (pinFont) return pinFont.id
  }
  return activeFonts[Math.floor(Math.random() * activeFonts.length)].id
}),
```

### All callers of `generateAllTiles` — update signature

Every call in `useStore.ts` must pass `get().layerFontPins` as the 4th argument.

### FontsPage UI — Layer Pins section

Add above the font list, below the search bar:

```tsx
const { textInputs, layerFontPins, setLayerFontPin, fonts } = useStore()
const activeFonts = fonts.filter((f) => f.isActive !== false)

// Only show this section if there are 2+ layers
{textInputs.length > 1 && (
  <div className="toolbar__layer-pins">
    <span className="toolbar__label">Layer Pins</span>
    {textInputs.map((_, i) => {
      const pinnedId = layerFontPins[i] ?? null
      return (
        <div key={i} className="toolbar__layer-pin-row">
          <span className="toolbar__layer-pin-label">Layer {i + 1}</span>
          <select
            className="toolbar__layer-pin-select"
            value={pinnedId ?? ''}
            onChange={(e) => setLayerFontPin(i, e.target.value || null)}
          >
            <option value="">All active</option>
            {activeFonts.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      )
    })}
  </div>
)}
```

### Files to change/create

| File | Change |
|------|--------|
| `src/types/index.ts` | No changes needed |
| `src/store/useStore.ts` | Add `layerFontPins` state + `setLayerFontPin` action + auto-clear in remove/toggle + partialize + pass pins to all `generateAllTiles` calls |
| `src/utils/tileGenerator.ts` | Add 4th param `layerPins` to `generateAllTiles`; update combination logic; update `randomizeTiles` signature (pass pins) |
| `src/components/Toolbar/pages/FontsPage.tsx` | Add Layer Pins UI section |

### Critical rules

- `verbatimModuleSyntax` — `import type` for type-only imports.
- No semicolons, single quotes, 2-space indent.
- `layerFontPins` must be in `partialize`.
- `tiles` must NOT be in `partialize`.
- After any state change to `layerFontPins`, call `generateAllTiles` and update `tiles`.

---

## Dev Agent Record

### File List

- `src/store/useStore.ts` — added `layerFontPins` state, `setLayerFontPin` action, auto-clear in `removeFont`/`toggleFontActive`, `partialize`, pass pins to all `generateAllTiles`/`randomizeTiles` calls, `randomizeSingleTile` respects pins
- `src/utils/tileGenerator.ts` — added 4th param `layerPins` to `generateAllTiles` (per-layer pools, cartesian product), added 5th param `layerPins` to `randomizeTiles`, updated pin fallback logic
- `src/components/Toolbar/pages/FontsPage.tsx` — added Layer Pins section (visible when 2+ text layers), select per layer
- `src/components/Toolbar/Toolbar.css` — added `.toolbar__layer-pins`, `.toolbar__layer-pin-row`, `.toolbar__layer-pin-label`, `.toolbar__layer-pin-select` styles

### Completion Notes

All 7 acceptance criteria satisfied. `layerFontPins` is a `Record<number, string>` in persisted store state. When a font is removed or deactivated, its pin entries are cleared before tile regeneration. The Layer Pins UI only renders when there are 2+ text layers. `generateAllTiles` builds per-layer font pools so pinned layers only contribute their single pinned font to the cartesian product, reducing the tile count accordingly. TypeScript compiles with zero errors.

### Change Log

- 2026-04-03: Implemented story 2-3 — Per-Layer Font Pinning. Added `layerFontPins` state, `setLayerFontPin` action, auto-clear on font remove/deactivate, updated tile generation logic, and Layer Pins UI in FontsPage.
