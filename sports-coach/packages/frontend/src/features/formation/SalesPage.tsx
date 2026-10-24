import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { formationApi, formatPrice } from "./api";
import { Footer, TopBar } from "./Layout";

const PROGRAM: [string, string][] = [
  ["1. Comprendre le format", "Les trois rôles, les trois formats et le personnage récurrent qui fait s'abonner."],
  ["2. Trouver des idées", "La formule en 3 questions, la méthode lieu × défaut et 60 idées prêtes."],
  ["3. Écrire le script", "La structure en 7 temps, les chutes qui marchent, la réécriture en 3 passes."],
  ["4. Les hooks", "12 formules et les règles du texte à l'écran pour les 2 premières secondes."],
  ["5. Ton univers visuel", "Personnage, seconds rôles, décors et bouches, sans savoir dessiner."],
  ["6. La voix et le son", "Voix de synthèse ou la tienne, ambiance, effets et volumes."],
  ["7. Monter dans CapCut", "Animer, faire parler, zoomer, sous-titrer, carte de fin, export."],
  ["8. Produire en série", "Le travail par lots et le projet modèle pour une vidéo par jour."],
  ["9. Publier", "Heure, légende, hashtags, couvertures et plusieurs plateformes."],
  ["10. Grandir", "Profil, commentaires, saisons et lecture des statistiques."],
  ["11. Monétiser", "Programmes créateurs, partenariats et produits, avec réalisme."],
  ["Bonus", "Checklist, modèles à remplir et 20 scripts complets."],
];

const FAQ: [string, string][] = [
  ["Faut-il savoir dessiner ?", "Non. La formation explique comment créer des personnages simples avec des outils d'images IA et de découpe, et comment les réutiliser."],
  ["Quels outils faut-il ?", "Un téléphone ou un ordinateur, CapCut (version gratuite suffisante) et, au choix, Canva ou un outil de génération d'images. Les fonctions des outils évoluent : vérifie leurs conditions d'utilisation."],
  ["Comment se présente la formation ?", "Une formation en ligne de 13 modules et 59 leçons, à suivre à ton rythme sur téléphone ou ordinateur, avec ta progression enregistrée. Tu reçois aussi le cahier d'exercices PDF de 44 pages."],
  ["Combien de temps faut-il ?", "Environ une heure par jour pendant 30 jours. Le premier épisode prend 2 à 4 heures, le temps de créer ton kit ; ensuite, compte 30 à 45 minutes par épisode."],
  ["Est-ce que je vais avoir des abonnés ?", "Je ne peux pas le promettre. La formation te donne la méthode pour publier de façon régulière et cohérente, ce qui augmente tes chances."],
  ["J'ai perdu mon lien d'accès", "Retrouve l'email reçu après ton achat, ou réponds à cet email avec l'adresse utilisée pour payer."],
];

