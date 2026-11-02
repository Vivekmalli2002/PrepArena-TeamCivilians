"""Heuristic detector: a numerical = calculation question (given data in the stem and numeric options), not code/value recall."""
import re
NUM = re.compile(r'(?<![\w.])(\d+(?:[.,]\d+)?)(?![\w])')
UNIT = r'(?:mm|cm|m|km|kN|N|kg|g|t|MPa|N/mm2|N/mm²|kPa|Pa|°|deg|%|m/s|s|min|hr|hours?|kN/m|kNm|kN-m|l/s|lpm|ltr|litres?|m3|m²|m³|mm2|cm2|cm3|rpm|kW|W|hp|HP|K|°C|C|bar|kg/m3|Hz|ft|inch|in|rad|mg/l|ppm|MLD|ha|mph|kmph|kmh)'
RECALL = re.compile(r'\b(as per|according to|IS[:\s-]*\d|IRC|IS code|minimum|maximum|should not|recommended|specified|standard|permissible|code|is called|termed|known as|which of the following)\b', re.I)
CALC = re.compile(r'\b(find|calculate|compute|determine|estimate|what (?:is|will be|would be|should be) the|how (?:much|many|long|far)|the value of|equals?|is equal|required|will be|works? out|nearest|approximately)\b', re.I)
FIGURE = re.compile(r'\b(fig(?:ure)?|shown|diagram)\b', re.I)
def strip(s):
    s = re.sub(r'\b(19|20)\d{2}\b', ' ', s)
    s = re.sub(r'\b(IS|IRC|SP)\s*[:\-]?\s*\d+(?:[:\-]\d+)*', ' ', s)
    s = re.sub(r'\b(class|grade|type|group|M|Fe|fck)\s*[-:]?\s*\d+', ' ', s, flags=re.I)
    return s
def opt_numeric(o):
    return bool(re.search(r'\d', o)) and len(o) <= 60
LISTY = re.compile(r'consider the following|statements?\b|\bmatch\b|list[\s-]*(i|1)\b|which of the following|arrange the following|\(1\).*\(2\)|\b1\.\s.*\b2\.\s.*\b3\.\s', re.I | re.S)
def is_numerical(q):
    s = q['question']
    opts = q['options']
    if LISTY.search(s): return False
    if sum(opt_numeric(o) for o in opts) < 3: return False
    t = strip(s)
    nums = NUM.findall(t)
    n = len(nums)
    has_unit = len(re.findall(r'\d\s*' + UNIT + r'\b', t))
    if n >= 2 and CALC.search(s) : ok = True
    elif n >= 3: ok = True
    elif n >= 1 and has_unit and CALC.search(s) and not RECALL.search(s): ok = True
    else: ok = False
    if ok and n <= 1 and RECALL.search(s): ok = False
    if ok and RECALL.search(s) and n < 3 and not re.search(r'\b(find|calculate|compute|determine)\b', s, re.I): ok = False
    return ok
