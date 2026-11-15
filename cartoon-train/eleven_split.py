# -*- coding: utf-8 -*-
"""Outils pour les voix ElevenLabs générées en un seul bloc (répliques séparées par [long pause]).
  python3 eleven_split.py split  fichier.mp3 N dossier      -> dossier/00.wav … (coupe aux N-1 plus longs silences)
  python3 eleven_split.py fetch  jobs.json  < lignes « nom url »  -> télécharge, découpe, range chaque réplique
  python3 eleven_split.py check  jobs.json [noms…]          -> vérifie le débit (caractères / seconde) de chaque morceau"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np

SR = 44100


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def save(path, x):
    import wave
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def split(src, n, out):
    x = load(src)
    hop = int(0.01 * SR)
    env = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    thr = max(np.percentile(env, 95) * 0.04, 1e-4)
    quiet = env < thr
    runs, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if i > 0 and j < len(quiet):
                runs.append((j - i, i, j))
            i = j
        else:
            i += 1
    runs.sort(reverse=True)
    keep = sorted(runs[:n - 1], key=lambda r: r[1])
    cuts = [0] + [((a + b) // 2) * hop for _, a, b in keep] + [len(x)]
    os.makedirs(out, exist_ok=True)
    for k in range(n):
        seg = x[cuts[k]:cuts[k + 1]]
        e = np.abs(seg) > thr * 2
        if e.any():
            a, b = np.argmax(e), len(e) - np.argmax(e[::-1])
            seg = seg[max(0, a - int(0.05 * SR)):min(len(seg), b + int(0.08 * SR))]
        save(os.path.join(out, "%02d.wav" % k), seg)
    kept = [round(r[0] * 0.01, 2) for r in keep]
    rej = round(runs[n - 1][0] * 0.01, 2) if len(runs) >= n else 0
    return "silences retenus (s): %s plus court rejeté: %s" % (kept, rej)


def fetch(jobs_path):
    jobs = {j["name"]: j for j in json.load(open(jobs_path))}
    work = os.path.dirname(os.path.abspath(jobs_path))
    for line in sys.stdin:
        if not line.strip():
            continue
        name, url = line.split(None, 1)
        j = jobs[name]
        mp3 = os.path.join(work, name + ".mp3")
        subprocess.run(["curl", "-sS", "-o", mp3, url.strip()], check=True)
        tmp = tempfile.mkdtemp(dir=work)
        info = split(mp3, j["n"], tmp)
        for k, dest in enumerate(j["dest"]):
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copy(os.path.join(tmp, "%02d.wav" % k), dest)
        print(name, "OK", info)


def check(jobs_path, names):
    for j in json.load(open(jobs_path)):
        if names and j["name"] not in names:
            continue
        texts = j["text"].split(" [long pause] ")
        rates = []
        for t, d in zip(texts, j["dest"]):
            dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                        "csv=p=0", d], capture_output=True, text=True).stdout or 0)
            rates.append(len(t) / dur if dur else 0)
        print(j["name"], " ".join("%.0f" % r for r in rates))


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "split":
        print(split(sys.argv[2], int(sys.argv[3]), sys.argv[4]))
    elif cmd == "fetch":
        fetch(sys.argv[2])
    elif cmd == "check":
        check(sys.argv[2], sys.argv[3:])
