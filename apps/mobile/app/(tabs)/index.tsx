import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { colors, radius, spacing } from "../../constants/theme";
import { getMe, type Me } from "../../services/account";
import {
  createVideo,
  getVideo,
  QuotaExceededError,
  startProcessing,
  uploadVideoFile,
  type VideoStatus,
} from "../../services/videos";

type PickedVideo = {
  uri: string;
  filename: string;
  contentType: string;
  durationSeconds: number | null;
};

type Stage = "idle" | "picked" | "uploading" | "uploaded" | "queued" | "processing" | "completed" | "failed";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "",
  picked: "",
  uploading: "Upload en cours…",
  uploaded: "En attente de traitement…",
  queued: "En attente de traitement…",
  processing: "Détection des meilleurs moments…",
  completed: "Clips prêts !",
  failed: "Le traitement a échoué",
};

const POLL_INTERVAL_MS = 4000;

export default function UploadScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [me, setMe] = useState<Me | null>(null);
  const [picked, setPicked] = useState<PickedVideo | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMe = useCallback(async () => {
    try {
      const result = await getMe(getToken);
      setMe(result);
    } catch {
      // usage card just stays empty if this fails — non-blocking for the upload flow
    }
  }, [getToken]);

  useEffect(() => {
    fetchMe();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMe]);

  const pickVideo = useCallback(async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorise l'accès à ta galerie pour choisir une vidéo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPicked({
      uri: asset.uri,
      filename: asset.fileName ?? `video-${Date.now()}.mp4`,
      contentType: asset.mimeType ?? "video/mp4",
      durationSeconds: asset.duration ? asset.duration / 1000 : null,
    });
    setStage("picked");
  }, []);

  const pollStatus = useCallback(
    (id: string) => {
      pollRef.current = setInterval(async () => {
        try {
          const video = await getVideo(getToken, id);
          setStage(video.status as VideoStatus);
          if (video.status === "completed") {
            if (pollRef.current) clearInterval(pollRef.current);
            fetchMe();
            router.push("/(tabs)/results");
          } else if (video.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setError(video.errorMessage ?? "Le traitement a échoué.");
          }
        } catch {
          // transient network error — keep polling silently
        }
      }, POLL_INTERVAL_MS);
    },
    [getToken, fetchMe, router],
  );

  const upload = useCallback(async () => {
    if (!picked) return;
    setError(null);
    setStage("uploading");

    try {
      const { videoId: id, uploadUrl } = await createVideo(getToken, {
        filename: picked.filename,
        contentType: picked.contentType,
      });
      setVideoId(id);

      await uploadVideoFile(uploadUrl, picked.uri, picked.contentType);
      await startProcessing(getToken, id);

      setStage("queued");
      pollStatus(id);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        router.push("/paywall");
        setStage("idle");
        setPicked(null);
        return;
      }
      setError(err instanceof Error ? err.message : "Échec de l'upload.");
      setStage("failed");
    }
  }, [picked, getToken, pollStatus, router]);

  const reset = useCallback(() => {
    setPicked(null);
    setVideoId(null);
    setStage("idle");
    setError(null);
  }, []);

  const minutesQuota = me?.subscription?.minutesQuota ?? 30;
  const minutesUsed = Math.round(me?.minutesUsed ?? 0);
  const isBusy = stage === "uploading" || stage === "uploaded" || stage === "queued" || stage === "processing";

  return (
    <View style={styles.container}>
      <View style={styles.usageCard}>
        <Text style={styles.usageLabel}>Minutes utilisées ce mois-ci</Text>
        <Text style={styles.usageValue}>
          {minutesUsed} / {minutesQuota} min
        </Text>
      </View>

      <View style={styles.dropzone}>
        {isBusy ? (
          <>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.dropzoneTitle}>{STAGE_LABEL[stage]}</Text>
            <Text style={styles.dropzoneSubtitle}>Tu peux quitter l'app, on te prévient quand c'est prêt.</Text>
          </>
        ) : picked ? (
          <>
            <Text style={styles.dropzoneTitle}>{picked.filename}</Text>
            {picked.durationSeconds && (
              <Text style={styles.dropzoneSubtitle}>{Math.round(picked.durationSeconds)}s sélectionnées</Text>
            )}
            {error && <Text style={styles.error}>{error}</Text>}
            <Button label="Lancer le traitement" onPress={upload} />
            <Button label="Choisir une autre vidéo" variant="secondary" onPress={reset} />
          </>
        ) : (
          <>
            <Text style={styles.dropzoneTitle}>Uploade ta vidéo</Text>
            <Text style={styles.dropzoneSubtitle}>
              Live, podcast ou stream — ClipAI détecte les meilleurs moments pour toi.
            </Text>
            {error && <Text style={styles.error}>{error}</Text>}
            {stage === "failed" && videoId && (
              <Text style={styles.error}>Le traitement a échoué. Réessaie avec une autre vidéo.</Text>
            )}
            <Button label="Choisir une vidéo" onPress={pickVideo} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  usageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  usageLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  usageValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  dropzone: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  dropzoneTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  dropzoneSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
  },
});
