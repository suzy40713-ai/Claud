import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CourseViewer } from "./CourseViewer";
import { formationApi, type CourseContent } from "./api";
import { Message } from "./Layout";

export function CoursePage() {
  const [params] = useSearchParams();
  const token = params.get("acces") ?? "";
  const [content, setContent] = useState<CourseContent | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Formation · Studio Cartoon";
    if (!token) {
      setError("Utilise le lien reçu par email après ton achat.");
      return;
    }
    formationApi
      .content(token)
      .then(setContent)
      .catch((e) => setError(e.status === 403 ? "Ce lien n'est pas valide. Utilise le lien reçu par email après ton achat." : "Impossible de charger la formation. Réessaie dans un instant."));
  }, [token]);

  if (error) {
    return (
      <Message title="Accès réservé">
        <p>{error}</p>
        <p>
          <Link className="btn" to="/">
            Découvrir la formation
          </Link>
        </p>
      </Message>
    );
  }
  if (!content) {
    return (
      <Message title="Chargement de ta formation…">
        <p className="small">Un instant.</p>
      </Message>
    );
  }
  return (
    <CourseViewer
      modules={content.modules}
      storageKey="sc-formation"
      subtitle={`${content.meta.modules} modules · ${content.meta.lessons} leçons · ${content.meta.exercises} exercices`}
      extra={
        <a className="dl" href={formationApi.pdfUrl(token)}>
          Télécharger le cahier PDF
        </a>
      }
    />
  );
}
