import { interpolateColors } from "remotion";
import { IllustrationProps, mix, ramp, swell } from "./anim";
import { Frame, Label, dash } from "./Illustrations";

const WHITE = "#FFF6E5";
const RED = "#E63946";

const sway = (frame: number, speed: number, amount: number, offset = 0) =>
  Math.sin(frame / speed + offset) * amount;

const Heart: React.FC<{ x: number; y: number; s: number; fill: string }> = ({
  x,
  y,
  s,
  fill,
}) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 14 C-32 -8 -24 -40 0 -22 C24 -40 32 -8 0 14 Z"
    fill={fill}
  />
);

// Rubber stamp that slams in when `t` reaches 0.
const Stamp: React.FC<{
  t: number;
  frame: number;
  text: string;
  x: number;
  y: number;
  width: number;
}> = ({ t, frame, text, x, y, width }) => {
  const shake = t > 0 && t < 1.4 ? Math.sin(frame * 2.2) * 6 : 0;
  return (
    <g
      opacity={ramp(t, 0, 0.15)}
      transform={`translate(${x + shake} ${y}) rotate(-10) scale(${mix(2.6, 1, ramp(t, 0, 1))})`}
    >
      <rect
        x={-width / 2}
        y={-62}
        width={width}
        height={124}
        rx={18}
        fill="rgba(255,255,255,0.92)"
        stroke={RED}
        strokeWidth={12}
      />
      <Label x={0} y={26} text={text} size={74} fill={RED} />
    </g>
  );
};

export const PawHookArt: React.FC<IllustrationProps & { cue: number }> = ({
  frame,
  c,
  cue,
}) => {
  const toes = [
    [-120, -90, 52],
    [-42, -150, 56],
    [42, -150, 56],
    [120, -90, 52],
  ];
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
      <g
        transform={`translate(480 ${370 + sway(frame, 10, 8)}) rotate(${sway(frame, 18, 4)})`}
      >
        <ellipse
          cx={0}
          cy={40}
          rx={150 * ramp(frame, 0, 12)}
          ry={120 * ramp(frame, 0, 12)}
          fill={c.accent}
        />
        {toes.map(([x, y, r], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r * ramp(frame, 8 + i * 4, 18 + i * 4)}
            fill={c.accent}
          />
        ))}
      </g>
      <Stamp
        t={(frame - cue) / 8}
        frame={frame}
        text="Super-pouvoirs"
        x={480}
        y={460}
        width={720}
      />
    </Frame>
  );
};

const HEART_RED = "#E63946";

export const OctopusArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const appear = ramp(frame, 0, 16);
  const blue = ramp(p, 0.66, 0.82);
  const heartColor = interpolateColors(blue, [0, 1], [HEART_RED, c.pop]);
  const hearts = [
    { x: 285, y: 190, at: 0.02 },
    { x: 375, y: 190, at: 0.12 },
    { x: 330, y: 265, at: 0.32 },
  ];
  const tentacle = (i: number) => {
    const bx = 190 + i * 40;
    const pts: string[] = [];
    for (let j = 0; j <= 10; j++) {
      const x =
        bx +
        (i - 3.5) * j * 7 +
        Math.sin(j * 0.6 + frame / 8 + i) * 22 * (j / 10);
      pts.push(`${x},${390 + j * 25}`);
    }
    return `M${pts.join(" L")}`;
  };
  return (
    <Frame>
      <g opacity={appear} transform={`translate(70 ${sway(frame, 14, 8)})`}>
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={tentacle(i)}
            fill="none"
            stroke={c.accent}
            strokeWidth={34}
            strokeLinecap="round"
          />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={tentacle(i)}
            fill="none"
            stroke={c.pop}
            strokeWidth={8}
            strokeLinecap="round"
            {...dash(ramp(p, 0.72 + i * 0.01, 0.95))}
          />
        ))}
        <ellipse cx={330} cy={240} rx={175} ry={195} fill={c.accent} />
        {[270, 390].map((x) => (
          <g key={x}>
            <circle cx={x} cy={330} r={30} fill={WHITE} />
            <circle cx={x + 6} cy={334} r={14} fill={c.ink} />
          </g>
        ))}
        <circle
          cx={330}
          cy={215}
          r={105 * ramp(frame, 8, 22)}
          fill="rgba(255,255,255,0.85)"
        />
        {hearts.map((h, i) => (
          <Heart
            key={i}
            x={h.x}
            y={h.y}
            s={
              1.3 *
              ramp(p, h.at, h.at + 0.08) *
              (1 + 0.1 * Math.sin(frame / 3 + i))
            }
            fill={heartColor}
          />
        ))}
      </g>
      <g transform={`translate(720 230) scale(${ramp(p, 0.78, 0.9)})`}>
        <circle r={95} fill={c.pop} stroke={c.ink} strokeWidth={8} />
        <Label x={0} y={30} text="Cu" size={96} fill={WHITE} />
        <Label x={0} y={150} text="Cuivre" size={44} fill={c.ink} />
      </g>
      <g opacity={ramp(p, 0.05, 0.15) * (1 - ramp(p, 0.7, 0.78))}>
        <Label x={720} y={200} text="x3" size={140} fill={c.ink} />
      </g>
    </Frame>
  );
};

