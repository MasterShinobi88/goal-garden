"use client";

import Link from "next/link";
import {
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  MessageCircle,
  Plus,
  Scale,
  Sparkles,
  Sprout,
  Target,
  Wallet,
} from "lucide-react";
import { ProgressTree } from "@/components/ProgressTree";
import { getPlant } from "@/lib/plants";
import { cn } from "@/lib/utils";

export type SaplingOption = {
  id: string;
  title: string;
  progress: number;
  plant?: import("@/lib/plants").PlantType | null;
};

export function DashboardHero({
  firstName,
  quote,
  progress,
  streak,
  activeGoals,
  completedTasks,
  treeLabel,
  demosOpen,
  onToggleDemos,
  onDemo,
  onNewGoal,
  compact,
  saplings = [],
  selectedSaplingId,
  onSelectSapling,
  gardenProgress,
}: {
  firstName?: string;
  quote: string;
  progress: number;
  streak: number;
  activeGoals: number;
  completedTasks: number;
  treeLabel: string;
  demosOpen: boolean;
  onToggleDemos: () => void;
  onDemo: (kind: "project" | "weight_loss") => void;
  onNewGoal: () => void;
  /** Tighter layout for no page-scroll dashboards */
  compact?: boolean;
  /** Active goals shown as switchable saplings on the tree */
  saplings?: SaplingOption[];
  selectedSaplingId?: string | null;
  onSelectSapling?: (id: string) => void;
  /** Overall garden % (all goals) — shown when switching saplings */
  gardenProgress?: number;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const saplingIndex = Math.max(
    0,
    saplings.findIndex((s) => s.id === selectedSaplingId)
  );
  const hasMany = saplings.length > 1;

  function goPrev() {
    if (!onSelectSapling || !saplings.length) return;
    const i = saplingIndex <= 0 ? saplings.length - 1 : saplingIndex - 1;
    onSelectSapling(saplings[i].id);
  }

  function goNext() {
    if (!onSelectSapling || !saplings.length) return;
    const i = saplingIndex >= saplings.length - 1 ? 0 : saplingIndex + 1;
    onSelectSapling(saplings[i].id);
  }

  const metrics = [
    {
      label: hasMany ? "This tree" : "Grown",
      value: `${progress}%`,
      icon: Sparkles,
    },
    { label: "Streak", value: `${streak}d`, icon: Flame },
    { label: "Goals", value: String(activeGoals), icon: Target },
    { label: "Done", value: String(completedTasks), icon: Sprout },
  ];

  return (
    <section
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[1.25rem] border border-border",
        compact ? "" : ""
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1524] via-[#0a121c] to-[#071410]" />
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-[80px]" />
        <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-sky-500/10 blur-[70px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </div>

      <div
        className={cn(
          "relative grid lg:grid-cols-[1fr_auto] lg:items-center",
          compact ? "gap-3 p-3 sm:p-4" : "gap-6 p-5 sm:p-6 lg:p-7"
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col",
            compact ? "gap-2 sm:gap-2.5" : "gap-3 sm:gap-4"
          )}
        >
          <div>
            {!compact && (
              <p className="badge-soft mb-2">
                <Sparkles className="h-3 w-3" />
                Your garden
              </p>
            )}
            <h1
              className={cn(
                "font-semibold tracking-tight",
                compact
                  ? "text-lg sm:text-xl"
                  : "text-2xl sm:text-3xl lg:text-[2rem]"
              )}
            >
              {greeting}
              {firstName ? (
                <>
                  ,{" "}
                  <span className="bg-gradient-to-r from-emerald-200 to-accent bg-clip-text text-transparent">
                    {firstName}
                  </span>
                </>
              ) : null}
            </h1>
            <p
              className={cn(
                "mt-1 max-w-md leading-relaxed text-muted line-clamp-1",
                compact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm line-clamp-2"
              )}
            >
              {quote}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2 sm:px-3 sm:py-2.5"
                >
                  <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-muted sm:text-[10px]">
                    <Icon className="h-2.5 w-2.5 text-accent/80 sm:h-3 sm:w-3" />
                    <span className="truncate">{m.label}</span>
                  </div>
                  <p className="text-sm font-semibold tabular-nums tracking-tight sm:text-lg">
                    {m.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Sapling switcher — always visible when 2+ goals */}
          {hasMany && onSelectSapling && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Your saplings
                  {typeof gardenProgress === "number" && (
                    <span className="ml-1.5 font-normal normal-case tracking-normal text-muted/80">
                      · garden {gardenProgress}% overall
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-black/30 p-1 text-muted hover:border-accent/40 hover:text-accent"
                    onClick={goPrev}
                    aria-label="Previous sapling"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[3rem] text-center text-[11px] tabular-nums text-muted">
                    {saplingIndex + 1} / {saplings.length}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-black/30 p-1 text-muted hover:border-accent/40 hover:text-accent"
                    onClick={goNext}
                    aria-label="Next sapling"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {saplings.map((s) => {
                  const on = s.id === selectedSaplingId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelectSapling(s.id)}
                      className={cn(
                        "flex max-w-[11rem] shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-left transition",
                        on
                          ? "border-accent/40 bg-accent/15 text-accent"
                          : "border-border bg-black/25 text-muted hover:border-accent/25 hover:text-foreground"
                      )}
                      title={s.title}
                    >
                      <span className="text-sm leading-none">
                        {getPlant(s.plant).emoji}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium">
                          {s.title}
                        </span>
                        <span className="block text-[10px] opacity-80">
                          {s.progress}% · {getPlant(s.plant).label}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="btn-primary text-xs sm:text-sm"
              onClick={onNewGoal}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Plant
            </button>
            <Link href="/dashboard/finance" className="btn-ghost text-xs sm:text-sm">
              <Wallet className="h-3.5 w-3.5" />
              Finance
            </Link>
            <Link href="/dashboard/food" className="btn-ghost text-xs sm:text-sm">
              <Calculator className="h-3.5 w-3.5" />
              Food
            </Link>
            <Link
              href="/dashboard/journal"
              className="btn-ghost text-xs sm:text-sm hidden sm:inline-flex"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Journal
            </Link>
            <Link
              href="/dashboard/coach"
              className="btn-ghost text-xs sm:text-sm hidden md:inline-flex"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Coach
            </Link>
            <div className="relative">
              <button
                type="button"
                className="btn-ghost text-xs sm:text-sm"
                onClick={onToggleDemos}
              >
                Samples
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition",
                    demosOpen && "rotate-180"
                  )}
                />
              </button>
              {demosOpen && (
                <div className="absolute left-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-[#0e1624] py-1 shadow-2xl">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
                    onClick={() => onDemo("project")}
                  >
                    <Sprout className="h-4 w-4 text-accent" />
                    Side project
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
                    onClick={() => onDemo("weight_loss")}
                  >
                    <Scale className="h-4 w-4 text-sky-300" />
                    Weight loss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "relative mx-auto w-full lg:mx-0",
            compact
              ? "hidden max-w-[160px] sm:block lg:max-w-[180px]"
              : "max-w-[200px] sm:max-w-[220px] xl:max-w-[240px]"
          )}
        >
          <div className="relative rounded-2xl border border-white/[0.07] bg-black/25 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
            <ProgressTree
              progress={progress}
              label={treeLabel}
              size={compact ? 150 : 220}
              plant={
                saplings.find((s) => s.id === selectedSaplingId)?.plant ?? null
              }
            />
            {hasMany && onSelectSapling && (
              <div className="mt-1 flex items-center justify-between gap-1 border-t border-white/[0.06] px-1 pt-2">
                <button
                  type="button"
                  className="rounded-lg p-1 text-muted hover:bg-white/5 hover:text-accent"
                  onClick={goPrev}
                  aria-label="Previous sapling"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col items-center">
                  <p className="max-w-full truncate text-center text-[11px] font-medium text-foreground">
                    {treeLabel}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {saplings.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-label={`Show ${s.title}`}
                        onClick={() => onSelectSapling(s.id)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          s.id === selectedSaplingId
                            ? "w-4 bg-accent"
                            : "w-1.5 bg-white/20 hover:bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1 text-muted hover:bg-white/5 hover:text-accent"
                  onClick={goNext}
                  aria-label="Next sapling"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
