// Validates the question bank, applies content/corrections.json, removes exact duplicates and
// publishes it to public/data as a small index plus one file per topic.
// Hard schema errors fail the build. `--audit` also writes docs/content-audit.md.
// The source file is never modified; every change is driven by corrections.json and reported.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "content/team-civilians-questions.json");
const FIX = join(root, "content/corrections.json");
const OUT = join(root, "public/data");
const AUTHORED = join(root, "content/authored");
const SUBJECT = { id: "env", name: "Environmental Science & Ecology" };
// Keep in sync with ENV_TOPIC_UNITS in src/content/catalog.ts (syllabus unit per topic).
const UNITS = {
  "Ecology & Ecosystem": 1,
  "Biodiversity & Conservation": 2,
  "Sanctuary / Biosphere Reserve": 2,
  Forest: 2,
  "Non-conventional Energy Sources": 3,
  Pollution: 4,
  "Climate Change & Green House Gases": 6,
  "Ozone Layer": 6,
  "Environment Legislation & Conventions": 7,
  "Environment Conservation": 8,
  "Sustainable Development": 8,
};

const rawText = readFileSync(SRC, "utf8");
const fixText = readFileSync(FIX, "utf8");
const bank = JSON.parse(rawText);
const fixes = JSON.parse(fixText);
const raw = bank.questions;

/* ---------------- 1. schema validation (fails the build) ---------------- */
function validate(qs, label) {
  const errors = [];
  const ids = new Set();
  for (const q of qs) {
    const where = `${label} id ${q.id}`;
    if (!Number.isInteger(q.id)) errors.push(`${where}: id must be an integer`);
    if (ids.has(q.id)) errors.push(`${where}: duplicate id`);
    ids.add(q.id);
    for (const k of ["topic", "question", "explanation", "source"]) {
      if (typeof q[k] !== "string") errors.push(`${where}: ${k} must be a string`);
    }
    if (!q.question?.trim()) errors.push(`${where}: empty question`);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5) {
      errors.push(`${where}: options must have 2–5 entries`);
    } else if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
      errors.push(`${where}: answerIndex ${q.answerIndex} out of range`);
    }
    if (q.subtopic != null && typeof q.subtopic !== "string") errors.push(`${where}: subtopic must be a string`);
  }
  if (errors.length) {
    console.error(`Content validation failed (${errors.length}):\n` + errors.join("\n"));
    process.exit(1);
  }
}
validate(raw, "source");
for (const id of Object.keys(fixes.quarantine)) {
  if (!raw.some((q) => q.id === Number(id))) {
    console.error(`corrections.json: quarantined id ${id} does not exist`);
    process.exit(1);
  }
}

/* ---------------- 2. corrections ---------------- */
const strips = fixes.stripPatterns.map((p) => ({ re: new RegExp(p.pattern, "g"), why: p.why }));
const dropRe = new RegExp(fixes.dropOptionsMatching.pattern, "i");
const log = { stripped: [], droppedOption: [], renamedTopic: [] };

const clean = (s) => {
  let out = s;
  for (const { re } of strips) out = out.replace(re, "");
  return out.replace(/\s{2,}/g, " ").trim();
};

