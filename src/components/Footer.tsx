import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border px-6 py-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/Logo Octoboost.png" alt="OctoBoost logo" width={60} height={60} className="h-5 w-5 object-contain" />
          <span className="text-sm font-semibold">OctoBoost</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted/60">
          <Link href="/terms" className="transition hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="transition hover:text-foreground">Privacy</Link>
          <a href="https://x.com/Tobby_scraper" target="_blank" rel="noopener noreferrer" className="transition hover:text-foreground">Twitter</a>
        </div>
        <p className="text-xs text-muted/40">&copy; {new Date().getFullYear()} OctoBoost. All rights reserved.</p>
      </div>
    </footer>
  );
}
