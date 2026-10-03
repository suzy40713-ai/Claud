import { ImageResponse } from "next/og";

export const alt = "AdHunter — Trouve les publicités gagnantes. Crée des campagnes plus intelligentes.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "radial-gradient(70% 60% at 50% 0%, rgba(118,87,255,0.35) 0%, #0B0D12 70%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 600 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#171A21", border: "2px solid #7657FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: 999, border: "5px solid #7657FF" }} />
          </div>
          AdHunter
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Trouve les publicités gagnantes.</div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: "#B8A9FF" }}>Crée des campagnes plus intelligentes.</div>
        </div>
        <div style={{ fontSize: 26, color: "#9AA0AE" }}>Bibliothèques publicitaires officielles · Analyse IA · Création de campagnes</div>
      </div>
    ),
    size
  );
}
