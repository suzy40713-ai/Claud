"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { AnnonceRecrutement } from "@/types";

export default function EssaiModal({
  annonce,
  onClose,
}: {
  annonce: AnnonceRecrutement | null;
  onClose: () => void;
}) {
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [sent, setSent] = useState(false);

  const handleClose = () => {
    onClose();
    setTimeout(() => setSent(false), 300);
  };

  return (
    <Modal open={!!annonce} onClose={handleClose} title={annonce ? `Essai chez ${annonce.auteurNom}` : ""}>
      {!sent ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Proposez un créneau d&apos;essai pour le poste {annonce ? annonce.titre : ""}.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:border-accent/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Heure</label>
            <input
              type="time"
              value={heure}
              onChange={(e) => setHeure(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:border-accent/40 focus:outline-none"
            />
          </div>
          <Button className="w-full" disabled={!date || !heure} onClick={() => setSent(true)}>
            Proposer ce créneau
          </Button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15"
          >
            <CheckCircle2 className="h-7 w-7 text-accent" />
          </motion.div>
          <p className="font-semibold">Essai proposé le {date} à {heure} !</p>
          <p className="mt-1 text-sm text-muted">Le club recevra votre proposition par message.</p>
        </motion.div>
      )}
    </Modal>
  );
}
