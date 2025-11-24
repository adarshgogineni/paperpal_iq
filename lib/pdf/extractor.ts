import pdf from "pdf-parse"

export interface ExtractedText {
  text: string
  pages: number
  info: {
    title?: string
    author?: string
    subject?: string
  }
}

/**
 * Extract text from a PDF buffer
 * @param buffer - PDF file as Buffer
 * @returns Extracted text and metadata
 */
export async function extractTextFromPDF(
  buffer: Buffer
): Promise<ExtractedText> {
  try {
    const data = await pdf(buffer)

    return {
      text: data.text,
      pages: data.numpages,
      info: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
      },
    }
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    throw new Error("Failed to extract text from PDF")
  }
}

/**
 * Truncate text to a maximum number of characters
 * Useful for limiting input to LLM APIs
 */
export function truncateText(text: string, maxChars: number = 15000): string {
  if (text.length <= maxChars) {
    return text
  }

  // Try to truncate at a sentence boundary
  const truncated = text.slice(0, maxChars)
  const lastPeriod = truncated.lastIndexOf(".")
  const lastNewline = truncated.lastIndexOf("\n")

  const cutoff = Math.max(lastPeriod, lastNewline)

  if (cutoff > maxChars * 0.9) {
    // If we can find a good breakpoint near the end, use it
    return truncated.slice(0, cutoff + 1)
  }

  // Otherwise just truncate at maxChars
  return truncated + "..."
}

/**
 * Clean extracted PDF text
 * Removes excessive whitespace and formatting artifacts
 */
export function cleanPDFText(text: string): string {
  return (
    text
      // Replace multiple spaces with single space
      .replace(/ +/g, " ")
      // Replace multiple newlines with double newline
      .replace(/\n{3,}/g, "\n\n")
      // Trim whitespace from each line
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // Trim overall
      .trim()
  )
}
