import React from "react";
import { theme } from "../theme";

export interface WatermarkProps {
  handle: string;
}

// Icone simple dessinee (pas le logo TikTok, qui est une marque deposee) :
// une note de musique stylisee, discrete, dans le meme esprit visuel.
function SimpleMarkIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18V5l10-2v11"
        stroke={theme.colors.watermarkText}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="18" r="2.5" fill={theme.colors.watermarkText} />
      <circle cx="16.5" cy="16" r="2.5" fill={theme.colors.watermarkText} />
    </svg>
  );
}

export const Watermark: React.FC<WatermarkProps> = ({ handle }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 36,
        bottom: 46,
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: 0.65,
      }}
    >
      <SimpleMarkIcon />
      <span
        style={{
          fontFamily: theme.font.family,
          fontWeight: theme.font.weightBold,
          fontSize: theme.sizes.watermark,
          color: theme.colors.watermarkText,
        }}
      >
        @{handle}
      </span>
    </div>
  );
};
