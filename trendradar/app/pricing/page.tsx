import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { PricingSection } from "@/components/landing/pricing-section";
import { Faq } from "@/components/landing/faq";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="px-6 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold md:text-5xl">Tarifs simples</h1>
          <p className="mt-4 text-lg text-white/60">
            Un système de crédits flexible. Commence gratuitement, évolue à ton rythme.
          </p>
        </div>
        <PricingSection standalone />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
