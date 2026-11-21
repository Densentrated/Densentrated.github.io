#!/usr/bin/env python3
"""Generate the placeholder artwork for this portfolio.

Every image is an SVG shaded with a 4x4 ordered-Bayer dither so it matches the
low-fi CRT look of the site. Output is deterministic: same seed, same file.

    python3 tools/gen_artwork.py            # write everything to assets/

Replace the generated files with your own images whenever you like -- nothing
in the site depends on them being SVG.
"""

from __future__ import annotations

import math
import random
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"

# 4x4 ordered-dither threshold matrix.
BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
]
CELL = 3  # px per dither cell -> 12px pattern tile
INK = "#e8e4d8"  # paper-white ink; the page tints it with CSS


def dither_patterns() -> str:
    """One <pattern> per shading level, 1/16 .. 15/16 coverage."""
    out = []
    for level in range(1, 16):
        dots = []
        for y, row in enumerate(BAYER):
            for x, threshold in enumerate(row):
                if threshold < level:
                    dots.append(
                        f'<rect x="{x * CELL}" y="{y * CELL}" '
                        f'width="{CELL}" height="{CELL}"/>'
                    )
        tile = CELL * 4
        out.append(
            f'<pattern id="d{level}" width="{tile}" height="{tile}" '
            f'patternUnits="userSpaceOnUse" fill="{INK}">'
            + "".join(dots)
            + "</pattern>"
        )
    return "".join(out)


def ramp(t: float) -> str:
    """Map 0..1 brightness onto a dither pattern id."""
    level = max(1, min(15, int(round(t * 15))))
    return f"url(#d{level})"


# --------------------------------------------------------------------------
# compositions
# --------------------------------------------------------------------------


def comp_rings(w: int, h: int, rnd: random.Random) -> str:
    cx, cy = w * rnd.uniform(0.38, 0.62), h * rnd.uniform(0.38, 0.58)
    parts = []
    count = rnd.randint(16, 22)
    for i in range(count, 0, -1):
        r = (i / count) * max(w, h) * 0.62
        t = 1 - (i / count)
        parts.append(
            f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r:.0f}" '
            f'fill="{ramp(t * 0.62)}"/>'
        )
    # dark core keeps the falloff from blowing out to solid white
    core = max(w, h) * 0.16
    parts.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{core:.0f}" fill="#0a0a0c"/>')
    parts.append(
        f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{core:.0f}" fill="none" '
        f'stroke="{INK}" stroke-width="2"/>'
    )
    for i in range(5):
        y = h * (0.15 + i * 0.17)
        parts.append(
            f'<rect x="0" y="{y:.0f}" width="{w}" height="2" fill="{INK}" '
            f'opacity="{rnd.uniform(0.25, 0.7):.2f}"/>'
        )
    return "".join(parts)


def comp_mesh(w: int, h: int, rnd: random.Random) -> str:
    """Sine-displaced horizon mesh."""
    parts = []
    rows = 26
    amp = h * rnd.uniform(0.04, 0.09)
    freq = rnd.uniform(1.5, 3.4)
    phase = rnd.uniform(0, math.tau)
    for i in range(rows):
        f = i / (rows - 1)
        base = h * (0.18 + f * 0.7)
        pts = []
        for s in range(0, 49):
            x = w * s / 48
            y = base + math.sin(s / 48 * math.tau * freq + phase + f * 3) * amp * f
            pts.append(f"{x:.0f},{y:.0f}")
        parts.append(
            f'<polyline points="{" ".join(pts)}" fill="none" stroke="{INK}" '
            f'stroke-width="{1 + f * 1.8:.1f}" opacity="{0.2 + f * 0.6:.2f}"/>'
        )
    sun = h * 0.2
    parts.insert(
        0,
        f'<circle cx="{w * 0.5:.0f}" cy="{sun:.0f}" r="{w * 0.26:.0f}" fill="{ramp(0.55)}"/>',
    )
    return "".join(parts)


