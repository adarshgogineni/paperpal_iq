import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="PaperPal IQ Logo"
              width={80}
              height={80}
              className="rounded-xl"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">PaperPal IQ</h1>
          <p className="mt-2 text-sm text-gray-600">
            AI-powered research paper summarization
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
