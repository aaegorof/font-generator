# Supabase Storage Setup

This document describes the storage bucket configuration for the Font Generator application.

## Overview

The application uses two Supabase Storage buckets:
- **user-fonts**: For storing uploaded font files
- **user-images**: For storing uploaded background images

Both buckets are configured with:
- Public read access (anyone can download)
- Authenticated write access (only owners can upload/update/delete)
- Row Level Security (RLS) policies for isolation
- File size limits and MIME type validation

## Buckets Configuration

### user-fonts Bucket

**Purpose**: Store user-uploaded font files

**Settings**:
- **Public**: Yes (read-only)
- **File size limit**: 5 MB
- **Allowed MIME types**:
  - `font/woff2`
  - `font/woff`
  - `font/ttf`
  - `application/x-font-woff`
  - `application/x-font-woff2`
  - `application/x-font-ttf`

**Path structure**: `{user_id}/{font_id}.{ext}`

**Example**: `550e8400-e29b-41d4-a716-446655440000/roboto-bold.woff2`

### user-images Bucket

**Purpose**: Store user-uploaded background images

**Settings**:
- **Public**: Yes (read-only)
- **File size limit**: 10 MB
- **Allowed MIME types**:
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`

**Path structure**: `{user_id}/{image_id}.{ext}`

**Example**: `550e8400-e29b-41d4-a716-446655440000/background-1.jpg`

## Row Level Security Policies

### RLS Policies for user-fonts

1. **Users can upload own fonts** (INSERT)
   - Authenticated users can upload files to their own folder
   - Path must start with their user ID

2. **Users can update own fonts** (UPDATE)
   - Authenticated users can update their own files
   - Path must start with their user ID

3. **Users can delete own fonts** (DELETE)
   - Authenticated users can delete their own files
   - Path must start with their user ID

4. **Public can read fonts** (SELECT)
   - Anyone can read/download font files
   - No authentication required

### RLS Policies for user-images

Same policy structure as user-fonts:
1. **Users can upload own images** (INSERT)
2. **Users can update own images** (UPDATE)
3. **Users can delete own images** (DELETE)
4. **Public can read images** (SELECT)

## Access URLs

### Local Development

**API Base URL**: `http://127.0.0.1:54321/storage/v1`

**Upload URL** (authenticated):
```
POST http://127.0.0.1:54321/storage/v1/object/{bucket}/{path}
Headers:
  Authorization: Bearer {access_token}
  Content-Type: {mime_type}
```

**Public Download URL**:
```
GET http://127.0.0.1:54321/storage/v1/object/public/{bucket}/{path}
```

### Examples

**Upload font**:
```bash
curl -X POST \
  "http://127.0.0.1:54321/storage/v1/object/user-fonts/${USER_ID}/my-font.woff2" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: font/woff2" \
  --data-binary @my-font.woff2
```

**Download font** (public):
```bash
curl "http://127.0.0.1:54321/storage/v1/object/public/user-fonts/${USER_ID}/my-font.woff2" \
  -o downloaded-font.woff2
```

**Upload image**:
```bash
curl -X POST \
  "http://127.0.0.1:54321/storage/v1/object/user-images/${USER_ID}/bg.jpg" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: image/jpeg" \
  --data-binary @bg.jpg
```

**Download image** (public):
```bash
curl "http://127.0.0.1:54321/storage/v1/object/public/user-images/${USER_ID}/bg.jpg" \
  -o downloaded-bg.jpg
```

## Security Features

### User Isolation

RLS policies ensure users can only:
- Upload files to their own folder (`{user_id}/`)
- Update/delete their own files
- Read anyone's files (public read)

**Blocked actions**:
- ❌ Upload to another user's folder
- ❌ Delete another user's files
- ❌ Update another user's files

### File Validation

**File size limits**:
- Fonts: 5 MB maximum
- Images: 10 MB maximum

**MIME type validation**:
- Only allowed file types can be uploaded
- Prevents malicious file uploads

### Path Structure

Files must follow the path structure: `{user_id}/{filename}`

The RLS policies use `storage.foldername(name)[1]` to extract the first folder segment and compare it with `auth.uid()`.

## Testing

Use the test script to verify storage functionality:

```bash
./scripts/test-storage.sh
```

This script tests:
- ✓ Bucket creation
- ✓ File upload (own folder)
- ✓ File download (public)
- ✓ RLS enforcement (blocked access to other user's folder)
- ✓ File size limits
- ✓ MIME type validation

## Troubleshooting

### Error: "new row violates row-level security policy"

**Cause**: Trying to upload to a path that doesn't start with your user ID

**Solution**: Ensure the path is `{your_user_id}/{filename}`

```javascript
// ✓ Correct
const path = `${userId}/my-font.woff2`

// ❌ Wrong
const path = `fonts/my-font.woff2`
const path = `${otherUserId}/my-font.woff2`
```

### Error: "File size exceeds limit"

**Cause**: File is larger than the bucket's size limit

**Solution**: 
- Fonts: Keep files under 5 MB
- Images: Keep files under 10 MB
- Optimize/compress files before upload

### Error: "Invalid MIME type"

**Cause**: File type is not in the allowed list

**Solution**: Only upload allowed file types:
- Fonts: `.woff2`, `.woff`, `.ttf`
- Images: `.jpg`, `.jpeg`, `.png`, `.webp`

### Error: "Bucket not found"

**Cause**: Storage buckets not created

**Solution**: Run the migration:
```bash
docker exec -i supabase_db_font-generator psql -U postgres -d postgres < supabase/migrations/00002_storage_policies.sql
```

## Verification

### Check buckets exist

```bash
docker exec -i supabase_db_font-generator psql -U postgres -d postgres -c \
  "SELECT id, name, public, file_size_limit FROM storage.buckets;"
```

Expected output:
```
     id      |    name     | public | file_size_limit
-------------+-------------+--------+-----------------
 user-fonts  | user-fonts  | t      |         5242880
 user-images | user-images | t      |        10485760
```

### Check policies exist

```bash
docker exec -i supabase_db_font-generator psql -U postgres -d postgres -c \
  "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';"
```

Expected output: 8 policies (4 per bucket)

## Migration

The storage configuration is defined in:
- `supabase/migrations/00002_storage_policies.sql`

To apply the migration:

```bash
# Via Docker
docker exec -i supabase_db_font-generator psql -U postgres -d postgres < supabase/migrations/00002_storage_policies.sql

# Or via Supabase Studio
# 1. Open http://127.0.0.1:54323
# 2. Go to SQL Editor
# 3. Paste contents of 00002_storage_policies.sql
# 4. Execute
```

## Resources

- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage-from-upload)