def comp_grid(w: int, h: int, rnd: random.Random) -> str:
    parts = []
    cols, rows = 9, 11
    cw, ch = w / cols, h / rows
    for r in range(rows):
        for c in range(cols):
            d = math.hypot(c - cols / 2, (r - rows / 2) * 0.8) / (cols * 0.7)
            t = max(0.0, min(1.0, 1.05 - d + rnd.uniform(-0.16, 0.16)))
            if t < 0.08:
                continue
            inset = (1 - t) * min(cw, ch) * 0.42
            parts.append(
                f'<rect x="{c * cw + inset:.0f}" y="{r * ch + inset:.0f}" '
                f'width="{cw - inset * 2:.0f}" height="{ch - inset * 2:.0f}" '
                f'fill="{ramp(t)}"/>'
            )
    return "".join(parts)


def comp_burst(w: int, h: int, rnd: random.Random) -> str:
    cx, cy = w * 0.5, h * 0.52
    parts = [f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{w * 0.33:.0f}" fill="{ramp(0.75)}"/>']
    spokes = rnd.randint(44, 64)
    for i in range(spokes):
        a = i / spokes * math.tau + rnd.uniform(-0.02, 0.02)
        r1 = w * rnd.uniform(0.3, 0.38)
        r2 = w * rnd.uniform(0.5, 0.95)
        parts.append(
            f'<line x1="{cx + math.cos(a) * r1:.0f}" y1="{cy + math.sin(a) * r1:.0f}" '
            f'x2="{cx + math.cos(a) * r2:.0f}" y2="{cy + math.sin(a) * r2:.0f}" '
            f'stroke="{INK}" stroke-width="{rnd.uniform(0.8, 3.2):.1f}" '
            f'opacity="{rnd.uniform(0.2, 0.8):.2f}"/>'
        )
    parts.append(
        f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{w * 0.17:.0f}" fill="#0a0a0c"/>'
    )
    return "".join(parts)


def comp_contour(w: int, h: int, rnd: random.Random) -> str:
    """Nested topographic blobs."""
    parts = []
    cx, cy = w * rnd.uniform(0.4, 0.6), h * rnd.uniform(0.42, 0.58)
    seeds = [rnd.uniform(0, math.tau) for _ in range(4)]
    layers = 14
    for i in range(layers, 0, -1):
        f = i / layers
        pts = []
        for s in range(72):
            a = s / 72 * math.tau
            wob = sum(math.sin(a * (k + 2) + seeds[k]) for k in range(4)) / 4
            r = max(w, h) * 0.46 * f * (1 + wob * 0.22)
            pts.append(f"{cx + math.cos(a) * r:.0f},{cy + math.sin(a) * r * 0.95:.0f}")
        shade = ramp(1 - f) if i % 2 == 0 else "none"
        parts.append(
            f'<polygon points="{" ".join(pts)}" fill="{shade}" stroke="{INK}" '
            f'stroke-width="1.4" opacity="0.85"/>'
        )
    return "".join(parts)


def comp_slice(w: int, h: int, rnd: random.Random) -> str:
    """Horizontal scan-bars with glitch displacement."""
    parts = []
    y = 0.0
    while y < h:
        bh = rnd.uniform(h * 0.012, h * 0.075)
        t = 1 - (y / h) * 0.85
        dx = rnd.choice([0, 0, 0, rnd.uniform(-w * 0.12, w * 0.12)])
        inset = rnd.uniform(0, w * 0.2)
        parts.append(
            f'<rect x="{inset + dx:.0f}" y="{y:.0f}" width="{w - inset * 2:.0f}" '
            f'height="{bh:.0f}" fill="{ramp(t * rnd.uniform(0.55, 1.0))}"/>'
        )
        y += bh + rnd.uniform(2, h * 0.02)
    parts.append(
        f'<rect x="{w * 0.5 - 2:.0f}" y="0" width="4" height="{h}" fill="{INK}" opacity="0.5"/>'
    )
    return "".join(parts)


# --------------------------------------------------------------------------
# project-specific compositions
#
# The ones above are abstract and reusable. These are drawn to say something
# about a particular project, so a cover isn't just decoration.
# --------------------------------------------------------------------------


def _grey(lum: float) -> str:
    """A solid tone between the page background and the ink, for smooth areas."""
    lum = max(0.0, min(1.0, lum))
    return "#%02x%02x%02x" % (
        int(0x0A + (0xE8 - 0x0A) * lum),
        int(0x0A + (0xE4 - 0x0A) * lum),
        int(0x0C + (0xD8 - 0x0C) * lum),
    )


def _sphere_lum(nx: float, ny: float, light) -> float | None:
    """Lambert brightness at a point on the unit sphere, None if off it.

    Shading by plain distance from a point looks like a torch shone at a
    circle. Taking the actual surface normal and dotting it with the light
    gives the falloff and the curved terminator that read as a sphere.
    """
    nz2 = 1.0 - nx * nx - ny * ny
    if nz2 <= 0.0:
        return None
    d = nx * light[0] + ny * light[1] + math.sqrt(nz2) * light[2]
    if d < 0.0:
        d = 0.0
    # ambient floor so the dark side isn't a hole, gamma to soften the falloff
    return 0.06 + 0.94 * (d**0.85)


def comp_sphere(w: int, h: int, rnd: random.Random) -> str:
    """A lit sphere, smooth on the left and dithered on the right.

    Flat tonal bands don't say much. A shaded sphere cut down the middle shows
    the actual transformation: continuous tone on one side, the same shading
    quantised into dot texture on the other, with the palette underneath.

    Both halves come from the same lighting model, so the only thing that
    changes at the seam is the number of levels available to describe it.
    """
    # Centre the sphere and the chip row as one block, so the top and bottom
    # margins come out even instead of the sphere riding high.
    r = min(w, h) * 0.33
    chip = w * 0.095
    chip_gap = h * 0.055
    block = 2 * r + chip_gap + chip
    top = (h - block) / 2

    cx, cy = w * 0.5, top + r
    # Oblique, not head-on. A light pointing at the viewer lights the whole
    # visible disc evenly and the sphere reads as a flat white circle; swinging
    # it round puts a real terminator on the thing.
    light = (-0.50, -0.55, 0.42)
    mag = math.sqrt(sum(c * c for c in light))
    light = tuple(c / mag for c in light)

    # The brightest point is where the normal lines up with the light.
    hx, hy = cx + light[0] * r, cy + light[1] * r

    # Smooth half: one radial gradient, with stops sampled off the same Lambert
    # curve so the two halves agree where they meet. The gradient's radius is
    # 2r, so offset f sits at a spatial distance of f * 2r from the highlight.
    span = math.hypot(cx - hx, cy - hy)
    dx, dy = (cx - hx) / span, (cy - hy) / span
    stops = []
    for s in range(11):
        f = s / 10
        d = f * 2 * r
        lum = _sphere_lum((hx + dx * d - cx) / r, (hy + dy * d - cy) / r, light)
        stops.append(
            f'<stop offset="{f:.3f}" stop-color="{_grey(0.06 if lum is None else lum)}"/>'
        )

    parts = [
        "<defs>"
        f'<radialGradient id="sg" cx="{(hx - (cx - r)) / (2 * r):.3f}" '
        f'cy="{(hy - (cy - r)) / (2 * r):.3f}" r="1.0">' + "".join(stops) + "</radialGradient>"
        f'<clipPath id="sph"><circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r:.0f}"/></clipPath>'
        "</defs>"
    ]
    parts.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r:.0f}" fill="url(#sg)"/>')

    # Dithered half: the same lighting, scanned row by row and quantised to
    # the fifteen available levels. Runs of equal level are merged.
    rows = 58
    row_h = 2 * r / rows
    step = 2 * r / 86
    inner = []
    for i in range(rows):
        y0 = cy - r + row_h * i
        ny = (y0 + row_h / 2 - cy) / r
        if abs(ny) >= 0.999:
            continue
        half = math.sqrt(1 - ny * ny) * r
        runs = []
        x = cx
        while x < cx + half - 1e-6:
            xe = min(x + step, cx + half)
            lum = _sphere_lum(((x + xe) / 2 - cx) / r, ny, light)
            if lum is not None:
                level = max(1, min(15, int(round(lum * 15))))
                if runs and runs[-1][0] == level:
                    runs[-1][2] = xe
                else:
                    runs.append([level, x, xe])
            x = xe
        for level, a, b in runs:
            inner.append(
                f'<rect x="{a:.1f}" y="{y0:.1f}" width="{b - a:.1f}" '
                f'height="{row_h + 0.7:.1f}" fill="url(#d{level})"/>'
            )
    parts.append(
        f'<g clip-path="url(#sph)">'
        f'<rect x="{cx:.0f}" y="{cy - r:.0f}" width="{r:.0f}" '
        f'height="{2 * r:.0f}" fill="#0a0a0c"/>' + "".join(inner) + "</g>"
    )

    # The seam between the two treatments.
    parts.append(
        f'<line x1="{cx:.0f}" y1="{cy - r - 16:.0f}" x2="{cx:.0f}" '
        f'y2="{cy + r + 16:.0f}" stroke="{INK}" stroke-width="1.5" opacity="0.75"/>'
    )

    # The palette you reduced it to, sitting under the sphere.
    gap = chip * 0.32
    x0 = (w - (5 * chip + 4 * gap)) / 2
    y0 = top + 2 * r + chip_gap
    for i, level in enumerate([14, 11, 8, 5, 2]):
        x = x0 + i * (chip + gap)
        parts.append(
            f'<rect x="{x:.0f}" y="{y0:.0f}" width="{chip:.0f}" '
            f'height="{chip:.0f}" fill="#0a0a0c"/>'
        )
        parts.append(
            f'<rect x="{x:.0f}" y="{y0:.0f}" width="{chip:.0f}" '
            f'height="{chip:.0f}" fill="url(#d{level})" '
            f'stroke="{INK}" stroke-width="1.5"/>'
        )
    return "".join(parts)


def comp_graph(w: int, h: int, rnd: random.Random) -> str:
    """A note graph with one query node and its nearest neighbours lit."""
    pts = []
    for i in range(30):
        if i < 12:  # a dense cluster, the way related notes bunch up
            a = rnd.uniform(0, math.tau)
            rr = rnd.uniform(0, 0.2)
            pts.append((w * (0.5 + math.cos(a) * rr), h * (0.45 + math.sin(a) * rr * 1.15)))
        else:
            # kept off the edges: covers are object-fit:cover, so a little
            # gets trimmed depending on the window's aspect
            pts.append((w * rnd.uniform(0.1, 0.9), h * rnd.uniform(0.13, 0.87)))

    q = 0
    order = sorted(
        range(1, len(pts)),
        key=lambda j: math.hypot(pts[j][0] - pts[q][0], pts[j][1] - pts[q][1]),
    )
    near = set(order[:5])

    parts = []
    limit = min(w, h) * 0.3
    for i in range(len(pts)):
        for j in range(i + 1, len(pts)):
            if math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) > limit:
                continue
            parts.append(
                f'<line x1="{pts[i][0]:.0f}" y1="{pts[i][1]:.0f}" '
                f'x2="{pts[j][0]:.0f}" y2="{pts[j][1]:.0f}" '
                f'stroke="{INK}" stroke-width="1" opacity="0.18"/>'
            )
    for j in near:  # the retrieved set
        parts.append(
            f'<line x1="{pts[q][0]:.0f}" y1="{pts[q][1]:.0f}" '
            f'x2="{pts[j][0]:.0f}" y2="{pts[j][1]:.0f}" '
            f'stroke="{INK}" stroke-width="2.5" opacity="0.9"/>'
        )

    for i, (x, y) in enumerate(pts):
        if i == q:
            parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{w * 0.085:.0f}" fill="{ramp(0.5)}"/>')
            parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{w * 0.028:.0f}" fill="{INK}"/>')
        elif i in near:
            parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{w * 0.042:.0f}" fill="{ramp(0.42)}"/>')
            parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{w * 0.016:.0f}" fill="{INK}"/>')
        else:
            parts.append(
                f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{w * 0.012:.0f}" '
                f'fill="{INK}" opacity="0.55"/>'
            )
    return "".join(parts)


