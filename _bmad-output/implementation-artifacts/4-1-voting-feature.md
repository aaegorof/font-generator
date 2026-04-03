# Story 4.1 — Voting Feature: Tournament-style Pairwise Voting

**Status:** ready-for-dev  
**Priority:** Large / New feature with backend  
**Estimate:** ~2 days

---

## User Story

As Artemiy, I want to select favorites, generate a sharable link, send it to people, and have them vote on which of the images they prefer (pairwise), so I can programmatically find the best design from the set.

## Voting Principle (Tournament Bracket)

The algorithm is **pairwise comparison** with Elo-style or win-count ranking:

1. User selects a subset of favorites to put "up for vote".
2. A voting session is created with a unique ID. The set of image exports is stored.
3. The shareable link is: `https://yourdomain.com/vote/{sessionId}`
4. Each voter:
   - Sees two randomly chosen images side by side.
   - Picks the preferred one (left or right).
   - This is recorded. Another pair is shown.
   - This continues until the voter has seen all pairs (or a configured limit).
5. After all voters are done (or the session owner closes voting):
   - Images are ranked by total wins.
   - The owner sees a results dashboard with win counts / percentages.

---

## Architecture Decision

### Backend options considered

| Option | Pros | Cons |
|--------|------|------|
| **Extend existing Express server** | Already in the project, no new infra | Not hosted, only works locally unless deployed |
| **Supabase** | Free tier, hosted, real-time, REST + JS SDK, row-level security | External dependency |
| **Firebase** | Real-time, easy hosting | Heavier SDK, Google ecosystem |
| **Upstash (Redis KV)** | Cheap, fast, serverless-friendly | No relational queries |

### Recommended: Supabase

**Reason:** The project already has an Express server for font uploads. For the voting feature, we need a hosted database that works when the app is shared via link (localhost Express won't work for remote voters). Supabase provides:
- Hosted PostgreSQL
- REST API auto-generated from schema
- JS client (`@supabase/supabase-js`)
- Free tier is sufficient for this use case

If you want to keep everything in Express: extend `server.js` and deploy to Render/Railway/Fly.io.

---

## Data Model (Supabase / PostgreSQL)

### Table: `voting_sessions`

```sql
create table voting_sessions (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null,          -- random token stored in localStorage
  title       text,
  images      jsonb not null,         -- array of { id, url, dataUrl? }
  status      text default 'open',    -- 'open' | 'closed'
  created_at  timestamptz default now()
);
```

### Table: `votes`

```sql
create table votes (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references voting_sessions(id) on delete cascade,
  voter_id      text not null,        -- random token stored in voter's localStorage
  winner_id     text not null,        -- image id that won
  loser_id      text not null,        -- image id that lost
  created_at    timestamptz default now()
);
```

### Indexes

```sql
create index on votes(session_id);
create index on votes(voter_id, session_id);
```

---

## Frontend Feature Areas

### 1. Session creation (in FavoritesViewer)

Add "Start Vote" button in FavoritesViewer. Opens a modal:
- Checkboxes to select which favorites to include.
- "Create voting link" button.
- On click: exports each selected favorite as a data URL (using existing `exportTileAsPng`), creates a session in Supabase, returns the link.
- Link is displayed with a "Copy" button.

### 2. Voting page: `/vote/:sessionId`

New React route. Public page — works without the toolbar/app.

**Voter flow:**
1. Load session from Supabase.
2. Generate a sequence of pairs from the images (all N*(N-1)/2 unique pairs, shuffled).
3. Show two images side by side with "→" and "←" pick buttons.
4. Record each vote to Supabase `votes` table (with voter's ID from localStorage).
5. After all pairs: show "Done! Your votes have been submitted." + winner preview.

**Skip / resume:** Store progress in localStorage so voter can resume if they close the tab.

### 3. Results page: `/vote/:sessionId/results`

Accessible to anyone with the link. Shows:
- Images ranked by win count.
- Win percentage per image.
- Total votes cast.
- "Top pick" highlighted.

The session owner (identified by `owner_id` in localStorage) additionally sees:
- "Close voting" button.
- Option to export results.

---

## Implementation Plan

### Phase 1 — Backend setup (Supabase)

1. Create Supabase project.
2. Run SQL above to create tables.
3. Enable anonymous access (RLS policies): 
   - `voting_sessions`: anyone can `SELECT` by id; only matching `owner_id` can `UPDATE`.
   - `votes`: anyone can `INSERT`; `SELECT` aggregated only.
4. Add Supabase env vars to `.env`:
   ```
   VITE_SUPABASE_URL=https://xyz.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Phase 2 — Supabase client

```bash
npm install @supabase/supabase-js
```

Create `src/utils/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)
```

### Phase 3 — Session service

Create `src/utils/votingService.ts`:

```ts
import { supabase } from './supabase'

export interface VotingImage {
  id: string
  url: string          // data URL of the exported tile
  label?: string       // optional label (font names)
}

export interface VotingSession {
  id: string
  owner_id: string
  title?: string
  images: VotingImage[]
  status: 'open' | 'closed'
}

// Generate voter/owner ID (stored in localStorage)
export function getOrCreateOwnerId(): string {
  const key = 'font-generator-owner-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function getOrCreateVoterId(): string {
  const key = 'font-generator-voter-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export async function createSession(
  images: VotingImage[],
  title?: string,
): Promise<string> {
  const owner_id = getOrCreateOwnerId()
  const { data, error } = await supabase
    .from('voting_sessions')
    .insert({ owner_id, title, images, status: 'open' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function getSession(id: string): Promise<VotingSession | null> {
  const { data, error } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as VotingSession
}

export async function castVote(
  sessionId: string,
  winnerId: string,
  loserId: string,
): Promise<void> {
  const voter_id = getOrCreateVoterId()
  const { error } = await supabase
    .from('votes')
    .insert({ session_id: sessionId, voter_id, winner_id: winnerId, loser_id: loserId })
  if (error) throw error
}

export async function getResults(
  sessionId: string,
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('votes')
    .select('winner_id')
    .eq('session_id', sessionId)
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.winner_id] = (counts[row.winner_id] ?? 0) + 1
  }
  return counts
}
```

### Phase 4 — UI components

#### `StartVoteModal` component

New component triggered from FavoritesViewer "Start Vote" button:
- `src/components/StartVoteModal/index.tsx`
- Shows favorite thumbnails as checkboxes.
- On submit: exports selected favorites as data URLs, calls `createSession`, shows the share link.
- Export uses the existing `exportTileAsPng` function; for the modal, render each tile off-screen and capture it.

**Challenge:** capturing data URLs for each favorite requires rendering them into DOM. Use a hidden `div` with the tile structure, call `toPng` from `html-to-image`, then remove. This mirrors the existing `exportTileAsPng` utility.

#### `VotingPage` component

Route: `/vote/:sessionId`  
File: `src/pages/VotingPage/index.tsx`

```tsx
// Pseudo-code structure:
// 1. Load session from Supabase
// 2. Generate pairs: all unique pairs shuffled (Fisher-Yates)
// 3. Current pair index stored in useState
// 4. On pick: castVote(sessionId, winner, loser), advance to next pair
// 5. When pairs exhausted: show "Thank you" screen
```

Pair generation:
```ts
function generatePairs(images: VotingImage[]): [VotingImage, VotingImage][] {
  const pairs: [VotingImage, VotingImage][] = []
  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      pairs.push([images[i], images[j]])
    }
  }
  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}
