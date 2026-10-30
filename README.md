# Team Civilians — APPSC CBT practice (Phase 1)

An installable, offline-first practice PWA for Andhra Pradesh government-exam (APPSC) aspirants.
Phase 1 is fully client-side: no backend, no login. Each student's progress lives in their browser.
The original build brief is in [`docs/BRIEF.md`](docs/BRIEF.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 (validates content first)
npm test           # scoring, CBT session rules, formatting (runs over the whole bank)
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
| Learn | `/learn` | Flashcards (question → answer → explanation), saved questions, auto-collected wrong-answer revision set |
| PWA | — | Manifest + icons, precaching service worker (works offline), install prompt after the first good session |

**Modes.** *Practice*: self-paced (count-up clock), the answer locks on tap and the key and explanation show at once.
*Exam*: like the real CBT. Nothing counts until Save & Next, there's no feedback until submit, and the countdown auto-submits.

**Marking schemes:** +1/−⅓ (APPSC default), +2/−0.66, +1/−0.25, no negative. Pick one per test.

## Content

- Source of truth: `content/team-civilians-questions.json` (1,193 questions, used verbatim, never re-parsed).
- `scripts/prepare-content.mjs` validates the schema at build time (an out-of-range key or missing field fails the build) and publishes the bank to `public/data/questions.json`.
- `docs/content-audit.md` lists quality issues for an editor. **The app does not change any question text.**
- Exam ↔ paper → subject mapping: `src/content/catalog.ts`. Papers are shared many-to-many (e.g. the GS paper, AEE Paper 2). Topics and sub-topics come from the data, and `subtopic` is supported as soon as questions carry it.
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
