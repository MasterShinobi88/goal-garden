"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadPrefs } from "@/lib/local-store";

type CelebrationPayload = {
  title?: string;
  subtitle?: string;
};

type CelebrationContextValue = {
  celebrate: (payload?: CelebrationPayload) => void;
};

const CelebrationContext = createContext<CelebrationContextValue>({
  celebrate: () => {},
});

export function useCelebration() {
  return useContext(CelebrationContext);
}

export function CelebrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [burst, setBurst] = useState<CelebrationPayload | null>(null);
  const [particles, setParticles] = useState<
    { id: number; left: number; delay: number; color: string; emoji: string }[]
  >([]);

  const celebrate = useCallback((payload?: CelebrationPayload) => {
    const prefs = loadPrefs();
    if (prefs.reduced_motion) {
      setBurst(payload ?? { title: "Nice work" });
      setTimeout(() => setBurst(null), 1600);
      return;
    }

    const colors = ["#34d399", "#6ee7b7", "#fbbf24", "#38bdf8", "#a7f3d0"];
    const emojis = ["🍃", "✨", "🌿", "💧", "⭐"];
    setParticles(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        color: colors[i % colors.length],
        emoji: emojis[i % emojis.length],
      }))
    );
    setBurst(payload ?? { title: "Leaf unlocked!", subtitle: "Your tree just grew." });

    if (prefs.sound_enabled && typeof window !== "undefined") {
      try {
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(523.25, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.4);
      } catch {
        /* ignore audio errors */
      }
    }

    window.setTimeout(() => {
      setBurst(null);
      setParticles([]);
    }, 2200);
  }, []);

  const value = useMemo(() => ({ celebrate }), [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {burst && (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
          {particles.map((p) => (
            <span
              key={p.id}
              className="celebrate-particle absolute text-lg"
              style={{
                left: `${p.left}%`,
                top: "40%",
                animationDelay: `${p.delay}s`,
                color: p.color,
              }}
            >
              {p.emoji}
            </span>
          ))}
          <div className="celebrate-toast relative z-10 mx-4 rounded-2xl border border-accent/30 bg-card/95 px-6 py-4 text-center shadow-2xl shadow-emerald-900/40">
            <p className="text-lg font-semibold text-accent">
              {burst.title ?? "Beautiful progress"}
            </p>
            {burst.subtitle && (
              <p className="mt-1 text-sm text-muted">{burst.subtitle}</p>
            )}
          </div>
        </div>
      )}
    </CelebrationContext.Provider>
  );
}

/** Listen for global task-complete events */
export function CelebrationBus() {
  const { celebrate } = useCelebration();
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CelebrationPayload>).detail;
      celebrate(detail);
    };
    window.addEventListener("goal-garden:celebrate", handler);
    return () => window.removeEventListener("goal-garden:celebrate", handler);
  }, [celebrate]);
  return null;
}

export function fireCelebration(payload?: CelebrationPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("goal-garden:celebrate", { detail: payload })
  );
}