def comp_cosine(w: int, h: int, rnd: random.Random) -> str:
    """Vectors around a circle, with the angle between two far-apart ones."""
    # Dead centre, and sized off the short edge so the margins stay even.
    cx, cy = w * 0.5, h * 0.5
    radius = min(w, h) * 0.37
    parts = [
        f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{radius:.0f}" fill="none" '
        f'stroke="{INK}" stroke-width="1.5" opacity="0.5"/>'
    ]

    for _ in range(26):  # the rest of the vocabulary
        a = rnd.uniform(0, math.tau)
        ex, ey = cx + math.cos(a) * radius, cy + math.sin(a) * radius
        parts.append(
            f'<line x1="{cx:.0f}" y1="{cy:.0f}" x2="{ex:.0f}" y2="{ey:.0f}" '
            f'stroke="{INK}" stroke-width="1" opacity="0.22"/>'
        )
        parts.append(f'<circle cx="{ex:.0f}" cy="{ey:.0f}" r="3" fill="{INK}" opacity="0.4"/>')

    # Mirrored about the vertical axis: the pair still reads as "a long way
    # apart", but the shaded wedge sits square in the frame instead of
    # dragging all the weight into one corner.
    a1, a2 = math.radians(-165), math.radians(-15)
    wedge = [f"{cx:.0f},{cy:.0f}"]
    for s in range(41):
        a = a1 + (a2 - a1) * s / 40
        wedge.append(f"{cx + math.cos(a) * radius * 0.82:.0f},{cy + math.sin(a) * radius * 0.82:.0f}")
    parts.append(f'<polygon points="{" ".join(wedge)}" fill="{ramp(0.3)}"/>')

    for a in (a1, a2):
        ex, ey = cx + math.cos(a) * radius, cy + math.sin(a) * radius
        parts.append(
            f'<line x1="{cx:.0f}" y1="{cy:.0f}" x2="{ex:.0f}" y2="{ey:.0f}" '
            f'stroke="{INK}" stroke-width="3.5"/>'
        )
        parts.append(f'<circle cx="{ex:.0f}" cy="{ey:.0f}" r="{w * 0.022:.0f}" fill="{INK}"/>')
    parts.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{w * 0.012:.0f}" fill="{INK}"/>')
    return "".join(parts)


