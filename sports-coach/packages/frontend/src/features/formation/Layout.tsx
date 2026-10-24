import { Link } from "react-router";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="wrap">
        <Link className="brand" to="/">
          Studio Cartoon
        </Link>
        <nav aria-label="Navigation principale">
          <a href="#programme">Programme</a>
          <a href="#apercu">Aperçu gratuit</a>
          <a href="#acheter">Acheter</a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <Link to="/mentions-legales">Mentions légales</Link> · <Link to="/cgv">Conditions générales de vente</Link> ·{" "}
        <Link to="/confidentialite">Confidentialité</Link>
        <br />
        Les résultats varient selon chaque personne. Aucun résultat n'est garanti.
      </div>
    </footer>
  );
}

export function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="wrap msg">
      <p className="tag">STUDIO CARTOON</p>
      <h1>{title}</h1>
      {children}
    </main>
  );
}
