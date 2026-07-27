"use client";

import {
  CLEANUP_MISSION,
  COMPANY_NAME,
  COMPANY_TAGLINE,
  COMPANY_URL,
  companyLogoDarkUrl,
  companyLogoUrl,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

type Props = {
  /** compact = sidebar / header chip; full = footer block */
  variant?: "compact" | "full" | "mark";
  className?: string;
  /** Prefer dark-background logo asset */
  dark?: boolean;
};

/**
 * Official BambooTide mark + name. Always links to the main site.
 */
export function BambooTideBrand({
  variant = "compact",
  className,
  dark = true,
}: Props) {
  const src = dark ? companyLogoDarkUrl() : companyLogoUrl();

  if (variant === "mark") {
    return (
      <a
        href={COMPANY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 rounded-lg opacity-90 transition hover:opacity-100",
          className
        )}
        title={`${COMPANY_NAME} — home`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={COMPANY_NAME}
          className="h-7 w-auto"
          width={120}
          height={28}
        />
      </a>
    );
  }

  if (variant === "full") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-black/20 px-4 py-3",
          className
        )}
      >
        <a
          href={COMPANY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={COMPANY_NAME}
            className="h-8 w-auto"
            width={140}
            height={32}
          />
          <span className="text-xs font-semibold tracking-wide text-foreground">
            {COMPANY_NAME}
          </span>
        </a>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          {COMPANY_TAGLINE}
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-accent/90">
          {CLEANUP_MISSION}
        </p>
        <a
          href={`${COMPANY_URL}/ocean-impact`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[11px] font-medium text-accent hover:underline"
        >
          Our ocean impact →
        </a>
      </div>
    );
  }

  // compact
  return (
    <a
      href={COMPANY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-2 rounded-xl px-1 py-1 transition hover:bg-white/5",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-6 w-auto opacity-90 group-hover:opacity-100"
        width={100}
        height={24}
      />
      <div className="min-w-0 leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          By
        </p>
        <p className="truncate text-xs font-semibold text-foreground">
          {COMPANY_NAME}
        </p>
      </div>
    </a>
  );
}
