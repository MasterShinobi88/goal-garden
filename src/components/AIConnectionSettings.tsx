"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plug,
  Trash2,
  Unplug,
} from "lucide-react";
import {
  clearAIConnection,
  connectionStatusLabel,
  defaultAIConnection,
  loadAIConnection,
  saveAIConnection,
  type StoredAIConnection,
} from "@/lib/ai-config-client";
import {
  PROVIDER_META,
  type AIProviderId,
} from "@/lib/ai-providers";
import { cn } from "@/lib/utils";

const CONNECTABLE: AIProviderId[] = [
  "mock",
  "openai",
  "anthropic",
  "google",
  "xai",
  "custom",
];

export function AIConnectionSettings() {
  const [conn, setConn] = useState<StoredAIConnection>(defaultAIConnection());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [customModel, setCustomModel] = useState("");

  useEffect(() => {
    const c = loadAIConnection();
    setConn(c);
    setCustomModel(c.model);
  }, []);

  const meta = PROVIDER_META[conn.provider];

  function update(patch: Partial<StoredAIConnection>) {
    setConn((c) => ({ ...c, ...patch }));
    setSaved(false);
    setTestResult(null);
  }

  function handleProviderChange(provider: AIProviderId) {
    const m = PROVIDER_META[provider];
    update({
      provider,
      model: m.defaultModel,
      enabled: provider !== "mock",
    });
    setCustomModel(m.defaultModel);
  }

  function handleSave() {
    const next: StoredAIConnection = {
      ...conn,
      model: customModel.trim() || meta.defaultModel,
      enabled: conn.provider !== "mock" && conn.enabled,
    };
    if (next.provider === "mock") {
      next.enabled = false;
      next.apiKey = "";
    }
    saveAIConnection(next);
    setConn(next);
    setSaved(true);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const payload = {
        provider: conn.provider,
        model: customModel.trim() || meta.defaultModel,
        apiKey: conn.apiKey || undefined,
        baseUrl: conn.baseUrl || undefined,
      };
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({
          ok: false,
          message: data.error || "Connection failed",
        });
      } else {
        setTestResult({
          ok: true,
          message: data.message || `OK · ${data.provider} · ${data.model}`,
        });
        // Auto-enable on successful test
        const next = {
          ...conn,
          model: customModel.trim() || meta.defaultModel,
          enabled: conn.provider !== "mock",
        };
        saveAIConnection(next);
        setConn(next);
        setSaved(true);
      }
    } catch (e) {
      setTestResult({
        ok: false,
        message: e instanceof Error ? e.message : "Network error",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-accent" />
          <div>
            <h2 className="font-semibold">Connect your AI</h2>
            <p className="text-xs text-muted">
              Bring your own key — OpenAI, Claude, Gemini, xAI, or any
              OpenAI-compatible API.
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px]",
            conn.enabled && conn.provider !== "mock"
              ? "bg-accent/15 text-accent"
              : "bg-white/5 text-muted"
          )}
        >
          {connectionStatusLabel(conn)}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {CONNECTABLE.map((id) => {
          const m = PROVIDER_META[id];
          const active = conn.provider === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleProviderChange(id)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition",
                active
                  ? "border-accent/50 bg-accent/10"
                  : "border-border bg-black/20 hover:border-accent/30"
              )}
            >
              <p className="text-sm font-medium">{m.label}</p>
              <p className="mt-0.5 text-[11px] text-muted">{m.description}</p>
            </button>
          );
        })}
      </div>

      {conn.provider !== "mock" && (
        <div className="space-y-3 rounded-xl border border-border bg-black/20 p-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Model</label>
            <select
              className="input-field mb-2"
              value={
                meta.models.some((m) => m.id === customModel)
                  ? customModel
                  : "custom-model"
              }
              onChange={(e) => {
                if (e.target.value === "custom-model") {
                  setCustomModel(conn.model || meta.defaultModel);
                } else {
                  setCustomModel(e.target.value);
                }
                setSaved(false);
              }}
            >
              {meta.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
              {conn.provider === "custom" && (
                <option value="custom-model">Custom model id…</option>
              )}
            </select>
            {(conn.provider === "custom" ||
              !meta.models.some((m) => m.id === customModel)) && (
              <input
                className="input-field text-sm"
                value={customModel}
                onChange={(e) => {
                  setCustomModel(e.target.value);
                  setSaved(false);
                }}
                placeholder="Exact model id from your provider"
              />
            )}
          </div>

          {conn.provider === "custom" && (
            <div>
              <label className="mb-1 block text-xs text-muted">
                Base URL (OpenAI-compatible)
              </label>
              <input
                className="input-field text-sm"
                value={conn.baseUrl || ""}
                onChange={(e) => update({ baseUrl: e.target.value })}
                placeholder="http://127.0.0.1:11434/v1"
              />
              <p className="mt-1 text-[11px] text-muted">
                Examples: Ollama <code>http://127.0.0.1:11434/v1</code>, Groq{" "}
                <code>https://api.groq.com/openai/v1</code>
              </p>
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-muted">
                API key {conn.provider === "custom" && "(optional for local)"}
              </label>
              {meta.docsUrl && (
                <a
                  href={meta.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
                >
                  Get a key <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                className="input-field pr-10 font-mono text-sm"
                value={conn.apiKey}
                onChange={(e) => update({ apiKey: e.target.value })}
                placeholder={meta.keyPlaceholder || "API key"}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-500"
              checked={conn.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
            />
            Use this connection for Coach & plan generation
          </label>

          <p className="text-[11px] leading-relaxed text-muted">
            <KeyRound className="mr-1 inline h-3 w-3" />
            Your key is stored only in this browser (localStorage) and sent to{" "}
            <strong className="text-foreground">your Goal Garden server</strong>{" "}
            when generating plans or chatting. It is not written to our database.
            Prefer a restricted key with spend limits.
          </p>
        </div>
      )}

      {testResult && (
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            testResult.ok
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-danger/30 bg-danger/10 text-danger"
          )}
        >
          {testResult.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary text-sm" onClick={handleSave}>
          {saved ? <Check className="h-4 w-4" /> : <Plug className="h-4 w-4" />}
          {saved ? "Saved" : "Save connection"}
        </button>
        {conn.provider !== "mock" && (
          <button
            type="button"
            className="btn-ghost text-sm"
            disabled={testing}
            onClick={() => void handleTest()}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plug className="h-4 w-4" />
            )}
            Test connection
          </button>
        )}
        <button
          type="button"
          className="btn-ghost text-sm text-danger"
          onClick={() => {
            clearAIConnection();
            setConn(defaultAIConnection());
            setCustomModel("mock");
            setSaved(false);
            setTestResult(null);
          }}
        >
          <Trash2 className="h-4 w-4" />
          Disconnect
        </button>
        {conn.enabled && conn.provider !== "mock" && (
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => {
              const next = { ...conn, enabled: false };
              saveAIConnection(next);
              setConn(next);
            }}
          >
            <Unplug className="h-4 w-4" />
            Use mock only
          </button>
        )}
      </div>
    </section>
  );
}
