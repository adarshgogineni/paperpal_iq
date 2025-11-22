# Schema Check

Validate that the Supabase database schema matches the expected structure for PaperPal IQ.

## Expected Tables

### documents
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- title (text)
- file_path (text)
- status (text)
- created_at (timestamptz)

### summaries
- id (uuid, PK)
- document_id (uuid, FK to documents)
- audience (text: elementary | high_school | phd)
- summary_text (text)
- tokens_used (integer)
- created_at (timestamptz)

## RLS Policies Required

1. Documents table: Users can only see/insert their own documents
2. Summaries table: Users can only access summaries for their own documents

## How to Check

Run: `npx supabase db diff` to see any schema differences, or check the Supabase Dashboard at:
- Table Editor → View table structure
- Authentication → Policies → Verify RLS rules

If schema doesn't exist yet, run the migration scripts in `supabase/migrations/` or create tables via the Dashboard.
