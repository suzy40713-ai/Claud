import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-glow bg-background px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-xl font-bold">
          <span className="text-accent-light">◈</span> TrendRadar
        </Link>
        <div className="glass-card rounded-2xl p-8">
          <h1 className="mb-1 text-2xl font-bold">Commence gratuitement</h1>
          <p className="mb-6 text-sm text-white/60">
            5 recherches offertes chaque mois. Sans carte bancaire.
          </p>
          <Suspense>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
