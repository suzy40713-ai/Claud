import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../../constants/theme";

export default function ResultsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aucun clip pour l'instant</Text>
      <Text style={styles.subtitle}>
        Tes clips générés apparaîtront ici une fois une vidéo traitée.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
});
