import { Prose } from "@/components/prose";
import { legal } from "@/lib/legal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentions légales" };

export default function Page() {
  const l = legal();
  return (
    <Prose title="Mentions légales">
      <h2>Éditeur</h2>
      <p>
        {l.company} ({l.form})<br />
        Adresse : {l.address}<br />
        SIREN : {l.siren} · TVA : {l.vat}<br />
        Directeur de la publication : {l.director}<br />
        Contact : {l.email}
      </p>
      <h2>Hébergement</h2>
      <p>Application : Render Services, Inc., 525 Brannan Street, San Francisco, CA 94107, États-Unis. Base de données : Supabase, Inc.</p>
      <h2>Services utilisés</h2>
      <p>Paiement : Stripe. Écriture des scripts : Groq. Voix off : ElevenLabs. Emails : Resend.</p>
    </Prose>
  );
}
