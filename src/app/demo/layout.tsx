"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  Search,
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  Send,
  Eye,
  Rocket,
} from "lucide-react";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { DemoProvider } from "@/lib/demo/context";

const projectNavItems = [
  { segment: "overview", icon: Eye, label: "Overview" },
  { segment: "research", icon: Search, label: "Research" },
  { segment: "articles", icon: FileText, label: "Articles" },
  { segment: "publish", icon: Send, label: "Publish" },
  { segment: "analytics", icon: BarChart3, label: "Analytics" },
];

const pageNames: Record<string, string> = {
  overview: "Overview",
  research: "Research",
  articles: "Articles",
  publish: "Publish",
  analytics: "Analytics",
};

function useProjectSlug(): string | null {
  const pathname = usePathname();
  const match = pathname.match(/\/demo\/projects\/([^/]+)/);
  return match ? match[1] : null;
}

function Sidebar() {
  const pathname = usePathname();
  const projectSlug = useProjectSlug();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border bg-[#0a0f1e]">
      <Link
        href="/demo"
        className="flex h-20 shrink-0 items-center gap-3 border-b border-border px-4 transition-opacity hover:opacity-90"
      >
        <Image
          src="/Logo Octoboost.png"
          alt="OctoBoost"
          width={120}
          height={120}
          className="h-[44px] w-[44px] shrink-0 object-contain"
          priority
        />
        <span className="text-xl font-bold tracking-tight">OctoBoost</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pt-2">
        <div className="space-y-0.5">
          <Link
            href="/demo"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === "/demo"
                ? "bg-white/[0.06] font-medium text-foreground"
                : "text-muted hover:bg-white/[0.04] hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {projectSlug && (
          <>
            <div className="my-4 border-t border-border" />
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted/50">
              Project
            </p>
            <div className="space-y-0.5">
              {projectNavItems.map(({ segment, icon: Icon, label }) => {
                const href = `/demo/projects/${projectSlug}/${segment}`;
                const isActive = pathname.startsWith(href);

                return (
                  <Link
                    key={segment}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-white/[0.06] font-medium text-foreground"
                        : "text-muted hover:bg-white/[0.04] hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}

function TopBar() {
  const pathname = usePathname();
  const projectSlug = useProjectSlug();

  let currentPage = "Dashboard";
  if (projectSlug) {
    const segment = pathname.split("/").pop();
    currentPage = pageNames[segment ?? ""] ?? "Project";
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/demo" className="transition-colors hover:text-foreground">
          OctoBoost
        </Link>
        <ChevronRight className="h-3 w-3 text-muted/40" />
        {projectSlug ? (
          <>
            <Link
              href="/demo"
              className="transition-colors hover:text-foreground"
            >
              Projects
            </Link>
            <ChevronRight className="h-3 w-3 text-muted/40" />
            <span className="font-medium text-foreground">{currentPage}</span>
          </>
        ) : (
          <span className="font-medium text-foreground">{currentPage}</span>
        )}
      </div>
    </header>
  );
}

function DemoBanner() {
  return (
    <div className="sticky top-14 z-20 flex items-center justify-between border-b border-accent/20 bg-accent/5 px-6 py-2.5 backdrop-blur-sm">
      <p className="text-sm text-accent-light">
        <span className="font-medium">Demo Mode</span>
        <span className="ml-2 text-muted">
          You&apos;re viewing a demo project with real data.
        </span>
      </p>
      <Link
        href="/waitlist"
        className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
      >
        <Rocket className="h-3.5 w-3.5" />
        Join the waitlist
      </Link>
    </div>
  );
}

function interceptExternalClicks(e: React.MouseEvent) {
  const target = e.target as HTMLElement;
  const link = target.closest("a");
  if (!link) return;

  const href = link.getAttribute("href") ?? "";
  const isExternal =
    link.target === "_blank" ||
    href.startsWith("http") ||
    href.startsWith("/api/auth");

  if (isExternal) {
    e.preventDefault();
    e.stopPropagation();
  }
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProvider>
      <ToastProvider>
        <ConfirmProvider>
          <div
            className="min-h-screen bg-background text-foreground"
            onClick={interceptExternalClicks}
          >
            <div className="grid-bg" />
            <Sidebar />
            <div className="relative pl-60" style={{ zIndex: 1 }}>
              <TopBar />
              <DemoBanner />
              <main className="px-8 py-6">{children}</main>
            </div>
          </div>
        </ConfirmProvider>
      </ToastProvider>
    </DemoProvider>
  );
}
