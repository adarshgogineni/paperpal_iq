# API Endpoint Testing

Test the core API endpoints for PaperPal IQ to ensure they're working correctly.

## Endpoints to Test

### 1. Upload Endpoint
- **Route**: `POST /api/upload`
- **Test**: Upload a sample PDF file
- **Expected**: 200 OK with document ID and metadata
- **Checks**: File stored in Supabase, DB record created

### 2. Summarize Endpoint
- **Route**: `POST /api/summarize`
- **Payload**: `{ documentId: string, audienceLevel: string }`
- **Test**: Generate summary for uploaded document
- **Expected**: 200 OK with summary text
- **Checks**: OpenAI API called, summary saved to DB

### 3. List Documents
- **Route**: `GET /api/documents`
- **Test**: Fetch user's documents
- **Expected**: 200 OK with array of documents
- **Checks**: RLS policies working, only user's docs returned

### 4. Get Document Details
- **Route**: `GET /api/documents/:id`
- **Test**: Fetch specific document with summaries
- **Expected**: 200 OK with document and all summaries
- **Checks**: All audience levels returned correctly

## Testing Methods

### Manual Testing
Use the development server and test via browser or Postman

### Automated Testing
Run: `npm test` (when test suite is implemented)

### Quick Health Check
Run: `node scripts/test-api.js` to run basic endpoint health checks

## Common Issues

- **401 Unauthorized**: Check Supabase auth token in request headers
- **403 Forbidden**: Verify RLS policies are configured
- **500 Server Error**: Check OpenAI API key and rate limits
- **File Upload Fails**: Verify Supabase Storage bucket exists and has correct permissions
