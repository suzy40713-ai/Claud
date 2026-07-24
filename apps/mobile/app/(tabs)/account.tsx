import { useAuth, useUser } from "@clerk/clerk-expo";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { colors, radius, spacing } from "../../constants/theme";

export default function AccountScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress ?? "—"}</Text>
        <Text style={styles.plan}>Plan Free — 30 min/mois</Text>
      </View>

      <Button label="Passer Pro" onPress={() => {}} disabled />
      <View style={{ height: spacing.sm }} />
      <Button label="Se déconnecter" variant="secondary" onPress={() => signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  email: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  plan: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
});
