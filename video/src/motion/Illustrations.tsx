import { IllustrationProps, caps, mix, ramp, swell } from "./anim";

// Every illustration draws in a 960×660 box.
const W = 960;
const H = 660;
const FONT = "TheBold, sans-serif";

export const Frame: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <svg
    viewBox={`0 0 ${W} ${H}`}
    width={W}
    height={H}
    style={{ overflow: "visible" }}
  >
    {children}
  </svg>
);

export const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  fill: string;
  opacity?: number;
  anchor?: "start" | "middle" | "end";
}> = ({ x, y, text, size = 40, fill, opacity = 1, anchor = "middle" }) => (
  <text
    x={x}
    y={y}
    fill={fill}
    opacity={opacity}
    fontSize={size}
    fontFamily={FONT}
    textAnchor={anchor}
  >
    {caps(text)}
  </text>
);

// Stroke that draws itself on as `t` goes 0 → 1.
export const dash = (t: number) => ({
  pathLength: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1 - t,
});

// Flat brain made of overlapping lobes; `grow` pops the lobes in one by one.
const LOBES = [
  [-70, -15, 72],
  [-5, -48, 78],
  [62, -18, 72],
  [-88, 42, 58],
  [-25, 45, 66],
  [42, 48, 62],
  [92, 30, 50],
];
export const Brain: React.FC<{
  x: number;
  y: number;
  scale: number;
  grow?: number;
  fill?: string;
  line?: string;
}> = ({ x, y, scale, grow = 1, fill = "#FF9EBB", line = "#E0607E" }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={-6} y={80} width={36} height={70} rx={16} fill={line} />
    {LOBES.map(([cx, cy, r], i) => (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r * ramp(grow * LOBES.length - i, 0, 1)}
        fill={fill}
      />
    ))}
    <g
      opacity={ramp(grow, 0.8, 1)}
      fill="none"
      stroke={line}
      strokeWidth={10}
      strokeLinecap="round"
    >
      <path d="M0 -110 Q-15 -40 5 20 Q20 70 0 95" />
      <path d="M-110 -10 Q-80 -40 -50 -10" />
      <path d="M-100 50 Q-70 25 -45 55" />
      <path d="M45 -60 Q75 -80 95 -45" />
      <path d="M50 20 Q85 0 110 30" />
      <path d="M-50 -70 Q-30 -95 -10 -75" />
    </g>
  </g>
);

const Bolt: React.FC<{ x: number; y: number; s: number; fill: string }> = ({
  x,
  y,
  s,
  fill,
}) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M10 -50 L-25 8 L0 8 L-10 50 L25 -8 L0 -8 Z"
    fill={fill}
  />
);

export const HookArt: React.FC<
  IllustrationProps & { grow: number; stamp: number }
> = ({ frame, c, grow, stamp }) => {
  const stampScale = mix(2.6, 1, ramp(stamp, 0, 1));
  const shake = stamp > 0 && stamp < 1.4 ? Math.sin(frame * 2.2) * 6 : 0;
  return (
    <Frame>
      <g transform={`translate(480 330) rotate(${frame * 0.6})`}>
        {Array.from({ length: 16 }, (_, i) => (
          <path
            key={i}
            d="M0 0 L-40 -420 L40 -420 Z"
            fill={c.accent}
            opacity={0.12}
            transform={`rotate(${i * 22.5})`}
          />
        ))}
      </g>
      <g transform={`translate(0 ${Math.sin(frame / 10) * 8})`}>
        <Brain x={480} y={320} scale={1.9} grow={grow} />
      </g>
      <g
        opacity={ramp(stamp, 0, 0.15)}
        transform={`translate(${480 + shake} 400) rotate(-12) scale(${stampScale})`}
      >
        <rect
          x={-250}
          y={-70}
          width={500}
          height={140}
          rx={18}
          fill="rgba(255,255,255,0.9)"
          stroke="#E63946"
          strokeWidth={14}
        />
        <Label x={0} y={30} text="Top secret" size={92} fill="#E63946" />
      </g>
    </Frame>
  );
};

