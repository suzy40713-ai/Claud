# -*- coding: utf-8 -*-
"""Nouveaux formats courts à tester sur TikTok / Shorts (sans personnages animés) :
  sms      : conversation de textos qui part en vrille (bulles, « en train d'écrire… », sons de message)
  intrus   : « Trouve l'intrus » en 3 niveaux, compte à rebours puis réponse entourée
  prefere  : « Tu préfères… » en 5 questions, écran coupé en deux, voix qui lit la question
python3 formats.py [préfixe de slug…]  ->  videos-formats/<slug>.mp4"""
import math
import os
import random
import subprocess
import sys
from multiprocessing import Pool

import numpy as np

import tts
from render import rect, circle, path, text_el, f
from story import text_w

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "videos-formats")
W, H, FPS, SR = 1080, 1920, 30, 44100
INK = "#1b1b1b"


def ease(u):
    u = max(0.0, min(1.0, u))
    return 1 - (1 - u) ** 3


def wrap(txt, size, width):
    lines_, cur = [], ""
    for w_ in txt.split():
        if cur and text_w(cur + " " + w_, size) > width:
            lines_.append(cur)
            cur = w_
        else:
            cur = (cur + " " + w_).strip()
    return lines_ + [cur]


def hook_svg(txt, u):
    """Gros texte d'accroche jaune pendant les 2 premières secondes."""
    if u > 2.2:
        return ""
    lines_ = wrap(txt, 84, 860)
    sc = 1.35 - 0.35 * ease(u / 0.2)
    op = 1.0 if u < 1.9 else max(0.0, 1 - (u - 1.9) / 0.3)
    hh = len(lines_) * 100 + 60
    bw = max(text_w(l_, 84) for l_ in lines_) + 90
    s = ['<g opacity="%.2f" transform="translate(540 960) scale(%.3f) rotate(-3)">' % (op, sc),
         rect(-bw / 2, -hh / 2, bw, hh, "#ffe600", rx=26, sw=8)]
    for i, l_ in enumerate(lines_):
        s.append(text_el(0, -hh / 2 + 100 + i * 100 - 18, l_, 84, INK, weight=900))
    return "".join(s) + "</g>"


# ------------------------------------------------------------------ sons

def tone(freq, dur, decay, amp, freq_end=None):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = freq if freq_end is None else np.linspace(freq, freq_end, n)
    return (np.sin(2 * np.pi * np.cumsum(np.full(n, fr) if np.isscalar(fr) else fr) / SR)
            * np.exp(-t / decay) * amp).astype(np.float32)


POP = tone(1200, 0.12, 0.03, 0.35, 700)            # message reçu
SEND = tone(700, 0.1, 0.025, 0.3, 1300)            # message envoyé
TICK = (np.random.default_rng(1).standard_normal(int(0.02 * SR)) * np.exp(-np.arange(int(0.02 * SR)) / 60)
        * 0.25).astype(np.float32)
DING = tone(880, 0.6, 0.18, 0.3) + np.pad(tone(1320, 0.45, 0.15, 0.25), (int(0.08 * SR), int(0.07 * SR)))[:int(0.6 * SR)]
WHOOSH = (np.random.default_rng(2).standard_normal(int(0.35 * SR)) * np.hanning(int(0.35 * SR)) * 0.12
          ).astype(np.float32)


