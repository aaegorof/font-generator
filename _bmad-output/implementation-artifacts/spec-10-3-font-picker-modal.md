---
title: 'Font Picker Modal UI'
type: 'feature'
created: '2026-04-28'
status: 'in-review'
baseline_commit: '47fae3a0f089c911b525732ce5f162f4526c4e7d'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users need a way to browse and select fonts from the Google Fonts library (1000+ fonts) to add to their personal font collection, but there's currently no UI for this functionality.

**Approach:** Create a modal component that displays the Google Fonts library with search, category filters, and variant selection. Users can preview fonts before adding them, select specific weight/style variants, and add multiple fonts at once to their collection.

## Boundaries & Constraints

**Always:**
- Use existing `ConfirmDialog` pattern for modal styling (custom Tailwind-based, not shadcn)
- Use `FONT_PREVIEW_TEXT` constant from `src/utils/fonts.ts` for all font previews
- Preview text must render in the actual font using Google Fonts CSS API
- Selected fonts must be converted to `FontDef` format using `parseGoogleFontVariants()`
- Support search (case-insensitive family name filter) and category filtering
- Modal must be reusable and not directly coupled to FontsPage

**Ask First:**
- If API returns more than 2000 fonts (potential performance issue without virtualization)
- If font loading for previews fails consistently (may need fallback strategy)
- If adding virtualization library is blocked (required for smooth scrolling with 1000+ items)

**Never:**
- Don't save fonts to Supabase or store in this component (parent handles persistence)
- Don't load all 1000+ font families at once (only load visible fonts for preview)
- Don't duplicate the API fetching logic (use existing `googleFontsApi.ts`)
- Don't modify the `FontDef` type or parsing logic (already implemented in task 10.2)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open modal | User clicks trigger button | Modal opens, fetches font list from API, shows loading state | Show loading spinner during fetch |
| API success | API returns 1000+ fonts | Display virtualized list of fonts with search/filter UI | N/A |
| API failure | API returns empty array or errors | Show empty state message: "Unable to load fonts. Please try again later." | Console warning already handled in API service |
| Search fonts | User types "roboto" | Filter list to show only families containing "roboto" (case-insensitive) | Show "No fonts found" if no matches |
| Filter by category | User clicks "Serif" | Show only serif fonts | Show count of filtered fonts |
| Expand font | User clicks font row | Expand to show all available variants (regular, bold, italic, etc.) | N/A |
| Select variants | User checks/unchecks variant checkboxes | Update selection state, enable/disable "Add Selected" button | Button disabled when 0 selected |
| Add fonts | User clicks "Add Selected" with 3 variants selected | Call `onConfirm` callback with array of 3 FontDef objects, close modal | N/A |
| Cancel | User clicks "Cancel" or backdrop | Close modal without calling onConfirm | N/A |
| Preview rendering | Font family in visible viewport | Load font via Google Fonts CSS and render preview text | Show fallback sans-serif if font fails to load |

</frozen-after-approval>

## Code Map

- `src/services/googleFontsApi.ts` -- API service for fetching Google Fonts metadata (already implemented in 10.1)
- `src/utils/fonts.ts` -- Contains `parseGoogleFontVariants()` and `FONT_PREVIEW_TEXT` constant (already implemented in 10.2)
- `src/components/ConfirmDialog.tsx` -- Reference pattern for custom modal styling with Tailwind
- `src/types/index.ts` -- `FontDef` type definition
- `src/components/FontLibraryModal/index.tsx` -- NEW: Main modal component to create
- `src/components/FontLibraryModal/FontPreview.tsx` -- NEW: Individual font preview component with lazy loading

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- Add `react-window` and `@types/react-window` dependencies for virtualization -- Needed for smooth scrolling with 1000+ fonts without performance degradation
- [x] `src/components/FontLibraryModal/FontPreview.tsx` -- Create component to render individual font family with preview text, category badge, variant count, and expandable variant list -- Isolates font loading logic and provides clean API for parent
- [x] `src/components/FontLibraryModal/index.tsx` -- Create main modal component with search input, category filter buttons, virtualized list using react-window, selection state management, and "Add Selected" / "Cancel" buttons -- Primary deliverable for this story
- [x] `src/components/FontLibraryModal/index.tsx` -- Implement Google Fonts CSS link injection for preview fonts based on visible families in viewport -- Enables actual font preview rendering without preloading all 1000+ fonts

