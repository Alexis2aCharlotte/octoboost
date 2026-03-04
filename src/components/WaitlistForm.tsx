"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function WaitlistForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    try {
      new URL(normalized);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    setError("");
    router.push(`/generate?url=${encodeURIComponent(normalized)}`);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-md gap-2">
        <input
          name="url"
          type="url"
          required
          placeholder="https://mysaas.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
        />
        <button
          type="submit"
          className="btn-glow flex items-center gap-2 rounded-lg px-6 py-3 text-sm"
        >
          Start Generating
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>
      {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
