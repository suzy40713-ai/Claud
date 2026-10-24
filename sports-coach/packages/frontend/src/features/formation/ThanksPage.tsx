import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { formationApi } from "./api";
import { Message } from "./Layout";

export function ThanksPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") ?? "";
  const [state, setState] = useState<{ token?: string; email?: string | null; error?: string }>({});

  useEffect(() => {
    document.title = "Merci · Studio Cartoon";
    if (!sessionId) {
      setState({ error: "Aucun paiement à vérifier." });
      return;
    }
    let tries = 0;
    const attempt = () =>
      formationApi
        .confirm(sessionId)
        .then((r) => setState(r))
        .catch((e) => {
          // Stripe peut confirmer le paiement avec quelques secondes de retard.
          if (e.status === 402 && tries++ < 5) setTimeout(attempt, 2000);
          else setState({ error: e.message });
        });
    attempt();
  }, [sessionId]);

  if (state.error) {
    return (
      <Message title="Un souci avec ton paiement">
        <p>{state.error}</p>
        <p className="small">Si tu as été débité, réponds à l'email de confirmation Stripe : on te renverra ton accès.</p>
        <p>
          <Link to="/">Retour à l'accueil</Link>
        </p>
      </Message>
    );
  }
  if (!state.token) {
    return (
      <Message title="Vérification de ton paiement…">
        <p className="small">Un instant.</p>
      </Message>
    );
  }
  const courseLink = `/formation?acces=${encodeURIComponent(state.token)}`;
  return (
    <Message title="Merci pour ton achat !">
      <p>Ton paiement est confirmé. Voici ton accès personnel à la formation :</p>
      <p>
        <Link className="btn" to={courseLink}>
          Ouvrir la formation
        </Link>
      </p>
      <p>
        <a href={formationApi.pdfUrl(state.token)}>Télécharger le cahier PDF</a>
      </p>
      <p className="small">
        {state.email
          ? `Le lien et le PDF sont aussi envoyés à ${state.email}. Garde cet email pour revenir quand tu veux.`
          : "Ajoute cette page à tes favoris : le lien ci-dessus est ton accès personnel."}
      </p>
    </Message>
  );
}
