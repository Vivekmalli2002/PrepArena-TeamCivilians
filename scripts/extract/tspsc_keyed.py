"""TSPSC Group-I Prelims PYQ book (subject-wise sections: questions first, then 'Q. No / Option' key tables).
    python3 -I scripts/extract/tspsc_keyed.py <pdftxt page text> <out.json>
Questions are numbered 1..N within each subject section; the key table that follows applies to them. 'NA' keys
(questions the commission dropped) are skipped. Items are written with their section heading; mapping to app subjects is done by build_tspsc().
"""
import json, re, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import civil_columns as C

KEYROW = re.compile(r"\b(\d{1,3})\s+([A-D]|NA)\b")

def is_key_page(p):
    return "Q. No" in p and "Option" in p

def parse_keys(p):
    keys = {}
    for n, k in KEYROW.findall(p):
        keys.setdefault(int(n), k)
    return keys

def subject_of(p):
    m = re.search(r"Subject:\s*([^\n]+)", p)
    return re.sub(r"\s+", " ", m.group(1)).strip() if m else ""

def split_questions(text, keys, page0):
    lines = [l for l in text.split("\n") if l.strip()]
    blocks, cur, expect = [], None, 1
    for l in lines:
        m = C.STARTQ.match(l)
        if m and expect <= int(m.group(1)) <= expect + 3 and (cur is None or re.search(r"\(\s*d\s*\)", "\n".join(cur["lines"]))):
            if cur: blocks.append(cur)
            n = int(m.group(1))
            cur = {"n": n, "lines": [l[m.end():]]}
            expect = n + 1
        elif cur is not None:
            cur["lines"].append(l)
    if cur: blocks.append(cur)
    out = []
    for b in blocks:
        body = C.WM.sub(" ", "\n".join(b["lines"]))
        pos = [(x.start(), x.group(1)) for x in C.OPT.finditer(body)]
        seq, want = [], "a"
        for p_, ch in pos:
            if ch == want:
                seq.append(p_); want = chr(ord(want) + 1)
        if len(seq) < 4:
            out.append({"n": b["n"], "q": C.clean(body), "opts": [], "flag": "options"}); continue
        stem = C.clean(body[: seq[0]])
        opts = [C.clean(C.OPT.sub("", body[seq[i]: seq[i + 1] if i < 3 else len(body)], count=1)) for i in range(4)]
        out.append({"n": b["n"], "q": stem, "opts": opts, "flag": None})
    return out

def main(path, out):
    t = open(path, encoding="utf8").read()
    parts = re.split(r"===== PAGE (\d+) =====\n", t)
    pages = [(int(parts[i]), parts[i + 1]) for i in range(1, len(parts), 2)]
    items, buf, buf_pages, i = [], [], [], 0
    sections = 0
    while i < len(pages):
        pn, p = pages[i]
        if is_key_page(p):
            keys, subj = {}, ""
            j = i
            while j < len(pages) and is_key_page(pages[j][1]):
                kk = parse_keys(pages[j][1])
                for n, k in kk.items(): keys.setdefault(n, k)
                subj = subj or subject_of(pages[j][1])
                j += 1
            qs = split_questions("\n".join(buf), keys, buf_pages[0] if buf_pages else pn)
            sections += 1
            for q in qs:
                k = keys.get(q["n"])
                items.append({"section": sections, "subject": subj, "n": q["n"], "question": q["q"], "options": q["opts"], "key": k, "flag": q["flag"],
                              "page": buf_pages[0] if buf_pages else pn})
            buf, buf_pages, i = [], [], j
            continue
        buf.append(p); buf_pages.append(pn); i += 1
    json.dump({"items": items, "sections": sections}, open(out, "w"), ensure_ascii=False)
    ok = [x for x in items if x["key"] in list("ABCD") and not x["flag"] and len(x["options"]) == 4]
    print(len(items), "blocks;", len(ok), "usable;", sections, "sections")

ALIGNED = {  # sections whose question blocks match their key table (block count >= 95% of the keyed numbers)
    1: ("tspsc-g1-current", "Current Affairs", "Current affairs & general studies"),
    2: ("tspsc-g1-science", "Science & Technology", "General science: biology"),
    5: ("tspsc-g1-env", "Environmental Science & Ecology", "Environmental issues & disaster management"),
    10: ("tspsc-g1-policies", "Indian Constitution, Polity & Welfare", "Government policies & schemes"),
    12: ("tspsc-g1-society", "Indian Society", "Society in India & social issues"),
    13: ("tspsc-g1-reasoning", "Mental Ability & Aptitude", "Logical reasoning & mental ability"),
}

def publish(json_path, out_dir, review_path):
    d = json.load(open(json_path))["items"]
    live, held = {}, []
    for x in d:
        if x["section"] not in ALIGNED:
            continue
        slug, subject, topic = ALIGNED[x["section"]]
        opts = [re.sub(r"\s*TSPSC\s*\|.*$", "", o).strip() for o in x["options"]]
        flags = []
        if x["flag"]: flags.append(x["flag"])
        if x["key"] not in ("A", "B", "C", "D"): flags.append("no-key" if x["key"] is None else "key-NA")
        if len(opts) != 4 or len(set(opts)) < 4 or any(not o for o in opts): flags.append("options")
        if len(x["question"]) < 12: flags.append("stem")
        d_ = {"id": f"TSPSC1-{x['section']:02d}-{x['n']:04d}", "exam": ["group1"], "subject": subject, "topic": topic, "question": x["question"], "options": opts,
              "answerIndex": "ABCD".index(x["key"]) if x["key"] in ("A", "B", "C", "D") else -1, "explanation": "",
              "source": f"TSPSC Group-I Prelims PYQ book (CivicCentre) · {topic} Q.{x['n']}", "sourcePage": x["page"], "sourceKey": x["key"] or "?"}
        if flags:
            d_["keyCheck"] = "auto-flagged"; d_["flag"] = "Automatic extraction check failed: " + ", ".join(flags); held.append(d_)
        else:
            d_["keyCheck"] = "auto-clean"; live.setdefault(slug, []).append(d_)
    for slug, items in live.items():
        json.dump(items, open(f"{out_dir}/{slug}.json", "w"), ensure_ascii=False)
    json.dump(held, open(review_path, "w"), ensure_ascii=False)
    print("tspsc live", {k: len(v) for k, v in live.items()}, "flagged", len(held))

if __name__ == "__main__":
    if sys.argv[1] == "publish":
        publish(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        main(sys.argv[1], sys.argv[2])
