import Link from "next/link";
import { Send, ArrowRight } from "lucide-react";

export default function Home() {

  return (
    <main className="flex min-h-screen flex-col bg-background px-6 text-foreground">
      <nav className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-end border-b border-border/50 bg-background/80 px-6 backdrop-blur-sm">
        <Link
          href="/login"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
        >
          Login
        </Link>
      </nav>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="animate-pulse-glow absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
          <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <Send className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">OctoBoost</span>
        </div>

        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Grow your organic traffic
          <br />
          <span className="gradient-text">on autopilot</span>
        </h1>

        <p className="mx-auto mb-10 max-w-lg text-muted md:text-lg">
          Enter your website URL. We analyze your site, find competitors, and
          discover the keywords that will drive traffic.
        </p>

        <Link
          href="/login"
          className="group mx-auto flex items-center gap-2 rounded-xl bg-accent px-8 py-3 text-base font-medium text-white transition hover:bg-accent-light"
        >
          Get Started
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>

        <p className="mt-6 text-sm text-muted/60">
          Free analysis · No credit card required
        </p>
        </div>
      </div>
    </main>
  );
}
