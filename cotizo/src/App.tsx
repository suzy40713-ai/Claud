import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Onboarding } from "./components/Onboarding";
import { Dashboard } from "./components/Dashboard";
import { loadData, saveData, type CotizoData } from "./lib/storage";
import { checkForProUnlockInUrl } from "./lib/pro";
import type { ActivityType } from "./lib/rates";

export default function App() {
  const [data, setData] = useState<CotizoData>(() => loadData());

  function update(patch: Partial<CotizoData>) {
    setData((prev) => {
      const next = { ...prev, ...patch };
      saveData(next);
      return next;
    });
  }

  useEffect(() => {
    if (checkForProUnlockInUrl()) {
      update({ pro: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOnboard(activity: ActivityType) {
    update({ activity });
  }

  function handleReset() {
    if (!confirm("Reinitialiser ton profil et ton historique ? Cette action efface tes donnees locales.")) return;
    const fresh: CotizoData = { activity: null, versementLiberatoire: false, entries: [], pro: data.pro };
    setData(fresh);
    saveData(fresh);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AnimatePresence mode="wait">
        {!data.activity ? (
          <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Onboarding onSelect={handleOnboard} />
          </motion.div>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard data={data} onUpdate={update} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
