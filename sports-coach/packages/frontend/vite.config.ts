import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Racine ("/") par defaut (Capacitor, hebergement sur domaine dedie).
  // GitHub Pages sert ce depot sous un sous-chemin (/Claud/) : le workflow
  // de deploiement passe VITE_BASE_PATH pour ce cas precis.
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL ?? "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
