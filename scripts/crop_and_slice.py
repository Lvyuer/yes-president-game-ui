# -*- coding: utf-8 -*-
"""Crop transparent padding and report dimensions.

Nine-slice values are deliberately not estimated here. They must be chosen
manually in the playground so complete corner ornaments stay out of stretch
regions.
"""
from __future__ import annotations

import json
import traceback
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "src" / "assets"
THEME = ROOT / "themes" / "default"
RAW = ROOT / "raw"
BACKUP = RAW / "replace-4k-uncropped"
MARGIN = 24

def needs_crop(path: Path) -> bool:
    im = Image.open(path).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    w, h = im.size
    im.close()
    if not bbox:
        return False
    # Resolution alone is not a crop signal: valid UI strips can be wider than 4K.
    margins = [bbox[0], bbox[1], w - bbox[2], h - bbox[3]]
    return max(margins) > MARGIN + 8


def should_refresh_backup(work: Path, backup: Path) -> bool:
    if not backup.exists():
        return True

    work_mtime = work.stat().st_mtime
    backup_mtime = backup.stat().st_mtime
    if work_mtime > backup_mtime + 1:
        return True

    with Image.open(work).convert("RGBA") as current, Image.open(backup).convert("RGBA") as saved:
        work_bbox = current.getchannel("A").getbbox()
        backup_bbox = saved.getchannel("A").getbbox()
        if work_bbox and backup_bbox:
            work_area = (work_bbox[2] - work_bbox[0]) * (work_bbox[3] - work_bbox[1])
            backup_area = (backup_bbox[2] - backup_bbox[0]) * (backup_bbox[3] - backup_bbox[1])
            if work_area > backup_area * 1.5:
                return True
        if max(current.size) > max(saved.size) * 1.5:
            return True

    return False


def crop_to_alpha(src: Path, dst: Path, margin: int = MARGIN) -> tuple[list[int], list[int]]:
    im = Image.open(src).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        im.close()
        raise ValueError(f"empty alpha: {src}")
    l, t, r, b = bbox
    l = max(0, l - margin)
    t = max(0, t - margin)
    r = min(im.width, r + margin)
    b = min(im.height, b + margin)
    before = [im.width, im.height]
    cropped = im.crop((l, t, r, b))
    after = [cropped.width, cropped.height]
    dst.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(dst)
    im.close()
    cropped.close()
    return before, after


def process_asset(path: Path) -> dict:
    rel = path.relative_to(THEME).as_posix()
    path = THEME / rel
    bak = BACKUP / rel
    bak.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(path) as source:
        before = list(source.size)
    cropped_now = False
    if needs_crop(path):
        if should_refresh_backup(path, bak):
            bak.write_bytes(path.read_bytes())
        before, after = crop_to_alpha(bak, path)
        cropped_now = True
    else:
        after = before

    with Image.open(path).convert("RGBA") as current:
        bbox = current.getchannel("A").getbbox()
        size = list(current.size)
    margins = None
    if bbox:
        margins = [bbox[0], bbox[1], size[0] - bbox[2], size[1] - bbox[3]]
    return {
        "file": rel,
        "cropped_now": cropped_now,
        "before": before,
        "after": after,
        "alphaBBox": list(bbox) if bbox else None,
        "margins": margins,
        "nineSlice": "manual-required",
    }


def main() -> None:
    report: dict = {
        "margin": MARGIN,
        "note": "Nine-slice is manual; this report must not be copied into tokens.css.",
        "assets": [],
        "errors": [],
    }
    paths = []
    for category in ("frames", "icons", "dividers"):
        directory = THEME / category
        if directory.exists():
            paths.extend(sorted(directory.glob("*.png")))

    for path in paths:
        print(f"processing {path.relative_to(THEME).as_posix()}...", flush=True)
        try:
            entry = process_asset(path)
            report["assets"].append(entry)
            print(
                f"  {entry['after'][0]}x{entry['after'][1]} "
                f"cropped={entry['cropped_now']}",
                flush=True,
            )
        except Exception as e:
            rel = path.relative_to(THEME).as_posix()
            report["errors"].append({"file": rel, "error": str(e), "trace": traceback.format_exc()})
            print(f"  ERROR {e}", flush=True)

    out = ROOT / "crop-report.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out}", flush=True)


if __name__ == "__main__":
    main()
