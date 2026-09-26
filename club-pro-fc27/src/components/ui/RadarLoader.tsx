export default function RadarLoader({ size = 160 }: { size?: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-full border border-accent/25 bg-[radial-gradient(circle,rgba(23,229,138,0.08)_0%,transparent_70%)]"
      style={{ width: size, height: size }}
    >
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border border-accent/15"
          style={{ transform: `scale(${i * 0.33})` }}
        />
      ))}
      <div className="animate-radar absolute inset-0 origin-center">
        <div
          className="absolute top-1/2 left-1/2 h-1/2 w-1/2 origin-top-left"
          style={{
            background: "conic-gradient(from 0deg, rgba(23,229,138,0.55), transparent 60%)",
          }}
        />
      </div>
      <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_4px_rgba(23,229,138,0.6)]" />
    </div>
  );
}
