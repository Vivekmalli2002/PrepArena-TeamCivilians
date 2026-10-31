"""Reads a two-column book PDF column by column using the real word positions (pdfplumber), and writes a text file in the
format civil_columns.py parses: one '===== PAGE n =====' block per page, left column first, then the right column.
    python3 -I scripts/extract/pdf_columns.py <book.pdf> <out.txt> [first_page] [last_page]
Single-column pages (no empty vertical band near the middle) are written as they are. Promo/footer lines are dropped.
"""
import re, sys
import pdfplumber

DROP = re.compile(r"telegram|whatsapp|apna_?library|t\.me/|yctbooks|yctfastbook|^\s*\d{1,4}\s*$|^.{0,40}\bYCT\b\s*$|PLANNER English|Eonomics|Page \d+ of \d+|^\s*Join\s*$", re.I)

def gutter(page):
    w = page.width
    words = page.extract_words(use_text_flow=False, keep_blank_chars=False)
    if len(words) < 40:
        return None
    cov = [0] * (int(w) + 2)
    for wd in words:
        for x in range(int(wd["x0"]), int(wd["x1"]) + 1):
            cov[x] += 1
    lo, hi = int(w * 0.40), int(w * 0.60)
    best, bx = None, None
    for x in range(lo, hi):
        c = sum(cov[x:x + 3])
        if best is None or c < best:
            best, bx = c, x + 1
    return bx if best is not None and best <= max(3, len(words) * 0.06) else None

SUB = str.maketrans("0123456789+-=()", "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎")
SUP = str.maketrans("0123456789+-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻")

def text_of(region):
    """Lines rebuilt from word positions; small raised/lowered words (sub/superscripts) are attached to the word before them."""
    words = region.extract_words(x_tolerance=1.5, y_tolerance=3, extra_attrs=["size"], keep_blank_chars=False)
    if not words:
        return ""
    sizes = sorted(w["size"] for w in words)
    body = sizes[len(sizes) // 2]
    lines = []
    for w in sorted(words, key=lambda w: ((w["top"] + w["bottom"]) / 2, w["x0"])):
        mid = (w["top"] + w["bottom"]) / 2
        small = w["size"] < 0.82 * body and re.fullmatch(r"[0-9+\-=()a-zA-Z]{1,4}", w["text"])
        placed = False
        for ln in reversed(lines[-6:]):
            if abs(ln["mid"] - mid) <= (body * 0.75 if small else body * 0.45):
                ln["w"].append((w, small, mid)); placed = True; break
        if not placed:
            lines.append({"mid": mid, "w": [(w, small, mid)]})
    out = []
    for ln in sorted(lines, key=lambda l: l["mid"]):
        parts = []
        for w, small, mid in sorted(ln["w"], key=lambda t: t[0]["x0"]):
            txt = w["text"]
            if small and parts:
                low = mid > ln["mid"] + 0.5
                parts[-1] += txt.translate(SUB if low else SUP)
            else:
                parts.append(txt)
        t = " ".join(parts)
        if t.strip() and not DROP.search(t):
            out.append(t)
    return "\n".join(out)

def main(pdf_path, out_path, first=1, last=None):
    out = []
    with pdfplumber.open(pdf_path) as pdf:
        n = len(pdf.pages)
        last = min(last or n, n)
        for pn in range(first, last + 1):
            page = pdf.pages[pn - 1]
            g = gutter(page)
            if g:
                h, w = page.height, page.width
                body = [text_of(page.crop((0, 0, g, h))), text_of(page.crop((g, 0, w, h)))]
            else:
                body = [text_of(page)]
            out.append(f"===== PAGE {pn} =====\n" + "\n".join(b for b in body if b))
    open(out_path, "w", encoding="utf8").write("\n".join(out) + "\n")
    print(pdf_path.split("/")[-1], "pages", last - first + 1)

if __name__ == "__main__":
    a = sys.argv
    main(a[1], a[2], int(a[3]) if len(a) > 3 else 1, int(a[4]) if len(a) > 4 else None)
