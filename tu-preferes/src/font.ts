import { continueRender, delayRender, staticFile } from "remotion";

export const FONT_FAMILY = "TheBoldFont";

let loaded = false;

export const loadFont = () => {
  if (loaded) return;
  loaded = true;
  const handle = delayRender("Chargement de la police");
  const font = new FontFace(
    FONT_FAMILY,
    `url('${staticFile("theboldfont.ttf")}') format('truetype')`,
  );
  font
    .load()
    .then(() => {
      document.fonts.add(font);
      continueRender(handle);
    })
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};

// Police de secours pour les emojis
export const TEXT_FONT = `${FONT_FAMILY}, "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif`;