def comp_strata(w: int, h: int, rnd: random.Random) -> str:
    """Three layers of a data lake, getting more ordered on the way down.

    Raw arrives as scattered noise, bronze is aligned but ragged, gold is
    solid partitioned blocks. The verticals are the date partitions, which
    run through all three layers.
    """
    parts = []
    pad = h * 0.09
    band = (h - pad * 2) / 3
    cols = 7
    x0 = w * 0.07
    cw = (w - x0 * 2) / cols

    for c in range(cols + 1):  # partition boundaries
        x = x0 + c * cw
        parts.append(
            f'<line x1="{x:.0f}" y1="{pad:.0f}" x2="{x:.0f}" '
            f'y2="{h - pad:.0f}" stroke="{INK}" stroke-width="1" opacity="0.22"/>'
        )

    for b in range(3):
        y = pad + b * band
        parts.append(
            f'<line x1="{x0:.0f}" y1="{y:.0f}" x2="{x0 + cols * cw:.0f}" '
            f'y2="{y:.0f}" stroke="{INK}" stroke-width="1.6" opacity="0.85"/>'
        )
        for c in range(cols):
            cell = x0 + c * cw
            if b == 0:  # raw — whatever the feed sent
                for _ in range(16):
                    parts.append(
                        f'<rect x="{cell + rnd.uniform(cw * 0.08, cw * 0.88):.0f}" '
                        f'y="{y + rnd.uniform(band * 0.18, band * 0.88):.0f}" '
                        f'width="{rnd.uniform(2, 7):.0f}" height="{rnd.uniform(2, 5):.0f}" '
                        f'fill="{INK}" opacity="{rnd.uniform(0.3, 0.85):.2f}"/>'
                    )
            elif b == 1:  # bronze — decoded into rows, still ragged
                for row in range(7):
                    parts.append(
                        f'<rect x="{cell + cw * 0.08:.0f}" '
                        f'y="{y + band * 0.2 + row * band * 0.09:.0f}" '
                        f'width="{cw * rnd.uniform(0.28, 0.84):.0f}" '
                        f'height="{band * 0.045:.0f}" fill="{INK}" opacity="0.6"/>'
                    )
            else:  # gold — one dense block per partition
                bh = band * rnd.uniform(0.44, 0.7)
                parts.append(
                    f'<rect x="{cell + cw * 0.08:.0f}" y="{y + band * 0.18:.0f}" '
                    f'width="{cw * 0.84:.0f}" height="{bh:.0f}" '
                    f'fill="{ramp(rnd.uniform(0.45, 0.9))}" stroke="{INK}" stroke-width="1"/>'
                )
    return "".join(parts)


