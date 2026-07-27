"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  Plus,
  Settings,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/finance", label: "Money", icon: Wallet },
  { href: "/dashboard/coach", label: "Coach", icon: MessageCircle },
  { href: "/dashboard/settings", label: "More", icon: Settings },
];

export function MobileNav({ onPlant }: { onPlant?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-[var(--sidebar)]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="relative mx-auto flex max-w-lg items-end justify-around px-1 pt-1.5">
        {items.slice(0, 2).map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[60px] flex-col items-center gap-0.5 pb-2 text-[10px] font-medium",
                active ? "text-accent" : "text-muted"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          );
        })}

        <div className="relative -top-3.5 flex min-w-[64px] flex-col items-center">
          <button
            type="button"
            onClick={onPlant}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-700 text-[#042f1a] shadow-[0_8px_28px_rgba(5,150,105,0.45)] ring-4 ring-[var(--sidebar)]"
            aria-label="Plant new goal"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
          <span className="mt-0.5 text-[10px] font-medium text-accent">
            Plant
          </span>
        </div>

        {items.slice(2).map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[60px] flex-col items-center gap-0.5 pb-2 text-[10px] font-medium",
                active ? "text-accent" : "text-muted"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
