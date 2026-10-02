---
name: Osobní appka – pixel
description: Kapesní 8bitová hra o vlastním životě. Každý modul je jiný level s vlastní barvou a pixelovou ikonou.
colors:
  ink: "#E9ECF5"
  paper: "#262B44"
  edge: "#0B0A12"
  on-accent: "#181425"
  white: "#FFFFFF"
  app-bg: "#1A1D2B"
  desk: "#12141F"
  grid: "#2E3350"
  gold: "#FEE761"
  danger: "#F6757A"
  bar-idle: "#3A4466"
  slate: "#8B9BB4"
  track: "#20243A"
  scrim: "rgba(11, 10, 18, 0.7)"
  piva: "#FEAE34"
  piva-deep: "#F77622"
  hlaskomat: "#0099DB"
  hlaskomat-deep: "#124E89"
  meditace: "#63C74D"
  meditace-deep: "#3E8948"
  trenink: "#E43B44"
  lide: "#B55088"
  vdecnost: "#E4A672"
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
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "52px"
  chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.none}"
    height: "40px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px"
---

# Design – pixel art (v2.3, tmavá mřížka)

Zdroj pravdy v kódu: `src/styles/app.css` (tokeny jako CSS proměnné), `src/lib/sprites.ts`
(ikony modulů a doplňky), `src/lib/modules.ts` (barvy modulů), `src/lib/copy.ts` (hlas appky).
Product truth je v `PRODUCT.md`.

## Overview

Appka je **kapesní 8bitová hra o vlastním životě**, podaná decentně: všude stejné tmavé
modrošedé pozadí s jemnou tečkovou mřížkou, tmavé panely s téměř černým obrysem a pixelové ikony.
Barva modulu je jen **akcent**: slabá záře nahoře na pozadí, dlaždice za ikonou, podtržení nadpisu,
hlavní tlačítko a zvýraznění v grafu. Zápis má
odměnu (ikona poskočí, vyletí „+1“ a pixelové konfety, appka řekne vtipnou větu).

Jediná vlastnost převzatá z verze 1 jsou **černé obrysy a tvrdé posunuté stíny** (teď tenčí: 2 px / 3 px).

## Colors

Paleta vychází z **Endesga 32**.

- **Jedno pozadí pro celou appku**: `app-bg` `#1A1D2B` + tečková mřížka `grid` `#2E3350` (12 px)
  + radiální záře akcentu (16 %) v horní části obrazovky. Na počítači kolem appky `desk` `#12141F`.
- Tmavé téma: text `ink` `#E9ECF5`, povrch panelů `paper` `#262B44`, obrysy a stíny `edge` `#0B0A12`,
  vedlejší text `slate` `#8B9BB4`. Text na akcentu nebo zlatu je vždy `on-accent` `#181425`.
- Aktivní stav (záložka, čip, segment) = světlý blok `ink` s tmavým textem. Aktivní položka spodní
  lišty, jméno autora hlášky a avatar jsou zlaté.
- **Barva modulu = akcent (`--accent`)**, použitá decentně a vždy jen na těchto místech:
  dlaždice za ikonou (30 % barvy s povrchem `paper`), podtržení nadpisu obrazovky, hlavní tlačítko,
  rychlá akce na kartě, zvýrazněná hodnota v grafu, splněné dny u cíle.
- **Zamčené moduly**: dlaždice `track`, ikona v odstínech šedi, šedý text, ikona zámku.
- Trofej za rekord má zlatý vnitřní rámeček. Nečinné sloupce a kostičky grafů jsou `bar-idle`.

## Typography

- **Jersey 10** – nadpisy, čísla, tlačítka, popisky v grafech. Jasně odlišené číslice
  (žádná záměna 5/S, 2/Z), česká diakritika. Jeden řez; nikdy umělé ztučnění (`font-synthesis: none`).
- **Rubik** – delší text (popisy, vedlejší řádky, data v seznamech).
- Stupnice velikostí (jen tyto): 104 / 60 / 48 / 36 / 30 / 24 / 20 px pro Jersey 10,
  16 / 14 px pro Rubik. Žádné nadpisky (eyebrow) nad nadpisy.

## Layout

- Jeden sloupec, okraj 16 px, max. šířka 520 px (na počítači uprostřed na ploše `desk`).
- Obrazovka modulu: lišta (zpět + podtržený název) → ikona na barevné dlaždici → obří číslo,
  popisek → hlavní tlačítko → skóre ve 3 polích → **záložky** (např. Týden / Statistiky / Lístek) → obsah
  jen vybrané záložky. Dlouhé obrazovky se tím nescrollují do nekonečna.
- Panely v záložce mají nadpis uvnitř (`h3`), mezera mezi panely 14 px.
- Dnes: datum, pod ním den v týdnu a **kdo má svátek** (jména zlatě, data z balíčku `namedays-cs`),
  případně státní svátek; pás „Moje moduly“ (posun do boku, karty 156 px, bez odkazu Upravit – úpravy jsou
  v Profilu); **„Za co jsem dnes vděčný?“** (dnešní zápisy + políčko); hláška dne.
