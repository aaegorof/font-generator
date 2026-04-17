#!/bin/bash

# Script to check if development environment is ready

echo "🔍 Checking development environment..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "📦 Node.js: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

# Check npm
echo -n "📦 npm: "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} v$NPM_VERSION"
else
    echo -e "${RED}✗ Not installed${NC}"
    exit 1
fi

# Check Docker
echo -n "🐳 Docker: "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | tr -d ',')
    echo -e "${GREEN}✓${NC} $DOCKER_VERSION"
    
    # Check if Docker daemon is running
    echo -n "   Docker daemon: "
    if docker ps &> /dev/null; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Not running${NC}"
        echo "   Start Docker Desktop and try again"
        exit 1
    fi
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "   Install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check Supabase CLI
echo -n "🚀 Supabase CLI: "
if command -v supabase &> /dev/null; then
    SUPABASE_VERSION=$(supabase --version 2>&1 | head -n 1)
    echo -e "${GREEN}✓${NC} $SUPABASE_VERSION"
else
    echo -e "${YELLOW}⚠ Not installed${NC}"
    echo "   Install with: brew install supabase/tap/supabase"
    echo "   Or see: https://supabase.com/docs/guides/cli"
fi

# Check node_modules
echo -n "📚 Dependencies: "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}⚠ Not installed${NC}"
    echo "   Run: npm install"
fi

# Check .env.local
echo -n "⚙️  Environment: "
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local exists${NC}"
    
    # Check if required variables are set
    if grep -q "VITE_SUPABASE_URL" .env.local && grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
        echo -e "   ${GREEN}✓ Required variables present${NC}"
    else
        echo -e "   ${YELLOW}⚠ Some variables may be missing${NC}"
        echo "   Check .env.example for reference"
    fi
else
    echo -e "${YELLOW}⚠ .env.local not found${NC}"
    echo "   Run: cp .env.example .env.local"
    echo "   Then edit .env.local with your values"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Supabase is running
SUPABASE_RUNNING=false
if command -v supabase &> /dev/null; then
    if supabase status &> /dev/null; then
        SUPABASE_RUNNING=true
    fi
fi

if [ "$SUPABASE_RUNNING" = true ]; then
    echo -e "✅ ${GREEN}Supabase is already running!${NC}"
    echo ""
    echo "Access points:"
    echo "  Frontend:       http://localhost:5173"
    echo "  Backend API:    http://localhost:3000"
    echo "  Supabase Studio: http://127.0.0.1:54323"
    echo ""
    echo "Run: ${GREEN}npm run dev${NC} to start frontend & backend"
else
    echo -e "✅ ${GREEN}Environment is ready!${NC}"
    echo ""
    echo "To start development:"
    echo "  ${GREEN}npm run dev:full${NC}  - Start everything (Supabase + Frontend + Backend)"
    echo ""
    echo "Or separately:"
    echo "  ${GREEN}npm run supabase:start${NC}  - Start Supabase only"
    echo "  ${GREEN}npm run dev${NC}             - Start Frontend + Backend only"
fi

echo ""
echo "📖 Docs:"
echo "  English: docs/LOCAL_DEVELOPMENT.md"
echo "  Русский: docs/RU_QUICKSTART.md"
echo ""