export const EnergyArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const outline = ramp(frame, 0, 20);
  const weight = ramp(p, 0.1, 0.3);
  const energy = ramp(p, 0.45, 0.8);
  const bars = [
    { x: 130, label: "Poids", value: 2 * weight, fill: c.ink },
    { x: 630, label: "Énergie", value: 20 * energy, fill: c.pop },
  ];
  const base = 560;
  const perPercent = 18;
  const charged = ramp(p, 0.8, 0.9);
  return (
    <Frame>
      {bars.map((b) => {
        const h = b.value * perPercent;
        return (
          <g key={b.label}>
            <rect
              x={b.x}
              y={base - 450}
              width={200}
              height={450}
              rx={24}
              fill="rgba(255,255,255,0.35)"
              stroke={c.ink}
              strokeWidth={8}
              {...dash(outline)}
            />
            <rect
              x={b.x + 14}
              y={base - 14 - h}
              width={172}
              height={h}
              rx={14}
              fill={b.fill}
            />
            <Label
              x={b.x + 100}
              y={base - 40 - h}
              text={`${Math.round(b.value)} %`}
              size={70}
              fill={c.ink}
              opacity={ramp(b.value, 0, 0.3)}
            />
            <Label x={b.x + 100} y={base + 70} text={b.label} fill={c.ink} />
          </g>
        );
      })}
      <g transform={`translate(480 ${330 + Math.sin(frame / 7) * 10})`}>
        <Brain
          x={0}
          y={0}
          scale={0.55 + 0.05 * Math.sin(frame / 4) * charged}
        />
      </g>
      {[
        [600, 120],
        [880, 180],
        [590, 330],
        [890, 400],
      ].map(([x, y], i) => (
        <Bolt
          key={i}
          x={x}
          y={y}
          s={
            ramp(p, 0.8 + i * 0.03, 0.9 + i * 0.03) *
            (1 + 0.1 * Math.sin(frame / 3 + i))
          }
          fill={c.accent}
        />
      ))}
    </Frame>
  );
};

const EYE = "M40 330 Q480 -120 920 330 Q480 780 40 330 Z";
const NOSE =
  "M480 300 C440 350 425 440 395 540 Q480 600 565 540 C535 440 520 350 480 300 Z";

export const NoseArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const outline = ramp(frame, 0, 22);
  const hidden = ramp(p, 0.25, 0.55);
  const back = ramp(p, 0.75, 0.88);
  const noseOpacity = 1 - 0.9 * hidden + 0.9 * back;
  const ring = ramp(p, 0.78, 0.95);
  return (
    <Frame>
      <defs>
        <clipPath id="vision">
          <path d={EYE} />
        </clipPath>
      </defs>
      <g clipPath="url(#vision)" opacity={outline}>
        <rect x={0} y={0} width={W} height={H} fill="#FFF6E5" />
        <circle cx={700} cy={210} r={70} fill={c.accent} />
        <path
          d="M0 470 Q200 330 420 440 Q640 320 960 450 L960 660 L0 660 Z"
          fill={c.ink}
          opacity={0.85}
        />
        <path
          d={NOSE}
          fill={back > 0 ? c.pop : "#F2C9A0"}
          stroke={c.ink}
          strokeWidth={8}
          opacity={noseOpacity}
        />
        <path
          d={NOSE}
          fill="none"
          stroke={c.ink}
          strokeWidth={6}
          strokeDasharray="18 16"
          opacity={hidden * (1 - back) * 0.7}
        />
      </g>
      <path
        d={EYE}
        fill="none"
        stroke={c.ink}
        strokeWidth={14}
        {...dash(outline)}
      />
      <circle
        cx={480}
        cy={450}
        r={mix(30, 105, ring)}
        fill="none"
        stroke={c.pop}
        strokeWidth={12}
        opacity={ring * (1 - ramp(p, 0.95, 1.05))}
      />
    </Frame>
  );
};

export const EyeArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const draw = ramp(frame, 0, 22);
  const retina = ramp(frame, 10, 34);
  const rays = [
    { from: 200, to: 430 },
    { from: 330, to: 330 },
    { from: 460, to: 230 },
  ];
  const spot = ramp(p, 0.15, 0.3);
  const fill = ramp(p, 0.62, 0.82);
  const pulse = 1 + 0.15 * Math.sin(frame / 3);
  return (
    <Frame>
      <path
        d="M735 345 L960 400 L960 470 L720 405 Z"
        fill={c.ink}
        opacity={draw}
      />
      <circle
        cx={520}
        cy={330}
        r={230}
        fill="#FFF6E5"
        stroke={c.ink}
        strokeWidth={10}
        {...dash(draw)}
      />
      <path
        d="M635 131 A230 230 0 0 1 635 529"
        fill="none"
        stroke={c.pop}
        strokeWidth={22}
        strokeLinecap="round"
        {...dash(retina)}
      />
      <ellipse
        cx={300}
        cy={330}
        rx={32}
        ry={95 * draw}
        fill={c.accent}
        stroke={c.ink}
        strokeWidth={6}
      />
      {rays.map((r, i) => (
        <path
          key={i}
          d={`M0 ${r.from} L300 330 L745 ${r.to}`}
          fill="none"
          stroke={c.accent}
          strokeWidth={8}
          strokeLinecap="round"
          {...dash(ramp(frame, 18 + i * 6, 40 + i * 6))}
        />
      ))}
      <circle
        cx={742}
        cy={372}
        r={34 * spot * (fill > 0 ? 1 : pulse)}
        fill={fill > 0 ? c.accent : "none"}
        stroke="#E63946"
        strokeWidth={10}
      />
      <g opacity={spot * (1 - fill)}>
        <path d="M760 400 L820 560" stroke="#E63946" strokeWidth={6} />
        <Label x={820} y={610} text="0 récepteur" size={44} fill="#E63946" />
      </g>
      <g opacity={fill}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path
            key={a}
            d="M0 -48 L0 -70"
            transform={`translate(742 372) rotate(${a + frame * 2})`}
            stroke={c.accent}
            strokeWidth={8}
            strokeLinecap="round"
          />
        ))}
        <Label x={820} y={610} text="Comblé !" size={48} fill={c.ink} />
      </g>
    </Frame>
  );
};

