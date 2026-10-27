# -*- coding: utf-8 -*-
"""Accroche plein écran et bandeau « Abonne-toi » du milieu (partagés par engine.py)."""
import math

from render import INK, f, ease, lerp, circle, rect, path, text_el

_FONT = {}


def text_w(txt, size):
    from PIL import ImageFont
    if size not in _FONT:
        _FONT[size] = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf", size)
    return _FONT[size].getlength(txt)


def hook_svg(text, u, dur):
    """Gros texte d'accroche jaune, visible dès la première image."""
    if u < 0 or u > dur + 0.3:
        return ""
    words = text.split()
    lines_ = [text]
    if text_w(text, 92) > 900 and len(words) > 1:
        k = min(range(1, len(words)), key=lambda i: abs(len(" ".join(words[:i])) - len(text) / 2))
        lines_ = [" ".join(words[:k]), " ".join(words[k:])]
    size = 92
    while max(text_w(l_, size) for l_ in lines_) > 920 and size > 60:
        size -= 4
    sc = 1.45 - 0.45 * ease(u / 0.22)
    out_a = 1.0 if u < dur else max(0.0, 1 - (u - dur) / 0.3)
    shake = math.sin(u * 60) * 10 * max(0.0, 1 - u / 0.35)
    y0 = 1060
    s_ = ['<g opacity="%.2f" transform="translate(%s %d) scale(%.3f) rotate(-3) translate(-540 -%d)">'
          % (out_a, f(540 + shake), y0, sc, y0)]
    hh = len(lines_) * (size + 14) + 50
    bw = max(text_w(l_, size) for l_ in lines_) + 80
    s_.append(rect(540 - bw / 2, y0 - hh / 2 - 10, bw, hh, "#ffe600", rx=24, sw=8))
    for i, l_ in enumerate(lines_):
        yy = y0 - hh / 2 + 25 + (i + 1) * (size + 14) - 26
        s_.append(text_el(540, yy, l_, size, INK, weight=900))
    s_.append("</g>")
    return "".join(s_)


def mid_cta_svg(u, dur, texts=None):
    texts = texts or {}
    """Bandeau d'abonnement compact au milieu de la vidéo, avec la main qui clique sur « + Suivre »."""
    if u < 0:
        return ""
    k = ease(u / 0.35)
    if u > dur:
        k = max(0.0, 1 - (u - dur) / 0.3)
    dx = (1 - k) * 1100
    y0 = 520
    s_ = ['<g transform="translate(%s 0)">' % f(dx)]
    s_.append(rect(90, y0, 900, 170, "#000000", rx=40, stroke="none", sw=0, extra='opacity="0.25"'))
    s_.append(rect(80, y0 - 10, 900, 170, "#ffffff", rx=40, sw=6))
    s_.append(circle(170, y0 + 75, 52, "#ffd166", sw=5))
    s_.append(circle(152, y0 + 64, 9, INK, stroke="none", sw=0) + circle(188, y0 + 64, 9, INK, stroke="none", sw=0))
    s_.append(path("M 145 %s Q 170 %s 195 %s" % (f(y0 + 92), f(y0 + 116), f(y0 + 92)), sw=6))
    s_.append(text_el(250, y0 + 62, texts.get("title", "Ne rate pas la suite"), 44, INK, anchor="start"))
    s_.append(text_el(250, y0 + 112, texts.get("sub", "Abonne-toi maintenant"), 34, "#555555", weight=700, anchor="start"))
    tap = 1.1
    followed = u > tap + 0.15
    pulse = 1 + (0.07 * math.sin(u * 10) if not followed else 0)
    if tap < u < tap + 0.15:
        pulse = 0.9
    cx, cy = 840, y0 + 75
    s_.append('<g transform="translate(%s %s) scale(%.3f) translate(%s %s)">' % (f(cx), f(cy), pulse, f(-cx), f(-cy)))
    s_.append(rect(cx - 115, cy - 42, 230, 84, "#9aa0a6" if followed else "#fe2c55", rx=42, sw=5))
    s_.append(text_el(cx, cy + 15, texts.get("done", "Abonné") if followed else texts.get("btn", "+ Suivre"), 38, "#ffffff"))
    s_.append("</g>")
    hx = lerp(1050, cx + 30, ease((u - 0.3) / 0.6))
    hy = lerp(y0 + 420, cy + 25, ease((u - 0.3) / 0.6))
    if u > tap + 0.4:
        hy += ease((u - tap - 0.4) / 0.4) * 500
    s_.append('<g transform="translate(%s %s) scale(%.2f)">' % (f(hx), f(hy), 0.85 if tap < u < tap + 0.15 else 1))
    s_.append(path("M -14 0 L -14 -70 Q 0 -86 14 -70 L 14 -10 L 40 -16 Q 62 -14 60 14 L 52 70 L -26 70 "
                   "L -48 26 Q -54 6 -36 6 Z", fill="#ffe0bd", sw=6))
    s_.append("</g></g>")
    return "".join(s_)
