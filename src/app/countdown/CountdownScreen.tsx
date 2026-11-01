"use client";

import { Check, Pin, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Countdown } from "@/lib/extras";
import { atMs, chipText, defaultAt, elapsed, SUGGESTIONS, toneOf, type Tone } from "@/lib/countdown";
import { useBank } from "@/lib/bank";
import { useApp, useHydrated } from "@/lib/store";
import { CountdownHero } from "@/components/CountdownHero";
import { ProgressRing } from "@/components/ProgressRing";
import { useNow } from "@/components/useNow";
import { Button, Card, Chip, PageSkeleton, Segmented, SectionTitle, Sheet, cx } from "@/components/ui";

type Tab = "target" | "exam";

const CHIP: Record<Tone, string> = {
  over: "bg-bad-soft text-bad",
  urgent: "bg-bad-soft text-bad",
  soon: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  ok: "bg-good-soft text-good",
  done: "bg-primary-soft text-primary",
};

export function CountdownScreen() {
  const hydrated = useHydrated();
  const now = useNow(1000);
  const list = useApp((s) => s.countdowns);
  const add = useApp((s) => s.addCountdown);
  const update = useApp((s) => s.updateCountdown);
  const remove = useApp((s) => s.removeCountdown);
  const pin = useApp((s) => s.pinCountdown);
  const qstats = useApp((s) => s.qstats);
  const { bank } = useBank();
  const [tab, setTab] = useState<Tab>("target");
  const [editing, setEditing] = useState<Countdown | "new" | null>(null);

  const sorted = useMemo(
    () => list.filter((c) => c.kind === tab).sort((a, b) => Number(!!a.done) - Number(!!b.done) || atMs(a) - atMs(b)),
    [list, tab],
  );
  const pinned = list.find((c) => c.pinned) ?? [...list].filter((c) => !c.done && atMs(c) > now).sort((a, b) => atMs(a) - atMs(b))[0];
  const pending = list.filter((c) => c.kind === "target" && !c.done).length;
  const have = new Set(list.map((c) => `${c.title}|${c.at}`));
  const suggestions = SUGGESTIONS.filter((s) => atMs(s) > now && !have.has(`${s.title}|${s.at}`));

  const practised = (c: Countdown) => {
    if (!c.subjectId || !bank) return null;
    const ids = bank.topics.filter((t) => t.subject === c.subjectId).flatMap((t) => t.qids);
    return ids.length ? ids.filter((id) => qstats[id]).length / ids.length : null;
  };

  if (!hydrated) return <PageSkeleton />;
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Countdowns</h1>
          <p className="mt-1 text-sm text-muted">Confirmed exam dates and your own deadlines to finish a subject or task.</p>
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus size={16} /> Add
        </Button>
      </div>

      {pinned ? (
        <div className="mt-5">
          <CountdownHero c={pinned} now={now} />
        </div>
      ) : (
        <Card className="mt-5 p-6 text-center">
          <p className="font-semibold">Nothing to count down to yet.</p>
          <p className="mt-1 text-sm text-muted">Add an exam date or a target date — the one you pin shows here with days, hours, minutes and seconds.</p>
        </Card>
      )}

      <Card className="mt-4 flex items-center gap-4 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-bad-soft text-bad font-display text-lg font-bold tabular">{pending}</span>
        <div>
          <div className="font-semibold">Pending targets</div>
          <div className="text-sm text-muted">{pending ? `You have ${pending} target${pending === 1 ? "" : "s"} still to finish.` : "Every target is done — set the next one."}</div>
        </div>
      </Card>

      <Segmented
        label="Countdown type"
        className="mt-5 max-w-sm"
        value={tab}
        onChange={setTab}
        options={[
          { value: "target", label: "Target dates" },
          { value: "exam", label: "Exam dates" },
        ]}
      />
      <p className="mt-2 text-sm text-muted">
        {tab === "target" ? "Your own deadline to complete a subject, a book or a set of tests." : "Dates fixed by the commission."}
      </p>

      {tab === "exam" && suggestions.length > 0 && (
        <>
          <SectionTitle>Confirmed in the 2026 notifications</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Chip key={s.title + s.at} on={false} onClick={() => add({ title: s.title, kind: "exam", at: s.at, note: s.source, pinned: !list.some((c) => c.pinned) })}>
                + {s.title} · {new Date(s.at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">The notification gives the date but not a start time, so 9:00 am (or 11:59 pm for last dates) is filled in — tap an item to change it.</p>
        </>
      )}

      <SectionTitle>{sorted.length ? `${sorted.length} ${tab === "target" ? "target" : "exam"}${sorted.length === 1 ? "" : "s"}` : "None yet"}</SectionTitle>
      <div className="grid gap-3">
        {sorted.map((c) => {
          const tone = toneOf(c, now);
          const pr = practised(c);
          return (
            <div key={c.id} className={cx("glass flex items-center gap-3 rounded-3xl p-3.5", c.pinned && "ring-2 ring-amber-300")}>
              <button onClick={() => setEditing(c)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Edit ${c.title}`}>
                <ProgressRing value={c.done ? 1 : elapsed(c, now)} size={50} stroke={5} label={chipText(c, now)}>
                  {c.done ? <Check size={18} className="text-good" /> : <span className="text-[10px] font-bold tabular">{Math.round(elapsed(c, now) * 100)}%</span>}
                </ProgressRing>
                <div className="min-w-0">
                  <div className={cx("truncate font-semibold", c.done && "text-muted line-through")}>{c.title}</div>
                  <div className="text-xs text-muted">
                    {new Date(c.at).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    {pr != null && ` · practised ${Math.round(pr * 100)}%`}
                  </div>
                </div>
              </button>
              {c.kind === "target" && (
                <button aria-label={c.done ? "Mark not done" : "Mark done"} onClick={() => update(c.id, { done: !c.done })} className={cx("shrink-0", c.done ? "text-good" : "text-faint")}>
                  <Check size={22} />
                </button>
              )}
              <span className={cx("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular", CHIP[tone])}>{chipText(c, now)}</span>
              <button aria-label={c.pinned ? "Unpin" : "Pin to top"} onClick={() => pin(c.id)} className={cx("shrink-0", c.pinned ? "text-amber-500" : "text-faint")}>
                <Pin size={20} fill={c.pinned ? "currentColor" : "none"} />
              </button>
            </div>
          );
        })}
      </div>

      <Sheet open={editing != null} onClose={() => setEditing(null)} title={editing === "new" ? "New countdown" : "Edit countdown"}>
        {editing != null && (
          <Form
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? null : editing}
            defaultKind={tab}
            subjects={bank?.subjects ?? []}
            onSave={(v) => {
              if (editing === "new") add({ ...v, pinned: !list.some((c) => c.pinned) });
              else update(editing.id, v);
              setEditing(null);
            }}
            onDelete={editing === "new" ? undefined : () => (remove(editing.id), setEditing(null))}
          />
        )}
      </Sheet>
    </div>
  );
}

function Form({
  initial,
  defaultKind,
  subjects,
  onSave,
  onDelete,
}: {
  initial: Countdown | null;
  defaultKind: Tab;
  subjects: { id: string; name: string; total: number }[];
  onSave: (v: { title: string; kind: Tab; at: string; subjectId?: string; note?: string }) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [kind, setKind] = useState<Tab>(initial?.kind ?? defaultKind);
  const [date, setDate] = useState((initial?.at ?? defaultAt()).slice(0, 10));
  const [time, setTime] = useState((initial?.at ?? defaultAt()).slice(11, 16));
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const ok = title.trim() && date && time;
  return (
    <div className="space-y-4">
      <Segmented
        label="Type"
        value={kind}
        onChange={setKind}
        options={[
          { value: "target", label: "Target date" },
          { value: "exam", label: "Exam date" },
        ]}
      />
      <label className="block text-sm font-bold">
        {kind === "target" ? "What do you want to finish?" : "Exam"}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === "target" ? "e.g. Finish Andhra Pradesh History" : "e.g. Group-1 Prelims"}
          className="mt-2 block h-11 w-full rounded-xl border border-hairline bg-transparent px-3 font-normal"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-bold">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 block h-11 w-full rounded-xl border border-hairline bg-transparent px-3 font-normal" />
        </label>
        <label className="block text-sm font-bold">
          Time
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-2 block h-11 w-full rounded-xl border border-hairline bg-transparent px-3 font-normal" />
        </label>
      </div>
      {kind === "target" && (
        <label className="block text-sm font-bold">
          Subject (optional — shows how much you have practised)
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mt-2 block h-11 w-full rounded-xl border border-hairline bg-transparent px-3 font-normal">
            <option value="">None</option>
            {subjects.filter((s) => s.total > 0).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="block text-sm font-bold">
        Note (optional)
        <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-2 block h-11 w-full rounded-xl border border-hairline bg-transparent px-3 font-normal" />
      </label>
      <div className="flex gap-3">
        {onDelete && (
          <Button variant="danger" onClick={onDelete} aria-label="Delete">
            <Trash2 size={17} />
          </Button>
        )}
        <Button
          className="flex-1"
          disabled={!ok}
          onClick={() => onSave({ title: title.trim(), kind, at: `${date}T${time}`, subjectId: kind === "target" && subjectId ? subjectId : undefined, note: note.trim() || undefined })}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