const Otter: React.FC<{
  x: number;
  y: number;
  dir: 1 | -1;
  paw: { x: number; y: number };
  frame: number;
  c: IllustrationProps["c"];
}> = ({ x, y, dir, paw, frame, c }) => {
  const head = { x: x - dir * 170, y: y - 20 };
  const chest = { x: x - dir * 60, y: y - 30 };
  return (
    <g>
      <ellipse cx={x + dir * 150} cy={y + 10} rx={70} ry={22} fill={c.accent} />
      <ellipse cx={x} cy={y} rx={160} ry={58} fill={c.accent} />
      <ellipse cx={x - dir * 20} cy={y - 18} rx={110} ry={30} fill="#D9B38C" />
      <path
        d={`M${chest.x} ${chest.y} L${paw.x} ${paw.y}`}
        stroke={c.accent}
        strokeWidth={26}
        strokeLinecap="round"
      />
      <circle cx={paw.x} cy={paw.y} r={18} fill="#5C3A1E" />
      <circle cx={head.x} cy={head.y} r={62} fill={c.accent} />
      <circle cx={head.x - 40} cy={head.y - 48} r={14} fill={c.accent} />
      <circle cx={head.x + 40} cy={head.y - 48} r={14} fill={c.accent} />
      <ellipse cx={head.x} cy={head.y + 14} rx={42} ry={32} fill="#EAD7BF" />
      <ellipse cx={head.x} cy={head.y + 2} rx={12} ry={8} fill="#2B1A10" />
      {[-24, 24].map((dx) => (
        <path
          key={dx}
          d={`M${head.x + dx - 12} ${head.y - 18} Q${head.x + dx} ${head.y - 10} ${head.x + dx + 12} ${head.y - 18}`}
          stroke="#2B1A10"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <Label
        x={head.x - dir * 20}
        y={head.y - 90 - ((frame / 2) % 40)}
        text="z"
        size={40 + ((frame / 2) % 40) / 2}
        fill={WHITE}
        opacity={1 - ((frame / 2) % 40) / 40}
      />
    </g>
  );
};

export const OtterArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const hold = ramp(p, 0.15, 0.38);
  const d = mix(300 + sway(frame, 15, 25), 215, hold);
  const bobA = sway(frame, 12, 10);
  const bobB = mix(sway(frame, 12, 10, 2), bobA, hold);
  const meet = { x: 480, y: 330 + bobA - 40 };
  const pawA = {
    x: mix(480 - d + 30, meet.x - 14, hold),
    y: mix(330 + bobA - 40, meet.y, hold),
  };
  const pawB = {
    x: mix(480 + d - 30, meet.x + 14, hold),
    y: mix(330 + bobB - 40, meet.y, hold),
  };
  const heart = ramp(p, 0.38, 0.5);
  const wave = (y: number, phase: number) => {
    const pts: string[] = [];
    for (let x = -40; x <= 1000; x += 20) {
      pts.push(`${x},${y + Math.sin(x / 60 + phase) * 12}`);
    }
    return `M${pts.join(" L")} L1000 600 L-40 600 Z`;
  };
  return (
    <Frame>
      <g opacity={ramp(frame, 0, 14)}>
        <Otter
          x={480 - d}
          y={330 + bobA}
          dir={1}
          paw={pawA}
          frame={frame}
          c={c}
        />
        <Otter
          x={480 + d}
          y={330 + bobB}
          dir={-1}
          paw={pawB}
          frame={frame + 20}
          c={c}
        />
        <path d={wave(360, frame / 10)} fill="#2E86DE" opacity={0.55} />
        <path d={wave(410, frame / 8 + 1)} fill="#1F5FAF" opacity={0.6} />
      </g>
      <Heart
        x={480}
        y={230 - heart * 60}
        s={2.2 * heart * (1 + 0.08 * Math.sin(frame / 3))}
        fill={c.pop}
      />
    </Frame>
  );
};

const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 197) % 960,
  y: (i * 313) % 640,
  r: 2 + (i % 4),
}));

