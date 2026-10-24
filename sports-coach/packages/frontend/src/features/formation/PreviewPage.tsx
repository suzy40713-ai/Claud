import { useEffect } from "react";
import { Link } from "react-router";
import preview from "./preview.json";
import { CourseViewer } from "./CourseViewer";
import type { CourseContent } from "./api";

export function PreviewPage() {
  useEffect(() => {
    document.title = "Aperçu gratuit · Studio Cartoon";
  }, []);
  const content = preview as CourseContent;
  return (
    <CourseViewer
      modules={content.modules}
      storageKey="sc-apercu"
      subtitle="Aperçu gratuit · modules 0 et 1"
      lastIsBonus={false}
      extra={
        <Link className="dl" to="/#acheter">
          Débloquer tout
        </Link>
      }
    />
  );
}
