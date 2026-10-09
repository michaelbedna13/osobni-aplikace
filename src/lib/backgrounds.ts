// Pozadí obrazovek (src/assets/tex/<klíč>.webp, generuje scripts/generate-backgrounds.mjs).
const files = import.meta.glob("../assets/tex/*.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

/** CSS hodnota `url(…)` pozadí pro obrazovku nebo modul; neznámý klíč dostane základní pozadí. */
export const backgroundOf = (key: string) => `url(${files[`../assets/tex/${key}.webp`] ?? files["../assets/tex/zaklad.webp"]})`;
