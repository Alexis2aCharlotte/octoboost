"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, X, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePlan } from "@/lib/hooks/use-plan";

export function SetPasswordBanner() {
  const { isFree, loading: planLoading } = usePlan();
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (planLoading) return;
    if (!isFree) {
      setChecking(false);
      return;
    }

    if (sessionStorage.getItem("ob_pw_banner_dismissed")) {
      setChecking(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("has_password")
          .eq("user_id", user.id)
          .single();
        if (profile && !profile.has_password) {
          setVisible(true);
        }
      }
      setChecking(false);
    });
  }, [isFree, planLoading]);

  if (checking || !visible) return null;

  function dismiss() {
    sessionStorage.setItem("ob_pw_banner_dismissed", "1");
    setVisible(false);
  }

  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
        <Shield className="h-4 w-4 text-accent-light" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Secure your account</p>
        <p className="text-xs text-muted">
          Set a password so you can log back in anytime.
        </p>
      </div>
      <Link
        href="/dashboard/settings"
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-white transition hover:bg-accent-light"
      >
        Set password
        <ArrowRight className="h-3 w-3" />
      </Link>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 text-muted/40 transition hover:text-muted"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
