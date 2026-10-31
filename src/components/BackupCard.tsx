"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { makeBackup, parseBackup } from "@/lib/backup";
import { dayKey } from "@/lib/random";
import { useApp } from "@/lib/store";
import { Button, Card, Sheet } from "./ui";

/** Progress lives only in this browser until Phase 2 accounts — let students keep a copy. */
export function BackupCard() {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ReturnType<typeof parseBackup> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(makeBackup(useApp.getState()))], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `team-civilians-backup-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setDone("Backup downloaded. Keep it somewhere safe (e.g. Google Drive).");
  };

  const onFile = async (f: File | undefined) => {
    setError(null);
    setDone(null);
    if (!f) return;
    try {
      setPending(parseBackup(await f.text()));
    } catch (e) {
      setError((e as Error).message);
    }
    if (input.current) input.current.value = "";
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold">Back up your progress</h3>
      <p className="mt-1 text-sm text-muted">
        Your results live only in this browser. Download a backup to move to a new phone or recover after clearing data.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={exportFile}>
          <Download size={15} /> Download backup
        </Button>
        <Button size="sm" variant="outline" onClick={() => input.current?.click()}>
          <Upload size={15} /> Restore from file
        </Button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Backup file"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-3 text-sm text-bad" role="alert">{error}</p>}
      {done && <p className="mt-3 text-sm text-good" role="status">{done}</p>}

      <Sheet open={!!pending} onClose={() => setPending(null)} title="Restore this backup?">
        {pending && (
          <>
            <ul className="space-y-1 text-sm">
              <li>
                <b>{pending.attempts.length}</b> tests · <b>{Object.keys(pending.qstats).length}</b> questions practised ·{" "}
                <b>{pending.bookmarks.length}</b> saved
              </li>
              {pending.profile && (
                <li className="text-muted">
                  Profile: {pending.profile.name || "Aspirant"} · {pending.profile.examId}
                </li>
              )}
            </ul>
            <p className="mt-3 text-sm text-muted">This replaces the progress currently on this device.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  useApp.getState().restore(pending as Parameters<ReturnType<typeof useApp.getState>["restore"]>[0]);
                  setPending(null);
                  setDone("Progress restored.");
                }}
              >
                Restore
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </Card>
  );
}
