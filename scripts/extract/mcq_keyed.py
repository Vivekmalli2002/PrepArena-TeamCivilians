"""Parses single-column MCQ practice banks that print the questions first and a separate answer key afterwards.
    python3 -I scripts/extract/mcq_keyed.py <pdf> <kind: eco200|aeeset> <out.json> <id-prefix> <source label>
"""
import json, re, subprocess, sys

def text_of(pdf):
    return subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout

def fix(s):
    s = re.sub(r"■\s*([²¹³])", lambda m: "⁻" + m.group(1), s)
    s = s.replace("■", "")
    return re.sub(r"\s+", " ", s).strip()

def split_opts(body):
    m = list(re.finditer(r"\(\s*([a-d])\s*\)", body))
    seq, want = [], "a"
    for x in m:
        if x.group(1) == want:
            seq.append(x); want = chr(ord(want) + 1)
    if len(seq) != 4:
        return None, None
    stem = fix(body[: seq[0].start()])
    opts = [fix(body[seq[i].end(): seq[i + 1].start() if i < 3 else len(body)]) for i in range(4)]
    return stem, opts

def main(pdf, kind, out, prefix, label):
    t = text_of(pdf)
    items = []
    if kind == "eco200":
        qpart, kpart = t.split("SECTION II — ANSWER KEY", 1)
        keys = {int(n): (k, fix(e)) for n, k, e in re.findall(r"^\s*(\d{1,3})\.\s+([a-d])\s+[—-]\s+(.*?)(?=\n\s*\d{1,3}\.\s+[a-d]\s+[—-]|\Z)", kpart, re.S | re.M)}
        for n, body in re.findall(r"^\s*Q(\d{1,3})\.\s+(.*?)(?=^\s*Q\d{1,3}\.\s|\Z)", qpart, re.S | re.M):
            n = int(n)
            body = re.sub(r"Assistant Environmental Engineer \| Ecosystem\s+Page \d+", " ", body)
            stem, opts = split_opts(body)
            items.append((n, stem, opts, keys.get(n)))
    else:
        # questions "N. stem" then options; key table "N a explanation"
        qpart = t
        keys = {}
        for n, k, e in re.findall(r"^\s*(\d{1,3})\s+([a-d])\s{2,}(.*)$", t, re.M):
            keys[int(n)] = (k, fix(e))
        qpart = re.split(r"\n\s*Q\.No\s+Ans", t, 1)[0]
        for n, body in re.findall(r"^(\d{1,3})\.\s+(.*?)(?=^\d{1,3}\.\s|\Z)", qpart, re.S | re.M):
            n = int(n)
            stem, opts = split_opts(body)
            items.append((n, stem, opts, keys.get(n)))
    res, bad = [], []
    for n, stem, opts, key in items:
        if not stem or not opts or not key or len(set(opts)) < 4:
            bad.append(n); continue
        res.append({"id": f"{prefix}-{n:03d}", "question": stem, "options": opts, "answerIndex": "abcd".index(key[0]), "explanation": key[1], "source": label, "sourcePage": n})
    json.dump({"items": res, "failed": bad}, open(out, "w"), ensure_ascii=False, indent=1)
    print(len(res), "ok;", len(bad), "failed", bad[:10])

if __name__ == "__main__":
    main(*sys.argv[1:6])
