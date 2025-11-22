# AI Paper Summarizer – MVP Plan

## 1. Product & Scope (MVP)

### Core Idea

Users upload a PDF of a complex ML/AI paper → choose an audience level:

- **Elementary schooler**
- **High schooler**
- **PhD candidate**

The app uses the ChatGPT API to produce a summary tailored to that level, shows it in the UI, and stores it per-user.

### User Flows (MVP)

1. **Auth & Account**
   - User signs up / logs in (email + password via Supabase).
   - After login, they see a dashboard of their past uploaded papers & summaries.

2. **Upload and Summarize**
   - User uploads a PDF file.
   - Chooses audience level: elementary / high school / PhD.
   - Clicks **Summarize**.
   - Backend:
     - Stores the PDF.
     - Extracts text.
     - Calls ChatGPT with a prompt tailored to the selected audience level.
     - Saves summary in DB.
   - Frontend shows:
     - Paper title (or filename).
     - Audience level.
     - Summary text.

3. **History**
   - Dashboard lists previous documents.
   - Clicking a document shows:
     - Basic metadata (filename, uploaded at).
     - Summaries by level (if multiple have been generated).

### Out of Scope for v1

- No advanced chunking / citations.
- No document sharing between users.
- No billing / payments.
- No streaming UI (add later if desired).

---

## 2. High-level Architecture

### Stack

- **Frontend & Backend:** Next.js (App Router, TypeScript).
- **Auth & DB & Storage:** Supabase.
- **LLM:** OpenAI Chat API.
- **Styling:** Tailwind CSS (optionally with a UI kit like shadcn).

### Architecture Overview

- **Client (Next.js)**
  - Pages/routes:
    - `/login`
    - `/signup`
    - `/dashboard`
    - `/documents/[id]`
  - Features:
    - Upload form for PDF.
    - Audience level selector.
    - Summaries display.

- **Server (Next.js Route Handlers / API Routes)**
  - `POST /api/upload`
    - Handle PDF upload.
    - Store in Supabase Storage.
    - Insert `documents` DB record.
  - `POST /api/summarize`
    - Given `documentId` + `audienceLevel`.
    - Download & parse PDF.
    - Call OpenAI.
    - Insert `summaries` DB record.
  - `GET /api/documents`
    - List current user’s documents.
  - `GET /api/documents/:id`
    - Get one document + summaries.

- **Supabase**
  - Auth: email/password.
  - DB Tables:
    - `documents`
    - `summaries`
  - Storage:
    - `papers` bucket for PDF files.

- **Middleware**
  - Next.js `middleware.ts` to protect routes (`/dashboard`, `/documents/*`).
  - Supabase auth helpers to get current user on server.

---

## 3. Data Model

### Tables

#### `documents`

| Column       | Type        | Notes                                    |
|--------------|-------------|------------------------------------------|
| `id`         | uuid (PK)   | `default uuid_generate_v4()`            |
| `user_id`    | uuid        | `references auth.users(id)`             |
| `title`      | text        | Filename or parsed title                |
| `file_path`  | text        | Path in Supabase Storage                |
| `status`     | text        | e.g. `uploaded`, `summarized`           |
| `created_at` | timestamptz | `default now()`                         |

#### `summaries`

| Column         | Type        | Notes                                                |
|----------------|-------------|------------------------------------------------------|
| `id`           | uuid (PK)   |                                                      |
| `document_id`  | uuid        | `references documents(id)`                           |
| `audience`     | text        | `elementary` \| `high_school` \| `phd`              |
| `summary_text` | text        | LLM output                                           |
| `tokens_used`  | integer     | Optional, from OpenAI usage                          |
| `created_at`   | timestamptz | `default now()`                                      |

### Row Level Security (RLS)

Enable RLS on `documents` and `summaries`. Example policies (pseudo-SQL):

```sql
-- documents: SELECT and INSERT restricted to owner
CREATE POLICY "Users can see their docs"
ON documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their docs"
ON documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- summaries: user can only access summaries for their own documents
CREATE POLICY "Users can see their summaries"
ON summaries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = summaries.document_id
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their summaries"
ON summaries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_id
    AND d.user_id = auth.uid()
  )
);
