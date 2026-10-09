import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Na GitHub Pages běží appka v podsložce /osobni-aplikace/.
// S vlastní doménou stačí nastavit VITE_BASE=/ při buildu.
const base = process.env.VITE_BASE ?? "/osobni-aplikace/";
const version = `${process.env.npm_package_version ?? "0"}${process.env.GITHUB_SHA ? `+${process.env.GITHUB_SHA.slice(0, 7)}` : ""}`;

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Untrois",
        short_name: "Untrois",
        lang: "cs",
        description: "Untrois – osobní appka: hlášky, piva, meditace, tréninky, lidé a další.",
        theme_color: "#F4F3EE",
        background_color: "#F4F3EE",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        // Písma pro azbuku a další abecedy se stáhnou jen v případě potřeby.
        globIgnores: ["**/*cyrillic*", "**/*greek*", "**/*vietnamese*"],
      },
    }),
  ],
});
