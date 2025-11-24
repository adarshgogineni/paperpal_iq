"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, AlertCircle } from "lucide-react"
import { Database } from "@/lib/types/database"
import { UploadModal } from "@/components/upload/upload-modal"
import { Button } from "@/components/ui/button"

type Document = Database["public"]["Tables"]["documents"]["Row"]

export function DocumentList() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/documents")

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication required. Please log in again.")
          }
          if (response.status >= 500) {
            throw new Error("Server error. Please try again later.")
          }
          throw new Error("Failed to load documents. Please refresh the page.")
        }

        const data = await response.json()
        setDocuments(data.documents || [])
      } catch (err) {
        if (err instanceof TypeError && err.message.includes("fetch")) {
          setError("Network error. Please check your internet connection.")
        } else {
          setError(err instanceof Error ? err.message : "An unexpected error occurred")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="h-5 w-5 bg-gray-200 rounded mt-1"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-2 py-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No documents yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Upload your first research paper to get started with AI-powered summaries
            tailored to different audiences.
          </p>
          <UploadModal trigger={<Button>Upload Your First Paper</Button>} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className="hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
          onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(doc.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  doc.status === "uploaded"
                    ? "bg-green-100 text-green-800"
                    : doc.status === "processing"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {doc.status}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : "Size unknown"}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
