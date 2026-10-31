"""Builds data/questions/original-<subject>.json from scripts/authoring/originals/<subject>.py.
Run: python3 scripts/authoring/build_originals.py   (from the repo root)

Each item is (topic, stem, correct answer text, [3 wrong answers], explanation). The key is the answer TEXT, so it cannot
drift when options are shuffled; option order is shuffled deterministically per question. Duplicate stems are dropped.
"""
import hashlib, importlib.util, json, pathlib, random, sys

root = pathlib.Path(__file__).resolve().parents[2]
here = pathlib.Path(__file__).resolve().parent / "originals"
EXAMS = ["group2", "group1"]
seen = set()
for f in sorted(here.glob("*.py")):
    spec = importlib.util.spec_from_file_location(f.stem, f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    out = []
    for topic, stem, correct, wrongs, expl in m.ITEMS:
        key = " ".join(stem.lower().split())
        if key in seen:
            continue
        seen.add(key)
        opts = [correct, *wrongs]
        assert len(set(opts)) == 4, (stem, opts)
        random.Random(int(hashlib.sha256(stem.encode()).hexdigest()[:8], 16)).shuffle(opts)
        out.append({
            "id": f"ORG-{m.SUBJECT[:3].upper()}-{len(out) + 1:03d}", "exam": EXAMS, "subject": m.SUBJECT, "topic": topic,
            "question": stem, "options": opts, "answerIndex": opts.index(correct), "explanation": expl,
            "source": "Team Civilians original", "sourcePage": 0, "sourceKey": "ABCD"[opts.index(correct)], "keyCheck": "original",
        })
    (root / "data/questions" / f"original-{f.stem}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf8")
    print(f.stem, len(out))
