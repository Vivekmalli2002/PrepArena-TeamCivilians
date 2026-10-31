"""Raw parse (shyam_parse.py) -> data/questions/shyam-g2-<subject>.json (live; answer = underlined option).
Questions with no underline / no 4 options have no usable key and go to data/review/shyam-unkeyed.json.
    python3 -I scripts/extract/build_shyam.py <raw.json>"""
import json, re, sys, collections
raw = json.load(open(sys.argv[1]))
MAP = {
    "SOCIAL AND CULTURAL HISTORY OF ANDHRA PRADESH": ("history", "AP social & cultural history"),
    "INDIAN HISTORY": ("history", "Indian history"),
    "INDIAN ECONOMY": ("economy", "Indian economy"),
    "INDIAN POLITY": ("polity", "Indian polity & constitution"),
    "SCIENCE AND TECHNOLOGY": ("scitech", "Science & technology"),
    "GEOGRAPHY": ("geography", "Geography"),
    "SOCIOLOGY": ("society", "Sociology & Indian society"),
    "CURRENT AFFAIRS": ("current", "Current affairs"),
    "MENTAL ABILITY": ("mental", "Mental ability & reasoning"),
}
out, unkeyed = collections.defaultdict(list), []
seen_keys, dupes = set(), 0
clean = lambda s: re.sub(r"\s+\n", "\n", re.sub(r"[ \t]+", " ", s)).strip()
for r in raw:
    subj, topic = MAP[r["title"]]
    opts = [clean(o) for o in r["options"]]
    base = {"id": f"SHY-G2-T{r['test']:02d}-{r['n']:03d}", "exam": ["group2"], "subject": subj, "topic": topic,
            "subtopic": f"Model Test {r['test']:02d}", "question": clean(r["question"]),
            "source": f"Shyam Institute Group-2 Model Test {r['test']:02d} · Q{r['n']}", "sourcePage": r["page"] + 1}
    key = re.sub(r"\W+", "", base["question"].lower()) + "|" + "|".join(re.sub(r"\W+", "", o.lower()) for o in opts)
    if key in seen_keys:
        dupes += 1
        continue
    if len(opts) != 4 or not all(opts) or len(set(opts)) != 4 or r["answer"] is None or len(base["question"]) < 11:
        unkeyed.append(dict(base, options=opts, flags=r["flags"] or ["bad-shape"], answerIndex=None))
        continue
    seen_keys.add(key)
    out[subj].append(dict(base, options=opts, answerIndex=r["answer"], explanation="", keyCheck="underlined-answer"))
for subj, qs in out.items():
    json.dump(qs, open(f"data/questions/shyam-g2-{subj}.json", "w"), ensure_ascii=False, indent=1)
json.dump(unkeyed, open("data/review/shyam-unkeyed.json", "w"), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in out.items()}, "published", sum(map(len, out.values())), "unkeyed/bad-shape", len(unkeyed), "repeat papers dropped", dupes)
fig = [q for qs in out.values() for q in qs if re.search(r"\b(figure|diagram|pattern below|following figures|dice|mirror|venn)\b", q["question"], re.I)]
print("figure-like published:", len(fig))
