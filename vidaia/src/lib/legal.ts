/** Identité légale de l'éditeur, lue au moment de l'affichage (mêmes variables que BookSync). */
export function legal() {
  const v = (k: string) => process.env[k]?.trim() || "à compléter";
  return {
    company: v("NEXT_PUBLIC_LEGAL_COMPANY"),
    form: v("NEXT_PUBLIC_LEGAL_FORM"),
    address: v("NEXT_PUBLIC_LEGAL_ADDRESS"),
    siren: v("NEXT_PUBLIC_LEGAL_SIREN"),
    vat: v("NEXT_PUBLIC_LEGAL_VAT"),
    director: v("NEXT_PUBLIC_LEGAL_DIRECTOR"),
    email: v("NEXT_PUBLIC_LEGAL_EMAIL"),
  };
}
