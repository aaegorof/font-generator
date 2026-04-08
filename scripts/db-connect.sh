#!/bin/bash

# Script to connect to local Supabase PostgreSQL database
# Usage: ./scripts/db-connect.sh [command]
# If no command provided, opens interactive psql session

if [ -z "$1" ]; then
  # Interactive mode (requires psql installed locally)
  echo "Connecting to Supabase database..."
  echo "Connection string: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  echo ""
  
  # Check if psql is installed
  if command -v psql &> /dev/null; then
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
  else
    echo "psql not found. Using Docker exec instead..."
    echo "Note: This is non-interactive mode. For interactive mode, install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo ""
    docker exec -i supabase_db_font-generator psql -U postgres
  fi
else
  # Execute command mode
  docker exec supabase_db_font-generator psql -U postgres -c "$1"
fi
