import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const dynamic = "force-dynamic"

const createSessionSchema = z.object({
  documentId: z.string().uuid(),
  audience: z.enum([
    "elementary",
    "high_school",
    "undergraduate",
    "graduate",
    "expert",
  ]),
})

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validation = createSessionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { documentId, audience } = validation.data

    // Verify document exists and belongs to user
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, title, chunks_generated")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if chunks have been generated
    if (!document.chunks_generated) {
      return NextResponse.json(
        {
          error:
            "Document chunks not generated. Please process the document first.",
        },
        { status: 400 }
      )
    }

    // Create chat session
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        document_id: documentId,
        user_id: user.id,
        audience,
        title: `Chat about ${document.title}`,
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Error creating session:", sessionError)
      return NextResponse.json(
        { error: "Failed to create chat session" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session: {
        id: session.id,
        documentId: session.document_id,
        audience: session.audience,
        title: session.title,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      },
    })
  } catch (error) {
    console.error("Error in POST /api/chat/sessions:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create session",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    // Get document_id from query params (optional)
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("documentId")

    // Build query
    let query = supabase
      .from("chat_sessions")
      .select(
        `
        id,
        document_id,
        audience,
        title,
        created_at,
        updated_at,
        documents (
          title,
          file_path
        )
      `
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    // Filter by document if specified
    if (documentId) {
      query = query.eq("document_id", documentId)
    }

    const { data: sessions, error: sessionsError } = await query

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError)
      return NextResponse.json(
        { error: "Failed to fetch chat sessions" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sessions: sessions.map((session: any) => ({
        id: session.id,
        documentId: session.document_id,
        documentTitle: session.documents?.title || "Unknown Document",
        audience: session.audience,
        title: session.title,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      })),
    })
  } catch (error) {
    console.error("Error in GET /api/chat/sessions:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch sessions",
      },
      { status: 500 }
    )
  }
}
