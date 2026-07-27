"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import type { DailyTask } from "@/lib/types";
import { cn, formatDisplayDate } from "@/lib/utils";

export function TaskList({
  tasks,
  onToggle,
  onRename,
}: {
  tasks: DailyTask[];
  onToggle: (id: string, completed: boolean) => void;
  onRename?: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (tasks.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">No tasks yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const isEditing = editing === task.id;
        return (
          <li
            key={task.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border bg-black/20 px-3 py-2.5 transition",
              task.completed && "opacity-70"
            )}
          >
            <button
              type="button"
              onClick={() => onToggle(task.id, !task.completed)}
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                task.completed
                  ? "border-accent bg-accent text-[#052e1c]"
                  : "border-border hover:border-accent"
              )}
              aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
            >
              {task.completed && <Check className="h-3.5 w-3.5" />}
            </button>

            <div className="min-w-0 flex-1">
              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (draft.trim() && onRename) onRename(task.id, draft.trim());
                    setEditing(null);
                  }}
                  className="flex gap-2"
                >
                  <input
                    className="input-field py-1 text-sm"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    autoFocus
                    onBlur={() => setEditing(null)}
                  />
                </form>
              ) : (
                <p
                  className={cn(
                    "text-sm",
                    task.completed && "line-through text-muted"
                  )}
                >
                  {task.title}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-muted">
                {formatDisplayDate(task.scheduled_date)}
                {task.notes ? ` · ${task.notes}` : ""}
              </p>
            </div>

            {onRename && !isEditing && (
              <button
                type="button"
                className="rounded-md p-1 text-muted hover:bg-white/5 hover:text-foreground"
                onClick={() => {
                  setEditing(task.id);
                  setDraft(task.title);
                }}
                aria-label="Edit task title"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
