# RAG Chat System Setup Guide

This guide explains how to set up and use the new RAG (Retrieval Augmented Generation) chat system that was added to PaperPal IQ.

## What is RAG?

RAG (Retrieval Augmented Generation) is a technique that enhances AI responses by:
1. Breaking documents into smaller chunks
2. Creating semantic embeddings (vector representations) of each chunk
3. Finding relevant chunks based on user questions using vector similarity search
4. Providing those chunks as context to the AI for more accurate answers

## Features

- **Conversational Q&A**: Ask questions about uploaded papers in natural language
- **Audience-Level Responses**: Get answers tailored to your selected expertise level (elementary through expert)
- **Source Attribution**: See which parts of the paper were used to answer each question
- **Chat History**: Continue conversations across sessions
- **Rate Limiting**: 50 messages per day per user (separate from summary limit)

## Setup Steps

### 1. Database Migration

Run the RAG migration in your Supabase dashboard:

```bash
# Location: supabase/migrations/20250124000001_rag_chat_system.sql
```

This migration will:
- Enable the `pgvector` extension
- Create `document_chunks`, `chat_sessions`, and `chat_messages` tables
- Add vector similarity search function
- Set up proper RLS policies

To apply the migration:
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `20250124000001_rag_chat_system.sql`
4. Execute the SQL
5. Verify success (should see "Success. No rows returned")

### 2. Verify Environment Variables

Ensure your `.env.local` has the OpenAI API key:

```bash
OPENAI_API_KEY=sk-...
```

The same key used for summaries will be used for RAG chat.

### 3. Process Documents for Chat

Before you can chat about a document, it needs to be processed:

1. Upload a PDF as usual
2. Navigate to the document detail page
3. Click the **"Chat"** tab
4. Click **"Process Document for Chat"**

This will:
- Extract full text from the PDF
- Split it into ~1000-token chunks with 200-token overlap
- Generate embeddings for each chunk using OpenAI
- Store everything in the database

**Processing time**: ~10-30 seconds for a 20-page paper
**Cost**: ~$0.0004 per paper (embeddings are very cheap)

### 4. Start Chatting

Once processed:
1. Click **"Start Chat"** on the Chat tab
2. Ask questions about the paper
3. Receive AI-generated answers based on the paper content
4. See source citations showing which parts of the paper were used

## Architecture

### Database Schema

```
document_chunks
  ├── id (UUID)
  ├── document_id (UUID, FK to documents)
  ├── chunk_index (INTEGER)
  ├── content (TEXT)
  ├── token_count (INTEGER)
  ├── page_number (INTEGER, nullable)
  └── embedding (vector(1536))

chat_sessions
  ├── id (UUID)
  ├── document_id (UUID, FK to documents)
  ├── user_id (UUID, FK to auth.users)
  ├── audience (TEXT)
  ├── title (TEXT)
  ├── created_at (TIMESTAMPTZ)
  └── updated_at (TIMESTAMPTZ)

chat_messages
  ├── id (UUID)
  ├── session_id (UUID, FK to chat_sessions)
  ├── role (TEXT: 'user' | 'assistant')
  ├── content (TEXT)
  ├── tokens_used (INTEGER)
  ├── context_chunks (UUID[])
  └── created_at (TIMESTAMPTZ)
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/documents/:id/process-chunks` | POST | Process document for chat |
| `/api/documents/:id/process-chunks` | GET | Check if document is processed |
| `/api/chat/sessions` | POST | Create new chat session |
| `/api/chat/sessions?documentId=:id` | GET | List chat sessions |
| `/api/chat/:sessionId/messages` | POST | Send message & get response |
| `/api/chat/:sessionId/messages` | GET | Get message history |

### How RAG Works (Step-by-Step)

1. **User asks a question**: "What is the main finding?"

2. **Question is embedded**: Generate vector embedding of the question using OpenAI

3. **Similarity search**: Find the 5 most relevant chunks using cosine similarity:
   ```sql
   SELECT * FROM document_chunks
   WHERE document_id = :id
   ORDER BY embedding <=> :query_embedding
   LIMIT 5
   ```

4. **Build context**: Combine relevant chunks into context string

5. **Generate response**: Send to OpenAI with:
   - System prompt (includes audience-level instructions)
   - Context from retrieved chunks
   - Recent conversation history (last 10 messages)
   - User's question

6. **Return answer**: AI responds based on the context provided

7. **Track sources**: Store which chunks were used in `context_chunks` array

## Cost Breakdown

### One-Time Processing (per document)
```
Average 20-page paper:
- Text: ~20,000 tokens
- Chunks: ~20 chunks
- Embeddings cost: $0.0004
```

