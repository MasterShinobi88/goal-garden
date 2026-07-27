import { cn } from "@/lib/utils";

export function LoadingSpinner({
  className,
  label = "Loading…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-muted",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative h-11 w-11">
        <div className="absolute inset-0 rounded-full border-2 border-accent/15" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
      </div>
      <p className="text-sm tracking-tight">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%] animate-pulse",
        className
      )}
    />
  );
}
