import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PaperPal IQ - AI Paper Summarizer",
  description: "Upload research papers and get intelligent summaries tailored to your audience. Generate summaries for elementary, high school, undergraduate, graduate, and expert levels.",
  keywords: ["AI", "research papers", "summarization", "academic", "PDF", "OpenAI", "machine learning"],
  authors: [{ name: "PaperPal IQ" }],
  openGraph: {
    title: "PaperPal IQ - AI Paper Summarizer",
    description: "Upload research papers and get intelligent summaries tailored to your audience",
    siteName: "PaperPal IQ",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PaperPal IQ - AI Paper Summarizer",
    description: "Upload research papers and get intelligent summaries tailored to your audience",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
