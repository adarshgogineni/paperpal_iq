import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { retrieveRelevantChunks, buildContext } from "@/lib/rag/retrieval"
import { getOpenAIClient } from "@/lib/openai/client"

const openai = getOpenAIClient()
import { AUDIENCE_PROMPTS } from "@/lib/openai/prompts"
import type { Audience } from "@/lib/types/database"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // 1 minute timeout

interface RouteParams {
  params: {
    sessionId: string
  }
}

const sendMessageSchema = z.object({
  message: z.string().min(1).max(500),
})

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessionId = params.sessionId

    // Parse and validate request body
    const body = await request.json()
    const validation = sendMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid message", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { message } = validation.data

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      )
    }

    // Check rate limiting
    const today = new Date().toISOString().split("T")[0]
    const { data: rateLimit, error: rateLimitError } = await supabase
      .from("rate_limits")
      .select("chat_messages_count")
      .eq("user_id", user.id)
      .eq("date", today)
      .single()

    const currentCount = rateLimit?.chat_messages_count || 0
    const MAX_CHAT_MESSAGES = 10 // 10 messages per day

    if (currentCount >= MAX_CHAT_MESSAGES) {
      return NextResponse.json(
        {
          error: "Daily chat message limit reached",
          limit: MAX_CHAT_MESSAGES,
          current: currentCount,
        },
        { status: 429 }
      )
    }

    // Store user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role: "user",
        content: message,
        tokens_used: 0,
      })
      .select()
      .single()

    if (userMessageError) {
      console.error("Error storing user message:", userMessageError)
      return NextResponse.json(
        { error: "Failed to store message" },
        { status: 500 }
      )
    }

    // Retrieve relevant chunks using RAG
    const chunks = await retrieveRelevantChunks(message, session.document_id, {
      matchThreshold: 0.1, // Very low threshold to catch more potential matches
      matchCount: 5,
    })

    console.log(`[RAG] Query: "${message}" | Chunks found: ${chunks.length}`)
    if (chunks.length > 0) {
      console.log(`[RAG] Similarities: ${chunks.map(c => c.similarity.toFixed(3)).join(', ')}`)
    }

    if (chunks.length === 0) {
      // Check if document has been processed for chat
      const { count: chunkCount } = await supabase
        .from("document_chunks")
        .select("*", { count: "exact", head: true })
        .eq("document_id", session.document_id)

      console.log(`[RAG] Total chunks in document: ${chunkCount || 0}`)

      const errorMessage = chunkCount === 0
        ? "This document hasn't been processed for chat yet. Please click 'Process for Chat' first."
        : "No relevant content found. Try asking about specific topics from the paper, or try rephrasing your question."

      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    }

    // Build context from chunks
    const context = buildContext(chunks, 5000)

    // Get message history for conversation context
    const { data: previousMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .neq("id", userMessage.id)
      .order("created_at", { ascending: true })
      .limit(10) // Last 10 messages for context

    // Build conversation history
    const conversationHistory = (previousMessages || []).map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    // Build system prompt with audience context
    const audienceInstruction = AUDIENCE_PROMPTS[session.audience as Audience]
    const systemPrompt = `${audienceInstruction}

You are answering questions about a research paper. Use the following context from the paper to answer the user's question. If the context doesn't contain enough information to answer the question, say so honestly.

Context from the paper:
${context}

Instructions:
- Answer in a way appropriate for the ${session.audience} level
- Base your answer on the provided context
- If you're not certain, express uncertainty
- Keep responses concise and focused
- Reference specific sections when relevant`

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const assistantMessage = completion.choices[0].message.content || ""
    const tokensUsed = completion.usage?.total_tokens || 0

    // Store assistant response
    const { data: assistantMessageRecord, error: assistantMessageError } =
      await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          role: "assistant",
          content: assistantMessage,
          tokens_used: tokensUsed,
          context_chunks: chunks.map((c) => c.id),
        })
        .select()
        .single()

    if (assistantMessageError) {
      console.error("Error storing assistant message:", assistantMessageError)
      return NextResponse.json(
        { error: "Failed to store response" },
        { status: 500 }
      )
    }

    // Update rate limit
    if (rateLimitError) {
      // Create new rate limit record
      await supabase.from("rate_limits").insert({
        user_id: user.id,
        date: today,
        summaries_count: 0,
        chat_messages_count: 1,
      })
    } else {
      // Increment existing count
      await supabase
        .from("rate_limits")
        .update({ chat_messages_count: currentCount + 1 })
        .eq("user_id", user.id)
        .eq("date", today)
    }

    // Return response with metadata
    return NextResponse.json({
      message: {
        id: assistantMessageRecord.id,
        content: assistantMessage,
        role: "assistant",
        tokensUsed,
        createdAt: assistantMessageRecord.created_at,
      },
      sources: chunks.map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        similarity: Math.round(chunk.similarity * 100),
      })),
      usage: {
        current: currentCount + 1,
        limit: MAX_CHAT_MESSAGES,
        remaining: MAX_CHAT_MESSAGES - (currentCount + 1),
      },
    })
  } catch (error) {
    console.error("Error in POST /api/chat/[sessionId]/messages:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process message",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessionId = params.sessionId

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      )
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("Error fetching messages:", messagesError)
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages: messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        tokensUsed: msg.tokens_used,
        contextChunks: msg.context_chunks,
        createdAt: msg.created_at,
      })),
    })
  } catch (error) {
    console.error("Error in GET /api/chat/[sessionId]/messages:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch messages",
      },
      { status: 500 }
    )
  }
}
