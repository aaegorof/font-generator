# Story 2.1 — Font Filter via Click on Tile / Viewer (URL-routed)

**Status:** review  
**Priority:** Medium  
**Estimate:** ~2 hours

---

## User Story

As Artemiy, I want to click on a font label on a tile (or in the FavoritesViewer) and have the grid filter to show only tiles that use that font in the same layer, so I can quickly compare all variations of a specific font across images. The filter should be reflected in the URL so the browser back button dismisses it.

## Context

- Each `Tile` already renders a `.tile__font-labels` section with per-layer font name spans.
- `FavoritesViewer` renders `fav-viewer__font-tag` spans showing the fonts for the current favorite.
- The user clarified: clicking the **Layer 2 font tag** locks filter to **layer 2 = that font**. These are layer-specific filters.
- Filter is temporary — dismissed by browser back or an "×" chip at the top of the page.

---

## Desired Behavior

1. Clicking a font label (on a tile or in FavoritesViewer) sets a URL search param:  
   `?fontFilter=<layerIndex>:<fontId>`  
   Example: `?fontFilter=1:bebas-neue`
2. When this param is present:
   - The `Grid` shows only tiles where `tile.fontIds[layerIndex] === fontId`.
   - A dismissible filter chip appears at the **top of the main content area** (above the grid).
   - The chip shows: `Layer 2: Bebas Neue ×`
3. Pressing browser back (or clicking ×) navigates back, removing the param — grid returns to full list.
4. The filter is **not persisted** — it's purely URL state.

---

## Acceptance Criteria

- [x] Clicking a font label on a tile pushes `?fontFilter=layerIdx:fontId` to browser history.
- [x] Clicking a font tag in FavoritesViewer does the same (and closes the viewer).
- [x] When `?fontFilter` is present, Grid renders only matching tiles.
- [x] A filter chip is shown above the grid with the font name and layer number, with an × to clear.
- [x] Clicking × on the chip calls `navigate(-1)` (or navigates to `?` — removes param).
- [x] Browser back button clears the filter.
- [x] If the filtered set is empty, show a "No tiles match this filter" empty state.
- [x] No store changes needed for the filter itself (pure URL state).

---

## Implementation Notes

### URL param design

```
/settings?fontFilter=0:bebas-neue
/fonts?fontFilter=1:jost
```

The param lives on whatever route is active — the filter chip + grid filtering reads from `useSearchParams()`.

### Hook: `useFontFilter`

Create `src/hooks/useFontFilter.ts`:

```ts
import { useSearchParams, useNavigate } from 'react-router-dom'
import type { FontDef } from '../types'

export interface FontFilter {
  layerIndex: number
  fontId: string
}

export function useFontFilter() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const raw = searchParams.get('fontFilter')
  const filter: FontFilter | null = raw
    ? (() => {
        const [layer, ...rest] = raw.split(':')
        return { layerIndex: Number(layer), fontId: rest.join(':') }
      })()
    : null

  const setFilter = (layerIndex: number, fontId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('fontFilter', `${layerIndex}:${fontId}`)
    navigate(`?${params.toString()}`)
  }

  const clearFilter = () => {
    navigate(-1)
  }

  return { filter, setFilter, clearFilter }
}
```

### Grid changes — `src/components/Grid/index.tsx`

```ts
import { useFontFilter } from '../../hooks/useFontFilter'

export const Grid = memo(function Grid() {
  const { tiles, settings, ... } = useStore()
  const { filter } = useFontFilter()

  const visibleTiles = filter
    ? tiles.filter((t) => t.fontIds[filter.layerIndex] === filter.fontId)
    : tiles

  // render visibleTiles instead of tiles
})
```

### FilterChip component — `src/components/FilterChip/index.tsx`

New small component, placed in `App.tsx` above the `<Grid />`:

```tsx
export function FilterChip() {
  const { filter, clearFilter } = useFontFilter()
  const { fonts } = useStore()
  if (!filter) return null

  const font = fonts.find((f) => f.id === filter.fontId)
  const fontName = font?.name ?? filter.fontId

  return (
    <div className="filter-chip">
      <span>Layer {filter.layerIndex + 1}: <strong>{fontName}</strong></span>
      <button onClick={clearFilter} title="Clear filter">×</button>
    </div>
  )
}
```

