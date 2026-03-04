"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useParams, usePathname } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ProjectCache {
  data: any | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProjectCacheContext = createContext<ProjectCache>({
  data: null,
  loading: true,
  refresh: async () => {},
});

const cache = new Map<string, { data: any; ts: number }>();

export function ProjectCacheProvider({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const [data, setData] = useState<any | null>(() => {
    if (!id) return null;
    const cached = cache.get(id);
    return cached?.data ?? null;
  });
  const [loading, setLoading] = useState(!data);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!id || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await fetch(`/api/projects/${id}/all`);
      if (res.ok) {
        const json = await res.json();
        cache.set(id, { data: json, ts: Date.now() });
        setData(json);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const cached = cache.get(id);
    if (cached) {
      setData(cached.data);
      setLoading(false);
    } else {
      setLoading(true);
    }
    fetchData();
  }, [id, pathname, fetchData]);

  const refresh = useCallback(async () => {
    if (id) cache.delete(id);
    setLoading(true);
    await fetchData();
  }, [id, fetchData]);

  return (
    <ProjectCacheContext.Provider value={{ data, loading, refresh }}>
      {children}
    </ProjectCacheContext.Provider>
  );
}

export function useProjectCache() {
  return useContext(ProjectCacheContext);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
