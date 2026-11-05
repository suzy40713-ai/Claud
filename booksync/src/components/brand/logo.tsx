import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7", className)}>
      <rect width="32" height="32" rx="8" fill="#3563E9" />
      <rect x="8" y="10" width="16" height="14" rx="3" fill="none" stroke="white" strokeWidth="2" />
      <path d="M8 14.5h16M12.5 8v4M19.5 8v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path
        d="m12.8 19 2.2 2.1 4.2-4.2"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-[17px]">BookSync</span>
    </span>
  );
}
