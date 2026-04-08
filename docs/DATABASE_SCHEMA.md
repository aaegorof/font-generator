# Database Schema Documentation

This document describes the PostgreSQL database schema for the Font Generator application, including tables, relationships, security policies, and usage patterns.

## Overview

The database uses PostgreSQL with Supabase and implements Row Level Security (RLS) to ensure data isolation between users. All user data is automatically scoped to the authenticated user through RLS policies.

## Tables

### user_profiles

Stores user profile settings and preferences. One row per user.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references `auth.users(id)` |
| `settings` | JSONB | UI settings (columns, padding, overlayOpacity, grayscale) |
| `text_inputs` | JSONB | Array of text input configurations |
| `toolbar_open` | BOOLEAN | Whether toolbar is open/closed |
| `layer_font_pins` | JSONB | Pinned fonts for specific layers (Record<number, string>) |
| `disabled_images` | JSONB | Array of disabled image URLs |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |

**Default Values:**

```json
{
  "settings": {
    "columns": 4,
    "padding": 24,
    "overlayOpacity": 0.25,
    "grayscale": false
  },
  "text_inputs": [{
    "id": "input-default-1",
    "text": "de Tribe",
    "fontSize": 56,
    "letterSpacing": 0.02,
    "lineHeight": 1.0,
    "textColor": "#ffffff",
    "textShadow": true,
    "textWrap": true,
    "alignment": "center",
    "verticalAlignment": "center"
  }],
  "toolbar_open": true,
  "layer_font_pins": {},
  "disabled_images": []
}
```

**TypeScript Interface:**

```typescript
interface Settings {
  columns: number
  padding: number
  overlayOpacity: number
  grayscale: boolean
}

interface TextInput {
  id: string
  text: string
  fontSize: number
  letterSpacing: number
  lineHeight: number
  textColor: string
  textShadow: boolean
  textWrap: boolean
  alignment: 'left' | 'center' | 'right'
  verticalAlignment: 'top' | 'center' | 'bottom'
}
```

### user_fonts

Stores user font definitions (Google Fonts, local fonts, uploaded fonts).

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | References `auth.users(id)` |
| `font_def` | JSONB | FontDef object (see below) |
| `storage_path` | TEXT | Path in Supabase Storage (for uploaded fonts only) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes:**
- `idx_user_fonts_user_id` on `user_id`
- `idx_user_fonts_created_at` on `created_at DESC`

**Constraints:**
- `font_def` must contain `id`, `name`, and `source` fields

**TypeScript Interface:**

```typescript
interface FontDef {
  id: string
  name: string
  family: string
  weight: number | string
  style?: string
  source: 'google' | 'local' | 'upload'
  localFile?: string
  uploadUrl?: string
  isActive?: boolean
}
```

### user_images

Stores user uploaded images.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | References `auth.users(id)` |
| `storage_path` | TEXT | Path in Supabase Storage bucket |
| `url` | TEXT | Public URL for the image |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes:**
- `idx_user_images_user_id` on `user_id`
- `idx_user_images_created_at` on `created_at DESC`

**Constraints:**
- `storage_path` cannot be empty
- `url` cannot be empty

### user_favorites

Stores user favorite tiles (saved combinations of images, fonts, and settings).

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | References `auth.users(id)` |
| `favorite_data` | JSONB | FavoriteItem object (see below) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes:**
- `idx_user_favorites_user_id` on `user_id`
- `idx_user_favorites_created_at` on `created_at DESC`

**Constraints:**
- `favorite_data` must contain `tile` and `settings` fields

**TypeScript Interface:**

```typescript
interface TileData {
  id: string
  imageUrl: string
  fontIds: string[]
}

interface FavoriteItem {
  id: string
  tile: TileData
  settings: Settings
  textInputs: TextInput[]
  savedAt: number
}
```

## Row Level Security (RLS)

All tables have RLS enabled with policies that ensure users can only access their own data.

### Policy Pattern

Each table has 4 policies (SELECT, INSERT, UPDATE, DELETE):

