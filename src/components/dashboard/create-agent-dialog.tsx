"use client";

import { useState } from "react";

interface CreateAgentDialogProps {
  onClose: () => void;
}

export function CreateAgentDialog({ onClose }: CreateAgentDialogProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    name: "",
    description: "",
    model: "gpt-4o",
    systemPrompt: "",
    temperature: 0.7,
    maxTokens: 4096,
    tools: [] as string[],
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Create an Agent</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-indigo-600" : "bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Agent name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Ex: Support Bot, Code Reviewer..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Description</label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Describe what your agent does..."
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">LLM Model</label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                <option value="mistral-large">Mistral Large (Mistral AI)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: System Prompt */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">System Prompt</label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                placeholder="You are a specialized assistant in..."
                rows={8}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 font-mono text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm text-zinc-400">
                  Temperature: {config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm text-zinc-400">Max Tokens</label>
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Tools */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Select the tools available for your agent:</p>
            {[
              { id: "web-search", name: "Web Search", desc: "Real-time web search" },
              { id: "code-exec", name: "Code Execution", desc: "Run Python/JS code in a sandbox" },
              { id: "file-manager", name: "File Manager", desc: "Read and write files" },
              { id: "api-caller", name: "API Caller", desc: "HTTP calls to external APIs" },
              { id: "github-access", name: "GitHub Access", desc: "Access repos, PRs, GitHub issues" },
              { id: "db-query", name: "Database Query", desc: "SQL queries on the database" },
            ].map((tool) => (
              <label
                key={tool.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-700 p-3 transition-colors hover:border-zinc-600"
              >
                <input
                  type="checkbox"
                  checked={config.tools.includes(tool.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setConfig({ ...config, tools: [...config.tools, tool.id] });
                    } else {
                      setConfig({ ...config, tools: config.tools.filter(t => t !== tool.id) });
                    }
                  }}
                  className="rounded border-zinc-600"
                />
                <div>
                  <p className="text-sm font-medium text-white">{tool.name}</p>
                  <p className="text-xs text-zinc-500">{tool.desc}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-white"
          >
            {step > 1 ? "Retour" : "Annuler"}
          </button>
          <button
            onClick={() => step < 3 ? setStep(step + 1) : onClose()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            {step < 3 ? "Next" : "Create Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}
