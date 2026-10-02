---
name: Osobní appka – pixel
description: Kapesní 8bitová hra o vlastním životě. Každý modul je jiný level s vlastní barvou a pixelovou postavičkou.
colors:
  ink: "#181425"
  paper: "#FFFFFF"
  app-bg: "#F2F3F7"
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

# Design – pixel art (v2.2, decentní)

Zdroj pravdy v kódu: `src/styles/app.css` (tokeny jako CSS proměnné), `src/lib/sprites.ts`
(postavičky a ikony), `src/lib/modules.ts` (barvy modulů), `src/lib/copy.ts` (hlas appky).
Product truth je v `PRODUCT.md`.

## Overview

Appka je **kapesní 8bitová hra o vlastním životě**, podaná decentně: všude stejné klidné světlé
pozadí, bílé panely s tenkým černým obrysem a pixelové postavičky. Barva modulu je jen **akcent**:
dlaždice za postavičkou, podtržení nadpisu, hlavní tlačítko a zvýraznění v grafu. Zápis má
odměnu (postavička poskočí, vyletí „+1“ a pixelové konfety, appka řekne vtipnou větu).

Jediná vlastnost převzatá z verze 1 jsou **černé obrysy a tvrdé posunuté stíny** (teď tenčí: 2 px / 3 px).

## Colors

Paleta vychází z **Endesga 32**.

- **Jedno pozadí pro celou appku**: `app-bg` `#F2F3F7`. Žádné barevné plochy přes celou obrazovku.
- Text a obrysy `ink` `#181425`, vedlejší text `slate` `#5A6988`.
- **Barva modulu = akcent (`--accent`)**, použitá decentně a vždy jen na těchto místech:
  dlaždice za postavičkou (28 % barvy s bílou), podtržení nadpisu obrazovky, hlavní tlačítko,
  rychlá akce na kartě, zvýrazněná hodnota v grafu, splněné dny u cíle.
- **Zamčené moduly**: šedá dlaždice, postavička v odstínech šedi, šedý text, ikona zámku.
- Trofej za rekord má zlatý nádech (`gold` 55 % s bílou).

## Typography

- **Jersey 10** – nadpisy, čísla, tlačítka, popisky v grafech. Jasně odlišené číslice
  (žádná záměna 5/S, 2/Z), česká diakritika. Jeden řez; nikdy umělé ztučnění (`font-synthesis: none`).
- **Rubik** – delší text (popisy, vedlejší řádky, data v seznamech).
- Stupnice velikostí (jen tyto): 104 / 60 / 48 / 36 / 30 / 24 / 20 px pro Jersey 10,
  16 / 14 px pro Rubik. Žádné nadpisky (eyebrow) nad nadpisy.

## Layout

- Jeden sloupec, okraj 16 px, max. šířka 520 px (na počítači uprostřed na noční ploše).
- Obrazovka modulu: lišta (zpět + podtržený název) → postavička na barevné dlaždici → obří číslo,
  popisek → hlavní tlačítko → skóre ve 3 polích → **záložky** (např. Týden / Statistiky / Lístek) → obsah
  jen vybrané záložky. Dlouhé obrazovky se tím nescrollují do nekonečna.
- Panely v záložce mají nadpis uvnitř (`h3`), mezera mezi panely 14 px.
- Dnes: datum, pozdrav, pás „Moje moduly“ (posun do boku, karty 156 px), hláška dne v bublině.
- **Spodní lišta**: plovoucí bílý blok 12 px od okrajů, tři položky (Dnes, Moduly, Profil) s ikonou
  a popiskem; aktivní položka je černá s bílým textem. Rychlé zápisy jsou na kartách na obrazovce Dnes.

## Elevation & Depth

- Obrys `2px solid ink` na všem.
- **Stín = dá se na to ťuknout**: `3px 3px 0 ink`, hlavní tlačítko `4px 4px 0`.
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
- **Karta modulu v pásu** (`.fav`): bílá, postavička na dlaždici v akcentu, název, číslo, rychlá akce v akcentu vpravo nahoře.
- **Záložky** (`Tabs`): plná šířka, aktivní černá.
- **Dlaždice postavičky** (`.sprite-tile`): čtverec s obrysem a akcentem modulu.
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
- **Don't:** plné barevné plochy přes obrazovku, víc než jeden akcent na obrazovce, zaoblené rohy, měkké stíny, gradienty.
- **Don't:** kreslit ikony znaky (▶ ★) – vždy sprite.
- **Don't:** nadpisky nad nadpisy, VERZÁLKY jako dekorace.
