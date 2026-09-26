import { cn } from "@/lib/utils";

const TONES = {
  green: "bg-accent/12 text-accent border-accent/30",
  gold: "bg-gold/12 text-gold border-gold/30",
  gray: "bg-white/8 text-muted border-white/15",
  red: "bg-danger/12 text-red-400 border-danger/30",
  blue: "bg-sky-500/12 text-sky-400 border-sky-500/30",
};

export default function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