const wave = (y: number, amp: number, phase: number) => {
  const pts: string[] = [];
  for (let x = 80; x <= 880; x += 10) {
    pts.push(`${x},${y + Math.sin(x / 38 + phase) * amp}`);
  }
  return `M${pts.join(" L")}`;
};

export const TickleArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const panels = ramp(frame, 0, 18);
  const prediction = ramp(p, 0, 0.45);
  const sensation = ramp(p, 0.1, 0.6);
  const damp = ramp(p, 0.35, 0.75);
  const phase = frame / 6;
  const panel = (y: number, label: string, color: string) => (
    <g opacity={panels} transform={`translate(0 ${(1 - panels) * 40})`}>
      <rect
        x={40}
        y={y}
        width={880}
        height={270}
        rx={30}
        fill="rgba(255,255,255,0.4)"
        stroke={c.ink}
        strokeWidth={6}
      />
      <rect x={70} y={y - 30} width={330} height={60} rx={30} fill={color} />
      <Label x={235} y={y + 14} text={label} size={36} fill="#FFF6E5" />
    </g>
  );
  return (
    <Frame>
      {panel(40, "Prédiction", c.ink)}
      {panel(370, "Sensation", c.pop)}
      <path
        d={wave(175, 80, phase)}
        fill="none"
        stroke={c.ink}
        strokeWidth={10}
        strokeLinecap="round"
        {...dash(prediction)}
      />
      <path
        d={wave(505, 80 * (1 - 0.88 * damp), phase)}
        fill="none"
        stroke={c.pop}
        strokeWidth={10}
        strokeLinecap="round"
        {...dash(sensation)}
      />
      <g
        opacity={ramp(p, 0.72, 0.8)}
        transform={`translate(700 500) rotate(-10) scale(${mix(1.8, 1, ramp(p, 0.72, 0.82))})`}
      >
        <rect
          x={-170}
          y={-50}
          width={340}
          height={100}
          rx={14}
          fill="#FFF6E5"
          stroke="#E63946"
          strokeWidth={10}
        />
        <Label x={0} y={20} text="Atténuée" size={60} fill="#E63946" />
      </g>
    </Frame>
  );
};

export const MultitaskArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const appear = ramp(frame, 0, 18);
  // Attention flips between the two tasks faster and faster.
  const s = Math.max(0, p) * 160;
  const active = Math.floor(s / 22 + (s / 55) ** 2) % 2;
  const cards = [
    { x: 80, label: "Tâche A" },
    { x: 520, label: "Tâche B" },
  ];
  const timeline = ramp(p, 0.05, 1, (x) => x);
  const unit = 96;
  const segments = Array.from({ length: 9 }, (_, i) => i);
  return (
    <Frame>
      {cards.map((card, i) => {
        const on = p > 0 && active === i;
        return (
          <g
            key={card.label}
            opacity={appear}
            transform={`translate(${card.x + 180} 190) scale(${on ? 1.06 : 0.94}) translate(${-180} -150)`}
          >
            <rect
              x={0}
              y={0}
              width={360}
              height={300}
              rx={30}
              fill="#FFF6E5"
              stroke={on ? c.accent : c.ink}
              strokeWidth={on ? 16 : 6}
            />
            <Label x={180} y={70} text={card.label} size={48} fill={c.ink} />
            {[120, 170, 220].map((y, k) => (
              <rect
                key={y}
                x={50}
                y={y}
                width={k === 2 ? 160 : 260}
                height={22}
                rx={11}
                fill={c.ink}
                opacity={on ? 0.8 : 0.25}
              />
            ))}
          </g>
        );
      })}
      <defs>
        <clipPath id="timeline">
          <rect x={60} y={420} width={840 * timeline} height={100} />
        </clipPath>
      </defs>
      <rect
        x={60}
        y={430}
        width={840}
        height={80}
        rx={20}
        fill="rgba(255,255,255,0.35)"
        stroke={c.ink}
        strokeWidth={6}
        opacity={appear}
      />
      <g clipPath="url(#timeline)">
        {segments.map((i) => (
          <g key={i}>
            <rect
              x={66 + i * unit}
              y={436}
              width={unit - 26}
              height={68}
              rx={10}
              fill={i % 2 === 0 ? c.ink : "#FFF6E5"}
            />
            <rect
              x={66 + i * unit + unit - 24}
              y={436}
              width={20}
              height={68}
              rx={6}
              fill="#E63946"
            />
          </g>
        ))}
      </g>
      <g opacity={ramp(p, 0.55, 0.7)}>
        <rect x={290} y={560} width={40} height={40} rx={8} fill="#E63946" />
        <Label
          x={350}
          y={596}
          text="Temps perdu"
          size={46}
          fill={c.ink}
          anchor="start"
        />
      </g>
    </Frame>
  );
};

