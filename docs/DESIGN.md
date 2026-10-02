---
name: Osobní appka – pixel
description: Kapesní 8bitová hra o vlastním životě. Každý modul je jiný level s vlastní barvou a pixelovou postavičkou.
colors:
  ink: "#000000"
  paper: "#FFFFFF"
  night: "#26286B"
  night-deep: "#17184A"
  night-ink: "#E9E8FF"
  gold: "#FFD23F"
  danger: "#B3001B"
  bar-idle: "#D9D9E4"
  piva: "#FFB627"
  piva-deep: "#C77700"
  hlaskomat: "#FFE04A"
  hlaskomat-deep: "#B38A00"
  meditace: "#9ED9A6"
  meditace-deep: "#3E8E58"
  trenink: "#FF6B4A"
  lide: "#FF8FC7"
  denik: "#E8B96A"
  odkazy: "#6C8CFF"
  mista: "#4FD6C8"
  filmy: "#B9B6CF"
  wishlist: "#C59BFF"
  finance: "#4CD07D"
typography:
  display:
    fontFamily: "Jersey 10, system-ui, sans-serif"
    fontSize: "130px"
    fontWeight: 400
    lineHeight: 0.95
  heading:
    fontFamily: "Jersey 10, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 400
    lineHeight: 1
  label:
    fontFamily: "Jersey 10, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "Rubik Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
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

# Design – pixel art (v2)

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

- **Noc** (`night` `#26286B`) je podklad „mimo hru“: Dnes, Moduly, Profil, přihlášení.
  Text na ní bílý / `night-ink`, akcent `gold`, pixelové hvězdy.
- **Barva modulu zaplavuje celou jeho obrazovku** (jantar Piva, citron Hláškomat, šalvěj Meditace…).
  Text na barvách modulů je vždy černý.
- Každý modul má `color`, `deep` (stínování pixelů, výplně ukazatelů, splněné dny) a `light`
  (odlesky ve spritech, zamčené dlaždice v nabídce +). Hodnoty jsou v `src/lib/modules.ts`.
- **Zamčené moduly** (ještě nehotové) jsou ve tmavé noci (`night-deep`) s visacím zámkem.
- Grafy: neaktivní pruhy `bar-idle`, zvýrazněná hodnota (dnešek, vítěz) v barvě modulu.
- Pozadí obrazovky modulu nese jemnou pixelovou mřížku 16 px – papír na pixel art.

## Typography

- **Jersey 10** – nadpisy, čísla, tlačítka, popisky v grafech. Jasně odlišené číslice
  (žádná záměna 5/S, 2/Z), česká diakritika. Jeden řez; nikdy umělé ztučnění (`font-synthesis: none`).
- **Rubik** – delší text (popisy, vedlejší řádky, data v seznamech).
- Velikosti: hero číslo 130 px, nadpis obrazovky 38 px, nadpis sekce 25 px, tlačítko 22 px
  (hlavní 35 px), čísla v kartách 38–48 px. Žádné nadpisky (eyebrow) nad nadpisy.

## Layout

- Jeden sloupec, okraj 16 px, max. šířka 520 px (na počítači uprostřed na noční ploše).
- Obrazovka modulu: lišta (zpět + název) → hero (postavička, obří číslo, popisek, vtipná věta)
  → hlavní tlačítko přes celou šířku → skóre ve 3 polích → sekce. Mezi sekcemi 28 px.
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
  `shape-rendering: crispEdges`. Moduly 16 × 16 (piva, hláškomat, meditace, trénink, lidé, deník,
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
