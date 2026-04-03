# Story 1.2 — Fonts Page: Search Filter + Active-First Sort

**Status:** ready-for-dev  
**Priority:** Small / Quick win  
**Estimate:** ~45 min

---

## User Story

As Artemiy, I want to quickly find a font by name and always see active fonts at the top of the list, so I can efficiently manage a growing list of fonts.

## Current Behavior

- `FontsPage.tsx` renders all fonts in the order they appear in `store.fonts`.
- No search or filtering.
- Active and inactive fonts are interleaved in original order.

## Desired Behavior

1. **Search input** at the top of the panel — filters the displayed list by font name (case-insensitive, contains match).
2. **Active fonts grouped at top** — within each group (active / inactive) fonts preserve their original order.
3. **Clear button** on the search input when non-empty.
4. When search is active, inactive fonts that do not match are hidden (but active fonts that don't match are also hidden).
5. The search state is **local component state** — not persisted, cleared on unmount.

---

## Acceptance Criteria

- [ ] A text input appears at the top of the Fonts panel.
- [ ] Typing filters the visible font list to only fonts whose `name` includes the query (case-insensitive).
- [ ] Active fonts (those where `font.isActive !== false`) are always rendered above inactive ones.
- [ ] Within each group the original store order is preserved.
- [ ] An "×" clear button appears inside the input when the query is non-empty; clicking it clears the filter.
- [ ] Font toggle / remove actions still work correctly on filtered items.
- [ ] No store changes required — this is purely presentational in `FontsPage`.

---

## Implementation Notes

### File to change

`src/components/Toolbar/pages/FontsPage.tsx`

### Logic

```ts
// Inside FontsPage component:
const [query, setQuery] = useState('')

const filteredFonts = useMemo(() => {
  const active = fonts.filter((f) => f.isActive !== false)
  const inactive = fonts.filter((f) => f.isActive === false)
  const sorted = [...active, ...inactive]
  if (!query.trim()) return sorted
  const q = query.toLowerCase()
  return sorted.filter((f) => f.name.toLowerCase().includes(q))
}, [fonts, query])
```

### JSX sketch

```tsx
<div className="toolbar__font-search">
  <input
    className="toolbar__font-search-input"
    type="text"
    placeholder="Search fonts…"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />
  {query && (
    <button className="toolbar__font-search-clear" onClick={() => setQuery('')}>
      ×
    </button>
  )}
</div>

<div className="toolbar__font-list">
  {filteredFonts.map((font) => (
    // existing font item JSX unchanged
  ))}
</div>
```

### CSS

Add styles to `Toolbar.css` (or a co-located CSS file if FontsPage gets one):

```css
.toolbar__font-search {
  position: relative;
  margin-bottom: 8px;
}
.toolbar__font-search-input {
  width: 100%;
  padding: 6px 28px 6px 8px;
  background: var(--bg-input, #1e1e1e);
  border: 1px solid var(--border, #333);
  border-radius: 4px;
  color: inherit;
  font-size: 12px;
}
.toolbar__font-search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--muted, #777);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
```

### Import to add

```ts
import { useMemo, useState } from 'react'
```

(Currently the file already imports `useCallback, useEffect, useRef, useState` — just add `useMemo` if not present.)
