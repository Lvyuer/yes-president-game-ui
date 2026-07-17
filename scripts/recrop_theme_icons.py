"""Recrop sprite icon fragments to main content column run."""
from __future__ import annotations

import os
import shutil
from pathlib import Path

from PIL import Image
import numpy as np

ICONS_DIR = Path(r"packages/yes-president-game-ui/src/assets/themes/default/icons")
BACKUP_DIR = Path(r"packages/yes-president-game-ui/src/assets/raw/icon-recrop-backups")
NAMES = ["prestige.png", "security.png", "wealth.png", "loyalty.png"]

COL_THRESHOLD = 3
PADDING = 8
LUM_EMPTY = 20
ALPHA_EMPTY = 40


def is_content(rgba: np.ndarray) -> np.ndarray:
    r, g, b, a = rgba[..., 0], rgba[..., 1], rgba[..., 2], rgba[..., 3]
    lum = 0.299 * r.astype(np.float32) + 0.587 * g.astype(np.float32) + 0.114 * b.astype(np.float32)
    empty = (lum < LUM_EMPTY) | (a < ALPHA_EMPTY)
    return ~empty


def find_runs(occupancy: np.ndarray, min_count: int) -> list[tuple[int, int, int]]:
    """Return list of (start, end_exclusive, width) for runs with occupancy > min_count."""
    w = len(occupancy)
    runs: list[tuple[int, int, int]] = []
    i = 0
    while i < w:
        if occupancy[i] > min_count:
            start = i
            while i < w and occupancy[i] > min_count:
                i += 1
            runs.append((start, i, i - start))
        else:
            i += 1
    return runs


def pick_main_run(runs: list[tuple[int, int, int]]) -> tuple[int, int] | None:
    if not runs:
        return None
    runs_sorted = sorted(runs, key=lambda t: (t[2], t[0]), reverse=True)
    start, end, _ = runs_sorted[0]
    return start, end


def process(path: Path, backup_dir: Path) -> dict:
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = backup_dir / path.name
    shutil.copy2(path, backup_path)

    im = Image.open(path).convert("RGBA")
    before = im.size
    arr = np.array(im)
    h, w = arr.shape[:2]
    content = is_content(arr)

    col_occ = content.sum(axis=0)
    runs = find_runs(col_occ, COL_THRESHOLD)
    main = pick_main_run(runs)
    if main is None:
        raise RuntimeError(f"{path.name}: no content runs found")

    x0_run, x1_run = main
    rows_any = content.any(axis=1)
    ys = np.where(rows_any)[0]
    if ys.size == 0:
        raise RuntimeError(f"{path.name}: no vertical content")
    y0_all, y1_all = int(ys[0]), int(ys[-1]) + 1

    x0 = max(0, x0_run - PADDING)
    x1 = min(w, x1_run + PADDING)
    y0 = max(0, y0_all - PADDING)
    y1 = min(h, y1_all + PADDING)

    cropped = arr[y0:y1, x0:x1]
    ch, cw = cropped.shape[:2]
    side = max(cw, ch) + 16
    canvas = np.zeros((side, side, 4), dtype=np.uint8)
    ox = (side - cw) // 2
    oy = (side - ch) // 2
    canvas[oy : oy + ch, ox : ox + cw] = cropped

    out = Image.fromarray(canvas, "RGBA")
    out.save(path)

  # verify edges
    out_content = is_content(canvas)
    edge_w = max(1, int(side * 0.02))
    left_count = int(out_content[:, :edge_w].sum())
    right_count = int(out_content[:, -edge_w:].sum())
    total_content = int(out_content.sum())

    return {
        "name": path.name,
        "before": before,
        "after": (side, side),
        "runs": len(runs),
        "run_widths": [r[2] for r in runs],
        "chosen_run": (x0_run, x1_run),
        "left_edge_content": left_count,
        "right_edge_content": right_count,
        "total_content": total_content,
        "edge_w": edge_w,
    }


def main() -> None:
    base = Path.cwd()
    icons = base / ICONS_DIR
    backup = base / BACKUP_DIR
    results = []
    for name in NAMES:
        p = icons / name
        if not p.exists():
            raise FileNotFoundError(p)
        results.append(process(p, backup))

    print("=== Icon recrop results ===\n")
    for r in results:
        print(f"{r['name']}:")
        print(f"  before: {r['before'][0]}x{r['before'][1]}")
        print(f"  after:  {r['after'][0]}x{r['after'][1]}")
        print(f"  content runs: {r['runs']} (widths: {r['run_widths']})")
        print(f"  chosen x-run: {r['chosen_run'][0]}..{r['chosen_run'][1]}")
        print()

    print("=== Edge verification (2% width strips) ===\n")
    ok_all = True
    for r in results:
        # "almost no" — use < 1% of total content or absolute small
        thresh = max(5, int(r["total_content"] * 0.01))
        left_ok = r["left_edge_content"] <= thresh
        right_ok = r["right_edge_content"] <= thresh
        ok = left_ok and right_ok
        ok_all = ok_all and ok
        status = "PASS" if ok else "FAIL"
        print(
            f"{r['name']}: {status}  left={r['left_edge_content']} right={r['right_edge_content']} "
            f"(threshold<={thresh}, edge_w={r['edge_w']}, total_content={r['total_content']})"
        )
    print()
    print("Overall:", "PASS" if ok_all else "FAIL")
    if not ok_all:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
