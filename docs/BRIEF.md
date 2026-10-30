# Team Civilians — Government-Exam CBT Practice Platform

A login-gated, installable (PWA) practice platform for **Andhra Pradesh government-exam (APPSC) aspirants**. This README is the build brief for Claude Code.

> **You (Claude Code) are invited to improve on this brief.** Treat it as direction, not dogma. Where you see a better library, pattern, data model, free service, or UX approach — especially anything that keeps setup free and raises content or UX quality — propose it with the trade-off *before* building.

---

## 1. Core goals (in priority order)

1. **Content quality is #1.** The platform is a vehicle for excellent, accurate, well-explained questions and mocks. Protect the integrity of question text, answer keys, and explanations above all.
2. **Completely free to set up and run.** ₹0 through launch and early users. No paid services, no card required.
3. **Feels like the real government CBT.** The mock-test experience must match the actual online exam.
4. **Advanced, professional UI.** Modern, animated, polished (glassmorphism), fast on phones.

---

## 2. Target exams (APPSC)

Build the data model multi-exam from day one; fill content in priority order.

| Priority | Exam | Notes |
|---|---|---|
| **Launch** | APPSC Group-2 | Deputy Tahsildar, Municipal Commissioner & allied |
| **Launch** | AEE – AP Pollution Control Board (PCB) | Seeded by the attached 1,193-question environment bank |
| **Launch** | AEE – Panchayat Raj & Tribal Welfare | Paper 2 shared with R&B/Irrigation; Paper 3 department-specific |
| Later | APPSC Group-1 | DC, Municipal Commissioner, DEO & allied |
| Later | AEE Civil – R&B / Irrigation | Shares Paper 2 with PR & Tribal |
| Later | ASWO / ATWO, Endowment EO Grade-III, Draughtsman Grade-II | |

**Key design point — shared papers:** several exams share papers (AEE Paper 2 is common to R&B, Irrigation and PR & Tribal; Paper 3 differs). Store content by **paper** and map papers to exams (many-to-many) so a shared paper is authored once and reused.

---

## 3. Content hierarchy & data

**Hierarchy:** `Exam ↔ Paper → Subject → Topic → Sub-topic → Question`

**Seed content (attached): `team-civilians-questions.json`**
- 1,193 cleaned previous-year questions, **text-first** (almost no images).
- 13 topics (chapters) of *Environment & Ecology*. This is the first Subject (seeds AEE PCB and GS environment).
- **Do NOT re-parse any PDF** — this JSON is already cleaned and verified. Use it directly.

**Schema** (each item in `questions[]`):
```json
{
  "id": 1,
  "topic": "Pollution",
  "question": "…",
  "options": ["…", "…", "…", "…"],
  "answerIndex": 2,
  "explanation": "…",
  "source": "UPPCS (Pre) 2013"
}
```
- `answerIndex` is 0-based into `options` (options may be 2–5 long).
- Topics present (with counts) are listed in the file's `meta`. Derive the topic list from the data.
- **Sub-topics are not yet tagged** — design the schema to support a `subtopic` field; tagging is a later content pass.

---

## 4. Build in phases

**▶ Build Phase 1 FIRST. Do not build the backend yet.**

### Phase 1 — Free MVP PWA (no backend, no login)
Everything runs client-side; each student's progress lives in their browser (`localStorage`). Deliver a polished, installable PWA.

Build one screen at a time, verifying each before moving on:
1. **Onboarding / Home** — pick target exam, optional name (local profile); continue-where-you-left-off; daily quiz; quick stats.
2. **Test catalog** — browse by Topic (and Sub-topic when available); mock tests; custom test builder. Cards show question count, best score, progress ring.
3. **CBT player** — the real-exam experience (see §6).
4. **Results + solution review** — score with negative marking, filterable review.
5. **Progress / analytics** — mastery map, weak-area guidance (see §7).
6. **Learn** — flashcards (question → answer → explanation); bookmarks; auto-collected wrong-answer revision set.
7. **PWA** — installable, offline, "Add to Home Screen" prompt after the first good session.

