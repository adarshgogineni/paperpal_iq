/**
 * Vector Similarity Search for RAG Retrieval
 *
 * Performs semantic search across document chunks using pgvector
 */

import { createClient } from "@/lib/supabase/server"
import { generateEmbedding } from "./embeddings"

export interface RetrievedChunk {
  id: string
  documentId: string
  content: string
  chunkIndex: number
  pageNumber: number | null
  similarity: number
}

export interface RetrievalOptions {
  matchThreshold?: number // Minimum similarity score (0-1)
  matchCount?: number // Number of chunks to retrieve
}

/**
 * Retrieve relevant chunks for a user query using vector similarity search
 *
 * @param query - User's question or search query
 * @param documentId - ID of the document to search within
 * @param options - Optional retrieval parameters
 * @returns Array of relevant chunks sorted by similarity
 */
export async function retrieveRelevantChunks(
  query: string,
  documentId: string,
  options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
  const { matchThreshold = 0.5, matchCount = 5 } = options

  try {
    const supabase = await createClient()

    // Generate embedding for the query
    const { embedding } = await generateEmbedding(query)

    // Call the match_document_chunks function defined in the migration
    const { data, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: embedding,
      match_document_id: documentId,
      match_threshold: matchThreshold,
      match_count: matchCount,
    })

    if (error) {
      console.error("Error retrieving chunks:", error)
      throw new Error(`Failed to retrieve chunks: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    // Map database results to RetrievedChunk interface
    return data.map((chunk: any) => ({
      id: chunk.id,
      documentId: chunk.document_id,
      content: chunk.content,
      chunkIndex: chunk.chunk_index,
      pageNumber: chunk.page_number,
      similarity: chunk.similarity,
    }))
  } catch (error) {
    console.error("Error in retrieveRelevantChunks:", error)
    throw error
  }
}

/**
 * Build context from retrieved chunks for RAG
 *
 * @param chunks - Retrieved chunks
 * @param maxTokens - Maximum tokens to include in context (default: 5000)
 * @returns Formatted context string
 */
export function buildContext(
  chunks: RetrievedChunk[],
  maxTokens: number = 5000
): string {
  if (chunks.length === 0) {
    return ""
  }

  let context = ""
  let currentTokens = 0

  // Estimate 4 characters per token
  const estimateTokens = (text: string) => Math.ceil(text.length / 4)

  for (const chunk of chunks) {
    const chunkText = `[Page ${chunk.pageNumber || "unknown"}, Section ${chunk.chunkIndex}]\n${chunk.content}\n\n`
    const tokens = estimateTokens(chunkText)

    if (currentTokens + tokens > maxTokens) {
      break
    }

    context += chunkText
    currentTokens += tokens
  }

  return context.trim()
}

/**
 * Format retrieved chunks for display in UI
 * Shows source information for transparency
 *
 * @param chunks - Retrieved chunks
 * @returns Array of formatted source citations
 */
export function formatChunkSources(chunks: RetrievedChunk[]): string[] {
  return chunks.map((chunk, index) => {
    const page = chunk.pageNumber ? `Page ${chunk.pageNumber}` : "Unknown page"
    const similarity = Math.round(chunk.similarity * 100)
    return `[${index + 1}] ${page} (${similarity}% relevant)`
  })
}

/**
 * Get chunk retrieval statistics
 * Useful for debugging and optimization
 *
 * @param chunks - Retrieved chunks
 */
export function getRetrievalStats(chunks: RetrievedChunk[]): {
  totalChunks: number
  avgSimilarity: number
  minSimilarity: number
  maxSimilarity: number
  pagesCovered: number[]
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgSimilarity: 0,
      minSimilarity: 0,
      maxSimilarity: 0,
      pagesCovered: [],
    }
  }

  const similarities = chunks.map((c) => c.similarity)
  const avgSimilarity =
    similarities.reduce((sum, s) => sum + s, 0) / similarities.length

  const pageNumbers = chunks
    .map((c) => c.pageNumber)
    .filter((p): p is number => p !== null)
  const pagesCovered = Array.from(new Set(pageNumbers)).sort((a, b) => a - b)

  return {
    totalChunks: chunks.length,
    avgSimilarity: Math.round(avgSimilarity * 100) / 100,
    minSimilarity: Math.min(...similarities),
    maxSimilarity: Math.max(...similarities),
    pagesCovered,
  }
}

/**
 * Hybrid search: Combine vector similarity with keyword matching
 * Useful for finding specific terms or technical concepts
 *
 * @param query - Search query
 * @param documentId - Document to search
 * @param options - Retrieval options
 */
export async function hybridSearch(
  query: string,
  documentId: string,
  options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
  // For now, just use vector search
  // In future: combine with PostgreSQL full-text search
  return retrieveRelevantChunks(query, documentId, options)
}
