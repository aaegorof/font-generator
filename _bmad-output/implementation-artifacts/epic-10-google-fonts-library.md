# Epic 10 - Google Fonts Library Integration

**Status:** Planning  
**Priority:** High  
**Estimated Effort:** 5-7 days

## Overview

Enable users to browse and add fonts from the full Google Fonts library (1000+ fonts) instead of being limited to 9 pre-configured fonts. Users can search, preview, and add fonts with specific weights to their personal font collection, with fonts dynamically loaded only when actively used.

## Business Value

- **Expanded Creative Options:** Users gain access to 1000+ professionally designed fonts
- **Better User Experience:** Search, filter, and preview fonts before adding them
- **Performance Optimization:** Load only fonts that are actively used in tiles
- **Competitive Advantage:** Matches functionality of professional design tools

## Key Requirements Summary

### Functional Requirements

- FR1: User can open a modal to browse Google Fonts library
- FR2: User can search fonts by name
- FR3: User can filter fonts by category (Serif, Sans Serif, Display, Handwriting, Monospace)
- FR4: User sees preview of each font before adding (preview text: "The quick brown fox")
- FR5: User can select multiple fonts at once
- FR6: Each font weight is treated as a separate font entry
- FR7: Selected fonts are saved to user's Supabase `user_fonts` table
- FR8: Only fonts actively used in tiles are dynamically loaded
- FR9: Library fonts appear in font list alongside uploaded fonts

### Non-Functional Requirements

- NFR1: Google Fonts API calls must be cached to avoid rate limits
- NFR2: Modal must render smoothly with 1000+ fonts (virtualization)
- NFR3: Font loading must not block UI rendering
- NFR4: Preview text must be configurable via constant for future changes

### Technical Constraints

- Use existing `FontDef` type structure (`source: 'google'`)
- Integrate with existing `FontSyncService` for Supabase operations
- Use existing `user_fonts` table schema
- Google Fonts API key available in `.env.local` as `GOOGLE_FONT_API_KEY`
- Follow project's TypeScript, React, and Zustand patterns

## Architecture Decisions

### Data Model

- **No schema changes required** — `FontDef` already supports `source: 'google'`
- Font weight variants stored as separate `FontDef` records (e.g., "Roboto Regular 400", "Roboto Bold 700")
- Library fonts saved to `user_fonts` table (same as uploaded fonts)

### Font Loading Strategy

- **Lazy Loading:** Fonts loaded only when used in active tiles
- **Dynamic Injection:** Generate Google Fonts CSS URL from active library fonts
- **Fallback:** If font fails to load, display error indicator (existing `useFontLoadStatus` hook)

### API Integration

- Google Fonts Web API v1 for font metadata
- Cache API response in memory (session-level)
- Handle API errors gracefully (show cached/default list)

### UI Components

- New `FontLibraryModal` component (shadcn Dialog + Input + ScrollArea)
- Reuse existing font preview pattern from `FontsPage`
- Use virtualization for large lists (react-window or similar)

## Stories

### 10.1 - Google Fonts API Service

**Description:** Create service to fetch and cache Google Fonts metadata from API

**Acceptance Criteria:**

- Create `src/services/googleFontsApi.ts`
- Implement `fetchFontList()` returning array of fonts with metadata (family, category, variants)
- Cache API response in memory for session duration
- Handle API errors with fallback to empty array + console warning
- Read `GOOGLE_FONT_API_KEY` from environment variables
- API endpoint: `https://www.googleapis.com/webfonts/v1/webfonts?key={API_KEY}`
- Response includes: `family`, `category`, `variants` fields

**Technical Notes:**

- Use `fetch` API with async/await
- Cache key: `google-fonts-cache`
- Error handling: catch network errors, invalid API key, rate limits

---

### 10.2 - Font Library Data Model

**Description:** Extend font utilities to support library fonts and expand existing font data structures

**Acceptance Criteria:**

- Add `FONT_PREVIEW_TEXT` constant to `src/utils/fonts.ts` (value: "The quick brown fox")
- Export constant for use in components
- Create type `GoogleFontVariant` with fields: `family`, `variant`, `weight`, `style`
- Create utility function `parseGoogleFontVariants(family, variants)` to convert API variants to `FontDef[]`
- Variant parsing maps strings like "regular", "700", "italic", "700italic" to weight/style values
- Each variant becomes separate `FontDef` with unique `id` (format: `google-{family-slug}-{weight}-{style}`)

**Technical Notes:**

- Variant "regular" = weight 400, style normal
- Variant "italic" = weight 400, style italic
- Variant "700" = weight 700, style normal
- Variant "700italic" = weight 700, style italic

---

### 10.3 - Font Picker Modal UI

**Description:** Create modal UI for browsing and selecting Google Fonts

**Acceptance Criteria:**

- Create `src/components/FontLibraryModal/index.tsx`
- Use shadcn `Dialog` component for modal
- Search input at top (filter fonts by family name, case-insensitive)
- Category filter buttons (All, Serif, Sans Serif, Display, Handwriting, Monospace)
- Virtualized list of fonts (use `react-window` or similar)
- Each font row shows: family name, category badge, preview text in font, variant count
- Clicking font row expands to show all variants (with weight/style labels)
- Checkbox for each variant to select/deselect
- "Add Selected" button at bottom (disabled if no variants selected)
- "Cancel" button to close without changes
- Loading state while fetching from API
- Empty state if API fails or returns no fonts

