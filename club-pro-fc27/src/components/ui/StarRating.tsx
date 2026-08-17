"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  const dim = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(i)}
          onMouseLeave={() => !readOnly && setHover(null)}
          onClick={() => onChange?.(i)}
          className={cn(!readOnly && "cursor-pointer")}
        >
          <Star
            className={cn(dim, i <= display ? "fill-gold text-gold" : "text-white/15")}
          />
        </button>
      ))}
    </div>
  );
}
