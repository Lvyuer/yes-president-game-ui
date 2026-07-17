from pathlib import Path

try:
    from PIL import Image
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
    from PIL import Image

root = Path(__file__).resolve().parent.parent
path = root / "src/assets/themes/default/frames/input-frame.png"
im = Image.open(path).convert("RGBA")
w, h = im.size
px = im.load()
th = 8
min_x, min_y, max_x, max_y = w, h, -1, -1
for y in range(h):
    for x in range(w):
        if px[x, y][3] > th:
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)

print(f"before={w}x{h} bbox=({min_x},{min_y})-({max_x},{max_y})")
print(f"pad L={min_x} T={min_y} R={w-1-max_x} B={h-1-max_y}")

pad = 2
l = max(0, min_x - pad)
t = max(0, min_y - pad)
r = min(w, max_x + 1 + pad)
b = min(h, max_y + 1 + pad)
cropped = im.crop((l, t, r, b))
cropped.save(path)
print(f"after={cropped.size[0]}x{cropped.size[1]} crop=({l},{t},{r},{b})")
print(f"SLICE_DELTA_L={l} T={t}")
