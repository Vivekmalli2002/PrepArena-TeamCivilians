"""Cuts each page of the Chemical Engineering YCT book at its real column gutter (pdfplumber word positions).

    python3 -I scripts/extract/chem_columns.py <book.pdf> <out dir>
"""
import pdfplumber,sys,collections
PDF=sys.argv[1] if len(sys.argv)>1 else ''
def gutter(pg):
    w=pg.width; cov=[0]*int(w)+[0]
    for ch in pg.chars:
        for x in range(int(ch['x0']),min(int(ch['x1'])+1,int(w))): cov[x]+=1
    lo,hi=int(w*0.4),int(w*0.6)
    best=min(range(lo,hi),key=lambda x:(cov[x],abs(x-w/2)))
    return best
def page_text(pg):
    g=gutter(pg)
    out=[]
    for box in [(0,0,g,pg.height),(g,0,pg.width,pg.height)]:
        t=pg.crop(box).extract_text(x_tolerance=1.5,y_tolerance=3) or ''
        out.append(t)
    return '\n'.join(out)
def dump(a,b,path):
    pdf=pdfplumber.open(PDF)
    with open(path,'w') as f:
        for n in range(a,b+1):
            f.write(f"===== PAGE {n} =====\n{page_text(pdf.pages[n-1])}\n")
if __name__=='__main__':
    for name,a,b in [('mat',112,119),('proc',120,153),('poll',210,225)]:
        dump(a,b,f'{sys.argv[2]}/{name}_pl.txt'); print(name,'ok')
