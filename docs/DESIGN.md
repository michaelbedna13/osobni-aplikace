---
name: Untrois – čistý styl s texturami
description: Světlá kapesní appka o vlastním životě. Čisté karty, výrazné nadpisy, každý modul má svou barvu a texturu pozadí, ikony zůstávají pixel art.
colors:
  ink: "#23211F"
  ink-2: "#3A3733"
  on-ink: "#FBFAF6"
  paper: "#FFFFFF"
  white: "#FFFFFF"
  glass: "rgba(255, 255, 255, 0.84)"
  edge: "rgba(35, 33, 31, 0.12)"
  on-accent: "#23211F"
  app-bg: "#F4F3EE"
  desk: "#E7E5DF"
  surface-2: "#F1EFEA"
  idle: "#E2DFD8"
  slate: "#6F6B65"
  sage: "#A9C29A"
  sage-light: "#D5E2C9"
  sage-card: "#E8EFDF"
  sage-card-deep: "#C3D6B1"
  stone-light: "#EEF0E8"
  sand: "#E9E3D3"
  map-land: "#EFEDE6"
  lime: "#CEF17B"
  lime-ink: "#4C7A1E"
  gold: "#D99A0B"
  danger: "#CF3F47"
  shadow: "rgba(35, 33, 31, 0.07)"
  shadow-dark: "rgba(35, 33, 31, 0.18)"
  shadow-bar: "rgba(35, 33, 31, 0.22)"
  scrim: "rgba(35, 33, 31, 0.35)"
  paused: "rgba(244, 243, 238, 0.88)"
  game-scrim: "rgba(0, 5, 2, 0.75)"
  grass: "#0E2719"
  grass-stripe: "#12301F"
  wood: "#E4A672"
  wood-dark: "#B86F50"
  wood-edge: "#733E39"
  board-light: "#B9C79E"
  board-dark: "#4E7A55"
  piece-white: "#FEFAE0"
  piece-black: "#1B2A22"
  piva: "#FEAE34"
  piva-deep: "#F77622"
  hlaskomat: "#0099DB"
  hlaskomat-deep: "#124E89"
  meditace: "#63C74D"
  meditace-deep: "#3E8948"
  trenink: "#E43B44"
  lide: "#B55088"
  vdecnost: "#E4A672"
  odkazy: "#C77DF3"
  mista: "#6F8CF7"
  map-me: "#2CE8F5"
  filmy: "#8B9BB4"
  wishlist: "#F98DB9"
  cornhole: "#D77643"
  dech: "#73BED3"
  untrois: "#CEF17B"
  skore: "#A884F3"
  skore-deep: "#5E3FA8"
  sachy: "#C0CBDC"
  sachy-deep: "#5A6988"
  nakup: "#38B7A0"
  nakup-deep: "#1E7466"
  finance: "#FEE761"
typography:
  hero:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "96px"
    fontWeight: 400
    lineHeight: 0.95
  display-lg:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "56px"
    fontWeight: 400
    lineHeight: 1.06
  display:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1
  heading:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.06
  title:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.06
  title-sm:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.1
  label-lg:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.2
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  none: "0px"
  xs: "6px"
  sm: "8px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  card: "28px"
  tile: "40px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "30px"
components:
  button-hero:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.pill}"
    height: "60px"
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "52px"
  chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.pill}"
    height: "40px"
  panel:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "18px"
---

# Design – čistý styl s texturami (v3)

Zdroj pravdy v kódu: `src/styles/app.css` (tokeny jako CSS proměnné), `src/styles/fonts.css` (písma),
`scripts/generate-textures.mjs` (textury), `src/lib/sprites.ts` (ikony modulů a doplňky), `src/lib/modules.ts`
(barvy modulů), `src/lib/copy.ts` (hlas appky). Product truth je v `PRODUCT.md`.

## Overview

Světlý **čistý minimalismus s duší**: bílé lehce průsvitné karty s velkým zaoblením, hodně vzduchu, výrazné
nadpisy verzálkami, hlavní akce jako pilulky v barvě modulu, tmavé přepínače. Duši dávají **zrno a pozadí modulu**
přes celou obrazovku (měkká rozostřená pozadí). Z pixel artu zůstávají **ikony** (sprity), všechno ostatní je hladké.
Zápis má odměnu (ikona poskočí, vyletí „+1“ a konfety, appka řekne vtipnou větu).