const corrected = raw.map((q) => {
  const c = { ...q, options: [...q.options] };
  const before = JSON.stringify([q.question, q.options, q.explanation, q.source]);
  c.question = clean(c.question);
  c.options = c.options.map(clean);
  c.explanation = clean(c.explanation);
  c.source = clean(c.source).replace(/^\|\s*|\s*\|$/g, "").trim();
  if (JSON.stringify([c.question, c.options, c.explanation, c.source]) !== before) log.stripped.push(q.id);

  // Drop "Question not attempted" — only when it is not the keyed answer, re-indexing the key.
  const drop = c.options.map((o, i) => (dropRe.test(o) && i !== c.answerIndex ? i : -1)).filter((i) => i >= 0);
  if (drop.length) {
    c.answerIndex -= drop.filter((i) => i < c.answerIndex).length;
    c.options = c.options.filter((_, i) => !drop.includes(i));
    log.droppedOption.push(q.id);
  }

  const alias = fixes.topicAliases[c.topic];
  if (alias) {
    c.topic = alias;
    log.renamedTopic.push(q.id);
  }
  return c;
});
// Editorial overrides: a reviewed rewrite of a broken question (stem, options and/or key).
const overrides = fixes.overrides ?? {};
for (const [id, o] of Object.entries(overrides)) {
  const c = corrected.find((q) => q.id === Number(id));
  if (!c) {
    console.error(`corrections.json: override for unknown id ${id}`);
    process.exit(1);
  }
  if (fixes.quarantine[id]) {
    console.error(`corrections.json: id ${id} is both overridden and quarantined — remove it from quarantine`);
    process.exit(1);
  }
  for (const k of ["question", "options", "answerIndex", "explanation", "topic", "source"]) if (o[k] !== undefined) c[k] = o[k];
  c.revised = o.why;
}
validate(corrected, "corrected");
// The keyed answer text must survive automatic corrections unchanged (overrides are reviewed rewrites).
for (let i = 0; i < raw.length; i++) {
  if (overrides[raw[i].id]) continue;
  if (clean(raw[i].options[raw[i].answerIndex]) !== corrected[i].options[corrected[i].answerIndex]) {
    console.error(`Correction changed the keyed answer of id ${raw[i].id}`);
    process.exit(1);
  }
}

/* ---------------- 3. exact duplicates ---------------- */
const normQ = (s) => s.toLowerCase().replace(/\W/g, "");
// Options keep separators so "II I III IV" ≠ "I II III IV".
const normO = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim();
const dupKey = (q) => normQ(q.question) + "|" + q.options.map(normO).join("|");
const groups = new Map();
for (const q of corrected) groups.set(dupKey(q), [...(groups.get(dupKey(q)) ?? []), q]);
const quarantine = Object.fromEntries(Object.entries(fixes.quarantine).map(([k, v]) => [Number(k), v]));
const duplicateOf = {};
const conflicts = [];
for (const g of groups.values()) {
  if (g.length < 2) continue;
  const keys = new Set(g.map((q) => q.answerIndex));
  if (keys.size > 1) {
    conflicts.push(g.map((q) => q.id));
    continue;
  }
  const keep = g.filter((q) => !quarantine[q.id]).sort((a, b) => a.id - b.id)[0];
  for (const q of g) if (keep && q.id !== keep.id && !quarantine[q.id]) duplicateOf[q.id] = keep.id;
}
const unhandled = conflicts.filter((g) => g.some((id) => !quarantine[id]));
if (unhandled.length) {
  console.error("Duplicates with conflicting keys must be quarantined in corrections.json:", unhandled);
  process.exit(1);
}

