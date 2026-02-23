"use client";

import { ProjectCacheProvider } from "@/lib/project-cache";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <ProjectCacheProvider>{children}</ProjectCacheProvider>;
}
