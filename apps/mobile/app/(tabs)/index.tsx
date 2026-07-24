import { StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { colors, radius, spacing } from "../../constants/theme";

export default function UploadScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.usageCard}>
        <Text style={styles.usageLabel}>Minutes utilisées ce mois-ci</Text>
        <Text style={styles.usageValue}>0 / 30 min</Text>
      </View>

      <View style={styles.dropzone}>
        <Text style={styles.dropzoneTitle}>Uploade ta vidéo</Text>
        <Text style={styles.dropzoneSubtitle}>
          Live, podcast ou stream — ClipAI détecte les meilleurs moments pour toi.
        </Text>
        <Button label="Choisir une vidéo" onPress={() => {}} disabled />
        <Text style={styles.comingSoon}>Upload disponible à la prochaine étape</Text>
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
  },
  dropzoneSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  comingSoon: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
