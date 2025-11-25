/**
 * Embedding Generation Service for RAG System
 *
 * Uses OpenAI's text-embedding-3-small model to generate vector embeddings
 * for document chunks and user queries.
 */

import { getOpenAIClient } from "@/lib/openai/client"

const openai = getOpenAIClient()

export interface EmbeddingResult {
  embedding: number[]
  tokens: number
}

export interface BatchEmbeddingResult {
  embeddings: number[][]
  totalTokens: number
}

/**
 * Generate embedding for a single text
 *
 * @param text - Text to embed
 * @returns Embedding vector and token count
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    })

    if (!response.data || response.data.length === 0) {
      throw new Error("No embedding data returned from OpenAI")
    }

    return {
      embedding: response.data[0].embedding,
      tokens: response.usage.total_tokens,
    }
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw new Error(
      error instanceof Error
        ? `Failed to generate embedding: ${error.message}`
        : "Failed to generate embedding"
    )
  }
}

/**
 * Generate embeddings for multiple texts in a single batch
 * More efficient than individual calls for processing document chunks
 *
 * @param texts - Array of texts to embed (max 2048 per batch)
 * @returns Array of embedding vectors and total tokens
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<BatchEmbeddingResult> {
  if (texts.length === 0) {
    return { embeddings: [], totalTokens: 0 }
  }

  // OpenAI allows up to 2048 inputs per batch
  if (texts.length > 2048) {
    throw new Error("Batch size exceeds maximum of 2048 texts")
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      encoding_format: "float",
    })

    if (!response.data || response.data.length === 0) {
      throw new Error("No embedding data returned from OpenAI")
    }

    // OpenAI returns embeddings in the same order as input
    const embeddings = response.data.map((item) => item.embedding)

    return {
      embeddings,
      totalTokens: response.usage.total_tokens,
    }
  } catch (error) {
    console.error("Error generating batch embeddings:", error)
    throw new Error(
      error instanceof Error
        ? `Failed to generate embeddings: ${error.message}`
        : "Failed to generate embeddings"
    )
  }
}

/**
 * Process large batches by splitting into smaller chunks
 * Useful when processing hundreds or thousands of document chunks
 *
 * @param texts - Array of texts to embed
 * @param batchSize - Size of each batch (default: 100)
 * @returns Array of all embeddings and total tokens
 */
export async function generateEmbeddingsLargeBatch(
  texts: string[],
  batchSize: number = 100
): Promise<BatchEmbeddingResult> {
  const allEmbeddings: number[][] = []
  let totalTokens = 0

  // Process in batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const result = await generateEmbeddingsBatch(batch)

    allEmbeddings.push(...result.embeddings)
    totalTokens += result.totalTokens

    // Small delay to avoid rate limiting (adjust as needed)
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return {
    embeddings: allEmbeddings,
    totalTokens,
  }
}

/**
 * Calculate embedding cost estimate
 * text-embedding-3-small: $0.02 per 1M tokens
 *
 * @param tokenCount - Number of tokens
 * @returns Cost in USD
 */
export function estimateEmbeddingCost(tokenCount: number): number {
  const costPer1MTokens = 0.02
  return (tokenCount / 1_000_000) * costPer1MTokens
}

/**
 * Validate embedding dimensions
 * text-embedding-3-small produces 1536-dimensional vectors
 *
 * @param embedding - Embedding vector to validate
 * @returns True if valid
 */
export function isValidEmbedding(embedding: number[]): boolean {
  if (!Array.isArray(embedding)) {
    return false
  }

  if (embedding.length !== 1536) {
    return false
  }

  // Check that all values are numbers
  return embedding.every((val) => typeof val === "number" && !isNaN(val))
}

/**
 * Calculate cosine similarity between two embeddings
 * Useful for testing and validation
 *
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Similarity score between -1 and 1 (1 = identical)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same dimensions")
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    magnitudeA += a[i] * a[i]
    magnitudeB += b[i] * b[i]
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dotProduct / (magnitudeA * magnitudeB)
}
