-- =====================================================
-- Storage Buckets and RLS Policies
-- =====================================================
-- Creates storage buckets for user fonts and images with
-- Row Level Security policies for secure file access.
--
-- Migration: 00002_storage_policies.sql
-- Created: 2026-04-08
-- Story: 6.4 - Setup Storage Buckets
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Create user-fonts bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-fonts',
  'user-fonts',
  true,
  5242880, -- 5 MB
  ARRAY[
    'font/woff2',
    'font/woff',
    'font/ttf',
    'application/x-font-woff',
    'application/x-font-woff2',
    'application/x-font-ttf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create user-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR user-fonts BUCKET
-- =====================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can upload own fonts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own fonts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own fonts" ON storage.objects;
DROP POLICY IF EXISTS "Public can read fonts" ON storage.objects;

-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload own fonts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-fonts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can update their own files
CREATE POLICY "Users can update own fonts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-fonts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-fonts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can delete their own files
CREATE POLICY "Users can delete own fonts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-fonts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Public read access
CREATE POLICY "Public can read fonts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-fonts');

-- =====================================================
-- RLS POLICIES FOR user-images BUCKET
-- =====================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read images" ON storage.objects;

-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can update their own files
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can delete their own files
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Public read access
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-images');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify buckets exist
DO $$
BEGIN
  RAISE NOTICE 'Storage buckets created:';
  RAISE NOTICE '  - user-fonts (5 MB limit, public read)';
  RAISE NOTICE '  - user-images (10 MB limit, public read)';
END $$;

-- Verify policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'objects' 
    AND schemaname = 'storage';
  
  RAISE NOTICE 'Total storage policies: %', policy_count;
  
  IF policy_count >= 8 THEN
    RAISE NOTICE '✓ All storage policies created successfully';
  ELSE
    RAISE WARNING '⚠ Expected at least 8 policies, found %', policy_count;
  END IF;
END $$;