**Technical Notes:**

- Preview text uses `FONT_PREVIEW_TEXT` constant
- Selected variants stored in local state `Set<string>` (font IDs)
- Close modal on successful add or cancel
- Font families load dynamically via Google Fonts CSS API for preview

---

### 10.4 - Dynamic Font Loading for Library Fonts

**Description:** Load library fonts dynamically based on active tiles

**Acceptance Criteria:**

- Update `src/utils/fonts.ts` function `setupGoogleFonts()`
- Accept parameter `libraryFonts: FontDef[]` (fonts with `source: 'google'`)
- Generate Google Fonts CSS URL from `libraryFonts` list
- URL format: `https://fonts.googleapis.com/css2?family={Family}:wght@{weights}&display=swap`
- Remove old hardcoded `GOOGLE_FONTS` link injection
- Inject dynamic `<link>` tag with ID `google-fonts-library-link`
- Update tag if library fonts change (remove old, inject new)
- Call `setupGoogleFonts()` in `App.tsx` after store loads
- Pass only library fonts that are `isActive: true` and used in current tiles

**Technical Notes:**

- Group fonts by family, then build weight list per family
- URL encoding: spaces → `+`
- Example: `family=Roboto:wght@400;700&family=Open+Sans:wght@300;400`

---

### 10.5 - Supabase Integration for Library Fonts

**Description:** Save and load library fonts from `user_fonts` table

**Acceptance Criteria:**

- Update `FontSyncService.saveFont()` to handle library fonts (skip check for `isDefaultFont`)
- Library fonts save with `storage_path: null` (no file upload needed)
- Ensure `font_def` JSONB includes all `FontDef` fields for library fonts
- Update `FontSyncService.loadFonts()` to correctly restore library fonts
- Library fonts have `source: 'google'` in returned `FontDef`
- Test that library fonts sync across devices for authenticated users
- Update store initialization in `useSupabaseSync` to inject library fonts on load

**Technical Notes:**

- Library fonts are distinguished by `source: 'google'` + no `uploadUrl`
- No storage operations needed (unlike `upload` source fonts)
- Existing `user_fonts` schema supports this without changes

---

### 10.6 - Integrate Font Library Modal into FontsPage

**Description:** Add button to open Font Library Modal and handle font additions

**Acceptance Criteria:**

- Add "Browse Google Fonts" button to `FontsPage` (next to "Upload Font File")
- Button opens `FontLibraryModal`
- On modal confirm, add selected variants to store via `addFont` action
- Call `FontSyncService.saveFont()` for each new library font (if user authenticated)
- Inject library fonts via updated `setupGoogleFonts()` function
- Show success toast/message after fonts added
- Handle errors (API failure, save failure) with user-friendly messages
- New library fonts appear in font list with `source: 'google'` badge

**Technical Notes:**

- Reuse existing `uploading` state pattern for loading indicator
- Call `generateAllTiles` after fonts added to regenerate tiles with new fonts
- Filter duplicates (don't add font if ID already exists in store)

---

## Testing Strategy

**Manual Testing Checklist:**

- Open Font Library Modal and verify 1000+ fonts load
- Search for specific font (e.g., "Roboto") and verify filtering works
- Filter by category and verify correct fonts shown
- Select multiple font variants and add to library
- Verify fonts appear in FontsPage with correct preview
- Toggle font active/inactive and verify dynamic loading
- Create tile with library font and verify it renders correctly
- Logout and login, verify library fonts persist
- Test with unauthenticated user (fonts should be localStorage only)
- Test API failure scenario (disconnect network, verify graceful degradation)

**Performance Testing:**

- Modal renders smoothly with 1000+ fonts (virtualization works)
- Adding 20 fonts doesn't cause UI freeze
- Font loading doesn't block tile generation

## Dependencies

- **External:** Google Fonts Web API v1 (API key required)
- **Internal:** Existing `FontSyncService`, `useStore`, `FontsPage` component

## Risks & Mitigations


| Risk                            | Impact | Mitigation                                        |
| ------------------------------- | ------ | ------------------------------------------------- |
| Google Fonts API rate limits    | High   | Cache API response, implement exponential backoff |
| Large font lists cause UI lag   | Medium | Use virtualization (react-window)                 |
| Font loading delays tile render | Medium | Load fonts asynchronously, show loading indicator |
| API key exposure in client      | Low    | Key is read-only, scoped to domain                |


## Success Metrics

- Users can add library fonts in < 30 seconds
- Modal loads in < 2 seconds on average connection
- Font preview renders correctly in < 1 second
- No performance degradation when 50+ library fonts active

## Future Enhancements (Out of Scope)

- Font popularity rankings from Google Fonts
- Font pairing suggestions
- Variable font support
- Custom font preview text per user
- Offline font caching (Service Worker)

---

**Ready for Implementation:** Yes  
**Blocked By:** None  
**Blocks:** None