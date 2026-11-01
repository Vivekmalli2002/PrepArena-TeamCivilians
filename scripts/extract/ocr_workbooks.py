"""OCR the question strip at the top of every answer sheet of the CivicCentre 'Mission 1000' workbooks (the questions are printed
as outlines, not text).  usage: python3 -I ocr_workbooks.py <pdf-dir> <out-dir>
Writes one JSONL per workbook: {page, text}.  Telugu lines are ignored (English text only)."""
import sys, os, glob, json, subprocess, tempfile, re
from multiprocessing import Pool
from rapidocr_onnxruntime import RapidOCR

_ocr = None
def work(args):
    global _ocr
    pdf, page = args
    _ocr = _ocr or RapidOCR()
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["pdftoppm", "-r", "130", "-f", str(page), "-l", str(page), "-x", "0", "-y", "60", "-W", "1075", "-H", "300", "-png", pdf, f"{d}/p"], capture_output=True)
        f = glob.glob(f"{d}/p*.png")
        if not f: return page, ""
        r, _ = _ocr(f[0])
    return page, "\n".join(x[1] for x in (r or []))

if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    with Pool(int(os.environ.get("N", "4"))) as pool:
        for pdf in sorted(glob.glob(os.path.join(src, "*Mission-1000*.pdf"))):
            name = re.sub(r"^\d+", "", os.path.basename(pdf))[:50]
            dst = os.path.join(out, name + ".jsonl")
            if os.path.exists(dst): continue
            n = int(re.search(r"Pages:\s+(\d+)", subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout).group(1))
            res = pool.map(work, [(pdf, p) for p in range(4, n - 2)], chunksize=4)
            with open(dst + ".tmp", "w") as fh:
                for p, t in sorted(res): fh.write(json.dumps({"page": p, "text": t}, ensure_ascii=False) + "\n")
            os.rename(dst + ".tmp", dst)
            print("done", name, n, flush=True)
