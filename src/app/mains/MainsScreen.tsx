"use client";

import { ArrowRight, Check, ChevronDown, ChevronLeft, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import checklist from "@/content/mains-checklist.json";
import modelF1 from "@/content/mains-model-f1.json";
import modelF2 from "@/content/mains-model-f2.json";
import modelF3 from "@/content/mains-model-f3.json";
import modelF4 from "@/content/mains-model-f4.json";
import modelF5 from "@/content/mains-model-f5.json";
import modelG23 from "@/content/mains-model-g23.json";
import modelG45 from "@/content/mains-model-g45.json";
import modelS1 from "@/content/mains-model-s1.json";
import modelS2 from "@/content/mains-model-s2.json";
import modelS3 from "@/content/mains-model-s3.json";
import modelP2P3 from "@/content/mains-model-p3p2.json";
import modelP4 from "@/content/mains-model-p4.json";
import modelP5 from "@/content/mains-model-p5.json";
import { bySubject, DIM_LABEL, importance, nextTheme, PAPER_TITLES, studyOrder, sumProgress, themeDone, themeProgress, type Expected, type Theme } from "@/lib/checklist";
import { readKey } from "@/lib/mainsLearn";
import { useApp, useHydrated } from "@/lib/store";
import { Button, Card, Chip, PageSkeleton, SectionTitle, cx } from "@/components/ui";

const THEMES = checklist as unknown as Theme[];
const ORDER = studyOrder(THEMES);
const BY_ID = new Map(THEMES.map((t) => [t.id, t]));
const SITTINGS = [2008, 2011, 2012, 2016, 2017, 2020, 2023, 2025];

interface Model {
  id: string;
  question: string;
  why?: string;
  intro: string;
  body: { h: string; pts: string[] }[];
  conclusion: string;
  updates?: string[];
  src?: string;
  /** "appsc": written to the APPSC Mains pattern — many short points, about 12 minutes to write. */
  style?: "appsc";
}
const MODELS = new Map(
  ([...modelF1, ...modelF2, ...modelF3, ...modelF4, ...modelF5, ...modelG23, ...modelG45, ...modelS1, ...modelS2, ...modelS3, ...modelP5, ...modelP4, ...modelP2P3] as unknown as Model[]).map((m) => [m.id, m]),
);
const otherCount = (t: Theme) => t.asked.filter((a) => a.boards.length > 0 && !a.boards.includes("APPSC")).length;
const dimLabel = (d: string) => DIM_LABEL[d] ?? d;

export function MainsScreen() {
  const hydrated = useHydrated();
  const done = useApp((s) => s.learn.done);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [paper, setPaper] = useState(1);
  const [view, setView] = useState<"subjects" | "all">("subjects");

  const total = useMemo(() => sumProgress(ORDER, done), [done]);
  if (!hydrated) return <PageSkeleton />;

  const theme = themeId ? BY_ID.get(themeId) : null;
  if (theme) {
    return (
      <ThemeView
        theme={theme}
        onBack={() => setThemeId(null)}
        onNext={() => {
          const n = nextTheme(ORDER, theme.id, done);
          if (n) {
            setPaper(n.paper);
            setThemeId(n.id);
            window.scrollTo({ top: 0 });
          } else setThemeId(null);
        }}
      />
    );
  }

  const resume = nextTheme(ORDER, null, done);
  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Group-I Mains checklist</h1>
      <p className="mt-1 text-sm text-muted">
        Pick a paper, then a subject and a theme. Every theme shows the questions already asked and the questions we expect next. Learn the expected
        ones, tick them off, and move on to the next theme.
      </p>

      <Card className="mt-4 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="font-display text-3xl font-bold tabular">
              {total.done}
              <span className="text-lg font-semibold text-muted"> / {total.total}</span>
            </div>
            <div className="text-xs text-muted">expected questions learned · {THEMES.reduce((n, t) => n + t.n, 0)} past questions covered</div>
          </div>
          {resume && (
            <Button size="sm" onClick={() => (setPaper(resume.paper), setThemeId(resume.id))}>
              {total.done ? "Continue" : "Start"} <ArrowRight size={15} />
            </Button>
          )}
        </div>
        <Bar value={total.done} max={total.total} className="mt-3" />
      </Card>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Paper">
        {[1, 2, 3, 4, 5].map((n) => {
          const p = sumProgress(ORDER.filter((t) => t.paper === n), done);
          return (
            <Chip key={n} on={paper === n} onClick={() => setPaper(n)}>
              Paper {n} · {p.done}/{p.total}
            </Chip>
          );
        })}
      </div>
      <p className="mt-2 text-sm font-semibold">{PAPER_TITLES[paper]}</p>

      <div className="mt-3 flex gap-2" role="group" aria-label="View">
        <Chip on={view === "subjects"} onClick={() => setView("subjects")}>
          By subject
        </Chip>
        <Chip on={view === "all"} onClick={() => setView("all")}>
          All themes in the PDF · {THEMES.filter((t) => t.paper === paper).length}
        </Chip>
      </div>

      {view === "all" ? (
        <AllThemes paper={paper} done={done} onPick={setThemeId} />
      ) : (
        <div className="mt-3 grid gap-3">
          {bySubject(THEMES, paper).map((g) => (
            <Subject key={g.subject} subject={g.subject} themes={g.themes} done={done} onPick={setThemeId} />
          ))}
        </div>
      )}
      {view === "subjects" && THEMES.some((t) => t.paper === paper && t.legacy) && (
        <p className="mt-4 text-xs text-muted">
          Hidden: {THEMES.filter((t) => t.paper === paper && t.legacy).map((t) => t.label).join(", ")} — topics the commission removed from the 2026 syllabus.
        </p>
      )}
    </div>
  );
}

