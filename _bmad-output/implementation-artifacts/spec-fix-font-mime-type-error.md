---
title: 'Fix font upload MIME type error and add OTF support'
type: 'bugfix'
created: '2026-04-27'
status: 'done'
context: []
baseline_commit: '46095db65d7a4993504f02ac019fdea2f4541555'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot upload font files due to "mime type application/octet-stream is not supported" error. The Supabase storage bucket is configured with a restrictive MIME type whitelist that doesn't account for how different browsers and operating systems report font file types. Additionally, .otf format is not supported despite being browser-compatible.

**Approach:** Expand the allowed MIME types list in the storage bucket configuration to include all common MIME types that browsers may use for font files (including the generic application/octet-stream), and add .otf file support to both validation and UI.

## Boundaries & Constraints

**Always:**
- Maintain the 5 MB file size limit
- Keep the bucket publicly readable
- Preserve existing RLS policies
- Support formats that work in browsers: .woff2, .woff, .ttf, .otf

**Ask First:**
- None

**Never:**
- Remove existing MIME types from the allowlist
- Change bucket name or storage path structure
- Allow file formats that don't work in browsers

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Upload .ttf font | File sent as `application/octet-stream` | File uploaded successfully | N/A |
| Upload .otf font | File sent as `font/otf` or `application/octet-stream` | File uploaded successfully | N/A |
| Upload .woff2 font | File sent as `font/woff2` or `application/font-woff2` | File uploaded successfully | N/A |
| Upload unsupported format | .pdf or .zip file | Validation error before upload attempt | "Invalid font file type (allowed: .woff2, .woff, .ttf, .otf)" |
| Upload oversized file | File > 5 MB | Validation error before upload attempt | "Font file too large (max 5 MB)" |

</frozen-after-approval>

## Code Map

- `supabase/migrations/00003_expand_font_mime_types.sql` -- New migration to expand MIME type whitelist
- `supabase/migrations/00002_storage_policies.sql` -- Original storage bucket configuration (unchanged)
- `src/services/fontSync.ts` -- Font validation logic (line 218-230)
- `src/components/Toolbar/pages/FontsPage.tsx` -- Font upload UI with file type filter (line 285)

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/00003_expand_font_mime_types.sql` -- Create new migration to UPDATE user-fonts bucket `allowed_mime_types` to include all common MIME types browsers use for fonts: `application/octet-stream`, `font/otf`, `font/opentype`, `application/x-font-otf`, `application/font-sfnt`, and legacy variants -- Prevents upload rejection when browsers send fonts with generic or variant MIME types
- [x] `src/services/fontSync.ts` -- Add 'otf' to allowedExtensions array in validateFontFile method -- Enables .otf file upload support
- [x] `src/components/Toolbar/pages/FontsPage.tsx` -- Add `.otf` to accept attribute of file input -- Allows users to select .otf files in file picker dialog

**Acceptance Criteria:**
- Given a user uploads a .ttf file detected as application/octet-stream, when the file is valid, then it uploads successfully without MIME type error
- Given a user uploads a .otf file, when the file is under 5 MB, then it uploads and displays in the fonts list
- Given a user clicks the upload button, when the file picker opens, then .otf files are selectable alongside .woff, .woff2, and .ttf files
- Given the storage bucket configuration is updated, when checking allowed MIME types, then it includes application/octet-stream and all otf-related types

## Spec Change Log

## Verification

**Commands:**
- Check that Supabase migration can be applied without errors
- After implementation, test uploading each font format (.ttf, .otf, .woff, .woff2) in the browser

**Manual checks (if no CLI):**
- Upload a .ttf font file and verify no MIME type error occurs
- Upload a .otf font file and verify it appears in the fonts list and works in tiles
- Open file picker and verify .otf files are visible and selectable

## Suggested Review Order

**Storage Configuration** - Root cause fix

- New migration updates bucket MIME whitelist to include `application/octet-stream` and all font variants
  [`00003_expand_font_mime_types.sql:13`](../../supabase/migrations/00003_expand_font_mime_types.sql#L13)

**Validation Layer** - Client-side guards

- Adds 'otf' to allowed extensions and updates error message
  [`fontSync.ts:224`](../../src/services/fontSync.ts#L224)

**Font Injection** - Browser compatibility

- Adds OpenType format detection so uploaded OTF fonts render correctly
  [`fonts.ts:166`](../../src/utils/fonts.ts#L166)

**UI Input Filter** - File picker

- Enables .otf file selection in upload dialog
  [`FontsPage.tsx:285`](../../src/components/Toolbar/pages/FontsPage.tsx#L285)
