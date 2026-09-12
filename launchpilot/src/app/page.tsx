import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { WhatWeGenerate } from "@/components/landing/what-we-generate";
import { ExampleSection } from "@/components/landing/example-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhatWeGenerate />
        <ExampleSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
