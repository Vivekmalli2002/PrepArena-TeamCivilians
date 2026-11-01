"""Parse APPSC_Group1_Mains_PYQ_Compilation.pdf -> src/content/mains-all.json
usage: python3 -I mains_compilation.py <pdf> <out.json>
Rows are  [microtheme | questions "1. ...\n2. ..." | year(s)], with syllabus-topic
rows ("03. Current Affairs ...") and Paper/Section headings in between."""
import sys, re, json, pdfplumber

pdf, out = sys.argv[1], sys.argv[2]
ROMAN = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5}
PAPERS = {1: 'General Essay', 2: 'History, Culture & Geography', 3: 'Polity, Governance & Ethics',
          4: 'Economy', 5: 'Science, Technology & Environment'}
clean = lambda s: re.sub(r'\s+', ' ', (s or '').replace('­', '')).strip()

def by_words(pg, bb):
    # re-read a row by word position: columns split at the x of the header cells
    x0, top, x1, bot = bb
    cx = COLS.get(id(pg)) or COLS['default']
    ws = pg.crop((x0, top, x1, bot)).extract_words(keep_blank_chars=False, use_text_flow=False)
    ws.sort(key=lambda w: (round(w['top']), w['x0']))
    mic, qs, yr, cur, lastq = [], [], [], None, -9
    for w in ws:
        if w['x0'] < cx[0]: mic.append((w['top'], w['text'])); continue
        if w['x0'] >= cx[1]:
            if re.fullmatch(r'(?:19|20)\d\d', w['text']): yr.append(w['text'])
            continue
        if re.fullmatch(r'\d+\.', w['text']) and w['x0'] < cx[0] + 14: qs.append([]); 
        if qs: qs[-1].append(w['text'])
    return [' '.join(t for _, t in mic), '\n'.join(' '.join(q) for q in qs).replace('\n', '\n'), ' '.join(yr)]

COLS = {'default': (171, 499)}
recs, paper, section, topic, micro = [], 0, '', '', ''
with pdfplumber.open(pdf) as doc:
    for pg in doc.pages:
        lines = [(l['top'], l['text'].strip()) for l in pg.extract_text_lines()]
        marks = []  # (top, kind, value)
        for top, t in lines:
            m = re.match(r'PAPER\s*-\s*([IV]+)\s*•', t)
            if m: marks.append((top, 'paper', ROMAN[m.group(1)]))
            m = re.match(r'(SECTION [A-Z0-9IVX]+\s*:.*)$', t)
            if m: marks.append((top, 'section', clean(m.group(1))))
        rows = []
        for tb in pg.find_tables():
            for r, cells in zip(tb.rows, tb.extract()):
                if len(cells) == 3 and cells[0] and (len(cells[0]) > 140 or (cells[2] and len(re.findall(r'(?:19|20)\d\d', cells[2])) != len(re.findall(r'(?m)^\s*\d+\.\s', cells[1] or '')))):
                    cells = by_words(pg, r.bbox)
                rows.append((r.bbox[1], cells))
        rows.sort(key=lambda x: x[0])
        ev = sorted([(t, 0, k, v) for t, k, v in marks] + [(t, 1, 'row', c) for t, c in rows], key=lambda x: (x[0], x[1]))
        for _, _, kind, val in ev:
            if kind == 'paper': paper, section, topic, micro = val, '', '', ''
            elif kind == 'section': section = val
            else:
                c = val
                if c[0] and re.match(r'^\d\d\.\s', c[0]) and not c[1]: topic = clean(c[0]); continue
                if not paper or len(c) != 3 or not c[1] or c[0] in ('Microtheme', 'Microtheme / Topic'): continue
                if c[0] and clean(c[0]): micro = clean(c[0])
                qs = [clean(x) for x in re.split(r'(?m)^\s*\d+\.\s', c[1]) if clean(x)]
                ys = re.findall(r'(?:19|20)\d\d', c[2] or '')
                recs.append(dict(paper=paper, section=section, topic=topic, micro=micro, qs=qs, ys=ys))
tot = {}
res = []
for r in recs:
    n = len(r['qs'])
    ys = r['ys']
    if len(ys) != n:
        print('year mismatch', r['paper'], r['micro'], n, ys)
        ys = (ys + [ys[-1] if ys else ''] * n)[:n]
    for q, y in zip(r['qs'], ys):
        tot[r['paper']] = tot.get(r['paper'], 0) + 1
        res.append(dict(paper=r['paper'], section=r['section'], topic=r['topic'], micro=r['micro'], year=int(y) if y else 0, question=q))
seen, ded = set(), []
for r in res:
    k = (r['paper'], r['question'], r['year'])
    if k in seen: continue
    seen.add(k); ded.append(r)
res = ded
tot = {}
for r in res: tot[r['paper']] = tot.get(r['paper'], 0) + 1
print(tot, sum(tot.values()), '(PDF headers claim 71/183/126/236/241 = 857)')
json.dump(res, open(out, 'w'), ensure_ascii=False, indent=0)
