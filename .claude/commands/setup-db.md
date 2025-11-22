# Database Setup Guide

Step-by-step guide to set up the Supabase database for PaperPal IQ.

## Prerequisites

1. Supabase project created at https://app.supabase.com
2. Supabase CLI installed: `npm install -g supabase`
3. Environment variables configured (run `/env-validate`)

## Setup Steps

### 1. Initialize Supabase Locally (Optional)
```bash
npx supabase init
npx supabase login
npx supabase link --project-ref your-project-ref
```

### 2. Create Database Tables

#### Option A: Via Supabase Dashboard
1. Go to Table Editor in Supabase Dashboard
2. Create `documents` table with columns:
   - id: uuid, primary key, default: gen_random_uuid()
   - user_id: uuid, foreign key to auth.users(id)
   - title: text
   - file_path: text
   - status: text
   - created_at: timestamptz, default: now()

3. Create `summaries` table with columns:
   - id: uuid, primary key, default: gen_random_uuid()
   - document_id: uuid, foreign key to documents(id)
   - audience: text
   - summary_text: text
   - tokens_used: int4
   - created_at: timestamptz, default: now()

#### Option B: Via SQL Editor
Run the SQL from `supabase/migrations/` directory (when created)

### 3. Enable Row Level Security (RLS)

#### For `documents` table:
```sql
-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can see their own documents"
ON documents FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert their own documents"
ON documents FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### For `summaries` table:
```sql
-- Enable RLS
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can see their own summaries"
ON summaries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = summaries.document_id
    AND documents.user_id = auth.uid()
  )
);

-- INSERT policy
CREATE POLICY "Users can insert their own summaries"
ON summaries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = summaries.document_id
    AND documents.user_id = auth.uid()
  )
);
```

### 4. Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Create new bucket named `papers`
3. Set as private bucket
4. Add storage policy:
```sql
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own papers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'papers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files
CREATE POLICY "Users can read their own papers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'papers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 5. Configure Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)
4. Set Site URL and Redirect URLs in Authentication → URL Configuration

### 6. Verify Setup

Run `/schema-check` to validate the database schema is correct.

## Troubleshooting

- **Tables not visible**: Check you're connected to the right project
- **RLS blocking queries**: Verify policies are created and auth token is valid
- **Storage upload fails**: Check bucket exists and policies allow uploads
- **Foreign key errors**: Ensure auth.users table exists (created automatically)

## Migration Management

To create migrations for version control:
```bash
npx supabase db diff -f initial_schema
```

This will create a migration file you can commit to git and apply to other environments.
