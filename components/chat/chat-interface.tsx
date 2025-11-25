"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Send, FileText, AlertCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  tokensUsed?: number
  createdAt: string
}

interface Source {
  chunkIndex: number
  pageNumber: number | null
  similarity: number
}

interface ChatInterfaceProps {
  sessionId: string
  audience: string
}

export function ChatInterface({ sessionId, audience }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSources, setLastSources] = useState<Source[]>([])
  const [usage, setUsage] = useState<{
    current: number
    limit: number
    remaining: number
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load message history
  useEffect(() => {
    loadMessages()
  }, [sessionId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px"
    }
  }, [input])

  const loadMessages = async () => {
    try {
      setLoadingMessages(true)
      const response = await fetch(`/api/chat/${sessionId}/messages`)

      if (!response.ok) {
        throw new Error("Failed to load messages")
      }

      const data = await response.json()
      setMessages(data.messages)
    } catch (err) {
      console.error("Error loading messages:", err)
      setError("Failed to load chat history")
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setError(null)

    // Add user message optimistically
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setLoading(true)

    try {
      const response = await fetch(`/api/chat/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError(
            `Daily limit reached (${data.current}/${data.limit} messages)`
          )
        } else {
          setError(data.error || "Failed to send message")
        }
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
        return
      }

      // Update with real user message + assistant response
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticMessage.id),
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: userMessage,
          createdAt: new Date().toISOString(),
        },
        data.message,
      ])

      setLastSources(data.sources || [])
      setUsage(data.usage)
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Network error. Please try again.")
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loadingMessages) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-8 px-6 text-center">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start a Conversation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Ask questions about the paper at the {audience} level
              </p>
              <div className="text-left bg-white rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-gray-700">
                  Example questions:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>What is the main research question?</li>
                  <li>How did they conduct the study?</li>
                  <li>What were the key findings?</li>
                  <li>What are the implications of this research?</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-li:text-gray-800">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              {message.role === "assistant" &&
                index === messages.length - 1 &&
                lastSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {lastSources.map((source, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-200 text-gray-700"
                        >
                          {source.pageNumber
                            ? `Page ${source.pageNumber}`
                            : `Section ${source.chunkIndex}`}{" "}
                          ({source.similarity}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 pb-2">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 py-2 px-3">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage indicator */}
      {usage && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 text-center">
            {usage.remaining} of {usage.limit} daily messages remaining
          </p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask a question about the paper..."
            disabled={loading}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-h-[48px] max-h-[120px]"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-3 h-auto"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