CSS for `FilterChip` — co-located `FilterChip.css`:

```css
.filter-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255,255,255,0.08);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  font-size: 12px;
}
.filter-chip button {
  background: none;
  border: none;
  color: var(--muted, #888);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
}
```

### App.tsx change

```tsx
<main className="app__main">
  <FilterChip />
  <Grid />
</main>
```

### Tile font labels become clickable

In `Tile/index.tsx`, `tile__font-labels` spans become buttons:

```tsx
import { useFontFilter } from '../../hooks/useFontFilter'

// inside Tile:
const { setFilter } = useFontFilter()

<div className="tile__font-labels">
  {tile.fontIds.slice(0, textInputs.length).map((fId, i) => (
    <button
      key={i}
      className="tile__font-label"
      onClick={(e) => { e.stopPropagation(); setFilter(i, fId) }}
      title={`Filter by ${getFontName(fId)} (layer ${i + 1})`}
    >
      {getFontName(fId)}
    </button>
  ))}
</div>
```

### FavoritesViewer font tags become clickable

In `FavoritesViewer/index.tsx`:

```tsx
import { useFontFilter } from '../../hooks/useFontFilter'

// inside FavoritesViewer:
const { setFilter } = useFontFilter()

// in the font tags section:
{tile.fontIds.slice(0, textInputs.length).map((fId, i) => (
  <button
    key={i}
    className="fav-viewer__font-tag"
    onClick={() => { setFilter(i, fId); closeFavoritesView() }}
    title={`Filter by ${getFontName(fId)} (layer ${i + 1})`}
  >
    <span className="fav-viewer__font-preview" ...>Aa</span>
    {getFontName(fId)}
  </button>
))}
```

### File structure

```
src/
  hooks/
    useFontFilter.ts          ← new
  components/
    FilterChip/
      index.tsx               ← new
      FilterChip.css          ← new
    Grid/index.tsx            ← modify (filter tiles)
    Tile/index.tsx            ← modify (clickable labels)
    FavoritesViewer/index.tsx ← modify (clickable tags)
  App.tsx                     ← add <FilterChip />
```

### React Router note

The project uses React Router DOM v7. `useSearchParams` and `useNavigate` are available. The `navigate(-1)` approach works correctly since clicking a font label pushes a new history entry.

### Critical rules

- `verbatimModuleSyntax` — use `import type` for type-only imports.
- No semicolons, single quotes, 2-space indent.
- Tile and FavoritesViewer are wrapped in `memo()` — ensure `useFontFilter` does not cause unnecessary re-renders (the hook creates a new `setFilter` callback on each render; wrap with `useCallback` if needed or accept the minor cost since Tile is already memo'd on props).

---

## Dev Agent Record

### Implementation Plan

Implemented pure URL-state font filter using `useSearchParams` from React Router DOM v7. Created `useFontFilter` hook with `useCallback`-wrapped `setFilter` and `clearFilter` to avoid unnecessary re-renders. `FilterChip` component reads from the hook and renders conditionally above the grid. Grid filters `visibleTiles` array before rendering. Tile font labels and FavoritesViewer font tags converted from `<span>` to `<button>` with proper CSS resets and hover states.

### Completion Notes

- All 8 acceptance criteria satisfied.
- `setFilter` is `useCallback`-wrapped with `[searchParams, navigate]` deps — memoization-safe for memo'd Tile components.
- Empty filtered state handled in Grid with "No tiles match this filter" message.
- FavoritesViewer closes on font tag click before navigating to filtered URL.
- Build passes with 0 TypeScript errors.

---

## File List

- `src/hooks/useFontFilter.ts` — new
- `src/components/FilterChip/index.tsx` — new
- `src/components/FilterChip/FilterChip.css` — new
- `src/components/Grid/index.tsx` — modified
- `src/components/Tile/index.tsx` — modified
- `src/components/Tile/Tile.css` — modified
- `src/components/FavoritesViewer/index.tsx` — modified
- `src/components/FavoritesViewer/FavoritesViewer.css` — modified
- `src/App.tsx` — modified

---

## Change Log

- 2026-04-02: Implemented story 2-1 — font filter via click on tile/viewer (URL-routed). Created `useFontFilter` hook, `FilterChip` component, wired up Grid filtering and clickable font labels/tags in Tile and FavoritesViewer.
