#!/bin/bash

# Script to show Supabase database information
# Usage: ./scripts/db-info.sh

echo "=== Supabase Database Information ==="
echo ""

echo "📊 PostgreSQL Version:"
docker exec supabase_db_font-generator psql -U postgres -t -c "SELECT version();"
echo ""

echo "📁 Databases:"
docker exec supabase_db_font-generator psql -U postgres -c "\l"
echo ""

echo "📋 Tables in public schema:"
docker exec supabase_db_font-generator psql -U postgres -c "\dt"
echo ""

echo "👥 Database Users:"
docker exec supabase_db_font-generator psql -U postgres -c "\du"
echo ""

echo "🔌 Connection Info:"
echo "  Host: 127.0.0.1"
echo "  Port: 54322"
echo "  Database: postgres"
echo "  User: postgres"
echo "  Password: postgres"
echo ""
echo "  Connection String:"
echo "  postgresql://postgres:postgres@127.0.0.1:54322/postgres"
