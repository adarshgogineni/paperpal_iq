"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MessageSquare, Plus, Trash2 } from "lucide-react"
import { ChatInterface } from "./chat-interface"
import { AUDIENCES } from "@/lib/openai/prompts"
import type { Audience } from "@/lib/types/database"

interface ChatSession {
  id: string
  documentId: string
  audience: Audience
  title: string
  createdAt: string
  updatedAt: string
}

interface ChatSessionManagerProps {
  documentId: string
  selectedAudience: Audience
  chunksGenerated: boolean
  onProcessChunks: () => void
}

export function ChatSessionManager({
  documentId,
  selectedAudience,
  chunksGenerated,
  onProcessChunks,
}: ChatSessionManagerProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (chunksGenerated) {
      loadSessions()
    } else {
      setLoading(false)
    }
  }, [documentId, chunksGenerated])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/chat/sessions?documentId=${documentId}`
      )

      if (!response.ok) {
        throw new Error("Failed to load sessions")
      }

      const data = await response.json()
      setSessions(data.sessions)

      // Auto-select most recent session for current audience
      const matchingSession = data.sessions.find(
        (s: ChatSession) => s.audience === selectedAudience
      )
      if (matchingSession) {
        setActiveSession(matchingSession.id)
      }
    } catch (err) {
      console.error("Error loading sessions:", err)
      setError("Failed to load chat sessions")
    } finally {
      setLoading(false)
    }
  }

  const createSession = async () => {
    try {
      setCreating(true)
      setError(null)

      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          audience: selectedAudience,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create session")
      }

      setSessions((prev) => [data.session, ...prev])
      setActiveSession(data.session.id)
    } catch (err) {
      console.error("Error creating session:", err)
      setError(
        err instanceof Error ? err.message : "Failed to create chat session"
      )
    } finally {
      setCreating(false)
    }
  }

  const processChunks = async () => {
    try {
      setProcessing(true)
      setError(null)
      await onProcessChunks()
      // Reload sessions after processing
      await loadSessions()
    } catch (err) {
      setError("Failed to process document for chat")
    } finally {
      setProcessing(false)
    }
  }

  if (!chunksGenerated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chat Not Available</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            The document needs to be processed before you can chat about it.
          </p>
          <Button onClick={processChunks} disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Document...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Process Document for Chat
              </>
            )}
          </Button>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Check if there's a session for the current audience
  const currentAudienceSession = sessions.find(
    (s) => s.audience === selectedAudience
  )

  if (!activeSession && !currentAudienceSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Start a Chat Session</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Create a chat session to ask questions about this paper at the{" "}
            <strong>{AUDIENCES[selectedAudience]}</strong> level.
          </p>
          <Button onClick={createSession} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Session...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Start Chat
              </>
            )}
          </Button>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

          {sessions.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-3">
                Or continue a previous session:
              </p>
              <div className="space-y-2">
                {sessions.slice(0, 5).map((session) => (
                  <Button
                    key={session.id}
                    variant="outline"
                    className="w-full text-sm"
                    onClick={() => setActiveSession(session.id)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {AUDIENCES[session.audience]} -{" "}
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const currentSession = sessions.find((s) => s.id === activeSession)

  return (
    <div className="space-y-4">
      {/* Session selector */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-gray-900">
                  {currentSession
                    ? `${AUDIENCES[currentSession.audience]} Level Chat`
                    : "Chat Session"}
                </p>
              </div>
              {currentSession && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated:{" "}
                  {new Date(currentSession.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <Button
              onClick={createSession}
              disabled={creating}
              size="sm"
              variant="outline"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  New Chat
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat interface */}
      {activeSession && (
        <Card className="h-[600px] flex flex-col">
          <ChatInterface
            sessionId={activeSession}
            audience={AUDIENCES[currentSession?.audience || selectedAudience]}
          />
        </Card>
      )}
    </div>
  )
}
