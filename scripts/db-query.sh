#!/bin/bash

# Script to execute SQL queries on Supabase database
# Usage: ./scripts/db-query.sh "SELECT * FROM users;"

if [ -z "$1" ]; then
  echo "Usage: ./scripts/db-query.sh \"SQL QUERY\""
  echo ""
  echo "Examples:"
  echo "  ./scripts/db-query.sh \"SELECT version();\""
  echo "  ./scripts/db-query.sh \"\\dt\""
  echo "  ./scripts/db-query.sh \"\\l\""
  exit 1
fi

docker exec supabase_db_font-generator psql -U postgres -c "$1"
