# PaperPal IQ - Complete Implementation Guide

A comprehensive, step-by-step guide for building the PaperPal IQ MVP from scratch. This guide is designed for junior engineers and includes all commands, file paths, and validation steps needed.

> 📚 **Reference Documents**:
> - [CLAUDE.md](./CLAUDE.md) - Codebase documentation
> - [project_summary.md](./project_summary.md) - Product specifications
> - [README.md](./README.md) - Getting started guide

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Project Setup & Dependencies](#phase-1-project-setup--dependencies)
3. [Phase 2: Supabase Setup](#phase-2-supabase-setup)
4. [Phase 3: OpenAI Setup](#phase-3-openai-setup)
5. [Phase 4: Core Library Setup](#phase-4-core-library-setup)
6. [Phase 5: Authentication Implementation](#phase-5-authentication-implementation)
7. [Phase 6: Dashboard & Document List](#phase-6-dashboard--document-list)
8. [Phase 7: File Upload Feature](#phase-7-file-upload-feature)
9. [Phase 8: Summary Generation](#phase-8-summary-generation)
10. [Phase 9: Document Detail Page](#phase-9-document-detail-page)
11. [Phase 10: Landing Page & Navigation](#phase-10-landing-page--navigation)
12. [Phase 11: Error Handling & Polish](#phase-11-error-handling--polish)
13. [Phase 12: Testing & Validation](#phase-12-testing--validation)
14. [Phase 13: Code Quality & Documentation](#phase-13-code-quality--documentation)
15. [Phase 14: Deployment Preparation](#phase-14-deployment-preparation)
16. [Phase 15: Deployment to Vercel](#phase-15-deployment-to-vercel)
17. [Phase 16: Final Polish & Launch](#phase-16-final-polish--launch)
18. [Troubleshooting Guide](#troubleshooting-guide)
19. [Next Steps After MVP](#next-steps-after-mvp)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] Git installed and configured
- [ ] A code editor (VS Code recommended)
- [ ] A GitHub account (optional, for deployment)
- [ ] An OpenAI account with API access
- [ ] A Supabase account (free tier is fine)

---

## Phase 1: Project Setup & Dependencies

### 1.1 Initialize Next.js Project

- [ ] **Task**: Create a new Next.js project with TypeScript and Tailwind CSS
  ```bash
  cd /Users/adarsh/Documents/Code/GitHub/paperpal_iq
  npx create-next-app@latest . --typescript --tailwind --app --import-alias "@/*"
  ```
  - When prompted, select:
    - TypeScript: Yes
    - ESLint: Yes
    - Tailwind CSS: Yes
    - `src/` directory: No (we'll use `app/` directly)
    - App Router: Yes
    - Customize import alias: Yes (`@/*`)

- [ ] **Validation**: Verify the project structure was created
  ```bash
  ls -la
  # Should see: app/, public/, package.json, tsconfig.json, tailwind.config.ts
  ```

### 1.2 Install Core Dependencies

- [ ] **Task**: Install Supabase client libraries
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```

- [ ] **Task**: Install OpenAI SDK
  ```bash
  npm install openai
  ```

- [ ] **Task**: Install PDF parsing library
  ```bash
  npm install pdf-parse
  npm install -D @types/pdf-parse
  ```

- [ ] **Task**: Install additional utilities
  ```bash
  npm install clsx tailwind-merge zod date-fns
  ```

- [ ] **Validation**: Check package.json contains all dependencies
  ```bash
  cat package.json | grep -E "(supabase|openai|pdf-parse|zod|date-fns)"
  ```

### 1.3 Install shadcn/ui Components

- [ ] **Task**: Initialize shadcn/ui
  ```bash
  npx shadcn@latest init
  ```
  - When prompted, select:
    - Style: Default
    - Base color: Slate
    - CSS variables: Yes

- [ ] **Task**: Install initial UI components
  ```bash
  npx shadcn@latest add button card input label select badge alert skeleton dropdown-menu
  ```

- [ ] **Validation**: Verify components directory exists
  ```bash
  ls components/ui/
  # Should see: button.tsx, card.tsx, input.tsx, etc.
  ```

### 1.4 Environment Setup

- [ ] **Task**: Copy the example environment file
  ```bash
  cp .env.example .env.local
  ```

- [ ] **Task**: Open `.env.local` and leave placeholders (we'll fill these in Phase 2)

- [ ] **Validation**: Verify `.env.local` exists and is gitignored
  ```bash
  ls -la | grep .env.local
  git status  # Should NOT show .env.local
  ```

### 1.5 TypeScript Configuration

- [ ] **Task**: Update `tsconfig.json` with strict settings
  - Open `tsconfig.json`
  - Ensure these settings are present:
    ```json
    {
      "compilerOptions": {
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "paths": {
          "@/*": ["./*"]
        }
      }
    }
    ```

- [ ] **Validation**: Run TypeScript check
  ```bash
  npx tsc --noEmit
  ```

---

## Phase 2: Supabase Setup

### 2.1 Create Supabase Project

- [ ] **Task**: Go to https://app.supabase.com and create a new project
  - Project name: `paperpal-iq`
  - Database password: Generate a strong password and save it
  - Region: Choose closest to your users
  - Wait for project to finish provisioning (2-3 minutes)

- [ ] **Task**: Copy your Supabase credentials
  - Navigate to: Settings > API
  - Copy `Project URL` → Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
  - Copy `anon/public` key → Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Copy `service_role` key → Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Validation**: Verify `.env.local` has all three Supabase variables
  ```bash
  cat .env.local | grep SUPABASE
  ```

### 2.2 Create Database Schema

- [ ] **Task**: Go to Supabase SQL Editor (Database > SQL Editor)

- [ ] **Task**: Create the `documents` table
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_documents_user_id ON documents(user_id);
  CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
  ```

- [ ] **Task**: Create the `summaries` table
  ```sql
  CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    audience TEXT NOT NULL CHECK (audience IN ('elementary', 'high_school', 'phd')),
    summary_text TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_summaries_document_id ON summaries(document_id);
  CREATE INDEX idx_summaries_audience ON summaries(audience);
  ```

- [ ] **Validation**: Verify tables in Database > Tables

### 2.3 Enable Row Level Security (RLS)

- [ ] **Task**: Enable RLS on both tables
  ```sql
  ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
  ```

- [ ] **Task**: Create RLS policies for `documents`
  ```sql
  CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);
  ```

- [ ] **Task**: Create RLS policies for `summaries`
  ```sql
  CREATE POLICY "Users can view own summaries"
    ON summaries FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM documents
        WHERE documents.id = summaries.document_id
        AND documents.user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can insert own summaries"
    ON summaries FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM documents
        WHERE documents.id = summaries.document_id
        AND documents.user_id = auth.uid()
      )
    );
  ```

- [ ] **Validation**: Check policies in Database > Tables > Policies

### 2.4 Create Storage Bucket

- [ ] **Task**: Create storage bucket
  - Go to Storage
  - Click "New bucket"
  - Name: `papers`
  - Public bucket: No
  - Click "Create bucket"

- [ ] **Task**: Create storage policies
  ```sql
  CREATE POLICY "Users can upload papers"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'papers' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  CREATE POLICY "Users can read own papers"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'papers' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  CREATE POLICY "Users can delete own papers"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'papers' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  ```

- [ ] **Validation**: Check Storage > papers > Policies

### 2.5 Configure Auth Settings

- [ ] **Task**: Enable email authentication
  - Go to Authentication > Providers
  - Ensure "Email" is enabled
  - Go to Authentication > Settings
  - Uncheck "Enable email confirmations" (for MVP)

- [ ] **Task**: Configure site URL
  - Go to Authentication > URL Configuration
  - Site URL: `http://localhost:3000`
  - Redirect URLs: `http://localhost:3000/**`

- [ ] **Validation**: Create test user in Authentication > Users

---

## Phase 3: OpenAI Setup

### 3.1 Get OpenAI API Key

- [ ] **Task**: Go to https://platform.openai.com/api-keys

- [ ] **Task**: Click "Create new secret key"
  - Name: `paperpal-iq-dev`
  - Copy the key immediately

- [ ] **Task**: Add to `.env.local`
  ```bash
  OPENAI_API_KEY=sk-your-actual-key-here
  ```

- [ ] **Validation**: Verify key is in `.env.local`
  ```bash
  grep OPENAI_API_KEY .env.local
  ```

### 3.2 Verify OpenAI Access

- [ ] **Task**: Install dotenv for testing
  ```bash
  npm install dotenv
  ```

- [ ] **Task**: Create test script `scripts/test-openai.js`
  ```javascript
  const OpenAI = require('openai');
  require('dotenv').config({ path: '.env.local' });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async function testConnection() {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Say 'OpenAI connection successful!'" }],
        max_tokens: 20,
      });
      console.log('✅ OpenAI API connected successfully!');
      console.log('Response:', completion.choices[0].message.content);
    } catch (error) {
      console.error('❌ OpenAI API error:', error.message);
    }
  }

  testConnection();
  ```

- [ ] **Task**: Run the test
  ```bash
  node scripts/test-openai.js
  ```

- [ ] **Validation**: Should see "✅ OpenAI connection successful!"

---

## Phase 4: Core Library Setup

### 4.1 Create Supabase Client Utilities

- [ ] **Task**: Create `lib/supabase/client.ts`
  ```typescript
  import { createBrowserClient } from '@supabase/ssr'

  export function createClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  ```

- [ ] **Task**: Create `lib/supabase/server.ts`
  ```typescript
  import { createServerClient, type CookieOptions } from '@supabase/ssr'
  import { cookies } from 'next/headers'

  export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {}
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {}
          },
        },
      }
    )
  }
  ```

- [ ] **Task**: Create `lib/supabase/middleware.ts`
  ```typescript
  import { createServerClient, type CookieOptions } from '@supabase/ssr'
  import { type NextRequest, NextResponse } from 'next/server'

  export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
      request: { headers: request.headers },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    await supabase.auth.getUser()
    return response
  }
  ```

- [ ] **Validation**: Check files exist
  ```bash
  ls -la lib/supabase/
  ```

### 4.2 Create Type Definitions

- [ ] **Task**: Create `lib/types.ts`
  ```typescript
  export type AudienceLevel = 'elementary' | 'high_school' | 'phd'

  export interface Document {
    id: string
    user_id: string
    title: string
    file_path: string
    status: 'uploaded' | 'summarized' | 'error'
    created_at: string
  }

  export interface Summary {
    id: string
    document_id: string
    audience: AudienceLevel
    summary_text: string
    tokens_used: number | null
    created_at: string
  }

  export interface DocumentWithSummaries extends Document {
    summaries: Summary[]
  }
  ```

- [ ] **Validation**: Run TypeScript check
  ```bash
  npx tsc --noEmit
  ```

### 4.3 Create OpenAI Utilities

- [ ] **Task**: Create `lib/openai/client.ts`
  ```typescript
  import OpenAI from 'openai'

  export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  ```

- [ ] **Task**: Create `lib/openai/prompts.ts`
  ```typescript
  import { AudienceLevel } from '@/lib/types'

  export const SYSTEM_PROMPTS: Record<AudienceLevel, string> = {
    elementary: `You are a friendly teacher explaining complex academic research to elementary school students (ages 8-11).

Your task:
- Use simple, everyday language and avoid technical jargon
- Include fun analogies and comparisons to things kids know
- Break down complex ideas into bite-sized pieces
- Make it exciting and engaging
- Keep sentences short and simple

Format your summary in 3-4 short paragraphs.`,

    high_school: `You are a science teacher explaining academic research to high school students (ages 14-18).

Your task:
- Use clear language with some technical terms (explain them when first used)
- Relate concepts to things students learn in high school science/math
- Include the main methods and findings
- Explain why the research matters

Format your summary in 4-5 paragraphs covering: background, methods, results, and significance.`,

    phd: `You are explaining academic research to a PhD candidate in machine learning or AI.

Your task:
- Use precise technical terminology
- Include specific methodological details
- Discuss the theoretical contributions and novelty
- Mention key equations, architectures, or algorithms
- Explain results quantitatively
- Discuss limitations and future work

Format your summary in 5-6 paragraphs covering: motivation, technical approach, experimental setup, results, contributions, and limitations.`,
  }

  export function createSummarizationPrompt(
    paperText: string,
    audienceLevel: AudienceLevel
  ): string {
    return `${SYSTEM_PROMPTS[audienceLevel]}

Here is the academic paper to summarize:

${paperText}

Please provide a summary appropriate for the specified audience level.`
  }
  ```

- [ ] **Validation**: Check files exist
  ```bash
  ls -la lib/openai/
  ```

### 4.4 Create PDF Parsing Utility

- [ ] **Task**: Create `lib/pdf/parser.ts`
  ```typescript
  import pdf from 'pdf-parse'

  export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer)
      let text = data.text

      // Basic cleaning
      text = text.replace(/\s+/g, ' ').trim()
      text = text.replace(/\n\d+\n/g, '\n')

      if (!text || text.length < 100) {
        throw new Error('Extracted text is too short or empty')
      }

      return text
    } catch (error) {
      console.error('PDF parsing error:', error)
      throw new Error('Failed to extract text from PDF')
    }
  }

  export function truncateText(text: string, maxLength: number = 12000): string {
    if (text.length <= maxLength) return text

    const truncated = text.substring(0, maxLength)
    const lastPeriod = truncated.lastIndexOf('.')

    if (lastPeriod > maxLength * 0.8) {
      return truncated.substring(0, lastPeriod + 1)
    }

    return truncated + '...'
  }
  ```

- [ ] **Validation**: Run TypeScript check
  ```bash
  npx tsc --noEmit
  ```

### 4.5 Create Utility Functions

- [ ] **Task**: Update `lib/utils.ts` (created by shadcn)
  ```typescript
  import { type ClassValue, clsx } from "clsx"
  import { twMerge } from "tailwind-merge"

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }

  export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  export function getAudienceLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      elementary: 'Elementary School',
      high_school: 'High School',
      phd: 'PhD Level',
    }
    return labels[level] || level
  }
  ```

- [ ] **Validation**: Run build check
  ```bash
  npm run build
  ```

---

## Phase 5: Authentication Implementation

### 5.1 Create Middleware for Route Protection

- [ ] **Task**: Create `middleware.ts` in project root
  ```typescript
  import { type NextRequest } from 'next/server'
  import { updateSession } from '@/lib/supabase/middleware'

  export async function middleware(request: NextRequest) {
    return await updateSession(request)
  }

  export const config = {
    matcher: [
      '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
  }
  ```

- [ ] **Validation**: Verify middleware.ts exists in root

### 5.2 Create Auth Components

- [ ] **Task**: Create `components/auth/LoginForm.tsx`
  ```typescript
  'use client'

  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { createClient } from '@/lib/supabase/client'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Alert, AlertDescription } from '@/components/ui/alert'

  export function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        router.push('/dashboard')
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'Failed to sign in')
      } finally {
        setLoading(false)
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    )
  }
  ```

- [ ] **Task**: Create `components/auth/SignupForm.tsx`
  ```typescript
  'use client'

  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { createClient } from '@/lib/supabase/client'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Alert, AlertDescription } from '@/components/ui/alert'

  export function SignupForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      setLoading(true)

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        router.push('/dashboard')
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'Failed to sign up')
      } finally {
        setLoading(false)
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>
    )
  }
  ```

- [ ] **Validation**: Check components exist
  ```bash
  ls -la components/auth/
  ```

### 5.3 Create Auth Pages

- [ ] **Task**: Create `app/(auth)/login/page.tsx`
  ```typescript
  import Link from 'next/link'
  import { LoginForm } from '@/components/auth/LoginForm'
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

  export default function LoginPage() {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Sign in to your PaperPal IQ account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }
  ```

- [ ] **Task**: Create `app/(auth)/signup/page.tsx`
  ```typescript
  import Link from 'next/link'
  import { SignupForm } from '@/components/auth/SignupForm'
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

  export default function SignupPage() {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Sign up for PaperPal IQ to start summarizing papers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }
  ```

- [ ] **Task**: Create `app/(auth)/layout.tsx`
  ```typescript
  export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {children}
      </div>
    )
  }
  ```

- [ ] **Validation**: Test auth pages
  ```bash
  npm run dev
  # Visit http://localhost:3000/login and /signup
  ```

### 5.4 Test Authentication

- [ ] **Task**: Start dev server and test signup
  - Go to http://localhost:3000/signup
  - Create a new account

- [ ] **Task**: Verify user in Supabase
  - Check Supabase Dashboard > Authentication > Users

- [ ] **Task**: Test login
  - Go to http://localhost:3000/login
  - Sign in with test credentials

- [ ] **Validation**: Check browser console for errors

---

## Phase 6: Dashboard & Document List

### 6.1 Create Dashboard Layout

- [ ] **Task**: Create `components/layout/Header.tsx`
  ```typescript
  'use client'

  import { useRouter } from 'next/navigation'
  import { createClient } from '@/lib/supabase/client'
  import { Button } from '@/components/ui/button'

  export function Header() {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }

    return (
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">PaperPal IQ</h1>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>
    )
  }
  ```

- [ ] **Task**: Create `app/dashboard/layout.tsx`
  ```typescript
  import { redirect } from 'next/navigation'
  import { createClient } from '@/lib/supabase/server'
  import { Header } from '@/components/layout/Header'

  export default async function DashboardLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    )
  }
  ```

- [ ] **Validation**: Check files exist
  ```bash
  ls -la components/layout/ app/dashboard/
  ```

### 6.2 Create Document List Component

- [ ] **Task**: Create `components/documents/DocumentList.tsx`
  ```typescript
  'use client'

  import { Document } from '@/lib/types'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'
  import { formatDistanceToNow } from 'date-fns'
  import Link from 'next/link'

  interface DocumentListProps {
    documents: Document[]
  }

  export function DocumentList({ documents }: DocumentListProps) {
    if (documents.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No documents yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload your first PDF to get started
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Link key={doc.id} href={`/documents/${doc.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {doc.title}
                  </CardTitle>
                  <Badge variant={doc.status === 'summarized' ? 'default' : 'secondary'}>
                    {doc.status}
                  </Badge>
                </div>
                <CardDescription>
                  Uploaded {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    )
  }
  ```

- [ ] **Validation**: Check component exists

### 6.3 Create Dashboard Page

- [ ] **Task**: Create `app/dashboard/page.tsx`
  ```typescript
  import { createClient } from '@/lib/supabase/server'
  import { DocumentList } from '@/components/documents/DocumentList'
  import { Button } from '@/components/ui/button'
  import Link from 'next/link'
  import { Document } from '@/lib/types'

  export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Documents</h1>
            <p className="text-muted-foreground mt-2">
              Upload and summarize academic papers
            </p>
          </div>
          <Link href="/dashboard/upload">
            <Button size="lg">Upload PDF</Button>
          </Link>
        </div>

        <DocumentList documents={(documents as Document[]) || []} />
      </div>
    )
  }
  ```

- [ ] **Validation**: Test dashboard
  ```bash
  npm run dev
  # Visit http://localhost:3000/dashboard
  ```

---

## Phase 7: File Upload Feature

### 7.1 Create Upload API Route

- [ ] **Task**: Create `app/api/upload/route.ts`
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { createClient } from '@/lib/supabase/server'

  export async function POST(request: NextRequest) {
    try {
      const supabase = await createClient()

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
      }

      const timestamp = Date.now()
      const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${user.id}/${timestamp}-${fileName}`

      const fileBuffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('papers')
        .upload(filePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
      }

      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: file.name.replace('.pdf', ''),
          file_path: filePath,
          status: 'uploaded',
        })
        .select()
        .single()

      if (dbError) {
        await supabase.storage.from('papers').remove([filePath])
        console.error('Database error:', dbError)
        return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
      }

      return NextResponse.json({ success: true, document })
    } catch (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  ```

- [ ] **Validation**: Verify route exists

### 7.2 Create Upload Form Component

- [ ] **Task**: Create `components/upload/UploadForm.tsx`
  ```typescript
  'use client'

  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Alert, AlertDescription } from '@/components/ui/alert'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { formatFileSize } from '@/lib/utils'

  export function UploadForm() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      setError(null)

      if (!selectedFile) {
        setFile(null)
        return
      }

      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file')
        setFile(null)
        return
      }

      const maxSize = 10 * 1024 * 1024
      if (selectedFile.size > maxSize) {
        setError('File size must be less than 10MB')
        setFile(null)
        return
      }

      setFile(selectedFile)
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      if (!file) {
        setError('Please select a file')
        return
      }

      setUploading(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed')
        }

        router.push(`/documents/${data.document.id}`)
      } catch (err: any) {
        setError(err.message || 'Failed to upload file')
      } finally {
        setUploading(false)
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload PDF</CardTitle>
          <CardDescription>
            Upload an academic paper in PDF format (max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="file">PDF File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({formatFileSize(file.size)})
                </p>
              )}
            </div>

            <Button type="submit" disabled={!file || uploading} className="w-full">
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }
  ```

- [ ] **Validation**: Check component exists

### 7.3 Create Upload Page

- [ ] **Task**: Create `app/dashboard/upload/page.tsx`
  ```typescript
  import { UploadForm } from '@/components/upload/UploadForm'
  import Link from 'next/link'
  import { Button } from '@/components/ui/button'

  export default function UploadPage() {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Upload Document</h1>
            <p className="text-muted-foreground mt-2">
              Upload a PDF to generate summaries
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <UploadForm />
      </div>
    )
  }
  ```

- [ ] **Validation**: Test upload page
  ```bash
  # Visit http://localhost:3000/dashboard/upload
  ```

### 7.4 Test File Upload

- [ ] **Task**: Test upload with a PDF file
  - Select a PDF (any PDF works)
  - Click "Upload PDF"
  - Should redirect to document page

- [ ] **Validation**: Check Supabase Storage and Database
  - Storage > papers bucket (file should be there)
  - Database > documents table (record should exist)

---

## Phase 8: Summary Generation

### 8.1 Create Summarization API Route

- [ ] **Task**: Create `app/api/summarize/route.ts`
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { createClient } from '@/lib/supabase/server'
  import { openai } from '@/lib/openai/client'
  import { createSummarizationPrompt } from '@/lib/openai/prompts'
  import { extractTextFromPDF, truncateText } from '@/lib/pdf/parser'
  import { AudienceLevel } from '@/lib/types'

  export async function POST(request: NextRequest) {
    try {
      const supabase = await createClient()

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await request.json()
      const { documentId, audienceLevel } = body

      if (!documentId || !audienceLevel) {
        return NextResponse.json({ error: 'Missing documentId or audienceLevel' }, { status: 400 })
      }

      const validLevels: AudienceLevel[] = ['elementary', 'high_school', 'phd']
      if (!validLevels.includes(audienceLevel)) {
        return NextResponse.json({ error: 'Invalid audience level' }, { status: 400 })
      }

      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (docError || !document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      const { data: existingSummary } = await supabase
        .from('summaries')
        .select('*')
        .eq('document_id', documentId)
        .eq('audience', audienceLevel)
        .single()

      if (existingSummary) {
        return NextResponse.json({ success: true, summary: existingSummary, cached: true })
      }

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('papers')
        .download(document.file_path)

      if (downloadError || !fileData) {
        return NextResponse.json({ error: 'Failed to download PDF' }, { status: 500 })
      }

      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      let paperText: string
      try {
        paperText = await extractTextFromPDF(buffer)
        paperText = truncateText(paperText, 12000)
      } catch (err) {
        console.error('PDF extraction error:', err)
        return NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 500 })
      }

      const prompt = createSummarizationPrompt(paperText, audienceLevel)

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      })

      const summaryText = completion.choices[0].message.content
      const tokensUsed = completion.usage?.total_tokens || 0

      if (!summaryText) {
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
      }

      const { data: summary, error: summaryError } = await supabase
        .from('summaries')
        .insert({
          document_id: documentId,
          audience: audienceLevel,
          summary_text: summaryText,
          tokens_used: tokensUsed,
        })
        .select()
        .single()

      if (summaryError) {
        console.error('Summary save error:', summaryError)
        return NextResponse.json({ error: 'Failed to save summary' }, { status: 500 })
      }

      await supabase
        .from('documents')
        .update({ status: 'summarized' })
        .eq('id', documentId)

      return NextResponse.json({ success: true, summary, cached: false })
    } catch (error) {
      console.error('Summarization error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  ```

- [ ] **Validation**: Verify route exists

### 8.2 Create Summary Display Components

- [ ] **Task**: Create `components/summaries/SummaryCard.tsx`
  ```typescript
  import { Summary } from '@/lib/types'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'
  import { getAudienceLevelLabel } from '@/lib/utils'

  interface SummaryCardProps {
    summary: Summary
  }

  export function SummaryCard({ summary }: SummaryCardProps) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Summary</CardTitle>
            <Badge>{getAudienceLevelLabel(summary.audience)}</Badge>
          </div>
          <CardDescription>
            {summary.tokens_used && `${summary.tokens_used} tokens used`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate max-w-none">
            {summary.summary_text.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  ```

- [ ] **Task**: Create `components/summaries/SummarizeButton.tsx`
  ```typescript
  'use client'

  import { useState } from 'react'
  import { Button } from '@/components/ui/button'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
  import { Alert, AlertDescription } from '@/components/ui/alert'
  import { AudienceLevel } from '@/lib/types'

  interface SummarizeButtonProps {
    documentId: string
    onSuccess: () => void
  }

  export function SummarizeButton({ documentId, onSuccess }: SummarizeButtonProps) {
    const [audienceLevel, setAudienceLevel] = useState<AudienceLevel>('high_school')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSummarize = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId, audienceLevel }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Summarization failed')
        }

        onSuccess()
      } catch (err: any) {
        setError(err.message || 'Failed to generate summary')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Select
            value={audienceLevel}
            onValueChange={(value) => setAudienceLevel(value as AudienceLevel)}
            disabled={loading}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elementary">Elementary School</SelectItem>
              <SelectItem value="high_school">High School</SelectItem>
              <SelectItem value="phd">PhD Level</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSummarize} disabled={loading}>
            {loading ? 'Generating Summary...' : 'Generate Summary'}
          </Button>
        </div>
      </div>
    )
  }
  ```

- [ ] **Validation**: Check components exist

---

## Phase 9: Document Detail Page

### 9.1 Create Document Detail Page

- [ ] **Task**: Create `app/documents/[id]/page.tsx`
  ```typescript
  import { redirect } from 'next/navigation'
  import Link from 'next/link'
  import { createClient } from '@/lib/supabase/server'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { SummaryCard } from '@/components/summaries/SummaryCard'
  import { SummarizeButton } from '@/components/summaries/SummarizeButton'
  import { DocumentWithSummaries } from '@/lib/types'
  import { formatDistanceToNow } from 'date-fns'

  interface PageProps {
    params: { id: string }
  }

  export default async function DocumentPage({ params }: PageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const { data: document, error } = await supabase
      .from('documents')
      .select(`*, summaries (*)`)
      .eq('id', params.id)
      .single()

    if (error || !document) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Document not found</p>
              <Link href="/dashboard">
                <Button className="mt-4">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )
    }

    const doc = document as unknown as DocumentWithSummaries

    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{doc.title}</h1>
            <p className="text-muted-foreground mt-2">
              Uploaded {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Summary</CardTitle>
            <CardDescription>
              Choose an audience level to generate a tailored summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SummarizeButton
              documentId={doc.id}
              onSuccess={() => window.location.reload()}
            />
          </CardContent>
        </Card>

        {doc.summaries && doc.summaries.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Summaries</h2>
            <div className="space-y-4">
              {doc.summaries.map((summary) => (
                <SummaryCard key={summary.id} summary={summary} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  ```

- [ ] **Validation**: Test document page

### 9.2 Test Summary Generation

- [ ] **Task**: Upload a document and generate summary
  - Upload a PDF
  - Select audience level
  - Click "Generate Summary"
  - Wait for completion

- [ ] **Task**: Generate multiple summaries
  - Try all three audience levels
  - Verify all appear on page

- [ ] **Validation**: Check summaries in Supabase Database

---

## Phase 10: Landing Page & Navigation

### 10.1 Create Landing Page

- [ ] **Task**: Update `app/page.tsx`
  ```typescript
  import Link from 'next/link'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

  export default function HomePage() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl font-bold tracking-tight">
              PaperPal IQ
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Make complex academic papers accessible to everyone.
              Upload a PDF and get summaries tailored to elementary, high school, or PhD level audiences.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Upload PDFs</CardTitle>
                <CardDescription>
                  Simply upload your academic papers in PDF format
                </CardDescription>
              </CardHeader>
              <CardContent>
                Support for ML/AI papers with automatic text extraction
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multiple Audiences</CardTitle>
                <CardDescription>
                  Get summaries for different reading levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                Elementary, High School, and PhD level explanations
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI-Powered</CardTitle>
                <CardDescription>
                  Advanced language models create accurate summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                Powered by OpenAI's GPT to ensure quality and accuracy
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</span>
                <div><strong>Sign up</strong> for a free account</div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</span>
                <div><strong>Upload</strong> your academic paper in PDF format</div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</span>
                <div><strong>Choose</strong> your target audience level</div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</span>
                <div><strong>Get</strong> an AI-generated summary in seconds</div>
              </li>
            </ol>
          </div>

          <div className="mt-16 text-center">
            <Link href="/signup">
              <Button size="lg">Start Summarizing Papers</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Validation**: Visit http://localhost:3000

### 10.2 Update Root Layout

- [ ] **Task**: Update `app/layout.tsx`
  ```typescript
  import type { Metadata } from 'next'
  import { Inter } from 'next/font/google'
  import './globals.css'

  const inter = Inter({ subsets: ['latin'] })

  export const metadata: Metadata = {
    title: 'PaperPal IQ - AI Paper Summarizer',
    description: 'Make complex academic papers accessible to everyone with AI-powered summaries',
  }

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    )
  }
  ```

- [ ] **Validation**: Check browser tab shows title

---

## Phase 11: Error Handling & Polish

### 11.1 Add Error Boundaries

- [ ] **Task**: Create `app/error.tsx`
  ```typescript
  'use client'

  import { useEffect } from 'react'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

  export default function Error({
    error,
    reset,
  }: {
    error: Error & { digest?: string }
    reset: () => void
  }) {
    useEffect(() => {
      console.error('Application error:', error)
    }, [error])

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Something went wrong!</CardTitle>
            <CardDescription>
              An unexpected error occurred. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Error: {error.message}
            </p>
            <Button onClick={reset} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  ```

- [ ] **Task**: Create `app/dashboard/error.tsx`
  ```typescript
  'use client'

  import { useEffect } from 'react'
  import Link from 'next/link'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

  export default function DashboardError({
    error,
    reset,
  }: {
    error: Error & { digest?: string }
    reset: () => void
  }) {
    useEffect(() => {
      console.error('Dashboard error:', error)
    }, [error])

    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>
              There was a problem loading your documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message}
            </p>
            <div className="flex gap-4">
              <Button onClick={reset}>Try Again</Button>
              <Link href="/">
                <Button variant="outline">Go Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  ```

- [ ] **Validation**: Check error pages exist

### 11.2 Add Loading States

- [ ] **Task**: Create `app/dashboard/loading.tsx`
  ```typescript
  import { Skeleton } from '@/components/ui/skeleton'
  import { Card, CardContent, CardHeader } from '@/components/ui/card'

  export default function DashboardLoading() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  ```

- [ ] **Task**: Create `app/documents/[id]/loading.tsx`
  ```typescript
  import { Skeleton } from '@/components/ui/skeleton'
  import { Card, CardContent, CardHeader } from '@/components/ui/card'

  export default function DocumentLoading() {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }
  ```

- [ ] **Validation**: Test loading states by throttling network

### 11.3 Add Not Found Page

- [ ] **Task**: Create `app/not-found.tsx`
  ```typescript
  import Link from 'next/link'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

  export default function NotFound() {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>404 - Page Not Found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  ```

- [ ] **Validation**: Visit /nonexistent to test

### 11.4 Add Toast Notifications

- [ ] **Task**: Install sonner
  ```bash
  npm install sonner
  ```

- [ ] **Task**: Create `components/providers/ToastProvider.tsx`
  ```typescript
  'use client'

  import { Toaster } from 'sonner'

  export function ToastProvider() {
    return <Toaster position="top-right" />
  }
  ```

- [ ] **Task**: Add ToastProvider to `app/layout.tsx`
  ```typescript
  import { ToastProvider } from '@/components/providers/ToastProvider'

  // In body:
  <body className={inter.className}>
    {children}
    <ToastProvider />
  </body>
  ```

- [ ] **Task**: Update `SummarizeButton.tsx` to use toasts
  ```typescript
  import { toast } from 'sonner'

  // Replace setError with toast.error
  // Add toast.success('Summary generated!')
  ```

- [ ] **Validation**: Test toasts appear

---

## Phase 12: Testing & Validation

### 12.1 Manual Testing Checklist

- [ ] **Test Authentication Flow**
  - Sign up with new email
  - Log out
  - Log back in
  - Try accessing /dashboard without login
  - Try API routes without auth

- [ ] **Test Upload Flow**
  - Upload valid PDF (under 10MB)
  - Try non-PDF file (should error)
  - Try file over 10MB (should error)
  - Verify in Supabase Storage
  - Verify in database

- [ ] **Test Summarization**
  - Generate elementary summary
  - Generate high school summary
  - Generate PhD summary
  - Verify different content
  - Check cached summaries work

- [ ] **Test Dashboard**
  - View all documents
  - Click document details
  - Upload multiple documents
  - Verify sorting by date

- [ ] **Test Error Handling**
  - Invalid document ID
  - Network disconnected
  - Corrupted PDF
  - Check error messages

- [ ] **Test UI/UX**
  - Mobile responsive (DevTools)
  - Different screen sizes
  - Loading states
  - Disabled buttons during load
  - All links work

### 12.2 Database Validation

- [ ] **Task**: Run validation script
  ```bash
  bash scripts/validate-schema.sh
  ```

- [ ] **Task**: Check Supabase Dashboard
  - RLS enabled on tables
  - Policies active
  - Storage bucket policies
  - Query data as different users

### 12.3 Environment Validation

- [ ] **Task**: Run environment check
  ```bash
  node scripts/check-env.js
  ```

- [ ] **Task**: Verify all variables
  ```bash
  cat .env.local
  ```

### 12.4 API Testing

- [ ] **Task**: Test API endpoints
  ```bash
  node scripts/test-api.js
  ```

- [ ] **Task**: Manual API testing with curl or Postman

---

## Phase 13: Code Quality & Documentation

### 13.1 Code Cleanup

- [ ] **Task**: Run linter
  ```bash
  npm run lint
  npm run lint -- --fix
  ```

- [ ] **Task**: Type checking
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Task**: Format code (optional)
  ```bash
  npm install -D prettier
  npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}"
  ```

- [ ] **Task**: Remove debug console.logs

- [ ] **Validation**: Run build
  ```bash
  npm run build
  ```

### 13.2 Security Review

- [ ] **Task**: Security checklist
  - ✓ Environment variables not committed
  - ✓ RLS enabled on all tables
  - ✓ File upload size limits
  - ✓ File type validation
  - ✓ Auth required for protected routes
  - ✓ Service role key server-side only
  - ✓ No secrets in client code

- [ ] **Task**: Check .gitignore
  ```bash
  cat .gitignore
  ```

- [ ] **Validation**: Search for secrets
  ```bash
  grep -r "sk-" --exclude-dir=node_modules .
  ```

---

## Phase 14: Deployment Preparation

### 14.1 Build Verification

- [ ] **Task**: Test production build
  ```bash
  npm run build
  npm run start
  ```

- [ ] **Task**: Visit http://localhost:3000
  - Test key flows
  - Check for warnings

- [ ] **Validation**: No build errors

### 14.2 Performance Optimization

- [ ] **Task**: Add `next.config.js` optimizations
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
  }

  module.exports = nextConfig
  ```

- [ ] **Task**: Review bundle size
  ```bash
  npm run build
  # Check output for bundle sizes
  ```

---

## Phase 15: Deployment to Vercel

### 15.1 Prepare GitHub Repository

- [ ] **Task**: Initialize git (if needed)
  ```bash
  git init
  git add .
  git commit -m "Initial commit - PaperPal IQ MVP"
  ```

- [ ] **Task**: Create GitHub repository
  - Go to https://github.com/new
  - Create new repository
  - Don't initialize with README

- [ ] **Task**: Push to GitHub
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/paperpal-iq.git
  git branch -M main
  git push -u origin main
  ```

- [ ] **Validation**: Check code on GitHub

### 15.2 Deploy to Vercel

- [ ] **Task**: Sign up for Vercel
  - Go to https://vercel.com
  - Sign up with GitHub

- [ ] **Task**: Import project
  - Click "Add New Project"
  - Select repository
  - Click "Import"

- [ ] **Task**: Configure project
  - Framework: Next.js (auto-detected)
  - Build Command: `npm run build`
  - Output Directory: (default)

- [ ] **Task**: Add environment variables
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `NEXT_PUBLIC_APP_URL` (add after deployment)

- [ ] **Task**: Deploy
  - Click "Deploy"
  - Wait for build (2-5 minutes)

- [ ] **Validation**: Visit Vercel URL

### 15.3 Post-Deployment Configuration

- [ ] **Task**: Update NEXT_PUBLIC_APP_URL
  - In Vercel: Settings > Environment Variables
  - Set to your Vercel URL
  - Redeploy

- [ ] **Task**: Update Supabase URLs
  - Supabase Dashboard > Authentication > URL Configuration
  - Site URL: `https://your-app.vercel.app`
  - Redirect URLs: `https://your-app.vercel.app/**`

- [ ] **Task**: Test auth on production
  - Create account
  - Test login
  - Test logout

### 15.4 Production Testing

- [ ] **Test Complete Flow**
  - Sign up
  - Upload PDF
  - Generate all summaries
  - View dashboard
  - Sign out and in

- [ ] **Test Error Cases**
  - Invalid file upload
  - Oversized file
  - Bad network

- [ ] **Check Performance**
  - Run Lighthouse audit
  - Check load times
  - No console errors

- [ ] **Validation**: Monitor Vercel logs

---

## Phase 16: Final Polish & Launch

### 16.1 Add Analytics (Optional)

- [ ] **Task**: Add Vercel Analytics
  ```bash
  npm install @vercel/analytics
  ```

- [ ] **Task**: Add to root layout
  ```typescript
  import { Analytics } from '@vercel/analytics/react'

  <body>
    {children}
    <Analytics />
  </body>
  ```

### 16.2 Final Checklist

- [ ] All features working in production
- [ ] Authentication tested
- [ ] File upload tested
- [ ] All audience levels working
- [ ] Error handling working
- [ ] Mobile responsive
- [ ] Loading states working
- [ ] No console errors
- [ ] Environment variables secured
- [ ] GitHub repository updated
- [ ] Documentation complete

### 16.3 Launch

- [ ] **Task**: Share your app
  - Tweet about it
  - Share with friends
  - Post on communities

- [ ] **Task**: Monitor
  - Check Vercel logs
  - Monitor Supabase usage
  - Track OpenAI costs
  - Fix bugs

---

## Troubleshooting Guide

### Common Issues

**"Unauthorized" error**
- Check if logged in
- Clear cookies and re-login
- Verify middleware.ts

**PDF upload fails**
- Check file size (<10MB)
- Verify file is PDF
- Check storage policies
- Verify bucket name

**Summary generation fails**
- Check OpenAI API key
- Verify API credits
- Check PDF text extraction
- Check logs

**Build fails on Vercel**
- Check env variables
- Run `npm run build` locally
- Check Vercel logs
- Verify dependencies

**RLS blocking queries**
- Check authentication
- Verify policies
- Test in Supabase SQL editor
- Check user_id matches

---

## Next Steps After MVP

1. **User Experience**
   - Summary comparison view
   - Streaming responses
   - Document search/filtering
   - Export summaries

2. **Features**
   - More file formats
   - Citation extraction
   - Document sharing
   - User settings

3. **Performance**
   - Caching strategy
   - Background jobs
   - Optimize PDF extraction
   - Rate limiting

4. **Monetization**
   - Usage limits
   - Stripe integration
   - Subscription plans
   - Team accounts

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

---

**Congratulations!** 🎉

You've completed the full implementation of PaperPal IQ MVP. This guide covered everything from initial setup to production deployment. Follow each phase sequentially, check off tasks as you complete them, and refer to troubleshooting when needed.

Happy coding!
