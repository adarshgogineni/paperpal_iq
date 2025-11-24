import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { logout } from "@/app/auth/actions/auth"
import { Button } from "@/components/ui/button"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import Image from "next/image"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="PaperPal IQ Logo"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PaperPal IQ</h1>
                <p className="text-sm text-gray-600">Welcome, {user.email}</p>
              </div>
            </div>
            <form action={logout}>
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardContent />
      </main>
    </div>
  )
}
