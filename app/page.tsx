import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"
import Image from "next/image"
import {
  Sparkles,
  MessageSquare,
  Zap,
  Target,
  Upload,
  Brain,
  CheckCircle,
  ArrowRight,
} from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20" />
                <Image
                  src="/logo.png"
                  alt="PaperPal IQ Logo"
                  width={140}
                  height={140}
                  className="rounded-3xl relative shadow-xl"
                />
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PaperPal IQ
                </span>
              </h1>
              <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">
                Transform Research Papers into Clear, Accessible Summaries
              </p>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Upload any research paper and get AI-powered summaries tailored to your audience—from
                elementary students to expert researchers. Plus, chat with your documents using advanced RAG technology.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/auth/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>5 summaries per day</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>10 chat messages daily</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Every User
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge AI technology to make research accessible to everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <Card className="border-2 hover:border-blue-200 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">5 Audience Levels</h3>
                <p className="text-gray-600">
                  Get summaries tailored for elementary, high school, undergraduate, graduate, or expert audiences.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover:border-purple-200 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">RAG-Powered Chat</h3>
                <p className="text-gray-600">
                  Ask questions about your documents with our advanced Retrieval Augmented Generation system.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover:border-green-200 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-green-100 w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                <p className="text-gray-600">
                  Get summaries in seconds with our optimized processing pipeline and smart caching.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 hover:border-orange-200 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-orange-100 w-12 h-12 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Caching</h3>
                <p className="text-gray-600">
                  Previously generated summaries are cached—same paper and audience means instant results.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to understanding any research paper
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 -z-10" />

            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">1. Upload</h3>
              <p className="text-gray-600">
                Upload your PDF research paper with our simple drag-and-drop interface or file picker.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">2. Select Audience</h3>
              <p className="text-gray-600">
                Choose your target audience level, from elementary school to expert researcher.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">3. Get Summary</h3>
              <p className="text-gray-600">
                Receive a clear, well-structured summary tailored to your selected audience in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">5</div>
              <div className="text-xl opacity-90">Audience Levels</div>
              <p className="mt-2 opacity-75">
                From elementary to expert
              </p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">∞</div>
              <div className="text-xl opacity-90">Papers Supported</div>
              <p className="mt-2 opacity-75">
                Any PDF research paper
              </p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">&lt;10s</div>
              <div className="text-xl opacity-90">Processing Time</div>
              <p className="mt-2 opacity-75">
                Lightning-fast summaries
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about PaperPal IQ
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What types of documents can I upload?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                You can upload any PDF research paper. Our system works best with academic papers, scientific articles, and
                technical documents. The maximum file size is 10MB.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How many summaries can I generate?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Free users can generate 5 summaries per day. Each summary is cached, so regenerating the same summary for
                the same audience level doesn&apos;t count toward your limit.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What are the different audience levels?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                We offer 5 levels: Elementary (ages 6-11), High School (ages 14-18), Undergraduate (college students),
                Graduate (grad students & researchers), and Expert (professionals in the field). Each summary is tailored
                with appropriate language and depth for that audience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How does the chat feature work?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Our chat uses Retrieval Augmented Generation (RAG) to answer questions about your uploaded documents.
                The system splits your document into chunks, creates vector embeddings, and retrieves relevant sections
                to provide accurate, context-aware answers. You can send up to 10 chat messages per day.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Is my data secure?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes! We use Supabase for secure authentication and storage, with Row Level Security (RLS) policies ensuring
                you can only access your own documents. Your PDFs are stored securely and are never shared with third parties.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Do you store my research papers?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes, uploaded PDFs are stored securely in Supabase Storage to enable features like chat and re-generating
                summaries. You can delete your documents at any time from your dashboard, which will permanently remove
                them from our system.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Simplify Your Research?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join researchers, students, and professionals using PaperPal IQ to make complex research accessible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/auth/signup">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="/auth/login">Sign In to Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="PaperPal IQ"
                width={48}
                height={48}
                className="rounded-lg"
              />
            </div>
            <p className="text-lg font-semibold text-white mb-2">PaperPal IQ</p>
            <p className="text-sm">
              Making research accessible to everyone with AI-powered summaries and chat.
            </p>
            <p className="text-xs mt-4">
              © {new Date().getFullYear()} PaperPal IQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
