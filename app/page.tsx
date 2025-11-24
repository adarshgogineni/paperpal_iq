import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="PaperPal IQ Logo"
            width={120}
            height={120}
            className="rounded-2xl"
          />
        </div>
        <h1 className="text-5xl font-bold mb-4">PaperPal IQ</h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Upload research papers and get intelligent summaries tailored to your audience
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Button asChild size="lg">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
