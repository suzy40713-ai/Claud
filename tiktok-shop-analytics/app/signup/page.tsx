import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Inscription — TikTok Shop Analytics",
};

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-neutral-900">
          Créer un compte
        </h1>
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