/** Every theme of the Mains PYQ compilation for the paper, in the PDF's own (syllabus) order, with the full syllabus line. */
function AllThemes({ paper, done, onPick }: { paper: number; done: Record<string, number>; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"syllabus" | "asked">("syllabus");
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return THEMES.filter((t) => t.paper === paper && (!ql || (t.label + " " + t.full + " " + t.subject).toLowerCase().includes(ql))).sort((a, b) =>
      sort === "asked" ? b.pdfn - a.pdfn || b.n - a.n || a.order - b.order : a.order - b.order || b.n - a.n,
    );
  }, [paper, q, sort]);
  let lastSubject = "";
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 rounded-2xl border border-hairline px-3">
        <Search size={16} className="text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search themes (e.g. GST, Satavahanas, cyber)"
          aria-label="Search themes"
          className="w-full bg-transparent py-2.5 text-sm outline-none"
        />
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="font-semibold">{list.length} themes</span>
        <Chip on={sort === "syllabus"} onClick={() => setSort("syllabus")}>
          PDF order
        </Chip>
        <Chip on={sort === "asked"} onClick={() => setSort("asked")}>
          Most repeated first
        </Chip>
      </div>
      <ol className="mt-3 grid gap-2">
        {list.map((t, i) => {
          const head = sort === "syllabus" && t.subject !== lastSubject ? t.subject : null;
          lastSubject = t.subject;
          const tp = themeProgress(t, done);
          const fin = themeDone(t, done);
          return (
            <li key={t.id}>
              {head && <div className="mb-1 mt-3 text-xs font-bold uppercase tracking-wider text-faint">{head}</div>}
              <button className="glass flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:-translate-y-0.5" onClick={() => onPick(t.id)}>
                <span className={cx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold tabular", fin ? "bg-good text-white" : "bg-primary-soft text-primary")}>
                  {fin ? <Check size={13} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold leading-snug">{t.label}</span>
                    <Importance t={t} />
                  </span>
                  {t.full !== t.label && <span className="mt-0.5 block text-[11px] leading-snug text-muted">{t.full}</span>}
                  <span className="mt-1 block text-xs text-muted">
                    asked {t.n}×{t.years.length ? ` · last ${t.years.at(-1)}` : ""} · {tp.total ? `${tp.done}/${tp.total} learned` : t.legacy ? "removed from 2026 syllabus" : "past questions only"}
                    {otherCount(t) > 0 ? ` · +${otherCount(t)} from other exams` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const LEVEL_STYLE: Record<number, string> = {
  4: "bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-200",
  3: "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200",
  2: "bg-primary-soft text-primary",
  1: "bg-hairline text-muted",
};
function Importance({ t }: { t: Theme }) {
  if (!t.pdfn) return null;
  const im = importance(t);
  return (
    <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-bold", LEVEL_STYLE[im.level])} title={`${t.pdfn} questions listed under this microtheme in the PDF`}>
      {im.label} · {t.pdfn}×
    </span>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-hairline", className)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

function Subject({ subject, themes, done, onPick }: { subject: string; themes: Theme[]; done: Record<string, number>; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const p = sumProgress(themes.filter((t) => t.expected.length), done);
  return (
    <Card className="p-0">
      <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-snug">{subject}</div>
          <div className="mt-0.5 text-xs text-muted">
            {themes.length} themes · {p.done}/{p.total} expected questions learned
          </div>
          <Bar value={p.done} max={p.total} className="mt-2" />
        </div>
        <ChevronDown size={18} className={cx("shrink-0 text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="divide-y divide-hairline border-t border-hairline">
          {themes.map((t) => {
            const tp = themeProgress(t, done);
            const fin = themeDone(t, done);
            return (
              <li key={t.id}>
                <button className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-primary-soft/40" onClick={() => onPick(t.id)}>
                  <span className={cx("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2", fin ? "border-good bg-good text-white" : "border-hairline")}>
                    {fin && <Check size={12} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug">{t.label}</span>
                    <span className="mt-0.5 block">
                      <Importance t={t} />
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      asked {t.n}× · {t.years.length} sittings{t.years.length ? ` · last ${t.years.at(-1)}` : ""} · {tp.done}/{tp.total} learned
                      {otherCount(t) > 0 ? ` · +${otherCount(t)} from other exams` : ""}
                    </span>
                  </span>
                  <ArrowRight size={15} className="mt-1 shrink-0 text-faint" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function ThemeView({ theme, onBack, onNext }: { theme: Theme; onBack: () => void; onNext: () => void }) {
  const done = useApp((s) => s.learn.done);
  const p = themeProgress(theme, done);
  const fin = themeDone(theme, done);
  const [showAsked, setShowAsked] = useState(false);
  const [showOther, setShowOther] = useState(true);
  const [showPractice, setShowPractice] = useState(false);
  const asked = useMemo(
    () => ({
      appsc: theme.asked.filter((a) => a.boards.includes("APPSC")),
      other: theme.asked.filter((a) => a.boards.length > 0 && !a.boards.includes("APPSC")),
      practice: theme.asked.filter((a) => a.boards.length === 0),
    }),
    [theme],
  );
  useEffect(() => window.scrollTo({ top: 0 }), [theme.id]);

  return (
    <div>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ChevronLeft size={16} /> All themes
      </button>
      <div className="text-xs text-muted">
        {PAPER_TITLES[theme.paper]} · {theme.subject}
      </div>
      <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{theme.label}</h1>
      <div className="mt-2">
        <Importance t={theme} />
      </div>
      {theme.full !== theme.label && <p className="mt-1 text-xs text-muted">{theme.full}</p>}

      <Card className="mt-4 p-4">
        <div className="text-sm">
          Asked <b>{theme.n}×</b> · {theme.years.filter((y) => SITTINGS.includes(y)).length} of {SITTINGS.length} APPSC sittings
          {theme.years.some((y) => !SITTINGS.includes(y)) ? " + TGPSC" : ""}
          {theme.years.length ? ` · last ${theme.years.at(-1)}` : ""}.
        </div>
        <div className="mt-2 flex gap-1" aria-label={`Sittings: ${theme.years.join(", ")}`}>
          {SITTINGS.map((y) => (
            <span key={y} title={String(y)} className={cx("h-2 flex-1 rounded-full", theme.years.includes(y) ? "bg-primary" : "bg-hairline")} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-faint">
          <span>2008</span>
          <span>2025</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          {Object.entries(theme.dims)
            .sort((a, b) => b[1] - a[1])
            .map(([d, n]) => (
              <span key={d} className="rounded-full bg-good-soft px-2 py-0.5 text-good">
                {dimLabel(d)} · {n}
              </span>
            ))}
          {theme.unseen.map((d) => (
            <span key={d} className="rounded-full border border-dashed border-amber-400 px-2 py-0.5 text-amber-700 dark:text-amber-300">
              Not asked yet: {dimLabel(d)}
            </span>
          ))}
        </div>
      </Card>

      <SectionTitle>
        Expected questions · {p.done}/{p.total} learned
      </SectionTitle>
      {theme.expected.length === 0 ? (
        <Card className="p-4 text-sm text-muted">No expected questions for this theme yet — read the past questions below.</Card>
      ) : (
        <div className="grid gap-3">
          {theme.expected.map((e, i) => (
            <ExpectedCard key={e.id} e={e} index={i + 1} />
          ))}
        </div>
      )}

      {fin && (
        <Card strong className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="font-semibold">Theme completed — well done.</span>
          <Button onClick={onNext}>
            Next theme <ArrowRight size={16} />
          </Button>
        </Card>
      )}

      <AskedGroup
        title="Asked by APPSC"
        note="Every question the commission has set on this theme."
        items={asked.appsc}
        open={showAsked}
        toggle={() => setShowAsked((s) => !s)}
      />
      {asked.other.length > 0 && (
        <AskedGroup
          title="Asked by other exams, not by APPSC"
          note="UPSC (2013–2026) and TGPSC questions on this theme that APPSC has not set. They show angles the commission could take next."
          items={asked.other}
          open={showOther}
          toggle={() => setShowOther((s) => !s)}
        />
      )}
      {asked.practice.length > 0 && (
        <AskedGroup
          title="Practice questions"
          note="Coaching practice questions with no exam tag."
          items={asked.practice}
          open={showPractice}
          toggle={() => setShowPractice((s) => !s)}
        />
      )}

      {!fin && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={onNext}>
            Skip to next theme <ArrowRight size={15} />
          </Button>
        </div>
      )}
    </div>
  );
}

function AskedGroup({ title, note, items, open, toggle }: { title: string; note: string; items: Theme["asked"]; open: boolean; toggle: () => void }) {
  return (
    <>
      <button onClick={toggle} className="mt-6 flex w-full items-center justify-between text-left" aria-expanded={open}>
        <SectionTitle>
          {title} · {items.length}
        </SectionTitle>
        <ChevronDown size={18} className={cx("text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <p className="-mt-1 mb-2 text-xs text-muted">{note}</p>
          <ul className="grid gap-2">
            {items.map((a) => (
              <li key={a.q} className="glass rounded-2xl p-3 text-sm leading-snug">
                <div className="mb-1 flex flex-wrap gap-1.5 text-[11px] font-semibold text-muted">
                  {a.boards.map((b) => (
                    <span key={b} className="rounded-full bg-primary-soft px-2 py-0.5 text-primary">
                      {b}
                    </span>
                  ))}
                  {a.years.length > 0 && <span>{a.years.join(" · ")}</span>}
                  {a.dims.map((d) => (
                    <span key={d} className="rounded-full bg-good-soft px-2 py-0.5 text-good">
                      {dimLabel(d)}
                    </span>
                  ))}
                </div>
                {a.q}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function ExpectedCard({ e, index }: { e: Expected; index: number }) {
  const done = useApp((s) => s.learn.done[e.id]);
  const complete = useApp((s) => s.completeQ);
  const uncomplete = useApp((s) => s.uncompleteQ);
  const read = useApp((s) => s.learn.read);
  const toggleRead = useApp((s) => s.toggleRead);
  const note = useApp((s) => s.mains[e.id]?.text ?? "");
  const saveNote = useApp((s) => s.saveMains);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(note);
  const model = e.model ? MODELS.get(e.id) : undefined;
  const left = (model?.updates ?? []).filter((_, i) => !read?.[readKey(e.id, i)]).length;

  useEffect(() => {
    if (text === note) return;
    const t = setTimeout(() => saveNote(e.id, { text }), 600);
    return () => clearTimeout(t);
  }, [text, note, e.id, saveNote]);

  return (
    <Card className={cx("p-4", !!done && "opacity-90")}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => (done ? uncomplete(e.id) : complete(e.id))}
          aria-label={done ? "Mark as not learned" : "Mark as learned"}
          className={cx("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition", done ? "border-good bg-good text-white" : "border-hairline hover:border-primary")}
        >
          {done && <Check size={15} />}
        </button>
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold">
            <span className="text-muted">Q{index}</span>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-primary">{dimLabel(e.dim)}</span>
            {model && <span className="rounded-full bg-good-soft px-2 py-0.5 text-good">Full answer</span>}
            {e.dynamic && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Current affairs</span>}
            {!!model?.updates?.length && left > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Read {left} update{left > 1 ? "s" : ""}</span>}
          </span>
          <span className={cx("mt-1.5 block leading-snug", !open && "line-clamp-3")}>{e.q}</span>
        </button>
        <ChevronDown size={18} className={cx("mt-1 shrink-0 text-muted transition", open && "rotate-180")} />
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-hairline pt-4">
          {e.why && (
            <div className="rounded-2xl bg-primary-soft p-3 text-sm">
              <b className="text-primary">Why this is expected</b>
              <p className="mt-1">{e.why}</p>
            </div>
          )}
          {model ? <ModelAnswer m={model} /> : <Structure e={e} />}

          {!!model?.updates?.length && (
            <div className="rounded-2xl border border-amber-300/70 bg-amber-50/60 p-3 dark:bg-amber-400/10">
              <p className="text-sm font-bold">Current affairs — read the latest before writing this answer</p>
              <ul className="mt-2 space-y-2">
                {model.updates.map((u, i) => {
                  const k = readKey(e.id, i);
                  return (
                    <li key={k}>
                      <label className="flex cursor-pointer items-start gap-2 text-sm">
                        <input type="checkbox" className="mt-1 size-4 accent-[var(--color-primary)]" checked={!!read?.[k]} onChange={() => toggleRead(k)} />
                        <span className={cx(!!read?.[k] && "text-muted line-through")}>{u}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <label className="block text-sm font-bold">
            My key points
            <textarea
              value={text}
              onChange={(ev) => setText(ev.target.value)}
              placeholder="Facts, data and examples you want to remember for this answer."
              className="mt-2 block min-h-24 w-full rounded-2xl border border-hairline bg-transparent p-3 font-normal leading-relaxed outline-none focus:border-primary"
            />
          </label>
          <Button className="w-full" variant={done ? "outline" : "primary"} onClick={() => (done ? uncomplete(e.id) : complete(e.id))}>
            <Check size={17} /> {done ? "Learned — tap to undo" : "Mark as learned"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function Structure({ e }: { e: Expected }) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline p-3">
      <p className="text-sm font-semibold">Answer structure</p>
      <p className="mt-1 text-xs text-muted">Auto-drafted outline for this expected question. Fill it with facts and data from your own notes below.</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
        {(e.structure ?? []).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫"];
const wordsOf = (m: Model) => (m.intro + " " + m.body.map((b) => b.pts.join(" ")).join(" ") + " " + m.conclusion).split(/\s+/).filter(Boolean).length;
/** "Ex: …" parts stand out, like the example lines of a topper's answer. */
function Point({ text }: { text: string }) {
  const i = text.indexOf("Ex:");
  return i < 0 ? <>{text}</> : (
    <>
      {text.slice(0, i)}
      <b className="text-primary">Ex:</b>
      {text.slice(i + 3)}
    </>
  );
}

function ModelAnswer({ m }: { m: Model }) {
  const words = wordsOf(m);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-primary">{words} words</span>
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-primary">about {Math.max(1, Math.round(words / 30))} min to write at 30 words a minute</span>
        {m.style === "appsc" && <span className="rounded-full bg-good-soft px-2 py-0.5 text-good">APPSC style · 12 min per answer</span>}
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-faint">Introduction</p>
      <p className="leading-relaxed">{m.intro}</p>
      <p className="text-xs font-bold uppercase tracking-wider text-faint">Body</p>
      {m.body.map((b) => (
        <div key={b.h}>
          <h4 className="font-display text-base font-bold underline decoration-primary/50 underline-offset-4">{b.h}</h4>
          <ul className="mt-1 space-y-1 leading-relaxed">
            {b.pts.map((p, i) => (
              <li key={p} className="flex gap-2">
                <span className="shrink-0 text-primary">{CIRCLED[i] ?? "•"}</span>
                <span>
                  <Point text={p} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-xs font-bold uppercase tracking-wider text-faint">Conclusion</p>
      <p className="leading-relaxed">{m.conclusion}</p>
      <p className="text-xs text-muted">
        Written for this app as a study aid; verify figures against the latest sources before the exam.
        {m.src ? ` Figures from: ${m.src}.` : ""}
      </p>
    </div>
  );
}
