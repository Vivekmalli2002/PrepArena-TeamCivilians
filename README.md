# Team Civilians — APPSC CBT practice (Phase 1)

**Live:** https://prep-arena-team-civilians-zo64.vercel.app/ (Vercel Hobby · auto-deploys from `main`)

An installable, offline-first practice PWA for Andhra Pradesh government-exam (APPSC) aspirants.
Phase 1 is fully client-side: no backend, no login. Each student's progress lives in their browser.
The original build brief is in [`docs/BRIEF.md`](docs/BRIEF.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 (validates content first)
npm test           # content pipeline, corrections, scoring, CBT rules, spaced repetition, migration
npm run build      # static export to out/ + service worker (out/sw.js)
npm run content:audit   # regenerates docs/content-audit.md
```

**Deploy (free):** the repo is connected to Vercel (Hobby plan); every push to `main` redeploys.
Vercel Hobby is for non-commercial use — before charging for premium (Phase 2), move to Cloudflare Pages
(free, commercial use allowed: build `npm run build`, output `out`) or upgrade to Vercel Pro.

## What's in Phase 1

| Screen | Route | Notes |
|---|---|---|
| Onboarding / Home | `/` | Target exam + optional name (local profile), continue / up next, five daily study slots (pick a topic, 10 questions before study and 10 after, bedtime mistakes round), full mock, quick stats |
| Test catalog | `/tests` | Topics (sets of ~25, progress ring, best score, sub-topics when tagged), topic + full mocks, custom builder |
| Error log book | `/mistakes` | Every wrong/blank question until answered correctly; reason tags (auto-guessed, yours win), your own note per question, repeat-miss and blank filters, search, sort, weakest topics, retry 10/25/50, mark as mastered, CSV export |
| CBT player | `/play` | Instructions screen, TCS-iON style palette (5 statuses), countdown + per-question timer, pause / resume / restart, Save & Next, Mark & Next, Clear, jump, auto-submit at 00:00, keyboard shortcuts on desktop |
| Results + review | `/results?id=` | Net score with negative marking, accuracy, time vs target, by-topic, personal-best confetti, filterable solutions |
| Progress | `/progress` | Topic mastery, 3 weakest topics with "Practise this", score trend, pace, 14-day streak, history |
| Learn | `/learn` | Flashcards (due deck first), saved questions, spaced-repetition revision set with due dates |
| PWA | — | Manifest + icons, precaching service worker (works offline), install prompt after the first good session |

**Modes.** *Practice*: self-paced (count-up clock), the answer locks on tap and the key and explanation show at once.
*Exam*: like the real CBT. Nothing counts until Save & Next, there's no feedback until submit, and the countdown auto-submits.

**Marking schemes:** +1/−⅓ (APPSC default), +2/−0.66, +1/−0.25, no negative. Pick one per test.

## Exams & notifications

`/exams` and `/exams/<id>` summarise each 2026 APPSC notification (in [`docs/notifications/`](docs/notifications/)):
vacancies and pay, application window (with a live open/closed badge), eligibility and age relaxation, fees, exam
pattern, negative marking, selection process, minimum qualifying marks and the paper-wise syllabus. Data lives in
`src/content/notifications.ts`; only what the notifications state is recorded. Real cut-offs appear only after results.


All eight APPSC exams are selectable; **Group-2, AEE PCB and AEE PR & Tribal Welfare** are the launch priority and are listed first.
`src/content/catalog.ts` maps Exam ↔ Paper → Subject → Unit, transcribed from the YUDDAM 2027 overlap masters in
[`docs/syllabus/`](docs/syllabus/). Papers are shared many-to-many: the common GS Paper-I (AEE, ASWO/ATWO, Endowment EO)
and AEE Paper-II (common to R&B, Irrigation, PR & TW, each with its own Paper-III). Home shows "Your papers" with
"shared with" badges and each subject's units with the other exams that cover them.

## Content

- Source: `content/team-civilians-questions.json` (1,193 questions). **Never edited by the pipeline.**
- Corrections: `content/corrections.json` — watermark stripping, removal of the "Question not attempted" option,
  topic merges, and a `quarantine` list (with a reason per id) of questions withdrawn until an editor fixes them.
  The build fails if a correction would change any keyed answer.
- `scripts/prepare-content.mjs` validates, applies corrections, hides exact duplicates and publishes
  `public/data/index.json` (~11 KB: topics → ids) plus one content-hashed file per topic, loaded on demand.
- `docs/content-audit.md` (`npm run content:audit`) shows before → after and what still needs an editor.
- **Structured question banks** live in `data/questions/<subject>.json` (structured from the source books per the structuring spec) with
  stable string ids mapped to integer ids in `data/questions/_ids.json`. Each item records its source page, the original key letter and a
  `keyCheck` status; items whose key could not be confirmed (`source-only`, `conflict-trusted-explanation`, …) are published as *withdrawn*
  and never reach a test until an editor confirms them. Items dropped during structuring are listed with reasons in `*.dropped.json`.
- **Anti-repeat tests:** mocks, topic mocks and custom tests prefer questions the student has not seen (then the longest-unseen), never repeat a
  question inside one test, shuffle question order, and shuffle option order for display only (answers and scoring keep the original option
  index). Options that refer to each other ("All of the above", "1 and 2 only", "(a)-(iii)…") keep their printed order.
- **Bulk extraction** (`scripts/extract/`): `civil_columns.py` reads the layout-preserved two-column Civil Engineering volumes by finding each
  page's gutter, then recognises question blocks by their running numbers and validates each one (stem, four distinct options, keyed answer).
  Items that pass go to `data/questions/civil-vol*.json` (live); items that fail any check go to `data/review/*-flagged.json` with the reasons.
  Books whose text export has interleaved columns (GS books, APPSC EM book, PYQ book) are written review-only to `data/review/` with the flag
  `layout-interleaved` and are never published until re-extracted from the original PDFs.
- Withdrawn questions stay in the topic files so old results can still be reviewed (with a note), but never appear in tests.
- **Editorial overrides** (`overrides` in corrections.json) rewrite a broken stem or key with a recorded reason;
  the app shows “Revised by Team Civilians” under the explanation.
- **Original questions** live in `content/authored/<subject>.json` and are generated by `scripts/authoring/*.py`
  (`cd scripts/authoring && python3 <subject>.py`). Keys are given as answer text, duplicates are rejected and numerical
  answers are computed in code. They are tagged “Team Civilians original” and listed in the audit for editor sign-off.
- The bank is multi-subject; tests, mocks and the daily quiz are scoped to the subjects of the student's exam, and
  full mocks give each subject an equal share of seats.
- Topics and sub-topics come from the data, and `subtopic` is supported as soon as questions carry it.

## Learning features

- **Spaced repetition** (`src/lib/srs.ts`): a wrong answer puts a question in the revision set, due now. Each right answer
  (in a test or a flashcard "Got it") moves it up a box: due again in 1 → 3 → 7 → 16 days, then it graduates.
- **Backup**: Progress → "Your data" downloads a JSON backup and restores it (validated, with a confirmation).
- Statement questions ("1. … 2. …", "Statement-I : …", "Assertion (A) …") are laid out line by line at display time only. A test checks that no character of any question is lost.

## Code map

```
src/app/            routes (each page is a thin server shell around a client screen)
src/components/     UI kit (glass cards, sheet, segmented, rings), QuestionView, PwaManager
src/lib/store.ts    zustand stores: app data (tc-app) + live test session (tc-session, written every second)
src/lib/tests.ts    builders: topic sets, topic/full mocks, daily quiz (seeded by date), custom, weak-area, revision
scripts/extract/build_mech.py   YCT Mechanical Vol-1 Material Science + Vol-2 Thermodynamics -> AEE PCB Paper-II banks
scripts/extract/build_chem.py     Chemical Engineering YCT -> fluid mechanics, process calculations, pollution control for AEE PCB (needs chem_columns.py)
scripts/extract/build_drawing.py  Engineering Drawing MCQs with explanations -> drawing-survey bank (14 syllabus units, per-exam)
src/lib/slots.ts    study slots: 5 a day, topic chosen per slot, 10 questions before study + 10 after, bedtime round from the day's mistakes
src/lib/scoring.ts  marking schemes + pure scoring
scripts/            content validation/audit, service-worker generator
```

Stored attempts keep only question ids, responses and a snapshot of the answer key, so a later fix to the bank doesn't rewrite past results.


## Civil chapters, exam-pattern mocks and weightage

- **Chapters.** Civil questions are filed under the chapter list in `data/civil-chapters.json` (from the supplied
  *Civil Engineering Chapter List*), one subject per heading, chapters in document order. Book questions stay where the YCT index puts them: each YCT heading
  (`scripts/extract/civil_yct.py`) may only go to the chapters listed for it, keywords pick among those. YCT headings with no chapter
  in the list (Building Construction, Bridge, Tunnel & Docks) stay under "Other civil" with the YCT heading as sub-topic; previous-paper questions are placed by nearest neighbours + keyword rules (`scripts/extract/civil_classify.py`,
  rules in `civil_rules.py`, written back by `civil_apply.py`). Chapter placement of previous-paper questions is
  automatic (self-test about 68 % chapter / 86 % subject agreement); the original unit or exam is kept as `bookUnit` / sub-topic.
- **Weightage.** `scripts/extract/civil_weights.py` measures how many questions each subject and chapter had in real
  AEE (civil) papers and writes `src/content/civilWeights.json`. The notifications do not publish per-topic counts, so these
  are measured shares, not official ones.
- **Mocks.** `src/content/patterns.ts` defines paper patterns (AEE Paper-2/3, Group-2 screening, AEE Paper-1) with the
  basis stated on screen; "Customise" lets the student pick the number of questions per section. The Custom builder takes
  any number up to what is available and can follow the weightage.

## Group-I Mains checklist

`/mains` is a **progress checklist**, not a daily quota: Paper → subject → theme. A theme shows how often it was asked (and in which
sittings), the angles ("dimensions") asked so far and the ones never asked, **every past question** (APPSC and TGPSC, with years), and
the **expected questions** (at most 10 for a big theme, fewer for a small one). Tick an expected question when learned; when the whole
theme is ticked the next theme is offered. No backlog.

Sources (all Group-I): the APPSC Mains PYQ compilation (`scripts/data/compilation.json`, from `scripts/extract/mains_compilation.py`),
the Ghissu model-answer books' indexes (`scripts/extract/ghissu_index.py`), the CivicCentre PYQ books incl. TGPSC
(`scripts/extract/civiccentre_pyq.py`) and, by OCR, the CivicCentre "Mission 1000" workbooks (`scripts/extract/ocr_workbooks.py`,
`workbooks_parse.py`, needs `pip install rapidocr-onnxruntime wordsegment`; 13 workbooks, 340 questions read, 56 not in the other sources — questions without an exam tag are shown as "Practice question").

Build: `python3 -I scripts/analysis/build_checklist.py` (merge, de-duplicate, file under themes) then
`python3 -I scripts/analysis/build_expected.py` (expected questions) → `src/content/mains-checklist.json`.

- Expected questions: dimensions never asked on a theme first, then dimensions asked recently (2020+); stems are drafted from templates per
  subject area (history, geography, polity, administration, ethics, economy, science, essay) with an answer **structure**; "recent
  developments" stems are ranked last. Where a hand-written model answer exists (`src/content/mains-model-*.json`: intro, body,
  conclusion, optional "read the latest" checklist) it is attached to the nearest theme and shown as **Full answer**.
- Topics the commission has removed from the 2026 syllabus (Notification 07/2026) are hidden.
- Progress is stored in the app's `learn.done` (question id → time), so it is included in backup/restore.

- **UPSC questions** (`scripts/extract/upsc_pyq.py` → `scripts/data/upsc.json`; GS-I…IV 2013–2026, 1,118 questions from the UnlockIAS compilations):
  each UPSC heading is mapped to the Mains subject it belongs to (headings with no APPSC counterpart — world history, international
  relations, security, ethics case studies — are left out, 294 questions). Inside the subject a question joins the theme it is most
  similar to; otherwise it is kept in that subject's "Miscellaneous · UPSC questions" list. They appear on the theme page under
  "Asked by other exams, not by APPSC" and never count towards APPSC recurrence, importance or the "not asked yet" angles.

- **APPSC-style model answers** (`style: "appsc"` in `src/content/mains-model-s1.json`): 12 minutes and about 2.5–3 booklet pages per answer
  (45 pages / 15 questions) → 250–350 words, many short points, one example per point, new facts about 20%, underlined sub-headings,
  a forward-looking conclusion that names the ministry or body and the citizen's right. The card shows the word count.
