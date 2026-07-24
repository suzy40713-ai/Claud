import { useSignIn, useSSO } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { Button } from "../../components/Button";
import { colors, radius, spacing } from "../../constants/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<"google" | "apple" | null>(null);

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  const onSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setError(null);
    setLoading(true);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setError("Connexion incomplète — vérifie tes identifiants.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de se connecter.");
    } finally {
      setLoading(false);
    }
  }, [email, password, isLoaded, signIn, setActive, router]);

  const onSSO = useCallback(
    async (strategy: "oauth_google" | "oauth_apple") => {
      setError(null);
      setSsoLoading(strategy === "oauth_google" ? "google" : "apple");
      try {
        const { createdSessionId, setActive: setActiveSSO } = await startSSOFlow({ strategy });
        if (createdSessionId && setActiveSSO) {
          await setActiveSSO({ session: createdSessionId });
          router.replace("/(tabs)");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connexion impossible.");
      } finally {
        setSsoLoading(null);
      }
    },
    [startSSOFlow, router],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ClipAI</Text>
      <Text style={styles.subtitle}>Transforme tes lives en clips viraux</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button label="Se connecter" onPress={onSignIn} loading={loading} />
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      <Button
        label="Continuer avec Google"
        variant="secondary"
        loading={ssoLoading === "google"}
        onPress={() => onSSO("oauth_google")}
      />
      <View style={{ height: spacing.sm }} />
      <Button
        label="Continuer avec Apple"
        variant="secondary"
        loading={ssoLoading === "apple"}
        onPress={() => onSSO("oauth_apple")}
      />

      <Link href="/(auth)/sign-up" style={styles.link}>
        <Text style={styles.linkText}>Pas encore de compte ? Créer un compte</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
  },
  link: {
    marginTop: spacing.xl,
    alignSelf: "center",
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
  },
});
