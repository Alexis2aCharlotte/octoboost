import Link from "next/link";
import Image from "next/image";
import { Wrench, ArrowLeft } from "lucide-react";

/*
 * ──────────────────────────────────────────────────────────────────
 * MAINTENANCE MODE – The full demo layout is preserved below
 * (commented out). To restore the demo, swap the default export
 * back to DemoLayout and uncomment the imports / code.
 * ──────────────────────────────────────────────────────────────────
 */

export default function DemoMaintenanceLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="grid-bg" />
      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center gap-6 px-6 text-center">
        <Image
          src="/Logo Octoboost.png"
          alt="OctoBoost"
          width={80}
          height={80}
          className="h-16 w-16 object-contain"
          priority
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <Wrench className="h-7 w-7 text-accent" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Demo under maintenance
        </h1>
        <p className="text-muted">
          We&apos;re upgrading the interactive demo to give you an even better
          experience. It will be back shortly!
        </p>

        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>
      </div>
    </div>
  );
}

/* ================================================================
   ORIGINAL DEMO LAYOUT — keep for later re-activation
   ================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
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
  Menu,
  X,
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

function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const projectSlug = useProjectSlug();

  useEffect(() => {
    onClose();
  }, [pathname]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-border bg-[#0a0f1e] transition-transform duration-300 ease-in-out md:z-40 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-border px-4">
          <Link
            href="/demo"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
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
          <button
            className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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
    </>
  );
}

function TopBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const pathname = usePathname();
  const projectSlug = useProjectSlug();

  let currentPage = "Dashboard";
  if (projectSlug) {
    const segment = pathname.split("/").pop();
    currentPage = pageNames[segment ?? ""] ?? "Project";
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground md:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <Link
            href="/demo"
            className="hidden transition-colors hover:text-foreground sm:inline"
          >
            OctoBoost
          </Link>
          <ChevronRight className="hidden h-3 w-3 text-muted/40 sm:inline" />
          {projectSlug ? (
            <>
              <Link
                href="/demo"
                className="transition-colors hover:text-foreground"
              >
                Projects
              </Link>
              <ChevronRight className="h-3 w-3 text-muted/40" />
              <span className="font-medium text-foreground">
                {currentPage}
              </span>
            </>
          ) : (
            <span className="font-medium text-foreground">{currentPage}</span>
          )}
        </div>
      </div>
    </header>
  );
}

function DemoBanner() {
  return (
    <div className="sticky top-14 z-20 flex flex-col items-start gap-2 border-b border-accent/20 bg-accent/5 px-4 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-accent-light">
        <span className="font-medium">Demo Mode</span>
        <span className="ml-2 hidden text-muted sm:inline">
          You&apos;re viewing a demo project with real data.
        </span>
      </p>
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
      >
        <Rocket className="h-3.5 w-3.5" />
        Start generating
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

function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(
    () => setSidebarOpen((prev) => !prev),
    []
  );

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen]);

  return (
    <DemoProvider>
      <ToastProvider>
        <ConfirmProvider>
          <div
            className="min-h-screen bg-background text-foreground"
            onClick={interceptExternalClicks}
          >
            <div className="grid-bg" />
            <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />
            <div
              className="relative md:pl-60"
              style={{ zIndex: 1 }}
            >
              <TopBar onMenuToggle={toggleSidebar} />
              <DemoBanner />
              <main className="px-4 py-4 md:px-8 md:py-6">{children}</main>
            </div>
          </div>
        </ConfirmProvider>
      </ToastProvider>
    </DemoProvider>
  );
}

================================================================ */
