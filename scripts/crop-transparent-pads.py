"""Audit and crop transparent padding from theme PNG assets."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    import subprocess
    import sys

    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
    from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
THEME = ROOT / "src" / "assets" / "themes" / "default"
MANIFEST = ROOT / "src" / "assets" / "manifest.json"
BACKUP = ROOT / "src" / "assets" / "raw" / "crop-backups"
THRESHOLD = 8
SOFT_FRINGE = 2
# Only crop when any side has at least this many transparent pixels
MIN_PAD_TO_CROP = 6

# Fixed-size / decorative assets where tight crop is still fine,
# but skip anything under icons that is intentionally padded? We crop frames/dividers.
INCLUDE_GLOBS = [
    "frames/*.png",
    "dividers/*.png",
    "icons/icon-button-base.png",
    "icons/progress-thumb.png",
]


def alpha_bbox(im: Image.Image, th: int = THRESHOLD):
    w, h = im.size
    px = im.load()
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > th:
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    if max_x < 0:
        return None
    return min_x, min_y, max_x, max_y


def collect_files() -> list[Path]:
    files: list[Path] = []
    for pattern in INCLUDE_GLOBS:
        files.extend(THEME.glob(pattern))
    return sorted(set(files))


def crop_file(path: Path) -> dict | None:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    bbox = alpha_bbox(im)
    if not bbox:
        return {"file": str(path.relative_to(ROOT)), "skipped": "empty"}
    min_x, min_y, max_x, max_y = bbox
    pad_l, pad_t = min_x, min_y
    pad_r, pad_b = (w - 1 - max_x), (h - 1 - max_y)
    max_pad = max(pad_l, pad_t, pad_r, pad_b)
    info = {
        "file": str(path.relative_to(ROOT)).replace("\\", "/"),
        "before": [w, h],
        "pad": [pad_l, pad_t, pad_r, pad_b],
        "bbox": [min_x, min_y, max_x, max_y],
        "max_pad": max_pad,
    }
    if max_pad < MIN_PAD_TO_CROP:
        info["action"] = "skip-small-pad"
        return info

    BACKUP.mkdir(parents=True, exist_ok=True)
    backup_path = BACKUP / path.name
    if not backup_path.exists():
        shutil.copy2(path, backup_path)

    l = max(0, min_x - SOFT_FRINGE)
    t = max(0, min_y - SOFT_FRINGE)
    r = min(w, max_x + 1 + SOFT_FRINGE)
    b = min(h, max_y + 1 + SOFT_FRINGE)
    cropped = im.crop((l, t, r, b))
    cropped.save(path)
    info["after"] = [cropped.size[0], cropped.size[1]]
    info["crop_offset"] = [l, t]
    info["action"] = "cropped"
    return info


def update_manifest(results: list[dict]) -> None:
    """Adjust size/alphaBBox/nineSlice for cropped assets by crop offset."""
    by_name = {}
    for r in results:
        if r.get("action") != "cropped":
            continue
        name = Path(r["file"]).name
        by_name[name] = r

    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    changed = 0
    for asset in data.get("assets", []):
        file_path = asset.get("file", "")
        name = Path(file_path).name
        if name not in by_name:
            continue
        r = by_name[name]
        ox, oy = r["crop_offset"]
        pad_l, pad_t, pad_r, pad_b = r["pad"]
        # Actual content shift equals crop_offset (pad minus fringe kept)
        shift_l, shift_t = ox, oy
        # right/bottom shifts ≈ original pad - fringe remaining on that side
        # After crop, fringe is SOFT_FRINGE on each side if pad >= SOFT_FRINGE
        shift_r = max(0, pad_r - SOFT_FRINGE)
        shift_b = max(0, pad_b - SOFT_FRINGE)
        aw, ah = r["after"]
        asset["size"] = [aw, ah]
        asset["alphaBBox"] = [SOFT_FRINGE, SOFT_FRINGE, aw - SOFT_FRINGE - 1, ah - SOFT_FRINGE - 1]
        ns = asset.get("nineSlice")
        if isinstance(ns, dict):
            if "top" in ns:
                ns["top"] = max(8, int(ns["top"]) - shift_t)
            if "bottom" in ns:
                ns["bottom"] = max(8, int(ns["bottom"]) - shift_b)
            if "left" in ns:
                ns["left"] = max(8, int(ns["left"]) - shift_l)
            if "right" in ns:
                ns["right"] = max(8, int(ns["right"]) - shift_r)
        sa = asset.get("safeArea")
        if isinstance(sa, dict):
            if "top" in sa:
                sa["top"] = max(6, int(sa["top"]) - shift_t)
            if "bottom" in sa:
                sa["bottom"] = max(6, int(sa["bottom"]) - shift_b)
            if "left" in sa:
                sa["left"] = max(6, int(sa["left"]) - shift_l)
            if "right" in sa:
                sa["right"] = max(6, int(sa["right"]) - shift_r)
        notes = asset.get("notes") or ""
        if "Cropped tight to alpha" not in notes:
            asset["notes"] = (notes + " Cropped tight to alpha bbox.").strip()
        changed += 1
        print(
            f"  manifest {name}: shift LTRB=({shift_l},{shift_t},{shift_r},{shift_b}) "
            f"size->{aw}x{ah} nineSlice={ns}"
        )

    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"manifest assets updated: {changed}")


def main():
    print(f"THEME={THEME}")
    files = collect_files()
    print(f"candidates={len(files)}")
    results = []
    for f in files:
        info = crop_file(f)
        results.append(info)
        action = info.get("action") or info.get("skipped")
        pad = info.get("pad")
        print(f"{action:16} {info['file']} before={info.get('before')} pad={pad} after={info.get('after')}")

    update_manifest(results)

    report = ROOT / "scripts" / "alpha-crop-report.json"
    report.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"report={report}")


if __name__ == "__main__":
    main()
