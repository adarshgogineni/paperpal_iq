# Environment Variables Validation

Check that all required environment variables are properly configured for PaperPal IQ.

## Required Variables

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server-side operations)

### OpenAI Configuration
- `OPENAI_API_KEY` - OpenAI API key (starts with sk-)

### Application Configuration
- `NEXT_PUBLIC_APP_URL` - Application URL (e.g., http://localhost:3000)

## How to Validate

1. Check if `.env.local` exists in the project root
2. Verify all required variables are set (not empty)
3. Test Supabase connection
4. Test OpenAI API key validity

## Setup Steps

If variables are missing:
1. Copy `.env.example` to `.env.local`
2. Get Supabase credentials from: https://app.supabase.com/project/_/settings/api
3. Get OpenAI API key from: https://platform.openai.com/api-keys
4. Fill in all values in `.env.local`

## Quick Test

Run: `node scripts/check-env.js` to validate all environment variables are present and formatted correctly.