const WORDS = [
  "Chat",
  "Vélo",
  "Lama",
  "Pain",
  "Nuage",
  "Route",
  "Café",
  "Lama",
  "Livre",
  "Lama",
  "Plage",
  "Train",
  "Fleur",
  "Piano",
  "Lama",
  "Ciel",
  "Lama",
  "Soupe",
  "Sel",
  "Lama",
];
const COLS = 4;
const CHIP = { w: 200, h: 92, gap: 20, x: 50, y: 50 };
const chipCenter = (i: number) => ({
  x: CHIP.x + (i % COLS) * (CHIP.w + CHIP.gap) + CHIP.w / 2,
  y: CHIP.y + Math.floor(i / COLS) * (CHIP.h + CHIP.gap) + CHIP.h / 2,
});
const TARGETS = WORDS.flatMap((w, i) => (w === "Lama" ? [i] : []));

export const SignsArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const found = TARGETS.map((_, k) =>
    ramp(p, 0.08 + k * 0.13, 0.16 + k * 0.13),
  );
  // The magnifier glides from one occurrence to the next as they light up.
  const reached = found.filter((f) => f > 0).length;
  const from = chipCenter(TARGETS[Math.max(reached - 2, 0)]);
  const to = chipCenter(TARGETS[Math.max(reached - 1, 0)]);
  const glide = reached === 0 ? 0 : found[reached - 1];
  const lens =
    reached === 0
      ? { x: 480, y: 330 }
      : {
          x: mix(from.x, to.x, glide),
          y: mix(from.y, to.y, glide),
        };
  return (
    <Frame>
      {WORDS.map((w, i) => {
        const { x, y } = chipCenter(i);
        const pop = ramp(frame, i * 1.2, i * 1.2 + 12);
        const k = TARGETS.indexOf(i);
        const lit = k >= 0 ? found[k] : 0;
        return (
          <g
            key={i}
            transform={`translate(${x} ${y}) scale(${pop * (1 + 0.12 * lit)})`}
          >
            <rect
              x={-CHIP.w / 2}
              y={-CHIP.h / 2}
              width={CHIP.w}
              height={CHIP.h}
              rx={46}
              fill={lit > 0 ? c.accent : "rgba(255,255,255,0.55)"}
              stroke={c.ink}
              strokeWidth={lit > 0 ? 8 : 4}
            />
            <Label x={0} y={14} text={w} size={42} fill={c.ink} />
          </g>
        );
      })}
      <g
        transform={`translate(${lens.x} ${lens.y})`}
        opacity={ramp(frame, 10, 24)}
      >
        <circle
          r={95}
          fill="rgba(255,255,255,0.18)"
          stroke={c.ink}
          strokeWidth={16}
        />
        <path
          d="M66 66 L150 150"
          stroke={c.ink}
          strokeWidth={30}
          strokeLinecap="round"
        />
      </g>
    </Frame>
  );
};

