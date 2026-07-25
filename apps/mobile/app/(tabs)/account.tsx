import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { colors, radius, spacing } from "../../constants/theme";
import { getMe, type Me } from "../../services/account";

const PLAN_LABEL: Record<string, string> = {
  free: "Free — 30 min/mois",
  pro: "Pro — 300 min/mois",
  business: "Business — illimité",
};

export default function AccountScreen() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getMe(getToken);
      setMe(result);
    } catch {
      // account card falls back to Clerk-only info below if this fails
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const plan = me?.subscription?.plan ?? "free";
  const isFree = plan === "free";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress ?? "—"}</Text>
        <Text style={styles.plan}>{PLAN_LABEL[plan] ?? PLAN_LABEL.free}</Text>
        {me && (
          <Text style={styles.usage}>
            {Math.round(me.minutesUsed)} / {me.subscription?.minutesQuota ?? 30} min utilisées ce mois-ci
          </Text>
        )}
      </View>

      {isFree && <Button label="Passer Pro" onPress={() => router.push("/paywall")} />}
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
  usage: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
    fontVariant: ["tabular-nums"],
  },
});