## Colors

- **Text a tmavé prvky jsou off-black** `ink` `#23211F` (teplá, ne čistá černá); tmavá tlačítka a lišta mají
  jemný přechod `ink-2` → `ink` se zrnem (`--dark`). Text na tmavém je `on-ink` `#FBFAF6`.
- **Pozadí** `app-bg` `#F4F3EE` (teplý kámen), na počítači kolem appky `desk`. Vedlejší text `slate`, jemné
  plochy `surface-2` (pole formulářů), nečinné sloupce grafů `idle`, tenké linky `edge` (12 % `ink`).
- **Karty** `glass`: bílá s 84 % krytím, bez obrysu – barva pozadí lehce prosvítá.
- **Barva modulu = akcent (`--accent`)**: hlavní tlačítko, pozadí obrazovky a karty modulů na Dnes, stín pod ikonou v hlavičce, grafy, splněné dny, tečku u nadpisu sekce.
- **Dnes, Moduly a Profil** mají neutrální kámen se šalvějovou mlhou (`sage-light`, `sand`, `stone-light`);
  hláška dne je šalvějová karta (`sage-card` → `sage-card-deep`).
- **Limetka** `lime` jen jako plocha (akce „Vrátit“, nová položka, odškrtnutá série); jako text je nečitelná,
  proto „dluží mi“, autor hlášky apod. používají tmavší `lime-ink`. Hvězdy a oblíbené `gold`, chyby `danger`.
- **Zamčené moduly**: šedá dlaždice, ikona v odstínech šedi.

## Pozadí, textury a zrno

Každá obrazovka má vlastní **pozadí** (`src/assets/tex/<klíč>.webp`, 480 × 1040, dohromady ~110 kB), které kreslí
`npm run backgrounds` (`scripts/generate-backgrounds.mjs`, canvas v prohlížeči přes Playwright, výstup je pokaždé stejný).
Pozadí jsou měkká a rozostřená jako fotografie přes sklo, v barvách modulu, a na téma jen **narážejí**:

| Technika | Moduly |
|---|---|
| mléčné sklo: rozmazané siluety za sklem | Dnes a ostatní obrazovky (listy rostliny), Nákup (ovoce a list), Cornhole (pytlík a deska) |
| světlo ve vodě: měkká světelná síť | Piva (medově), Wishlist (růžově s třpytem) |
| inkoustové koule: hustý střed, jemné soustředné kroužky | Meditace (kapka), Dech (dvě koule – nádech a výdech), Šipky (terč) |
| zrnité koule: dvě rozmazané barevné koule | Hláškomat, Lidé, Vděčnost, Finance, Odkazy |
| vroubkované sklo: rozmazané tvary rozlámané do svislých pruhů | 13 – Untrois, Trénink, Šachy, Filmy |
| akvarel: rozpité skvrny s tmavším okrajem | Místa |

Výrazné tvary jsou uprostřed a dole, horní třetina je světlejší, aby hlavička zůstala čitelná. Kterou obrazovku
dostane, určuje `Layout` podle adresy (`--bg` na `.app-main`; Dnes, klíč modulu, jinak „zaklad“).
Obrazovka má dvě pevné vrstvy (`.screen::before` pod obsahem, `.screen::after` nad ním), při posouvání stojí:

- **pod obsahem**: pozadí přes celou obrazovku (`cover`), pod ním záložní tónování `--tint` z barvy modulu;
- **nad obsahem**: zrno `grain.svg` s krytím 16 % v režimu `multiply` (ze `scripts/generate-textures.mjs`).

Karty modulů na Dnes (`.fav`) ukazují výřez z pozadí svého modulu, k tomu jemné zrno a bílé jiskření (`sparkle.svg`).
Hláška dne má výřez z pozadí Dnes na šalvějovém přechodu.

## Typography

- **Anton** – nadpisy (vždy verzálkami) a velká čísla (`.hero-num`, skóre, karty modulů). Zúžený, tučný.
- **Outfit** – text (400) a ovládání: tlačítka, popisky, záložky, čipy používají „Outfit UI“ (= Outfit 600),
  takže jsou polotučné bez nastavování váhy. Obě písma jsou lokálně v `src/assets/fonts` (SIL OFL).
