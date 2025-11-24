import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DocumentDetailContent } from "@/components/documents/document-detail-content"

interface PageProps {
  params: {
    id: string
  }
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch document
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (docError || !document) {
    notFound()
  }

  // Fetch existing summaries
  const { data: summaries } = await supabase
    .from("summaries")
    .select("*")
    .eq("document_id", params.id)
    .order("created_at", { ascending: false })

  return (
    <DocumentDetailContent
      document={document}
      initialSummaries={summaries || []}
    />
  )
}
