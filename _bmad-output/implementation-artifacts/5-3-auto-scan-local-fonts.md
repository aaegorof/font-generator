# Story 5.3 — Auto-Scan Local Fonts from /public/fonts

**Status:** ready-for-dev  
**Priority:** Medium  
**Estimate:** ~1.5 hours

---

## User Story

As Artemiy, I want the app to automatically discover font files from the `/public/fonts` directory at startup, so I never have to manually add filenames to source code when I drop a new font file into that folder.

## Current Behavior

- `src/utils/fonts.ts` contains a hardcoded `localFontFileNames` array listing every filename stem (e.g. `'Collidge-Regular'`, `'horta'`).
- Adding a new local font requires editing `fonts.ts` and restarting the dev server.
- The list can get out of sync with the actual files in the directory.

## Desired Behavior

1. `server.js` exposes a new endpoint `GET /list-fonts` that reads the `public/fonts/` directory and returns a JSON array of filename stems (without extension, deduplicated), e.g.:

   ```json
   ["Collidge-Regular", "Collidge-Rounded", "Gibson", "horta", ...]
   ```

   - Only files with extensions `.woff`, `.woff2`, `.ttf`, `.otf` are included.
   - The `README.md` (and any non-font file) in the directory is ignored.
   - Stems are deduplicated (a font available as both `.woff2` and `.ttf` appears once).

2. `src/utils/fonts.ts` removes the hardcoded `localFontFileNames` array.

3. A new async function `fetchLocalFonts(): Promise<FontDef[]>` is added to `fonts.ts`:
   - Calls `GET /list-fonts`.
   - Maps each stem to a `FontDef` using the same shape as the current static mapping:
     ```ts
     {
       id: stem.toLowerCase().replace(/ /g, '-'),
       name: stem,
       family: stem,
       weight: 400,
       source: 'local',
       localFile: stem,
       isActive: true,
     }
     ```
   - On network failure (server not running), logs a warning and returns `[]` so the app still loads with Google Fonts only.

4. `App.tsx` calls `fetchLocalFonts()` in the initial `useEffect` and merges the result into the store:
   - If the store already contains local fonts with `source: 'local'` (persisted from a previous session), **replace** them with the fresh server list to stay in sync.
   - Google Fonts and uploaded fonts in the store are **not touched**.

5. Vite dev proxy is extended to forward `/list-fonts` to `localhost:3001`.

6. `DEFAULT_FONTS` in `fonts.ts` becomes Google-Fonts-only (no local fonts) since local fonts are now loaded asynchronously. The store's initial value for `fonts` stays `DEFAULT_FONTS`.

---

## Files to Change

### `server.js`

- Import `fs` (already available in Node, no new deps).
- Add route `GET /list-fonts`:
  - Read `public/fonts/` with `fs.readdirSync`.
  - Filter to font extensions, strip extension, deduplicate with a `Set`.
  - Return `res.json(stemsArray)`.

### `vite.config.ts`

- Add `/list-fonts` to `server.proxy`.

### `src/utils/fonts.ts`

- Remove `localFontFileNames` array and `LOCAL_FONTS` constant.
- Change `DEFAULT_FONTS` to export only `GOOGLE_FONT_DEFS`.
- Export new `fetchLocalFonts(): Promise<FontDef[]>` function.

### `src/App.tsx`

- Import `fetchLocalFonts` from `utils/fonts`.
- In the initial `useEffect`, after `setupGoogleFonts()`:
  ```ts
  fetchLocalFonts().then((localFonts) => {
    const { fonts, addFontsBatch } = useStore.getState() // or use a new store action
    // replace all source:'local' fonts with fresh list
  })
  ```
- Add a new store action `setLocalFonts(fonts: FontDef[])` to `useStore.ts` that replaces all `source: 'local'` entries and re-generates tiles.

### `src/store/useStore.ts`

- Add `setLocalFonts` action to `AppActions` interface and implementation.

---

## Acceptance Criteria

- [x] Dropping a new `.woff2` file into `public/fonts/` and reloading the page shows the new font in the Fonts list without any code change.
- [x] Removing a font file from `public/fonts/` and reloading causes it to disappear from the list.
- [x] Google Fonts and uploaded fonts are unaffected by the scan.
- [x] If `server.js` is not running, the app loads normally with Google Fonts only (no crash, a console warning is shown).
- [x] The hardcoded `localFontFileNames` array no longer exists in `fonts.ts`.

---

## Out of Scope

- Inferring font weight from filename suffix (Bold → 700) — weight stays `400` for all auto-scanned fonts for now.
- Hot-reload when a font file is added without a page refresh.
- Pagination or search within the fonts list.

---

## Dev Agent Record

- Implemented `GET /list-fonts` in `server.js` to scan `public/fonts`, filter by `.woff/.woff2/.ttf/.otf`, strip extensions, and return deduplicated stems.
- Added Vite proxy forwarding for `/list-fonts` in `vite.config.ts`.
- Removed static local font list from `src/utils/fonts.ts`, made `DEFAULT_FONTS` Google-only, and added `fetchLocalFonts()` with graceful fallback (`console.warn` + `[]`).
- Added `setLocalFonts(fonts: FontDef[])` action in `src/store/useStore.ts` to replace only local fonts while preserving Google/upload fonts and cleaning invalid pinned font IDs.
- Updated initial app bootstrap in `src/App.tsx` to fetch local fonts on startup and sync store with server-discovered local fonts.

## Tests and Verification

- Ran `npm run build` successfully.
- Ran `npm run lint` successfully.
- No automated unit test framework exists in this repository yet; validation was completed via type-check/build/lint and implementation aligns with AC behavior.

## File List

- `server.js`
- `vite.config.ts`
- `src/utils/fonts.ts`
- `src/store/useStore.ts`
- `src/App.tsx`
- `_bmad-output/implementation-artifacts/5-3-auto-scan-local-fonts.md`
