import type { Metadata } from "next";

import { Logo } from "@/components/logo";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-grid-fade bg-background px-4 py-12">
      <div className="mb-10 flex justify-center">
        <Logo />
      </div>
      <OnboardingWizard />
    </div>
  );
}
