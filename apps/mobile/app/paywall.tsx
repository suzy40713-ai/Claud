import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { PurchasesOffering } from "react-native-purchases";

import { Button } from "../components/Button";
import { colors, radius, spacing } from "../constants/theme";
import { getMe, type Me } from "../services/account";
import { configurePurchases, getCurrentOffering, isRevenueCatConfigured, purchasePackage } from "../services/purchases";

const PLANS = [
  { id: "free", name: "Free", minutes: "30 min/mois", price: "Gratuit", packageId: null },
  { id: "pro", name: "Pro", minutes: "300 min/mois", price: "19€/mois", packageId: "pro_monthly" },
  { id: "business", name: "Business", minutes: "Illimité", price: "49€/mois", packageId: "business_monthly" },
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [me, setMe] = useState<Me | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe(getToken).then(setMe).catch(() => {});
    if (user?.id) {
      configurePurchases(user.id);
      getCurrentOffering().then(setOffering).catch(() => {});
    }
  }, [getToken, user?.id]);

  const onSubscribe = async (packageId: string) => {
    if (!offering) return;
    setError(null);
    setPurchasingId(packageId);
    try {
      await purchasePackage(packageId, offering);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Achat impossible.");
    } finally {
      setPurchasingId(null);
    }
  };

  const configured = isRevenueCatConfigured();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Débloque plus de minutes</Text>
      <Text style={styles.subtitle}>
        {me?.subscription
          ? `Plan actuel : ${me.subscription.plan} — ${Math.round(me.minutesUsed)}/${me.subscription.minutesQuota} min utilisées ce mois-ci.`
          : "Choisis le plan qui correspond à ton rythme de publication."}
      </Text>

      {!configured && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            RevenueCat n'est pas encore configuré — les abonnements ne peuvent pas être activés pour
            l'instant. Voir le README pour la configuration.
          </Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {PLANS.map((plan) => {
        const isCurrent = me?.subscription?.plan === plan.id;
        return (
          <View key={plan.id} style={[styles.card, isCurrent && styles.cardCurrent]}>
            <View style={styles.cardHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
            <Text style={styles.planMinutes}>{plan.minutes}</Text>
            {plan.packageId && (
              <Button
                label={isCurrent ? "Plan actuel" : "S'abonner"}
                onPress={() => onSubscribe(plan.packageId)}
                loading={purchasingId === plan.packageId}
                disabled={isCurrent || !configured}
              />
            )}
          </View>
        );
      })}

      <Button label="Fermer" variant="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  notice: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  noticeText: {
    color: colors.textMuted,
    fontSize: 12.5,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardCurrent: {
    borderColor: colors.primary,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  planPrice: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  planMinutes: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
