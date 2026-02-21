"use client";

import { useState } from "react";
import { AgentCard } from "./agent-card";
import { CreateAgentDialog } from "./create-agent-dialog";

const MOCK_AGENTS = [
  {
    id: "agent-1",
    name: "Support Bot",
    description: "Intelligent customer support agent with knowledge base access",
    model: "gpt-4o",
    status: "active" as const,
    conversations: 1247,
    avgRating: 4.6,
    createdAt: "2026-01-15",
  },
  {
    id: "agent-2",
    name: "Code Reviewer",
    description: "Automated code analysis and review with improvement suggestions",
    model: "claude-3.5-sonnet",
    status: "active" as const,
    conversations: 834,
    avgRating: 4.8,
    createdAt: "2026-01-22",
  },
  {
    id: "agent-3",
    name: "Data Analyst",
    description: "Data analysis and automated report generation",
    model: "gpt-4o",
    status: "paused" as const,
    conversations: 412,
    avgRating: 4.3,
    createdAt: "2026-02-01",
  },
  {
    id: "agent-4",
    name: "ClawdBot Remote",
    description: "Collaborative agent with GitHub codebase access — Remote Agent Protocol",
    model: "claude-3.5-sonnet",
    status: "draft" as const,
    conversations: 0,
    avgRating: 0,
    createdAt: "2026-02-11",
  },
];

export function AgentDashboard() {
  const [agents] = useState(MOCK_AGENTS);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            My Agents
          </h1>
          <p className="mt-1 text-zinc-400">
            {agents.length} agents created · {agents.filter(a => a.status === "active").length} active
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          + Nouvel Agent
        </button>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {showCreateDialog && (
        <CreateAgentDialog onClose={() => setShowCreateDialog(false)} />
      )}
    </div>
  );
}
