"""Designs de pulls pour Printify.

Chaque design est un bloc HTML de 900 px de large, capturé ensuite à l'échelle 5
(4500 px de large, 300 DPI) sur fond transparent par render.mjs.
Deux variantes d'encre : "clair" (pour pulls clairs) et "fonce" (pour pulls foncés).
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BUILD = ROOT / "build"

VARIANTS = {
    "pour-pull-clair": {"ink": "#1f2421", "accent": "#c0442c", "soft": "#2f6b5e", "gold": "#b8862b"},
    "pour-pull-fonce": {"ink": "#f5efe4", "accent": "#f19a62", "soft": "#9fd3c4", "gold": "#f2c76b"},
}

CSS = """
@font-face { font-family: "Archivo Black"; src: url("../fonts/ArchivoBlack.woff2"); }
@font-face { font-family: "Caveat"; src: url("../fonts/Caveat.woff2"); font-weight: 400 700; }
@font-face { font-family: "Press Start 2P"; src: url("../fonts/PressStart2P.woff2"); }
@font-face { font-family: "Fraunces"; src: url("../fonts/Fraunces.woff2"); font-weight: 100 900; }
@font-face { font-family: "Fraunces"; src: url("../fonts/FrauncesItalic.woff2"); font-style: italic; font-weight: 100 900; }
@font-face { font-family: "Karla"; src: url("../fonts/Karla.woff2"); font-weight: 200 800; }
html, body { margin: 0; background: transparent; }
body { display: flex; flex-direction: column; gap: 80px; padding: 40px; width: 980px; }
.design { width: 900px; color: var(--ink); display: flex; flex-direction: column; align-items: center; text-align: center; padding: 20px 0; }
svg { display: block; overflow: visible; }
"""


def cafe():
    return """
<div class="design" id="cafe-dabord">
  <svg width="210" height="200" viewBox="0 0 210 200" fill="none" stroke="var(--ink)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
    <path d="M70 18 q-14 16 0 32 q14 16 0 32" stroke="var(--accent)"/>
    <path d="M115 10 q-14 16 0 32 q14 16 0 32" stroke="var(--accent)"/>
    <path d="M20 100 h140 v40 a50 50 0 0 1 -50 50 h-40 a50 50 0 0 1 -50 -50 z"/>
    <path d="M160 112 h12 a22 22 0 0 1 0 44 h-14"/>
  </svg>
  <div style="font-family:'Archivo Black';font-size:150px;line-height:.92;letter-spacing:-4px;margin-top:30px">CAFÉ<br>D'ABORD.</div>
  <div style="font-family:Caveat;font-weight:700;font-size:118px;color:var(--accent);margin-top:18px;transform:rotate(-3deg)">questions ensuite.</div>
</div>"""


def club_fatigues():
    return """
<div class="design" id="club-des-fatigues">
  <svg width="900" height="230" viewBox="0 0 900 230">
    <defs><path id="arc" d="M90 220 Q450 -40 810 220"/></defs>
    <text font-family="Archivo Black" font-size="92" letter-spacing="10" fill="var(--soft)" text-anchor="middle">
      <textPath href="#arc" startOffset="50%">CLUB DES</textPath></text>
  </svg>
  <div style="font-family:'Archivo Black';font-size:150px;line-height:1;letter-spacing:-1px;margin-top:-6px;
       -webkit-text-stroke:0;">FATIGUÉS</div>
  <div style="display:flex;align-items:center;gap:26px;margin-top:26px;font-family:Karla;font-weight:700;font-size:40px;letter-spacing:8px;white-space:nowrap;color:var(--soft)">
    <span style="width:60px;height:7px;background:var(--soft)"></span>MEMBRE DEPUIS TOUJOURS<span style="width:60px;height:7px;background:var(--soft)"></span>
  </div>
  <div style="font-family:Caveat;font-weight:700;font-size:84px;margin-top:10px;color:var(--accent)">fondé un lundi matin</div>
</div>"""


def maman_avion():
    return """
<div class="design" id="maman-mode-avion">
  <div style="font-family:Fraunces;font-style:italic;font-weight:600;font-size:250px;line-height:1;letter-spacing:-6px">Maman</div>
  <div style="display:flex;align-items:center;gap:30px;margin-top:20px">
    <svg width="330" height="70" viewBox="0 0 330 70"><path d="M5 50 Q120 -10 320 35" fill="none" stroke="var(--accent)" stroke-width="7" stroke-dasharray="4 22" stroke-linecap="round"/></svg>
    <svg width="120" height="120" viewBox="0 0 24 24" style="transform:rotate(45deg)"><path fill="var(--accent)" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>
  </div>
  <div style="font-family:Karla;font-weight:800;font-size:76px;letter-spacing:22px;margin-top:10px">EN MODE AVION</div>
  <div style="font-family:Karla;font-weight:700;font-size:44px;letter-spacing:14px;margin-top:24px;white-space:nowrap;color:var(--accent)">NE PAS DÉRANGER</div>
</div>"""


def dimanche():
    return """
<div class="design" id="dimanche-sacre">
  <div style="font-family:Karla;font-weight:700;font-size:46px;letter-spacing:20px;color:var(--soft)">LE DIMANCHE</div>
  <div style="font-family:Fraunces;font-style:italic;font-weight:500;font-size:190px;line-height:1;letter-spacing:-4px;margin-top:16px">c'est sacré.</div>
  <div style="width:520px;height:6px;background:var(--gold);margin:46px 0 40px;border-radius:3px"></div>
  <div style="display:flex;gap:28px;align-items:center;font-family:Karla;font-weight:700;font-size:42px;letter-spacing:3px;white-space:nowrap">
    <span>PLAID</span><span style="color:var(--gold)">✦</span><span>SÉRIE</span><span style="color:var(--gold)">✦</span><span>CHOCOLAT CHAUD</span>
  </div>
