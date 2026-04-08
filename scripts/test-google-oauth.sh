#!/bin/bash
# Test script for Google OAuth configuration
# Run this after configuring Google OAuth credentials in .env

set -e

echo "🔍 Testing Google OAuth Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Check if Google OAuth credentials are configured
if grep -q "your-google-client-id" .env; then
    echo -e "${YELLOW}⚠️  Warning: Google OAuth credentials not configured in .env${NC}"
    echo "   Please update SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID and SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET"
    echo "   See docs/GOOGLE_OAUTH_SETUP.md for instructions"
    echo ""
fi

# Test 1: Check auth service health
echo "1️⃣  Checking auth service health..."
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:54321/auth/v1/health)
if echo "$HEALTH_RESPONSE" | grep -q "GoTrue"; then
    echo -e "${GREEN}✅ Auth service is healthy${NC}"
else
    echo -e "${RED}❌ Auth service is not responding${NC}"
    echo "   Run: npx supabase start"
    exit 1
fi
echo ""

# Test 2: Check Google OAuth provider
echo "2️⃣  Testing Google OAuth provider..."
OAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" "http://127.0.0.1:54321/auth/v1/authorize?provider=google")
HTTP_CODE=$(echo "$OAUTH_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$OAUTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ Google OAuth provider is enabled${NC}"
    echo "   Redirect URL: $(echo "$RESPONSE_BODY" | grep -o 'https://accounts.google.com[^"]*' | head -1)"
elif echo "$RESPONSE_BODY" | grep -q "provider is not enabled"; then
    echo -e "${RED}❌ Google OAuth provider is not enabled${NC}"
    echo "   1. Ensure supabase/config.toml has [auth.external.google] enabled = true"
    echo "   2. Restart Supabase: npx supabase stop && npx supabase start"
    exit 1
elif echo "$RESPONSE_BODY" | grep -q "invalid_request"; then
    echo -e "${YELLOW}⚠️  Google OAuth is enabled but credentials may be invalid${NC}"
    echo "   Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
    exit 1
fi
echo ""

# Test 3: Check config.toml
echo "3️⃣  Checking supabase/config.toml..."
if grep -q "\[auth.external.google\]" supabase/config.toml && \
   grep -A 2 "\[auth.external.google\]" supabase/config.toml | grep -q "enabled = true"; then
    echo -e "${GREEN}✅ Google OAuth is enabled in config.toml${NC}"
else
    echo -e "${RED}❌ Google OAuth is not enabled in config.toml${NC}"
    exit 1
fi
echo ""

# Test 4: Check environment variables
echo "4️⃣  Checking environment variables..."
if [ -f .env ]; then
    if grep -q "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID" .env && \
       grep -q "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET" .env; then
        echo -e "${GREEN}✅ Google OAuth environment variables are defined${NC}"
        
        # Check if they're still placeholders
        if grep "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id" .env > /dev/null; then
            echo -e "${YELLOW}   ⚠️  Still using placeholder values - update with real credentials${NC}"
        fi
    else
        echo -e "${RED}❌ Google OAuth environment variables are missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Google OAuth configuration is ready!${NC}"
echo ""
echo "Next steps:"
echo "1. Get credentials from Google Cloud Console"
echo "   https://console.cloud.google.com/"
echo ""
echo "2. Update .env with your credentials:"
echo "   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-actual-client-id"
echo "   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-actual-secret"
echo ""
echo "3. Restart Supabase:"
echo "   npx supabase stop && npx supabase start"
echo ""
echo "4. Test in browser:"
echo "   http://127.0.0.1:54321/auth/v1/authorize?provider=google&redirect_to=http://localhost:5173"
echo ""
echo "📚 Full setup guide: docs/GOOGLE_OAUTH_SETUP.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
