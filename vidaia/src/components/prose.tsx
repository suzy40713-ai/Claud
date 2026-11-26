export function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-8 pb-24">
      <h1 className="text-3xl font-black">{title}</h1>
      <div className="mt-6 grid gap-4 leading-relaxed muted [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white">
        {children}
      </div>
    </main>
  );
}
