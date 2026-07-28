"use client";

import { Suspense, useEffect, useState } from "react";
import {
  Bell,
  Check,
  Crown,
  FileUp,
  KeyRound,
  Moon,
  Plug,
  Save,
  Settings2,
  Sparkles,
  Sun,
} from "lucide-react";
import type { UserPreferences } from "@/lib/types";
import { loadPrefs, savePrefs, isDemoMode } from "@/lib/local-store";
import { applyTheme, normalizeTheme } from "@/lib/theme";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AIConnectionSettings } from "@/components/AIConnectionSettings";
import { NotificationSettings } from "@/components/NotificationSettings";
import { DataImportExport } from "@/components/DataImportExport";
import { PremiumLicenseCard } from "@/components/PremiumLicenseCard";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

type TabId = "preferences" | "ai" | "reminders" | "data" | "premium" | "advanced";

const TABS: {
  id: TabId;
  label: string;
  short: string;
  icon: typeof Settings2;
}[] = [
  { id: "preferences", label: "Preferences", short: "Prefs", icon: Settings2 },
  { id: "ai", label: "AI", short: "AI", icon: Plug },
  { id: "reminders", label: "Reminders", short: "Alerts", icon: Bell },
  { id: "data", label: "Import / export", short: "Data", icon: FileUp },
  { id: "premium", label: "Premium", short: "Pro", icon: Crown },
  { id: "advanced", label: "Advanced", short: "More", icon: KeyRound },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("preferences");
  const [prefs, setPrefs] = useState<UserPreferences>(loadPrefs());
  const [saved, setSaved] = useState(false);
  const [apiNote, setApiNote] = useState("");

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  // Deep-link: ?tab=premium or Stripe return ?checkout=success|cancel
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const tabParam = q.get("tab");
    if (
      tabParam === "premium" ||
      tabParam === "ai" ||
      tabParam === "preferences" ||
      tabParam === "reminders" ||
      tabParam === "data" ||
      tabParam === "advanced" ||
      q.get("checkout") ||
      q.get("session_id")
    ) {
      if (
        tabParam === "premium" ||
        tabParam === "ai" ||
        tabParam === "preferences" ||
        tabParam === "reminders" ||
        tabParam === "data" ||
        tabParam === "advanced"
      ) {
        setTab(tabParam);
      } else {
        setTab("premium");
      }
    }
  }, []);

  function update<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) {
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      if (key === "theme") {
        applyTheme(normalizeTheme(value));
      }
      return next;
    });
    setSaved(false);
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-4xl flex-col gap-3 overflow-hidden animate-fade-up">
      <PageHeader
        eyebrow="Settings"
        title="Workspace"
        description="Everything in one place — switch tabs instead of scrolling."
      />

      {/* Tab bar */}
      <div className="shrink-0 overflow-x-auto">
        <div className="inline-flex min-w-full gap-1 rounded-xl border border-border bg-black/25 p-1 sm:min-w-0 sm:w-full">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2.5 text-xs font-medium transition whitespace-nowrap",
                  active
                    ? "bg-accent/15 text-accent shadow-sm"
                    : "text-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active panel — only this area scrolls if needed */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-4 lg:pb-2">
        {tab === "premium" && (
          <div className="space-y-4">
            <Suspense
              fallback={
                <div className="card p-5 text-sm text-muted">Loading Premium…</div>
              }
            >
              <PremiumLicenseCard />
            </Suspense>
          </div>
        )}

        {tab === "preferences" && (
          <section className="card space-y-4 p-5">
            <div>
              <h2 className="text-sm font-semibold">Preferences</h2>
              <p className="text-xs text-muted">
                Day shape, encouragement, and motion.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-muted">
                  Calendar provider
                </label>
                <select
                  className="input-field"
                  value={prefs.calendar_provider || "mock"}
                  onChange={(e) =>
                    update(
                      "calendar_provider",
                      e.target.value as UserPreferences["calendar_provider"]
                    )
                  }
                >
                  <option value="mock">Mock (demo busy times)</option>
                  <option value="google">
                    Google Calendar (simulated until OAuth)
                  </option>
                  <option value="outlook">
                    Outlook (simulated until OAuth)
                  </option>
                  <option value="none">None</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted">
                  Work day start
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  className="input-field"
                  value={prefs.work_start_hour ?? 9}
                  onChange={(e) =>
                    update("work_start_hour", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Work day end
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  className="input-field"
                  value={prefs.work_end_hour ?? 17}
                  onChange={(e) =>
                    update("work_end_hour", Number(e.target.value))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-muted">
                  Encouragement style
                </label>
                <select
                  className="input-field"
                  value={prefs.encouragement_style || "gentle"}
                  onChange={(e) =>
                    update(
                      "encouragement_style",
                      e.target.value as UserPreferences["encouragement_style"]
                    )
                  }
                >
                  <option value="gentle">Gentle</option>
                  <option value="energetic">Energetic</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs text-muted">
                  Appearance
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => update("theme", "light")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                      (prefs.theme || "dark") === "light"
                        ? "border-accent/50 bg-accent/15 text-accent"
                        : "border-border bg-black/20 text-muted hover:border-accent/30 hover:text-foreground"
                    )}
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => update("theme", "dark")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                      (prefs.theme || "dark") === "dark"
                        ? "border-accent/50 bg-accent/15 text-accent"
                        : "border-border bg-black/20 text-muted hover:border-accent/30 hover:text-foreground"
                    )}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-muted">
                  Light matches BambooTide sand &amp; tide green. Preview applies
                  immediately — click Save to keep it.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.sunday_review_enabled !== false}
                  onChange={(e) =>
                    update("sunday_review_enabled", e.target.checked)
                  }
                  className="h-4 w-4 accent-emerald-500"
                />
                Sunday review prompts
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(prefs.sound_enabled)}
                  onChange={(e) => update("sound_enabled", e.target.checked)}
                  className="h-4 w-4 accent-emerald-500"
                />
                Soft chime on complete
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2.5 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(prefs.reduced_motion)}
                  onChange={(e) => update("reduced_motion", e.target.checked)}
                  className="h-4 w-4 accent-emerald-500"
                />
                Reduce motion (simpler celebrations)
              </label>
            </div>

            <p className="rounded-xl border border-border bg-black/20 px-3 py-2 text-xs text-muted">
              Streaks include one weekly{" "}
              <span className="text-foreground">grace day</span>.
              {prefs.grace_day_used
                ? ` Grace used for week of ${prefs.grace_day_used}.`
                : " Grace available this week."}
            </p>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={() => {
                  applyTheme(normalizeTheme(prefs.theme));
                  savePrefs(prefs);
                  setSaved(true);
                }}
              >
                {saved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saved ? "Saved" : "Save preferences"}
              </button>
              <p className="text-[11px] text-muted">
                Theme: {(prefs.theme || "dark") === "light" ? "Light" : "Dark"}{" "}
                · Dark is the default for new gardens.
              </p>
            </div>
          </section>
        )}

        {tab === "ai" && <AIConnectionSettings />}

        {tab === "reminders" && <NotificationSettings />}

        {tab === "data" && <DataImportExport />}

        {tab === "advanced" && (
          <div className="space-y-4">
            <section className="card space-y-3 p-5">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-accent" />
                <div>
                  <h2 className="text-sm font-semibold">
                    Server environment
                  </h2>
                  <p className="text-xs text-muted">
                    Optional fallback when no browser AI key is set.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-muted">
                <li>
                  <strong className="text-foreground">Supabase:</strong>{" "}
                  <code className="text-accent">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
                  <code className="text-accent">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>
                  <span className="ml-2">
                    (
                    {isSupabaseConfigured() && !isDemoMode()
                      ? "configured"
                      : "demo mode"}
                    )
                  </span>
                </li>
                <li>
                  <strong className="text-foreground">AI:</strong>{" "}
                  <code className="text-accent">OPENAI_API_KEY</code>,{" "}
                  <code className="text-accent">ANTHROPIC_API_KEY</code>,{" "}
                  <code className="text-accent">GOOGLE_API_KEY</code>,{" "}
                  <code className="text-accent">XAI_API_KEY</code>
                </li>
                <li>
                  <strong className="text-foreground">Custom:</strong>{" "}
                  <code className="text-accent">CUSTOM_AI_BASE_URL</code>
                </li>
              </ul>
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Personal notes (local only)
                </label>
                <textarea
                  className="input-field min-h-[72px]"
                  placeholder="Project refs, rate limits…"
                  value={apiNote}
                  onChange={(e) => setApiNote(e.target.value)}
                />
              </div>
            </section>

            <section className="card space-y-3 p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <h2 className="text-sm font-semibold">Experience</h2>
              </div>
              <ul className="grid gap-1.5 text-xs text-muted sm:grid-cols-2">
                <li>· Daily HUD & journal</li>
                <li>· Leaf celebrations</li>
                <li>· Coach + calorie calc</li>
                <li>· Calendar import / auto-sync</li>
              </ul>
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => {
                  localStorage.removeItem("goal-garden:onboarding-v1");
                  window.location.href = "/dashboard";
                }}
              >
                Replay onboarding tour
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
