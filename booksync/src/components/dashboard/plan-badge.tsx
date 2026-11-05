import { Badge } from "@/components/ui/badge";
import { getPlan, type PlanId } from "@/domain/billing/plans";

export function PlanBadge({ plan }: { plan: PlanId }) {
  return (
    <Badge variant={plan === "free" ? "neutral" : "primary"} className="mt-1">
      Forfait {getPlan(plan).name}
    </Badge>
  );
}