**SELECT Policy:**
```sql
USING (auth.uid() = user_id)  -- or id for user_profiles
```

**INSERT Policy:**
```sql
WITH CHECK (auth.uid() = user_id)  -- or id for user_profiles
```

**UPDATE Policy:**
```sql
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

**DELETE Policy:**
```sql
USING (auth.uid() = user_id)
```

### Testing RLS

RLS policies have been tested and verified to:
- ✅ Allow users to view their own data
- ✅ Block users from viewing other users' data
- ✅ Allow users to insert their own data
- ✅ Block users from inserting data for other users
- ✅ Allow users to update their own data
- ✅ Allow users to delete their own data

## Triggers

### handle_updated_at

Automatically updates the `updated_at` timestamp on `user_profiles` table whenever a row is updated.

```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### handle_new_user

Automatically creates a user profile when a new user signs up.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Cascade Deletes

All foreign keys use `ON DELETE CASCADE` to automatically clean up related data when a user is deleted:

- Deleting a user from `auth.users` automatically deletes:
  - Their profile from `user_profiles`
  - All their fonts from `user_fonts`
  - All their images from `user_images`
  - All their favorites from `user_favorites`

## Usage Examples

### Query User Profile

```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single()
```

### Insert Font

```typescript
const { data, error } = await supabase
  .from('user_fonts')
  .insert({
    user_id: userId,
    font_def: {
      id: 'roboto',
      name: 'Roboto',
      family: 'Roboto',
      weight: 400,
      source: 'google',
      isActive: true
    }
  })
```

### Query User Fonts

```typescript
const { data, error } = await supabase
  .from('user_fonts')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

### Update User Settings

```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .update({
    settings: {
      columns: 6,
      padding: 32,
      overlayOpacity: 0.5,
      grayscale: false
    }
  })
  .eq('id', userId)
```

### Delete Font

```typescript
const { error } = await supabase
  .from('user_fonts')
  .delete()
  .eq('id', fontId)
  .eq('user_id', userId)  // RLS ensures this is enforced
```

## Performance Considerations

### Indexes

All tables with `user_id` have indexes for fast lookups:
- `idx_user_fonts_user_id`
- `idx_user_images_user_id`
- `idx_user_favorites_user_id`

All tables have indexes on `created_at DESC` for efficient sorting:
- `idx_user_fonts_created_at`
- `idx_user_images_created_at`
- `idx_user_favorites_created_at`

### JSONB Performance

JSONB columns are used for flexible schema design. For better query performance on JSONB fields, consider adding GIN indexes:

```sql
-- Example: Index for searching font names
CREATE INDEX idx_user_fonts_font_def_name 
ON public.user_fonts USING GIN ((font_def->'name'));
```

## Security Considerations

### Data Isolation

- ✅ RLS enabled on all tables
- ✅ Policies check `auth.uid()` for user isolation
- ✅ Foreign keys with `ON DELETE CASCADE` for automatic cleanup
- ✅ JSONB constraints validate data structure
- ✅ NOT NULL constraints prevent missing required fields

### Best Practices

1. **Always use authenticated context**: RLS policies require `auth.uid()` to work
2. **Validate JSONB structure**: Use constraints to ensure required fields exist
3. **Use indexes**: Query performance depends on proper indexing
4. **Test RLS policies**: Verify data isolation before deploying

## Migration History

| Migration | Description | Date |
|-----------|-------------|------|
| `00001_initial_schema.sql` | Initial schema with tables, RLS, triggers | 2026-04-08 |

## Testing

See `supabase/migrations/test_schema.sql` and `supabase/migrations/test_rls.sql` for comprehensive test scripts.

To run tests:

```bash
# Test schema and basic functionality
docker exec supabase_db_font-generator psql -U postgres -d postgres -f /tmp/test_schema.sql

# Test RLS policies
docker exec supabase_db_font-generator psql -U postgres -d postgres -f /tmp/test_rls.sql
```

## Related Documentation

- [Supabase Setup](./SUPABASE.md)
- [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)
- [Project README](../README.md)
