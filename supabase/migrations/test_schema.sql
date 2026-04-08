-- =====================================================
-- Schema Testing Script
-- =====================================================
-- Tests database schema, RLS policies, triggers, and constraints
--
-- Test Script: test_schema.sql
-- Created: 2026-04-08
-- =====================================================

-- Clean up any existing test data
DELETE FROM public.user_profiles WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
DELETE FROM auth.users WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- =====================================================
-- TEST 1: Create test users and verify auto-profile creation
-- =====================================================

\echo '=== TEST 1: Auto-create user profile on signup ==='

-- Insert test users (this should trigger auto-creation of profiles)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-user-1@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-user-2@example.com', crypt('password456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW());

-- Verify profiles were auto-created
SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✓ PASS: Auto-created 2 user profiles'
    ELSE '✗ FAIL: Expected 2 profiles, got ' || COUNT(*)
  END as result
FROM public.user_profiles 
WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- =====================================================
-- TEST 2: Insert test data for user 1
-- =====================================================

\echo '=== TEST 2: Insert test data ==='

-- Update user profile
UPDATE public.user_profiles 
SET settings = '{"columns": 6, "padding": 32, "overlayOpacity": 0.5, "grayscale": true}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Insert test font
INSERT INTO public.user_fonts (user_id, font_def, storage_path)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 
   '{"id": "roboto", "name": "Roboto", "family": "Roboto", "weight": 400, "source": "google", "isActive": true}'::jsonb,
   NULL);

-- Insert test image
INSERT INTO public.user_images (user_id, storage_path, url)
VALUES 
  ('00000000-0000-0000-0000-000000000001',
   'user-1/test-image.jpg',
   'https://example.com/test-image.jpg');

-- Insert test favorite
INSERT INTO public.user_favorites (user_id, favorite_data)
VALUES 
  ('00000000-0000-0000-0000-000000000001',
   '{"id": "fav-1", "tile": {"id": "tile-1", "imageUrl": "https://example.com/test.jpg", "fontIds": ["roboto"]}, "settings": {"columns": 4}, "textInputs": [], "savedAt": 1234567890}'::jsonb);

SELECT '✓ PASS: Inserted test data for user 1' as result;

-- =====================================================
-- TEST 3: Verify updated_at trigger
-- =====================================================

\echo '=== TEST 3: Verify updated_at trigger ==='

-- Get initial updated_at
SELECT updated_at INTO TEMP TABLE temp_updated_at 
FROM public.user_profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Wait a moment
SELECT pg_sleep(0.1);

-- Update profile
UPDATE public.user_profiles 
SET toolbar_open = false
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify updated_at changed
SELECT 
  CASE 
    WHEN p.updated_at > t.updated_at THEN '✓ PASS: updated_at trigger works'
    ELSE '✗ FAIL: updated_at did not update'
  END as result
FROM public.user_profiles p, temp_updated_at t
WHERE p.id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- TEST 4: Verify JSONB constraints
-- =====================================================

\echo '=== TEST 4: Verify JSONB constraints ==='

-- Try to insert font without required fields (should fail)
DO $$
BEGIN
  INSERT INTO public.user_fonts (user_id, font_def)
  VALUES ('00000000-0000-0000-0000-000000000001', '{}'::jsonb);
  RAISE EXCEPTION '✗ FAIL: Should not allow empty font_def';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✓ PASS: JSONB constraints prevent invalid data';
END $$;

-- Try to insert favorite without required fields (should fail)
DO $$
BEGIN
  INSERT INTO public.user_favorites (user_id, favorite_data)
  VALUES ('00000000-0000-0000-0000-000000000001', '{"id": "test"}'::jsonb);
  RAISE EXCEPTION '✗ FAIL: Should not allow incomplete favorite_data';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✓ PASS: Favorite constraints work';
END $$;

-- =====================================================
-- TEST 5: Verify RLS policies (data isolation)
-- =====================================================

\echo '=== TEST 5: Verify RLS policies ==='

-- Set auth context to user 2
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002"}';

-- Try to read user 1's fonts (should return 0 rows)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS: RLS blocks access to other user fonts'
    ELSE '✗ FAIL: RLS leaked ' || COUNT(*) || ' fonts from user 1'
  END as result
FROM public.user_fonts 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Try to read user 1's images (should return 0 rows)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS: RLS blocks access to other user images'
    ELSE '✗ FAIL: RLS leaked ' || COUNT(*) || ' images from user 1'
  END as result
FROM public.user_images 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Try to read user 1's favorites (should return 0 rows)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS: RLS blocks access to other user favorites'
    ELSE '✗ FAIL: RLS leaked ' || COUNT(*) || ' favorites from user 1'
  END as result
FROM public.user_favorites 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Reset role
RESET role;

-- =====================================================
-- TEST 6: Verify CASCADE delete
-- =====================================================

\echo '=== TEST 6: Verify CASCADE delete ==='

-- Count related records before delete
SELECT 
  (SELECT COUNT(*) FROM public.user_fonts WHERE user_id = '00000000-0000-0000-0000-000000000001') as fonts_before,
  (SELECT COUNT(*) FROM public.user_images WHERE user_id = '00000000-0000-0000-0000-000000000001') as images_before,
  (SELECT COUNT(*) FROM public.user_favorites WHERE user_id = '00000000-0000-0000-0000-000000000001') as favorites_before,
  (SELECT COUNT(*) FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-000000000001') as profiles_before;

-- Delete user 1
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify all related records were deleted
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM public.user_fonts WHERE user_id = '00000000-0000-0000-0000-000000000001') = 0
     AND (SELECT COUNT(*) FROM public.user_images WHERE user_id = '00000000-0000-0000-0000-000000000001') = 0
     AND (SELECT COUNT(*) FROM public.user_favorites WHERE user_id = '00000000-0000-0000-0000-000000000001') = 0
     AND (SELECT COUNT(*) FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-000000000001') = 0
    THEN '✓ PASS: CASCADE delete removed all related records'
    ELSE '✗ FAIL: CASCADE delete did not clean up properly'
  END as result;

-- =====================================================
-- CLEANUP
-- =====================================================

\echo '=== Cleanup test data ==='

DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000002';

SELECT '✓ Test data cleaned up' as result;

-- =====================================================
-- SUMMARY
-- =====================================================

\echo ''
\echo '=== TEST SUMMARY ==='
\echo 'All tests completed. Review results above.'
\echo 'Expected: 8 PASS results, 0 FAIL results'
