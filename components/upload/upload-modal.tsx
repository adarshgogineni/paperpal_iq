"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UploadDropzone } from "./upload-dropzone"

interface UploadModalProps {
  onUploadComplete?: () => void
  trigger?: React.ReactNode
}

export function UploadModal({ onUploadComplete, trigger }: UploadModalProps) {
  const [open, setOpen] = useState(false)

  const handleUploadComplete = () => {
    onUploadComplete?.()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button size="lg">Upload Paper</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Research Paper</DialogTitle>
          <DialogDescription>
            Upload a PDF file of your research paper to generate AI-powered summaries
            tailored to different audiences.
          </DialogDescription>
        </DialogHeader>
        <UploadDropzone onUploadComplete={handleUploadComplete} />
      </DialogContent>
    </Dialog>
  )
}
