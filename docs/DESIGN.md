---
name: Osobní appka – pixel
description: Kapesní 8bitová hra o vlastním životě. Každý modul je jiný level s vlastní barvou a pixelovou ikonou.
colors:
  ink: "#FEFAE0"
  paper: "#0C2117"
  edge: "#000502"
  on-accent: "#001600"
  white: "#FFFFFF"
  app-bg: "#020F08"
  desk: "#000804"
  lime: "#CEF17B"
  gold: "#FEE761"
  danger: "#F6757A"
  bar-idle: "#24402F"
  slate: "#9FB8B8"
  track: "#071710"
  scrim: "rgba(0, 5, 2, 0.75)"
  grass: "#0E2719"
  grass-stripe: "#12301F"
  wood: "#E4A672"
  wood-dark: "#B86F50"
  wood-edge: "#733E39"
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
  cornhole: "#D77643"
  dech: "#73BED3"
  untrois: "#CEF17B"
  skore: "#A884F3"
  skore-deep: "#5E3FA8"
  sachy: "#C0CBDC"
  sachy-deep: "#5A6988"
  nakup: "#38B7A0"
  nakup-deep: "#1E7466"
  board-light: "#B9C79E"
  board-dark: "#4E7A55"
  piece-black: "#1B2A22"
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
    fontFamily: "Space Grotesk Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "Space Grotesk Variable, system-ui, sans-serif"
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

# Design – pixel art (v2.5, tmavě zelená s rastrem)

Zdroj pravdy v kódu: `src/styles/app.css` (tokeny jako CSS proměnné), `src/lib/sprites.ts`
(ikony modulů a doplňky), `src/lib/modules.ts` (barvy modulů), `src/lib/copy.ts` (hlas appky).
Product truth je v `PRODUCT.md`.

## Overview

Appka je **kapesní 8bitová hra o vlastním životě**, podaná decentně: všude stejné skoro černé
zelené pozadí s filmovým zrnem a rastrovým (halftone) mrakem nahoře, tmavě zelené panely s téměř černým obrysem a pixelové ikony.
Barva modulu je jen **akcent**: rastrový mrak nahoře na pozadí, dlaždice za ikonou, podtržení nadpisu,
hlavní tlačítko a zvýraznění v grafu. Zápis má
odměnu (ikona poskočí, vyletí „+1“ a pixelové konfety, appka řekne vtipnou větu).

Jediná vlastnost převzatá z verze 1 jsou **černé obrysy a tvrdé posunuté stíny** (teď tenčí: 2 px / 3 px).

## Colors

Paleta vychází z **Endesga 32**.

- **Jedno pozadí pro celou appku**: `app-bg` `#020F08` (skoro černá zelená, tmavší a méně sytá než
  „very deep green“, aby to nepůsobilo bažinatě). Na počítači kolem appky `desk` `#000804`.
- **Textura pozadí** (soubory ze `scripts/generate-textures.mjs`, výstup je deterministický):
  - `src/assets/grain.png` – filmové zrno (světlá i tmavá zrnka s průhledností), dlaždice 96 px;
  - `src/assets/halftone.svg` – rastrový mrak: tečky v šestiúhelníkové síti 8 px, velikost podle šumu,
    směrem dolů mizí (480 px). Použitý jako maska `.screen::before` vybarvená akcentem, krytí 17 %;
  - pod rastrem slabá záře akcentu (7 %).
  - **Volba pozadí** (Profil → Pozadí, `html[data-bg]`, uloženo v zařízení): „Vzor“ (výchozí), „Světlo“,
    „Světlo a vzor“, „Tečky“ (původní rastr výše). Nové varianty používají hustší zrno `grain-strong.png` (128 px);
    *světlo* je zrnitý šikmý paprsek v barvě akcentu (`.screen::after`, pevně k obrazovce, krytí 60 %, s hlavním vzorem 26 %);
    *vzor* jsou oblé tahy jako „čmáranice“ (U, S, C, L, kroužky, tečky, dlouhé tvary přes dvě buňky) ze
    `src/assets/squiggle.svg` (dlaždice 600 px, šířka tahu 30), maska `.screen::before` v barvě akcentu, krytí 7,5 %.
