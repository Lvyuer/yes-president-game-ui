"""Clean resource icons: largest component, crop, center, luminance cleanup."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ICONS = ("prestige", "security", "wealth", "loyalty")
ICONS_DIR = Path(__file__).resolve().parent.parent / "src/assets/themes/default/icons"


def luminance(r: int, g: int, b: int) -> int:
    return (r + g + b) // 3


def build_content_mask(pixels: list[list[tuple[int, int, int, int]]]) -> list[list[bool]]:
    h = len(pixels)
    w = len(pixels[0])
    mask = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[y][x]
            if luminance(r, g, b) > 25 and a > 40:
                mask[y][x] = True
    return mask


def find_components(mask: list[list[bool]]) -> list[list[tuple[int, int]]]:
    h = len(mask)
    w = len(mask[0])
    visited = [[False] * w for _ in range(h)]
    components: list[list[tuple[int, int]]] = []
    for y in range(h):
        for x in range(w):
            if not mask[y][x] or visited[y][x]:
                continue
            q: deque[tuple[int, int]] = deque([(y, x)])
            visited[y][x] = True
            comp: list[tuple[int, int]] = []
            while q:
                cy, cx = q.popleft()
                comp.append((cy, cx))
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny][nx] and not visited[ny][nx]:
                        visited[ny][nx] = True
                        q.append((ny, nx))
            components.append(comp)
    return components


def zero_non_largest(
    pixels: list[list[tuple[int, int, int, int]]],
    mask: list[list[bool]],
    largest: set[tuple[int, int]],
) -> None:
    h = len(pixels)
    w = len(pixels[0])
    for y in range(h):
        for x in range(w):
            if mask[y][x] and (y, x) not in largest:
                pixels[y][x] = (0, 0, 0, 0)


def content_bbox(pixels: list[list[tuple[int, int, int, int]]]) -> tuple[int, int, int, int] | None:
    h = len(pixels)
    w = len(pixels[0])
    min_x, min_y = w, h
    max_x, max_y = -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[y][x]
            if a > 0 and luminance(r, g, b) > 25:
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    if max_x < 0:
        return None
    return min_x, min_y, max_x, max_y


def strip_empty(pixels: list[list[tuple[int, int, int, int]]], x0: int, x1: int) -> bool:
    h = len(pixels)
    for y in range(h):
        for x in range(x0, x1):
            if pixels[y][x][3] > 0:
                return False
    return True


def process_icon(path: Path) -> tuple[int, tuple[int, int], bool, bool]:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    flat = list(img.getdata())
    pixels = [flat[y * w : (y + 1) * w] for y in range(h)]

    mask = build_content_mask(pixels)
    components = find_components(mask)
    component_count = len(components)

    if components:
        largest_set = set(max(components, key=len))
        zero_non_largest(pixels, mask, largest_set)

    bbox = content_bbox(pixels)
    if bbox is None:
        out = Image.new("RGBA", (4, 4), (0, 0, 0, 0))
        out.save(path)
        return component_count, out.size, True, True

    min_x, min_y, max_x, max_y = bbox
    pad = 10
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(w - 1, max_x + pad)
    max_y = min(h - 1, max_y + pad)

    cropped_rows = [row[min_x : max_x + 1] for row in pixels[min_y : max_y + 1]]
    ch = len(cropped_rows)
    cw = len(cropped_rows[0])

    side = max(cw, ch) + 4
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - cw) // 2
    oy = (side - ch) // 2
    crop_img = Image.new("RGBA", (cw, ch))
    crop_img.putdata([px for row in cropped_rows for px in row])
    canvas.paste(crop_img, (ox, oy))

    ow, oh = canvas.size
    out_flat = list(canvas.getdata())
    out_pixels = [out_flat[y * ow : (y + 1) * ow] for y in range(oh)]
    for y in range(oh):
        for x in range(ow):
            r, g, b, a = out_pixels[y][x]
            if luminance(r, g, b) < 12:
                out_pixels[y][x] = (r, g, b, 0)

    canvas.putdata([px for row in out_pixels for px in row])
    canvas.save(path)

    left_empty = strip_empty(out_pixels, 0, min(3, ow))
    right_empty = strip_empty(out_pixels, max(0, ow - 3), ow)
    return component_count, (ow, oh), left_empty, right_empty


def main() -> None:
    for name in ICONS:
        path = ICONS_DIR / f"{name}.png"
        component_count, final_size, left_empty, right_empty = process_icon(path)
        print(
            f"{name}: component_count={component_count} final_size={final_size[0]}x{final_size[1]} "
            f"left_3px_empty={left_empty} right_3px_empty={right_empty}"
        )


if __name__ == "__main__":
    main()