- Moduly: mřížka 3 × N, jen ikona a název (bez popisků); hvězdička = připnuto, zámek = zamčeno.
- Stavový řádek iOS je od iOS 26.1 neprůhledný v barvě `theme-color` (`app-bg`); horní okraj obrazovky
  proto plynule přechází z `app-bg` do mřížky, aby na sebe navazovaly.
- **Spodní lišta**: plovoucí tmavý blok 12 px od okrajů, tři položky (Dnes, Moduly, Profil) s ikonou
  a popiskem; aktivní položka je zlatá s tmavým textem. Rychlé zápisy jsou na kartách na obrazovce Dnes.

## Elevation & Depth

- Obrys `2px solid edge` na všem.
- **Stín = dá se na to ťuknout**: `3px 3px 0 edge`, hlavní tlačítko `4px 4px 0`.
  Po stisku se prvek posune o velikost stínu a stín zmizí. Panely s informacemi stín nemají.

## Shapes

- Žádné zaoblení (`border-radius: 0`). Tvary skládané z pixelů: bublina hlášky má pixelový ocásek,
  kruh časovače meditace je z 32 čtverečků.
- **Ikony modulů** jsou pixelové sprity v `src/lib/sprites.ts` (SVG, `shape-rendering: crispEdges`)
  ve stylu předmětů z RPG: **bez obličejů**, tmavý obrys, čtyřtónové stínování (obrys, stín, barva,
  světlo; světlo zleva nahoře) a jeden detail v doplňkové barvě (pěna, uvozovky, stuha, záložka). Ikony lišty jsou plné siluety 12 × 12. Moduly 16 × 16 (piva, hláškomat, meditace, trénink, lidé, deník,
  odkazy, místa, filmy, wishlist, finance), doplňky (hvězda, trofej, korunka, zámek, plamen,
  fajfka, jiskra) a ikony 10 × 10 (`i-…`). Velikost vždy násobek mřížky.
- Žádné emoji ani unicode znaky jako ikony.

## Components

- **Hlavní tlačítko** (`.btn-hero`): v barvě akcentu s tmavým textem, 78 px, ikona + akce („1 pivo“, „Zapsat hlášku“, „Začít“).
- **Tlačítko / čip / segment**: povrch `paper` s obrysem; aktivní stav světlý s tmavým textem.
- **Skóre** (`.score`): tři pole vedle sebe s velkým číslem a popiskem.
- **Kostičkový graf** (`BlockStacks`): jedna kostička = jeden kus; při větších číslech uvede měřítko.
- **Vodorovné pruhy** (`HBars`): dny v týdnu, vítěz v barvě modulu s korunkou; řeší i remízu.
- **Sloupce** (`Columns`): 12 týdnů s hodnotou nad sloupcem.
- **Trofeje** (`.trophies`): 2 × 2, rekord zlatě se spritem trofeje.
- **Karta hlášky** (`.quote-card`): text hlášky a pod ním **uvnitř karty** autor zlatě a kontext s datem
  šedě; hvězdička oblíbené vpravo. Autor nikdy mimo kartu (mezi kartami nebylo jasné, ke které patří).
- **Vděčnost**: políčko + hlavní tlačítko „Zapsat“ (`.thanks-form`), seznam s pixelovými odrážkami
  (`.thanks-list`), **mozaika** 12 týdnů × 7 dní (`.mosaic`: nic / 1 zápis / 2 a víc), série s plamínkem.
- **Pódium** (Síň slávy): 2.–1.–3. místo, vítěz s korunkou.
- **Karta modulu v pásu** (`.fav`): tmavý povrch, ikona na dlaždici v akcentu, název, číslo, rychlá akce v akcentu vpravo nahoře.
- **Záložky** (`Tabs`): plná šířka, aktivní světlá.
- **Dlaždice ikony** (`.sprite-tile`): čtverec s obrysem a akcentem modulu.
- **Spodní panel** (`Sheet`), **potvrzení** (`useToast`, světlý blok se zlatou akcí „Vrátit“).

### Pohyb

- Pixelový rytmus: animace v krocích (`steps()`), ne plynulé.
- Ikona v klidu pomalu pohupuje (`bob`), po akci poskočí (`jump`), při meditaci dýchá
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
- **Don't:** plné barevné plochy přes obrazovku, víc než jeden akcent na obrazovce, zaoblené rohy, měkké stíny.
  Jediný gradient je záře akcentu v pozadí obrazovky.
- **Don't:** obličeje na ikonách modulů.
- **Don't:** kreslit ikony znaky (▶ ★) – vždy sprite.
- **Don't:** nadpisky nad nadpisy, VERZÁLKY jako dekorace.
