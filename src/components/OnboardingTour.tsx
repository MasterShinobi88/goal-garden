"use client";

import { useEffect, useState } from "react";
import {
  Droplets,
  MessageCircle,
  Share2,
  Sparkles,
  TreePine,
  X,
} from "lucide-react";

const SEEN_KEY = "goal-garden:onboarding-v1";

const STEPS = [
  {
    icon: TreePine,
    title: "Welcome to your garden",
    body: "Big goals become weekly milestones and daily micro-tasks. Your progress tree grows from sapling to fruit as you complete work.",
  },
  {
    icon: Droplets,
    title: "Daily HUD",
    body: "Tap water glasses, log fuel, and mark movement. Weight-loss goals auto-fill calorie and water targets from your healthy plan.",
  },
  {
    icon: MessageCircle,
    title: "Premium coach",
    body: "Ask the coach about hunger, missed days, or workouts — answers stay grounded in your real goals and today’s log.",
  },
  {
    icon: Share2,
    title: "Export & share",
    body: "Download a share card or print a PDF plan for any goal. Progress over perfection — no guilt, just growth.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(SEEN_KEY)) {
      setOpen(true);
    }
  }, []);

  function finish() {
    localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  const s = STEPS[step];
  const Icon = s.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="card relative w-full max-w-md overflow-hidden p-0">
        <div className="relative h-36 bg-gradient-to-br from-emerald-600/40 via-sky-900/40 to-slate-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <EmptyGardenArt compact />
          </div>
          <button
            type="button"
            className="absolute right-3 top-3 rounded-lg bg-black/30 p-1.5 text-muted hover:text-foreground"
            onClick={finish}
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-accent">
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">{s.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>

          <div className="mt-4 flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-accent" : "bg-white/10"
                }`}
              />
            ))}
          </div>

          <div className="mt-5 flex justify-between gap-2">
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={finish}
            >
              Skip
            </button>
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => {
                if (last) finish();
                else setStep((x) => x + 1);
              }}
            >
              {last ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enter the garden
                </>
              ) : (
                "Next"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyGardenArt({ compact = false }: { compact?: boolean }) {
  const size = compact ? 120 : 180;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      className="drop-shadow-lg"
      aria-hidden
    >
      <defs>
        <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14532d" />
          <stop offset="100%" stopColor="#052e16" />
        </linearGradient>
        <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <ellipse cx="90" cy="140" rx="55" ry="16" fill="url(#soil)" opacity="0.9" />
      <path
        d="M88 140 C86 110, 90 90, 92 70"
        stroke="#8b5e3c"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx="78"
        cy="72"
        rx="16"
        ry="10"
        fill="url(#leafG)"
        transform="rotate(-25 78 72)"
      />
      <ellipse
        cx="104"
        cy="78"
        rx="14"
        ry="9"
        fill="#34d399"
        transform="rotate(30 104 78)"
      />
      <circle cx="50" cy="50" r="3" fill="#fbbf24" opacity="0.7" />
      <circle cx="130" cy="40" r="2" fill="#38bdf8" opacity="0.6" />
      <circle cx="140" cy="70" r="2.5" fill="#a7f3d0" opacity="0.5" />
    </svg>
  );
}
