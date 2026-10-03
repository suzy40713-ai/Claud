import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/forms";

export const metadata = {
  title: "Créer un compte",
  description: "Crée ton compte AdHunter gratuit et commence à analyser les publicités de ton marché.",
  alternates: { canonical: "/signup" },
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { plan } = await searchParams;
  const next = plan === "pro" || plan === "business" ? `/app/billing?plan=${plan}` : "/app";
  return (
    <AuthCard
      title="Crée ton compte gratuit"
      description="Sans carte bancaire. Tu pourras passer à Pro ou Business à tout moment depuis ton espace."
      footer={<>Déjà inscrit ? <Link href="/login" className="text-foreground hover:underline">Se connecter</Link></>}
    >
      <SignupForm next={next} />
    </AuthCard>
  );
}
