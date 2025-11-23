import OpenAI from "openai"

// Singleton OpenAI client
let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables")
    }

    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openaiClient
}

// Default model configuration
export const DEFAULT_MODEL = "gpt-4o-mini"
export const MAX_TOKENS = 1500
export const TEMPERATURE = 0.7
