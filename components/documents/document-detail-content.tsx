"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowLeft, Calendar, Loader2 } from "lucide-react"
import { Database } from "@/lib/types/database"
import { AUDIENCES, type Audience } from "@/lib/openai/prompts"

type Document = Database["public"]["Tables"]["documents"]["Row"]
type Summary = Database["public"]["Tables"]["summaries"]["Row"]

interface DocumentDetailContentProps {
  document: Document
  initialSummaries: Summary[]
}

export function DocumentDetailContent({
  document,
  initialSummaries,
}: DocumentDetailContentProps) {
  const router = useRouter()
  const [summaries, setSummaries] = useState<Summary[]>(initialSummaries)
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number | null
    limit: number
  }>({ remaining: null, limit: 5 })

  const handleGenerateSummary = async (audience: Audience) => {
    // If already generated, just select it
    const existingSummary = getSummaryForAudience(audience)
    if (existingSummary) {
      setSelectedAudience(audience)
      return
    }

    setSelectedAudience(audience)
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          audience,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary")
      }

      // Update rate limit info if provided
      if (data.remainingToday !== undefined) {
        setRateLimitInfo((prev) => ({
          ...prev,
          remaining: data.remainingToday,
        }))
      }

      // Add new summary to the list if not cached
      if (!data.cached) {
        setSummaries((prev) => [data.summary, ...prev])
      } else {
        // If cached, make sure it's in the list
        setSummaries((prev) => {
          const exists = prev.some((s) => s.id === data.summary.id)
          return exists ? prev : [data.summary, ...prev]
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary")
    } finally {
      setGenerating(false)
    }
  }

  const getSummaryForAudience = (audience: Audience) => {
    return summaries.find((s) => s.audience === audience)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <FileText className="h-8 w-8 text-blue-600 mt-1" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {document.title}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(document.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span>
                    {document.file_size
                      ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB`
                      : "Size unknown"}
                  </span>
                  <Badge variant="outline">{document.status}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Audience Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Generate Summary</CardTitle>
                  <CardDescription>
                    Select an audience level to generate a tailored summary
                  </CardDescription>
                </div>
                {rateLimitInfo.remaining !== null && (
                  <Badge variant={rateLimitInfo.remaining === 0 ? "destructive" : "secondary"}>
                    {rateLimitInfo.remaining}/{rateLimitInfo.limit} remaining today
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {(Object.keys(AUDIENCES) as Audience[]).map((audience) => {
                  const summary = getSummaryForAudience(audience)
                  const isGenerating = generating && selectedAudience === audience

                  return (
                    <Button
                      key={audience}
                      variant={summary ? "default" : "outline"}
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => handleGenerateSummary(audience)}
                      disabled={generating}
                    >
                      {isGenerating && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span className="font-semibold capitalize">
                        {audience}
                      </span>
                      {summary && (
                        <span className="text-xs opacity-80">
                          ✓ Generated
                        </span>
                      )}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Summary Display */}
          {selectedAudience && getSummaryForAudience(selectedAudience) && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Summary</h2>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">
                      {selectedAudience.replace("_", " ")} Level
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>
                        {new Date(
                          getSummaryForAudience(selectedAudience)!.created_at
                        ).toLocaleDateString()}
                      </span>
                      <Badge variant="outline">
                        {getSummaryForAudience(selectedAudience)!.tokens_used} tokens
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <style jsx>{`
                    .summary-content strong {
                      display: block;
                      margin-top: 1.5rem;
                      margin-bottom: 0.5rem;
                      font-weight: 600;
                      color: #111827;
                    }
                    .summary-content p {
                      margin-bottom: 1.25rem;
                      line-height: 1.75;
                      color: #374151;
                    }
                    .summary-content h1,
                    .summary-content h2,
                    .summary-content h3 {
                      font-weight: 700;
                      margin-top: 2rem;
                      margin-bottom: 1rem;
                      color: #111827;
                    }
                    .summary-content h1 { font-size: 1.5rem; }
                    .summary-content h2 { font-size: 1.25rem; }
                    .summary-content h3 { font-size: 1.125rem; }
                    .summary-content ul,
                    .summary-content ol {
                      margin: 1rem 0;
                      padding-left: 1.5rem;
                    }
                    .summary-content li {
                      margin-bottom: 0.5rem;
                      color: #374151;
                    }
                  `}</style>
                  <div className="summary-content text-gray-700 leading-relaxed">
                    <ReactMarkdown>
                      {getSummaryForAudience(selectedAudience)!.summary_text}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {!selectedAudience && !generating && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No summary selected
                </h3>
                <p className="text-gray-600 max-w-md">
                  Select an audience level above to view or generate a tailored summary
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
