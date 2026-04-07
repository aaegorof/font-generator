# Story 5.1 — Physical Image Upload to Disk

**Status:** done  
**Priority:** Medium  
**Estimate:** ~1.5 hours

---

## User Story

As Artemiy, when I upload an image file through the Images panel, I want it to be physically saved to disk (not stored as a blob URL), so that images persist across sessions and are accessible as static assets.

## Current Behavior

- `ImagesPage.tsx` calls `URL.createObjectURL(file)` and passes the resulting blob URL to `addImage()`.
- Blob URLs are ephemeral — they die when the browser tab closes.
- URL-based images (pasted strings) work correctly as-is and must not be changed.

## Desired Behavior

1. When a user picks one or more files in the "Upload Image" input, each file is sent to a new server endpoint `POST /upload-image`.
2. The server saves the file to `public/images/` (directory must be created if it doesn't exist) and returns the served URL `/images/<filename>`.
3. If a file with the same name already exists, the server responds with `409 Conflict` and an `{ error: "File already exists" }` JSON body.
4. On conflict, the UI shows an inline error message (no alert dialogs) next to the upload button for that file and does **not** add the image to the store.
5. On success, the returned URL (`/images/<filename>`) is passed to `addImage()` exactly as URL-based images are handled today.
6. URL-based images (the "Paste image URL" field) continue to work unchanged.
7. Vite dev proxy is extended to forward `/upload-image` and `/images` requests to `localhost:3001`.

---

## Files to Change

### `server.js`
- Add `multer.diskStorage` config pointing to `public/images/` (mirror the existing font upload setup).
- Add file filter accepting `image/jpeg, image/png, image/gif, image/webp, image/svg+xml`.
- Add route `POST /upload-image`:
  - Check if file already exists before saving → return `409 { error: "File already exists" }`.
  - On success return `{ url: "/images/<filename>" }`.
- Serve `/images` as a static directory (for dev server; Vite/prod serves `public/` natively).

### `vite.config.ts`
- Add `/upload-image` and `/images` to the `server.proxy` object.

### `src/components/Toolbar/pages/ImagesPage.tsx`
- Replace `URL.createObjectURL(file)` call with an async `fetch('/upload-image', …)` POST.
- Add local `uploadError` state (string | null); display it below the upload button.
- On 409 response, set the error message; on success, clear it and call `addImage(url)`.
- Use `Promise.allSettled` when multiple files are selected so partial failures are handled per-file (show all errors concatenated, add all successes).

---

## Acceptance Criteria

- [x] Uploading `photo.jpg` saves the file in `public/images/photo.jpg`.
- [x] The image appears in the grid and remains visible after a full page reload.
- [x] Uploading `photo.jpg` a second time shows an inline error and does not duplicate the file.
- [x] Pasting a URL and clicking Add continues to work without any server round-trip.
- [x] No blob URLs are ever stored in the state after this change.

---

## Dev Agent Record

### Implemented

- `server.js`: `public/images` ensured at startup; `multer.diskStorage` for images with duplicate check before write (`409` + `{ error: "File already exists" }`); MIME allowlist per story; `POST /upload-image` returns `{ url: "/images/<filename>" }`; `GET /images/*` via `express.static`; `app` exported for tests; listen only when run as main module.
- `vite.config.ts` + `vitest.config.ts`: proxy `/upload-image` and `/images` to `localhost:3001`; Vitest merged from separate config to keep `tsc -b` clean.
- `ImagesPage.tsx`: `fetch('/upload-image', FormData)` + `Promise.allSettled`; `uploadError` + `role="alert"` below upload button; URL paste path unchanged.
- Tests: `server.test.ts` (supertest: save + 409); `ImagesPage.test.tsx` (mocked fetch: success, 409, partial batch).
- `server.d.ts`: typings for server exports; `public/images/.gitkeep`; `Toolbar.css` `.toolbar__upload-error`.

### Tests

- `npm run test` — all green (5 tests).

### Decisions

- Vitest config split from `vite.config.ts` to avoid `UserConfig` / `test` typing issues with `tsc -b`.

### File List

- `server.js`
- `server.d.ts`
- `server.test.ts`
- `vite.config.ts`
- `vitest.config.ts`
- `tsconfig.node.json`
- `package.json`
- `public/images/.gitkeep`
- `src/components/Toolbar/pages/ImagesPage.tsx`
- `src/components/Toolbar/pages/ImagesPage.test.tsx`
- `src/components/Toolbar/Toolbar.css`
- `src/test/setup.ts`

---

## Out of Scope

- Deleting images from disk (just removes from state, file stays on disk — acceptable for now).
- Image resizing or compression.
- Auth / access control.
