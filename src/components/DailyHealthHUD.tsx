"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Droplets, Flame, Minus, Plus } from "lucide-react";
import {
  ensureDailyLog,
  getDailyLog,
  setWaterGlasses,
  toggleMovement,
  updateDailyLog,
  waterStreakDays,
  type DailyLog,
} from "@/lib/daily-log";
import { cn } from "@/lib/utils";

type Props = {
  waterTarget?: number;
  kcalTarget?: number | null;
  movementLabel?: string;
  show?: boolean;
};

export function DailyHealthHUD({
  waterTarget = 8,
  kcalTarget = null,
  movementLabel = "10-minute walk or home circuit",
  show = true,
}: Props) {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [waterStreak, setWaterStreak] = useState(0);
  const [kcalDraft, setKcalDraft] = useState("");

  function refresh() {
    const next = ensureDailyLog({
      water_target: waterTarget,
      kcal_target: kcalTarget,
      movement_label: movementLabel,
    });
    setLog(next);
    setWaterStreak(waterStreakDays());
    setKcalDraft(next.kcal_eaten != null ? String(next.kcal_eaten) : "");
  }

  useEffect(() => {
    refresh();
    const onLog = () => {
      setLog(getDailyLog());
      setWaterStreak(waterStreakDays());
    };
    window.addEventListener("goal-garden:daily-log", onLog);
    return () => window.removeEventListener("goal-garden:daily-log", onLog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waterTarget, kcalTarget, movementLabel]);

  if (!show || !log) return null;

  const glasses = Array.from(
    { length: Math.min(log.water_target, 12) },
    (_, i) => i < log.water_glasses
  );
  const waterPct = Math.round(
    (log.water_glasses / Math.max(1, log.water_target)) * 100
  );
  const kcalPct =
    log.kcal_target && log.kcal_eaten != null
      ? Math.min(100, Math.round((log.kcal_eaten / log.kcal_target) * 100))
      : 0;

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {/* Water */}
      <div className="card relative overflow-hidden p-4">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-500/10 blur-2xl" />
        <div className="relative">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300/90">
                <Droplets className="h-3.5 w-3.5" />
                Water
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                {log.water_glasses}
                <span className="text-base font-normal text-muted">
                  /{log.water_target}
                </span>
              </p>
            </div>
            {waterStreak > 0 && (
              <span className="rounded-full bg-sky-500/12 px-2 py-0.5 text-[10px] font-medium text-sky-300 ring-1 ring-sky-400/20">
                {waterStreak}d
              </span>
            )}
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-300 transition-all duration-300"
              style={{ width: `${waterPct}%` }}
            />
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            {glasses.map((filled, i) => (
              <button
                key={i}
                type="button"
                title={`Glass ${i + 1}`}
                onClick={() => {
                  const next = log.water_glasses === i + 1 ? i : i + 1;
                  setLog(setWaterGlasses(next));
                }}
                className={cn(
                  "h-7 w-5 rounded-b-md rounded-t-sm border transition",
                  filled
                    ? "border-sky-400/40 bg-gradient-to-t from-sky-500 to-sky-300/90 shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                    : "border-border/80 bg-white/[0.03] hover:border-sky-500/35"
                )}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => setLog(setWaterGlasses(log.water_glasses - 1))}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => setLog(setWaterGlasses(log.water_glasses + 1))}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fuel */}
      <div className="card relative overflow-hidden p-4">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
        <div className="relative">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-300/90">
            <Flame className="h-3.5 w-3.5" />
            Fuel
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {log.kcal_eaten ?? "—"}
            {log.kcal_target != null && (
              <span className="text-base font-normal text-muted">
                {" "}
                / {log.kcal_target}
              </span>
            )}
          </p>
          {log.kcal_target != null && (
            <div className="mt-3 mb-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  kcalPct > 100
                    ? "bg-warn"
                    : "bg-gradient-to-r from-orange-600 to-amber-300"
                )}
                style={{ width: `${Math.min(100, kcalPct)}%` }}
              />
            </div>
          )}
          <input
            type="number"
            min={0}
            className="input-field mt-2 py-2 text-sm"
            placeholder="kcal eaten today"
            value={kcalDraft}
            onChange={(e) => setKcalDraft(e.target.value)}
            onBlur={() => {
              const n = kcalDraft === "" ? null : Number(kcalDraft);
              setLog(
                updateDailyLog({
                  kcal_eaten: n != null && !Number.isNaN(n) ? n : null,
                })
              );
            }}
          />
          <Link
            href="/dashboard/food"
            className="mt-2 inline-block text-[11px] font-medium text-accent hover:underline"
          >
            Calculate from food →
          </Link>
        </div>
      </div>

      {/* Movement */}
      <div className="card relative overflow-hidden p-4">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="relative flex h-full flex-col">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
            <Activity className="h-3.5 w-3.5" />
            Movement
          </p>
          <button
            type="button"
            onClick={() => setLog(toggleMovement())}
            className={cn(
              "mt-auto w-full rounded-2xl border px-3 py-4 text-left text-sm transition",
              log.movement_done
                ? "border-accent/35 bg-accent/12 text-accent shadow-[0_0_24px_rgba(52,211,153,0.08)]"
                : "border-border bg-black/25 hover:border-accent/30"
            )}
          >
            <span className="font-semibold">
              {log.movement_done ? "Completed today" : "Mark movement"}
            </span>
            <span className="mt-1 block text-xs leading-snug text-muted">
              {log.movement_label}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
