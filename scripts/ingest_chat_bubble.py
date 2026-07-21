# -*- coding: utf-8 -*-
"""Ingest root 聊天框.png into theme frames (+ teal outgoing variant)."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
PKG_ASSETS = Path(__file__).resolve().parents[1] / "src" / "assets"
RAW = PKG_ASSETS / "raw"
FRAMES = PKG_ASSETS / "themes" / "default" / "frames"
BACKUP = RAW / "replace-4k-uncropped"
PLAY_ASSETS = Path(__file__).resolve().parents[1] / "playground" / "main-loop" / "assets"
MARGIN = 24


def tint_teal(img: Image.Image) -> Image.Image:
    r, g, b, a = img.split()
    rf = r.point(lambda v: int(v * 0.55 + 20 * 0.45))
    gf = g.point(lambda v: int(v * 0.55 + 110 * 0.45))
    bf = b.point(lambda v: int(v * 0.55 + 95 * 0.45))
    return Image.merge("RGBA", (rf, gf, bf, a))


def main() -> None:
    src = ROOT / "聊天框.png"
    if not src.exists():
        raise SystemExit(f"missing: {src}")

    RAW.mkdir(parents=True, exist_ok=True)
    BACKUP.mkdir(parents=True, exist_ok=True)
    FRAMES.mkdir(parents=True, exist_ok=True)

    shutil.copy2(src, RAW / "聊天框-原图.png")
    shutil.copy2(src, BACKUP / "聊天框.png")

    im = Image.open(src).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit("empty alpha")
    l, t, r, b = bbox
    l = max(0, l - MARGIN)
    t = max(0, t - MARGIN)
    r = min(im.width, r + MARGIN)
    b = min(im.height, b + MARGIN)
    cropped = im.crop((l, t, r, b))

    out_in = FRAMES / "聊天框.png"
    cropped.save(out_in)
    print(f"saved {out_in.name} {cropped.size} from {im.size} bbox={bbox}")

    out_out = FRAMES / "聊天框-出站.png"
    tint_teal(cropped).save(out_out)
    print(f"saved {out_out.name}")

    for name, dest_name in [
        ("聊天主界面.png", "felegram-chat-ui-base.png"),
        ("联系人主界面.png", "felegram-contacts-ui-base.png"),
    ]:
        s = ROOT / name
        if not s.exists():
            print(f"skip missing {name}")
            continue
        shutil.copy2(s, RAW / f"{Path(name).stem}-原图.png")
        dest = PLAY_ASSETS / dest_name
        shutil.copy2(s, dest)
        print(f"synced {name} -> {dest_name}")


if __name__ == "__main__":
    main()
