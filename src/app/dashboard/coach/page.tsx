"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useAuthUser, useGoals } from "@/hooks/useGoals";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { buildCoachContext, type CoachMessage } from "@/lib/coach";
import { getDailyLog } from "@/lib/daily-log";
import {
  connectionStatusLabel,
  loadAIConnection,
} from "@/lib/ai-config-client";
import { uid } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";

const CHAT_KEY = "goal-garden:coach-chat";

const SUGGESTIONS = [
  "Does distilled water give the same hydration benefits?",
  "I'm hungry late at night — what should I do?",
  "What should I do next?",
  "How am I progressing?",
  "I missed two days. How do I restart gently?",
  "Give me a 12-minute home workout",
  "Meal ideas that hit my protein",
];

export default function CoachPage() {
  const { user } = useAuthUser();
  const { goals, loading, streak } = useGoals(user?.id);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiStatus, setAiStatus] = useState("Using built-in mock AI");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => setAiStatus(connectionStatusLabel(loadAIConnection()));
    refresh();
    window.addEventListener("goal-garden:ai-config", refresh);
    return () => window.removeEventListener("goal-garden:ai-config", refresh);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      if (raw) setMessages(JSON.parse(raw) as CoachMessage[]);
      else {
        setMessages([
          {
            id: uid(),
            role: "assistant",
            content:
              "Hi — I'm your Goal Garden coach. I can see your goals, health plan, and today's HUD. Ask about hunger, workouts, water, or getting back on track.\n\nConnect OpenAI, Claude, Gemini, or xAI under Settings → Connect your AI for live answers.",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (messages.length) {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40)));
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    const userMsg: CoachMessage = {
      id: uid(),
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    try {
      const context = buildCoachContext(goals, getDailyLog(), streak);
      const { getAIRequestPayload } = await import("@/lib/ai-config-client");
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context,
          ai: getAIRequestPayload(),
          history: [...messages, userMsg]
            .filter((x) => x.role !== "system")
            .slice(-10)
            .map((x) => ({ role: x.role, content: x.content })),
        }),
      });
      const data = await res.json();
      const providerNote =
        data.provider && data.provider !== "mock"
          ? `\n\n_via ${data.provider}${data.model ? ` · ${data.model}` : ""}_`
          : data.provider === "mock" || data.provider === "mock-fallback"
            ? "\n\n_via built-in mock — connect your AI in Settings for live answers_"
            : "";
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content:
            (data.reply || "I'm here — try again in a moment.") + providerNote,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content:
            "Something went quiet in the garden. Check your connection and try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading coach…" />;

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] max-w-3xl flex-col animate-fade-up lg:h-[calc(100dvh-4rem)]">
      <PageHeader
        className="mb-4"
        eyebrow="Coach"
        title="Your garden guide"
        description="Grounded in your goals and daily HUD — practical, kind, not medical advice."
        actions={
          <Link
            href="/dashboard/settings"
            className="badge-soft hover:brightness-110"
          >
            <Sparkles className="h-3 w-3" />
            {aiStatus}
          </Link>
        }
      />

      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "ml-auto bg-accent/20 text-foreground"
                  : "mr-auto border border-border bg-black/25 text-muted"
              )}
            >
              {m.role === "assistant" && (
                <span className="mb-1 block text-[10px] uppercase tracking-wide text-accent">
                  Coach
                </span>
              )}
              <span className="text-foreground">{m.content}</span>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Growing a reply…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-full border border-border bg-white/5 px-2.5 py-1 text-[11px] text-muted hover:border-accent/40 hover:text-accent"
                onClick={() => void send(s)}
                disabled={sending}
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              className="input-field flex-1"
              placeholder="Ask your coach…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              className="btn-primary px-3"
              disabled={sending || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
