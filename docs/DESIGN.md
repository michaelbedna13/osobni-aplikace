---
name: Osobní appka – pixel
description: Kapesní 8bitová hra o vlastním životě. Každý modul je jiný level s vlastní barvou a pixelovou postavičkou.
colors:
  ink: "#181425"
  paper: "#FFFFFF"
  night: "#262B44"
  night-deep: "#181425"
  night-ink: "#C0CBDC"
  gold: "#FEE761"
  danger: "#A22633"
  bar-idle: "#C0CBDC"
  slate: "#5A6988"
  track: "#E2E7EF"
  blush: "#F6757A"
  piva: "#FEAE34"
  piva-deep: "#F77622"
  hlaskomat: "#0099DB"
  hlaskomat-deep: "#124E89"
  meditace: "#63C74D"
  meditace-deep: "#3E8948"
  trenink: "#E43B44"
  lide: "#B55088"
  denik: "#E4A672"
  odkazy: "#2CE8F5"
  mista: "#C28569"
  filmy: "#8B9BB4"
  wishlist: "#F6757A"
  finance: "#FEE761"
typography:
  hero:
    fontFamily: "Jersey 10, system-ui, sans-serif"
    fontSize: "104px"
    fontWeight: 400
    lineHeight: 0.95
  display-lg:
    fontFamily: "Jersey 10, system-ui, sans-serif"
    fontSize: "60px"
    fontWeight: 400
    lineHeight: 1
  display:
    fontFamily: "Jersey 10, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: 1
  heading:
    fontFamily: "Jersey 10, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: 1
  title:
    fontFamily: "Jersey 10, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.05
  label:
    fontFamily: "Jersey 10, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.1
  label-sm:
    fontFamily: "Jersey 10, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "Rubik Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "Rubik Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "28px"
components:
  button-hero:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.heading}"
    rounded: "{rounded.none}"
    height: "78px"
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "52px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "52px"
  chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    height: "40px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px"
  nameplate:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "3px 10px"
---

# Design – pixel art (v2.1)

Zdroj pravdy v kódu: `src/styles/app.css` (tokeny jako CSS proměnné), `src/lib/sprites.ts`
(postavičky a ikony), `src/lib/modules.ts` (barvy modulů), `src/lib/copy.ts` (hlas appky).
Product truth je v `PRODUCT.md`.

## Overview

Appka je **kapesní 8bitová hra o vlastním životě**. Každý modul je jiný „level“: celá obrazovka
v plné barvě modulu, uprostřed jeho pixelová postavička, pod ní obří číslo a jedno velké 3D
tlačítko hlavní akce. Zápis je herní tah s odměnou (postavička poskočí, vyletí „+1“ a pixelové
konfety, appka řekne vtipnou větu). Statistiky se čtou jako herní skóre: kostičky, které jde
spočítat okem, žebříčky s korunkou, trofeje.

Odmítáme: samé bílé karty se stejnou ikonou a nadpisem, šedý podklad, tenké grafy bez čísel,
úřední texty.

Jediná vlastnost převzatá z verze 1 jsou **černé obrysy a tvrdé posunuté stíny**.

## Colors

Paleta vychází z **Endesga 32** (známá pixel-artová paleta), takže barvy spolu ladí.

- **Noc** (`night` `#262B44`) je podklad „mimo hru“: Dnes, Moduly, Profil, přihlášení.
  Text bílý / `night-ink`, akcent `gold`, pixelové hvězdy jen v horní části.
- **Obrazovka modulu**: nahoře **barevný pás** v plné barvě modulu (postavička, hlavní číslo,
  hlavní tlačítko), pod ním klidný světlý podklad = barva modulu smíchaná s bílou (16 %).
  Bílé panely tak na podkladu čistě vystoupí.
- Každý modul má `color`, `deep` (stínování pixelů, splněné dny) a `light` (odlesky, zamčené
  dlaždice v nabídce +). Hodnoty v `src/lib/modules.ts`.
- **Zamčené moduly** jsou v `night-deep` s visacím zámkem.
- Obrysy a text: `ink` `#181425` (nejtmavší barva palety, ne čistá černá).
- Grafy: neaktivní hodnoty `bar-idle`, zvýrazněná (dnešek, vítěz) v barvě modulu.

## Typography

- **Jersey 10** – nadpisy, čísla, tlačítka, popisky v grafech. Jasně odlišené číslice
  (žádná záměna 5/S, 2/Z), česká diakritika. Jeden řez; nikdy umělé ztučnění (`font-synthesis: none`).
- **Rubik** – delší text (popisy, vedlejší řádky, data v seznamech).
- Stupnice velikostí (jen tyto): 104 / 60 / 48 / 36 / 30 / 24 / 20 px pro Jersey 10,
  16 / 14 px pro Rubik. Žádné nadpisky (eyebrow) nad nadpisy.

