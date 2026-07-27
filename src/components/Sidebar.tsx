"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Calculator,
  CalendarDays,
  ClipboardList,
  Flame,
  GripVertical,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  TreePine,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { demoSignOut, isDemoMode } from "@/lib/local-store";
import { hasPremium } from "@/lib/license";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  FIXED_BOTTOM,
  FIXED_TOP,
  loadNavOrder,
  NAV_CATALOG,
  reorderNav,
  saveNavOrder,
  type NavItemId,
} from "@/lib/nav-order";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  finance: Wallet,
  journal: BookOpen,
  food: Calculator,
  habits: Flame,
  calendar: CalendarDays,
  coach: MessageCircle,
  review: ClipboardList,
  settings: Settings,
};

const DEFAULT_MIDDLE: NavItemId[] = [
  "habits",
  "finance",
  "journal",
  "food",
  "calendar",
  "coach",
  "review",
];

export function Sidebar({ userLabel }: { userLabel?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [middle, setMiddle] = useState<NavItemId[]>(DEFAULT_MIDDLE);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [premium, setPremium] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const fromIndex = useRef<number | null>(null);
  const hoverRef = useRef<number | null>(null);

  const refreshOrder = useCallback(() => {
    setMiddle(loadNavOrder());
  }, []);

  useEffect(() => {
    setPremium(hasPremium());
  }, [pathname]);

  useEffect(() => {
    refreshOrder();
    window.addEventListener("goal-garden:nav-order", refreshOrder);
    return () =>
      window.removeEventListener("goal-garden:nav-order", refreshOrder);
  }, [refreshOrder]);

  // Global pointer listeners while dragging (refs avoid stale closures)
  useEffect(() => {
    if (activeIndex === null) return;

    function onMove(e: PointerEvent) {
      if (!dragging.current || !listRef.current) return;
      const rows =
        listRef.current.querySelectorAll<HTMLElement>("[data-nav-index]");
      let nextHover: number | null = null;
      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        const mid = (rect.top + rect.bottom) / 2;
        // Use midpoint so drop position feels natural
        if (e.clientY < mid && nextHover === null) {
          nextHover = Number(row.dataset.navIndex);
        } else if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
          nextHover = Number(row.dataset.navIndex);
        }
      });
      // Fallback: which row contains Y
      if (nextHover === null) {
        rows.forEach((row) => {
          const rect = row.getBoundingClientRect();
          if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
            nextHover = Number(row.dataset.navIndex);
          }
        });
      }
      if (nextHover !== null && hoverRef.current !== nextHover) {
        hoverRef.current = nextHover;
        setHoverIndex(nextHover);
      }
    }

    function onUp() {
      const from = fromIndex.current;
      const to = hoverRef.current;
      if (dragging.current && from !== null && to !== null && from !== to) {
        setMiddle((prev) => {
          const next = reorderNav(prev, from, to);
          saveNavOrder(next);
          return next;
        });
      }
      dragging.current = false;
      fromIndex.current = null;
      hoverRef.current = null;
      setActiveIndex(null);
      setHoverIndex(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [activeIndex]);

  async function handleSignOut() {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
    }
    if (isDemoMode()) demoSignOut();
    router.push("/login");
    router.refresh();
  }

  function startDrag(index: number) {
    dragging.current = true;
    fromIndex.current = index;
    hoverRef.current = index;
    setActiveIndex(index);
    setHoverIndex(index);
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  function FixedLink({
    href,
    label,
    icon: Icon,
    exact,
  }: {
    href: string;
    label: string;
    icon: LucideIcon;
    exact?: boolean;
  }) {
    const active = isActive(href, exact);
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
          active
            ? "bg-accent/12 text-accent shadow-[inset_0_0_0_1px_rgba(52,211,153,0.15)]"
            : "text-muted hover:bg-white/[0.04] hover:text-foreground"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-accent" : "text-muted"
          )}
        />
        {label}
        {active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
        )}
      </Link>
    );
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 text-accent ring-1 ring-accent/25">
          <TreePine className="h-5 w-5" />
        </div>
        <div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">Goal Garden</p>
            {premium && (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                Premium
              </p>
            )}
          </div>
          <p className="text-[11px] text-muted">Grow with intention</p>
        </div>
      </div>

      <nav className="mt-1 flex min-h-0 flex-1 flex-col px-3">
        <p className="section-label mb-2 px-3">Navigate</p>

        <FixedLink
          href={FIXED_TOP.href}
          label={FIXED_TOP.label}
          icon={ICONS.dashboard}
          exact
        />

        <p className="mb-1.5 mt-3 px-3 text-[10px] leading-snug text-muted/80">
          Hold the grip (⋮⋮) and drag to reorder
        </p>

        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-0.5 overflow-y-auto select-none"
        >
          {middle.map((id, index) => {
            const item = NAV_CATALOG[id];
            const Icon = ICONS[id] || LayoutDashboard;
            const active = isActive(item.href);
            const isDragging = activeIndex === index;
            const isDrop =
              hoverIndex === index &&
              activeIndex !== null &&
              activeIndex !== index;

            return (
              <div
                key={id}
                data-nav-index={index}
                className={cn(
                  "rounded-xl transition-all",
                  isDrop && "ring-1 ring-accent/40 bg-accent/10",
                  isDragging && "opacity-45 scale-[0.98]"
                )}
              >
                <div
                  className={cn(
                    "group flex items-center gap-0.5 rounded-xl px-1 py-0.5 text-sm",
                    active
                      ? "bg-accent/12 text-accent shadow-[inset_0_0_0_1px_rgba(52,211,153,0.15)]"
                      : "text-muted hover:bg-white/[0.04] hover:text-foreground"
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Drag to reorder ${item.label}`}
                    title="Hold and drag to reorder"
                    className="cursor-grab touch-none rounded-lg p-2 text-muted/70 hover:bg-white/5 hover:text-foreground active:cursor-grabbing"
                    onPointerDown={(e) => {
                      // Only primary button
                      if (e.button !== 0) return;
                      e.preventDefault();
                      e.stopPropagation();
                      (e.currentTarget as HTMLElement).setPointerCapture(
                        e.pointerId
                      );
                      startDrag(index);
                    }}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>

                  <Link
                    href={item.href}
                    onClick={(e) => {
                      // Block navigation if we were dragging
                      if (dragging.current || activeIndex !== null) {
                        e.preventDefault();
                        return;
                      }
                      setOpen(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pr-2"
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active
                          ? "text-accent"
                          : "text-muted group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 border-t border-border/60 pt-2">
          <FixedLink
            href={FIXED_BOTTOM.href}
            label={FIXED_BOTTOM.label}
            icon={ICONS.settings}
          />
        </div>
      </nav>

      <div className="border-t border-border/80 p-4">
        <div className="surface-inset mb-3 flex items-center gap-3 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/30 to-sky-500/20 text-xs font-semibold text-accent">
            {(userLabel || "G").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {userLabel || "Gardener"}
            </p>
            <p className="text-[10px] text-muted">
              {isDemoMode() ? "Demo workspace" : "Signed in"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="btn-ghost w-full text-sm"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-40 rounded-xl border border-border bg-card/90 p-2 shadow-lg backdrop-blur lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[17rem] border-r border-border/80 bg-[var(--sidebar)]/95 backdrop-blur-xl transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-lg p-1 text-muted lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {content}
      </aside>
    </>
  );
}
