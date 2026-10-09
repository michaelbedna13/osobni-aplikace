# Untrois

Osobní aplikace pod značkou **Untrois** (un, trois = 13).

Osobní mobilní webová aplikace (PWA pro iPhone) napojená na Supabase a nasazovaná z GitHubu – hlášky, tréninky, meditace, odkazy, piva, lidé a narozeniny, deník, mapa míst a další.

- [Koncept](docs/KONCEPT.md) · [Nápady na funkce](docs/NAPADY.md)
- [Design](docs/DESIGN.md) (pixel art) · [produkt](PRODUCT.md)
- [Nastavení Supabase, GitHub Pages a iPhonu](docs/NASTAVENI.md)

## Technologie

Vite + React + TypeScript, PWA (`vite-plugin-pwa`), TanStack Query, Supabase (přihlášení, Postgres s RLS), GitHub Pages + GitHub Actions.

## Struktura

```
src/
  lib/modules.ts      registr modulů: názvy, barvy, symboly, plán
  lib/supabase.ts     klient Supabase (bez nastavení = ukázkový režim)
  lib/auth.tsx        přihlášení
  lib/settings.ts     uživatelská nastavení (připnuté moduly)
  components/         lišta, rychlé přidání, symboly, ikony
  screens/            Dnes, Moduly, stránka modulu, Profil, Přihlášení
  lib/icons.ts        ikony a šachové figurky jako vystřižené z papíru (generuje scripts/draw-icons.mjs)
  lib/copy.ts         hlas appky (vtipné texty)
  styles/app.css      design tokeny a styly
supabase/migrations/  struktura databáze (SQL)
.github/workflows/    kontrola, nasazení na Pages, migrace Supabase
```

## Příkazy

```bash
npm run dev        # vývojový server
npm run build      # kontrola typů + produkční build
npm run icons      # znovu vygeneruje PNG ikony z public/favicon.svg (potřebuje Playwright)
node scripts/generate-textures.mjs  # zrno, sprej a jiskření do src/assets/tex
node scripts/draw-icons.mjs         # ikony do src/lib/icons.ts
node scripts/draw-splash.mjs        # znak na úvodní obrazovce do index.html
```