def comp_rank(w: int, h: int, rnd: random.Random) -> str:
    """Ranked bars — a scored list, best first."""
    parts = []
    n = 18
    gap = h / n
    for i in range(n):
        f = i / (n - 1)
        bw = w * (0.92 - f * 0.72) * rnd.uniform(0.9, 1.0)
        y = i * gap + gap * 0.18
        parts.append(
            f'<rect x="{w * 0.05:.0f}" y="{y:.0f}" width="{bw:.0f}" '
            f'height="{gap * 0.6:.0f}" fill="{ramp(0.95 - f * 0.75)}"/>'
        )
        parts.append(
            f'<rect x="{w * 0.05:.0f}" y="{y:.0f}" width="{bw:.0f}" '
            f'height="{gap * 0.6:.0f}" fill="none" stroke="{INK}" '
            f'stroke-width="1" opacity="0.35"/>'
        )
    return "".join(parts)


COMPS = [comp_rings, comp_mesh, comp_grid, comp_burst, comp_contour, comp_slice]


def build(name: str, w: int, h: int, seed: int, comp) -> None:
    rnd = random.Random(seed)
    body = comp(w, h, rnd)
    # hairline registration marks, the printer's-proof touch
    m = 18
    marks = "".join(
        f'<path d="M{x} {y}h{d*m}M{x} {y}v{e*m}" stroke="{INK}" stroke-width="1.5" opacity="0.6"/>'
        for x, y, d, e in [
            (m, m, 1, 1),
            (w - m, m, -1, 1),
            (m, h - m, 1, -1),
            (w - m, h - m, -1, -1),
        ]
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" role="img" aria-label="abstract dithered artwork">'
        f"<defs>{dither_patterns()}</defs>"
        f'<rect width="{w}" height="{h}" fill="#0a0a0c"/>'
        f"{body}{marks}"
        f"</svg>"
    )
    (ASSETS / name).write_text(svg, encoding="utf-8")
    print(f"  {name}  {len(svg) / 1024:.1f} kB")


