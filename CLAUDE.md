# PaperPal IQ - AI Paper Summarizer

## Project Overview

PaperPal IQ is an MVP application that allows users to upload academic ML/AI papers in PDF format and receive summaries tailored to different audience levels (elementary school, high school, or PhD candidate). The application uses OpenAI's Chat API to generate context-appropriate explanations.

For detailed product specifications, see [project_summary.md](./project_summary.md).

## Tech Stack

- **Frontend & Backend**: Next.js 14+ (App Router, TypeScript)
- **Authentication**: Supabase Auth (email/password)
- **Database**: Supabase (PostgreSQL with RLS)
- **Storage**: Supabase Storage (`papers` bucket for PDFs)
- **LLM**: OpenAI Chat API (GPT-4 or GPT-3.5-turbo)
- **Styling**: Tailwind CSS + shadcn/ui components

## Project Structure

```
paperpal_iq/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (login, signup)
│   ├── dashboard/           # User dashboard
│   ├── documents/           # Document detail pages
│   │   └── [id]/           # Individual document view
│   ├── api/                # API routes
│   │   ├── upload/         # POST - Upload PDF
│   │   ├── summarize/      # POST - Generate summary
│   │   └── documents/      # GET - List documents
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── auth/               # Auth-related components
│   ├── upload/             # File upload components
│   └── summaries/          # Summary display components
├── lib/                     # Utility functions
│   ├── supabase/           # Supabase client & helpers
│   ├── openai/             # OpenAI API integration
│   └── pdf/                # PDF parsing utilities
├── middleware.ts            # Route protection
├── .claude/                 # Claude Code configuration
└── scripts/                 # Helper scripts
```

## Key API Routes

### Authentication
- Handled via Supabase Auth with Next.js middleware
- Protected routes: `/dashboard`, `/documents/*`

### Document Management
- `POST /api/upload`
  - Accepts: PDF file upload
  - Returns: Document ID and metadata
  - Actions: Stores file in Supabase Storage, creates DB record

- `POST /api/summarize`
  - Accepts: `documentId`, `audienceLevel` (elementary | high_school | phd)
  - Returns: Generated summary
  - Actions: Fetches PDF, extracts text, calls OpenAI, stores summary

- `GET /api/documents`
  - Returns: List of current user's documents with summaries
  - Filtered by: `auth.uid()` via RLS

- `GET /api/documents/:id`
  - Returns: Single document with all summaries
  - Includes: Metadata, file info, summaries by audience level

## Database Schema

### `documents` table

| Column       | Type        | Description                          |
|--------------|-------------|--------------------------------------|
| id           | uuid        | Primary key (auto-generated)         |
| user_id      | uuid        | Foreign key to auth.users(id)        |
| title        | text        | Document title or filename           |
| file_path    | text        | Path in Supabase Storage             |
| status       | text        | uploaded \| summarized \| error      |
| created_at   | timestamptz | Timestamp of upload                  |

**RLS Policies:**
- Users can only SELECT/INSERT their own documents (`auth.uid() = user_id`)

### `summaries` table

| Column         | Type        | Description                          |
|----------------|-------------|--------------------------------------|
| id             | uuid        | Primary key (auto-generated)         |
| document_id    | uuid        | Foreign key to documents(id)         |
| audience       | text        | elementary \| high_school \| phd     |
| summary_text   | text        | Generated summary from OpenAI        |
| tokens_used    | integer     | Token count from API response        |
| created_at     | timestamptz | Timestamp of summary generation      |

**RLS Policies:**
- Users can only access summaries for their own documents (JOIN through documents table)

## Environment Variables

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Setup Instructions
1. Copy `.env.example` to `.env.local`
2. Fill in Supabase credentials from project settings
3. Add OpenAI API key from platform.openai.com
4. Never commit `.env.local` to version control

## Development Workflow

### Getting Started
```bash
npm install
npm run dev
```

### Database Setup
```bash
# Run Supabase migrations (when ready)
npx supabase db push

# Or apply schema manually via Supabase Dashboard
```

### Testing
```bash
# Run tests (when implemented)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## Key Implementation Details

### PDF Text Extraction
- Use `pdf-parse` or similar library
- Handle multi-column layouts and equations
- Extract plain text for LLM processing

### OpenAI Integration
- Use Chat Completions API
- System prompts tailored to each audience level:
  - **Elementary**: Simple analogies, no technical jargon
  - **High School**: Basic technical concepts, accessible explanations
  - **PhD**: Full technical detail, domain-specific terminology

### Prompt Template Example
```typescript
const prompts = {
  elementary: "Explain this research paper as if teaching a 10-year-old...",
  high_school: "Summarize this paper for a high school student with basic science knowledge...",
  phd: "Provide a technical summary for a PhD candidate in machine learning..."
};
```

### Error Handling
- File upload validation (PDF only, max size)
- OpenAI API rate limiting and retries
- PDF parsing errors (malformed files)
- User-friendly error messages

## Coding Conventions

### TypeScript
- Use strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for functions

### Next.js
- Use Server Components by default
- Add 'use client' only when necessary
- Keep API routes thin, extract logic to lib/

### Styling
- Use Tailwind utility classes
- Follow shadcn/ui component patterns
- Responsive design (mobile-first)

### File Naming
- Components: PascalCase (e.g., `UploadButton.tsx`)
- Utilities: camelCase (e.g., `parsePdf.ts`)
- API routes: kebab-case directories

## Out of Scope (v1)

- ❌ Document sharing between users
- ❌ Payment/billing integration
- ❌ Advanced chunking or citations
- ❌ Streaming UI for summaries
- ❌ Multiple file uploads at once
- ❌ Document editing or annotations

## Future Enhancements

- Real-time streaming of summary generation
- Support for more document formats (DOCX, HTML)
- Citation extraction and linking
- Comparison of summaries across audience levels
- Export summaries as PDF or Markdown
- Team/organization accounts

## Useful Commands

- `/schema-check` - Validate database schema
- `/env-validate` - Check environment variables
- `/api-test` - Test API endpoints
- `/setup-db` - Guide for Supabase setup

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Project Summary](./project_summary.md) - Detailed MVP specifications
