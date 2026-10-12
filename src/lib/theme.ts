import { useCallback, useState } from "react";

// Vzhled appky: černý (výchozí – tmavý, barva modulu jen jemně), barevný (každý modul ve své barvě) nebo duotone jako
// logo – krémová na off-black / lesní zelené.
// Ukládá se jen v zařízení (localStorage) a nastavuje se jako html[data-theme]; při načtení ho čte skript v index.html.

export type Theme = "noir" | "barevny" | "duo-black" | "duo-green";

export const THEMES: { id: Theme; name: string; bg: string; fg: string }[] = [
  { id: "noir", name: "Černý", bg: "#1C1B19", fg: "#F3EADB" },
  { id: "barevny", name: "Barevný", bg: "#CEF17B", fg: "#23211F" },
  { id: "duo-black", name: "Tmavý", bg: "#23211F", fg: "#F3EADB" },
  { id: "duo-green", name: "Zelený", bg: "#2F4A36", fg: "#F3EADB" },
];

const KEY = "theme";
const isTheme = (v: unknown): v is Theme => THEMES.some((t) => t.id === v);

export function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return isTheme(v) ? v : "noir";
  } catch {
    return "noir";
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "barevny") delete root.dataset.theme;
  else root.dataset.theme = theme;
  // barva lišty prohlížeče / přepínače aplikací
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "barevny" ? "#A9C29A" : THEMES.find((t) => t.id === theme)!.bg);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // bez úložiště platí jen do zavření
    }
  }, []);
  return { theme, setTheme };
}