- Tmavé téma: text `ink` `#FEFAE0` (cornsilk), povrch panelů `paper` `#0C2117`, obrysy a stíny
  `edge` `#000502`, vedlejší text `slate` `#9FB8B8` (ash gray). Text na akcentu nebo limetce je vždy
  `on-accent` `#001600`.
- **Zvýraznění UI je limetka** `lime` `#CEF17B` (lime glow): aktivní položka lišty, avatar, jména
  (svátek, autor hlášky), focus. Žlutá `gold` zůstává jen v pixelových předmětech (hvězda, trofej, korunka).
- Aktivní stav (záložka, čip, segment) = světlý blok `ink` s tmavým textem. Aktivní položka spodní
  lišty, jméno autora hlášky a avatar jsou limetkové.
- **Barva modulu = akcent (`--accent`)**, použitá decentně a vždy jen na těchto místech:
  dlaždice za ikonou (30 % barvy s povrchem `paper`), podtržení nadpisu obrazovky, hlavní tlačítko,
  rychlá akce na kartě, zvýrazněná hodnota v grafu, splněné dny u cíle.
- **Zamčené moduly**: dlaždice `track`, ikona v odstínech šedi, šedý text, ikona zámku.
- Trofej za rekord má limetkový vnitřní rámeček. Nečinné sloupce a kostičky grafů jsou `bar-idle`.

## Typography

- **Jersey 10** – nadpisy, čísla, tlačítka, popisky v grafech. Jasně odlišené číslice
  (žádná záměna 5/S, 2/Z), česká diakritika. Jeden řez; nikdy umělé ztučnění (`font-synthesis: none`).
- **Space Grotesk** – delší text (popisy, vedlejší řádky, data v seznamech, zapsaný text). Technický grotesk s rovnými tvary, ladí s pixelovým Jersey lépe než zaoblený Rubik.
- Stupnice velikostí (jen tyto): 104 / 60 / 48 / 36 / 30 / 24 / 20 px pro Jersey 10,
  16 / 14 px pro Space Grotesk. Žádné nadpisky (eyebrow) nad nadpisy.

## Layout

- Jeden sloupec, okraj 16 px, max. šířka 520 px (na počítači uprostřed na ploše `desk`).
- Obrazovka modulu: lišta (zpět + podtržený název) → ikona na barevné dlaždici → obří číslo,
  popisek → hlavní tlačítko → skóre ve 3 polích → **záložky** (např. Týden / Statistiky / Lístek) → obsah
  jen vybrané záložky. Dlouhé obrazovky se tím nescrollují do nekonečna.
- Panely v záložce mají nadpis uvnitř (`h3`), mezera mezi panely 14 px.
- Dnes: datum, pod ním den v týdnu a **kdo má svátek** (jména limetkově, data z balíčku `namedays-cs`),
  případně státní svátek; pás „Moje moduly“ (posun do boku, karty 156 px, bez odkazu Upravit – úpravy jsou
  v Profilu); nad pásem **počasí** (Open-Meteo, modely DWD ICON a ECMWF; poloha nebo město, uložené
  v prohlížeči; bez rámečku, jeden řádek pod hlavičkou: ikona, teplota, popis s min–max, déšť jen od 30 %, bez názvu města;
  ťuknutí otevře okno „Počasí – město“ s pocitovou teplotou, větrem, 12 hodinami po 2 h, 3 dny a odkazem Změnit místo), pod ním **hláška dne** v tmavém panelu se zrnitým limetkovým světlem z pravého horního rohu (`.day-quote`: text Jersey 24 px na celou šířku nejvýš na 4 řádky,
  uvozovky „ “ v `lime` přímo v textu; pod 2px linkou `idle` patička: autor vlevo v `lime`, kontext vpravo `slate`;
  ťuknutí otevře Hláškomat); hned pod hlavičkou pás „Moje moduly“ (souhrn dne zrušen – stejná čísla jsou na kartách); **Brzy slaví** (oslavy na 7 dní, jen když nějaké jsou); **„Za co jsem dnes vděčný?“** (dnešní zápisy + políčko); **Dluhy** (dluží mně / dlužím já po lidech); **Na později** (jeden neotevřený odkaz denně).
