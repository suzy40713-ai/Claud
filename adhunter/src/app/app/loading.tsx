export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement">
      <div className="skeleton h-8 w-56" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
      </div>
      <div className="skeleton h-64 w-full" />
    </div>
  );
}
