"use client";

import Link from "next/link";
import { Leaf, ShoppingBasket, Utensils } from "lucide-react";
import {
  buildLongevityMealGuide,
  type LongevityMealGuide,
} from "@/lib/longevity-meals";
import type { MacroTargets } from "@/lib/health";
import { formatMacrosLine } from "@/lib/health";

export function LongevityMealCard({
  macros,
}: {
  macros?: MacroTargets | null;
}) {
  const guide: LongevityMealGuide = buildLongevityMealGuide(macros);

  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-border bg-gradient-to-r from-emerald-500/15 to-teal-500/10 px-4 py-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Leaf className="h-4 w-4 text-accent" />
          {guide.label}
        </h3>
        <p className="mt-0.5 text-xs text-muted">{guide.summary}</p>
      </div>

      <div className="space-y-3 p-4">
        {macros && (
          <p className="rounded-lg bg-black/25 px-3 py-2 text-xs text-accent">
            Aligns with ~{formatMacrosLine(macros)} when you have a calorie plan
          </p>
        )}

        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">
            Principles
          </p>
          <ul className="space-y-1 text-xs text-muted">
            {guide.principles.slice(0, 6).map((p) => (
              <li key={p} className="leading-relaxed">
                • {p}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground">
            <Utensils className="h-3.5 w-3.5 text-accent" />
            Sample day
          </p>
          <ul className="space-y-2 text-xs text-muted">
            {guide.sample_day.meals.map((m) => (
              <li key={m.label} className="rounded-lg border border-border bg-black/20 px-2.5 py-2">
                <span className="font-medium text-foreground">
                  {m.label}
                  {m.time ? ` · ${m.time}` : ""}
                </span>
                <p className="mt-0.5 leading-relaxed">{m.ideas}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">
            Week rhythm
          </p>
          <ul className="space-y-0.5 text-[11px] text-muted">
            {guide.weekly_focus.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground">
            <ShoppingBasket className="h-3.5 w-3.5 text-accent" />
            Staples
          </p>
          <p className="text-[11px] leading-relaxed text-muted">
            {guide.grocery_staples.join(" · ")}
          </p>
        </div>

        <Link
          href="/dashboard/food"
          className="inline-flex text-xs font-medium text-accent hover:underline"
        >
          Open Food → generate a longevity week + shopping list
        </Link>

        <p className="text-[10px] leading-relaxed text-muted/80">
          {guide.disclaimer}
        </p>
      </div>
    </div>
  );
}
