"""Helpers for writing original questions as code, so keys are given as answer *text*
(never a hand-typed index) and every file is validated before it is written."""
import json, os, random

SOURCE = "Team Civilians original · APPSC pattern"
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "content", "authored")

class Subject:
    def __init__(self, sid, name, first_id, units):
        self.sid, self.name, self.next_id, self.units, self.qs = sid, name, first_id, units, []

    def q(self, unit, question, options, answer, explanation, level="hard", shuffle=False, seed=None):
        assert answer in options, f"answer not in options: {question[:60]}"
        assert len(set(options)) == len(options), f"duplicate options: {question[:60]}"
        assert 2 <= len(options) <= 5
        opts = list(options)
        if shuffle:
            random.Random(seed or question).shuffle(opts)
        self.qs.append({
            "id": self.next_id, "topic": self.units[unit - 1], "unit": unit, "question": question,
            "options": opts, "answerIndex": opts.index(answer), "explanation": explanation,
            "source": SOURCE, "difficulty": level,
        })
        self.next_id += 1

    def write(self, filename):
        os.makedirs(OUT, exist_ok=True)
        path = os.path.join(OUT, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"subject": {"id": self.sid, "name": self.name}, "questions": self.qs}, f, ensure_ascii=False, indent=1)
        print(f"{filename}: {len(self.qs)} questions")

HOW_MANY = ["Only one", "Only two", "Only three", "All four"]
HOW_MANY_PAIRS = ["Only one pair", "Only two pairs", "Only three pairs", "All four pairs"]
AR = [
    "Both A and R are true, and R is the correct explanation of A",
    "Both A and R are true, but R is not the correct explanation of A",
    "A is true, but R is false",
    "A is false, but R is true",
]
