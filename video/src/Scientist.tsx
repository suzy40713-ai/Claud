import { useCurrentFrame } from "remotion";

const SKIN = "#F2C9A0";
const SKIN_SHADE = "#E0AE82";
const HAIR = "#3B2A20";
const COAT = "#F5F7FC";
const COAT_LINE = "#C5CEDF";
const INK = "#1E1B24";

export type Look = "woman" | "man";

// Cartoon scientist. `mouth` (0..1) opens the mouth for lip-sync and
// `point` (0..1) raises the arm with the pointer towards the board. `look`
// swaps the bun for short hair and a beard.
export const Scientist: React.FC<{
  mouth: number;
  point: number;
  width: number;
  look?: Look;
}> = ({ mouth, point, width, look = "woman" }) => {
  const man = look === "man";
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 12) * 4;
  const tilt = Math.sin(frame / 23) * 2.5 + mouth * 2;
  // Blink for 4 frames roughly every 3.3 seconds.
  const blink = frame % 100 < 4 ? 0.12 : 1;
  const brow = mouth * 6;
  const armAngle = -12 - point * 128 + Math.sin(frame / 6) * 4 * point;
  const mouthRy = 3 + mouth * 17;
  const mouthRx = 20 + mouth * 5;

  return (
    <svg
      viewBox="0 0 420 540"
      width={width}
      height={(width * 540) / 420}
      style={{ overflow: "visible" }}
    >
      <g transform={`translate(0 ${bob})`}>
        {/* Back hair */}
        {man ? null : (
          <ellipse cx={210} cy={235} rx={118} ry={125} fill={HAIR} />
        )}

        {/* Lab coat */}
        <path
          d="M70 540 L92 395 Q110 342 170 330 L250 330 Q310 342 328 395 L350 540 Z"
          fill={COAT}
          stroke={COAT_LINE}
          strokeWidth={4}
        />
        <path d="M178 332 L210 420 L242 332 Z" fill="#6FA8DC" />
        <path
          d="M170 332 L210 430 L190 540 M250 332 L210 430 L230 540"
          fill="none"
          stroke={COAT_LINE}
          strokeWidth={5}
        />
        <rect x={250} y={450} width={52} height={40} rx={6} fill={COAT_LINE} />
        <rect x={262} y={438} width={7} height={30} rx={3} fill="#E63946" />
        <rect x={276} y={442} width={7} height={26} rx={3} fill="#457B9D" />

        {/* Neck */}
        <rect
          x={188}
          y={300}
          width={44}
          height={40}
          rx={14}
          fill={SKIN_SHADE}
        />

        {/* Pointing arm, anchored at the shoulder */}
        <g transform={`rotate(${armAngle} 300 375)`}>
          <rect
            x={278}
            y={370}
            width={46}
            height={150}
            rx={22}
            fill={COAT}
            stroke={COAT_LINE}
            strokeWidth={4}
          />
          <circle cx={301} cy={528} r={22} fill={SKIN} />
          <rect
            x={297}
            y={530}
            width={8}
            height={150}
            rx={4}
            fill="#8B5A2B"
            opacity={point}
          />
        </g>

        {/* Head */}
        <g transform={`rotate(${tilt} 210 300)`}>
          <circle cx={98} cy={222} r={20} fill={SKIN_SHADE} />
          <circle cx={322} cy={222} r={20} fill={SKIN_SHADE} />
          <circle cx={210} cy={210} r={112} fill={SKIN} />

          {man ? (
            <>
              {/* Short hair and beard */}
              <path
                d="M100 190 Q96 92 210 86 Q324 92 320 190 Q302 132 252 126 Q205 140 162 124 Q118 136 100 190 Z"
                fill={HAIR}
              />
              <path
                d="M104 222 Q112 338 210 342 Q308 338 316 222 Q296 296 210 304 Q124 296 104 222 Z"
                fill={HAIR}
              />
            </>
          ) : (
            <>
              {/* Bun and fringe */}
              <circle cx={210} cy={82} r={46} fill={HAIR} />
              <path
                d="M100 200 Q105 105 210 98 Q315 105 320 200 Q290 140 230 150 Q160 125 100 200 Z"
                fill={HAIR}
              />

              {/* Cheeks */}
              <circle cx={145} cy={262} r={18} fill="#FF8FA3" opacity={0.35} />
              <circle cx={275} cy={262} r={18} fill="#FF8FA3" opacity={0.35} />
            </>
          )}

          {/* Eyebrows */}
          <path
            d={`M140 ${168 - brow} Q170 ${156 - brow} 195 ${168 - brow}`}
            stroke={HAIR}
            strokeWidth={man ? 12 : 8}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M225 ${168 - brow} Q250 ${156 - brow} 280 ${168 - brow}`}
            stroke={HAIR}
            strokeWidth={man ? 12 : 8}
            strokeLinecap="round"
            fill="none"
          />

          {/* Eyes */}
          <ellipse cx={170} cy={210} rx={10} ry={12 * blink} fill={INK} />
          <ellipse cx={250} cy={210} rx={10} ry={12 * blink} fill={INK} />
          <circle cx={173} cy={206} r={3} fill="#fff" opacity={blink} />
          <circle cx={253} cy={206} r={3} fill="#fff" opacity={blink} />

          {/* Glasses */}
          <circle
            cx={170}
            cy={210}
            r={34}
            fill="rgba(255,255,255,0.12)"
            stroke={INK}
            strokeWidth={7}
          />
          <circle
            cx={250}
            cy={210}
            r={34}
            fill="rgba(255,255,255,0.12)"
            stroke={INK}
            strokeWidth={7}
          />
          <path
            d="M204 208 Q210 200 216 208"
            stroke={INK}
            strokeWidth={6}
            fill="none"
          />

          {/* Nose */}
          <path
            d="M210 228 Q202 246 212 250"
            stroke={SKIN_SHADE}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />

          {/* Mouth */}
          <ellipse cx={210} cy={280} rx={mouthRx} ry={mouthRy} fill="#7A1F33" />
          {mouth > 0.35 ? (
            <ellipse
              cx={210}
              cy={280 + mouthRy * 0.55}
              rx={mouthRx * 0.55}
              ry={mouthRy * 0.35}
              fill="#E5677D"
            />
          ) : null}
          {man ? (
            <path
              d={`M168 ${270 - mouthRy * 0.6} Q210 ${246 - mouthRy * 0.6} 252 ${270 - mouthRy * 0.6} Q210 ${262 - mouthRy * 0.6} 168 ${270 - mouthRy * 0.6} Z`}
              fill={HAIR}
              stroke={HAIR}
              strokeWidth={8}
              strokeLinejoin="round"
            />
          ) : null}
        </g>
      </g>
    </svg>
  );
};