const Face: React.FC<{
  x: number;
  y: number;
  r: number;
  yawn: number;
  ink: string;
}> = ({ x, y, r, yawn, ink }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#FFD23F" />
    {[-0.36, 0.36].map((dx) =>
      yawn > 0.3 ? (
        <path
          key={dx}
          d={`M${dx * r - r * 0.14} ${-r * 0.2} Q${dx * r} ${-r * 0.1} ${dx * r + r * 0.14} ${-r * 0.2}`}
          stroke={ink}
          strokeWidth={r * 0.08}
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <circle key={dx} cx={dx * r} cy={-r * 0.2} r={r * 0.1} fill={ink} />
      ),
    )}
    <ellipse
      cx={0}
      cy={r * 0.38}
      rx={r * mix(0.22, 0.3, yawn)}
      ry={r * mix(0.05, 0.42, yawn)}
      fill="#7A1F33"
    />
  </g>
);

export const YawnArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const appear = ramp(frame, 0, 18);
  const center = swell(p, 0.02, 0.45);
  const ripples = ramp(p, 0.2, 0.3);
  const ring = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return { x: 480 + Math.cos(a) * 370, y: 330 + Math.sin(a) * 250, i };
  });
  return (
    <Frame>
      {[0, 1, 2].map((k) => {
        const t = ((frame / 40 + k / 3) % 1) * ripples;
        return (
          <circle
            key={k}
            cx={480}
            cy={330}
            r={mix(140, 460, t)}
            fill="none"
            stroke={c.accent}
            strokeWidth={8}
            opacity={(1 - t) * ripples * 0.8}
          />
        );
      })}
      {ring.map(({ x, y, i }) => (
        <g
          key={i}
          transform={`translate(${x} ${y}) scale(${ramp(frame, 4 + i * 2, 18 + i * 2)}) translate(${-x} ${-y})`}
        >
          <Face
            x={x}
            y={y}
            r={66}
            yawn={swell(p, 0.3 + i * 0.08, 0.6 + i * 0.08)}
            ink={c.bg}
          />
        </g>
      ))}
      <g transform={`translate(480 330) scale(${appear}) translate(-480 -330)`}>
        <Face x={480} y={330} r={140} yawn={center} ink={c.bg} />
      </g>
    </Frame>
  );
};

export const OutroArt: React.FC<
  IllustrationProps & { typedWord: string; typed: number; click: number }
> = ({ frame, c, typedWord, typed, click }) => {
  const word = caps(typedWord);
  const shown = word.slice(0, Math.round(typed * word.length));
  const bubble = ramp(frame, 0, 18);
  const pressed = click > 0 && click < 0.25 ? 0.92 : 1;
  const done = click >= 0.25;
  const cursor = {
    x: mix(860, 560, ramp(click, -0.6, 0)),
    y: mix(660, 520, ramp(click, -0.6, 0)),
  };
  return (
    <Frame>
      <g transform={`translate(480 170) scale(${bubble}) translate(-480 -170)`}>
        <rect x={110} y={40} width={740} height={230} rx={40} fill="#FFF6E5" />
        <path d="M200 268 L170 340 L280 268 Z" fill="#FFF6E5" />
        <circle cx={200} cy={155} r={52} fill={c.accent} />
        <Label x={200} y={172} text="toi" size={34} fill={c.ink} />
        <text x={290} y={190} fontSize={100} fontFamily={FONT} fill={c.ink}>
          {shown}
          <tspan
            fontFamily="sans-serif"
            fontWeight={300}
            dx={8}
            opacity={Math.floor(frame / 8) % 2 === 0 ? 1 : 0}
          >
            |
          </tspan>
        </text>
      </g>
      <g
        opacity={ramp(click, -1, -0.8)}
        transform={`translate(480 520) scale(${pressed}) translate(-480 -520)`}
      >
        <rect
          x={200}
          y={450}
          width={560}
          height={140}
          rx={70}
          fill={done ? c.ink : c.accent}
        />
        <Label
          x={480}
          y={545}
          text={done ? "Abonné ✓" : "+ S'abonner"}
          size={68}
          fill={done ? c.accent : c.ink}
        />
      </g>
      {done
        ? Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const d = mix(120, 360, ramp(click, 0.25, 0.7));
            return (
              <circle
                key={i}
                cx={480 + Math.cos(a) * d}
                cy={520 + Math.sin(a) * d * 0.6}
                r={14}
                fill={i % 2 ? c.accent : "#FFF6E5"}
                opacity={1 - ramp(click, 0.55, 0.9)}
              />
            );
          })
        : null}
      <path
        opacity={ramp(click, -0.8, -0.6) * (1 - ramp(click, 0.6, 0.8))}
        transform={`translate(${cursor.x} ${cursor.y}) scale(2.2)`}
        d="M0 0 L0 34 L9 26 L16 40 L22 37 L15 24 L27 24 Z"
        fill="#FFF6E5"
        stroke={c.ink}
        strokeWidth={2.5}
      />
    </Frame>
  );
};
