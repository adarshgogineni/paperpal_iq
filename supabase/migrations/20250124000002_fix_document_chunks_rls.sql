-- Fix RLS policies for document_chunks table
-- The API needs to be able to insert chunks when processing documents

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can view their document chunks" ON document_chunks;

-- Create comprehensive RLS policies for document_chunks

-- Policy: Users can view chunks of their own documents
CREATE POLICY "Users can view their document chunks"
  ON document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Policy: Users can insert chunks for their own documents
CREATE POLICY "Users can insert their document chunks"
  ON document_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Policy: Users can delete chunks of their own documents
CREATE POLICY "Users can delete their document chunks"
  ON document_chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND documents.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view their document chunks" ON document_chunks IS 'Allow users to view chunks from their own documents';
COMMENT ON POLICY "Users can insert their document chunks" ON document_chunks IS 'Allow users to insert chunks when processing their documents';
COMMENT ON POLICY "Users can delete their document chunks" ON document_chunks IS 'Allow users to delete chunks from their documents';