export function SalesPage() {
  const navigate = useNavigate();
  const [price, setPrice] = useState<string>("—");
  const [configured, setConfigured] = useState(true);
  const [waiver, setWaiver] = useState(false);
  const [buyMsg, setBuyMsg] = useState("");
  const [buying, setBuying] = useState(false);
  const [email, setEmail] = useState("");
  const [leadMsg, setLeadMsg] = useState("");
  const [leading, setLeading] = useState(false);

  useEffect(() => {
    document.title = "Studio Cartoon · Formation sketchs animés";
    if (window.location.hash) {
      setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView(), 50);
    }
    formationApi
      .status()
      .then((s) => {
        setPrice(formatPrice(s.priceCents, s.currency));
        setConfigured(s.configured);
      })
      .catch(() => setConfigured(false));
  }, []);

  async function buy() {
    if (!waiver) {
      setBuyMsg("Coche la case d'accès immédiat pour continuer.");
      return;
    }
    setBuying(true);
    setBuyMsg("");
    try {
      const { url } = await formationApi.checkout();
      window.location.href = url;
    } catch (e) {
      setBuyMsg(e instanceof Error ? e.message : "Le paiement est indisponible pour le moment.");
      setBuying(false);
    }
  }

  async function lead(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLeadMsg("Entre une adresse email valide.");
      return;
    }
    setLeading(true);
    setLeadMsg("");
    try {
      await formationApi.lead(email.trim().toLowerCase());
    } catch {
      /* l'aperçu reste accessible même si l'inscription échoue */
    }
    navigate("/apercu");
  }

  return (
    <>
      <TopBar />
      <header className="hero">
        <div className="wrap">
          <span className="tag">FORMATION EN LIGNE + CAHIER PDF</span>
          <h1>La formation complète pour créer tes sketchs animés</h1>
          <p>
            De l'idée à la vidéo publiée : écris tes scripts, crée ton personnage, ajoute la voix, monte dans CapCut
            et construis une série qui donne envie de s'abonner.
          </p>
          <div className="ctas">
            <a className="btn" href="#acheter">
              Je veux la formation
            </a>
            <a className="btn ghost" href="#apercu">
              Aperçu gratuit
            </a>
          </div>
          <div className="sub">13 modules · 59 leçons · 55 exercices · 20 scripts complets · cahier PDF de 44 pages</div>
        </div>
      </header>

      <section className="band">
        <div className="wrap">
          <h2>Tu reconnais ce problème ?</h2>
          <ul className="ticks">
            <li>Tu veux faire des vidéos animées mais tu ne sais pas par où commencer.</li>
            <li>Tu manques d'idées, ou tu perds des heures sur un seul script.</li>
            <li>Tes vidéos sont regardées mais personne ne s'abonne.</li>
            <li>Tu ne sais pas dessiner, et tu penses que c'est un obstacle.</li>
          </ul>
          <p>
            Cette formation te donne une méthode simple et répétable pour produire des vidéos courtes animées{" "}
            <b>sans savoir dessiner ni programmer</b>.
          </p>
        </div>
      </section>

      <section className="band" id="programme">
        <div className="wrap">
          <h2>Le programme</h2>
          <div className="grid">
            {PROGRAM.map(([t, d]) => (
              <div className="card" key={t}>
                <b>{t}</b>
                {d}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band" id="apercu">
        <div className="wrap">
          <h2>Essaie gratuitement les deux premiers modules</h2>
          <p>
            Laisse ton email et accède tout de suite à l'aperçu : comprendre le format et créer le personnage récurrent
            qui fait s'abonner.
          </p>
          <form className="lead" onSubmit={lead} noValidate>
            <label htmlFor="leadEmail" className="small" style={{ flexBasis: "100%" }}>
              Ton adresse email
            </label>
            <input
              id="leadEmail"
              type="email"
              autoComplete="email"
              placeholder="prenom@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn" type="submit" disabled={leading}>
              Voir l'aperçu
            </button>
          </form>
          <p className="err" role="status">
            {leadMsg}
          </p>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>Pour qui ?</h2>
          <div className="grid">
            <div className="card">
              <b>Cette formation est pour toi si…</b>
              <ul className="ticks">
                <li>tu veux créer du contenu animé régulièrement</li>
                <li>tu aimes l'humour et les situations du quotidien</li>
                <li>tu es prêt à publier chaque jour pendant quelques semaines</li>
              </ul>
            </div>
            <div className="card">
              <b>Cette formation n'est pas pour toi si…</b>
              <ul className="ticks cross">
                <li>tu cherches un résultat garanti sans effort</li>
                <li>tu veux des animations 3D ou du dessin à la main</li>
                <li>tu n'es pas prêt à publier régulièrement</li>
              </ul>
            </div>
          </div>
          <div className="note">
            <b>Ce que je ne te promets pas.</b> Je ne peux pas te garantir un nombre d'abonnés, de vues ou de revenus :
            ça dépend de l'algorithme, de ta régularité et de tes idées. Cette formation est une méthode de travail
            complète, avec des exercices et des modèles concrets.
          </div>
        </div>
      </section>

      <section className="band" id="acheter">
        <div className="wrap">
          <div className="buy">
            <h2>Accède à la formation complète</h2>
            <div className="amount">{price}</div>
            <p className="small">Paiement unique · accès immédiat · cahier PDF inclus</p>
            <label className="waiver" htmlFor="waiver">
              <input id="waiver" type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} />
              Je demande l'accès immédiat à la formation et je reconnais perdre mon droit de rétractation une fois
              l'accès commencé (contenu numérique).
            </label>
            <button className="btn" type="button" onClick={buy} disabled={buying || !configured}>
              Je veux la formation
            </button>
            <p className="err" role="status">
              {configured ? buyMsg : "Le paiement n'est pas encore activé sur ce site."}
            </p>
            <p className="small">Paiement sécurisé par Stripe. Tu reçois ton lien d'accès et le PDF par email.</p>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>Questions fréquentes</h2>
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
