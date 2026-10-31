"""Pass 1 for the Shyam Institute Group-2 test papers: per page, left (English) column lines with an 'underlined' flag.
    python3 -I scripts/extract/shyam_lines.py <pdf> <out.json> <first0> <last0>
Underlines are thin rects just under a line's baseline. Output: [{p, test, lines:[{t, x, top, ul}]}]"""
import json, re, sys
import pdfplumber

LEFT = 315

def page_lines(p):
    ws = [w for w in p.extract_words(extra_attrs=["size"]) if w["x0"] < LEFT and 82 < w["top"] < 752]
    ul = [r for r in p.rects if (r["bottom"] - r["top"]) <= 2.2 and (r["x1"] - r["x0"]) >= 4 and r["x0"] < LEFT]
    ws.sort(key=lambda w: (round(w["top"]), w["x0"]))
    rows = []
    for w in ws:
        if rows and abs(rows[-1]["top"] - w["top"]) <= 4:
            rows[-1]["w"].append(w)
        else:
            rows.append({"top": w["top"], "w": [w]})
    out = []
    for r in rows:
        r["w"].sort(key=lambda w: w["x0"])
        x0 = r["w"][0]["x0"]; x1 = max(w["x1"] for w in r["w"]); bot = max(w["bottom"] for w in r["w"])
        toks = []
        for w in r["w"]:
            wl = w["x1"] - w["x0"]; hit = 0.0
            for u in ul:
                if abs(u["top"] - w["bottom"]) <= 3.5:
                    hit += max(0.0, min(w["x1"], u["x1"]) - max(w["x0"], u["x0"]))
            toks.append([w["text"], 1 if hit >= 0.5 * wl else 0])
        out.append({"w": toks, "x": round(x0), "top": round(r["top"])})
    return out

def main():
    pdf_path, out, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    res = []
    with pdfplumber.open(pdf_path) as pdf:
        for i in range(a, min(b, len(pdf.pages) - 1) + 1):
            p = pdf.pages[i]
            txt = p.extract_text() or ""
            m = re.search(r"MODEL\s+TEST\s*-\s*(\d+)", txt)
            res.append({"p": i, "test": int(m.group(1)) if m else None, "lines": page_lines(p)})
    json.dump(res, open(out, "w"), ensure_ascii=False)

main()
