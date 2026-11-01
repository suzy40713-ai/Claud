#!/usr/bin/env python3
"""Ajoute une voix off française à meteo-climat-revision.mp4 -> meteo-climat-voix.mp4.

Usage : python3 voix_off.py [entree.mp4] [sortie.mp4]

Voix (dans cet ordre) :
  1. ELEVENLABS_API_KEY défini -> API ElevenLabs (eleven_multilingual_v2, "Louis - Narrator")
  2. commande `say` (macOS)   -> say -v Thomas
  3. sinon                     -> edge-tts, voix fr-FR-HenriNeural (pip install edge-tts)

Variable optionnelle ELEVENLABS_VOICE_ID pour forcer un identifiant de voix.
"""
import json
import os
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ICI = Path(__file__).resolve().parent
ENTREE = Path(sys.argv[1]) if len(sys.argv) > 1 else ICI / "meteo-climat-revision.mp4"
SORTIE = Path(sys.argv[2]) if len(sys.argv) > 2 else ICI / "meteo-climat-voix.mp4"
TRAVAIL = ICI / "build"
DELAI_VOIX = 0.3   # la voix démarre 0,3 s après le début du morceau
MARGE_FIN = 0.5    # si on allonge : fin de la voix + 0,5 s
FPS = 30

# (début s, durée s, texte)
SCENES = [
    (0, 5, "Météo et climat. On révise les chapitres 4 et 5 de SVT."),
    (5, 9, "Tout part du Soleil. Il chauffe beaucoup plus l'Équateur que les pôles. Ces différences de température créent des différences de pression, et donc des vents, des pluies et des climats différents."),
    (14, 8, "Le vent, c'est une masse d'air qui se déplace horizontalement. Il souffle toujours des hautes pressions vers les basses pressions."),
    (22, 7, "Exemple : la brise de mer. Le jour, la terre chauffe plus vite que la mer. L'air chaud monte au-dessus de la terre, et l'air plus frais de la mer vient le remplacer."),
    (29, 8, "Une perturbation, c'est la rencontre d'une masse d'air chaud et humide avec une masse d'air froid et sec. L'air chaud monte, se refroidit, la vapeur d'eau se condense : nuages et pluie."),
    (37, 8, "Retiens bien : le risque, c'est l'aléa plus les enjeux. L'aléa, c'est la probabilité du phénomène, comme une crue. Les enjeux, ce sont les personnes et les biens menacés. Pour se protéger : prévoir, alerter, construire des digues."),
    (45, 9, "Attention à ne pas confondre météo et climat. La météo, c'est le temps qu'il fait aujourd'hui. Le climat, c'est la moyenne des températures et des pluies sur trente ans."),
    (54, 10, "Normalement, les alizés poussent l'eau chaude du Pacifique vers l'Australie. Lors d'El Niño, ils faiblissent : l'eau chaude part vers le Pérou. Résultat : inondations au Pérou, sécheresses et incendies en Australie et en Inde."),
    (64, 9, "Aujourd'hui, la Terre s'est réchauffée de 1,2 degré depuis 1900, à une vitesse jamais vue. La cause : les gaz à effet de serre rejetés par les humains, surtout le CO2 issu du pétrole, du gaz et du charbon."),
    (73, 9, "D'ici 2100, la température pourrait monter de 1,5 à 4 degrés. Le niveau des mers monte, les glaces fondent, et les tempêtes, inondations et canicules deviennent plus fréquentes."),
    (82, 9, "À retenir : le vent va des hautes vers les basses pressions. Risque égale aléa plus enjeux. Le climat, c'est une moyenne sur trente ans. Bonne chance pour ton contrôle !"),
]


def run(*cmd):
    subprocess.run([str(c) for c in cmd], check=True)


def duree(fichier):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(fichier)],
        check=True, capture_output=True, text=True).stdout
    return float(out.strip())


# ---------- Voix ----------