## Layout

- Jeden sloupec, okraj 16 px, max. šířka 520 px (na počítači uprostřed na noční ploše).
- Obrazovka modulu: **barevný pás** (lišta zpět + název, postavička, obří číslo, popisek,
  hlavní tlačítko) → skóre ve 3 polích → **záložky** (např. Týden / Statistiky / Lístek) → obsah
  jen vybrané záložky. Dlouhé obrazovky se tím nescrollují do nekonečna.
- Panely v záložce mají nadpis uvnitř (`h3`), mezera mezi panely 14 px.
- Dnes: datum, pozdrav, pás „Moje moduly“ (posun do boku, karty 156 px), hláška dne v bublině.
- Spodní lišta: 5 položek, uprostřed zlaté tlačítko + (nabídka „Co zapíšeme?“). Respektuje safe area.

## Elevation & Depth

- Obrys `3px solid #000` na všem.
- **Stín = dá se na to ťuknout**: `4px 4px 0 #000`, hlavní tlačítko `6px 6px 0`.
  Po stisku se prvek posune o velikost stínu a stín zmizí. Panely s informacemi stín nemají.

## Shapes

- Žádné zaoblení (`border-radius: 0`). Tvary skládané z pixelů: bublina hlášky má pixelový ocásek,
  kruh časovače meditace je z 32 čtverečků.
- **Postavičky a ikony** jsou pixelové sprity v `src/lib/sprites.ts`, kreslené v SVG s
  `shape-rendering: crispEdges`. Všechny postavičky modulů mají **stejný obličej** (oči 1 × 2 px,
  růžové tvářičky `blush`, pusa 2 px) a čtyřtónové stínování (obrys, stín, barva, světlo; světlo zleva
  nahoře). Ikony lišty jsou plné siluety 12 × 12. Moduly 16 × 16 (piva, hláškomat, meditace, trénink, lidé, deník,
  odkazy, místa, filmy, wishlist, finance), doplňky (hvězda, trofej, korunka, zámek, plamen,
  fajfka, jiskra) a ikony 10 × 10 (`i-…`). Velikost vždy násobek mřížky.
- Žádné emoji ani unicode znaky jako ikony.

## Components

- **Hlavní tlačítko** (`.btn-hero`): bílé, 78 px, ikona + akce („1 pivo“, „Zapsat hlášku“, „Začít“).
- **Tlačítko / čip / segment**: bílé s obrysem; aktivní stav černý s bílým textem.
- **Skóre** (`.score`): tři pole vedle sebe s velkým číslem a popiskem.
- **Kostičkový graf** (`BlockStacks`): jedna kostička = jeden kus; při větších číslech uvede měřítko.
- **Vodorovné pruhy** (`HBars`): dny v týdnu, vítěz v barvě modulu s korunkou; řeší i remízu.
- **Sloupce** (`Columns`): 12 týdnů s hodnotou nad sloupcem.
- **Trofeje** (`.trophies`): 2 × 2, rekord zlatě se spritem trofeje.
- **Bublina** (`.bubble`) + **jmenovka** (`.nameplate`) pro hlášky; hvězdička oblíbené vpravo.
- **Pódium** (Síň slávy): 2.–1.–3. místo, vítěz s korunkou.
- **Karta modulu v pásu** (`.fav`): barva modulu, sprite, název, číslo, rychlá akce vpravo nahoře.
- **Záložky** (`Tabs`): plná šířka, aktivní černá.
- **Spodní panel** (`Sheet`), **potvrzení** (`useToast`, černý blok se zlatou akcí „Vrátit“).

### Pohyb

- Pixelový rytmus: animace v krocích (`steps()`), ne plynulé.
- Postavička v klidu pomalu pohupuje (`bob`), po akci poskočí (`jump`), při meditaci dýchá
  (`breathe`, 8 s cyklus s textem Nádech / Výdech).
- Odměna: `Burst` – 14 pixelových konfet a vyletující „+1“.
- Vše vypnuto při „Omezit pohyb“.

### Hlas

Kamarád z party: „Dneska zatím na suchu“, „Třetí. Číšník už ví.“, „Zapsáno do dějin.“,
„Kratší než 30 s, to se nepočítá“. Hlášky jsou v `src/lib/copy.ts`.

## Do's and Don'ts

- **Do:** jedna hlavní akce na obrazovku, největší prvek pod číslem.
- **Do:** nový modul = nová barva + nový 16 × 16 sprite + vlastní herní metafora statistik.
- **Do:** čísla vždy v Jersey 10 a s tabulkovými číslicemi.
- **Don't:** bílé karty na šedém podkladu, zaoblené rohy, měkké stíny, gradienty.
- **Don't:** kreslit ikony znaky (▶ ★) – vždy sprite.
- **Don't:** nadpisky nad nadpisy, VERZÁLKY jako dekorace.
