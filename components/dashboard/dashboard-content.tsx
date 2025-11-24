"use client"

import { useState } from "react"
import { DocumentList } from "@/components/documents/document-list"
import { UploadModal } from "@/components/upload/upload-modal"

export function DashboardContent() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    // Refresh the document list by updating the key
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Documents</h2>
          <p className="text-gray-600 mt-1">
            Manage your research papers and summaries
          </p>
        </div>
        <UploadModal onUploadComplete={handleUploadComplete} />
      </div>

      {/* Document List */}
      <DocumentList key={refreshKey} />
    </div>
  )
}