const Tardigrade: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {[-95, -35, 25, 85].map((x, i) => (
      <g key={x} transform={`rotate(${sway(frame, 6, 8, i)} ${x} 60)`}>
        <ellipse cx={x} cy={80} rx={24} ry={36} fill="#D9B48C" />
        <path
          d={`M${x - 14} 112 l-6 14 M${x} 114 l0 14 M${x + 14} 112 l6 14`}
          stroke="#5C3A1E"
          strokeWidth={5}
          strokeLinecap="round"
        />
      </g>
    ))}
    <ellipse cx={0} cy={20} rx={160} ry={82} fill="#E8C9A0" />
    {[-70, -10, 50].map((x) => (
      <path
        key={x}
        d={`M${x} -55 Q${x + 18} 20 ${x} 95`}
        stroke="#C9A57C"
        strokeWidth={6}
        fill="none"
      />
    ))}
    <circle cx={-150} cy={10} r={26} fill="#E8C9A0" />
    <circle cx={-170} cy={12} r={9} fill="#5C3A1E" />
    <circle cx={-128} cy={-12} r={7} fill="#2B1A10" />
  </g>
);

export const TardigradeArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const rocket = ramp(p, 0.4, 0.68, (x) => x);
  const alive = ramp(p, 0.8, 0.9);
  return (
    <Frame>
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={c.ink}
          opacity={0.3 + 0.5 * Math.abs(Math.sin(frame / 12 + i))}
        />
      ))}
      <g transform={`translate(790 520) scale(${ramp(frame, 0, 18)})`}>
        <circle r={125} fill="#2E86DE" />
        <path
          d="M-80 -60 Q-30 -90 0 -50 Q-20 -10 -70 0 Q-110 -20 -80 -60 Z"
          fill="#6BCB77"
        />
        <path d="M20 20 Q70 0 90 40 Q60 90 20 70 Z" fill="#6BCB77" />
      </g>
      <g
        opacity={rocket > 0 && rocket < 1 ? 1 : 0}
        transform={`translate(${mix(700, 380, rocket)} ${mix(420, 120, rocket)}) rotate(-50)`}
      >
        <rect x={-18} y={-40} width={36} height={80} rx={14} fill={WHITE} />
        <path d="M-18 -30 L0 -70 L18 -30 Z" fill={RED} />
        <path
          d={`M-12 40 L0 ${70 + sway(frame, 1, 10)} L12 40 Z`}
          fill="#FFD23F"
        />
      </g>
      <g
        transform={`translate(${330 + sway(frame, 20, 20)} ${280 + sway(frame, 14, 16)}) rotate(${sway(frame, 25, 10)}) scale(${ramp(frame, 0, 18)})`}
      >
        <circle
          r={230}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={6}
        />
        <Tardigrade frame={frame} />
      </g>
      <g opacity={ramp(p, 0.05, 0.15) * (1 - ramp(p, 0.4, 0.48))}>
        <path
          d="M180 590 L480 590 M180 570 L180 610 M480 570 L480 610"
          stroke={c.ink}
          strokeWidth={8}
        />
        <Label x={330} y={560} text="< 1 mm" size={56} fill={c.ink} />
      </g>
      <g opacity={ramp(p, 0.45, 0.55)}>
        <Label x={760} y={330} text="2007" size={90} fill={c.accent} />
      </g>
      <g transform={`translate(330 600) scale(${alive})`}>
        <rect
          x={-190}
          y={-50}
          width={380}
          height={100}
          rx={50}
          fill="#6BCB77"
        />
        <Label x={0} y={20} text="Vivant ✓" size={58} fill={c.bg} />
      </g>
    </Frame>
  );
};

