import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLOR_A, COLOR_B, SAFE_RIGHT } from "../config";
import { TEXT_FONT } from "../font";

const TAP_AT = 30; // frame où le doigt "clique" sur S'abonner

// CTA final : follow (bouton animé) + question pour les commentaires.
export const Outro: React.FC<{ handle: string; nextPart: number }> = ({
  handle,
  nextPart,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 12 } });
  const tapped = frame >= TAP_AT;
  const tapPop = spring({ frame: frame - TAP_AT, fps, config: { damping: 7 } });

  // Le doigt descend vers le bouton puis appuie
  const handY = interpolate(frame, [6, TAP_AT - 4, TAP_AT, TAP_AT + 8], [260, 30, 10, 60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const handOpacity = interpolate(frame, [4, 10, TAP_AT + 14, TAP_AT + 22], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const commentIn = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const arrowBob = Math.sin(frame / 4) * 12;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${COLOR_A}, #6a2bd9 55%, ${COLOR_B})`,
        alignItems: "center",
        justifyContent: "center",
        paddingRight: SAFE_RIGHT - 60,
        gap: 46,
      }}
    >
      <div
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 84,
          color: "white",
          textAlign: "center",
          lineHeight: 1.1,
          textShadow: "0 7px 0 rgba(0,0,0,0.3)",
          transform: `scale(${enter})`,
          padding: "0 60px",
        }}
      >
        LA PARTIE {nextPart}
        <br />
        ARRIVE DEMAIN 🔥
      </div>

      {/* Avatar + bouton S'abonner façon TikTok */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `scale(${enter})`,
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "white",
            border: "8px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 120,
            fontFamily: TEXT_FONT,
          }}
        >
          🤔
        </div>
        <div
          style={{
            fontFamily: TEXT_FONT,
            fontSize: 48,
            color: "white",
            marginTop: 16,
          }}
        >
          {handle}
        </div>
        <div
          style={{
            position: "relative",
            marginTop: 26,
            fontFamily: TEXT_FONT,
            fontSize: 56,
            color: tapped ? "#111" : "white",
            background: tapped ? "white" : "#fe2c55",
            borderRadius: 18,
            padding: "22px 70px",
            transform: `scale(${tapped ? 0.9 + tapPop * 0.1 : 1})`,
            boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
          }}
        >
          {tapped ? "✓ Abonné" : "S'abonner"}
          <div
            style={{
              position: "absolute",
              left: "62%",
              top: handY,
              fontSize: 110,
              opacity: handOpacity,
            }}
          >
            👆
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 52,
          color: "white",
          textAlign: "center",
          lineHeight: 1.2,
          opacity: commentIn,
          transform: `translateY(${(1 - commentIn) * 40}px)`,
          textShadow: "0 5px 0 rgba(0,0,0,0.3)",
          padding: "0 70px",
        }}
      >
        Commente ton score :
        <br />
        combien de fois t'étais
        <br />
        dans la majorité ?
        <div style={{ fontSize: 80, transform: `translateY(${arrowBob}px)` }}>
          👇
        </div>
      </div>
    </AbsoluteFill>
  );
};
