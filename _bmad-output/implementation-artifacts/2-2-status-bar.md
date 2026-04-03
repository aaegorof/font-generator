# Story 2.2 — Top Status Bar

**Status:** review  
**Priority:** Medium  
**Estimate:** ~1.5 hours

---

## User Story

As Artemiy, I want a persistent bar at the top of the main content area showing:
- Total number of generated variations (filtered/total when a filter is active),
- Current active filter label,
- Favorites count as a clickable button that opens the viewer,

so I always have a snapshot of what's loaded and can access favorites from anywhere on the screen.

---

## Desired Behavior

| Situation | Bar shows |
|-----------|-----------|
| No filter, 5 favorites, 120 tiles | `♡ 5   120 variations` |
| Filter active (layer 1: Bebas Neue), 45 total tiles, 13 matching | `♡ 5   13 / 45   Layer 1: Bebas Neue  ×` |
| No favorites | `120 variations` (no heart) |

- The bar is **always visible** at the top of `app__main`.
- Favorites count is a clickable chip that opens `FavoritesViewer` at index 0.
- Filter chip (from Story 2.1) moves INTO the status bar (or the status bar replaces `FilterChip` if 2.1 was already implemented).
- The "×" dismisses the filter (same as FilterChip in Story 2.1).

---

## Acceptance Criteria

- [x] Bar rendered at the top of `app__main`, always visible (even when toolbar is collapsed).
- [x] Shows total tiles count. When font filter is active, shows `filtered / total` format.
- [x] Shows current filter label: "Layer N: FontName" with × to clear.
- [x] Favorites count shown as clickable button; clicking opens FavoritesViewer.
- [x] If favorites count is 0, favorites button is hidden (or shown greyed — your call; hidden is simpler).
- [x] Bar has minimal height (~32px), doesn't obscure the grid.

---

## Implementation Notes

### Component: `src/components/StatusBar/index.tsx` + `StatusBar.css`

```tsx
import { memo } from 'react'
import { useStore } from '../../store/useStore'
import { useFontFilter } from '../../hooks/useFontFilter'
import './StatusBar.css'

export const StatusBar = memo(function StatusBar() {
  const { tiles, favorites, openFavoritesView } = useStore()
  const { filter, clearFilter } = useFontFilter()

  const totalTiles = tiles.length
  const filteredTiles = filter
    ? tiles.filter((t) => t.fontIds[filter.layerIndex] === filter.fontId).length
    : totalTiles

  const { fonts } = useStore()
  const filterFontName = filter ? (fonts.find((f) => f.id === filter.fontId)?.name ?? filter.fontId) : null

  return (
    <div className="status-bar">
      {favorites.length > 0 && (
        <button className="status-bar__favorites" onClick={() => openFavoritesView(0)}>
          <HeartIcon />
          <span>{favorites.length}</span>
        </button>
      )}

      <span className="status-bar__count">
        {filter && filteredTiles !== totalTiles
          ? `${filteredTiles} / ${totalTiles}`
          : `${totalTiles}`}
        {' '}variations
      </span>

      {filter && filterFontName && (
        <span className="status-bar__filter">
          Layer {filter.layerIndex + 1}: <strong>{filterFontName}</strong>
          <button className="status-bar__filter-clear" onClick={clearFilter} title="Clear filter">
            ×
          </button>
        </span>
      )}
    </div>
  )
})
```

### CSS — `src/components/StatusBar/StatusBar.css`

```css
.status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 32px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;
  color: var(--muted, #888);
  flex-shrink: 0;
}

.status-bar__favorites {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #e05;
  cursor: pointer;
  font-size: 11px;
  padding: 0;
}
.status-bar__favorites:hover {
  color: #ff2266;
}

.status-bar__count {
  color: rgba(255, 255, 255, 0.5);
}

.status-bar__filter {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
}
.status-bar__filter strong {
  color: #fff;
}

.status-bar__filter-clear {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  margin-left: 2px;
}
.status-bar__filter-clear:hover {
  color: #fff;
}
```

### App.tsx change

```tsx
import { StatusBar } from './components/StatusBar'

// in render:
<main className="app__main">
  <StatusBar />
  <Grid />
</main>
```

**Note:** If Story 2.1 was already implemented and added a separate `<FilterChip />`, remove it and incorporate into `StatusBar` instead — don't duplicate the filter chip.

### Dependency on Story 2.1

This story uses `useFontFilter` hook. If Story 2.1 has not been implemented yet, implement `useFontFilter.ts` as specified in Story 2.1 first, then build the StatusBar on top of it. Alternatively implement them together.

### HeartIcon SVG

Reuse the same HeartIcon SVG already used in `Toolbar/index.tsx` — extract to a shared `src/components/icons.tsx` if convenient, or just inline it.

### App layout note

`app__main` currently has no flex direction set — ensure it's `display: flex; flex-direction: column` so StatusBar stacks above Grid naturally.

Check `src/App.css` for `.app__main` definition.

### Critical rules

- `verbatimModuleSyntax` — `import type` for FontFilter if imported from useFontFilter.
- No semicolons, single quotes, 2-space indent.
- Memo on StatusBar since it subscribes to tiles and favorites (may update often).

---

## Dev Agent Record

### Completion Notes

Implemented `StatusBar` component (2026-04-02):

- Created `src/components/StatusBar/index.tsx` — memoized component reading `tiles`, `favorites`, `openFavoritesView`, `fonts` from store and `filter`/`clearFilter` from `useFontFilter`.
- Created `src/components/StatusBar/StatusBar.css` — 32px bar with `position: sticky; top: 0; z-index: 10` so it stays visible as the grid scrolls inside `app__main`.
- Replaced `<FilterChip />` in `App.tsx` with `<StatusBar />` — the filter chip display is now unified inside the status bar (per story note about absorbing 2.1's FilterChip).
- Added `flex flex-col` to `.app__main` in `App.css` so StatusBar stacks above Grid in a column layout.
- Inlined a `HeartIcon` SVG in the StatusBar component; favorites button is hidden when count is 0.
- TypeScript check passes cleanly (`tsc --noEmit` exits 0).

### File List

- `src/components/StatusBar/index.tsx` (new)
- `src/components/StatusBar/StatusBar.css` (new)
- `src/App.tsx` (modified — replaced FilterChip import/usage with StatusBar)
- `src/App.css` (modified — added flex flex-col to .app__main)

### Change Log

- 2026-04-02: Story 2.2 implemented — StatusBar component created, FilterChip replaced in App layout.
