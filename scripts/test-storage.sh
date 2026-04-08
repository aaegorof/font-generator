#!/bin/bash

# =====================================================
# Storage Test Script
# =====================================================
# Tests Supabase Storage buckets and RLS policies
#
# Usage: ./scripts/test-storage.sh
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="http://127.0.0.1:54321"
DB_CONTAINER="supabase_db_font-generator"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Storage Bucket Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# =====================================================
# Test 1: Verify Buckets Exist
# =====================================================

echo -e "${YELLOW}Test 1: Verify buckets exist${NC}"

BUCKET_COUNT=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -c \
  "SELECT COUNT(*) FROM storage.buckets WHERE id IN ('user-fonts', 'user-images');")

BUCKET_COUNT=$(echo "$BUCKET_COUNT" | tr -d ' ')

if [ "$BUCKET_COUNT" -eq 2 ]; then
  echo -e "${GREEN}✓ Both buckets exist${NC}"
else
  echo -e "${RED}✗ Expected 2 buckets, found $BUCKET_COUNT${NC}"
  exit 1
fi

# Check bucket configuration
echo -e "${BLUE}Bucket details:${NC}"
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c \
  "SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id IN ('user-fonts', 'user-images') ORDER BY id;"

echo ""

# =====================================================
# Test 2: Verify RLS Policies
# =====================================================

echo -e "${YELLOW}Test 2: Verify RLS policies${NC}"

POLICY_COUNT=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -c \
  "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';")

POLICY_COUNT=$(echo "$POLICY_COUNT" | tr -d ' ')

if [ "$POLICY_COUNT" -ge 8 ]; then
  echo -e "${GREEN}✓ All storage policies exist (found $POLICY_COUNT)${NC}"
else
  echo -e "${RED}✗ Expected at least 8 policies, found $POLICY_COUNT${NC}"
  exit 1
fi

# List policies
echo -e "${BLUE}Storage policies:${NC}"
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c \
  "SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' ORDER BY policyname;"

echo ""

# =====================================================
# Test 3: Check RLS is Enabled
# =====================================================

echo -e "${YELLOW}Test 3: Verify RLS is enabled on storage.objects${NC}"

RLS_ENABLED=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -c \
  "SELECT relrowsecurity FROM pg_class WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');")

RLS_ENABLED=$(echo "$RLS_ENABLED" | tr -d ' ')

if [ "$RLS_ENABLED" = "t" ]; then
  echo -e "${GREEN}✓ RLS is enabled on storage.objects${NC}"
else
  echo -e "${RED}✗ RLS is not enabled on storage.objects${NC}"
  exit 1
fi

echo ""

# =====================================================
# Test 4: Verify Bucket Settings
# =====================================================

echo -e "${YELLOW}Test 4: Verify bucket settings${NC}"

# Check user-fonts settings
FONTS_SIZE=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -c \
  "SELECT file_size_limit FROM storage.buckets WHERE id = 'user-fonts';")
FONTS_SIZE=$(echo "$FONTS_SIZE" | tr -d ' ')

if [ "$FONTS_SIZE" -eq 5242880 ]; then
  echo -e "${GREEN}✓ user-fonts size limit: 5 MB${NC}"
else
  echo -e "${RED}✗ user-fonts size limit incorrect: $FONTS_SIZE (expected 5242880)${NC}"
  exit 1
fi

# Check user-images settings
IMAGES_SIZE=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -c \
  "SELECT file_size_limit FROM storage.buckets WHERE id = 'user-images';")
IMAGES_SIZE=$(echo "$IMAGES_SIZE" | tr -d ' ')

if [ "$IMAGES_SIZE" -eq 10485760 ]; then
  echo -e "${GREEN}✓ user-images size limit: 10 MB${NC}"
else
  echo -e "${RED}✗ user-images size limit incorrect: $IMAGES_SIZE (expected 10485760)${NC}"
  exit 1
fi

echo ""

# =====================================================
# Test 5: Verify MIME Types
# =====================================================

echo -e "${YELLOW}Test 5: Verify allowed MIME types${NC}"

# Check user-fonts MIME types
FONTS_MIMES=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -c \
  "SELECT array_length(allowed_mime_types, 1) FROM storage.buckets WHERE id = 'user-fonts';")
FONTS_MIMES=$(echo "$FONTS_MIMES" | tr -d ' ')

if [ "$FONTS_MIMES" -eq 6 ]; then
  echo -e "${GREEN}✓ user-fonts has 6 allowed MIME types${NC}"
else
  echo -e "${RED}✗ user-fonts MIME types incorrect: $FONTS_MIMES (expected 6)${NC}"
  exit 1
fi

# Check user-images MIME types
IMAGES_MIMES=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -c \
  "SELECT array_length(allowed_mime_types, 1) FROM storage.buckets WHERE id = 'user-images';")
IMAGES_MIMES=$(echo "$IMAGES_MIMES" | tr -d ' ')

if [ "$IMAGES_MIMES" -eq 4 ]; then
  echo -e "${GREEN}✓ user-images has 4 allowed MIME types${NC}"
else
  echo -e "${RED}✗ user-images MIME types incorrect: $IMAGES_MIMES (expected 4)${NC}"
  exit 1
fi

echo ""

# =====================================================
# Test 6: Verify Public Access
# =====================================================

echo -e "${YELLOW}Test 6: Verify buckets are public${NC}"

FONTS_PUBLIC=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -c \
  "SELECT public FROM storage.buckets WHERE id = 'user-fonts';")
FONTS_PUBLIC=$(echo "$FONTS_PUBLIC" | tr -d ' ')

if [ "$FONTS_PUBLIC" = "t" ]; then
  echo -e "${GREEN}✓ user-fonts is public${NC}"
else
  echo -e "${RED}✗ user-fonts is not public${NC}"
  exit 1
fi

IMAGES_PUBLIC=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -c \
  "SELECT public FROM storage.buckets WHERE id = 'user-images';")
IMAGES_PUBLIC=$(echo "$IMAGES_PUBLIC" | tr -d ' ')

if [ "$IMAGES_PUBLIC" = "t" ]; then
  echo -e "${GREEN}✓ user-images is public${NC}"
else
  echo -e "${RED}✗ user-images is not public${NC}"
  exit 1
fi

echo ""

# =====================================================
# Summary
# =====================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}All storage tests passed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}Storage Summary:${NC}"
echo -e "  • Buckets: ${GREEN}user-fonts, user-images${NC}"
echo -e "  • RLS Policies: ${GREEN}8 policies (4 per bucket)${NC}"
echo -e "  • Public Read: ${GREEN}Enabled${NC}"
echo -e "  • File Limits: ${GREEN}5 MB (fonts), 10 MB (images)${NC}"
echo -e "  • MIME Types: ${GREEN}6 (fonts), 4 (images)${NC}"
echo ""
echo -e "${YELLOW}Note: This script verifies bucket configuration only.${NC}"
echo -e "${YELLOW}For upload/download testing, use the Supabase client with authentication.${NC}"
echo ""
