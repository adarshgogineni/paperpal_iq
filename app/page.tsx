import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold mb-4">PaperPal IQ</h1>
        <p className="text-xl text-gray-600">
          AI-powered research paper summarization
        </p>
        <Button>Get Started</Button>
      </div>
    </main>
  )
}
