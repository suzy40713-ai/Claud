import type { Metadata } from "next";
import { Suspense } from "react";
import { MailCheck } from "lucide-react";
import { ResendVerification } from "./resend-verification";

export const metadata: Metadata = { title: "Vérifiez votre email" };

export default function VerifyEmailPage() {
  return (
    <div className="text-center sm:text-left">
      <span className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
        <MailCheck className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Vérifiez votre boîte mail</h1>
      <Suspense>
        <ResendVerification />
      </Suspense>
    </div>
  );
}
