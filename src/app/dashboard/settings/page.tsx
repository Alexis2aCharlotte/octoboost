"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Mail,
  Lock,
  Shield,
  CreditCard,
  Crown,
  Loader2,
  ArrowRight,
  LogOut,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Zap,
} from "lucide-react";

type PlanType = "free" | "explore" | "pro";

interface ProfileData {
  full_name: string | null;
  has_password: boolean;
  plan: PlanType;
  status: string;
  interval: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
}

const PLAN_CONFIG: Record<PlanType, { label: string; color: string; bg: string }> = {
  free: { label: "Free", color: "text-muted", bg: "bg-muted/10" },
  explore: { label: "Explore", color: "text-accent-light", bg: "bg-accent/10" },
  pro: { label: "Pro", color: "text-amber-400", bg: "bg-amber-400/10" },
};

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [portalLoading, setPortalLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        let { data } = await supabase
          .from("profiles")
          .select("full_name, has_password, plan, status, interval, current_period_end, stripe_customer_id")
          .eq("user_id", user.id)
          .single();

        if (!data) {
          await supabase
            .from("profiles")
            .upsert({ user_id: user.id, email: user.email }, { onConflict: "user_id" });
          const res = await supabase
            .from("profiles")
            .select("full_name, has_password, plan, status, interval, current_period_end, stripe_customer_id")
            .eq("user_id", user.id)
            .single();
          data = res.data;
        }

        if (data) {
          setProfile(data as ProfileData);
          setFullName(data.full_name ?? "");
        }
      }
      setLoading(false);
    });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage({ type: "error", text: "Not authenticated" });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user.id);

    setMessage(error ? { type: "error", text: error.message } : { type: "success", text: "Profile updated" });
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMessage({ type: "error", text: error.message });
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ has_password: true }).eq("user_id", user.id);
      }
      setProfile((prev) => prev ? { ...prev, has_password: true } : prev);
      setPasswordMessage({
        type: "success",
        text: profile?.has_password ? "Password updated" : "Password set! You can now log in anytime.",
      });
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (res.ok) {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-light" />
      </div>
    );
  }

  const planConfig = PLAN_CONFIG[profile?.plan ?? "free"];
  const isFree = profile?.plan === "free";
  const hasPassword = profile?.has_password ?? false;

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your profile, billing, and account</p>
      </div>

      {/* ── Section 1: Profile ── */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-accent-light" />
            Profile
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-5 p-4 sm:p-6">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              <Mail className="h-3 w-3" /> Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-muted outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              <User className="h-3 w-3" /> Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </form>
      </section>

      {/* ── Section 2: Plan & Billing ── */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="h-4 w-4 text-accent-light" />
            Plan & Billing
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${planConfig.bg}`}>
                {isFree ? (
                  <Zap className={`h-5 w-5 ${planConfig.color}`} />
                ) : (
                  <Crown className={`h-5 w-5 ${planConfig.color}`} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{planConfig.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${planConfig.bg} ${planConfig.color}`}
                  >
                    {profile?.status === "active" ? "Active" : profile?.status ?? "Active"}
                  </span>
                </div>
                {!isFree && profile?.interval && (
                  <p className="text-xs text-muted">
                    Billed {profile.interval}
                  </p>
                )}
              </div>
            </div>

            {isFree ? (
              <button
                onClick={() => router.push("/pricing")}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-accent-light"
              >
                Upgrade
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium transition hover:border-accent/50 hover:text-foreground disabled:opacity-50"
              >
                {portalLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    Manage subscription
                    <ExternalLink className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>

          {!isFree && profile?.current_period_end && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-background/50 px-4 py-3 text-xs text-muted">
              <Calendar className="h-3.5 w-3.5" />
              Next billing date: {new Date(profile.current_period_end).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}

          {isFree && (
            <div className="mt-4 rounded-lg bg-accent/5 border border-accent/10 px-4 py-3 text-xs text-muted">
              Unlock unlimited articles, auto-publishing, and more by upgrading your plan.
            </div>
          )}
        </div>
      </section>

      {/* ── Section 3: Security ── */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {hasPassword ? (
              <Lock className="h-4 w-4 text-accent-light" />
            ) : (
              <Shield className="h-4 w-4 text-accent-light" />
            )}
            Security
          </div>
          {!hasPassword && (
            <p className="mt-1 text-xs text-muted">
              You signed up without a password. Set one now so you can log back in anytime.
            </p>
          )}
        </div>
        <form
          onSubmit={handleChangePassword}
          className={`space-y-5 p-4 sm:p-6 ${!hasPassword ? "bg-accent/[0.02]" : ""}`}
        >
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              <Lock className="h-3 w-3" />
              {hasPassword ? "New password" : "Password"}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              <Lock className="h-3 w-3" />
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
            />
          </div>

          {passwordMessage && (
            <p className={`text-sm ${passwordMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {passwordMessage.text}
            </p>
          )}

          <button
            type="submit"
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              !hasPassword
                ? "bg-accent text-white hover:bg-accent-light"
                : "border border-border hover:border-accent/50 hover:text-foreground"
            }`}
          >
            {hasPassword ? "Update password" : "Set password"}
          </button>
        </form>
      </section>

      {/* ── Section 4: Danger Zone ── */}
      <section className="overflow-hidden rounded-xl border border-red-500/20 bg-card">
        <div className="border-b border-red-500/20 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </div>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted">Sign out of your account on this device</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-medium transition hover:border-red-500/30 hover:text-red-400"
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-red-500/10 bg-red-500/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-red-400">Delete account</p>
              <p className="text-xs text-muted">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      </section>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-red-500/20 bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Delete Account</h3>
            </div>
            <p className="mb-2 text-sm text-muted">
              This action is <strong className="text-foreground">permanent and irreversible</strong>.
              All your projects, articles, and data will be deleted.
            </p>
            {!isFree && (
              <p className="mb-4 text-sm text-muted">
                Your Stripe subscription will also be cancelled immediately.
              </p>
            )}
            <label className="mb-1.5 block text-xs font-medium text-muted">
              Type <strong className="text-foreground">DELETE</strong> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="mb-4 w-full rounded-lg border border-red-500/20 bg-background px-4 py-2.5 text-sm outline-none transition focus:border-red-500/50"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:border-accent/50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-40"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