</div>"""


def flemme():
    return """
<div class="design" id="bonjour-la-flemme">
  <svg width="300" height="170" viewBox="0 0 300 170" fill="none" stroke="var(--gold)" stroke-width="12" stroke-linecap="round">
    <path d="M40 160 a110 110 0 0 1 220 0"/>
    <path d="M150 10 v26 M60 46 l18 18 M240 46 l-18 18 M10 120 h26 M290 120 h-26"/>
    <path d="M110 130 q14 -14 28 0 M162 130 q14 -14 28 0" stroke="var(--ink)" stroke-width="9"/>
  </svg>
  <div style="font-family:Caveat;font-weight:700;font-size:230px;line-height:.9;margin-top:24px">Bonjour</div>
  <div style="font-family:Caveat;font-weight:700;font-size:230px;line-height:.9;color:var(--accent)">la flemme</div>
  <div style="font-family:Karla;font-weight:700;font-size:40px;letter-spacing:14px;margin-top:36px;opacity:.85">OUVERT DE 14H À 14H15</div>
</div>"""


def en_retard():
    return """
<div class="design" id="pas-en-retard">
  <svg width="170" height="170" viewBox="0 0 100 100" fill="none" stroke="var(--ink)" stroke-width="7" stroke-linecap="round">
    <circle cx="50" cy="50" r="42"/><path d="M50 24 v26 l18 12" stroke="var(--accent)"/>
  </svg>
  <div style="font-family:'Archivo Black';font-size:96px;line-height:1.02;margin-top:40px;letter-spacing:-1px">JE NE SUIS PAS<br>EN RETARD.</div>
  <div style="font-family:Fraunces;font-style:italic;font-weight:500;font-size:84px;line-height:1.1;margin-top:30px;color:var(--accent)">Je suis en avance<br>pour demain.</div>
</div>"""


PIXEL_TREE = [
    "....X....",
    "...XXX...",
    "..XXOXX..",
    "...XXX...",
    "..XXXXX..",
    ".XOXXXOX.",
    "..XXXXX..",
    ".XXXXXXX.",
    "XXXXOXXXX",
    "....T....",
    "....T....",
]
PIXEL_FLAKE = [
    "...X...",
    ".X.X.X.",
    "..XXX..",
    "XXXOXXX",
    "..XXX..",
    ".X.X.X.",
    "...X...",
]


def pixel_svg(grid, size, colors):
    rows, cols = len(grid), len(grid[0])
    rects = "".join(
        f'<rect x="{c * size}" y="{r * size}" width="{size}" height="{size}" fill="{colors[ch]}"/>'
        for r, line in enumerate(grid) for c, ch in enumerate(line) if ch != ".")
    return f'<svg width="{cols * size}" height="{rows * size}">{rects}</svg>'


def noel_pixel():
    tree = pixel_svg(PIXEL_TREE, 16, {"X": "var(--soft)", "O": "var(--accent)", "T": "var(--gold)"})
    flake = pixel_svg(PIXEL_FLAKE, 14, {"X": "var(--ink)", "O": "var(--accent)"})
    zig = "".join(f'<rect x="{i * 30}" y="{(i % 2) * 15}" width="15" height="15" fill="var(--accent)"/>' for i in range(28))
    band = f'<svg width="825" height="30">{zig}</svg>'
    return f"""
<div class="design" id="pull-moche-de-noel">
  <div style="display:flex;gap:70px;align-items:flex-end">{flake}{tree}{flake}{tree}{flake}</div>
  <div style="margin-top:44px">{band}</div>
  <div style="font-family:'Press Start 2P';font-size:62px;line-height:1.5;margin-top:44px">PULL MOCHE<br>DE NOËL</div>
  <div style="font-family:'Press Start 2P';font-size:40px;color:var(--accent);margin-top:26px;letter-spacing:4px">— OFFICIEL —</div>
  <div style="margin-top:44px">{band}</div>
</div>"""


def vin_chaud():
    star = '<svg width="54" height="54" viewBox="0 0 24 24"><path fill="var(--gold)" d="M12 1l2.6 8.2H23l-6.8 5 2.6 8.3L12 17.4 5.2 22.5l2.6-8.3L1 9.2h8.4z"/></svg>'
    return f"""
<div class="design" id="vin-chaud">
  <div style="display:flex;gap:40px;align-items:center">{star}<span style="font-family:Karla;font-weight:700;font-size:42px;letter-spacing:16px;color:var(--soft)">SAISON DES FÊTES</span>{star}</div>
  <div style="font-family:Fraunces;font-weight:700;font-size:200px;line-height:.95;letter-spacing:-5px;margin-top:30px">Vin chaud</div>
  <div style="font-family:Caveat;font-weight:700;font-size:120px;color:var(--accent);line-height:1">&amp; bonne humeur</div>
  <div style="font-family:Karla;font-weight:700;font-size:38px;letter-spacing:12px;margin-top:34px;opacity:.85">CANNELLE · ORANGE · COPAINS</div>
</div>"""


DESIGNS = [cafe, club_fatigues, maman_avion, dimanche, flemme, en_retard, noel_pixel, vin_chaud]

if __name__ == "__main__":
    BUILD.mkdir(exist_ok=True)
    body = "".join(fn() for fn in DESIGNS)
    for name, v in VARIANTS.items():
        tokens = ";".join(f"--{k}:{val}" for k, val in v.items())
        html = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>{CSS}:root{{{tokens}}}</style>'
                f"</head><body>{body}</body></html>")
        (BUILD / f"{name}.html").write_text(html, encoding="utf-8")
        print("ok", name)
