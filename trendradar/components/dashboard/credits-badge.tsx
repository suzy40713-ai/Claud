import Link from "next/link";
import { getPlan } from "@/lib/plans";
import type { Profile } from "@/lib/supabase/types";

export function CreditsBadge({ profile }: { profile: Profile }) {
  const plan = getPlan(profile.plan);

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-xs text-white/40">Recherches restantes</p>
        <p className="text-sm font-semibold">
          {profile.search_credits} / {plan.searchCreditsPerMonth}
        </p>
      </div>
      <span className="rounded-full bg-accent-gradient px-3 py-1 text-xs font-semibold capitalize">
        {plan.name}
      </span>
      {profile.plan === "free" && (
        <Link
          href="/dashboard/settings"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/5"
        >
          Passer Pro
        </Link>
      )}
    </div>
  );
}
