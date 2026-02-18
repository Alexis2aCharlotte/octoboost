"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Send,
  FileText,
  Search,
  Globe,
  Calendar,
  BarChart3,
  Settings,
  Target,
  ChevronRight,
  LayoutDashboard,
  Megaphone,
} from "lucide-react";

const globalNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const projectNavItems = [
  { segment: "analyze", icon: Search, label: "Analyze" },
  { segment: "keywords", icon: Target, label: "Keywords" },
  { segment: "articles", icon: FileText, label: "Articles" },
  { segment: "channels", icon: Megaphone, label: "Channels" },
  { segment: "schedule", icon: Calendar, label: "Schedule" },
  { segment: "analytics", icon: BarChart3, label: "Analytics" },
];

function useProjectId(): string | null {
  const pathname = usePathname();
  const match = pathname.match(/\/dashboard\/projects\/([^/]+)/);
  return match ? match[1] : null;
}

function Sidebar() {
  const pathname = usePathname();
  const projectId = useProjectId();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
          <Send className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight">OctoBoost</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {globalNavItems.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-accent/10 font-medium text-accent-light"
                    : "text-muted hover:bg-card-hover hover:text-foreground"
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
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/60">
              Project
            </p>
            <div className="space-y-1">
              {projectNavItems.map(({ segment, icon: Icon, label }) => {
                const href = `/dashboard/projects/${projectId}/${segment}`;
                const isActive = pathname.startsWith(href);

                return (
                  <Link
                    key={segment}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-accent/10 font-medium text-accent-light"
                        : "text-muted hover:bg-card-hover hover:text-foreground"
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
    const names: Record<string, string> = {
      analyze: "Analyze",
      keywords: "Keywords",
      articles: "Articles",
      channels: "Channels",
      schedule: "Schedule",
      analytics: "Analytics",
    };
    currentPage = names[segment ?? ""] ?? "Project";
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/dashboard" className="transition hover:text-foreground">
          OctoBoost
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {projectId ? (
          <>
            <Link
              href="/dashboard"
              className="transition hover:text-foreground"
            >
              Projects
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{currentPage}</span>
          </>
        ) : (
          <span className="text-foreground">{currentPage}</span>
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
      <Sidebar />
      <div className="pl-60">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
