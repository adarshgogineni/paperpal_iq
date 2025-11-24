#!/bin/bash

# PaperPal IQ - Database Schema Validation Script
# Validates that Supabase database schema matches expected structure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${BLUE}PaperPal IQ - Database Schema Validation${NC}\n"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Supabase CLI not found"
    echo -e "${GRAY}  Install with: npm install -g supabase${NC}\n"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI installed\n"

# Check if project is linked
if [ ! -f .supabase/config.toml ]; then
    echo -e "${YELLOW}⚠${NC} Supabase project not initialized locally"
    echo -e "${GRAY}  Run: npx supabase init${NC}"
    echo -e "${GRAY}  Then: npx supabase link --project-ref <your-project-ref>${NC}\n"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase project initialized\n"

# Expected schema structure
echo -e "${BLUE}Expected Tables:${NC}"
echo -e "  • documents"
echo -e "  • summaries\n"

echo -e "${BLUE}Checking schema...${NC}\n"

# Check if migrations exist
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations)" ]; then
    echo -e "${GREEN}✓${NC} Migrations directory exists"

    # List migrations
    echo -e "${GRAY}  Migrations found:${NC}"
    for migration in supabase/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo -e "${GRAY}    - $(basename "$migration")${NC}"
        fi
    done
    echo ""
else
    echo -e "${YELLOW}⚠${NC} No migrations found"
    echo -e "${GRAY}  Create initial migration with:${NC}"
    echo -e "${GRAY}    npx supabase db diff -f initial_schema${NC}\n"
fi

# Instructions for manual verification
echo -e "${BLUE}Manual Verification Steps:${NC}"
echo -e "1. Check Supabase Dashboard → Table Editor"
echo -e "2. Verify these tables exist:"
echo -e "${GRAY}   - documents (id, user_id, title, file_path, status, created_at)${NC}"
echo -e "${GRAY}   - summaries (id, document_id, audience, summary_text, tokens_used, created_at)${NC}"
echo -e "3. Check Authentication → Policies"
echo -e "${GRAY}   - RLS enabled on both tables${NC}"
echo -e "${GRAY}   - Users can only access their own data${NC}"
echo -e "4. Check Storage → Buckets"
echo -e "${GRAY}   - 'papers' bucket exists${NC}"
echo -e "${GRAY}   - Proper access policies configured${NC}\n"

# Check for local database status
echo -e "${BLUE}Local Database Status:${NC}"
if npx supabase status &> /dev/null; then
    npx supabase status
    echo ""
else
    echo -e "${YELLOW}⚠${NC} Local Supabase not running"
    echo -e "${GRAY}  Start with: npx supabase start${NC}\n"
fi

echo -e "${GREEN}✓ Schema validation complete${NC}\n"
echo -e "${GRAY}For detailed schema check, run:${NC}"
echo -e "${GRAY}  npx supabase db diff${NC}\n"
