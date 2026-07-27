import Link from "next/link";
import {
  Calendar,
  Calculator,
  Sparkles,
  TreePine,
  Droplets,
  Shield,
} from "lucide-react";
import { GuestStartButton } from "@/components/GuestStartButton";
import { BambooTideBrand } from "@/components/BambooTideBrand";
import { isDemoMode } from "@/lib/local-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  CLEANUP_MISSION,
  COMPANY_NAME,
  PREMIUM_PRICE_FULL,
} from "@/lib/pricing";

const features = [
  {
    icon: Sparkles,
    title: "Intelligent plans",
    body: "Big goals become weekly milestones and daily micro-tasks — with healthy weight-loss coaching when you need it.",
  },
  {
    icon: TreePine,
    title: "Living progress tree",
    body: "Watch a sapling grow into a fruiting canopy as you complete work. Progress you can feel.",
  },
  {
    icon: Calculator,
    title: "Calorie calculator",
    body: "Log food by amount. Auto-calc calories and macros, synced to your daily HUD.",
  },
  {
    icon: Calendar,
    title: "Calendar that stays calm",
    body: "Subscribe Google, Outlook, or Apple to a private feed — free-time tasks, no spam meetings.",
  },
  {
    icon: Droplets,
    title: "Daily garden HUD",
    body: "Water glasses, fuel, and movement in one quiet strip. Gentle reminders only when you ask.",
  },
  {
    icon: Shield,
    title: "Your AI, your keys",
    body: "Connect OpenAI, Claude, Gemini, or xAI — or stay offline with a smart built-in coach.",
  },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute -right-20 top-20 h-[24rem] w-[24rem] rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-900/20 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25">
            <TreePine className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">Goal Garden</p>
            <p className="truncate text-[11px] text-muted">by {COMPANY_NAME}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <BambooTideBrand variant="mark" className="hidden sm:inline-flex" dark />
          <Link href="/login" className="btn-ghost text-sm">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            Get started
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-20 pt-10">
        <div className="animate-fade-up max-w-3xl">
          <p className="badge-soft mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            A {COMPANY_NAME} product · calm by design
          </p>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Grow ambitious goals into{" "}
            <span className="bg-gradient-to-r from-emerald-200 via-accent to-teal-400 bg-clip-text text-transparent">
              daily progress
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Plant a goal. Get a healthy plan. Track water, calories, and tasks —
            with a progress tree that grows as you do. No guilt. No noise.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            {/* Guest only when no cloud auth (local demo). Production uses real signup. */}
            {isDemoMode() && !isSupabaseConfigured() ? (
              <GuestStartButton label="Try locally" />
            ) : (
              <Link href="/signup" className="btn-primary px-5">
                Create free account
              </Link>
            )}
            <Link href="/login" className="btn-ghost px-5">
              Sign in
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted/80">
            Free · up to 3 active goals · Premium {PREMIUM_PRICE_FULL} ·{" "}
            {CLEANUP_MISSION}{" "}
            <a
              href="https://bambootide.org/apps/goal-garden"
              className="text-accent hover:underline"
            >
              Learn more
            </a>
          </p>
        </div>

        <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card card-interactive animate-fade-up p-5"
              style={{ animationDelay: `${80 + i * 40}ms` }}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <BambooTideBrand variant="full" className="w-full max-w-md" dark />
          <p className="text-center text-[11px] text-muted sm:text-right">
            Goal Garden · Progress over perfection
            <br />
            Educational guidance only · © {COMPANY_NAME}
          </p>
        </div>
      </footer>
    </main>
  );
}
