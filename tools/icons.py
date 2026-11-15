# Draws the Ringlock app icons (brass turntable with coloured marbles on green felt).
# Run: python3 tools/icons.py   (needs Pillow). Output: src/icons/*.png
import math, os
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'icons')
FELT, FELT2, BRASS, BRASS_D = (16, 53, 47), (23, 70, 62), (214, 169, 76), (150, 110, 40)
MARBLES = [(232, 84, 72), (76, 154, 232), (240, 196, 64), (98, 196, 120), (176, 110, 220), (240, 140, 60)]

def draw(size, safe=1.0, rounded=False):
    S = size * 4  # supersample
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, S, S], fill=FELT)
    c = S / 2
    k = S * safe / 2  # radius of usable area
    # soft vignette glow
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([c - k * 0.95, c - k * 0.95, c + k * 0.95, c + k * 0.95], fill=FELT2 + (255,))
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.05))
    im.alpha_composite(glow)
    d = ImageDraw.Draw(im)
    # brass ring
    R, w = k * 0.70, k * 0.13
    d.ellipse([c - R - w, c - R - w, c + R + w, c + R + w], fill=BRASS_D)
    d.ellipse([c - R - w * 0.75, c - R - w * 0.75, c + R + w * 0.75, c + R + w * 0.75], fill=BRASS)
    d.ellipse([c - R + w * 0.75, c - R + w * 0.75, c + R - w * 0.75, c + R - w * 0.75], fill=BRASS_D)
    d.ellipse([c - R + w, c - R + w, c + R - w, c + R - w], fill=FELT)
    # marbles in cups around the ring
    n, mr = 6, k * 0.14
    for i in range(n):
        a = -math.pi / 2 + i * 2 * math.pi / n
        x, y = c + R * math.cos(a), c + R * math.sin(a)
        d.ellipse([x - mr * 1.12, y - mr * 1.12, x + mr * 1.12, y + mr * 1.12], fill=(40, 28, 8))
        d.ellipse([x - mr, y - mr, x + mr, y + mr], fill=MARBLES[i])
        h = mr * 0.38
        d.ellipse([x - mr * 0.45 - h, y - mr * 0.45 - h, x - mr * 0.45 + h, y - mr * 0.45 + h], fill=(255, 255, 255, 170))
    # brass lock hub in the centre
    hr = k * 0.22
    d.ellipse([c - hr, c - hr * 0.55, c + hr, c + hr * 1.25], fill=BRASS)
    d.arc([c - hr * 0.62, c - hr * 1.15, c + hr * 0.62, c + hr * 0.45], 180, 360, fill=BRASS, width=int(hr * 0.28))
    d.ellipse([c - hr * 0.18, c + hr * 0.05, c + hr * 0.18, c + hr * 0.41], fill=(43, 29, 0))
    d.rectangle([c - hr * 0.07, c + hr * 0.3, c + hr * 0.07, c + hr * 0.8], fill=(43, 29, 0))
    if rounded:
        mask = Image.new('L', (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
        im.putalpha(mask)
    return im.resize((size, size), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
draw(192).save(os.path.join(OUT, 'icon-192.png'))
draw(512).save(os.path.join(OUT, 'icon-512.png'))
draw(512, safe=0.78).save(os.path.join(OUT, 'icon-maskable-512.png'))
draw(180).convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png'))
draw(64, rounded=True).save(os.path.join(OUT, 'favicon.png'))
print('icons written to', os.path.abspath(OUT))
