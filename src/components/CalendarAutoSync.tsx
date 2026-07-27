"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Link2,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { GoalWithTree } from "@/lib/types";
import {
  buildFeedUrls,
  ensureFeedToken,
  getLastFeedSync,
  isFeedSyncEnabled,
  publishCalendarFeed,
  setFeedSyncEnabled,
} from "@/lib/calendar-sync-client";
import { cn } from "@/lib/utils";

export function CalendarAutoSync({ goals }: { goals: GoalWithTree[] }) {
  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<"https" | "webcal" | null>(null);

  useEffect(() => {
    setEnabled(isFeedSyncEnabled());
    setToken(ensureFeedToken());
    setLastSync(getLastFeedSync());
  }, []);

  const urls = useMemo(() => {
    if (!token || typeof window === "undefined") {
      return { httpsUrl: "", webcalUrl: "" };
    }
    return buildFeedUrls(token);
  }, [token]);

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  async function publish(nextEnabled = enabled) {
    setBusy(true);
    setMsg(null);
    try {
      if (nextEnabled) setFeedSyncEnabled(true);
      const result = await publishCalendarFeed(goals, {
        includeCompleted: false,
        fromToday: true,
      });
      if (!result.ok) {
        setMsg(result.error || "Publish failed");
      } else {
        setLastSync(new Date().toISOString());
        setMsg(
          `Feed updated · ${result.eventCount} open tasks. Calendar apps will refresh on their own schedule (often every few hours).`
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggle(on: boolean) {
    setEnabled(on);
    setFeedSyncEnabled(on);
    if (on) {
      await publish(true);
    } else {
      setMsg("Auto-sync paused. Existing subscriptions keep the last published copy until you re-enable.");
    }
  }

  async function copy(kind: "https" | "webcal") {
    const text = kind === "https" ? urls.httpsUrl : urls.webcalUrl;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setMsg("Could not copy — select the URL and copy manually.");
    }
  }

  return (
    <div className="card space-y-4 p-4">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div>
          <h2 className="text-sm font-semibold">Auto-sync (all calendars)</h2>
          <p className="mt-1 text-xs text-muted">
            One private subscribe link works with{" "}
            <strong className="text-foreground">Google</strong>,{" "}
            <strong className="text-foreground">Outlook</strong>, and{" "}
            <strong className="text-foreground">Apple Calendar</strong>. They
            pull updates on a schedule — no spammy meeting invites.
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-emerald-500"
          checked={enabled}
          onChange={(e) => void toggle(e.target.checked)}
        />
        Enable auto-sync feed & keep it updated
      </label>

      <button
        type="button"
        className="btn-primary w-full text-sm"
        disabled={busy}
        onClick={() => void publish()}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Publish / refresh feed now
      </button>

      {lastSync && (
        <p className="text-[11px] text-muted">
          Last published: {new Date(lastSync).toLocaleString()}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Your private feed URL</p>
        <div className="flex gap-2">
          <input
            readOnly
            className="input-field font-mono text-[11px]"
            value={urls.httpsUrl}
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            className="btn-ghost shrink-0 px-2"
            onClick={() => void copy("https")}
            title="Copy HTTPS URL"
          >
            {copied === "https" ? (
              <Check className="h-4 w-4 text-accent" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            className="input-field font-mono text-[11px]"
            value={urls.webcalUrl}
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            className="btn-ghost shrink-0 px-2"
            onClick={() => void copy("webcal")}
            title="Copy webcal URL"
          >
            {copied === "webcal" ? (
              <Check className="h-4 w-4 text-accent" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {isLocalhost && (
        <p className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[11px] text-warn">
          You’re on <strong>localhost</strong>. Google/Apple cloud servers cannot
          reach your PC. Auto-subscribe works after you deploy Goal Garden to a
          public HTTPS URL (e.g. Vercel), or use a tunnel like ngrok. One-time
          .ics download still works offline.
        </p>
      )}

      <div className="space-y-3 rounded-xl border border-border bg-black/20 p-3 text-[11px] leading-relaxed text-muted">
        <p className="font-medium text-foreground">Subscribe once (then it auto-refreshes)</p>

        <div>
          <p className="text-accent">Google Calendar</p>
          <ol className="mt-0.5 list-decimal space-y-0.5 pl-4">
            <li>Settings (gear) → Add calendar → From URL</li>
            <li>Paste the <strong className="text-foreground">HTTPS</strong> feed URL</li>
            <li>Add calendar — Google refreshes periodically</li>
          </ol>
        </div>

        <div>
          <p className="text-accent">Outlook (web or desktop)</p>
          <ol className="mt-0.5 list-decimal space-y-0.5 pl-4">
            <li>Add calendar → Subscribe from web</li>
            <li>Paste the HTTPS feed URL</li>
            <li>Name it “Goal Garden” → Import</li>
          </ol>
        </div>

        <div>
          <p className="text-accent">Apple Calendar (Mac / iPhone)</p>
          <ol className="mt-0.5 list-decimal space-y-0.5 pl-4">
            <li>Mac: File → New Calendar Subscription…</li>
            <li>Paste the <strong className="text-foreground">webcal</strong> or HTTPS URL</li>
            <li>iPhone: Settings → Calendar → Accounts → Add → Other → Add Subscribed Calendar</li>
            <li>Set refresh to Every Hour / Every Day as you like</li>
          </ol>
        </div>

        <p className={cn("pt-1")}>
          This is <strong className="text-foreground">one-way auto-sync</strong>{" "}
          (Goal Garden → your calendars). Edits in Google/Outlook do not write
          back here. Two-way OAuth write-back needs Google/Microsoft developer
          apps and is optional later.
        </p>
      </div>

      {msg && (
        <p className="rounded-lg border border-border bg-white/5 px-3 py-2 text-xs text-muted">
          {msg}
        </p>
      )}
    </div>
  );
}
