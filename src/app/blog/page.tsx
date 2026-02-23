import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <BookOpen className="h-8 w-8 text-accent-light" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Blog coming soon</h1>
          <p className="mt-3 text-sm text-muted">
            We're working on articles about SEO, GEO, and AI-powered content strategy. Stay tuned.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent-light transition hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
