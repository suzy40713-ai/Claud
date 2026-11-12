import { redirect } from "next/navigation";

/** Les réglages de notifications sont désormais gérés dans Autopilot (anciens liens conservés). */
export default function NotificationSettingsPage() {
  redirect("/tableau-de-bord/autopilot");
}