/* ---------------- 4. publish: index + one file per topic ---------------- */
/* ---------------- 4a. authored subjects (content/authored/*.json) ---------------- */
// Original questions written for subjects the source bank does not cover. Same schema, plus
// a per-file subject and an optional per-question `unit` (syllabus unit number in catalog.ts).
const authoredFiles = existsSync(AUTHORED) ? readdirSync(AUTHORED).filter((f) => f.endsWith(".json")).sort() : [];
const authoredText = authoredFiles.map((f) => readFileSync(join(AUTHORED, f), "utf8"));
const subjects = new Map([[SUBJECT.id, { ...SUBJECT }]]);
const subjectOf = new Map(corrected.map((q) => [q.id, SUBJECT.id]));
const unitOf = new Map(corrected.map((q) => [q.id, UNITS[q.topic] ?? null]));
const authored = [];
authoredFiles.forEach((f, i) => {
  const file = JSON.parse(authoredText[i]);
  if (!file.subject?.id || !file.subject?.name || !Array.isArray(file.questions)) {
    console.error(`${f}: needs { subject: { id, name }, questions: [...] }`);
    process.exit(1);
  }
  validate(file.questions, f);
  subjects.set(file.subject.id, file.subject);
  for (const q of file.questions) {
    if (subjectOf.has(q.id)) {
      console.error(`${f}: id ${q.id} already used`);
      process.exit(1);
    }
    subjectOf.set(q.id, file.subject.id);
    unitOf.set(q.id, Number.isInteger(q.unit) ? q.unit : null);
    const { unit, ...rest } = q; // eslint-disable-line no-unused-vars
    authored.push(rest);
  }
});
/* ---------------- 4a-2. structured banks (data/questions/*.json) ---------------- */
// Questions structured from the source books (see STRUCTURING_SPEC). Ids are strings in the files; they get
// stable integer ids from data/questions/_ids.json (append-only). Items whose answer key could not be confirmed
// (see `keyCheck`) are published as "withdrawn" — kept for review, never shown in tests.
const DATA = join(root, "data/questions");
const FILE_SUBJECT = { "air-pollution": "env", "water-pollution": "env", "eia-legislation": "env", energy: "env", "indian-economy": "economy", "original-economy": "economy", "original-history": "history", "original-geography": "geography", "original-polity": "polity", "original-scitech": "scitech", "original-mental": "mental", "gate-es-ga": "mental", "gate-es-tech": "env", "civil-vol1": "civil-other", "mech-materials": "mech-mat", "engineering-drawing": "drawing-survey", "mech-thermo": "mech-thermo", "civil-vol2": "civil-other", "gs-indian-economy": "economy", "gs-ancient-medieval": "history", "gs-modern-india": "history", "gs-science-tech": "scitech", "gs-geography": "geography", "gs-environment": "env", "gs-civil-pyq": "civil-other", "eco200": "env", "aeeset": "env", "tspsc-g1-current": "current", "tspsc-g1-science": "scitech", "tspsc-g1-env": "env", "tspsc-g1-policies": "polity", "tspsc-g1-society": "society", "tspsc-g1-reasoning": "mental", "shyam-g2-history": "history", "shyam-g2-geography": "geography", "shyam-g2-society": "society", "shyam-g2-current": "current", "shyam-g2-mental": "mental", "shyam-g2-polity": "polity", "shyam-g2-economy": "economy", "shyam-g2-scitech": "scitech", "civil-vol1-unverified": "civil-other", "civil-vol2-unverified": "civil-other", "gs-ancient-medieval-unverified": "history", "gs-civil-pyq-unverified": "civil-other", "gs-environment-unverified": "env", "gs-geography-unverified": "geography", "gs-indian-economy-unverified": "economy", "gs-modern-india-unverified": "history", "gs-science-tech-unverified": "scitech" };
const TOPIC_UNIT = {
  "Photochemical smog": 4, "Plume dispersion & meteorology": 4, "Particulate & gaseous control devices": 4, "Noise pollution": 4,
  "Air quality standards & pollutant types": 4, "Air pollution calculations": 4, "Atmospheric chemistry & ozone": 6, "Greenhouse gases & climate": 6,
  "Water treatment: coagulation & disinfection": 4, "BOD, COD & oxygen demand": 4, "Wastewater treatment": 4, "Water chemistry": 4,
  "Nutrients & eutrophication": 4, "Membrane processes": 4, "Anaerobic digestion & bioreactors": 5, "Contaminants & standards": 4,
  "EIA process & clearance": 8, "International conventions & protocols": 7, "Indian environmental legislation": 7,
  "Environmental policy, principles & institutions": 7, "Environmental management tools & LCA": 8,
  "GATE ES: Air pollution": 4, "GATE ES: Wastewater engineering": 4, "GATE ES: Water treatment": 4, "GATE ES: Solid waste management": 5, "GATE ES: Sustainable development & LCA": 8, "GATE ES: Environmental chemistry": 4, "GATE ES: Noise pollution": 4, "GATE ES: Nitrogen cycle & microbiology": 1, "GATE ES: Microbiology & biochemistry": 1,
  "Hydropower & renewable energy": 3, "Coal & coalification": 3, "Petroleum & natural gas": 3, "Nuclear energy & radiation": 3, Biofuels: 3, "Energy statistics (India)": 3,
};
subjects.set("civil-em", { id: "civil-em", name: "Engineering Mechanics" });
subjects.set("civil-som", { id: "civil-som", name: "Strength of Materials" });
subjects.set("civil-fm", { id: "civil-fm", name: "Fluid Mechanics" });
subjects.set("civil-hm", { id: "civil-hm", name: "Hydraulic Machines" });
subjects.set("civil-bm", { id: "civil-bm", name: "Building Materials" });
subjects.set("civil-sa", { id: "civil-sa", name: "Structural Analysis" });
subjects.set("civil-rcc", { id: "civil-rcc", name: "Reinforced Cement Concrete" });
subjects.set("civil-ss", { id: "civil-ss", name: "Design of Steel Structures" });
subjects.set("civil-cpm", { id: "civil-cpm", name: "Construction Planning & Management" });
subjects.set("civil-geo", { id: "civil-geo", name: "Geotechnical Engineering" });
subjects.set("civil-ee", { id: "civil-ee", name: "Environmental Engineering" });
subjects.set("civil-hyd", { id: "civil-hyd", name: "Hydrology" });
subjects.set("civil-irr", { id: "civil-irr", name: "Irrigation" });
subjects.set("civil-sur", { id: "civil-sur", name: "Surveying" });
subjects.set("civil-tra", { id: "civil-tra", name: "Transportation Engineering" });
subjects.set("civil-gel", { id: "civil-gel", name: "Geology" });
subjects.set("civil-est", { id: "civil-est", name: "Estimation, Costing & Valuation" });
subjects.set("drawing-survey", { id: "drawing-survey", name: "Engineering Drawing" });
subjects.set("mech-mat", { id: "mech-mat", name: "Engineering Materials" });
subjects.set("mech-thermo", { id: "mech-thermo", name: "Process Calculations & Thermodynamics" });
subjects.set("civil-other", { id: "civil-other", name: "Other Civil & General (not in chapter list)" });
subjects.set("current", { id: "current", name: "Current Affairs" });
const HOLD = new Set(["source-only", "conflict-trusted-explanation", "key-overridden-by-science", "time-sensitive", "source-key-as-printed"]);
const idsFile = join(DATA, "_ids.json");
const idMap = existsSync(idsFile) ? JSON.parse(readFileSync(idsFile, "utf8")) : {};
let nextId = Math.max(100000, ...Object.values(idMap)) + 1;
const structured = [];
const structuredText = [];
const qKey = (q) => normQ(q.question) + "|" + q.options.map(normO).join("|");
const knownQ = new Set([...corrected, ...authored].map(qKey));
let structuredHeld = 0;
let structuredDup = 0;
if (existsSync(DATA)) {
  for (const f of readdirSync(DATA).filter((f) => f.endsWith(".json") && !f.endsWith(".dropped.json") && !f.startsWith("_")).sort()) {
    const slugName = f.replace(/\.json$/, "");
    const subj = FILE_SUBJECT[slugName];
    if (!subj) {
      console.error(`data/questions/${f}: add it to FILE_SUBJECT in scripts/prepare-content.mjs`);
      process.exit(1);
    }
    const text = readFileSync(join(DATA, f), "utf8");
    structuredText.push(text);
    for (const d of JSON.parse(text)) {
      if (!idMap[d.id]) idMap[d.id] = nextId++;
      const q = {
        id: idMap[d.id], topic: d.topic, question: d.question, options: d.options, answerIndex: d.answerIndex,
        explanation: d.explanation ?? "", source: d.source,
      };
      if (d.subtopic) q.subtopic = d.subtopic;
      if (d.explanationImage?.length) q.explanationImage = d.explanationImage.map((x) => `/qimg/${slugName}/${x}`);
      if (d.keyCheck === "unverified-extract") q.unverified = true;
      if (d.image) q.image = `/qimg/${slugName}/${d.image}`;
      if (d.flag && /^(resolved|stem-corrected|supported|solution)/.test(d.keyCheck ?? "")) q.revised = d.flag;
      structured.push(q);
      subjectOf.set(q.id, d.subjectId ?? subj);
      unitOf.set(q.id, Number.isInteger(d.unit) ? d.unit : (TOPIC_UNIT[q.topic] ?? null));
      if (HOLD.has(d.keyCheck)) {
        quarantine[q.id] = `Answer key not confirmed (${d.keyCheck}): ${d.flag ?? ""}`.trim();
        structuredHeld++;
      } else if (knownQ.has(qKey(q))) {
        duplicateOf[q.id] = [...corrected, ...authored, ...structured].find((x) => qKey(x) === qKey(q)).id;
        structuredDup++;
      }
      knownQ.add(qKey(q));
    }
  }
  validate(structured, "data/questions");
  writeFileSync(idsFile, JSON.stringify(idMap, null, 1) + "\n");
}
const all = [...corrected, ...authored, ...structured];

