interface ScaleSelectorProps {
  label: string;
  icon?: string;
  value: number | null;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
}

export function ScaleSelector({ label, icon, value, onChange, lowLabel, highLabel }: ScaleSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-base font-semibold text-slate-700">
        {icon && (
          <span className="text-xl" aria-hidden>
            {icon}
          </span>
        )}
        {label}
      </span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border text-lg font-semibold transition-all ${
              value === n
                ? "scale-105 border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
            }`}
            aria-pressed={value === n}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
