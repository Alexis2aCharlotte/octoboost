"use client";

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
} from "lucide-react";

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

function Sidebar() {
  const pathname = usePathname();
  const projectId = useProjectId();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border bg-[#0a0f1e]">
      <Link href="/dashboard" className="flex h-20 shrink-0 items-center gap-3 border-b border-border px-4 transition-opacity hover:opacity-90">
        <Image
          src="/Logo Octoboost.png"
          alt="OctoBoost"
          width={120}
          height={120}
          className="h-[44px] w-[44px] shrink-0 object-contain"
          priority
        />
        <span className="text-lg font-bold tracking-tight">OctoBoost</span>
      </Link>

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
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
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
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted/50">
              Project
            </p>
            <div className="space-y-0.5">
              {projectNavItems.map(({ segment, icon: Icon, label }) => {
                const href = `/dashboard/projects/${projectId}/${segment}`;
                const isActive = pathname.startsWith(href);

                return (
                  <Link
                    key={segment}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
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
  const projectId = useProjectId();

  let currentPage = "Dashboard";

  if (pathname === "/dashboard/settings") currentPage = "Settings";
  else if (projectId) {
    const segment = pathname.split("/").pop();
    currentPage = pageNames[segment ?? ""] ?? "Project";
  }

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-1.5 text-[13px] text-muted">
        <Link href="/dashboard" className="transition-colors hover:text-foreground">
          OctoBoost
        </Link>
        <ChevronRight className="h-3 w-3 text-muted/40" />
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid-bg" />
      <Sidebar />
      <div className="relative pl-60" style={{ zIndex: 1 }}>
        <TopBar />
        <main className="px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