# Artwork tied to a specific project. Covers are portrait (they fill the
# showcase window), plates are landscape (they sit inside a case study).
PROJECT_ART = [
    # name                       w     h   seed  composition
    ("densendither-cover.svg", 1000, 1250, 1007, comp_sphere),
    ("densendither-plate.svg", 1400, 900, 1013, comp_grid),
    ("vex-cover.svg", 1000, 1250, 2003, comp_graph),
    ("vex-plate.svg", 1400, 900, 2011, comp_contour),
    ("words-cover.svg", 1000, 1250, 3001, comp_cosine),
    ("words-plate.svg", 1400, 900, 3019, comp_rank),
    ("chandb-cover.svg", 1000, 1250, 5003, comp_strata),
    ("chandb-plate.svg", 1400, 900, 5011, comp_strata),
]

# Abstract spares, for projects that don't have their own drawing yet.
SPARE_ART = [
    ("spare-01.svg", 1000, 1250, 4007, comp_burst),
    ("spare-02.svg", 1000, 1250, 4013, comp_slice),
    ("spare-03.svg", 1000, 1250, 4019, comp_mesh),
    ("spare-plate.svg", 1400, 900, 4027, comp_rings),
]


def main() -> None:
    ASSETS.mkdir(exist_ok=True)
    print("project art:")
    for name, w, h, seed, comp in PROJECT_ART:
        build(name, w, h, seed, comp)
    print("spares:")
    for name, w, h, seed, comp in SPARE_ART:
        build(name, w, h, seed, comp)
    print("social:")
    build("og.svg", 1200, 630, 99, comp_graph)


if __name__ == "__main__":
    main()