- Stupnice velikostí (jen tyto): 96 / 56 / 40 / 32 / 24 / 20 px pro Anton, 24 / 18 / 16 / 14 px pro Outfit.
  Nikdy umělé ztučnění (`font-synthesis: none`). Žádné nadpisky (eyebrow) nad nadpisy.

## Layout

- Jeden sloupec, okraj 16 px, max. šířka 520 px (na počítači uprostřed na ploše `desk`).
- Obrazovka modulu: lišta (kulaté tlačítko zpět + název) → ikona na bílé dlaždici s barevným stínem → obří číslo,
  popisek → hlavní tlačítko → skóre ve 3 polích → **záložky** (např. Týden / Statistiky / Lístek) → obsah
  jen vybrané záložky. Hlavička nemá vlastní kartu, stojí přímo na texturovaném pozadí.
- Panely v záložce mají nadpis uvnitř (`h3`), mezera mezi panely 14 px.
- Dnes: datum, pod ním den v týdnu a **kdo má svátek** (jména tučně, data z balíčku `namedays-cs`),
  případně státní svátek; pod hlavičkou **počasí** jako bílá pilulka (Open-Meteo, modely DWD ICON a ECMWF; poloha
  nebo město, uložené v prohlížeči; ikona, teplota, popis s min–max, déšť jen od 30 %, bez názvu města; ťuknutí
  otevře okno „Počasí – město“ s pocitovou teplotou, větrem, 12 hodinami po 2 h, 3 dny a odkazem Změnit místo),
  pod ním **hláška dne** (`.day-quote`: šalvějová karta s paprsky, text Outfit 24 px nejvýš na 4 řádky, autor v bílé
  pilulce, kontext vpravo; ťuknutí otevře Hláškomat); pás **Moje moduly** (posun do boku, karty 160 px, úpravy jsou
  v Profilu); **Nákup** (jen když je co koupit); **Brzy slaví** (oslavy na 7 dní); **„Za co jsem dnes vděčný?“**;
  **Dluhy**; **Na později** (jeden neotevřený odkaz denně).
- Moduly: mřížka 3 × N, jen ikona a název; hvězdička = připnuto, zámek = zamčeno.
- Stavový řádek iOS má tmavý text na světlém pruhu (`apple-mobile-web-app-status-bar-style: default`, `theme-color`
  `app-bg`), obsah odsazuje `env(safe-area-inset-top)`. iOS si styl pamatuje z doby přidání na plochu – po změně je
  potřeba appku z plochy odebrat a přidat znovu.
- **Spodní lišta**: tmavá plovoucí pilulka uprostřed dole jen se třemi ikonami (Dnes, Moduly, Profil; popisky pro
  čtečku obrazovky). Aktivní položka je světlé kolečko s tmavou ikonou; obrazovky modulů patří pod Moduly.

## Elevation & Depth

- Karty jsou bez obrysu a bez stínu; od pozadí je odděluje bílá barva.
- **Měkký stín = dá se na to ťuknout** (`--shadow`), hlavní tlačítko a lišta mají výraznější tmavý stín.
  Po stisku se prvek lehce zmenší (`scale(0.98)`).
- Okna mají velký měkký stín (`--shadow-big`) a pozadí za nimi ztmavené a rozmazané.

## Shapes

- Zaoblení podle velikosti: tlačítka, čipy, záložky, lišta a štítky jako pilulky; karty 24 px, karty modulů a okna
  28 px, dlaždice ikony v hlavičce 40 px, drobnosti 6–14 px. Kolečka (avatar, zpět, body grafů) 50 %.
- **Ikony modulů** jsou pixelové sprity v `src/lib/sprites.ts` (SVG, `shape-rendering: crispEdges`)
  ve stylu předmětů z RPG: **bez obličejů**, tmavý obrys, čtyřtónové stínování (obrys, stín, barva,
  světlo; světlo zleva nahoře) a jeden detail v doplňkové barvě (pěna, uvozovky, stuha, záložka). Ikony lišty jsou
  plné siluety 12 × 12 v barvě textu. Moduly 16 × 16, doplňky (hvězda, trofej, korunka, zámek, plamen, fajfka,
  jiskra) a ikony 10 × 10 (`i-…`). Velikost vždy násobek mřížky.
