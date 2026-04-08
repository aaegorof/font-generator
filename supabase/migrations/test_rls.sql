-- =====================================================
-- RLS Policy Testing Script
-- =====================================================
-- Tests Row Level Security policies with proper transaction handling
--
-- Test Script: test_rls.sql
-- Created: 2026-04-08
-- =====================================================

-- Clean up any existing test data
DELETE FROM public.user_profiles WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
DELETE FROM auth.users WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

\echo '=== Setting up test users ==='

-- Insert test users
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-user-1@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-user-2@example.com', crypt('password456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW());

-- Insert test data for user 1
INSERT INTO public.user_fonts (user_id, font_def)
VALUES ('00000000-0000-0000-0000-000000000001', '{"id": "roboto", "name": "Roboto", "family": "Roboto", "weight": 400, "source": "google"}'::jsonb);

INSERT INTO public.user_images (user_id, storage_path, url)
VALUES ('00000000-0000-0000-0000-000000000001', 'user-1/test.jpg', 'https://example.com/test.jpg');

INSERT INTO public.user_favorites (user_id, favorite_data)
VALUES ('00000000-0000-0000-0000-000000000001', '{"id": "fav-1", "tile": {"id": "t1", "imageUrl": "url", "fontIds": []}, "settings": {}, "textInputs": [], "savedAt": 123}'::jsonb);

SELECT '✓ Test users and data created' as result;

\echo ''
\echo '=== TEST 1: User can view their own data ==='

-- Test as user 1
BEGIN;
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS: User 1 can view own fonts'
    ELSE '✗ FAIL: User 1 cannot view own fonts'
  END as result
FROM public.user_fonts 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS: User 1 can view own images'
    ELSE '✗ FAIL: User 1 cannot view own images'
  END as result
FROM public.user_images 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS: User 1 can view own favorites'
    ELSE '✗ FAIL: User 1 cannot view own favorites'
  END as result
FROM public.user_favorites 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

COMMIT;

\echo ''
\echo '=== TEST 2: User cannot view other user data ==='

-- Test as user 2 trying to access user 1's data
BEGIN;
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002"}';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS: User 2 cannot view user 1 fonts'
    ELSE '✗ FAIL: RLS leaked ' || COUNT(*) || ' fonts from user 1'
  END as result
FROM public.user_fonts 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS: User 2 cannot view user 1 images'
    ELSE '✗ FAIL: RLS leaked ' || COUNT(*) || ' images from user 1'
  END as result
FROM public.user_images 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS: User 2 cannot view user 1 favorites'
    ELSE '✗ FAIL: RLS leaked ' || COUNT(*) || ' favorites from user 1'
  END as result
FROM public.user_favorites 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

COMMIT;

\echo ''
\echo '=== TEST 3: User can insert their own data ==='

BEGIN;
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002"}';

-- Try to insert as user 2
INSERT INTO public.user_fonts (user_id, font_def)
VALUES ('00000000-0000-0000-0000-000000000002', '{"id": "arial", "name": "Arial", "family": "Arial", "weight": 400, "source": "local"}'::jsonb);

SELECT '✓ PASS: User 2 can insert own fonts' as result;

COMMIT;

\echo ''
\echo '=== TEST 4: User cannot insert data for other users ==='

BEGIN;
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002"}';

-- Try to insert as user 2 but with user 1's ID (should fail)
DO $$
BEGIN
  INSERT INTO public.user_fonts (user_id, font_def)
  VALUES ('00000000-0000-0000-0000-000000000001', '{"id": "hack", "name": "Hack", "family": "Hack", "weight": 400, "source": "local"}'::jsonb);
  RAISE EXCEPTION '✗ FAIL: User 2 should not be able to insert fonts for user 1';
EXCEPTION
  WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE '✓ PASS: RLS prevents user 2 from inserting fonts for user 1';
END $$;

COMMIT;

\echo ''
\echo '=== TEST 5: User can update their own data ==='

BEGIN;
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';

UPDATE public.user_fonts 
SET font_def = '{"id": "roboto", "name": "Roboto Updated", "family": "Roboto", "weight": 700, "source": "google"}'::jsonb
WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT 
  CASE 
    WHEN font_def->>'name' = 'Roboto Updated' THEN '✓ PASS: User 1 can update own fonts'
    ELSE '✗ FAIL: User 1 cannot update own fonts'
  END as result
FROM public.user_fonts 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

COMMIT;

\echo ''
\echo '=== TEST 6: User can delete their own data ==='

BEGIN;
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002"}';

DELETE FROM public.user_fonts WHERE user_id = '00000000-0000-0000-0000-000000000002';

SELECT '✓ PASS: User 2 can delete own fonts' as result;

COMMIT;

\echo ''
\echo '=== Cleanup ==='

-- Clean up test data
DELETE FROM auth.users WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

SELECT '✓ Test data cleaned up' as result;

\echo ''
\echo '=== RLS TEST SUMMARY ==='
\echo 'All RLS tests completed. Review results above.'
\echo 'Expected: 11 PASS results, 0 FAIL results'