**Acceptance Criteria:**
- Given modal is opened, when API fetch completes successfully, then display virtualized list of 1000+ fonts with smooth scrolling
- Given user types in search input, when text changes, then filter fonts by family name (case-insensitive)
- Given user clicks category filter button, when category changes, then show only fonts matching selected category
- Given user clicks a font row, when row expands, then display all available variants with weight/style labels
- Given user selects 3 variants from different fonts, when "Add Selected" is clicked, then call onConfirm with array of 3 FontDef objects parsed via parseGoogleFontVariants()
- Given no variants are selected, when viewing modal, then "Add Selected" button is disabled
- Given user clicks "Cancel" or backdrop, when modal closes, then do not call onConfirm callback
- Given font family is in visible viewport, when scrolling, then dynamically load font via Google Fonts CSS and render preview in actual font
- Given API returns empty array, when modal loads, then display empty state message

## Spec Change Log

## Design Notes

### Virtualization Strategy
Using `react-window`'s `VariableSizeList` instead of `FixedSizeList` because font rows have two states:
- Collapsed: ~80px height (family name + preview)
- Expanded: dynamic height (adds variant checkboxes)

The parent component tracks which families are expanded and provides heights to the list via `itemSize` callback.

### Font Loading Strategy
Only inject Google Fonts CSS for families currently visible in viewport (plus 10 above/below). This prevents loading 1000+ fonts on modal open:

```typescript
// Generate CSS URL for visible fonts only
const visibleFamilies = getFamiliesInViewport(scrollTop, listHeight)
const cssUrl = buildGoogleFontsCssUrl(visibleFamilies)
injectOrUpdateFontLink('google-fonts-preview', cssUrl)
```

Update the link element when user scrolls to load newly visible fonts.

### Component Interface
```typescript
interface FontLibraryModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (selectedFonts: FontDef[]) => void
}
```

Parent (FontsPage) is responsible for:
- Opening/closing modal (state management)
- Handling confirmed selections (add to store, save to Supabase, regenerate tiles)
- Error handling for save operations

Modal is responsible for:
- Fetching fonts from API
- UI state (search, filters, selection, expansion)
- Converting selections to FontDef format
- Font preview rendering

### Categories
Google Fonts API returns these categories:
- serif
- sans-serif
- display
- handwriting
- monospace

UI shows: All (default), Serif, Sans Serif, Display, Handwriting, Monospace

### Preview Text
Use `FONT_PREVIEW_TEXT` constant from `src/utils/fonts.ts` (value: "The quick brown fox") for consistency across app.

## Verification

**Commands:**
- `npm run lint` -- expected: no new ESLint errors
- `npm run build` -- expected: TypeScript compilation succeeds
- `npm test` -- expected: all tests pass (if tests exist)

**Manual checks (if no CLI):**
1. Open app in browser, open FontsPage
2. Click "Browse Google Fonts" button to open modal
3. Verify modal displays loading state then 1000+ fonts
4. Test search by typing "roboto" - verify filtering works
5. Test category filters - click each and verify correct fonts shown
6. Click a font row to expand - verify variants appear with checkboxes
7. Select 3 variants from different fonts, click "Add Selected" - verify modal closes and fonts appear in FontsPage
8. Reopen modal, click "Cancel" - verify modal closes without adding fonts
9. Verify font previews render in actual font (not fallback sans-serif)
10. Scroll through large list - verify smooth performance with no lag