- Žádné emoji ani unicode znaky jako ikony.

## Components

- **Hlavní tlačítko** (`.btn-hero`): pilulka v barvě modulu (přechod a zrno, barevný stín), tmavý text a ikona, 60 px. Tmavé (off-black) jsou jen aktivní přepínače, aby se s akcí nepletly; ikona + akce („1 pivo“, „Zapsat hlášku“, „Začít“).
- **Tlačítko / čip / segment**: bílá pilulka bez obrysu; aktivní stav tmavá pilulka se světlým textem.
- **Skóre** (`.score`): tři pole vedle sebe s velkým číslem a popiskem.
- **Kostičkový graf** (`BlockStacks`): jedna kostička = jeden kus; při větších číslech uvede měřítko.
- **Vodorovné pruhy** (`HBars`): dny v týdnu, vítěz v barvě modulu s korunkou; řeší i remízu.
- **Sloupce** (`Columns`): 12 týdnů s hodnotou nad sloupcem.
- **Trofeje** (`.trophies`): 2 × 2, rekord zlatě se spritem trofeje.
- **Karta hlášky** (`.quote-card`): text hlášky a pod ním **uvnitř karty** autor v `lime-ink` a kontext s datem
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
  web · kdy · kolekce, limetková tečka = „na později“. Detail ve spodním panelu s „Otevřít“.
- **Film / kniha** (`.media-row`): štítek druhu (`.kind-tag`), název, autor / režisér · kdo doporučil; u hotových
  hodnocení 1–5 hvězdiček (sprite hvězdy, nevybrané šedé). Zapisuje se ručně textem, bez katalogů.
- **Přání** (`.wish-card`): jako odkaz, navíc cena · priorita a štítek čekání (`.wait-tag`; po 30 dnech limetkový
  „pořád to chceš?“).
- **Mapa** (`.map-box`, MapLibre + vektorové podklady OpenFreeMap bez klíče, vlastní zjednodušený styl v `mista/mapStyle.ts`):
  světlá kamenná zem, světle modrá voda, jemná šalvějová zeleň, bílé silnice, jen názvy obcí, žádné
  body zájmu. Značky (`.map-dot`) jsou kulaté body s tmavým okrajem: „chci“ v barvě modulu, navštívené menší
  šedomodré, vybrané větší se světelným kruhem a jmenovkou („ťukni pro detail“; první ťuknutí vybírá, druhé otevře detail), nový bod a moje poloha pulzují.
  Zdroj dat je schovaný pod malým „i“ v rohu.
- **Výdaje** (Finance): pruh podílů (`.exp-bar`, dílky v barvě modulu podle měsíční částky, odstíny se střídají) a pod ním
  tři největší položky v procentech; výdaj se splatností do 3 dnů je zvýrazněný (`.list-btn.soon`).
- **Částky** (`.money`) polotučně s tabulkovými číslicemi; „dluží mi“ v `lime-ink`, „dlužím“ v barvě `danger`. Předplatné, které se
  obnoví do 3 dnů, má podklad v akcentu; zrušené je zašedlé.
- **Dechový kruh** (`.orb`): kruh v akcentu, při nádechu se plynule zvětšuje, při výdechu zmenšuje,
  při zadržení má čárkovaný obrys; uprostřed odpočet. Během cvičení je spodní lišta schovaná (`.focus-mode`).
- **Okno** (`Modal`) uprostřed obrazovky pro detail hlášky: „obrazovka“ s textem a řada akcí (Top, Kopie, Sdílet,
  Upravit, Smazat). Při psaní se lišta schová (`.kb-open`) a okna i panely se drží nad klávesnicí.
- **Značka Untrois**: appka se jmenuje Untrois (francouzsky „jedna, tři“ = 13). Ikona appky jsou dvě pixelové
  kostky, limetková s jedním okem a zlatá se třemi (un, trois), se stínem `edge` na zrnitém limetkovém světle
  jako pozadí appky; hrany kostek tmavší (`#7BA33A`, `#C9A227`). Zdroj `public/favicon.svg`, PNG přes `npm run icons`
  s okrajem kolem kostek, aby je iOS nezaoblil. Modul 13 – Untrois má barvu `lime`.
