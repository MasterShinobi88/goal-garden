"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Pencil } from "lucide-react";
import type { DailyTask, Milestone } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { TaskList } from "./TaskList";

type MilestoneWithTasks = Milestone & { daily_tasks: DailyTask[] };

export function MilestoneList({
  milestones,
  onToggleTask,
  onRenameTask,
  onRenameMilestone,
}: {
  milestones: MilestoneWithTasks[];
  onToggleTask: (id: string, completed: boolean) => void;
  onRenameTask?: (id: string, title: string) => void;
  onRenameMilestone?: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-4">
      {milestones.map((m, idx) => {
        const done = m.daily_tasks.filter((t) => t.completed).length;
        const total = m.daily_tasks.length;
        const isEditing = editing === m.id;
        return (
          <section key={m.id} className="card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                {m.completed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                )}
                <div className="min-w-0">
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (draft.trim() && onRenameMilestone) {
                          onRenameMilestone(m.id, draft.trim());
                        }
                        setEditing(null);
                      }}
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
                    <h4 className="font-medium">
                      <span className="mr-2 text-xs text-muted">
                        M{idx + 1}
                      </span>
                      {m.title}
                    </h4>
                  )}
                  <p className="text-xs text-muted">
                    Target {formatDisplayDate(m.target_date)} · {done}/{total}{" "}
                    tasks
                  </p>
                </div>
              </div>
              {onRenameMilestone && !isEditing && (
                <button
                  type="button"
                  className="rounded-md p-1 text-muted hover:bg-white/5"
                  onClick={() => {
                    setEditing(m.id);
                    setDraft(m.title);
                  }}
                  aria-label="Edit milestone"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <TaskList
              tasks={m.daily_tasks}
              onToggle={onToggleTask}
              onRename={onRenameTask}
            />
          </section>
        );
      })}
    </div>
  );
}
