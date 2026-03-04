"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import { useProjectCache } from "@/lib/project-cache";
import { useToast } from "@/components/Toast";

interface QueueCtx {
  activeGenId: string | null;
  activeStartedAt: number | null;
  queue: string[];
  enqueue: (clusterId: string) => void;
  isActive: (clusterId: string) => boolean;
  isQueued: (clusterId: string) => boolean;
  queuePosition: (clusterId: string) => number;
}

const ArticleQueueContext = createContext<QueueCtx>({
  activeGenId: null,
  activeStartedAt: null,
  queue: [],
  enqueue: () => {},
  isActive: () => false,
  isQueued: () => false,
  queuePosition: () => -1,
});

export function ArticleQueueProvider({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { data: cachedData, refresh } = useProjectCache();
  const { toast } = useToast();

  const [queue, setQueue] = useState<string[]>([]);
  const [activeGenId, setActiveGenId] = useState<string | null>(null);
  const [activeStartedAt, setActiveStartedAt] = useState<number | null>(null);
  const processingRef = useRef(false);
  const initRef = useRef(false);

  const articles: { clusterId: string }[] = cachedData?.articles ?? [];
  const realProjectId: string | null = cachedData?.project?.projectId ?? null;
  const articleClusterIds = new Set(articles.map((a: { clusterId: string }) => a.clusterId));

  // Restore from localStorage on first mount
  useEffect(() => {
    if (!id || initRef.current) return;
    initRef.current = true;
    const key = `octoboost_queue_${id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const saved: { queue: string[]; activeId: string | null; startedAt: number; activeStartedAt?: number } = JSON.parse(raw);
      const elapsed = (Date.now() - saved.startedAt) / 1000;
      if (elapsed > 600) { localStorage.removeItem(key); return; }
      const remaining = saved.queue.filter((cid) => !articleClusterIds.has(cid));
      const activeStillPending = saved.activeId && !articleClusterIds.has(saved.activeId);
      if (activeStillPending) {
        setActiveGenId(saved.activeId);
        setActiveStartedAt(saved.activeStartedAt ?? saved.startedAt);
      }
      if (remaining.length > 0) setQueue(remaining);
    } catch {
      localStorage.removeItem(key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Persist to localStorage
  useEffect(() => {
    if (!id) return;
    const key = `octoboost_queue_${id}`;
    if (queue.length === 0 && !activeGenId) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify({ queue, activeId: activeGenId, startedAt: Date.now(), activeStartedAt }));
    }
  }, [queue, activeGenId, activeStartedAt, id]);

  // Poll for completion when waiting on a restored active generation
  useEffect(() => {
    if (!activeGenId || processingRef.current) return;
    const interval = setInterval(() => { refresh(); }, 5000);
    return () => clearInterval(interval);
  }, [activeGenId, refresh]);

  // Clear active when article appears in cache
  useEffect(() => {
    if (!activeGenId) return;
    if (articleClusterIds.has(activeGenId)) setActiveGenId(null);
  }, [activeGenId, articleClusterIds]);

  // Queue processor
  useEffect(() => {
    if (activeGenId || queue.length === 0 || processingRef.current || !realProjectId) return;
    const nextId = queue[0];
    if (articleClusterIds.has(nextId)) {
      setQueue((q) => q.slice(1));
      return;
    }
    processingRef.current = true;
    const now = Date.now();
    setActiveGenId(nextId);
    setActiveStartedAt(now);
    setQueue((q) => q.slice(1));

    (async () => {
      try {
        const res = await fetch(`/api/articles/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clusterId: nextId, projectId: realProjectId }),
        });
        if (res.ok || res.status === 409) {
          await refresh();
        } else {
          const data = await res.json();
          toast(data.error || "Generation failed");
        }
      } catch {
        // server may still be generating
      } finally {
        setActiveGenId(null);
        setActiveStartedAt(null);
        processingRef.current = false;
      }
    })();
  }, [activeGenId, queue, realProjectId, articleClusterIds, refresh, toast]);

  const enqueue = useCallback((clusterId: string) => {
    if (activeGenId === clusterId) return;
    setQueue((q) => {
      if (q.includes(clusterId)) return q;
      return [...q, clusterId];
    });
  }, [activeGenId]);

  const isActive = useCallback((clusterId: string) => activeGenId === clusterId, [activeGenId]);
  const isQueued = useCallback((clusterId: string) => queue.includes(clusterId), [queue]);
  const queuePosition = useCallback((clusterId: string) => queue.indexOf(clusterId), [queue]);

  return (
    <ArticleQueueContext.Provider value={{ activeGenId, activeStartedAt, queue, enqueue, isActive, isQueued, queuePosition }}>
      {children}
    </ArticleQueueContext.Provider>
  );
}

export function useArticleQueue() {
  return useContext(ArticleQueueContext);
}
