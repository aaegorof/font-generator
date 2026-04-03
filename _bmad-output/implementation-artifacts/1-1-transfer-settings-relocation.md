# Story 1.1 — Transfer Settings Relocation

**Status:** done  
**Priority:** Small / Quick win  
**Estimate:** ~30 min

---

## User Story

As Artemiy, I want the Import/Export (Transfer Settings) buttons to live visually close to the Reset button, so that all "global actions" are in one place and I don't have to scroll inside the Settings panel to access them.

## Current Behavior

- **Reset** and **Randomize** buttons are in `Toolbar/index.tsx` — in the `toolbar__actions` div, always visible at the top of the toolbar.
- **Transfer Settings** (Export + Import buttons) are at the very bottom of `SettingsPage.tsx` inside the scrollable panel body.
- They are visually and functionally far from each other.

## Desired Behavior

- Remove the `toolbar__section--transfer` block from `SettingsPage.tsx`.
- Add Export and Import icon-buttons to the `toolbar__actions` area in `Toolbar/index.tsx`, placed adjacent to (right of) the Reset button.
- Buttons should be compact (icon-only or icon + short label), matching the existing `toolbar__action-btn` style.
- The hidden `<input type="file">` for import must live in `Toolbar` (or a new thin wrapper component).

---

## Acceptance Criteria

- [x] Export and Import buttons are visible in `toolbar__actions` alongside Reset / Randomize.
- [x] Clicking Export triggers `exportAllSettings(...)` with current store state.
- [x] Clicking Import opens the file picker; selecting a `.json` file calls `importAllSettings(data)`.
- [x] The Transfer Settings section is gone from `SettingsPage`.
- [x] No regressions to Export/Import functionality.
- [x] Visual style matches existing `toolbar__action-btn--outline` buttons.

---

## Implementation Notes

### Files to change

| File | Change |
|------|--------|
| `src/components/Toolbar/index.tsx` | Add Export + Import buttons into `toolbar__actions` div; add hidden file input ref; wire up handlers |
| `src/components/Toolbar/pages/SettingsPage.tsx` | Remove the entire `toolbar__section--transfer` block and its two icon components (`ExportIcon`, `ImportIcon`), plus the related `useState(exporting)` and `handleExportSettings` / `handleImportSettings` callbacks |

### Key imports / utilities

```ts
import { exportAllSettings, parseSettingsFile } from '../../utils/exportSettings'
// Already imported in SettingsPage — move these imports to Toolbar/index.tsx
```

### State needed in Toolbar

The Toolbar needs to read `settings, textInputs, fonts, images, favorites, toolbarOpen` from the store for export, and call `importAllSettings` for import. These are already accessible via `useStore()`.

```ts
const { ..., settings, textInputs, fonts, images, favorites, importAllSettings } = useStore()
```

### Button layout sketch

```
[♡ 3] [⇌ Randomize] [↺ Reset] [↓ Export] [↑ Import]
```

Use `ExportIcon` and `ImportIcon` SVGs (currently defined in `SettingsPage.tsx` — move them to `Toolbar/index.tsx` or a shared location).

### Important: no semicolons, single quotes, 2-space indent (Prettier config)
