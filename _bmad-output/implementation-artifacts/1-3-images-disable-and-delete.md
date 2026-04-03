# Story 1.3 — Images: Separate Disable and Delete Actions

**Status:** ready-for-dev  
**Priority:** Small / Quick win  
**Estimate:** ~1 hour

---

## User Story

As Artemiy, I want to temporarily disable an image (hide it from tile generation without losing it) separately from permanently deleting it, so I can experiment with subsets of my images without having to re-add them.

## Current Behavior

- Each image thumbnail in `ImagesPage.tsx` has a single "×" button that calls `removeImage(url)` — permanently deletes it from the store.
- No way to temporarily exclude an image.

## Desired Behavior

- Each image thumbnail has **two actions**:
  1. **Disable/Enable toggle** (eye icon): hides the image from tile generation but keeps it in the list.
  2. **Delete** (trash/× icon): permanently removes it from the list.
- Disabled images are shown in the grid with a visual indicator (dimmed + eye-slash overlay).
- When generating tiles, disabled images are excluded (same as if they weren't in the list).
- Disabled images are **persisted** across sessions.

---

## Acceptance Criteria

- [ ] Each image thumb has a toggle (eye) and a delete (×) button.
- [ ] Clicking toggle disables/enables the image; the thumb shows a dimmed + eye-slash visual.
- [ ] Disabled images do NOT appear in generated tiles.
- [ ] Delete permanently removes the image.
- [ ] Disabled state is persisted in localStorage.
- [ ] Existing `removeImage` store action unchanged in signature.

---

## Implementation Notes

### Architecture approach

The `images` array in the store is currently `string[]` (just URLs). The cleanest non-breaking approach is to **add a separate `disabledImages: Set<string>` (persisted as `string[]`)** rather than changing the `images` type — this avoids touching `tileGenerator.ts`'s external API and keeps image URLs as the primary key.

### Store changes — `src/store/useStore.ts`

**State additions:**

```ts
interface AppState {
  // ... existing ...
  disabledImages: string[]   // persisted
}
```

**Action additions:**

```ts
interface AppActions {
  // ... existing ...
  toggleImageDisabled: (url: string) => void
}
```

**Implementation:**

```ts
// Initial state
disabledImages: [],

// Action
toggleImageDisabled: (url) => {
  set((state) => ({
    disabledImages: state.disabledImages.includes(url)
      ? state.disabledImages.filter((u) => u !== url)
      : [...state.disabledImages, url],
  }))
  // Regenerate tiles since active image set changed
  const { fonts, images, textInputs, disabledImages } = get()
  const activeImages = images.filter((img) => !disabledImages.includes(img))
  set({ tiles: generateAllTiles(fonts, activeImages, textInputs.length) })
},
```

**Partialize** — add `disabledImages` to the persisted fields:

```ts
partialize: (state) => ({
  settings: state.settings,
  textInputs: state.textInputs,
  fonts: state.fonts,
  images: state.images,
  disabledImages: state.disabledImages,   // ADD THIS
  favorites: state.favorites,
  toolbarOpen: state.toolbarOpen,
}),
```

### Tile generation — update all callers

Every place that calls `generateAllTiles(fonts, images, ...)` must filter out disabled images first. Affected locations:

| Location | Change |
|----------|--------|
| `addTextInput` | `const activeImages = images.filter(img => !get().disabledImages.includes(img))` |
| `removeTextInput` | same |
| `addFont` / `removeFont` / `toggleFontActive` | same |
| `addImage` | same (new image is enabled by default) |
| `removeImage` | same |
| `toggleImageDisabled` | already done above |
| `generateTiles` | same |
| `randomize` | same |
| `randomizeSingleTile` | same |
| `importAllSettings` | same |

**Helper to DRY this up — add inside the store factory:**

```ts
const activeImages = () => {
  const { images, disabledImages } = get()
  return images.filter((img) => !disabledImages.includes(img))
}
```

Then replace `images` with `activeImages()` in every `generateAllTiles` call.

### ImagesPage changes — `src/components/Toolbar/pages/ImagesPage.tsx`

```tsx
const { ..., disabledImages, toggleImageDisabled } = useStore()

// In the image thumb:
<div key={idx} className={`toolbar__image-thumb ${disabledImages.includes(img) ? 'toolbar__image-thumb--disabled' : ''}`}>
  <img src={img} alt="" loading="lazy" />
  <div className="toolbar__image-actions">
    <button
      className="toolbar__image-toggle"
      onClick={() => toggleImageDisabled(img)}
      title={disabledImages.includes(img) ? 'Enable' : 'Disable'}
    >
      {disabledImages.includes(img) ? <EyeOffIcon /> : <EyeIcon />}
    </button>
    <button
      className="toolbar__image-remove"
      onClick={() => useStore.getState().removeImage(img)}
      title="Delete"
    >
      ×
    </button>
  </div>
</div>
```

### CSS additions (Toolbar.css or ImagesPage.css)

```css
.toolbar__image-thumb--disabled img {
  opacity: 0.35;
  filter: grayscale(0.5);
}
.toolbar__image-actions {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 2px;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.toolbar__image-thumb:hover .toolbar__image-actions {
  opacity: 1;
}
.toolbar__image-toggle,
.toolbar__image-remove {
  background: rgba(0,0,0,0.6);
  border: none;
  border-radius: 3px;
  color: #fff;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 11px;
  line-height: 1;
}
```

### SVG icons to add

Add `EyeIcon` and `EyeOffIcon` inline SVGs in `ImagesPage.tsx`. Standard 14×14 eye icons.

### Critical rules

- `verbatimModuleSyntax` — do not mix type and value imports.
- No semicolons, single quotes, 2-space indent.
- `disabledImages` must be in `partialize` list.
- `tiles` must NOT be in `partialize` list (already excluded — don't change that).
