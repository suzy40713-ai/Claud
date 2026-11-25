import { notFound } from "next/navigation";
import { BOOKING_ENABLED } from "@/lib/features";

/** Pages publiques de réservation (page d'un établissement, rendez-vous, avis, cartes cadeaux). */
export default function PublicBookingLayout({ children }: { children: React.ReactNode }) {
  if (!BOOKING_ENABLED) notFound();
  return children;
}
