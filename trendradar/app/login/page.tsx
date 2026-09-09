import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-glow bg-background px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-xl font-bold">
          <span className="text-accent-light">◈</span> TrendRadar
        </Link>
        <div className="glass-card rounded-2xl p-8">
          <h1 className="mb-1 text-2xl font-bold">Bon retour</h1>
          <p className="mb-6 text-sm text-white/60">
            Connecte-toi pour retrouver tes idées.
          </p>
          <Suspense>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
