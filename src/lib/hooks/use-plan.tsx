"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";

export type PlanType = "free" | "explore" | "pro";

interface PlanState {
  plan: PlanType;
  isFree: boolean;
  isPaid: boolean;
  loading: boolean;
}

const PlanContext = createContext<PlanState | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlanType>("free");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((data) => {
        const p = (data.plan ?? "free") as PlanType;
        setPlan(p);
      })
      .catch(() => setPlan("free"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const value: PlanState = {
    plan,
    isFree: plan === "free",
    isPaid: plan === "explore" || plan === "pro",
    loading,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanState {
  const ctx = useContext(PlanContext);
  if (ctx) return ctx;

  // Fallback for components outside PlanProvider (shouldn't happen in dashboard)
  const [plan, setPlan] = useState<PlanType>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((data) => setPlan((data.plan ?? "free") as PlanType))
      .catch(() => setPlan("free"))
      .finally(() => setLoading(false));
  }, []);

  return {
    plan,
    isFree: plan === "free",
    isPaid: plan === "explore" || plan === "pro",
    loading,
  };
}
