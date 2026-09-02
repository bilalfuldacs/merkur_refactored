#!/usr/bin/env python3
"""Write ICE 2027 home-screen PNG icons (no third-party deps)."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

NAVY = (2, 32, 82, 255)
PINK = (232, 49, 129, 255)
CYAN = (0, 159, 227, 255)
WHITE = (255, 255, 255, 255)


def png_bytes(width: int, height: int, rows: list[bytearray]) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = b"".join(b"\x00" + bytes(row) for row in rows)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def fill_rect(
    pixels: list[list[tuple[int, int, int, int]]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    color: tuple[int, int, int, int],
) -> None:
    size = len(pixels)
    x0 = max(0, x0)
    y0 = max(0, y0)
    x1 = min(size, x1)
    y1 = min(size, y1)
    for y in range(y0, y1):
        row = pixels[y]
        for x in range(x0, x1):
            row[x] = color


def in_rounded_square(x: int, y: int, size: int, radius: int) -> bool:
    if radius <= 0:
        return True
    cx0, cy0 = radius, radius
    cx1, cy1 = size - 1 - radius, size - 1 - radius
    if cx0 <= x <= cx1 or cy0 <= y <= cy1:
        return 0 <= x < size and 0 <= y < size
    corners = (
        (cx0, cy0),
        (cx1, cy0),
        (cx0, cy1),
        (cx1, cy1),
    )
    for cx, cy in corners:
        dx = x - cx
        dy = y - cy
        if dx * dx + dy * dy <= radius * radius:
            return True
    return False


def letter_blocks(size: int) -> list[tuple[float, float, float, float]]:
    """Unit-space rectangles for I, C, E (x, y, w, h) in a 0–1 box."""
    # I
    i = [(0.08, 0.08, 0.18, 0.12), (0.13, 0.20, 0.08, 0.60), (0.08, 0.80, 0.18, 0.12)]
    # C
    c = [
        (0.38, 0.08, 0.24, 0.12),
        (0.38, 0.20, 0.10, 0.60),
        (0.38, 0.80, 0.24, 0.12),
        (0.52, 0.20, 0.10, 0.12),
        (0.52, 0.68, 0.10, 0.12),
    ]
    # E
    e = [
        (0.70, 0.08, 0.22, 0.12),
        (0.70, 0.20, 0.10, 0.60),
        (0.70, 0.44, 0.18, 0.12),
        (0.70, 0.80, 0.22, 0.12),
    ]
    return i + c + e


def draw_icon(size: int) -> bytes:
    radius = int(size * 0.22)
    pixels: list[list[tuple[int, int, int, int]]] = [
        [(0, 0, 0, 0) for _ in range(size)] for _ in range(size)
    ]

    for y in range(size):
        for x in range(size):
            if in_rounded_square(x, y, size, radius):
                pixels[y][x] = NAVY

    band = int(size * 0.16)
    fill_rect(pixels, 0, 0, size, band + radius // 3, PINK)
    # Restore rounded top corners after the pink band.
    for y in range(band + radius // 3):
        for x in range(size):
            if not in_rounded_square(x, y, size, radius):
                pixels[y][x] = (0, 0, 0, 0)

    letter_top = int(size * 0.28)
    letter_h = int(size * 0.38)
    letter_left = int(size * 0.14)
    letter_w = int(size * 0.72)
    for ux, uy, uw, uh in letter_blocks(size):
        fill_rect(
            pixels,
            letter_left + int(ux * letter_w),
            letter_top + int(uy * letter_h),
            letter_left + int((ux + uw) * letter_w),
            letter_top + int((uy + uh) * letter_h),
            WHITE,
        )

    year_y = int(size * 0.74)
    year_h = int(size * 0.08)
    fill_rect(pixels, int(size * 0.22), year_y, int(size * 0.78), year_y + year_h, CYAN)

    rows = [bytearray(ch for px in row for ch in px) for row in pixels]
    return png_bytes(size, size, rows)


def main() -> None:
    out_dir = Path(__file__).resolve().parents[1] / "public" / "icons"
    out_dir.mkdir(parents=True, exist_ok=True)
    for size, name in ((180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")):
        path = out_dir / name
        path.write_bytes(draw_icon(size))
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