const version = createHash("sha256").update(rawText).update(fixText).update(authoredText.join("")).update(structuredText.join("")).digest("hex").slice(0, 12);
const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const byTopic = new Map();
for (const q of all) {
  const k = `${subjectOf.get(q.id)}\u0000${q.topic}`;
  byTopic.set(k, [...(byTopic.get(k) ?? []), q]);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "q"), { recursive: true });
const topics = [];
for (const [key, qs] of [...byTopic].sort((a, b) => b[1].length - a[1].length)) {
  const [subject, name] = key.split("\u0000");
  const out = qs.map((q) => {
    if (quarantine[q.id]) return { ...q, status: "withdrawn", note: quarantine[q.id] };
    if (duplicateOf[q.id]) return { ...q, status: "duplicate", note: `Same as #${duplicateOf[q.id]}` };
    return q;
  });
  const body = JSON.stringify(out);
  const file = `q/${subject}/${slug(name)}.${createHash("sha256").update(body).digest("hex").slice(0, 10)}.json`;
  mkdirSync(join(OUT, "q", subject), { recursive: true });
  writeFileSync(join(OUT, file), body);
  topics.push({
    name,
    subject,
    unit: unitOf.get(qs[0].id) ?? null,
    file,
    qids: out.filter((q) => !q.status).map((q) => q.id),
    all: out.map((q) => q.id),
    subtopics: [...new Set(out.filter((q) => !q.status && q.subtopic).map((q) => q.subtopic))].map((s) => ({
      name: s,
      qids: out.filter((q) => !q.status && q.subtopic === s).map((q) => q.id),
    })),
  });
}
// Chapters follow the syllabus order inside each subject (unit = chapter number); other topics keep size order.
const subjectRank = new Map([...new Set(topics.map((t) => t.subject))].map((id, i) => [id, i]));
topics.sort((a, b) => subjectRank.get(a.subject) - subjectRank.get(b.subject) || (a.unit ?? 1e6) - (b.unit ?? 1e6));
const active = topics.reduce((n, t) => n + t.qids.length, 0);
const subjectList = [...subjects.values()].map((s) => ({
  ...s,
  total: topics.filter((t) => t.subject === s.id).reduce((n, t) => n + t.qids.length, 0),
}));
writeFileSync(join(OUT, "index.json"), JSON.stringify({ version, subjects: subjectList, meta: bank.meta, total: active, topics }));
console.log(
  `content v${version}: ${raw.length} questions → ${active} active in ${topics.length} topics ` +
    `(${Object.keys(quarantine).length} withdrawn, ${Object.keys(duplicateOf).length} duplicates hidden; ` +
    `${log.stripped.length} cleaned, ${log.droppedOption.length} option-E removed, ${log.renamedTopic.length} re-topiced, ` +
    `${Object.keys(overrides).length} revised; ${authored.length} authored in ${authoredFiles.length} subject files; ${structured.length} structured, ${structuredHeld} held for key review, ${structuredDup} duplicates)`,
);

