"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowLeft, Calendar, Loader2, MessageSquare, Sparkles, History } from "lucide-react"
import { Database } from "@/lib/types/database"
import { AUDIENCES, type Audience } from "@/lib/openai/prompts"
import { ErrorBoundary } from "@/components/error-boundary"
import { ChatInterface } from "@/components/chat/chat-interface"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type Document = Database["public"]["Tables"]["documents"]["Row"]
type Summary = Database["public"]["Tables"]["summaries"]["Row"]

interface ChatSession {
  id: string
  documentId: string
  audience: Audience
  title: string
  createdAt: string
  updatedAt: string
}

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
  const [chunksGenerated, setChunksGenerated] = useState(false)
  const [processingChunks, setProcessingChunks] = useState(false)
  const [activeChatSession, setActiveChatSession] = useState<string | null>(null)
  const [chatAudience, setChatAudience] = useState<Audience | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number | null
    limit: number
  }>({ remaining: null, limit: 5 })

  // Fetch chat sessions for this document
  useEffect(() => {
    const fetchChatSessions = async () => {
      try {
        setLoadingSessions(true)
        const response = await fetch(`/api/chat/sessions?documentId=${document.id}`)
        if (response.ok) {
          const data = await response.json()
          setChatSessions(data.sessions)
        }
      } catch (err) {
        console.error("Failed to load chat sessions:", err)
      } finally {
        setLoadingSessions(false)
      }
    }

    fetchChatSessions()
  }, [document.id])

  const handleGenerateSummary = async (audience: Audience) => {
    // If already generated, just select it
    const existingSummary = getSummaryForAudience(audience)
    if (existingSummary) {
      setSelectedAudience(audience)
      setChatAudience(null) // Close chat when selecting summary
      return
    }

    setSelectedAudience(audience)
    setChatAudience(null)
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
        if (response.status === 429) {
          throw new Error(data.error || "Rate limit exceeded. Please try again later.")
        }
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.")
        }
        if (response.status >= 500) {
          throw new Error("Server error. Please try again in a few moments.")
        }
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
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your internet connection and try again.")
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate summary")
      }
    } finally {
      setGenerating(false)
    }
  }

  const getSummaryForAudience = (audience: Audience) => {
    return summaries.find((s) => s.audience === audience)
  }

  const getSessionsForAudience = (audience: Audience) => {
    return chatSessions.filter((s) => s.audience === audience)
  }

  const handleProcessChunks = async () => {
    try {
      setProcessingChunks(true)
      setError(null)

      const response = await fetch(`/api/documents/${document.id}/process-chunks`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to process document")
      }

      const data = await response.json()

      // Set chunks generated regardless of whether it was already processed or just completed
      setChunksGenerated(true)

      return data // Return data for further use
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process document for chat")
      throw err // Re-throw so caller knows it failed
    } finally {
      setProcessingChunks(false)
    }
  }

  const handleStartChat = async (audience: Audience) => {
    try {
      setError(null)

      // Process chunks if not already done
      if (!chunksGenerated) {
        try {
          await handleProcessChunks()
          // Explicitly set after processing completes successfully
          setChunksGenerated(true)
        } catch (err) {
          // Error already set in handleProcessChunks
          return // Exit early if processing failed
        }
      }

      // Create new chat session
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: document.id,
          audience,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create chat session")
      }

      const data = await response.json()

      // Add new session to the list
      setChatSessions((prev) => [
        {
          id: data.session.id,
          documentId: data.session.documentId,
          audience: data.session.audience,
          title: data.session.title,
          createdAt: data.session.createdAt,
          updatedAt: data.session.updatedAt,
        },
        ...prev,
      ])

      setActiveChatSession(data.session.id)
      setChatAudience(audience)
      setSelectedAudience(null) // Close summary when opening chat
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start chat")
    }
  }

  const handleResumeChat = (sessionId: string, audience: Audience) => {
    setActiveChatSession(sessionId)
    setChatAudience(audience)
    setSelectedAudience(null) // Close summary when opening chat
  }

  return (
    <ErrorBoundary>
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
                    <CardTitle>Generate Summary or Chat</CardTitle>
                    <CardDescription>
                      Select an audience level to view summaries or start chatting
                    </CardDescription>
                  </div>
                  {rateLimitInfo.remaining !== null && (
                    <Badge variant={rateLimitInfo.remaining === 0 ? "destructive" : "secondary"}>
                      {rateLimitInfo.remaining}/{rateLimitInfo.limit} summaries remaining today
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {(Object.keys(AUDIENCES) as Audience[]).map((audience) => {
                    const summary = getSummaryForAudience(audience)
                    const isGenerating = generating && selectedAudience === audience
                    const isSelected = selectedAudience === audience && !chatAudience
                    const isChatActive = chatAudience === audience

                    return (
                      <div key={audience} className="flex flex-col gap-2">
                        {/* Summary Button */}
                        <Button
                          variant={isSelected ? "default" : summary ? "secondary" : "outline"}
                          className="h-auto py-4 flex flex-col items-center gap-2"
                          onClick={() => handleGenerateSummary(audience)}
                          disabled={generating || processingChunks}
                        >
                          {isGenerating && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          <Sparkles className="h-4 w-4" />
                          <span className="font-semibold capitalize">
                            {AUDIENCES[audience]}
                          </span>
                          {summary && !isGenerating && (
                            <span className="text-xs opacity-80">
                              ✓ Summary Ready
                            </span>
                          )}
                        </Button>

                        {/* Chat Button with History */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant={isChatActive ? "default" : "outline"}
                              size="sm"
                              className="w-full"
                              disabled={processingChunks || generating}
                            >
                              {loadingSessions ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <MessageSquare className="h-3 w-3 mr-1" />
                              )}
                              Chat
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              onClick={() => handleStartChat(audience)}
                              className="cursor-pointer"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              New Chat
                            </DropdownMenuItem>
                            {getSessionsForAudience(audience).length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                                  Chat History
                                </div>
                                {getSessionsForAudience(audience).map((session) => (
                                  <DropdownMenuItem
                                    key={session.id}
                                    onClick={() => handleResumeChat(session.id, audience)}
                                    className="cursor-pointer"
                                  >
                                    <History className="h-4 w-4 mr-2" />
                                    <div className="flex-1 overflow-hidden">
                                      <div className="text-xs text-gray-500">
                                        {new Date(session.createdAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })}
                </div>
                {processingChunks && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2 text-blue-800 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing document for chat... This may take 10-30 seconds.</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat Interface */}
            {chatAudience && activeChatSession && (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Chat - {AUDIENCES[chatAudience]} Level
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setChatAudience(null)
                        setActiveChatSession(null)
                      }}
                    >
                      Close Chat
                    </Button>
                  </div>
                </CardHeader>
                <div className="flex-1 overflow-hidden">
                  <ChatInterface
                    sessionId={activeChatSession}
                    audience={AUDIENCES[chatAudience]}
                  />
                </div>
              </Card>
            )}

            {/* Selected Summary Display */}
            {selectedAudience && !chatAudience && getSummaryForAudience(selectedAudience) && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Summary</h2>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="capitalize">
                        {AUDIENCES[selectedAudience]} Level
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
            {!selectedAudience && !chatAudience && !generating && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Get Started
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    Select an audience level above to generate a summary or start a chat conversation about this paper
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
