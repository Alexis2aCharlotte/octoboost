"use client";

import { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DemoData {
  project: any;
  keywords: any[];
  clusters: any[];
  articles: any[];
  channels: any[];
  analysis: any | null;
  overview: any;
  schedule: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface DemoContextType {
  isDemo: boolean;
  basePath: string;
  demoData: DemoData | null;
  demoLoading: boolean;
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  basePath: "/dashboard",
  demoData: null,
  demoLoading: false,
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [demoLoading, setDemoLoading] = useState(true);

  useEffect(() => {
    fetch("/api/demo/data")
      .then((r) => r.json())
      .then((data) => setDemoData(data))
      .catch(() => {})
      .finally(() => setDemoLoading(false));
  }, []);

  return (
    <DemoContext.Provider value={{ isDemo: true, basePath: "/demo", demoData, demoLoading }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const { isDemo, basePath, demoData, demoLoading } = useContext(DemoContext);

  const fetchUrl = useCallback(
    (url: string) =>
      isDemo ? `${url}${url.includes("?") ? "&" : "?"}demo=true` : url,
    [isDemo],
  );

  const projectPath = useCallback(
    (slug: string, page: string) => `${basePath}/projects/${slug}/${page}`,
    [basePath],
  );

  return useMemo(
    () => ({ isDemo, basePath, fetchUrl, projectPath, demoData, demoLoading }),
    [isDemo, basePath, fetchUrl, projectPath, demoData, demoLoading],
  );
}
