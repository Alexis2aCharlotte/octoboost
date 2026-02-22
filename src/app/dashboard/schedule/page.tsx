import { Calendar, Clock, Plus, Zap } from "lucide-react";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SchedulePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm text-muted">
            Configure your publishing calendar. PostBox generates and publishes
            articles automatically.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light">
          <Plus className="h-4 w-4" />
          New Schedule
        </button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <Calendar className="h-7 w-7 text-accent-light" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">No schedules configured</h3>
        <p className="mb-6 max-w-sm text-center text-sm text-muted">
          Create a publishing schedule to automate article generation and
          publication. Connect at least one channel first.
        </p>
        <div className="flex gap-3">
          <a
            href="/dashboard/channels"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:border-accent/50 hover:text-foreground"
          >
            Connect Channels
          </a>
          <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-light">
            <Zap className="h-4 w-4" />
            Create Schedule
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium">Weekly Overview</h3>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center">
              <span className="mb-2 block text-xs text-muted">{day}</span>
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted">
                —
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
