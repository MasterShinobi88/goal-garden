"use client";

import { useRef, useState } from "react";
import {
  Check,
  Download,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import {
  downloadExport,
  importAuto,
  type ImportMode,
  type ImportResult,
} from "@/lib/import-export";
import { cn } from "@/lib/utils";

export function DataImportExport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [exported, setExported] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setResult(null);
    try {
      const text = await file.text();
      const res = importAuto(text, mode);
      setResult(res);
      if (res.ok) {
        // Soft refresh so dashboard picks up goals
        window.dispatchEvent(new CustomEvent("goal-garden:update"));
      }
    } catch (e) {
      setResult({
        ok: false,
        goalsImported: 0,
        goalsSkipped: 0,
        message: e instanceof Error ? e.message : "Import failed",
        errors: ["Read error"],
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handlePasteImport() {
    if (!paste.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = importAuto(paste, mode);
      setResult(res);
      if (res.ok) {
        setPaste("");
        window.dispatchEvent(new CustomEvent("goal-garden:update"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-start gap-2">
        <FileUp className="mt-0.5 h-5 w-5 text-accent" />
        <div>
          <h2 className="font-semibold">Import & export</h2>
          <p className="text-xs text-muted">
            Backup your garden or import goals from a JSON backup or CSV file.
          </p>
        </div>
      </div>

      {/* Export */}
      <div className="surface-inset space-y-2 p-3">
        <p className="text-xs font-medium text-foreground">Export backup</p>
        <p className="text-[11px] text-muted">
          Downloads a full JSON backup (goals, preferences, food log).
        </p>
        <button
          type="button"
          className="btn-ghost text-sm"
          onClick={() => {
            downloadExport();
            setExported(true);
            window.setTimeout(() => setExported(false), 2000);
          }}
        >
          {exported ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exported ? "Downloaded" : "Download backup JSON"}
        </button>
      </div>

      {/* Import mode */}
      <div>
        <p className="mb-2 text-xs font-medium text-foreground">Import mode</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              {
                id: "merge" as const,
                label: "Merge",
                desc: "Add / update — keep existing goals",
              },
              {
                id: "replace" as const,
                label: "Replace",
                desc: "Overwrite all goals (full restore)",
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition",
                mode === opt.id
                  ? "border-accent/40 bg-accent/10"
                  : "border-border bg-black/20 hover:border-accent/25"
              )}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="mt-0.5 text-[11px] text-muted">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* File import */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Import from file</p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,.ics,text/calendar,application/json,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <button
          type="button"
          className="btn-primary w-full text-sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Choose JSON, CSV, or calendar (.ics)
        </button>
      </div>

      {/* Paste */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Or paste data</p>
        <textarea
          className="input-field min-h-[100px] font-mono text-xs"
          placeholder="JSON backup, CSV, or paste .ics calendar text (BEGIN:VCALENDAR…)"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
        <button
          type="button"
          className="btn-ghost w-full text-sm"
          disabled={busy || !paste.trim()}
          onClick={handlePasteImport}
        >
          Import pasted data
        </button>
      </div>

      {/* Formats help */}
      <div className="rounded-xl border border-border bg-black/20 p-3 text-[11px] leading-relaxed text-muted">
        <p className="mb-1 font-medium text-foreground">Supported formats</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>
            <strong className="text-foreground">Calendar .ics</strong> — export
            from Google, Outlook, or Apple → events become tasks under “Imported
            calendar”
          </li>
          <li>
            <strong className="text-foreground">JSON backup</strong> from Export
            above (full restore with Replace)
          </li>
          <li>
            <strong className="text-foreground">Goals JSON</strong> — array of
            goals with optional milestones and tasks
          </li>
          <li>
            <strong className="text-foreground">CSV</strong> —{" "}
            <code className="text-accent">
              title,deadline,description,success_metrics
            </code>
          </li>
        </ul>
        <p className="mt-2">
          Calendar import is a <strong className="text-foreground">snapshot</strong>
          , not live sync. For ongoing auto-sync the other way (Goal Garden →
          calendars), use Calendar → Auto-sync feed.
        </p>
      </div>

      {result && (
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5 text-sm",
            result.ok
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-danger/30 bg-danger/10 text-danger"
          )}
        >
          <p className="font-medium">{result.message}</p>
          {result.ok && (
            <p className="mt-1 text-xs opacity-90">
              Goals: {result.goalsImported}
              {result.eventsImported != null &&
                ` · events: ${result.eventsImported}`}
              {result.goalsSkipped > 0 && ` · skipped ${result.goalsSkipped}`}
            </p>
          )}
          {result.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-xs opacity-90">
              {result.errors.slice(0, 4).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
