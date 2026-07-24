import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../constants/theme";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page introuvable</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Retour à l'accueil</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 18,
  },
  link: {
    padding: spacing.sm,
  },
  linkText: {
    color: colors.primary,
  },
});
