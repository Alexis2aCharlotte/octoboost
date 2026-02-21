"use client";

type AgentStatus = "active" | "paused" | "draft";

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  status: AgentStatus;
  conversations: number;
  avgRating: number;
  createdAt: string;
}

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string }> = {
  active: { label: "Actif", color: "bg-emerald-500/20 text-emerald-400" },
  paused: { label: "En pause", color: "bg-amber-500/20 text-amber-400" },
  draft: { label: "Brouillon", color: "bg-zinc-500/20 text-zinc-400" },
};

const MODEL_LABELS: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "claude-3.5-sonnet": "Claude 3.5",
  "mistral-large": "Mistral Large",
};

export function AgentCard({ agent }: { agent: Agent }) {
  const status = STATUS_CONFIG[agent.status];

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900">
      {/* Status Badge */}
      <div className="mb-4 flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
        <span className="text-xs text-zinc-500">
          {MODEL_LABELS[agent.model] || agent.model}
        </span>
      </div>

      {/* Agent Info */}
      <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
      <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{agent.description}</p>

      {/* Stats */}
      <div className="mt-6 flex items-center gap-6 border-t border-zinc-800 pt-4">
        <div>
          <p className="text-xs text-zinc-500">Conversations</p>
          <p className="text-sm font-medium text-white">
            {agent.conversations.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Rating</p>
          <p className="text-sm font-medium text-white">
            {agent.avgRating > 0 ? `${agent.avgRating}/5` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Created on</p>
          <p className="text-sm font-medium text-white">{agent.createdAt}</p>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute inset-x-0 bottom-0 flex translate-y-2 justify-center gap-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
        <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500">
          Configurer
        </button>
        <button className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-600">
          Tester
        </button>
      </div>
    </div>
  );
}
