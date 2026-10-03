import type { Block } from "@/content/blog";

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 text-[15px] leading-7 text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
      {children}
    </div>
  );
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <Prose>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return <h2 key={i}>{b.text}</h2>;
          case "h3":
            return <h3 key={i}>{b.text}</h3>;
          case "ul":
            return <ul key={i}>{b.items.map((it) => <li key={it}>{it}</li>)}</ul>;
          case "ol":
            return <ol key={i}>{b.items.map((it) => <li key={it}>{it}</li>)}</ol>;
          case "quote":
            return <blockquote key={i} className="border-l-2 border-primary pl-4 italic text-foreground">{b.text}</blockquote>;
          default:
            return <p key={i}>{b.text}</p>;
        }
      })}
    </Prose>
  );
}
