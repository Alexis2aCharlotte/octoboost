import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background px-6 text-foreground">
      <nav className="fixed top-0 right-0 left-0 z-50 flex h-20 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <Image
            src="/Logo Octoboost.png"
            alt="OctoBoost"
            width={120}
            height={120}
            className="h-[44px] w-[44px] object-contain"
            priority
          />
          <span className="text-lg font-bold tracking-tight">OctoBoost</span>
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-border px-4 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-foreground"
        >
          Login
        </Link>
      </nav>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="ocean-bg" />
        <div className="grid-bg" />
        <div className="vignette" />

        <div className="relative z-10 mx-auto w-full max-w-xl text-center">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Grow your organic traffic
            <br />
            <span className="gradient-text">on autopilot</span>
          </h1>

          <p className="mx-auto mt-5 mb-10 max-w-md text-muted">
            We analyze your site, find competitors, and discover the keywords
            that will drive traffic.
          </p>

          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <p className="mt-8 text-xs text-muted/50">
            Free analysis · No credit card required
          </p>
        </div>
      </div>
    </main>
  );
}
