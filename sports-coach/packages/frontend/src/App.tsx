import { Navigate, Route, Routes } from "react-router";
import { SalesPage } from "./features/formation/SalesPage";
import { PreviewPage } from "./features/formation/PreviewPage";
import { CoursePage } from "./features/formation/CoursePage";
import { ThanksPage } from "./features/formation/ThanksPage";
import { CgvPage, MentionsPage, PrivacyPage } from "./features/formation/LegalPages";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SalesPage />} />
      <Route path="/apercu" element={<PreviewPage />} />
      <Route path="/formation" element={<CoursePage />} />
      <Route path="/merci" element={<ThanksPage />} />
      <Route path="/mentions-legales" element={<MentionsPage />} />
      <Route path="/cgv" element={<CgvPage />} />
      <Route path="/confidentialite" element={<PrivacyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
