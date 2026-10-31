# Team Civilians — APPSC CBT practice (Phase 1)

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

**Deploy (free):** import the repo in Vercel. The framework preset is detected; no settings are needed.
The export is plain static files, so any static host also works.

## What's in Phase 1

| Screen | Route | Notes |
|---|---|---|
| Onboarding / Home | `/` | Target exam + optional name (local profile), continue / up next, daily quiz, full mock, quick stats |
| Test catalog | `/tests` | Topics (sets of ~25, progress ring, best score, sub-topics when tagged), topic + full mocks, custom builder |
| CBT player | `/play` | Instructions screen, TCS-iON style palette (5 statuses), countdown + per-question timer, pause / resume / restart, Save & Next, Mark & Next, Clear, jump, auto-submit at 00:00, keyboard shortcuts on desktop |
| Results + review | `/results?id=` | Net score with negative marking, accuracy, time vs target, by-topic, personal-best confetti, filterable solutions |
| Progress | `/progress` | Topic mastery, 3 weakest topics with "Practise this", score trend, pace, 14-day streak, history |
| Learn | `/learn` | Flashcards (due deck first), saved questions, spaced-repetition revision set with due dates |
| PWA | — | Manifest + icons, precaching service worker (works offline), install prompt after the first good session |

**Modes.** *Practice*: self-paced (count-up clock), the answer locks on tap and the key and explanation show at once.
*Exam*: like the real CBT. Nothing counts until Save & Next, there's no feedback until submit, and the countdown auto-submits.

**Marking schemes:** +1/−⅓ (APPSC default), +2/−0.66, +1/−0.25, no negative. Pick one per test.

## Exams

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
- Withdrawn questions stay in the topic files so old results can still be reviewed (with a note), but never appear in tests.
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
src/lib/scoring.ts  marking schemes + pure scoring
scripts/            content validation/audit, service-worker generator
```

Stored attempts keep only question ids, responses and a snapshot of the answer key, so a later fix to the bank doesn't rewrite past results.
