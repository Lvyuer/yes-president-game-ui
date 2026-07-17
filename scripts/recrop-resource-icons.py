import os
from PIL import Image
import numpy as np

BASE = r"C:\Users\zijenzhou\Documents\yes president\packages\yes-president-game-ui"
BACKUP_DIR = os.path.join(BASE, "src", "assets", "raw", "icon-recrop-backups")
OUT_DIR = os.path.join(BASE, "src", "assets", "themes", "default", "icons")
NAMES = ["prestige", "security", "wealth", "loyalty"]

PAD = 12
MERGE_GAP = 6
EDGE_COLS = 4
EDGE_OCC_PCT = 0.05
LUM_ALPHA_THRESH = 12
COL_OCC_THRESH = 2
LUM_MASK = 20
ALPHA_MASK = 128


def content_mask(rgba):
    r, g, b, a = rgba[..., 0], rgba[..., 1], rgba[..., 2], rgba[..., 3]
    lum = 0.299 * r.astype(np.float32) + 0.587 * g.astype(np.float32) + 0.114 * b.astype(np.float32)
    mask_lum = lum > LUM_MASK
    mask_alpha = (a > ALPHA_MASK) & ((r > 0) | (g > 0) | (b > 0))
    return mask_lum | mask_alpha


def find_widest_run(occ):
    w = len(occ)
    runs = []
    i = 0
    while i < w:
        if occ[i] >= COL_OCC_THRESH:
            start = i
            while i < w and occ[i] >= COL_OCC_THRESH:
                i += 1
            runs.append([start, i - 1])
        else:
            i += 1
    if not runs:
        return 0, w - 1
    merged = [runs[0][:]]
    for s, e in runs[1:]:
        prev_s, prev_e = merged[-1]
        gap = s - prev_e - 1
        if gap <= MERGE_GAP:
            merged[-1][1] = e
        else:
            merged.append([s, e])
    best = max(merged, key=lambda r: r[1] - r[0] + 1)
    return best[0], best[1]


def trim_sparse_edges(mask_region, x0, x1):
    occ = mask_region.sum(axis=0)
    if occ.size == 0:
        return x0, x1
    max_occ = float(occ.max()) if occ.max() > 0 else 1.0
    thresh = max_occ * EDGE_OCC_PCT
    left = 0
    for c in range(min(EDGE_COLS, occ.size)):
        if occ[c] < thresh:
            left = c + 1
        else:
            break
    right = occ.size - 1
    for c in range(occ.size - 1, max(occ.size - EDGE_COLS, 0) - 1, -1):
        if occ[c] < thresh:
            right = c - 1
        else:
            break
    if left > right:
        return x0, x1
    return x0 + left, x0 + right


def apply_lum_alpha(arr):
    out = arr.copy()
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    lum = 0.299 * r.astype(np.float32) + 0.587 * g.astype(np.float32) + 0.114 * b.astype(np.float32)
    out[lum < LUM_ALPHA_THRESH, 3] = 0
    return out


def process_icon(name):
    src_path = os.path.join(BACKUP_DIR, f"{name}.png")
    im = Image.open(src_path).convert("RGBA")
    arr = np.array(im)
    h, w = arr.shape[:2]
    mask = content_mask(arr)
    occ = mask.sum(axis=0)
    x0, x1 = find_widest_run(occ)
    mask_x = mask[:, x0 : x1 + 1]
    x0t, x1t = trim_sparse_edges(mask_x, x0, x1)
    mask_final = mask[:, x0t : x1t + 1]
    rows = np.where(mask_final.any(axis=1))[0]
    if rows.size == 0:
        y0, y1 = 0, h - 1
    else:
        y0, y1 = int(rows[0]), int(rows[-1])
    cropped = arr[y0 : y1 + 1, x0t : x1t + 1].copy()
    ch, cw = cropped.shape[:2]
    content_w = cw
    side = max(ch, cw) + 2 * PAD
    canvas = np.zeros((side, side, 4), dtype=np.uint8)
    ox = (side - cw) // 2
    oy = (side - ch) // 2
    canvas[oy : oy + ch, ox : ox + cw] = cropped
    canvas = apply_lum_alpha(canvas)
    out_path = os.path.join(OUT_DIR, f"{name}.png")
    Image.fromarray(canvas).save(out_path)
    return {
        "name": name,
        "source": f"{w}x{h}",
        "crop": f"{cw}x{ch}",
        "content_width": content_w,
        "output": f"{side}x{side}",
        "x_run": (x0, x1),
        "x_trim": (x0t, x1t),
        "y": (y0, y1),
        "out_path": out_path,
    }


def main():
    results = []
    for name in NAMES:
        r = process_icon(name)
        results.append(r)
        ok = "OK" if name != "prestige" or r["content_width"] > 80 else "WARN prestige narrow"
        print(f"{r['name']}: source {r['source']} -> crop {r['crop']} (content_w={r['content_width']}) -> {r['output']} [{ok}]")
        print(f"  x_run={r['x_run']} x_trim={r['x_trim']} y={r['y']}")
    p = next(x for x in results if x["name"] == "prestige")
    if p["content_width"] <= 80:
        print("ERROR: prestige content width too small - wreath likely missing")
        return 1
    print("prestige verification: content width substantial (wreath+person expected)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
