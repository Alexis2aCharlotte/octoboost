"use client";

import { useState } from "react";
import { X, Zap, Calendar, Clock, Loader2, AlertCircle, Check } from "lucide-react";
import DateTimePicker from "@/components/DateTimePicker";

interface PublishDialogProps {
  variantId: string;
  variantTitle: string;
  platform: string;
  scheduledAt?: string | null;
  onPublishNow: (variantId: string) => Promise<void>;
  onReschedule: (variantId: string, date: string) => Promise<void>;
  onClose: () => void;
}

export default function PublishDialog({
  variantId,
  variantTitle,
  platform,
  scheduledAt,
  onPublishNow,
  onReschedule,
  onClose,
}: PublishDialogProps) {
  const [mode, setMode] = useState<"choice" | "reschedule">("choice");
  const [newDate, setNewDate] = useState(() => {
    if (scheduledAt) {
      const d = new Date(scheduledAt);
      return d.toISOString().slice(0, 16);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [publishing, setPublishing] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; reason?: string } | null>(null);
  const [validating, setValidating] = useState(false);

  const scheduledLabel = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  async function handlePublishNow() {
    setPublishing(true);
    try {
      await onPublishNow(variantId);
      onClose();
    } catch {
      setPublishing(false);
    }
  }

  async function handleValidateDate(dateValue: string) {
    setNewDate(dateValue);
    setValidation(null);
    if (!dateValue) return;

    setValidating(true);
    try {
      const isoDate = new Date(dateValue).toISOString();
      const res = await fetch(`/api/variants/${variantId}/schedule?date=${encodeURIComponent(isoDate)}`);
      const data = await res.json();
      setValidation(data);
    } catch {
      setValidation({ valid: false, reason: "Validation failed" });
    } finally {
      setValidating(false);
    }
  }

  async function handleReschedule() {
    if (!newDate || !validation?.valid) return;
    setRescheduling(true);
    try {
      const isoDate = new Date(newDate).toISOString();
      await onReschedule(variantId, isoDate);
      onClose();
    } catch {
      setRescheduling(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">Publish</h3>
            <p className="mt-0.5 truncate text-xs text-muted">{variantTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-card-hover hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {scheduledLabel && mode === "choice" && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-400">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Scheduled: {scheduledLabel}</span>
            </div>
          )}

          {mode === "choice" ? (
            <div className="space-y-3">
              <button
                onClick={handlePublishNow}
                disabled={publishing}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card-hover p-4 text-left transition hover:border-accent/50 disabled:opacity-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  {publishing ? (
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  ) : (
                    <Zap className="h-5 w-5 text-accent" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Publish Now</p>
                  <p className="text-xs text-muted">
                    Publish to {platform} immediately
                  </p>
                </div>
              </button>

              {scheduledAt ? (
                <button
                  onClick={() => {
                    setMode("reschedule");
                    handleValidateDate(newDate);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card-hover p-4 text-left transition hover:border-accent/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reschedule</p>
                    <p className="text-xs text-muted">Change the scheduled date</p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMode("reschedule");
                    handleValidateDate(newDate);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card-hover p-4 text-left transition hover:border-accent/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Schedule</p>
                    <p className="text-xs text-muted">Pick a date for auto-publish</p>
                  </div>
                </button>
              )}

              {scheduledAt && (
                <button
                  onClick={onClose}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card-hover p-4 text-left transition hover:border-accent/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                    <Check className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Keep Scheduled</p>
                    <p className="text-xs text-muted">
                      Auto-publish on {scheduledLabel}
                    </p>
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Publication date & time
                </label>
                <DateTimePicker value={newDate} onChange={handleValidateDate} />
              </div>

              {validating && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Validating...
                </div>
              )}

              {validation && !validating && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  validation.valid
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}>
                  {validation.valid ? (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {validation.valid ? "This slot is available" : validation.reason}
                </div>
              )}

              <div className="rounded-lg bg-card-hover px-3 py-2 text-[11px] text-muted/70">
                Max 2 publications per day · Max 2 blog articles per week · 1 per platform per day
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setMode("choice")}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:bg-card-hover hover:text-foreground"
                >
                  Back
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!validation?.valid || rescheduling}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                >
                  {rescheduling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
