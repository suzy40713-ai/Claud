import { Footer } from "@/components/marketing/footer";
import { Navbar } from "@/components/marketing/navbar";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      <Navbar />
      <main id="contenu">{children}</main>
      <Footer />
    </>
  );
}
