import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { theme } from "./theme";

// Polices auto-hebergees (voir public/fonts) : evite une dependance reseau au
// moment du rendu. On retarde le rendu des frames jusqu'a ce qu'elles soient
// effectivement chargees.
export function useFontsReady() {
  const [handle] = useState(() => delayRender("Loading Poppins"));

  useEffect(() => {
    Promise.all([
      loadFont({
        family: theme.font.family,
        url: staticFile("fonts/poppins-500-latin.woff2"),
        weight: "500",
      }),
      loadFont({
        family: theme.font.family,
        url: staticFile("fonts/poppins-700-latin.woff2"),
        weight: "700",
      }),
      loadFont({
        family: theme.font.family,
        url: staticFile("fonts/poppins-800-latin.woff2"),
        weight: "800",
      }),
    ])
      .catch((err) => console.error("Font loading failed", err))
      .then(() => continueRender(handle));
  }, [handle]);
}
