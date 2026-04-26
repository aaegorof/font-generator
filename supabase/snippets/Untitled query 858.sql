-- =====================================================
-- Expand Font MIME Types for Storage Bucket
-- =====================================================
-- Adds additional MIME types to user-fonts bucket to handle
-- browser/OS variations in font file type detection.
--
-- Migration: 00003_expand_font_mime_types.sql
-- Created: 2026-04-27
-- Issue: Fix "mime type application/octet-stream is not supported" error
-- =====================================================

-- Update user-fonts bucket to include additional MIME types
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  -- Standard font MIME types
  'font/woff2',
  'font/woff',
  'font/ttf',
  'font/otf',
  'font/opentype',
  
  -- Legacy/alternate font MIME types
  'application/x-font-woff',
  'application/x-font-woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/font-woff',
  'application/font-woff2',
  'application/font-sfnt',
  
  -- Generic binary type (browsers often use this when MIME detection fails)
  'application/octet-stream'
]
WHERE id = 'user-fonts';

-- Verify the update
DO $$
DECLARE
  mime_count INTEGER;
BEGIN
  SELECT array_length(allowed_mime_types, 1) INTO mime_count
  FROM storage.buckets
  WHERE id = 'user-fonts';
  
  RAISE NOTICE 'user-fonts bucket now allows % MIME types', mime_count;
  
  IF mime_count >= 14 THEN
    RAISE NOTICE '✓ Font MIME types expanded successfully';
  ELSE
    RAISE WARNING '⚠ Expected at least 14 MIME types, found %', mime_count;
  END IF;
END $$;
