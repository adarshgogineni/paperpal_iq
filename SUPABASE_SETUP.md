# Supabase Setup Guide

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project" or "Sign Up"
3. Sign up with GitHub (recommended) or email
4. Verify your email if using email signup

## Step 2: Create New Project

1. Once logged in, click "New Project"
2. Fill in the project details:
   - **Name**: `paperpal-iq` (or any name you prefer)
   - **Database Password**: Create a strong password (SAVE THIS - you'll need it!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free tier is fine for development

3. Click "Create new project"
4. Wait 2-3 minutes for the project to be provisioned

## Step 3: Get Your Project Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click on **API** section
3. You'll see these values (keep this page open):

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (click "Reveal" to see it)
   ```

## Step 4: Update Your .env.local File

Open your `.env.local` file and replace the placeholder values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI Configuration (leave as is for now)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Node Environment
NODE_ENV=development
```

**Important**:
- Copy the FULL keys (they're very long - about 200+ characters)
- Don't include quotes around the values
- Make sure there are no extra spaces

## Step 5: Run Database Migrations

We need to create the database tables. You have two options:

### Option A: Using Supabase Dashboard (Recommended for first time)

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the contents of `supabase/migrations/20250101000000_initial_schema.sql`
4. Paste it into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

7. Create another new query
8. Copy the contents of `supabase/migrations/20250101000001_storage_setup.sql`
9. Paste and run it
10. You should see "Success. 1 rows"

### Option B: Using Supabase CLI (Alternative)

```bash
# Link your local project to Supabase
supabase link --project-ref <your-project-ref>

# Push migrations to Supabase
supabase db push
```

The project ref is the part before `.supabase.co` in your URL.

## Step 6: Verify Database Setup

1. In Supabase Dashboard, go to **Table Editor**
2. You should see two tables:
   - `documents`
   - `summaries`

3. Click on each table to verify columns:

   **documents table**:
   - id (uuid)
   - user_id (uuid)
   - title (text)
   - file_path (text)
   - file_size (int8)
   - mime_type (text)
   - status (text)
   - error_message (text)
   - created_at (timestamptz)
   - updated_at (timestamptz)

   **summaries table**:
   - id (uuid)
   - document_id (uuid)
   - audience (text)
   - summary_text (text)
   - tokens_used (int4)
   - model_used (text)
   - created_at (timestamptz)

## Step 7: Verify RLS Policies

1. In Table Editor, click on a table (e.g., `documents`)
2. Click on the "..." menu → "View policies"
3. You should see 4 policies for documents table:
   - Users can view their own documents
   - Users can insert their own documents
   - Users can update their own documents
   - Users can delete their own documents

## Step 8: Verify Storage Bucket

1. Go to **Storage** in left sidebar
2. You should see a bucket named `papers`
3. Click on it
4. Go to "Policies" tab
5. Verify there are 4 policies:
   - Users can upload their own papers
   - Users can view their own papers
   - Users can update their own papers
   - Users can delete their own papers

## Step 9: Configure Email Authentication (Optional but Recommended)

By default, Supabase sends confirmation emails. For development, you can:

### Option 1: Disable Email Confirmation (Development Only)
1. Go to **Authentication** → **Providers**
2. Click on **Email** provider
3. **Disable** "Confirm email"
4. Click "Save"

⚠️ **Warning**: Only do this for development! Re-enable for production.

### Option 2: Configure Email Templates (Production)
1. Go to **Authentication** → **Email Templates**
2. Customize the confirmation email if desired
3. You can also set up custom SMTP in **Authentication** → **Settings**

## Step 10: Test Your Setup

Run the environment validation script:

```bash
npm run test:env
```

You should see all green checkmarks!

## Next Steps

Once you've completed these steps, we can:

1. Start the dev server: `npm run dev`
2. Test the signup flow
3. Test the login flow
4. Verify authentication works end-to-end

## Common Issues

### Issue: "Invalid API key"
- Make sure you copied the entire key (200+ characters)
- Check for extra spaces or quotes in .env.local
- Restart the dev server after updating .env.local

### Issue: "Failed to fetch"
- Check your NEXT_PUBLIC_SUPABASE_URL is correct
- Make sure it starts with `https://`
- Verify your internet connection

### Issue: "User already registered"
- This is expected if you try to sign up with the same email twice
- Either use a different email or delete the user from:
  Authentication → Users → Click on user → Delete user

### Issue: Tables not created
- Make sure you ran BOTH migration files
- Check SQL Editor for any error messages
- Verify you're in the correct project

## Need Help?

If you encounter any issues:
1. Check the Supabase logs: **Logs** in left sidebar
2. Check browser console for errors (F12)
3. Verify your .env.local file is saved
4. Restart the Next.js dev server

---

**Ready?** Follow the steps above, then let me know when you've completed Step 4 (updating .env.local), and we'll test the authentication flow together!
