# Database Types - AI Agent Rules

## Auto-Generated Types

This project uses **auto-generated TypeScript types** from Supabase database schema.

### Key Files

- `src/types/database.types.ts` - Auto-generated (DO NOT EDIT MANUALLY)
- `src/types/supabase.ts` - Re-exports generated types + Session, User
- `src/lib/supabase.ts` - Typed Supabase client

### Regenerate Types

After any database schema changes:

```bash
npm run db:types
```

### Usage in Code

```typescript
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

// Reading
type UserProfile = Tables<'user_profiles'>

// Inserting
type NewProfile = TablesInsert<'user_profiles'>

// Updating
type ProfileUpdate = TablesUpdate<'user_profiles'>
```

### Available Tables

- `user_profiles` - User settings and UI state
- `user_images` - Uploaded images
- `user_fonts` - Uploaded fonts
- `user_favorites` - Saved favorites

### Important Rules

1. ✅ ALWAYS use generated types for database operations
2. ✅ ALWAYS regenerate types after schema changes
3. ✅ ALWAYS commit `database.types.ts` after regeneration
4. ❌ NEVER edit `database.types.ts` manually
5. ❌ NEVER use `any` for database types

### Example

```typescript
// ✅ Good - Typed
const { data } = await supabase.from('user_profiles').select('*').eq('id', userId)

// ❌ Bad - Untyped
const { data } = await supabase.from('user_profiles' as any).select('*')
```

### Documentation

- Full guide: `docs/DATABASE_TYPES.md`
- Quick start: `docs/DATABASE_TYPES_QUICKSTART.md`
