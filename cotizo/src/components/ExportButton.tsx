export function ExportButton({ pro }: { pro: boolean }) {
  if (!pro) {
    return (
      <button
        disabled
        title="Fonctionnalite Cotizo Pro"
        className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400"
      >
        🔒 Export PDF (Pro)
      </button>
    );
  }

  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
    >
      📄 Export PDF
    </button>
  );
}