### Phase 2 — Accounts + control + monetization (later, still free)
- Managed free backend: **Supabase free** (or Appwrite — your call).
- **Login: Google / email** (free, no SMS cost).
- **Anti-sharing:** device lock (account bound to one device; switching allowed only every 15–30 days) + single active session. (Login method is NOT the lock — device binding is.)
- Content hierarchy + **admin panel** to upload questions/tests and mark users premium.
- **Monetization: manual UPI** — student pays to your UPI, sends screenshot, you approve in admin → premium unlock. No payment gateway/KYC yet.

### Phase 3 — Scale & automate (much later)
Payment gateway (auto-unlock), more exams/subjects, richer analytics, optional native Android wrapper.

---

## 5. Tech stack (all free)

| Layer | Choice |
|---|---|
| Frontend / PWA | **Next.js + React** (App Router) |
| Styling / animation | **Tailwind CSS + Framer Motion** |
| Charts | Recharts (mastery radar, trend lines) |
| Phase 2 backend/auth | Supabase free (or Appwrite) + Google/email login |
| Code repo | GitHub: **`github.com/Vivekmalli2002`** (repo e.g. `team-civilians`, private) |
| Hosting | **Vercel** → `team-civilians.vercel.app` (free). Custom domain optional later. |

Keep everything within free tiers. Content is text-first, so data/bandwidth stay tiny.

---

## 6. The mock-test framework (must feel like the real CBT)

Match the real government online exam:
- **Question palette** grid with status colours: answered / not-answered / not-visited / marked-for-review / answered-&-marked.
- **Dual timers:** per-question timer **and** an overall clock, with **pause / resume / reset**.
- **Negative marking** — configurable schemes (e.g. +2 / −0.66, +1 / −0.25, no-negative).
- **Mark for review**, **Save & Next**, **Clear response**, jump-to-any-question.
- **Two modes:** *Practice* (instant correct/wrong + explanation on each tap) and *Exam* (no feedback until submit, then full solution review).
- **Test types:** topic-wise, sub-topic-wise, topic mock, sub-topic mock, full mock (e.g. 50 Q / 50 min), daily quiz (fixed per day), and custom.

A working single-file prototype of this CBT engine already exists and can be reused as a reference for behaviour and scoring — ask the user for it if helpful.

---

## 7. Results feedback & weak-area guidance (the coaching layer)

After every test: net score (with negative marking), accuracy, attempted/skipped, time taken, full solution review (filter by correct/wrong/unattempted/bookmarked).

Aggregate across all attempts to answer *"what should I study next?"*:
- **Topic mastery map** — accuracy per topic/sub-topic (radar/bar chart).
- **Weak-area recommendations** — 3 lowest-accuracy areas, each with a one-tap "Practise this".
- **Trends** — score/accuracy over recent tests.
- **Time management** — avg time per question vs the limit.
- **Streaks** — days practised in a row.

(In Phase 2, the deep diagnostic becomes a premium feature.)

---

## 8. UI / UX direction

- **Feel:** fast, calm, mobile-first, visibly professional. Two taps to any test; never a frozen screen (skeleton loaders).
- **Visual style:** modern **glassmorphism** — frosted translucent cards, soft depth/blur, subtle gradients, rounded corners; one confident primary colour + a clear right/wrong palette.
- **Motion:** smooth page transitions, card entrances, animated score count-up, progress rings, subtle confetti on a personal best. Always honour `prefers-reduced-motion`.
- **Type:** a characterful display font for headings + a highly legible body font (ready for Indian languages later).
- **Dark & light modes** from day one. Large thumb-reachable tap targets. Fully responsive. Works offline.

---

## 9. First steps for Claude Code

1. Scaffold a Next.js + Tailwind + Framer Motion PWA; set up the repo for GitHub + Vercel.
2. Load `team-civilians-questions.json` as the Phase 1 content source.
3. Build Phase 1 screens in the order in §4, verifying each.
4. Where you'd improve on this brief, say so first with the trade-off.

**Do not** add a backend, login, or payments in Phase 1 — those are Phase 2.