def voix_elevenlabs(texte, dest):
    cle = os.environ["ELEVENLABS_API_KEY"]
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID")
    if not voice_id:
        req = urllib.request.Request("https://api.elevenlabs.io/v1/voices",
                                     headers={"xi-api-key": cle})
        voix = json.load(urllib.request.urlopen(req))["voices"]
        choix = [v for v in voix if "louis" in v["name"].lower()] or \
                [v for v in voix if (v.get("labels") or {}).get("language") == "fr"] or voix
        voice_id = choix[0]["voice_id"]
        print(f"  voix ElevenLabs : {choix[0]['name']} ({voice_id})")
        os.environ["ELEVENLABS_VOICE_ID"] = voice_id
    corps = json.dumps({
        "text": texte,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.6, "similarity_boost": 0.75, "style": 0.0},
    }).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128",
        data=corps, headers={"xi-api-key": cle, "Content-Type": "application/json"})
    dest.write_bytes(urllib.request.urlopen(req).read())


def voix_say(texte, dest):
    aiff = dest.with_suffix(".aiff")
    run("say", "-v", "Thomas", "-o", aiff, texte)
    run("ffmpeg", "-y", "-loglevel", "error", "-i", aiff, dest)
    aiff.unlink()


def voix_edge(texte, dest):
    if shutil.which("edge-tts") is None:
        run(sys.executable, "-m", "pip", "install", "-q", "edge-tts")
    run(sys.executable, "-m", "edge_tts", "--voice", "fr-FR-HenriNeural",
        "--text", texte, "--write-media", dest)


def choisir_voix():
    if os.environ.get("ELEVENLABS_API_KEY"):
        return "ElevenLabs", voix_elevenlabs
    if shutil.which("say"):
        return "say -v Thomas", voix_say
    return "edge-tts fr-FR-HenriNeural", voix_edge


# ---------- Montage ----------

def main():
    if not ENTREE.exists():
        sys.exit(f"Vidéo introuvable : {ENTREE}")
    TRAVAIL.mkdir(exist_ok=True)
    nom, tts = choisir_voix()
    print(f"Moteur de voix : {nom}")

    liste = []
    for i, (debut, dur, texte) in enumerate(SCENES, 1):
        audio = TRAVAIL / f"voix_{i:02d}.mp3"
        if not audio.exists() or audio.stat().st_size == 0:
            tts(texte, audio)
        d_voix = duree(audio)
        fin_voix = DELAI_VOIX + d_voix
        total = max(dur, fin_voix + MARGE_FIN) if fin_voix > dur else dur
        gel = total - dur
        print(f"Scène {i:2d} : {debut:>3}s +{dur}s | voix {d_voix:5.2f}s"
              + (f" -> allongée à {total:.2f}s (gel {gel:.2f}s)" if gel > 0 else ""))

        vf = f"fps={FPS},format=yuv420p"
        if gel > 0:
            vf += f",tpad=stop_mode=clone:stop_duration={gel:.3f}"
        retard = int(DELAI_VOIX * 1000)
        af = (f"[1:a]aresample=48000,adelay={retard}|{retard},"
              f"apad,atrim=0:{total:.3f},asetpts=PTS-STARTPTS[a]")
        morceau = TRAVAIL / f"morceau_{i:02d}.mp4"
        run("ffmpeg", "-y", "-loglevel", "error",
            "-ss", debut, "-t", dur, "-i", ENTREE,
            "-i", audio,
            "-filter_complex", f"[0:v]{vf},trim=0:{total:.3f},setpts=PTS-STARTPTS[v];{af}",
            "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p",
            "-r", FPS, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            "-t", f"{total:.3f}", morceau)
        liste.append(morceau)

    concat = TRAVAIL / "concat.txt"
    concat.write_text("".join(f"file '{m.name}'\n" for m in liste))
    run("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
        "-i", concat, "-c", "copy", "-movflags", "+faststart", SORTIE)

    # Vérification
    flux = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name",
         "-of", "csv=p=0", str(SORTIE)], check=True, capture_output=True, text=True).stdout
    print("\nPistes :", flux.strip().replace("\n", " | "))
    if "audio" not in flux:
        sys.exit("ERREUR : pas de piste audio dans la sortie")
    print(f"Durée finale : {duree(SORTIE):.2f} s -> {SORTIE}")


if __name__ == "__main__":
    main()
