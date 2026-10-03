import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Small "i" icon with an explanatory tooltip, for beginners. */
export function InfoTip({ children, label = "Plus d'informations" }: { children: React.ReactNode; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger type="button" aria-label={label} className="inline-flex text-muted-foreground transition-colors hover:text-foreground">
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-[13px] leading-relaxed">{children}</TooltipContent>
    </Tooltip>
  );
}
