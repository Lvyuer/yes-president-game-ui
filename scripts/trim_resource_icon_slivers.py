"""Hard-trim neighbor slivers from resource icons."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "src" / "assets" / "themes" / "default" / "icons"
BACKUP_DIR = ROOT / "src" / "assets" / "raw" / "icon-recrop-backups"
NAMES = ("prestige", "security", "wealth", "support")


def content_mask(im: Image.Image):
    px = im.load()
    w, h = im.size
    mask = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            lum = (r + g + b) / 3
            if a > 40 and lum > 22:
                mask[y][x] = True
    return mask


def column_occ(mask) -> list[int]:
    h = len(mask)
    w = len(mask[0])
    return [sum(1 for y in range(h) if mask[y][x]) for x in range(w)]


def find_valley_cut(occ: list[int]) -> int | None:
    n = len(occ)
    if n < 8:
        return None
    start = n // 2
    for x in range(start, n - 1):
        if occ[x] >= 8:
            continue
        left_peak = any(occ[i] > 20 for i in range(max(0, x - 12), x))
        right_peak = any(occ[i] > 20 for i in range(x + 1, min(n, x + 13)))
        if left_peak and right_peak:
            return x
    return None


def trim_sparse_edges(occ: list[int], left: int, right: int) -> tuple[int, int]:
    mid = occ[left:right]
    if not mid:
        return left, right
    sorted_mid = sorted(mid)
    median = sorted_mid[len(sorted_mid) // 2] or 1
    thresh = max(5, int(0.12 * median))
    while left < right - 1 and occ[left] < thresh:
        left += 1
    while right > left + 1 and occ[right - 1] < thresh:
        right -= 1
    return left, right


def process(name: str) -> str:
    src = BACKUP_DIR / f"{name}.png"
    if not src.exists():
        src = ICON_DIR / f"{name}.png"
    im = Image.open(src).convert("RGBA")
    mask = content_mask(im)
    occ = column_occ(mask)
    w, h = im.size

    # Merged column runs with gap <= 6
    runs: list[tuple[int, int]] = []
    i = 0
    while i < w:
        if occ[i] < 2:
            i += 1
            continue
        j = i
        while j < w and occ[j] >= 2:
            j += 1
        runs.append((i, j))
        i = j
    merged: list[tuple[int, int]] = []
    for run in runs:
        if not merged:
            merged.append(run)
            continue
        a, b = merged[-1]
        c, d = run
        if c - b <= 6:
            merged[-1] = (a, d)
        else:
            merged.append(run)
    if not merged:
        return f"{name}: NO CONTENT"

    x0, x1 = max(merged, key=lambda r: r[1] - r[0])
    valley = find_valley_cut(occ[x0:x1])
    valley_used = False
    if valley is not None:
        x1 = x0 + valley
        valley_used = True

    x0, x1 = trim_sparse_edges(occ, x0, x1)
    # Extra hard: drop rightmost 1-3px if still a thin spike
    while x1 - x0 > 40 and occ[x1 - 1] < 8:
        x1 -= 1

    ys = [y for y in range(h) for x in range(x0, x1) if mask[y][x]]
    if not ys:
        return f"{name}: empty after trim"
    y0, y1 = min(ys), max(ys) + 1
    pad = 10
    crop = im.crop(
        (
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(w, x1 + pad),
            min(h, y1 + pad),
        )
    )
    cw, ch = crop.size
    side = max(cw, ch) + 4
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.paste(crop, ((side - cw) // 2, (side - ch) // 2))
    px = out.load()
    for y in range(side):
        for x in range(side):
            r, g, b, a = px[x, y]
            if (r + g + b) / 3 < 12:
                px[x, y] = (0, 0, 0, 0)
    dest = ICON_DIR / f"{name}.png"
    out.save(dest)
    return f"{name}: valley={valley_used} crop_x=({x0},{x1}) final={side}x{side}"


def main():
    lines = [process(n) for n in NAMES]
    report = ICON_DIR / "_trim_report.txt"
    report.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
