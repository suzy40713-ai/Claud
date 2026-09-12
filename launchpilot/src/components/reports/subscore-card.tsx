import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SubscoreDetail } from "@/types/database";

const PRIORITY_VARIANT: Record<SubscoreDetail["priority"], "destructive" | "warning" | "secondary"> = {
  haute: "destructive",
  moyenne: "warning",
  basse: "secondary",
};

export function SubscoreCard({ subscore }: { subscore: SubscoreDetail }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{subscore.label}</p>
            <p className={cn("text-2xl font-bold", subscore.score >= 70 ? "text-success" : subscore.score >= 45 ? "text-warning" : "text-destructive")}>
              {subscore.score}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </p>
          </div>
          <Badge variant={PRIORITY_VARIANT[subscore.priority]} className="capitalize">
            Priorité {subscore.priority}
          </Badge>
        </div>
        <Progress value={subscore.score} className="h-1.5" />
        <div className="space-y-1.5 pt-1 text-sm">
          <p>
            <span className="font-medium text-foreground">Problème : </span>
            <span className="text-muted-foreground">{subscore.problem}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Recommandation : </span>
            <span className="text-muted-foreground">{subscore.recommendation}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
