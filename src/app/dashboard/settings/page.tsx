"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Settings, User, Mail, Lock, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setFullName((user.user_metadata?.full_name as string) ?? "");
      }
      setLoading(false);
    });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated" });
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Passwords do not match",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMessage({ type: "error", text: error.message });
    } else {
      setPasswordMessage({ type: "success", text: "Password updated" });
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-light" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your profile and account
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <User className="h-4 w-4 text-accent-light" />
          Profile
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-muted outline-none"
          />
          <p className="mt-1 text-xs text-muted">
            Email cannot be changed at this time
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
          />
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="space-y-6 rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lock className="h-4 w-4 text-accent-light" />
          Change password
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">
            New password
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
          <label className="mb-1.5 block text-sm text-muted">
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
          <p
            className={`text-sm ${
              passwordMessage.type === "success"
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {passwordMessage.text}
          </p>
        )}

        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:border-accent/50 hover:text-foreground"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
