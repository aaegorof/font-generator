# Epic 10 Quick Start Guide

## What We're Building

**Feature:** Browse and add fonts from Google Fonts library (1000+ fonts) with search, preview, and dynamic loading.

**Current State:** Users limited to 9 pre-configured Google Fonts hardcoded in `src/utils/fonts.ts`

**Target State:** Users can search, filter, preview, and add any Google Font with any weight to their personal collection.

## User Flow

1. User clicks "Browse Google Fonts" button in Fonts page
2. Modal opens showing list of 1000+ fonts with search and category filters
3. User searches "Roboto", filters by "Sans Serif"
4. User sees preview ("The quick brown fox") for each font
5. User expands "Roboto" and selects "Regular 400" and "Bold 700"
6. User clicks "Add Selected"
7. Fonts appear in font list, saved to Supabase, ready to use

## Implementation Order

```
START HERE
    ↓
10.1 - Google Fonts API Service (fetch font list from API)
    ↓
10.2 - Font Library Data Model (parse variants, create FontDef)
    ↓
    ├──→ 10.3 - Font Picker Modal UI (search, filter, select)
    │
    └──→ 10.4 - Dynamic Font Loading (load only used fonts)
    ↓
10.5 - Supabase Integration (save/load library fonts)
    ↓
10.6 - Integrate Modal into FontsPage (button + handlers)
    ↓
DONE
```

## Key Files to Create

- `src/services/googleFontsApi.ts` — API service (Story 10.1)
- `src/components/FontLibraryModal/index.tsx` — Modal UI (Story 10.3)
- `src/utils/fonts.ts` — Add `FONT_PREVIEW_TEXT` constant (Story 10.2)

## Key Files to Update

- `src/utils/fonts.ts` — Update `setupGoogleFonts()` for dynamic loading (Story 10.4)
- `src/services/fontSync.ts` — Update to handle library fonts (Story 10.5)
- `src/components/Toolbar/pages/FontsPage.tsx` — Add button and modal (Story 10.6)
- `src/App.tsx` — Call updated `setupGoogleFonts()` (Story 10.4)

## Environment Setup

Already configured:
```bash
# .env.local
GOOGLE_FONT_API_KEY=<your-key>
```

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| No schema changes | `FontDef` with `source: 'google'` already supports this |
| Each weight = separate font | User requested explicit control per weight |
| Lazy loading | Only load fonts used in active tiles (performance) |
| Session-level cache | Avoid hitting Google Fonts API rate limits |
| Virtualized list | Handle 1000+ fonts without UI lag |

## Success Criteria

- [ ] User can search and add any Google Font
- [ ] Modal loads in < 2 seconds
- [ ] Font preview renders correctly
- [ ] Fonts sync to Supabase
- [ ] Only active fonts are loaded (check Network tab)
- [ ] No performance issues with 50+ library fonts

## Testing Checklist

**Functional:**
- [ ] Search works (case-insensitive)
- [ ] Category filters work
- [ ] Font preview shows correct font
- [ ] Multiple variants can be selected
- [ ] Fonts save to Supabase
- [ ] Fonts persist after logout/login

**Performance:**
- [ ] Modal doesn't freeze with 1000+ fonts
- [ ] Adding 20 fonts doesn't block UI
- [ ] Only used fonts load (check Network → Filter by `fonts.googleapis.com`)

**Edge Cases:**
- [ ] API failure shows error message
- [ ] Duplicate fonts rejected
- [ ] Unauthenticated users (localStorage fallback)

## Getting Started

1. Read full epic document: `epic-10-google-fonts-library.md`
2. Start with Story 10.1 (Google Fonts API Service)
3. Test each story before moving to next
4. Update this checklist as you complete stories

## Need Help?

- Google Fonts API docs: https://developers.google.com/fonts/docs/developer_api
- Shadcn Dialog: https://ui.shadcn.com/docs/components/dialog
- react-window (virtualization): https://github.com/bvaughn/react-window

---

**Created:** 2026-04-27  
**Status:** Ready for Implementation