if (process.argv.includes("--audit")) writeAudit();

/* ---------------- 5. audit report ---------------- */
function writeAudit() {
  const pipe = (s) => s.replace(/\|/g, "/");
  const truncated = (qs) =>
    qs.filter(
      (q) =>
        /^[a-z:]/.test(q.question.trim()) ||
        (/(^|\s)2\.\s/.test(q.question) && /(^|\s)3\.\s/.test(q.question) && !/(^|\s)1\.\s?\S/.test(q.question)),
    );
  const dupOptions = (qs) => qs.filter((q) => new Set(q.options.map(normO)).size < q.options.length);
  const merged = (qs) => qs.filter((q) => q.options.some((o) => /\s[a-e]\)\s\S/.test(o)));
  const short = (qs) => qs.filter((q) => q.options.length < 4);
  const watermark = (qs) => qs.filter((q) => /\bYCT\b|TCPDF/.test([q.question, ...q.options, q.explanation, q.source].join(" ")));
  const noYear = (qs) => qs.filter((q) => !/\d{4}/.test(q.source));
  const notAttempted = (qs) => qs.filter((q) => q.options.some((o) => dropRe.test(o)));
  const live = corrected.filter((q) => !quarantine[q.id] && !duplicateOf[q.id]);
  const dupCount = [...groups.values()].filter((g) => g.length > 1).length;

  const row = (label, a, b) => `| ${label} | ${a} | ${b} |`;
  const lines = [
    "# Content audit",
    "",
    `Generated by \`npm run content:audit\` (content v${version}). Source: \`content/team-civilians-questions.json\` (never modified).`,
    "Corrections come from `content/corrections.json` and are applied at build time.",
    "",
    `**${raw.length}** source questions → **${active}** live in tests · **${Object.keys(quarantine).length}** withdrawn for editing · **${Object.keys(duplicateOf).length}** exact duplicates hidden.`,
    "",
    "## Before → after",
    "",
    "| Check | Source | Live in tests |",
    "|---|---|---|",
    row("Publisher watermark (\"YCT\") / PDF footer", watermark(raw).length, watermark(live).length),
    row("Duplicate groups (same question **and** options)", dupCount, 0),
    row("…of which the answer keys disagree", conflicts.length, 0),
    row("Stem looks truncated", truncated(raw).length, truncated(live).length),
    row("Two identical options", dupOptions(raw).length, dupOptions(live).length),
    row("Options merged together", merged(raw).length, merged(live).length),
    row("\"Question not attempted\" option", notAttempted(raw).length, notAttempted(live).length),
    row("Fewer than 4 options", short(raw).length, short(live).length),
    row("Source with no year", noYear(raw).length, noYear(live).length),
    "",
    "## Automatic corrections",
    "",
    `- **Watermarks stripped** from ${log.stripped.length} questions: ${strips.map((s) => s.why).join("; ")}.`,
    `- **Option E \"Question not attempted\" removed** from ${log.droppedOption.length}: ${log.droppedOption.join(", ")} (never the keyed answer).`,
    `- **Topic merged** for ${log.renamedTopic.length}: ${Object.entries(fixes.topicAliases).map(([a, b]) => `\`${a}\` → \`${b}\``).join(", ")}.`,
    "- The build fails if any correction would change a keyed answer.",
    "",
    "## Original questions (content/authored/) — awaiting editor sign-off",
    "",
    "Written for subjects the source bank does not cover; keys are generated from answer text and numericals are computed by the scripts in scripts/authoring/.",
    "",
    "| Subject | Questions |",
    "|---|---|",
    ...[...subjects.values()].map((sj) => `| ${sj.name} | ${authored.filter((q) => subjectOf.get(q.id) === sj.id).length} |`).filter((r) => !r.endsWith("| 0 |")),
    "",
    "## Revised by the editor (`overrides`)",
    "",
    "| id | change |",
    "|---|---|",
    ...Object.entries(overrides).map(([id, o]) => `| ${id} | ${pipe(o.why)} |`),
    "",
    "## Withdrawn for editing (excluded from tests and flashcards)",
    "",
    "Remove an id from `quarantine` in `content/corrections.json` once the source is fixed.",
    "",
    "| id | reason |",
    "|---|---|",
    ...Object.entries(quarantine).map(([id, why]) => `| ${id} | ${pipe(why)} |`),
    "",
    "## Hidden duplicates (the lowest id is kept)",
    "",
    Object.entries(duplicateOf).map(([id, keep]) => `${id} → ${keep}`).join(", ") || "—",
    "",
    "## Still live — worth a look",
    "",
    "Answerable but imperfect, so they stay in tests:",
    "",
    "| id | issue |",
    "|---|---|",
    ...dupOptions(live).map((q) => `| ${q.id} | Two identical options (neither is the key): ${q.options.map(pipe).join(" · ")} |`),
    ...short(live).map((q) => `| ${q.id} | Only ${q.options.length} options: ${q.options.map(pipe).join(" · ")} |`),
    ...truncated(live).map((q) => `| ${q.id} | Possibly truncated: ${pipe(q.question.slice(0, 60))}… |`),
    ...noYear(live).map((q) => `| ${q.id} | Source looks mis-parsed: ${pipe(q.source)} |`),
    "",
  ];
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "docs/content-audit.md"), lines.join("\n"));
  console.log("audit → docs/content-audit.md");
}