- Moduly: mřížka 3 × N, jen ikona a název (bez popisků); hvězdička = připnuto, zámek = zamčeno.
- Stavový řádek iOS je průhledný (`apple-mobile-web-app-status-bar-style: black-translucent`, `viewport-fit=cover`):
  pozadí s texturou běží až pod něj, obsah odsazuje `env(safe-area-inset-top)`. iOS si styl pamatuje z doby přidání
  na plochu – po změně je potřeba appku z plochy odebrat a přidat znovu.
- **Spodní lišta**: kompaktní plovoucí „sklo“ uprostřed dole (průsvitný povrch s rozmazáním, obrys a tvrdý stín),
  jen tři ikony bez popisků (Dnes, Moduly, Profil; popisky pro čtečku obrazovky). Aktivní ikona má limetkový
  čtverec; obrazovky modulů patří pod Moduly. Rychlé zápisy jsou na kartách na obrazovce Dnes.

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
- **Karta hlášky** (`.quote-card`): text hlášky a pod ním **uvnitř karty** autor limetkově a kontext s datem
  šedě; hvězdička oblíbené vpravo. Autor nikdy mimo kartu (mezi kartami nebylo jasné, ke které patří).
- **Oslava** (`OccasionRow`, `.occasion`): blok s datem a dnem v týdnu, jméno, co slaví („30. narozeniny“,
  „svátek“) a kdy („Dnes“, „Zítra“, „za 3 dny“). Dnešní oslava má podklad v akcentu.
- **Nápad na dárek** (`.idea-row`): text (+ doména odkazu), odkaz, tlačítko „Dáno“ vpravo.
- **Spodní panel a potvrzení** se vykreslují do `<body>` (portál), protože `.screen` má kvůli textuře
  vlastní vrstvení (`isolation: isolate`) a jinak by skončily pod spodní lištou.
- **Trénink – cvik** (`.wx`): panel s názvem, „Minule: …“, řádky sérií (číslo, kg, opakování nebo sekundy,
  odškrtávací čtverec). Odškrtnutá série má limetkový čtverec s fajfkou. Pod lištou se drží **pauza**
  (`.rest-bar`): odpočet s ubývající výplní v akcentu, −15 / +15 / Dál, na konci pípne.
- **Šablona tréninku** (`.tpl-item`): pořadí šipkami, počet sérií − / +.
- **Cornhole – tým ve hře** (`.ch-team`): pruh v barvě pytlíků vlevo (vnitřní stín), pytlík (`.bag`),
  název a hráči, velké skóre (+ body z posledního kola), ukazatel k cíli, počítadla Na desce / V díře
  (max. 4 pytlíky). Výhra = panel s pytlíkem vítěze a „Uložit hru“; tabulka průběhu (`.rounds`).
- **Zvuky** (`SoundPicker`, `.sound-chips`): výběr zvuku jako čipy, ťuknutí vybere a hned přehraje. Zvuky se
  syntetizují ve Web Audio (gong, tibetská mísa, zvonek, tři zvonky, dřívko, pípnutí, fanfára). Odkaz „Zvuky: …“
  pod hlavním tlačítkem Meditace a Tréninku (`.sound-link`). Nastavení je v zařízení (localStorage `zvuky`).