### Per Message
```
Components:
- Query embedding: ~50 tokens = $0.000001
- Context retrieval: 5 chunks × 1000 tokens = 5000 tokens input
- System prompt: ~200 tokens
- User question: ~50 tokens
- AI response: ~500 tokens output

Cost breakdown:
- Input tokens (5,250 × $0.150/1M): $0.0008
- Output tokens (500 × $0.600/1M): $0.0003
- Total per message: ~$0.0011

Daily limit (50 messages): ~$0.055
Monthly (1500 messages): ~$1.65
```

### Comparison to Summaries
- Summary generation: $0.0023 each
- Chat message: $0.0011 each
- Chat provides more value through interactive Q&A

## Configuration Options

### Chunking Parameters (lib/rag/chunker.ts)
```typescript
const DEFAULT_CHUNK_SIZE = 1000  // tokens
const DEFAULT_OVERLAP = 200      // tokens
```

### Retrieval Parameters (lib/rag/retrieval.ts)
```typescript
const DEFAULT_MATCH_THRESHOLD = 0.5  // Minimum similarity (0-1)
const DEFAULT_MATCH_COUNT = 5        // Number of chunks
```

### Rate Limits (app/api/chat/[sessionId]/messages/route.ts)
```typescript
const MAX_CHAT_MESSAGES = 50  // per day per user
```

## Troubleshooting

### "Document chunks not generated"
- Click "Process Document for Chat" button
- Wait for processing to complete
- Check browser console for errors

### "No relevant content found"
- Try rephrasing your question
- Ask about specific topics mentioned in the paper
- Lower the similarity threshold in retrieval.ts

### Slow responses
- Normal for first message in session (cold start)
- Subsequent messages should be faster (~2-5 seconds)
- Processing large documents may take longer

### High costs
- Monitor usage in OpenAI dashboard
- Adjust `MAX_CHAT_MESSAGES` rate limit
- Consider using smaller chunk sizes for fewer embeddings

## Development

### Testing the RAG System

1. **Unit Tests**: Test chunking and embedding functions
   ```typescript
   import { chunkText, isValidChunk } from '@/lib/rag/chunker'
   import { generateEmbedding } from '@/lib/rag/embeddings'
   ```

2. **Integration Tests**: Test full flow
   - Upload a test PDF
   - Process chunks
   - Create chat session
   - Send test questions
   - Verify responses contain relevant info

3. **Performance Tests**:
   - Measure chunk processing time
   - Monitor embedding API latency
   - Test vector search performance
   - Check response generation speed

### Extending the System

**Add more context to responses**:
```typescript
// In retrieval.ts, increase match count
const DEFAULT_MATCH_COUNT = 10  // More chunks = more context
```

**Implement streaming responses**:
```typescript
// In messages route, use OpenAI streaming API
const stream = await openai.chat.completions.create({
  stream: true,
  // ... other params
})
```

**Add multi-document chat**:
```typescript
// Modify retrieval to search across multiple documents
const chunks = await retrieveFromMultipleDocuments([doc1, doc2, doc3], query)
```

## FAQ

**Q: Can I chat about a paper without generating summaries?**
A: Yes! Chat and summaries are independent. You can use either or both.

**Q: How accurate are the answers?**
A: Answers are based on the paper content retrieved through semantic search. Accuracy depends on:
- Quality of the paper's writing
- Relevance of retrieved chunks
- Clarity of your question

**Q: Can I delete chat history?**
A: Yes, delete individual sessions through the UI (feature to be added) or manually in Supabase.

**Q: What happens if I upload a new version of a paper?**
A: Chunks are tied to the document ID. If you upload a new file, you'll need to process it again.

**Q: Can I export chat conversations?**
A: Not currently, but this can be added. Chat data is stored in `chat_messages` table.

## Security & Privacy

- **RLS Policies**: Users can only access their own documents and chats
- **Rate Limiting**: Prevents API abuse
- **Data Isolation**: All vector search is scoped to user's own documents
- **No External Sharing**: Chats remain private, only sent to OpenAI for processing

## Performance Optimization

1. **Indexing**: IVFFlat index on embeddings speeds up similarity search
2. **Batch Processing**: Chunks processed in batches of 50 for faster embedding
3. **Caching**: Embeddings cached in database, never regenerated
4. **Pagination**: Chat sessions and messages paginated for large datasets

## Next Steps

1. **Run the migration** in Supabase
2. **Upload a test paper** to verify the system works
3. **Process it for chat** and ask some questions
4. **Monitor costs** in your OpenAI dashboard
5. **Adjust parameters** based on your needs

## Support

If you encounter issues:
1. Check browser console for error messages
2. Review Supabase logs for database errors
3. Check OpenAI dashboard for API errors
4. Verify environment variables are set correctly

---

**Implemented by**: Claude Code
**Date**: January 24, 2025
**Version**: 1.0.0
