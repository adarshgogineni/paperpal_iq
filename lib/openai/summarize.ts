import type { Audience } from "@/lib/types/database"
import { getOpenAIClient, DEFAULT_MODEL, MAX_TOKENS, TEMPERATURE } from "./client"
import { buildSummaryPrompt, SYSTEM_PROMPT } from "./prompts"

export interface SummaryResult {
  summary: string
  tokensUsed: number
  model: string
}

export interface SummaryOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

/**
 * Generate a summary of text using OpenAI
 * @param text - The text to summarize
 * @param audience - Target audience level
 * @param options - Optional configuration
 * @returns Summary result with metadata
 */
export async function generateSummary(
  text: string,
  audience: Audience,
  options: SummaryOptions = {}
): Promise<SummaryResult> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = MAX_TOKENS,
    temperature = TEMPERATURE,
  } = options

  try {
    const openai = getOpenAIClient()
    const prompt = buildSummaryPrompt(text, audience)

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    })

    const summary = completion.choices[0]?.message?.content?.trim() || ""
    const tokensUsed = completion.usage?.total_tokens || 0

    if (!summary) {
      throw new Error("No summary generated from OpenAI")
    }

    return {
      summary,
      tokensUsed,
      model,
    }
  } catch (error) {
    console.error("Error generating summary:", error)

    if (error instanceof Error) {
      // Check for specific OpenAI errors
      if (error.message.includes("API key")) {
        throw new Error("Invalid or missing OpenAI API key")
      }
      if (error.message.includes("rate limit")) {
        throw new Error("OpenAI rate limit exceeded. Please try again later.")
      }
      if (error.message.includes("context length")) {
        throw new Error("Text is too long for summarization. Please upload a shorter document.")
      }
    }

    throw new Error("Failed to generate summary. Please try again.")
  }
}

/**
 * Estimate token count for text (rough approximation)
 * OpenAI uses ~4 characters per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Check if text length is within limits for the model
 */
export function isTextWithinLimits(
  text: string,
  maxInputTokens: number = 12000
): boolean {
  const estimatedTokens = estimateTokens(text)
  return estimatedTokens <= maxInputTokens
}
