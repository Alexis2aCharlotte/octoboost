"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  Search,
  BarChart3,
  Settings,
  ChevronRight,
  LayoutDashboard,
  Send,
  Eye,
  Menu,
  X,
} from "lucide-react";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { PlanProvider, usePlan } from "@/lib/hooks/use-plan";
import { SetPasswordBanner } from "@/components/SetPasswordBanner";
import { Lock } from "lucide-react";

const globalNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

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

function useProjectId(): string | null {
  const pathname = usePathname();
  const match = pathname.match(/\/dashboard\/projects\/([^/]+)/);
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
  const projectId = useProjectId();
  const { isFree, loading: planLoading } = usePlan();
  const lockedSegments = isFree && !planLoading ? new Set(["publish"]) : new Set<string>();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Backdrop for mobile */}
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
            href="/dashboard"
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
            {globalNavItems.map(({ href, icon: Icon, label }) => {
              const isActive =
                href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
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

          {projectId && (
            <>
              <div className="my-4 border-t border-border" />
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted/50">
                Project
              </p>
              <div className="space-y-0.5">
                {projectNavItems.map(({ segment, icon: Icon, label }) => {
                  const href = `/dashboard/projects/${projectId}/${segment}`;
                  const isActive = pathname.startsWith(href);
                  const isLocked = lockedSegments.has(segment);

                  if (isLocked) {
                    return (
                      <div
                        key={segment}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted/30 cursor-not-allowed"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                        <Lock className="ml-auto h-3 w-3" />
                      </div>
                    );
                  }

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
  const projectId = useProjectId();

  let currentPage = "Dashboard";

  if (pathname === "/dashboard/settings") currentPage = "Settings";
  else if (projectId) {
    const segment = pathname.split("/").pop();
    currentPage = pageNames[segment ?? ""] ?? "Project";
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 md:px-6">
      <button
        className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground md:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-1.5 text-sm text-muted">
        <Link
          href="/dashboard"
          className="hidden transition-colors hover:text-foreground sm:inline"
        >
          OctoBoost
        </Link>
        <ChevronRight className="hidden h-3 w-3 text-muted/40 sm:inline" />
        {projectId ? (
          <>
            <Link
              href="/dashboard"
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

export default function DashboardLayout({
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
    <PlanProvider>
      <ToastProvider>
        <ConfirmProvider>
          <div className="min-h-screen bg-background text-foreground">
            <div className="grid-bg" />
            <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />
            <div
              className="relative md:pl-60"
              style={{ zIndex: 1 }}
            >
              <TopBar onMenuToggle={toggleSidebar} />
              <main className="min-w-0 overflow-x-hidden px-4 py-4 md:px-8 md:py-6">
                <SetPasswordBanner />
                {children}
              </main>
            </div>
          </div>
        </ConfirmProvider>
      </ToastProvider>
    </PlanProvider>
  );
}
