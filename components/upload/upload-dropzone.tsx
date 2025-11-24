"use client"

import { useState, useCallback } from "react"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface UploadDropzoneProps {
  onUploadComplete?: () => void
}

export function UploadDropzone({ onUploadComplete }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB in bytes

    if (file.type !== "application/pdf") {
      return "Please upload a PDF file"
    }

    if (file.size > MAX_SIZE) {
      return `File size must be less than 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
    }

    if (file.size === 0) {
      return "File appears to be empty"
    }

    return null
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile) {
      setError("No file detected")
      return
    }

    const validationError = validateFile(droppedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    setFile(droppedFile)
    setError(null)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) {
      return
    }

    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    setFile(selectedFile)
    setError(null)
  }, [])

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Simulate progress since we can't track real upload progress with fetch
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.")
        }
        if (response.status === 413) {
          throw new Error("File is too large. Maximum size is 10MB.")
        }
        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.")
        }
        throw new Error(data.error || "Upload failed")
      }

      setSuccess(true)
      setFile(null)

      // Call completion callback after a short delay
      setTimeout(() => {
        setSuccess(false)
        setUploadProgress(0)
        onUploadComplete?.()
      }, 2000)
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your internet connection and try again.")
      } else {
        setError(err instanceof Error ? err.message : "Upload failed")
      }
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Drop your PDF here
          </h3>
          <p className="text-sm text-gray-600 mb-4">or click to browse</p>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button variant="outline" asChild>
              <span>Browse Files</span>
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-4">
            PDF files only, max 10MB
          </p>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 py-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 text-sm">File uploaded successfully!</p>
          </CardContent>
        </Card>
      )}

      {/* Selected File */}
      {file && !success && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="min-w-24"
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
            {uploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 text-center">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
