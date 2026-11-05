import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  color,
  className,
}: {
  name: string;
  src?: string | null;
  color?: string | null;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-[13px] font-semibold text-primary-soft-foreground",
        className,
      )}
      style={!src && color ? { backgroundColor: `${color}1f`, color } : undefined}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
