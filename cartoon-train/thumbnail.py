# -*- coding: utf-8 -*-
"""Miniature YouTube 1280x720 pour « Le client est roi »."""
import cairosvg
import youtube as Y
from engine import person
from render import f, rect, circle, path, text_el, line

W, H = 1280, 720


def char(who, x, head_y, sc, expr, mouth, pose="down", flip=1, look=(0.5, 0.05)):
    st = dict(x=0, expr=expr, mouth=mouth, blink=0, look=look, pose=pose, pose_amt=1.0, walk=None, tilt=0)
    ty = head_y - 920 * sc
    return '<g transform="translate(%s %s) scale(%s %s)">%s</g>' % (f(x), f(ty), f(sc * flip), f(sc), person(Y.CAST[who]["spec"], st, 0))


def outlined(x, y, s, size, fill, anchor="middle"):
    return text_el(x, y, s, size, "#000000", stroke="#000000", sw=size * 0.28, weight=900, anchor=anchor) + \
        text_el(x, y, s, size, fill, weight=900, anchor=anchor)


s = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">' % (W, H, W, H)]
s.append(rect(0, 0, W, H, "#ff3b30", stroke="none", sw=0))
for k in range(16):  # rayons
    a0, a1 = k * 22.5, k * 22.5 + 11
    import math
    p = "M 760 360 L %s %s L %s %s Z" % (f(760 + 1600 * math.cos(math.radians(a0))), f(360 + 1600 * math.sin(math.radians(a0))),
                                        f(760 + 1600 * math.cos(math.radians(a1))), f(360 + 1600 * math.sin(math.radians(a1))))
    s.append(path(p, fill="#ff6a3d", stroke="none", sw=0))
s.append(rect(0, 560, W, 200, "#b5651d", stroke="none", sw=0))
# Léa (droite, sourire) et Gérard (gauche, furieux)
s.append(char("L", 1060, 400, 1.25, "smile", 0.0, "down", flip=-1, look=(-0.8, 0.0)))
s.append(char("G", 330, 380, 1.7, "angry", 0.9, "point", look=(0.9, 0.0)))
# couronne
cx, cy = 330, 190
pts = [(-95, 20), (-105, -70), (-50, -20), (0, -95), (50, -20), (105, -70), (95, 20)]
s.append(path("M " + " L ".join("%s %s" % (cx + dx, cy + dy) for dx, dy in pts) + " Z", fill="#ffd166", sw=9))
for dx, dy in ((-105, -70), (0, -95), (105, -70)):
    s.append(circle(cx + dx, cy + dy, 13, "#e63946", sw=6))
# texte
s.append('<g transform="rotate(-4 840 160)">')
s.append(outlined(840, 150, "LE CLIENT", 120, "#ffffff"))
s.append(outlined(840, 290, "EST ROI ?", 130, "#ffe14d"))
s.append("</g>")
s.append('<g transform="rotate(5 1060 610)">%s%s</g>' % (
    rect(840, 565, 420, 80, "#ffffff", rx=18, sw=8), text_el(1050, 619, "PAS DE MONNAIE !", 38, "#e63946", weight=900)))
s.append("</svg>")
cairosvg.svg2png(bytestring="".join(s).encode(), write_to="miniature-le-client-est-roi.png", output_width=W, output_height=H)