export const CrocArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const open = ramp(frame, 4, 24);
  const angle = -26 * open + sway(frame, 9, 1.5) * open;
  const membrane = ramp(p, 0.2, 0.35);
  const pull = swell(p, 0.6, 0.85);
  const no = ramp(p, 0.78, 0.86);
  const dark = "#1E6B3A";
  return (
    <Frame>
      <rect x={-40} y={300} width={240} height={190} rx={40} fill={dark} />
      <path
        d="M150 400 L800 410 Q860 420 860 450 Q850 490 800 490 L150 490 Z"
        fill={c.accent}
      />
      {Array.from({ length: 11 }, (_, i) => (
        <path
          key={i}
          d={`M${300 + i * 48} 412 l14 -30 l14 30 Z`}
          fill={WHITE}
        />
      ))}
      <ellipse
        cx={430 + pull * 40}
        cy={430}
        rx={190 + pull * 50}
        ry={34}
        fill={c.pop}
      />
      <ellipse
        cx={430}
        cy={430}
        rx={205}
        ry={46}
        fill="none"
        stroke={c.ink}
        strokeWidth={6}
        strokeDasharray="16 12"
        opacity={membrane * (1 - no)}
      />
      <g transform={`rotate(${angle} 170 400)`}>
        <path
          d="M150 400 L810 395 Q870 392 870 360 Q860 330 810 330 L340 315 Q310 240 245 255 Q200 265 165 310 Z"
          fill={c.accent}
        />
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={i}
            d={`M${310 + i * 48} 396 l14 30 l14 -30 Z`}
            fill={WHITE}
          />
        ))}
        <circle cx={270} cy={270} r={22} fill="#FFD23F" />
        <ellipse cx={272} cy={270} rx={6} ry={16} fill={c.ink} />
        {[420, 520, 620].map((x) => (
          <circle key={x} cx={x} cy={322} r={10} fill={dark} />
        ))}
      </g>
      <g opacity={membrane * (1 - no)}>
        <path d="M430 480 L430 560" stroke={c.ink} strokeWidth={6} />
        <Label x={430} y={610} text="Membrane" size={52} fill={c.ink} />
      </g>
      <g opacity={swell(p, 0.58, 0.88)}>
        <path
          d={`M${640 + pull * 90} 430 L${760 + pull * 120} 430`}
          stroke={c.ink}
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M${760 + pull * 120} 400 L${800 + pull * 120} 430 L${760 + pull * 120} 460 Z`}
          fill={c.ink}
        />
      </g>
      <g transform={`translate(800 180) scale(${no}) rotate(${no * 8})`}>
        <circle r={90} fill={RED} />
        <path
          d="M-40 -40 L40 40 M40 -40 L-40 40"
          stroke={WHITE}
          strokeWidth={24}
          strokeLinecap="round"
        />
      </g>
    </Frame>
  );
};

const PALE = "#EDE3E3";
const FOOD = Array.from({ length: 12 }, (_, i) => ({
  y: 80 + ((i * 137) % 480),
  delay: (i % 6) * 0.06 + Math.floor(i / 6) * 0.03,
  shrimp: i % 2 === 0,
}));

export const FlamingoArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const pink = ramp(p, 0.15, 0.55) * (1 - 0.65 * ramp(p, 0.8, 0.95));
  const body = interpolateColors(pink, [0, 1], [PALE, c.accent]);
  const appear = ramp(frame, 0, 16);
  const beak = { x: 262, y: 160 };
  return (
    <Frame>
      <ellipse
        cx={480}
        cy={630}
        rx={420}
        ry={30}
        fill="#2E86DE"
        opacity={0.35}
      />
      <g opacity={appear} transform={`translate(0 ${sway(frame, 16, 6)})`}>
        <path d="M545 380 L545 625" stroke={body} strokeWidth={12} />
        <path
          d="M515 380 L470 470 L540 500"
          stroke={body}
          strokeWidth={12}
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M430 280 C370 230 410 170 380 130 C350 80 290 70 300 120"
          stroke={body}
          strokeWidth={34}
          fill="none"
          strokeLinecap="round"
        />
        <ellipse
          cx={530}
          cy={300}
          rx={160}
          ry={95}
          fill={body}
          transform="rotate(-10 530 300)"
        />
        <path d="M660 260 Q740 250 760 300 Q700 310 650 330 Z" fill={body} />
        <circle cx={300} cy={118} r={36} fill={body} />
        <circle cx={292} cy={108} r={6} fill={c.ink} />
        <path d="M278 118 Q236 132 246 178 Q256 156 280 140 Z" fill={c.ink} />
      </g>
      {FOOD.map((f, i) => {
        const t = ramp(p, 0.08 + f.delay, 0.3 + f.delay, (x) => x);
        if (t <= 0 || t >= 1) {
          return null;
        }
        const x = mix(1000, beak.x, t);
        const y = mix(f.y, beak.y, t) + Math.sin(t * 9 + i) * 20;
        return f.shrimp ? (
          <path
            key={i}
            d={`M${x} ${y} q 18 -22 36 0 q -10 14 -30 8`}
            fill={c.pop}
            stroke={c.ink}
            strokeWidth={3}
          />
        ) : (
          <circle key={i} cx={x} cy={y} r={12} fill="#6BCB77" />
        );
      })}
      <g opacity={ramp(p, 0.82, 0.9)}>
        <Label x={760} y={560} text="Il pâlit..." size={60} fill={c.ink} />
      </g>
    </Frame>
  );
};

const Cube: React.FC<{
  x: number;
  y: number;
  s: number;
  c: IllustrationProps["c"];
}> = ({ x, y, s, c }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-34 -18 L0 -36 L34 -18 L0 0 Z" fill="#8B5A2B" />
    <path d="M-34 -18 L0 0 L0 40 L-34 22 Z" fill={c.pop} />
    <path d="M34 -18 L0 0 L0 40 L34 22 Z" fill="#3E2614" />
  </g>
);

const PILE = [
  { x: 650, y: 470 },
  { x: 722, y: 470 },
  { x: 794, y: 470 },
  { x: 686, y: 412 },
  { x: 758, y: 412 },
  { x: 722, y: 354 },
];

export const WombatArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const appear = ramp(frame, 0, 16);
  const butt = { x: 470, y: 380 };
  const flag = ramp(p, 0.82, 0.92);
  return (
    <Frame>
      <path
        d="M560 520 Q560 470 620 460 L850 460 Q900 470 900 520 L900 560 L560 560 Z"
        fill="#9AA0A6"
        opacity={appear}
      />
      <g
        opacity={appear}
        transform={`translate(0 ${Math.abs(sway(frame, 5, 4))})`}
      >
        {[180, 260, 360, 420].map((x) => (
          <rect
            key={x}
            x={x - 26}
            y={410}
            width={52}
            height={80}
            rx={20}
            fill="#5C3A1E"
          />
        ))}
        <ellipse cx={300} cy={340} rx={190} ry={125} fill={c.accent} />
        <circle cx={150} cy={300} r={88} fill={c.accent} />
        <ellipse cx={180} cy={225} rx={18} ry={26} fill="#5C3A1E" />
        <ellipse cx={80} cy={312} rx={34} ry={26} fill="#2B1A10" />
        <circle cx={140} cy={278} r={9} fill="#2B1A10" />
      </g>
      {PILE.map((t, i) => {
        const k = ramp(p, 0.12 + i * 0.11, 0.2 + i * 0.11, (x) => x);
        if (k <= 0) {
          return null;
        }
        const x = mix(butt.x, t.x, k);
        const y = mix(butt.y, t.y, k) - Math.sin(Math.PI * k) * 120;
        return <Cube key={i} x={x} y={y} s={1} c={c} />;
      })}
      <g transform={`translate(722 318) scale(${flag})`}>
        <path d="M0 0 L0 -150" stroke={c.ink} strokeWidth={8} />
        <path d="M0 -150 L150 -120 L0 -90 Z" fill={RED} />
      </g>
      <g opacity={ramp(p, 0.2, 0.3) * (1 - ramp(p, 0.8, 0.85))}>
        <Label x={760} y={250} text="Cube !" size={72} fill={c.ink} />
      </g>
    </Frame>
  );
};

const Jelly: React.FC<{ frame: number; color: string }> = ({
  frame,
  color,
}) => {
  const pulse = 1 + 0.08 * Math.sin(frame / 5);
  return (
    <g>
      {[-80, -45, -15, 15, 45, 80].map((x, i) => {
        const pts: string[] = [];
        for (let j = 0; j <= 8; j++) {
          pts.push(`${x + Math.sin(j * 0.8 + frame / 6 + i) * 12},${j * 28}`);
        }
        return (
          <path
            key={x}
            d={`M${pts.join(" L")}`}
            stroke={color}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            opacity={0.8}
          />
        );
      })}
      <g transform={`scale(${2 - pulse} ${pulse})`}>
        <path
          d="M-130 0 Q-130 -150 0 -150 Q130 -150 130 0 Q100 -12 65 4 Q32 -12 0 4 Q-32 -12 -65 4 Q-100 -12 -130 0 Z"
          fill={color}
        />
        <path
          d="M-70 -40 Q-70 -110 0 -110 Q70 -110 70 -40 Z"
          fill="rgba(255,255,255,0.35)"
        />
      </g>
    </g>
  );
};

const Polyp: React.FC<{ frame: number; color: string }> = ({
  frame,
  color,
}) => (
  <g>
    <rect x={-12} y={-90} width={24} height={90} rx={12} fill={color} />
    <path d="M-40 -90 Q0 -60 40 -90 L30 -120 L-30 -120 Z" fill={color} />
    {[-40, -20, 0, 20, 40].map((x, i) => (
      <path
        key={x}
        d={`M${x * 0.7} -118 Q${x * 1.4 + sway(frame, 6, 6, i)} -150 ${x * 1.6} -170`}
        stroke={color}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
    ))}
  </g>
);

export const JellyArt: React.FC<IllustrationProps> = ({ frame, p, c }) => {
  const shrink = ramp(p, 0.28, 0.5);
  const polyp = ramp(p, 0.4, 0.55);
  const reborn = ramp(p, 0.72, 0.92);
  const forever = ramp(p, 0.88, 0.98);
  return (
    <Frame>
      <g
        transform={`translate(480 330) rotate(${frame * 0.8})`}
        opacity={ramp(frame, 4, 20) * 0.6}
      >
        <circle
          r={290}
          fill="none"
          stroke={c.pop}
          strokeWidth={8}
          strokeDasharray="30 22"
        />
        <path d="M290 -30 L320 20 L262 20 Z" fill={c.pop} />
        <path d="M-290 30 L-320 -20 L-262 -20 Z" fill={c.pop} />
      </g>
      <ellipse
        cx={480}
        cy={600}
        rx={260}
        ry={26}
        fill="rgba(255,255,255,0.12)"
      />
      <g
        opacity={1 - shrink}
        transform={`translate(480 ${mix(220, 520, shrink) + sway(frame, 12, 12)}) scale(${mix(1, 0.15, shrink) * ramp(frame, 0, 16)})`}
      >
        <Jelly frame={frame} color={c.accent} />
      </g>
      <g transform={`translate(480 600) scale(${polyp})`}>
        <Polyp frame={frame} color={c.pop} />
      </g>
      <g opacity={polyp * (1 - reborn)}>
        <Label x={720} y={520} text="Bébé" size={60} fill={c.ink} />
      </g>
      <g
        opacity={reborn}
        transform={`translate(480 ${mix(440, 230, reborn) + sway(frame, 12, 10)}) scale(${mix(0.2, 0.85, reborn)})`}
      >
        <Jelly frame={frame} color={c.accent} />
      </g>
      <g transform={`translate(800 150) scale(${forever})`}>
        <circle r={85} fill={c.accent} />
        <text
          x={0}
          y={40}
          fontSize={130}
          textAnchor="middle"
          fill={c.bg}
          fontFamily="sans-serif"
          fontWeight={700}
        >
          ∞
        </text>
      </g>
    </Frame>
  );
};

// Hook for the photo version: only the stamp, over the photo montage.
export const SuperStampArt: React.FC<IllustrationProps & { cue: number }> = ({
  frame,
  cue,
}) => (
  <Frame>
    <Stamp
      t={(frame - cue) / 8}
      frame={frame}
      text="Super-pouvoirs"
      x={480}
      y={330}
      width={720}
    />
  </Frame>
);
