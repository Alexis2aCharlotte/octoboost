"use client";

import { ProjectCacheProvider } from "@/lib/project-cache";
import { ArticleQueueProvider } from "@/lib/article-queue";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectCacheProvider>
      <ArticleQueueProvider>{children}</ArticleQueueProvider>
    </ProjectCacheProvider>
  );
}
