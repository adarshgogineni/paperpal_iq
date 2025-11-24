import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { extractTextFromPDF, cleanPDFText, truncateText } from "@/lib/pdf/extractor"
import { generateSummary } from "@/lib/openai/summarize"
import type { Audience } from "@/lib/openai/prompts"

export const dynamic = "force-dynamic"

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

    // Parse request body
    const body = await request.json()
    const { documentId, audience } = body as {
      documentId: string
      audience: Audience
    }

    if (!documentId || !audience) {
      return NextResponse.json(
        { error: "Document ID and audience are required" },
        { status: 400 }
      )
    }

    // Fetch document from database
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if summary already exists for this audience
    const { data: existingSummary } = await supabase
      .from("summaries")
      .select("*")
      .eq("document_id", documentId)
      .eq("audience", audience)
      .single()

    if (existingSummary) {
      return NextResponse.json({
        summary: existingSummary,
        cached: true,
      })
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("papers")
      .download(document.file_path)

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError)
      return NextResponse.json(
        { error: "Failed to download document" },
        { status: 500 }
      )
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    const { text } = await extractTextFromPDF(buffer)
    const cleanedText = cleanPDFText(text)
    const truncatedText = truncateText(cleanedText, 12000) // ~3000 tokens

    if (!truncatedText || truncatedText.length < 100) {
      return NextResponse.json(
        { error: "Could not extract sufficient text from PDF" },
        { status: 400 }
      )
    }

    // Generate summary using OpenAI
    const { summary, tokensUsed, model } = await generateSummary(
      truncatedText,
      audience
    )

    if (!summary) {
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 }
      )
    }

    // Save summary to database
    const { data: savedSummary, error: saveError } = await supabase
      .from("summaries")
      .insert({
        document_id: documentId,
        audience,
        summary_text: summary,
        tokens_used: tokensUsed,
        model_used: model,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Save error:", saveError)
      return NextResponse.json(
        { error: "Failed to save summary" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      summary: savedSummary,
      cached: false,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
