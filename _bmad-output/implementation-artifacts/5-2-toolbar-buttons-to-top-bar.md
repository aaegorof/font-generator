# Story 5.2 — Move Action Buttons to Top Bar

**Status:** ready-for-dev  
**Priority:** Low-Medium  
**Estimate:** ~1 hour

---

## User Story

As Artemiy, I want Randomize, Reset, Export, and Import to live in the top bar (StatusBar area) on the right side, so the left sidebar stays focused on settings and the primary actions are always visible regardless of toolbar state.

## Current Behavior

- Randomize, Reset, Export, Import, and the Favorites button all live in `Toolbar/index.tsx` inside `toolbar__actions`.
- The Favorites button also appears in `StatusBar/index.tsx` (duplicate).
- All action buttons are hidden when the sidebar is collapsed.

## Desired Behavior

1. **Randomize, Reset, Export, Import** are removed from `Toolbar/index.tsx` (`toolbar__actions` block) and rendered on the **right side of `StatusBar`**.
2. The **Favorites button** is removed from `Toolbar/index.tsx` — it stays only in `StatusBar` (already there).
3. `toolbar__actions` div is removed entirely from the Toolbar if it becomes empty.
4. The StatusBar layout becomes: `[favorites?] [count + filter info]` on the left · `[Randomize] [Reset] [Export] [Import]` on the right.
5. All button logic (handlers, refs, state) moves with the buttons — the hidden `<input type="file">` for import stays in `StatusBar` too.
6. Icons stay the same (ShuffleIcon, RefreshIcon, ExportIcon, ImportIcon) — move them to the StatusBar file or a shared `icons.tsx` utility if it keeps things cleaner.

---

## Files to Change

### `src/components/Toolbar/index.tsx`

- Remove the `toolbar__actions` block entirely (Randomize, Reset, Export, Import, Favorites buttons + hidden import input).
- Remove imports no longer needed: `useFontFilter`, `useCallback`, `useRef`, `useState`, `exportAllSettings`, `parseSettingsFile` — only if they're not used elsewhere in the file.
- Remove icon components that move to StatusBar (ShuffleIcon, RefreshIcon, ExportIcon, ImportIcon, HeartIcon).

### `src/components/StatusBar/index.tsx`

- Add the four action buttons on the right: Randomize, Reset, Export, Import.
- Bring over the corresponding handler logic (`handleReset`, `handleExport`, `handleImport`) and state (`exporting`).
- Add the hidden `<input ref={importRef} type="file" accept=".json" …>` for import.
- Import needed hooks: `useStore`, `useFontFilter`, `exportAllSettings`, `parseSettingsFile`.
- Layout: wrap existing left content in a `<div className="status-bar__left">` and add `<div className="status-bar__right">` for the buttons.

### `src/components/StatusBar/StatusBar.css`

- Add flex layout to `.status-bar` with `justify-content: space-between; align-items: center`.
- Style `.status-bar__right` as a flex row with a small gap.
- Keep existing button styles or reuse the `toolbar__action-btn` class (whichever is tidier).

### `src/components/Toolbar/Toolbar.css`

- Remove styles for `.toolbar__actions` and `.toolbar__action-btn` if they are no longer used anywhere.

---

## Acceptance Criteria

- [ ] Randomize, Reset, Export, Import appear on the right side of the top bar.
- [ ] The buttons are visible regardless of whether the left sidebar is open or closed.
- [ ] Favorites button appears only once (in the top bar), not in the sidebar.
- [ ] Export downloads the settings JSON as before.
- [ ] Import reads a JSON file and restores settings as before.
- [ ] The left sidebar has no orphaned empty `toolbar__actions` container.

---

## Out of Scope

- Responsive / mobile layout.
- Changing button styles or icons.
