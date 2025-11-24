# PaperPal IQ

> AI-powered research paper summarization tool that generates audience-tailored summaries

![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![React](https://img.shields.io/badge/React-18.3.1-61dafb)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991)

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Architecture & Implementation](#architecture--implementation)
- [Database Design](#database-design)
- [Setup & Installation](#setup--installation)
- [Deployment](#deployment)
- [Interview Preparation](#interview-preparation)

## 🎯 Overview

PaperPal IQ is a full-stack web application that allows users to upload research papers (PDFs) and receive AI-generated summaries tailored to five different audience levels: elementary, high school, undergraduate, graduate, and expert. The application uses OpenAI's GPT-4o-mini model to generate contextually appropriate summaries and implements rate limiting to control API costs.

**Live Demo:** [Coming Soon]

## 🛠 Tech Stack

### Frontend
- **Next.js 14.2.5** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5.3.3** - Type safety
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Reusable component library built on Radix UI
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering for summaries

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email/password)
  - Storage (file uploads)
  - Row Level Security (RLS)
- **OpenAI API** - GPT-4o-mini for text generation
- **pdf-parse** - PDF text extraction

### DevOps & Deployment
- **Vercel** - Hosting and CI/CD
- **Git/GitHub** - Version control
- **ESLint** - Code linting
- **Zod** - Runtime validation

## ✨ Key Features

### 1. User Authentication
- Email/password authentication via Supabase Auth
- Server-side session management with HTTP-only cookies
- Secure password reset flow
- Protected routes with middleware

### 2. Document Management
- PDF upload with drag-and-drop support
- File validation (type, size limits)
- Secure storage in Supabase Storage
- Real-time upload progress indicator
- Document metadata tracking (title, size, upload date)

### 3. AI-Powered Summarization
- Five audience levels with custom prompts:
  - **Elementary**: Simple language, basic concepts
  - **High School**: Accessible explanations with some technical terms
  - **Undergraduate**: Academic language with detailed concepts
  - **Graduate**: Advanced terminology and research focus
  - **Expert**: Full technical depth for peers
- PDF text extraction with cleaning/preprocessing
- Context-aware summarization (12,000 character limit)
- Token usage tracking
- Summary caching (same document + audience = cached result)

### 4. Rate Limiting
- 5 summaries per user per day (UTC-based reset)
- Database-backed rate limiting
- Cached summaries don't count against limit
- Clear user feedback on remaining quota

### 5. Error Handling & UX
- React Error Boundaries for crash recovery
- Custom 404 and error pages
- Loading states with skeleton loaders
- Network error detection and user-friendly messages
- Input validation with Zod schemas
- Comprehensive form validation

### 6. Responsive Design
- Mobile-first approach
- Tailwind CSS responsive utilities
- Accessible UI components (Radix UI primitives)
- Consistent design system

## 🏗 Architecture & Implementation

### Application Structure

```
paperpal_iq/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── documents/            # Document listing
│   │   ├── summaries/            # Summary generation
│   │   └── upload/               # File upload handler
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── callback/             # OAuth callback
│   │   └── actions/              # Server actions
│   ├── dashboard/                # Protected routes
│   │   ├── documents/[id]/       # Document detail page
│   │   └── page.tsx              # Dashboard home
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── error.tsx                 # Global error handler
│   ├── not-found.tsx             # 404 page
│   └── favicon.ico               # App icons
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/                # Dashboard-specific
│   ├── documents/                # Document-related
│   ├── upload/                   # Upload components
│   └── error-boundary.tsx        # Error boundary
├── lib/                          # Utilities
│   ├── openai/                   # OpenAI integration
│   │   ├── prompts.ts            # Audience prompts
│   │   └── summarize.ts          # Summary generation
│   ├── pdf/                      # PDF processing
│   │   └── extractor.ts          # Text extraction
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   └── types/                    # TypeScript types
│       └── database.ts           # Database types
├── supabase/                     # Supabase configuration
│   └── migrations/               # SQL migrations
├── middleware.ts                 # Auth middleware
└── vercel.json                   # Deployment config
```

### Key Technical Decisions

#### 1. **Why Next.js App Router?**
- **Server Components**: Reduce client-side JavaScript, better performance
- **API Routes**: Serverless functions for backend logic
- **Middleware**: Centralized auth checking
- **File-based routing**: Intuitive project structure
- **Built-in optimization**: Image optimization, font loading, code splitting

#### 2. **Why Supabase over Firebase?**
- **PostgreSQL**: Relational database with ACID guarantees
- **Row Level Security**: Database-level security policies
- **SQL migrations**: Version-controlled schema changes
- **Type generation**: Auto-generate TypeScript types from schema
- **Open source**: Can self-host if needed
- **Built on proven tech**: PostgreSQL, PostgREST

#### 3. **Why GPT-4o-mini over GPT-4?**
- **Cost efficiency**: ~60x cheaper than GPT-4
- **Speed**: Faster response times (~2-3 seconds vs 5-10)
- **Sufficient quality**: Adequate for summarization tasks
- **Rate limiting**: Lower cost per summary enables free tier

#### 4. **PDF Processing Approach**
```typescript
// Text extraction pipeline:
1. Upload PDF → Supabase Storage
2. Download PDF as buffer
3. Extract text with pdf-parse
4. Clean text (remove headers, footers, page numbers)
5. Truncate to 12,000 characters (~3,000 tokens)
6. Send to OpenAI with audience-specific prompt
```

**Why this approach?**
- **Server-side**: Keeps API keys secure
- **Truncation**: Controls costs, focuses on main content
- **Cleaning**: Improves summary quality by removing noise

#### 5. **Authentication Flow**
```typescript
// Middleware-based protection:
1. User requests protected route
2. Middleware checks Supabase session cookie
3. If valid: Continue to route
4. If invalid: Redirect to /auth/login

// Server components fetch user:
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

**Benefits:**
- No client-side checks (more secure)
- HTTP-only cookies (XSS protection)
- Automatic session refresh
- Works with server components

## 🗄 Database Design

### Schema

```sql
-- Users (managed by Supabase Auth)

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  status TEXT CHECK (status IN ('uploaded', 'processing', 'completed', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Summaries table
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  audience TEXT CHECK (audience IN ('elementary', 'high_school', 'undergraduate', 'graduate', 'expert')),
  summary_text TEXT NOT NULL,
  tokens_used INTEGER,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, audience) -- Prevent duplicate summaries
);

-- Rate limits table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  summaries_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date) -- One record per user per day
);
```

### Row Level Security Policies

```sql
-- Documents: Users can only access their own documents
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Summaries: Users can only access summaries of their documents
CREATE POLICY "Users can view their own summaries"
  ON summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = summaries.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Similar policies for rate_limits
```

### Indexes

```sql
-- Performance optimization
CREATE INDEX documents_user_id_idx ON documents(user_id);
CREATE INDEX summaries_document_id_idx ON summaries(document_id);
CREATE INDEX rate_limits_user_id_date_idx ON rate_limits(user_id, date);
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/paperpal-iq.git
cd paperpal-iq
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your keys
3. Run the migrations:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `supabase/migrations/*.sql`
   - Execute each migration in order

### 4. Configure Environment Variables

Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 5. Set Up Supabase Storage

1. Go to Storage in Supabase dashboard
2. Create a new bucket named `papers`
3. Set bucket to **private** (not public)
4. Add storage policy:
```sql
CREATE POLICY "Users can upload their own papers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'papers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own papers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'papers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 6. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 7. Build for Production
```bash
npm run build
npm start
```

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**
   - Add all variables from `.env.local` to Vercel dashboard
   - Go to Settings → Environment Variables

4. **Update Supabase Settings**
   - Add your Vercel URL to Supabase Auth settings:
     - Go to Authentication → URL Configuration
     - Add `https://your-app.vercel.app/auth/callback`
   - Update CORS settings in Storage

5. **Deploy**
   - Vercel deploys automatically on push to main
   - Each PR gets a preview deployment

### Environment Variables in Production
```bash
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

## 📚 Project Understanding

### Common Questions & Answers

#### **Q: Why did you choose this tech stack?**
**A:** I chose Next.js 14 with the App Router because it provides server-side rendering out of the box, which is crucial for SEO and initial page load performance. The App Router's server components reduce JavaScript bundle size by rendering components on the server. Supabase was chosen for its PostgreSQL database with Row Level Security, which provides better data integrity than NoSQL alternatives and automatic API generation. OpenAI's GPT-4o-mini offers the best cost-to-quality ratio for summarization tasks.

#### **Q: How does your rate limiting work?**
**A:** I implemented database-backed rate limiting with a unique constraint on `(user_id, date)` in the `rate_limits` table. Each summary generation increments the counter, but cached summaries bypass the limit check entirely. The limit resets at midnight UTC automatically through the date-based constraint. This approach is more reliable than in-memory rate limiting because it persists across server restarts and works in serverless environments.

#### **Q: How do you ensure security?**
**A:** Security is implemented at multiple layers:
1. **Authentication**: HTTP-only cookies prevent XSS attacks
2. **Authorization**: Row Level Security policies in PostgreSQL ensure users can only access their own data
3. **API Keys**: Stored server-side only, never exposed to client
4. **File Validation**: Client and server-side validation of file types and sizes
5. **Input Validation**: Zod schemas validate all form inputs
6. **CSRF Protection**: Built into Next.js
7. **Security Headers**: X-Frame-Options, X-Content-Type-Options via vercel.json

#### **Q: How does the PDF processing work?**
**A:** The flow is:
1. User uploads PDF → validated client-side (type, size)
2. Next.js API route receives file → validated server-side
3. File uploaded to Supabase Storage with user ID prefix
4. Database record created with file path
5. When summary requested:
   - PDF downloaded from Supabase
   - Text extracted with pdf-parse library
   - Text cleaned (remove headers, footers, page numbers)
   - Truncated to 12,000 chars (~3,000 tokens) to control costs
   - Sent to OpenAI with audience-specific prompt
   - Response saved to database

#### **Q: How do you handle errors?**
**A:** Multi-layered error handling:
1. **Client-side**: React Error Boundaries catch rendering errors
2. **Form validation**: Zod schemas with user-friendly error messages
3. **Network errors**: Detected via TypeError, shown with "check your connection" message
4. **API errors**: Specific status codes (401, 404, 429, 500) with contextual messages
5. **Global error page**: Catches unhandled errors with recovery options
6. **Logging**: Errors logged to console (would use Sentry in production)

#### **Q: What would you improve if you had more time?**
**A:**
1. **Testing**: Add Jest/React Testing Library for unit tests, Playwright for E2E
2. **Analytics**: Track user behavior with PostHog or Plausible
3. **Advanced summaries**: Add bullet points, key findings, citation extraction
4. **Document organization**: Folders, tags, search functionality
5. **Collaboration**: Share summaries with other users
6. **Export**: PDF export of summaries, citation generation
7. **Performance**: Add Redis caching for frequently accessed summaries
8. **Monitoring**: Sentry for error tracking, Vercel Analytics
9. **Accessibility**: Full WCAG 2.1 AA compliance audit
10. **i18n**: Multi-language support

#### **Q: How do you ensure good UX?**
**A:**
1. **Loading states**: Skeleton loaders match final content structure
2. **Progress indicators**: Upload progress bar with percentage
3. **Optimistic UI**: Immediate feedback before server response
4. **Error recovery**: Clear error messages with actionable solutions
5. **Responsive design**: Mobile-first approach, tested on multiple devices
6. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
7. **Performance**: Lazy loading, code splitting, optimized images

#### **Q: How would this scale?**
**A:**
Current architecture scales well:
- **Serverless**: Next.js API routes scale automatically on Vercel
- **Database**: Supabase (PostgreSQL) can handle millions of rows with proper indexes
- **Storage**: Supabase Storage is built on S3, infinitely scalable
- **CDN**: Vercel Edge Network for global distribution

Bottlenecks and solutions:
1. **OpenAI API**: Currently synchronous - could implement queue (BullMQ + Redis)
2. **Database connections**: Use connection pooling (Supabase has PgBouncer)
3. **File storage costs**: Implement cleanup job to delete old documents
4. **Rate limiting**: Current implementation works for 100K+ users

#### **Q: Explain your database schema choices**
**A:**
- **UUIDs over auto-increment IDs**: Better for distributed systems, no leaking of count info
- **Unique constraint on (document_id, audience)**: Prevents duplicate summaries, acts as cache
- **Cascading deletes**: Automatically clean up summaries when documents deleted
- **Timestamps**: Audit trail, useful for debugging and analytics
- **Status enum**: Ensures data integrity, prevents invalid states
- **Indexes on foreign keys**: Dramatically speeds up joins and queries
- **RLS policies**: Security at database layer, can't be bypassed even if API has bugs

#### **Q: How do you manage state in React?**
**A:** I use appropriate tools for different types of state:
1. **Server state**: Next.js Server Components (no client-side state needed)
2. **Form state**: React `useState` + Zod validation
3. **URL state**: Next.js router for pagination, filters
4. **Local UI state**: `useState` for modals, toggles, temporary values
5. **No global state needed**: Props drilling avoided through component composition

I specifically avoided Redux/Zustand because:
- Server components eliminate much state management
- This app doesn't have complex shared state
- `useContext` would suffice if needed

## 📄 License

MIT License - feel free to use this project for learning or as a portfolio piece.

## 🙏 Acknowledgments

- **OpenAI** - GPT-4o-mini API
- **Supabase** - Backend infrastructure
- **Vercel** - Hosting and deployment
- **shadcn/ui** - Component library
- **Next.js** - React framework

---

**Built with ❤️ by Adarsh Gogineni**

