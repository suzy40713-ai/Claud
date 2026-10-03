import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptions() {
  const admin = createAdminClient();
  const { data: subs } = await admin.from("subscriptions").select("*").neq("status", "inactive").order("updated_at", { ascending: false }).limit(300);
  const ids = (subs ?? []).map((s) => s.user_id);
  const { data: profiles } = ids.length ? await admin.from("profiles").select("id, email").in("id", ids) : { data: [] };
  const emails = new Map((profiles ?? []).map((p) => [p.id, p.email]));
  const dashboard = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") ? "https://dashboard.stripe.com/test" : "https://dashboard.stripe.com";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Abonnements</h1>
      <p className="text-sm text-muted-foreground">Synchronisés depuis Stripe par webhook. Les remboursements et litiges se gèrent dans le tableau de bord Stripe.</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-card text-left text-xs text-muted-foreground">
            <tr><th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Formule</th><th className="p-3 font-medium">Statut</th><th className="p-3 font-medium">Source</th><th className="p-3 font-medium">Fin de période</th><th className="p-3 font-medium">Stripe</th></tr>
          </thead>
          <tbody>
            {(subs ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Aucun abonnement.</td></tr>}
            {(subs ?? []).map((s) => (
              <tr key={s.user_id} className="border-t border-border">
                <td className="p-3">{emails.get(s.user_id) ?? s.user_id}</td>
                <td className="p-3">{s.plan}</td>
                <td className="p-3">{s.status}{s.cancel_at_period_end && <span className="ml-1 text-xs text-warning">(résiliation programmée)</span>}</td>
                <td className="p-3 text-xs">{s.source}</td>
                <td className="p-3 text-xs">{formatDate(s.current_period_end)}</td>
                <td className="p-3 text-xs">
                  {s.stripe_customer_id ? <a className="text-violet-400 hover:underline" href={`${dashboard}/customers/${s.stripe_customer_id}`} target="_blank" rel="noopener noreferrer">Ouvrir</a> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
