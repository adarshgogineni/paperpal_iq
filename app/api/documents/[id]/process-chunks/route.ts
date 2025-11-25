import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { extractTextFromPDF } from "@/lib/pdf/extractor"
import { chunkText, getChunkingStats, isValidChunk } from "@/lib/rag/chunker"
import { generateEmbeddingsBatch } from "@/lib/rag/embeddings"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes for large documents

interface RouteParams {
  params: {
    id: string
  }
}

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

    const documentId = params.id

    // Get document from database
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

    // Check if chunks already generated
    if (document.chunks_generated) {
      // Return success with existing stats
      const { count } = await supabase
        .from("document_chunks")
        .select("*", { count: "exact", head: true })
        .eq("document_id", documentId)

      return NextResponse.json({
        success: true,
        message: "Document already processed",
        chunks: {
          total: count || 0,
        },
      })
    }

    // Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("papers")
      .download(document.file_path)

    if (downloadError || !fileData) {
      console.error("Error downloading file:", downloadError)
      return NextResponse.json(
        { error: "Failed to download document" },
        { status: 500 }
      )
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    const extracted = await extractTextFromPDF(buffer)

    if (!extracted.text || extracted.text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from the PDF" },
        { status: 400 }
      )
    }

    const extractedText = extracted.text

    // Chunk the text
    const chunks = chunkText(extractedText, 1000, 200)

    // Filter out invalid chunks
    const validChunks = chunks.filter(isValidChunk)

    if (validChunks.length === 0) {
      return NextResponse.json(
        { error: "No valid chunks could be generated from the document" },
        { status: 400 }
      )
    }

    // Get chunking statistics
    const stats = getChunkingStats(validChunks)

    // Generate embeddings for all chunks in batch
    const chunkTexts = validChunks.map((chunk) => chunk.content)
    const { embeddings, totalTokens } = await generateEmbeddingsBatch(
      chunkTexts
    )

    // Store chunks and embeddings in database
    const chunkRecords = validChunks.map((chunk, index) => ({
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      token_count: chunk.tokenCount,
      page_number: chunk.pageNumber || null,
      embedding: embeddings[index], // pgvector accepts arrays directly
    }))

    // Insert chunks in batches to avoid query size limits
    const batchSize = 50
    for (let i = 0; i < chunkRecords.length; i += batchSize) {
      const batch = chunkRecords.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(batch)

      if (insertError) {
        console.error("Error inserting chunks:", insertError)
        return NextResponse.json(
          { error: "Failed to store document chunks" },
          { status: 500 }
        )
      }
    }

    // Update document record
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        full_text: extractedText,
        page_count: Math.ceil(extractedText.length / 3000), // Rough estimate
        chunks_generated: true,
      })
      .eq("id", documentId)

    if (updateError) {
      console.error("Error updating document:", updateError)
      return NextResponse.json(
        { error: "Failed to update document status" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      chunks: {
        total: stats.totalChunks,
        avgTokens: stats.avgTokensPerChunk,
        minTokens: stats.minTokens,
        maxTokens: stats.maxTokens,
        totalTokens: stats.totalTokens,
      },
      embeddings: {
        totalTokens,
        estimatedCost: (totalTokens / 1_000_000) * 0.02,
      },
    })
  } catch (error) {
    console.error("Error processing chunks:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process document chunks",
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

    const documentId = params.id

    // Get document status
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("chunks_generated, page_count")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Get chunk count if chunks exist
    let chunkCount = 0
    if (document.chunks_generated) {
      const { count, error: countError } = await supabase
        .from("document_chunks")
        .select("*", { count: "exact", head: true })
        .eq("document_id", documentId)

      if (!countError && count !== null) {
        chunkCount = count
      }
    }

    return NextResponse.json({
      chunksGenerated: document.chunks_generated,
      chunkCount,
      pageCount: document.page_count,
    })
  } catch (error) {
    console.error("Error getting chunk status:", error)
    return NextResponse.json(
      { error: "Failed to get chunk status" },
      { status: 500 }
    )
  }
}