- **Šachy** (`.sh-*`): šachovnice v zelených tónech (`board-light`, `board-dark`) s pixelovými figurkami 12 × 12
  (bílé krémové, černé `piece-black`, obě s černým obrysem). Vybrané pole limetkové, poslední tah žlutě, šach červeně,
  možné tahy čtverečkem, braní rámečkem. Nad a pod deskou panel hráče (`.sh-player`: jméno, sebrané figury, převaha,
  hodiny `.sh-clock`, běžící hodiny inverzně, pod 20 s červeně). Při hře přes stůl je horní panel otočený o 180°.
- **Šipky** (`.sc-*`, modul `skore`): seznam hráčů (`.sc-row`, kdo hází má rámeček v barvě hráče; zbývající body,
  průměr, legy jako čtverečky `.sc-legs`, u ostatních hráčů cesta na zavření `.sc-route`). Pod tím panel: kdo hází,
  návrh zavření (`.sc-checkout`), přepínač Po šipkách / Součtem. Po šipkách: tři políčka náhozu (`.sc-dart`), Double /
  Triple (`.sc-mult`, platí pro jednu šipku), čísla 1–20 v mřížce 5×4, 25 / Bull a Vedle. Součtem: číselník a rychlé
  náhozy (`.sc-quick`); když by součet zavřel, zeptá se na double (`.sc-confirm`). Výhra = panel „Game shot!“.
- **Cornhole v mobilu** (`.ch-mobile`): hra pro 2–6 hráčů na jednom telefonu. Hřiště je plátno v nízkém rozlišení
  (1 herní pixel = 2 body), kreslené po řádcích celými pixely: tráva v pruzích (`grass`, `grass-stripe`),
  dřevěná deska (`wood`, `wood-dark`, `wood-edge`), černá díra, pytlíky jako kvádry v barvě hráče se stínem
  v letu. Nad hřištěm skóre hráčů (`.ch-player`; od tří hráčů zhuštěně ve 3–4 sloupcích, kdo hází má rámeček v barvě pytlíků, čtverečky = pytlíky
  v ruce). V hřišti vítr vpravo nahoře, síla hodu vlevo (`.ch-power`, čárka = minulý hod), dole kdo hází.
  Ovládání prakem: táhni dolů a pusť. Konec kola a výhra jsou panely uprostřed hřiště. Spodní lišta se skryje.
- **Odkaz** (`.link-card`): náhled 64 px (obrázek webu / nahraný obrázek / písmeno domény), název na 2 řádky,
  web · kdy · kolekce, limetkový čtvereček = „na později“. Detail ve spodním panelu s „Otevřít“.
- **Film / kniha** (`.media-row`): štítek druhu (`.kind-tag`), název, autor / režisér · kdo doporučil; u hotových
  hodnocení 1–5 hvězdiček (sprite hvězdy, nevybrané šedé). Zapisuje se ručně textem, bez katalogů.
- **Přání** (`.wish-card`): jako odkaz, navíc cena · priorita a štítek čekání (`.wait-tag`; po 30 dnech limetkový
  „pořád to chceš?“).
- **Mapa** (`.map-box`, MapLibre + vektorové podklady OpenFreeMap bez klíče, vlastní zjednodušený styl v `mista/mapStyle.ts`):
  tmavě zelená zem, tyrkysově tmavá voda, jemná zeleň, silnice jako světlejší zelené čáry, jen názvy obcí, žádné
  body zájmu. Značky (`.map-dot`) jsou kulaté body s krémovým okrajem: „chci“ v barvě modulu, navštívené menší
  šedomodré, vybrané větší se světelným kruhem a jmenovkou v pixelovém písmu („ťukni pro detail“; první ťuknutí vybírá, druhé otevře detail), nový bod a moje poloha pulzují.
  Zdroj dat je schovaný pod malým „i“ v rohu.
- **Výdaje** (Finance): pruh podílů (`.exp-bar`, dílky v barvě modulu podle měsíční částky, odstíny se střídají) a pod ním
  tři největší položky v procentech; výdaj se splatností do 3 dnů je zvýrazněný (`.list-btn.soon`).
