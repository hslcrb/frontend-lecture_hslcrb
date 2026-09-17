#!/usr/bin/env python3
"""Generate a lens displacement map + specular rim PNG for SVG feImage/feDisplacementMap.

The displacement map encodes a squircle bezel refraction field:
  R channel = X displacement, G channel = Y displacement, 128 = neutral.
The specular map is a soft rim highlight (white on transparent) for the caustic edge.

Usage:
  python gen_glass_maps.py --width 320 --height 96 --radius 48 --bezel 22 \
      --out-dir ./assets/glass

Outputs <out-dir>/displacement-<W>x<H>.png and <out-dir>/specular-<W>x<H>.png,
then prints the exact feImage/feDisplacementMap snippet to paste.
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageFilter


def sdf_rounded_rect(w: int, h: int, r: float) -> np.ndarray:
    """Signed distance to a rounded rectangle. Negative inside."""
    ys, xs = np.mgrid[0:h, 0:w]
    px = xs + 0.5 - w / 2.0
    py = ys + 0.5 - h / 2.0
    qx = np.abs(px) - (w / 2.0 - r)
    qy = np.abs(py) - (h / 2.0 - r)
    outside = np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2)
    inside = np.minimum(np.maximum(qx, qy), 0)
    return outside + inside - r


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--width", type=int, required=True)
    ap.add_argument("--height", type=int, required=True)
    ap.add_argument("--radius", type=float, default=None, help="corner radius px (default: min(w,h)/2)")
    ap.add_argument("--bezel", type=float, default=None, help="bezel thickness px (default: min(w,h)/4)")
    ap.add_argument("--profile", choices=["squircle", "circle", "lip"], default="squircle")
    ap.add_argument("--out-dir", default="assets/glass")
    args = ap.parse_args()

    w, h = args.width, args.height
    r = args.radius if args.radius is not None else min(w, h) / 2.0
    bezel = args.bezel if args.bezel is not None else max(4.0, min(w, h) / 4.0)

    d = sdf_rounded_rect(w, h, r)          # negative inside
    depth = np.clip(-d / bezel, 0.0, 1.0)  # 0 at edge -> 1 at bezel end

    # Surface height profile h(x), x = normalized distance from the edge.
    x = depth
    if args.profile == "circle":
        prof = np.sqrt(np.clip(1 - (1 - x) ** 2, 0, None))
    elif args.profile == "lip":
        convex = (1 - (1 - x) ** 4) ** 0.25
        concave = 1 - convex
        s = x * x * x * (x * (x * 6 - 15) + 10)
        prof = convex * s + concave * (1 - s)
    else:  # squircle - Apple-like, softest flat-to-curve transition
        prof = (np.clip(1 - (1 - x) ** 4, 0, None)) ** 0.25

    # Refraction magnitude ~ slope of the surface, zero on the flat interior.
    slope = np.gradient(prof)
    mag = np.hypot(slope[0], slope[1])
    mag = np.where(depth >= 1.0, 0.0, mag)

    # Direction: outward normal of the shape (gradient of the SDF).
    gy, gx = np.gradient(d)
    n = np.hypot(gx, gy) + 1e-6
    ux, uy = gx / n, gy / n

    dx, dy = ux * mag, uy * mag
    # Normalize on a high percentile so a few corner pixels don't crush the whole field.
    peak = max(float(np.percentile(np.abs(np.stack([dx, dy])), 99.0)), 1e-6)
    dx, dy = np.clip(dx, -peak, peak), np.clip(dy, -peak, peak)
    dx, dy = dx / peak, dy / peak  # normalize to [-1, 1]

    rgb = np.zeros((h, w, 4), dtype=np.uint8)
    rgb[..., 0] = np.clip(128 + dx * 127, 0, 255).astype(np.uint8)
    rgb[..., 1] = np.clip(128 + dy * 127, 0, 255).astype(np.uint8)
    rgb[..., 2] = 128
    rgb[..., 3] = 255
    disp = Image.fromarray(rgb, "RGBA").filter(ImageFilter.GaussianBlur(1.2))

    # Specular rim: bright where the bezel curves hardest, brightest top-left.
    rim = np.clip(mag / (mag.max() + 1e-6), 0, 1) ** 0.8
    ys, xs = np.mgrid[0:h, 0:w]
    lighting = 0.35 + 0.65 * np.clip(1 - (xs / w * 0.6 + ys / h * 0.9), 0, 1)
    alpha = np.clip(rim * lighting * 255 * 1.6, 0, 255)
    spec = np.zeros((h, w, 4), dtype=np.uint8)
    spec[..., 0:3] = 255
    spec[..., 3] = alpha.astype(np.uint8)
    specular = Image.fromarray(spec, "RGBA").filter(ImageFilter.GaussianBlur(1.0))

    os.makedirs(args.out_dir, exist_ok=True)
    dp = os.path.join(args.out_dir, f"displacement-{w}x{h}.png")
    sp = os.path.join(args.out_dir, f"specular-{w}x{h}.png")
    disp.save(dp)
    specular.save(sp)

    scale = round(min(w, h) / 6)
    print(f"wrote {dp}\nwrote {sp}\n")
    print(f"""<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="lg-lens" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feImage href="{os.path.basename(dp)}" x="0" y="0" width="{w}" height="{h}" result="map"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="{scale}"
      xChannelSelector="R" yChannelSelector="G" result="refracted"/>
    <feGaussianBlur in="refracted" stdDeviation="0.6"/>
  </filter>
</defs></svg>""")


if __name__ == "__main__":
    main()