- **Sekce na Dnes** (`.sec-tab`): nadpis s tečkou v barvě modulu, obsah v bílé kartě; mezi sekcemi 30 px. Nákup,
  Brzy slaví, Vděčnost, Dluhy a Na později mají tečku v barvě svého modulu, „Moje moduly“ zůstávají bez tečky.
- **Nákup** (`.nk-*`): pole „Co koupit?“ s tlačítkem + v pásu, pod ním návrhy „Často kupuješ“ (chipy). Seznam po
  odděleních v pořadí obchodu (nadpis oddělení v akcentu), řádek = čtverec k odškrtnutí, název, množství, tužka.
  Odškrtnuté jdou do „V košíku“ (přeškrtnuté, čtverec v akcentu), „Vyčistit košík“ je schová s možností Vrátit.
  Na Dnes je pod „Moje moduly“ sekce Nákup (jen když je co koupit): nejvýš 8 položek k odškrtnutí a poslední 3 z košíku.
- **Nástěnka Untrois** (`.board`): dva sloupce dlaždic různé výšky; fotka v původním poměru stran nahoře, pod ní
  štítek kategorie, popisek, poznámka a web odkazu. Ve „Co je 13“ má štítek jen výklad (obrys `idle`), fakta žádný.
- **Vděčnost**: políčko + hlavní tlačítko „Zapsat“ (`.thanks-form`), seznam s odrážkami v akcentu
  (`.thanks-list`), **mozaika** 12 týdnů × 7 dní (`.mosaic`: nic / 1 zápis / 2 a víc), série s plamínkem.
- **Pódium** (Síň slávy): 2.–1.–3. místo, vítěz s korunkou.
- **Karta modulu v pásu** (`.fav`): pastelový přechod v barvě modulu se zrnem a jiskřením, ikona na bílé dlaždici, název, číslo v Anton, rychlá akce jako tmavé kolečko vpravo nahoře.
- **Záložky** (`Tabs`): bílá pilulka přes celou šířku, aktivní položka tmavá.
- **Dlaždice ikony** (`.sprite-tile`): zaoblený čtverec ve světlém akcentu; v hlavičce modulu bílý s barevným stínem.
- **Okno s formulářem** (`Sheet` → `FormWindow`): uprostřed obrazovky, nadpis a křížek, drží se nad klávesnicí, pozadí se neposouvá; **potvrzení** (`useToast`, tmavá pilulka s limetkovou akcí „Vrátit“).

### Pohyb

- Plynulé animace s rychlým doběhem (`--step`); po stisku se prvky lehce zmenší.
- Ikona v klidu pomalu pohupuje (`bob`), po akci poskočí (`jump`), při meditaci dýchá
  (`breathe`, 8 s cyklus s textem Nádech / Výdech).
- Odměna: `Burst` – 14 konfet a vyletující „+1“ v Anton.
- Vše vypnuto při „Omezit pohyb“.

### Hlas

Kamarád z party: „Dneska zatím na suchu“, „Třetí. Číšník už ví.“, „Zapsáno do dějin.“,
„Kratší než 30 s, to se nepočítá“. Hlášky jsou v `src/lib/copy.ts`.

## Do's and Don'ts

- **Do:** jedna hlavní akce na obrazovku, největší prvek pod číslem.
- **Do:** nový modul = nová barva + nový 16 × 16 sprite + pozadí, které na téma jen naráží + vlastní herní metafora statistik.
- **Do:** barva nového modulu musí mít odstín zřetelně jiný než ostatní moduly (v carouselu a sekcích na Dnes stojí vedle sebe) a nesmí se krýt s `danger`.
- **Do:** čísla vždy v Anton a s tabulkovými číslicemi.
- **Don't:** čistá černá – tmavé prvky jsou vždy off-black `ink`.
- **Don't:** obrysy kolem karet, tvrdé posunuté stíny, limetka jako barva textu.
- **Don't:** doslovné pozadí (bublinky u piv, činky u tréninku); jen náznak barvou, světlem a tvarem.
- **Don't:** obličeje na ikonách modulů.
- **Don't:** kreslit ikony znaky (▶ ★) – vždy sprite.
- **Don't:** nadpisky nad nadpisy.