```

#### `ResultsPage` component

Route: `/vote/:sessionId/results`  
File: `src/pages/ResultsPage/index.tsx`

Fetches `getResults(sessionId)` and `getSession(sessionId)`, displays ranked images.

### Phase 5 — Routing

Update `src/main.tsx` (or App router):

```tsx
<Routes>
  <Route path="/vote/:sessionId" element={<VotingPage />} />
  <Route path="/vote/:sessionId/results" element={<ResultsPage />} />
  <Route path="*" element={<App />} />   {/* existing app */}
</Routes>
```

The voting/results pages are standalone — they don't need the toolbar or font generation UI.

---

## Files to create/change

| File | Change |
|------|--------|
| `src/utils/supabase.ts` | New: Supabase client |
| `src/utils/votingService.ts` | New: CRUD operations for sessions/votes |
| `src/components/StartVoteModal/index.tsx` | New: modal in FavoritesViewer |
| `src/pages/VotingPage/index.tsx` | New: public voting page |
| `src/pages/ResultsPage/index.tsx` | New: results dashboard |
| `src/components/FavoritesViewer/index.tsx` | Add "Start Vote" button |
| `src/main.tsx` | Add new routes |
| `.env` (not committed) | Add Supabase credentials |

---

## Open Questions / Future Enhancements

1. **Image storage:** Exporting as data URLs and storing in Supabase JSONB works for small sets (< ~10 images at reasonable quality). For larger sets, consider storing images in Supabase Storage instead and referencing by URL. Supabase Storage free tier has 1GB.

2. **Multiple voters:** The current model aggregates all votes. A future "per-voter results" dashboard could show how different people voted.

3. **Notification:** Currently the owner has to manually check results. A simple polling approach (refetch every 30s) is sufficient.

4. **Session expiry:** Add `expires_at` column if desired to auto-close voting after N days.

5. **Embedding preview weights:** Supabase has a 1MB JSONB limit per row. With 10 images at ~50KB each as data URLs = 500KB — fine. Beyond 20 images, use Supabase Storage.

---

## Critical rules

- `verbatimModuleSyntax` — `import type` for all type-only imports from `votingService.ts`.
- No semicolons, single quotes, 2-space indent.
- The voting/results pages do NOT use `useStore` — they are standalone pages.
- Supabase credentials must be in `.env` (Vite exposes `VITE_` prefix), never hardcoded.
- Do not commit `.env` file.
