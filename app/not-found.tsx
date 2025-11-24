import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileQuestion className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle>Page Not Found</CardTitle>
              <CardDescription>
                The page you're looking for doesn't exist
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            The document or page you're trying to access may have been moved or deleted.
          </p>
          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
