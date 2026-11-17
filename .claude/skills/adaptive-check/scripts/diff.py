# python3 .claude/skills/adaptive-check/scripts/diff.py <dirA> <dirB> [name] — pixel diff of matching PNGs; prints size + changed-pixel count per file
import sys, os
from PIL import Image, ImageChops
a, b = sys.argv[1], sys.argv[2]
only = sys.argv[3] if len(sys.argv) > 3 else ""
for f in sorted(os.listdir(a)):
    if not f.endswith(".png") or (only and not f.startswith(only)): continue
    pa, pb = os.path.join(a, f), os.path.join(b, f)
    if not os.path.exists(pb): print(f, "MISSING"); continue
    A, B = Image.open(pa).convert("RGB"), Image.open(pb).convert("RGB")
    if A.size != B.size: print(f, "SIZE", A.size, B.size); continue
    d = ImageChops.difference(A, B).convert("L").point(lambda v: 255 if v > 8 else 0)
    n = sum(1 for v in d.getdata() if v)
    print(f, "OK" if n == 0 else f"DIFF {n}px bbox {d.getbbox()}")