def music(total):
    """Petite boucle douce et entraînante, en fond."""
    n = int(total * SR)
    m = np.zeros(n, np.float32)
    notes = [523.3, 659.3, 784.0, 659.3, 587.3, 698.5, 880.0, 698.5]
    step = 60 / 118 / 2
    for k, t0 in enumerate(np.arange(0, total, step)):
        j = int(t0 * SR)
        s = tone(notes[k % 8] / 2, 0.3, 0.07, 0.035)
        m[j:j + len(s)] += s[:max(0, n - j)]
        if k % 4 == 0:
            b = tone([130.8, 110.0, 98.0, 116.5][(k // 8) % 4], 0.5, 0.15, 0.06)
            m[j:j + len(b)] += b[:max(0, n - j)]
    return m


def load_voice(path_):
    x, sr = tts.read_wav(path_)
    if sr != SR:
        x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x).astype(np.float32)
    return x


def voice_wav(text, path_):
    """Voix de secours (Piper Miro) si aucun fichier ElevenLabs n'a été déposé à cet endroit."""
    if os.path.exists(path_):
        return path_
    import wave
    import engine
    from piper import PiperVoice, SynthesisConfig
    os.makedirs(os.path.dirname(path_), exist_ok=True)
    v = PiperVoice.load(engine.voice_model("fr_FR-miro-high"))
    with wave.open(path_, "wb") as w_:
        v.synthesize_wav(text, w_, syn_config=SynthesisConfig(length_scale=0.92))
    return path_


# ------------------------------------------------------------------ rendu commun

JOB = {}


def _frame(i):
    import cairosvg
    from PIL import Image
    import io
    svg = JOB["frame"](i / FPS)
    png = cairosvg.svg2png(bytestring=svg.encode("utf-8"), output_width=W, output_height=H)
    return Image.open(io.BytesIO(png)).convert("RGB").tobytes()


def svg_doc(body, bg="#ffffff"):
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">'
            '<rect width="%d" height="%d" fill="%s"/>%s</svg>') % (W, H, W, H, W, H, bg, body)


def render(slug, total, frame, sounds, with_music=True, frames=None):
    JOB["frame"] = frame
    os.makedirs(OUT, exist_ok=True)
    if frames:
        from PIL import Image
        for ts in frames:
            p = os.path.join(tts.BUILD, "fmt_%s_%s.png" % (slug, ts))
            Image.frombytes("RGB", (W, H), _frame(int(float(ts) * FPS))).save(p)
            print(p)
        return
    a = music(total + 0.5) if with_music else np.zeros(int((total + 0.5) * SR), np.float32)
    for t0, x in sounds:
        j = int(t0 * SR)
        a[j:j + len(x)] += x[:max(0, len(a) - j)]
    fade = int(0.4 * SR)
    a[int(total * SR) - fade:int(total * SR)] *= np.linspace(1, 0, fade)
    wav = os.path.join(tts.BUILD, "fmt_%s.wav" % slug)
    import wave
    with wave.open(wav, "wb") as w_:
        w_.setnchannels(1)
        w_.setsampwidth(2)
        w_.setframerate(SR)
        w_.writeframes((np.clip(a / max(1.0, np.abs(a).max() / 0.95), -1, 1) * 32767).astype(np.int16).tobytes())
    out = os.path.join(OUT, slug + ".mp4")
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", "%dx%d" % (W, H), "-r", str(FPS), "-i", "-", "-i", wav, "-t", "%.3f" % total,
                           "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for buf in pool.imap(_frame, range(int(total * FPS)), chunksize=4):
            ff.stdin.write(buf)
    ff.stdin.close()
    ff.wait()
    print("->", out, "(%.1f s)" % total)


# ------------------------------------------------------------------ 1. conversation SMS

def sms(slug, contact, hook, msgs, end_text="Partie 2 ?"):
    """msgs : liste de (côté, texte) ; côté "m" = moi (bleu, à droite), "t" = l'autre (gris, à gauche)."""
    size, maxw, pad = 54, 760, 34
    items, t = [], 2.3
    for side, txt in msgs:
        if side == "t":
            t += 0.25
            typing = (t, t + 0.6 + min(1.6, len(txt) * 0.02))
            t = typing[1]
        else:
            typing = None
            t += 0.35
        lines_ = wrap(txt, size, maxw)
        bw = max(text_w(l_, size) for l_ in lines_) + 2 * pad
        bh = len(lines_) * 68 + 2 * pad - 8
        items.append(dict(side=side, lines=lines_, w=bw, h=bh, t=t, typing=typing))
        t += 0.6 + len(txt) * 0.035
    total = t + 2.0
    sounds = [(it["t"], POP if it["side"] == "t" else SEND) for it in items]
    top, bottom = 250, 1700

    def frame(tt):
        s = [rect(0, 0, W, 220, "#f2f2f7", stroke="none", sw=0), rect(0, 219, W, 2, "#d1d1d6", stroke="none", sw=0),
             circle(540, 80, 46, "#8e8e93", stroke="none", sw=0),
             text_el(540, 98, contact[0].upper() if contact[0].isalpha() else "?", 46, "#ffffff", weight=700),
             text_el(540, 185, contact, 40, INK, weight=600),
             text_el(70, 110, "<", 64, "#0a84ff", weight=500)]
        shown = [it for it in items if tt >= it["t"]]
        # hauteur totale pour faire défiler vers le haut quand ça déborde
        y = top
        pos = []
        for it in shown:
            pos.append(y)
            y += it["h"] + 22
        typing = next((it for it in items if it["typing"] and it["typing"][0] <= tt < it["typing"][1]), None)
        need = y + (110 if typing else 0)
        shift = max(0, need - bottom)
        body = []
        for it, y0 in zip(shown, pos):
            y0 -= shift
            k = ease((tt - it["t"]) / 0.18)
            x0 = 60 if it["side"] == "t" else W - 60 - it["w"]
            col, tc = ("#e9e9eb", INK) if it["side"] == "t" else ("#0a84ff", "#ffffff")
            body.append('<g transform="translate(%s %s) scale(%.3f)">' % (
                f(x0 + (0 if it["side"] == "t" else it["w"])), f(y0 + it["h"]), 0.6 + 0.4 * k))
            ox = 0 if it["side"] == "t" else -it["w"]
            body.append(rect(ox, -it["h"], it["w"], it["h"], col, rx=38, stroke="none", sw=0))
            for i, l_ in enumerate(it["lines"]):
                body.append(text_el(ox + pad, -it["h"] + pad + 50 + i * 68, l_, size, tc, weight=500, anchor="start"))
            body.append("</g>")
        if typing:
            y0 = y - shift
            body.append(rect(60, y0, 170, 90, "#e9e9eb", rx=40, stroke="none", sw=0))
            for k in range(3):
                a = 0.35 + 0.65 * max(0.0, math.sin(tt * 9 - k * 0.9))
                body.append(circle(110 + k * 36, y0 + 45, 13, "#8e8e93", stroke="none", sw=0)
                            .replace("/>", ' opacity="%.2f"/>' % a, 1))
        s.append('<g>%s</g>' % "".join(body))
        s.append(rect(0, 1740, W, 180, "#f9f9f9", stroke="none", sw=0))
        s.append(rect(40, 1770, W - 80, 90, "#ffffff", rx=45, stroke="#d1d1d6", sw=3))
        s.append(text_el(80, 1830, "iMessage", 36, "#b0b0b5", weight=500, anchor="start"))
        if tt > total - 1.8:
            k = ease((tt - total + 1.8) / 0.3)
            s.append('<g transform="translate(540 1000) scale(%.3f)">' % k
                     + rect(-330, -80, 660, 160, "#ff2d55", rx=80, sw=8) + text_el(0, 25, end_text, 72, "#ffffff")
                     + "</g>")
        s.append(hook_svg(hook, tt))
        return svg_doc("".join(s))

    return dict(slug=slug, total=total, frame=frame, sounds=sounds)


# ------------------------------------------------------------------ 2. trouve l'intrus

def intrus(slug, hook, levels, seed=7):
    """levels : liste de (nom du niveau, symbole normal, intrus, colonnes, lignes)."""
    rng = random.Random(seed)
    LV, intro = [], 2.4
    t = intro
    for name, a, b, cols, rows in levels:
        odd = (rng.randrange(1, cols - 1), rng.randrange(2, rows - 1))
        LV.append(dict(name=name, a=a, b=b, cols=cols, rows=rows, odd=odd, t0=t, t_rev=t + 7.0, t1=t + 9.0))
        t += 9.0
    total = t + 2.5
    sounds = []
    for lv in LV:
        sounds.append((lv["t0"], WHOOSH))
        sounds += [(lv["t0"] + 0.5 + k, TICK) for k in range(7)]
        sounds.append((lv["t_rev"], DING))
    gx0, gy0, gw, gh = 70, 470, 940, 1180

    def frame(tt):
        lv = next((l_ for l_ in LV if l_["t0"] <= tt < l_["t1"]), LV[0] if tt < intro else LV[-1])
        s = [rect(0, 0, W, H, "#fff7e6", stroke="none", sw=0),
             text_el(540, 150, "TROUVE L'INTRUS", 92, INK, weight=900),
             rect(340, 200, 400, 80, {"FACILE": "#25d366", "MOYEN": "#ffb703"}.get(lv["name"], "#ff2d55"),
                  rx=40, sw=6),
             text_el(540, 256, lv["name"], 48, "#ffffff", weight=900)]
        cols, rows = lv["cols"], lv["rows"]
        cw, ch = gw / cols, gh / rows
        size = int(min(cw, ch) * (0.62 if len(lv["a"]) == 1 else 1.55 / max(3, len(lv["a"]))))
        s.append(rect(gx0 - 10, gy0 - 10, gw + 20, gh + 20, "#ffffff", rx=30, sw=6))
        for r_ in range(rows):
            for c_ in range(cols):
                sym = lv["b"] if (c_, r_) == lv["odd"] else lv["a"]
                s.append(text_el(gx0 + (c_ + 0.5) * cw, gy0 + (r_ + 0.5) * ch + size * 0.36, sym, size, INK,
                                 weight=700))
        if tt >= lv["t0"] and tt < lv["t_rev"]:
            left = max(0, math.ceil(lv["t_rev"] - tt - 0.5))
            k = 1 - (lv["t_rev"] - tt) / 7.0
            s.append(rect(140, 340, 800, 40, "#e0e0e0", rx=20, stroke="none", sw=0))
            s.append(rect(140, 340, 800 * (1 - k), 40, "#ff2d55" if left <= 3 else "#ffb703", rx=20,
                          stroke="none", sw=0))
            s.append(text_el(540, 1800, "%d" % left, 120, "#ff2d55" if left <= 3 else INK, weight=900))
        if tt >= lv["t_rev"]:
            c_, r_ = lv["odd"]
            k = ease((tt - lv["t_rev"]) / 0.3)
            s.append(circle(gx0 + (c_ + 0.5) * cw, gy0 + (r_ + 0.5) * ch, max(cw, ch) * 0.62 * (2 - k), "none",
                            stroke="#ff2d55", sw=12))
            s.append(text_el(540, 1810, "Tu l'avais trouvé ?", 70, INK, weight=900))
        if tt > total - 2.4:
            k = ease((tt - total + 2.4) / 0.3)
            s.append('<g transform="translate(540 1000) scale(%.3f)">' % k
                     + rect(-440, -110, 880, 220, "#ff2d55", rx=60, sw=8)
                     + text_el(0, -10, "Ton score sur 3 ?", 70, "#ffffff")
                     + text_el(0, 65, "Dis-le en commentaire", 46, "#ffffff", weight=700) + "</g>")
        s.append(hook_svg(hook, tt))
        return svg_doc("".join(s), "#fff7e6")

    return dict(slug=slug, total=total, frame=frame, sounds=sounds)


# ------------------------------------------------------------------ 3. tu préfères

def prefere(slug, hook, questions):
    """questions : liste de (option A, option B). La voix lit « Tu préfères A… ou B ? »."""
    vdir = os.path.join(tts.BUILD, "fmt-voix", slug)
    Q, t = [], 2.3
    sounds = []
    for i, (a, b) in enumerate(questions):
        wav = voice_wav(prefere_text(a, b), os.path.join(vdir, "%02d.wav" % i))
        x = load_voice(wav)
        dur = len(x) / SR
        Q.append(dict(a=a, b=b, t0=t, t_think=t + dur + 0.2, t1=t + dur + 2.6))
        sounds += [(t, WHOOSH), (t + 0.1, x)] + [(t + dur + 0.3 + k * 0.8, TICK) for k in range(3)]
        t = Q[-1]["t1"]
    total = t + 2.6

    def half(txt, y_c, col, label, k):
        lines_ = wrap(txt.upper(), 76, 900)
        s = [rect(0, y_c - 480, W, 960, col, stroke="none", sw=0),
             text_el(110, y_c - 360, label, 120, "#ffffff", weight=900).replace(">", ' opacity="0.35">', 1)]
        for i, l_ in enumerate(lines_):
            yy = y_c - (len(lines_) - 1) * 45 + i * 92 + 28
            s.append(text_el(540, yy, l_, 76, INK, stroke=INK, sw=14, weight=900))
            s.append(text_el(540, yy, l_, 76, "#ffffff", weight=900))
        return '<g transform="translate(%s 0)">%s</g>' % (f((1 - k) * (-W if label == "A" else W)), "".join(s))

    def frame(tt):
        q = next((q_ for q_ in Q if q_["t0"] <= tt < q_["t1"]), Q[0] if tt < Q[0]["t0"] else Q[-1])
        k = ease((tt - q["t0"]) / 0.35)
        s = [half(q["a"], 480, "#ff3b5c", "A", k), half(q["b"], 1440, "#2f80ed", "B", k),
             circle(540, 960, 110, "#ffe600", sw=10), text_el(540, 990, "OU", 80, INK, weight=900),
             rect(390, 40, 300, 90, INK, rx=45, stroke="none", sw=0),
             text_el(540, 103, "%d / %d" % (Q.index(q) + 1, len(Q)), 54, "#ffffff", weight=900)]
        if tt >= q["t_think"]:
            u = min(1.0, (tt - q["t_think"]) / (q["t1"] - q["t_think"]))
            s.append(rect(0, 950, W * (1 - u), 20, "#ffe600", stroke="none", sw=0))
        if tt > total - 2.4:
            kk = ease((tt - total + 2.4) / 0.3)
            s.append('<g transform="translate(540 960) scale(%.3f)">' % kk
                     + rect(-460, -120, 920, 240, INK, rx=60, stroke="#ffe600", sw=10)
                     + text_el(0, -12, "Écris tes 5 réponses", 66, "#ffffff")
                     + text_el(0, 70, "en commentaire (ex : ABBAB)", 46, "#ffe600", weight=700) + "</g>")
        s.append(hook_svg(hook, tt))
        return svg_doc("".join(s))

    return dict(slug=slug, total=total, frame=frame, sounds=sounds)


# ------------------------------------------------------------------ les vidéos

PREFERE = {
    "f05-tu-preferes-1": ("Tu préfères… (réponds en commentaire)", [
        ("Ne plus jamais avoir de devoirs", "Ne plus jamais faire la queue"),
        ("Avoir un million d'abonnés", "Avoir un million d'euros"),
        ("Lire dans les pensées", "Être invisible"),
        ("Ne plus jamais avoir de téléphone", "Ne plus jamais manger de pizza"),
        ("Revivre ta meilleure journée", "Voir ta vie dans dix ans"),
    ]),
    "f06-tu-preferes-2": ("Tu préfères… (le 4 est impossible)", [
        ("Parler toutes les langues", "Parler aux animaux"),
        ("Être toujours 10 minutes en retard", "Être toujours 20 minutes en avance"),
        ("Vivre sans musique", "Vivre sans films"),
        ("Avoir un dragon", "Être un dragon"),
        ("Voler, mais à 2 km/h", "Courir à 100 km/h, sans pouvoir t'arrêter"),
    ]),
}


def videos():
    return [
        ("f01-sms-mauvais-numero", lambda: sms("f01-sms-mauvais-numero", "+33 6 •• •• •• 12", "Il s'est trompé de numéro…", [
            ("m", "Wesh t'as fini le devoir de maths ?"),
            ("m", "Envoie les réponses stp, de toute façon la prof elle capte rien"),
            ("t", "Bonsoir Lucas."),
            ("t", "C'est Madame Martin."),
            ("m", "…"),
            ("m", "Madame vous êtes très belle aujourd'hui"),
            ("t", "Il est 23 h."),
            ("m", "Vous êtes belle aussi à 23 h"),
            ("t", "Interrogation surprise demain. Pour toute la classe."),
            ("t", "Tu pourras remercier tes camarades."),
            ("m", "Madame non"),
            ("t", "Bonne nuit Lucas."),
        ])),
        ("f02-sms-papa-tiktok", lambda: sms("f02-sms-papa-tiktok", "Papa", "Mon père a trouvé mon TikTok…", [
            ("t", "Pourquoi tu danses sur internet ?"),
            ("m", "Quoi ?"),
            ("t", "Ta vidéo. 2 millions de vues."),
            ("m", "Papa c'est pas moi"),
            ("t", "C'est ta chambre. Et ton pyjama Spider-Man."),
            ("m", "Comment t'as trouvé ça"),
            ("t", "Je suis sur TikTok depuis 3 mois."),
            ("t", "J'ai 40 000 abonnés."),
            ("m", "QUOI"),
            ("t", "Je fais des recettes de pâtes."),
            ("t", "Tu veux faire un duo ?"),
            ("m", "Jamais."),
            ("t", "Tant pis. Ta grand-mère a dit oui."),
        ])),
        ("f03-intrus-chiffres", lambda: intrus("f03-intrus-chiffres", "Trouve l'intrus avant la fin du chrono", [
            ("FACILE", "6", "9", 7, 10), ("MOYEN", "M", "N", 8, 12), ("IMPOSSIBLE", "8", "B", 9, 13)], seed=3)),
        ("f04-intrus-mots", lambda: intrus("f04-intrus-mots", "Seuls les plus rapides trouvent les 3", [
            ("FACILE", "CHAT", "CHAR", 5, 12), ("MOYEN", "POMME", "POMNE", 4, 13),
            ("IMPOSSIBLE", "TIKTOK", "TIKTKO", 4, 14)], seed=11)),
        ("f05-tu-preferes-1", lambda: prefere("f05-tu-preferes-1", *PREFERE["f05-tu-preferes-1"])),
        ("f06-tu-preferes-2", lambda: prefere("f06-tu-preferes-2", *PREFERE["f06-tu-preferes-2"])),
    ]


def prefere_text(a, b):
    return "Tu préfères %s… ou %s ?" % (a[0].lower() + a[1:], b[0].lower() + b[1:])


def prefere_jobs(voice_id):
    """Phrases à faire lire par ElevenLabs : une par question, déposées dans build/fmt-voix/<slug>/NN.wav."""
    return [dict(name=slug, voice=voice_id, n=len(qs), text=" [long pause] ".join(prefere_text(a, b) for a, b in qs),
                 dest=[os.path.join(tts.BUILD, "fmt-voix", slug, "%02d.wav" % i) for i in range(len(qs))])
            for slug, (hook, qs) in PREFERE.items()]


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--frames=")]
    frames = next((a.split("=", 1)[1].split(",") for a in sys.argv[1:] if a.startswith("--frames=")), None)
    for slug, make in videos():
        if args and not any(slug.startswith(a) for a in args):
            continue
        v = make()
        render(v["slug"], v["total"], v["frame"], v["sounds"], frames=frames)
