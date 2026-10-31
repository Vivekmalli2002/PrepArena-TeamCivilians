"""APPSC Group-I Mains Paper-V previous-year QUESTIONS (2008-2025) from the Ghissu PDF -> src/content/mains.json.
Only the exam questions are taken (printed in a Times font under each header); the book's model answers are the
publisher's own writing and are deliberately NOT copied.
    python3 -I scripts/extract/mains_extract.py <pdf> <first0> <last0> <out.json>   (parallel chunks, then merge)"""
import json, re, sys
import pdfplumber

HDR = re.compile(r"APPSC Group-I Mains (\d{4}) · (Old Paper [IVX]+|Paper [IVX]+) · Question (\d+\s*\([a-z]\)|\d+)")

def page_q(p):
    ws = p.extract_words(extra_attrs=["size", "fontname"])
    lines = {}
    for w in ws: lines.setdefault(round(w["top"] / 3), []).append(w)
    hdr = None; q = []; marks = None; label = None
    for k in sorted(lines):
        l = sorted(lines[k], key=lambda w: w["x0"])
        text = " ".join(w["text"] for w in l)
        m = HDR.search(text)
        if m and l[0]["fontname"].startswith("Helvetica"):
            hdr = m; continue
        if hdr is None: continue
        tim = [w for w in l if w["fontname"].startswith("Times") and 9.5 <= w["size"] <= 14]
        if not tim: continue
        t = " ".join(w["text"] for w in tim)
        if re.fullmatch(r"\d{1,2}", t) and tim[0]["x0"] > 450:
            marks = int(t); break
        q.append(t)
    if not hdr or not q: return None
    text = re.sub(r"\s+", " ", " ".join(q)).strip()
    # drop the printed question label ("1(a)", "P-IV", "old P-IV") glued to the start
    text = re.sub(r"^(?:old\s+)?P-[IVX]+\s+", "", text)
    text = re.sub(r"^\d+\s*\([a-z]\)\s+", "", text)
    text = re.sub(r"^\(?[A-Za-z]?\)?\s*\d+\s*\([a-z]\)\s+", "", text)
    return {"year": int(hdr.group(1)), "paper": hdr.group(2), "no": re.sub(r"\s+", "", hdr.group(3)), "marks": marks, "question": text}

if __name__ == "__main__":
    pdf_path, a, b, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    res = []
    with pdfplumber.open(pdf_path) as pdf:
        for i in range(a, min(b, len(pdf.pages) - 1) + 1):
            r = page_q(pdf.pages[i])
            if r: r["page"] = i + 1; res.append(r)
    json.dump(res, open(out, "w"), ensure_ascii=False)
