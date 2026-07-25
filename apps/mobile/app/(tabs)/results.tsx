import { useAuth } from "@clerk/clerk-expo";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { colors, radius, spacing } from "../../constants/theme";
import { deleteClip, getClipDownloadUrl, getVideo, listVideos, type Clip, type Video } from "../../services/videos";

type ClipWithVideo = Clip & { video: Video };

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ResultsScreen() {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clips, setClips] = useState<ClipWithVideo[]>([]);
  const [processingVideos, setProcessingVideos] = useState<Video[]>([]);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const videos = await listVideos(getToken);

    setProcessingVideos(videos.filter((v) => v.status === "queued" || v.status === "processing"));

    const completed = videos.filter((v) => v.status === "completed");
    const details = await Promise.all(completed.map((v) => getVideo(getToken, v.id)));

    const flattened = details.flatMap((detail) =>
      detail.clips.map((clip) => ({ ...clip, video: { ...detail } })),
    );
    flattened.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    setClips(flattened);
  }, [getToken]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const onDelete = useCallback(
    async (clipId: string) => {
      setClips((prev) => prev.filter((c) => c.id !== clipId));
      await deleteClip(getToken, clipId);
    },
    [getToken],
  );

  const onExport = useCallback(
    async (clipId: string) => {
      setExportingId(clipId);
      try {
        const { downloadUrl } = await getClipDownloadUrl(getToken, clipId);
        const file = await File.downloadFileAsync(downloadUrl, Paths.cache, { idempotent: true });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri);
        }
      } finally {
        setExportingId(null);
      }
    },
    [getToken],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (clips.length === 0 && processingVideos.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Aucun clip pour l'instant</Text>
        <Text style={styles.emptySubtitle}>
          Tes clips générés apparaîtront ici une fois une vidéo traitée.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={clips}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        processingVideos.length > 0 ? (
          <View style={styles.processingSection}>
            {processingVideos.map((video) => (
              <View key={video.id} style={styles.processingRow}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.processingText} numberOfLines={1}>
                  {video.originalFilename} — {video.status === "queued" ? "en attente" : "traitement en cours"}
                </Text>
              </View>
            ))}
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.caption} numberOfLines={2}>
              {item.captionText ?? item.video.originalFilename}
            </Text>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{formatDuration(item.durationSeconds)}</Text>
            </View>
          </View>
          <Text style={styles.sourceText} numberOfLines={1}>
            Depuis {item.video.originalFilename}
          </Text>
          <View style={styles.actions}>
            <Button
              label="Exporter"
              onPress={() => onExport(item.id)}
              loading={exportingId === item.id}
            />
            <Button label="Supprimer" variant="secondary" onPress={() => onDelete(item.id)} />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  processingSection: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  processingText: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  caption: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  durationBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  durationText: {
    color: colors.textMuted,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  sourceText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
