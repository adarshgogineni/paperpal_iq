/**
 * Text Chunking Utility for RAG System
 *
 * Splits documents into smaller chunks for embedding generation.
 * Uses token-based chunking with overlap to preserve context.
 */

export interface TextChunk {
  content: string
  chunkIndex: number
  tokenCount: number
  pageNumber?: number
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Split text into sentences while preserving structure
 */
function splitIntoSentences(text: string): string[] {
  // Split on period, exclamation, or question mark followed by whitespace
  // Also handle common abbreviations like Dr., Mr., etc.
  const sentences = text
    .replace(/([.!?])\s+(?=[A-Z])/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  return sentences
}

/**
 * Chunk text into segments with specified token size and overlap
 *
 * @param text - Full text to chunk
 * @param chunkSize - Target size in tokens (default: 1000)
 * @param overlapSize - Overlap between chunks in tokens (default: 200)
 * @returns Array of text chunks with metadata
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlapSize: number = 200
): TextChunk[] {
  const chunks: TextChunk[] = []

  if (!text || text.trim().length === 0) {
    return chunks
  }

  // Clean the text
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Split into sentences for better chunk boundaries
  const sentences = splitIntoSentences(cleanedText)

  let currentChunk: string[] = []
  let currentTokens = 0
  let chunkIndex = 0

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    const sentenceTokens = estimateTokens(sentence)

    // If adding this sentence would exceed chunk size, save current chunk
    if (currentTokens + sentenceTokens > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      const chunkContent = currentChunk.join(' ')
      chunks.push({
        content: chunkContent,
        chunkIndex: chunkIndex++,
        tokenCount: estimateTokens(chunkContent)
      })

      // Calculate overlap: keep last few sentences for context
      const overlapSentences: string[] = []
      let overlapTokens = 0

      for (let j = currentChunk.length - 1; j >= 0; j--) {
        const overlapSentence = currentChunk[j]
        const tokens = estimateTokens(overlapSentence)

        if (overlapTokens + tokens <= overlapSize) {
          overlapSentences.unshift(overlapSentence)
          overlapTokens += tokens
        } else {
          break
        }
      }

      // Start new chunk with overlap
      currentChunk = overlapSentences
      currentTokens = overlapTokens
    }

    // Add current sentence to chunk
    currentChunk.push(sentence)
    currentTokens += sentenceTokens
  }

  // Add final chunk if not empty
  if (currentChunk.length > 0) {
    const chunkContent = currentChunk.join(' ')
    chunks.push({
      content: chunkContent,
      chunkIndex: chunkIndex++,
      tokenCount: estimateTokens(chunkContent)
    })
  }

  return chunks
}

/**
 * Chunk text with page information preserved
 * Useful when PDF extraction provides page metadata
 *
 * @param pages - Array of { text: string, pageNumber: number }
 * @param chunkSize - Target size in tokens
 * @param overlapSize - Overlap between chunks in tokens
 */
export function chunkTextWithPages(
  pages: Array<{ text: string; pageNumber: number }>,
  chunkSize: number = 1000,
  overlapSize: number = 200
): TextChunk[] {
  const chunks: TextChunk[] = []
  let chunkIndex = 0

  for (const page of pages) {
    const pageChunks = chunkText(page.text, chunkSize, overlapSize)

    for (const chunk of pageChunks) {
      chunks.push({
        ...chunk,
        chunkIndex: chunkIndex++,
        pageNumber: page.pageNumber
      })
    }
  }

  return chunks
}

/**
 * Validate chunk quality
 * Returns true if chunk meets quality criteria
 */
export function isValidChunk(chunk: TextChunk): boolean {
  // Minimum content length (avoid very short chunks)
  if (chunk.content.length < 50) {
    return false
  }

  // Check for minimum word count
  const wordCount = chunk.content.split(/\s+/).length
  if (wordCount < 10) {
    return false
  }

  // Check that content isn't just whitespace or special characters
  const meaningfulContent = chunk.content.replace(/[\s\W]/g, '')
  if (meaningfulContent.length < 30) {
    return false
  }

  return true
}

/**
 * Get chunking statistics for a document
 */
export function getChunkingStats(chunks: TextChunk[]): {
  totalChunks: number
  avgTokensPerChunk: number
  minTokens: number
  maxTokens: number
  totalTokens: number
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgTokensPerChunk: 0,
      minTokens: 0,
      maxTokens: 0,
      totalTokens: 0
    }
  }

  const tokenCounts = chunks.map(c => c.tokenCount)
  const totalTokens = tokenCounts.reduce((sum, count) => sum + count, 0)

  return {
    totalChunks: chunks.length,
    avgTokensPerChunk: Math.round(totalTokens / chunks.length),
    minTokens: Math.min(...tokenCounts),
    maxTokens: Math.max(...tokenCounts),
    totalTokens
  }
}
