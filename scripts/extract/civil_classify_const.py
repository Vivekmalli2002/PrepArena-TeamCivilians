import json
SUBS = json.load(open("data/civil-chapters.json"))
SLUG = {1: "em", 2: "som", 3: "fm", 4: "hm", 5: "bm", 6: "sa", 7: "rcc", 8: "ss", 9: "cpm", 10: "geo", 11: "ee", 12: "hyd", 13: "irr", 14: "sur", 15: "tra", 16: "gel", 17: "est"}
FILES = ["civil-vol1", "civil-vol2", "civil-vol1-unverified", "civil-vol2-unverified", "gs-civil-pyq", "gs-civil-pyq-unverified"]
