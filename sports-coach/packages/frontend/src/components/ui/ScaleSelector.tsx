interface ScaleSelectorProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
}

export function ScaleSelector({ label, value, onChange, lowLabel, highLabel }: ScaleSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-12 w-12 items-center justify-center rounded-full border text-lg font-semibold transition-colors ${
              value === n
                ? "border-indigo-600 bg-indigo-600 text-white"
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