- **Částky** (`.money`) v pixelovém písmu; „dluží mi“ limetkově, „dlužím“ v barvě `danger`. Předplatné, které se
  obnoví do 3 dnů, má podklad v akcentu; zrušené je zašedlé.
- **Dechová kostka** (`.orb`): čtverec v akcentu, při nádechu se v pixelových krocích zvětšuje, při výdechu zmenšuje,
  při zadržení má čárkovaný obrys; uprostřed odpočet. Během cvičení je spodní lišta schovaná (`.focus-mode`).
- **Okno** (`Modal`) uprostřed obrazovky pro detail hlášky: „obrazovka“ s textem a řada akcí (Top, Kopie, Sdílet,
  Upravit, Smazat). Při psaní se lišta schová (`.kb-open`) a okna i panely se drží nad klávesnicí.
- **Značka Untrois**: appka se jmenuje Untrois (francouzsky „jedna, tři“ = 13). Ikona appky jsou dvě pixelové
  kostky, limetková s jedním okem a zlatá se třemi (un, trois), se stínem `edge` na zrnitém limetkovém světle
  jako pozadí appky; hrany kostek tmavší (`#7BA33A`, `#C9A227`). Zdroj `public/favicon.svg`, PNG přes `npm run icons`
  s okrajem kolem kostek, aby je iOS nezaoblil. Modul 13 – Untrois má barvu `lime`.
- **Sekce na Dnes** (`.sec-tab`): nadpis je záložka v barvě modulu (text `on-accent`, obrys `edge`) přilepená
  k bloku, blok má nahoře 4px linku stejné barvy; mezi sekcemi 34px. Nákup, Brzy slaví, Vděčnost, Dluhy a Na později
  mají každá barvu svého modulu, „Moje moduly“ zůstávají bez záložky.
- **Nákup** (`.nk-*`): pole „Co koupit?“ s tlačítkem + v pásu, pod ním návrhy „Často kupuješ“ (chipy). Seznam po
  odděleních v pořadí obchodu (nadpis oddělení v akcentu), řádek = čtverec k odškrtnutí, název, množství, tužka.
  Odškrtnuté jdou do „V košíku“ (přeškrtnuté, čtverec v akcentu), „Vyčistit košík“ je schová s možností Vrátit.
  Na Dnes je pod „Moje moduly“ sekce Nákup (jen když je co koupit): nejvýš 8 položek k odškrtnutí a poslední 3 z košíku.
- **Nástěnka Untrois** (`.board`): dva sloupce dlaždic různé výšky; fotka v původním poměru stran nahoře, pod ní
  štítek kategorie, popisek, poznámka a web odkazu. Ve „Co je 13“ má štítek jen výklad (obrys `idle`), fakta žádný.
- **Vděčnost**: políčko + hlavní tlačítko „Zapsat“ (`.thanks-form`), seznam s pixelovými odrážkami
  (`.thanks-list`), **mozaika** 12 týdnů × 7 dní (`.mosaic`: nic / 1 zápis / 2 a víc), série s plamínkem.
- **Pódium** (Síň slávy): 2.–1.–3. místo, vítěz s korunkou.
- **Karta modulu v pásu** (`.fav`): tmavý povrch, ikona na dlaždici v akcentu, název, číslo, rychlá akce v akcentu vpravo nahoře.
- **Záložky** (`Tabs`): plná šířka, aktivní světlá.
- **Dlaždice ikony** (`.sprite-tile`): čtverec s obrysem a akcentem modulu.
- **Okno s formulářem** (`Sheet` → `FormWindow`): uprostřed obrazovky, nadpis a křížek, drží se nad klávesnicí, pozadí se neposouvá; **potvrzení** (`useToast`, světlý blok s limetkovou akcí „Vrátit“).

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
  Jediné gradienty jsou rastr a záře akcentu v pozadí obrazovky.
- **Don't:** obličeje na ikonách modulů.
- **Don't:** kreslit ikony znaky (▶ ★) – vždy sprite.
- **Don't:** nadpisky nad nadpisy, VERZÁLKY jako dekorace.
