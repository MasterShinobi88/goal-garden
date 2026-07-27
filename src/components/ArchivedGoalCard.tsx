"use client";

import Link from "next/link";
import { ArchiveRestore, Trash2, FolderArchive } from "lucide-react";
import type { GoalWithTree } from "@/lib/types";
import { calcGoalProgress, formatDisplayDate } from "@/lib/utils";

export function ArchivedGoalCard({
  goal,
  onRestore,
  onDelete,
}: {
  goal: GoalWithTree;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const progress = calcGoalProgress(goal);

  return (
    <article className="card flex items-center gap-3 border-dashed border-border/80 p-3 opacity-90">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-muted">
        <FolderArchive className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/dashboard/goals/${goal.id}`}
          className="truncate text-sm font-medium hover:text-accent"
        >
          {goal.title}
        </Link>
        <p className="text-[11px] text-muted">
          Archived · {progress}% · deadline {formatDisplayDate(goal.deadline)}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          className="btn-ghost px-2 py-1.5 text-xs"
          onClick={() => onRestore(goal.id)}
          title="Restore to active goals"
        >
          <ArchiveRestore className="h-3.5 w-3.5" />
          Restore
        </button>
        <button
          type="button"
          className="rounded-lg border border-danger/25 px-2 py-1.5 text-xs text-danger hover:bg-danger/10"
          onClick={() => {
            if (
              confirm(
                `Permanently delete “${goal.title}”? This cannot be undone.`
              )
            ) {
              onDelete(goal.id);
            }
          }}
          title="Delete forever"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
