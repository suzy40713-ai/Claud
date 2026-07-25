import librosa
import numpy as np

FRAME_SECONDS = 0.25


def extract_energy_curve(audio_path: str) -> tuple[np.ndarray, np.ndarray]:
    y, sr = librosa.load(audio_path, sr=16000, mono=True)
    hop_length = int(sr * FRAME_SECONDS)
    rms = librosa.feature.rms(y=y, frame_length=hop_length * 2, hop_length=hop_length)[0]

    if rms.max() > 0:
        rms = rms / rms.max()

    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop_length)
    return times, rms


def average_energy(times: np.ndarray, energy: np.ndarray, start: float, end: float) -> float:
    mask = (times >= start) & (times < end)
    if not mask.any():
        return 0.0
    return float(energy[mask].mean())
