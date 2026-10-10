---
name: untrois – čistý styl s texturami
description: Světlá kapesní appka o vlastním životě. Čisté karty, výrazné nadpisy, každý modul má svou barvu a pozadí, ikony jako vystřižené z papíru.
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
  sage-deep: "#4E7A55"
  fade: "#F7F7F4"
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
  grass: "#A9C49A"
  grass-stripe: "#B4CDA5"
  wood: "#E9B07E"
  wood-dark: "#C47F57"
  wood-edge: "#9E6145"
  board-light: "#E4E9F0"
  board-dark: "#7F8EAB"
  piece-white: "#FBFAF6"
  piece-black: "#23211F"
  last-move: "rgba(244, 211, 94, 0.5)"
  selected-square: "rgba(244, 211, 94, 0.85)"
  bag-shade: "rgba(0, 0, 0, 0.12)"
  finance-mark: "#A87A10"
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
  poster:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "128px"
    fontWeight: 400
    lineHeight: 0.85
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
`scripts/generate-textures.mjs` (film, zrno a jiskření), `scripts/draw-icons.mjs` →
`src/lib/icons.ts` (ikony a šachové figurky), `src/lib/modules.ts`
(barvy modulů), `src/lib/copy.ts` (hlas appky). Product truth je v `PRODUCT.md`.

## Overview

Světlý **čistý minimalismus s duší**: bílé lehce průsvitné karty s velkým zaoblením, hodně vzduchu, výrazné
nadpisy verzálkami, hlavní akce jako pilulky v barvě modulu, tmavé přepínače. Duši dávají **zrno a barevný přechod modulu**
přes celou obrazovku (zrnitý barevný přechod). Ikony jsou **jako vystřižené z papíru**: plné off-black siluety s průhlednými výstřižky.
Zápis má odměnu (ikona poskočí, vyletí „+1“ a konfety, appka řekne vtipnou větu).

## Colors

- **Text a tmavé prvky jsou off-black** `ink` `#23211F` (teplá, ne čistá černá); tmavá tlačítka a lišta mají
  jemný přechod `ink-2` → `ink` se zrnem (`--dark`). Text na tmavém je `on-ink` `#FBFAF6`.
- **Pozadí** `app-bg` `#F4F3EE` (teplý kámen), na počítači kolem appky `desk`. Vedlejší text `slate`, jemné
  plochy `surface-2` (pole formulářů), nečinné sloupce grafů `idle`, tenké linky `edge` (12 % `ink`).
- **Karty** `glass`: bílá s 95 % krytím, bez obrysu, s jemným stínem (`--card-shadow`), aby byly na světlém pozadí dobře vidět.
- **Barva modulu = akcent (`--accent`, tmavší `--deep`)**: hlavní tlačítko, zrnitý přechod pozadí a karty modulů na Dnes, grafy, splněné dny, tečku u nadpisu sekce.
- **Dnes, Moduly a Profil**: pozadí přechází nahoře ze šalvěje (`sage`, `sage-deep`) dolů do `fade`.
- **Limetka** `lime` jen jako plocha (akce „Vrátit“, nová položka, odškrtnutá série); jako text je nečitelná,
  proto „dluží mi“, autor hlášky apod. používají tmavší `lime-ink`. Hvězdy a oblíbené `gold`, chyby `danger`.
- **Zamčené moduly**: šedá dlaždice, ikona v odstínech šedi.

## Pozadí a zrno

Všechny obrazovky mají **stejné pozadí: zrnitý barevný přechod** a mění se jen barva podle modulu (`--accent`,
`--deep`; Dnes, Moduly a Profil mají šalvěj `sage` a tmavě zelenou). Nahoře je barva modulu, vlevo prosvětlená,
v pravém horním rohu tmavší odstín, směrem dolů slábne do téměř bílé. Definice je jedna proměnná `--grad` v CSS, bez obrázků.
Zrnitost dělá jen jemný **film** přes celou obrazovku (tmavé tečky a tmavé zrno s násobením působily špinavě).

- `.screen::before` (pevně pod obsahem, při posouvání stojí): `--grad`;
- `.screen::after` (nad obsahem): film `film.svg` (šedý šum, dlaždice 200 px), krytí 32 %, režim `soft-light` – barvu
  oživí, zesvětlí i ztmaví, ale nešpiní; při švihu zpět se schová;
- **karty modulů na Dnes** (`.fav`) mají hladký přechod v barvě svého modulu **bez zrna** a jemnou světlou hranu:
  pozadí je zrnité, karta čistá, takže se oddělí sama, bez stínu.

Textury generuje `node scripts/generate-textures.mjs` (film, zrno do tmavých ploch a tlačítek, jiskření; výstup je pokaždé stejný).

## Typography

- **Anton** – nadpisy (vždy verzálkami) a velká čísla (`.hero-num`, skóre, karty modulů). Zúžený, tučný.
- **Outfit** – text (400) a ovládání: tlačítka, popisky, záložky, čipy používají „Outfit UI“ (= Outfit 600),
  takže jsou polotučné bez nastavování váhy. Obě písma jsou lokálně v `src/assets/fonts` (SIL OFL).
- Stupnice velikostí (jen tyto): 128 (číslo v hlavičce modulu) / 96 / 56 / 40 / 32 / 24 / 20 px pro Anton, 24 / 18 / 16 / 14 px pro Outfit.
  Nikdy umělé ztučnění (`font-synthesis: none`). Žádné nadpisky (eyebrow) nad nadpisy.

## Layout

- Jeden sloupec, okraj 16 px, max. šířka 520 px (na počítači uprostřed na ploše `desk`).
- Obrazovka modulu: lišta (kulaté tlačítko zpět + název) → **hlavička jako plakát**: obří číslo (128 px) vlevo dole
  jako titulek, ikona velká (230 px), natočená o −8° a oříznutá pravým okrajem jako vystřižený papír za textem
  (číslo je informace, ikona ilustrace, nebijí se). Dlouhá hodnota (`.hero-long`: částka ve Financích, „Dnes“ u Lidí)
  má ikonu menší (160 px) nahoře vpravo a číslo 96 px pod ní, aby se nikdy nepřekryly →
  popisek → hlavní tlačítko → skóre ve 3 polích → **záložky** (např. Týden / Statistiky / Lístek) → obsah
  jen vybrané záložky. Hlavička nemá vlastní kartu, stojí přímo na texturovaném pozadí.
- Panely v záložce mají nadpis uvnitř (`h3`), mezera mezi panely 14 px.
- Dnes: datum, pod ním den v týdnu a **kdo má svátek** (jména tučně, data z balíčku `namedays-cs`),
  případně státní svátek; pod hlavičkou **počasí** jako bílá pilulka (Open-Meteo, modely DWD ICON a ECMWF; poloha
  nebo město, uložené v prohlížeči; ikona, teplota, popis s min–max, déšť jen od 30 %, bez názvu města; ťuknutí
  otevře okno „Počasí – město“ s pocitovou teplotou, větrem, 12 hodinami po 2 h, 3 dny a odkazem Změnit místo),
  pás **modulů** bez nadpisu (posun do boku, karty 160 px, úpravy jsou
  v Profilu); **Nákup** (jen když je co koupit); **„Za co jsem dnes vděčný?“** hned pod nákupem (bez nákupu jako první
  sekce); **Brzy slaví** (oslavy na 7 dní); **Dluhy**; **Na později** (jeden neotevřený odkaz denně). Hláška dne na Dnes není.
- Moduly: mřížka 3 × N, jen ikona a název; každá dlaždice má hladký přechod v barvě svého modulu jako karty na Dnes
  (`--module-card`); bez značky připnutí (které moduly jsou na Dnes, se nastavuje v Profilu), zámek = zamčeno (zamčená dlaždice zůstává bílá).
- Stavový řádek iOS je průhledný (`apple-mobile-web-app-status-bar-style: black-translucent`, `viewport-fit=cover`):
  pozadí běží až pod hodiny, takže nikde není hrana. Hodiny jsou bílé, proto horní okraj `--grad` (110 px) jemně
  ztmavne do `--deep`. Obsah odsazuje `env(safe-area-inset-top)`, v režimu `display-mode: standalone` aspoň 50 px.
  `theme-color` sleduje barvu obrazovky (pro Safari). iOS si styl lišty pamatuje z doby přidání na plochu.
- **Rytmus hlavičky modulu**: uvnitř skupiny údaje těsně (číslo → popisek 12 px → podtext 6 px, řádkování 1,45),
  mezi skupinami velkoryse (údaj → volby a hlavní tlačítko 32 px, volby → tlačítko 20 px, hlavička → obsah 32 px).
  Čipy mají 44 px na výšku.
- **Volba hodnoty vs. přepínač obrazovek**: záložky (`.tabs`) a filtry jsou bílé pilulky s tmavou vybranou položkou.
  Hodnota pro hlavní akci (délka meditace) tak vypadat nesmí: je to stupnice (`.dur-scale`, `role="radiogroup"`) –
  velká čísla v Antonu s malou jednotkou pod sebou, ostatní tlumeně, vybraná v tmavém odstínu modulu (`--deep`) s čárkou; hlavní tlačítko
  pod ní vybranou hodnotu opakuje („Začít · 15 min“). Bez limitu je nekonečno kreslené tahem
  (`.dur-inf`; Anton znak ∞ nemá) přímo v řádku čísla: spodek na účaří, výška jako číslice, takže sedí v jejich úrovni.
  Panely mají 20 px vnitřní okraj, mezi panely 16 px; buňky skóre 16 px nahoře.
- **Spodní lišta**: plovoucí pilulka ze světlého skla (rozmazané pozadí prosvítá) uprostřed dole jen se třemi ikonami
  (Dnes, Moduly, Profil; popisky pro čtečku obrazovky). Aktivní položka je tmavá pilulka se světlou ikonou; obrazovky modulů patří pod Moduly.
- **Švih zpět** (`src/lib/swipeBack.ts`): na obrazovkách se šipkou zpět švih od levého okraje (začátek do 28 px)
  vrací zpět jako v nativní appce. Obrazovka jede s prstem (`.screen.swiping`, stín na levé hraně, pozadí jede s ní)
  a pod ní je už vidět skutečná obrazovka, kam se švih vrací (`.swipe-under`: stejné trasy z `src/routes.tsx`, na začátku
  o 28 % vlevo a ztmavená, s tahem se srovná). Po přetažení přes třetinu šířky nebo rychlém švihu obrazovka dojede
  (rychlost podle švihu) a appka přejde tam, kam vede šipka; kdo přišel z Dnes, vrátí se na Dnes. Jinak se vrátí na místo. Nefunguje v otevřeném okně, na mapě a na hřišti Cornhole.

## Elevation & Depth

- Karty jsou bez obrysu, s jemným dvojitým stínem (`--card-shadow`); stejný mají záložky, čipy a počasí.
- **Měkký stín = dá se na to ťuknout** (`--shadow`), hlavní tlačítko a lišta mají výraznější tmavý stín.
  Po stisku se prvek lehce zmenší (`scale(0.98)`).
- Okna mají velký měkký stín (`--shadow-big`) a pozadí za nimi ztmavené a rozmazané.

## Shapes

- Zaoblení podle velikosti: tlačítka, čipy, záložky, lišta a štítky jako pilulky; karty 24 px, karty modulů a okna
  28 px, drobnosti 6–14 px. Kolečka (avatar, zpět, body grafů) 50 %.
- **Ikony** (`Icon`, data `src/lib/icons.ts` z `scripts/draw-icons.mjs`) jsou **jako vystřižené z papíru**: plná
  silueta v barvě textu (off-black, na tmavém světlá) s lehce nepravidelným okrajem jako stříhaná nůžkami a jeden či
  dva **výstřižky**, které nesou detail (oko v květině, uvozovky v bublině, odlesky na půllitru). Výstřižky jsou
  průhledné (maska), takže jimi prosvítá podklad. Žádné obrysy, stínování ani dlaždice pod ikonou; **bez obličejů**.
  Moduly, doplňky (hvězda, trofej, korunka, zámek, srdce, plamen, fajfka, jiskra), ovládání (`i-…`) a počasí (`w-…`)
  ve viewBoxu 100 × 100; `tone` obarví ikonu barvou modulu (plamen série, srdce priority).
  Ikona může mít i barevný kousek nalepený navrch (vrstva „a“ ve světlém odstínu modulu, „s“ = jeho jemný stín
  o kousek tmavší): Cornhole je černá deska s dírou a na ní decentní pískový pytlík (`light` modulu), bez obrysů,
  jen s lehkým stínem vpravo dole.
- Žádné emoji ani unicode znaky jako ikony.

## Components

- **Hlavní tlačítko** (`.btn-hero`): pilulka v barvě modulu (přechod a zrno, barevný stín), tmavý text a ikona, 60 px. Tmavé (off-black) jsou jen aktivní přepínače, aby se s akcí nepletly; ikona + akce („1 pivo“, „Zapsat hlášku“, „Začít“).
- **Tlačítko / čip / segment**: bílá pilulka bez obrysu; aktivní stav tmavá pilulka se světlým textem.
- **Skóre** (`.score`): tři pole vedle sebe s velkým číslem a popiskem.
- **Kostičkový graf** (`BlockStacks`): jedna kostička = jeden kus; při větších číslech uvede měřítko.
- **Vodorovné pruhy** (`HBars`): dny v týdnu, vítěz v barvě modulu s korunkou; řeší i remízu.
- **Sloupce** (`Columns`): 12 týdnů s hodnotou nad sloupcem.
- **Trofeje** (`.trophies`): 2 × 2, rekord se zlatým rámečkem a ikonou trofeje.
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
- **Šachy** (`.sh-*`): šachovnice přes celou šířku displeje (bez okrajů obrazovky; na nízkém displeji se zmenší, aby
  se vešly panely), pole v modrošedých tónech modulu (`board-light`, `board-dark`), figurky ve stylu vystřižených
  tvarů (`PIECE_SHAPES` v `icons.ts`; bílé `piece-white` s off-black okrajem, černé off-black se světlým okrajem).
  Vybrané pole a poslední tah žlutě, šach červeně, možné tahy kulatou tečkou, braní kroužkem. Nad a pod deskou panel
  hráče (`.sh-player`: jméno v Antonu, sebrané figury, převaha, hodiny `.sh-clock` 40 px, běžící hodiny tmavé
  `--dark`, pod 20 s červeně; kdo je na tahu, má rámeček v `--deep`). Při hře přes stůl je horní panel otočený o 180°.
- **Šipky** (`.sc-*`, modul `skore`): seznam hráčů (`.sc-row`, kdo hází má rámeček v barvě hráče; zbývající body,
  průměr, legy jako čtverečky `.sc-legs`, u ostatních hráčů cesta na zavření `.sc-route`). Pod tím panel: kdo hází,
  návrh zavření (`.sc-checkout`), přepínač Po šipkách / Součtem. Po šipkách: tři políčka náhozu (`.sc-dart`), Double /
  Triple (`.sc-mult`, platí pro jednu šipku), čísla 1–20 v mřížce 5×4, 25 / Bull a Vedle. Součtem: číselník a rychlé
  náhozy (`.sc-quick`); když by součet zavřel, zeptá se na double (`.sc-confirm`). Výhra = panel „Game shot!“.
- **Cornhole – nová hra** (`NewGameSheet`): nahoře „Hrají (v pořadí házení)“ – týmy ve hře s úchytem vlevo (`.gt-handle`,
  přetažením se mění pořadí, šipkami z klávesnice taky), tužkou (upravit) a křížkem (vyřadit z téhle hry, tým zůstane);
  pod tím „Další týmy“ (ťuknutím přidat do hry, tužkou upravit) a „Nový tým“. Okno týmu se otevře nad oknem hry a po
  uložení se do něj vrátí, nový tým je rovnou ve hře; smazat tým jde v okně týmu. Výchozí výběr = týmy minulé hry
  v jejich pořadí (jinak oba, když jsou jen dva). Escape zavře jen horní okno.
- **Cornhole v mobilu** (`.ch-mobile`): hra pro 2–6 hráčů na jednom telefonu. Hřiště (`.ch-arena`) je zaoblená
  plocha; plátno se kreslí vektorově v rozlišení displeje (hladké hrany, herní souřadnice 1 bod = 2 px): světlá
  šalvějová tráva v pruzích, do dálky zesvětlá (`grass`, `grass-stripe`), dřevěná deska s prkny a měkkým stínem
  (`wood`, `wood-dark`, `wood-edge`), off-black díra, pytlíky jako zaoblené polštářky v barvě hráče se stínem
  v letu i na zemi. Vítr, síla hodu a kdo hází jsou bílé pilulky (`--glass`) s off-black textem. Nad hřištěm skóre hráčů (`.ch-player`; od tří hráčů zhuštěně ve 3–4 sloupcích, kdo hází má rámeček v barvě pytlíků, čtverečky = pytlíky
  v ruce). V hřišti vítr vpravo nahoře, síla hodu vlevo (`.ch-power`, čárka = minulý hod), dole kdo hází.
  Ovládání prakem: táhni dolů a pusť. Konec kola a výhra jsou panely uprostřed hřiště. Spodní lišta se skryje.
- **Odkaz** (`.link-card`): náhled 64 px (obrázek webu / nahraný obrázek / písmeno domény), název na 2 řádky,
  web · kdy · kolekce, limetková tečka = „na později“. Detail ve spodním panelu s „Otevřít“.
- **Film / kniha** (`.media-row`): štítek druhu (`.kind-tag`), název, autor / režisér · kdo doporučil; u hotových
  hodnocení 1–5 hvězdiček (ikona hvězdy, nevybrané průsvitné). Zapisuje se ručně textem, bez katalogů.
- **Přání** (`.wish-card`): jako odkaz, navíc cena · priorita a štítek čekání (`.wait-tag`; po 30 dnech limetkový
  „pořád to chceš?“).
- **Mapa** (`.map-box`, MapLibre + vektorové podklady OpenFreeMap bez klíče, vlastní zjednodušený styl v `mista/mapStyle.ts`):
  světlá kamenná zem, světle modrá voda, jemná šalvějová zeleň, bílé silnice, jen názvy obcí, žádné
  body zájmu. Značky (`.map-dot`) jsou kulaté body s tmavým okrajem: „chci“ v barvě modulu, navštívené menší
  šedomodré, vybrané větší se světelným kruhem a jmenovkou („ťukni pro detail“; první ťuknutí vybírá, druhé otevře detail), nový bod a moje poloha pulzují.
  Zdroj dat je schovaný pod malým „i“ v rohu.
- **Finance**: hlavička je jen velké číslo s „Kč“ (měsíčně pravidelně dohromady), bez popisků. Pod souhrnem dva grafy
  (`src/modules/finance/Charts.tsx`, značky v tmavém zlatě `finance-mark`, protože světlá barva modulu má na bílé
  kartě kontrast jen 2,2 : 1; popisky a částky v barvě textu):
  „Kam jdou peníze“ – vodorovné pruhy všech výdajů i předplatného v měsíčním přepočtu, od největšího, částka u každého,
  nad 6 položek „Ostatní (n)“, ťuknutí otevře položku, v rohu „za rok“; „Platby tento měsíc“ – osa dnů 1 až konec
  měsíce, dnešek přerušovanou čárou, zaplacené prázdným kroužkem (stav, ne další barva), nadcházející plnou tečkou,
  víc plateb v jeden den nad sebou, nad osou „Do konce měsíce ještě … Kč“, pod osou vybraná platba (výchozí nejbližší).
  V seznamu výdajů a předplatného ukazuje řádek měsíční částku jen vpravo, podtitulek jen to, co tam není (jiná
  perioda, splatnost „platí se 8. · za 29 dní“, poznámka); splatnost do 3 dnů je zvýrazněná (`.list-btn.soon`).
- **Řádky seznamů** (`.list-btn`): aspoň 60 px, okraje 12 × 18 px, podtitulek 3 px pod názvem s řádkováním 1,35.
- **Částky** (`.money`) polotučně s tabulkovými číslicemi; „dluží mi“ v `lime-ink`, „dlužím“ v barvě `danger`. Předplatné, které se
  obnoví do 3 dnů, má podklad v akcentu; zrušené je zašedlé.
- **Dechový kruh** (`.orb`): kruh v akcentu, při nádechu se plynule zvětšuje, při výdechu zmenšuje,
  při zadržení má čárkovaný obrys; uprostřed odpočet. Během cvičení je spodní lišta schovaná (`.focus-mode`).
- **Okno** (`Modal`) uprostřed obrazovky pro detail hlášky: „obrazovka“ s textem a řada akcí (Top, Kopie, Sdílet,
  Upravit, Smazat). Při psaní se lišta schová (`.kb-open`) a okna i panely se drží nad klávesnicí.
- **Značka untrois**: appka se jmenuje untrois (francouzsky „jedna, tři“ = 13). Píše se vždy malými písmeny, i v nadpisech (třída `.brand` ruší verzálky, `Topbar brand`). Znak untrois i ikona appky je off-black květina
  se **13 lístky** (číslo untrois) a **okem** uprostřed, ve stylu ikony Meditace (ta má 7 lístků); stejný tvar je ikona modulu untrois, vystřižená z papíru na zrnitém
  limetkovém přechodu (barva modulu 13). Zdroj `public/favicon.svg`, PNG přes `npm run icons` s okrajem, aby je iOS
  nezaoblil a kulatá ikona Androidu nic neořízla. Modul untrois má barvu `lime`.
- **Úvodní obrazovka** (`#splash` přímo v `index.html`, aby byla vidět hned, ještě před JS): stejný zrnitý limetkový
  přechod jako ikona, uprostřed jen znak untrois (bez nápisu). Animace: střed vyskočí,
  13 lístků se rozvine jeden po druhém dokola, oko se otevře, zornička se rozhlíží a květ se pomalu otáčí. Zmizí
  (oko mrkne, znak se zvětší, obrazovka prolne), až nic nenačítá (`src/lib/splash.ts`: aspoň 1,3 s, nejdéle 4,5 s,
  počasí se nečeká), takže na Dnes neproblikají nuly. Appka se pod ní vykresluje skrytá (`html.splashing`), aby přes ni na iOS neproblikla skleněná lišta. Tvar lístků kreslí `scripts/draw-splash.mjs`. Při omezeném
  pohybu bez animace.
- **Sekce na Dnes** (`.sec-tab`): nadpis s tečkou v barvě modulu, obsah v bílé kartě; mezi sekcemi 30 px. Nákup,
  Brzy slaví, Vděčnost, Dluhy a Na později mají tečku v barvě svého modulu, pás modulů nemá nadpis.
  Podoba podle funkce: **Brzy slaví** (`.celebrate`): jméno, pod ním co a kdy slaví a nápady na dárek, pokud nějaké jsou
  (`.gift-hint`), vpravo štítek Dnes / Zítra / za n dní (`.when-pill`, kdo slaví dnes, má štítek tmavý). **Dluhy** jsou bilance po lidech: jedna
  pilulka na člověka (`.debt-chip`: jméno, částka zeleně s plus = dluží mně, červeně s minus = dlužím já).
- **Nákup** (`.nk-*`): pole „Co koupit?“ s tlačítkem + v pásu, pod ním návrhy „Často kupuješ“ (chipy). Seznam po
  odděleních v pořadí obchodu (nadpis oddělení v akcentu), řádek = čtverec k odškrtnutí, název, množství, tužka.
  Odškrtnuté jdou do „V košíku“ (přeškrtnuté, čtverec v akcentu), „Vyčistit košík“ je schová s možností Vrátit.
  Na Dnes je pod pásem modulů sekce Nákup (jen když je co koupit): nejvýš 8 položek k odškrtnutí a poslední 3 z košíku.
- **Zámek untrois** (`UntroisLock`, `.lock`): před otevřením modulu ikona zámku, „Nastav si heslo“ (poprvé, dvakrát)
  nebo „Zamčeno“, pole hesla a hlavní tlačítko. Ukládá se jen otisk PBKDF2 se solí (`user_settings.untrois_lock`,
  bez sloupce v prohlížeči); odemčení platí, dokud appka neodejde do pozadí.
- **Nástěnka untrois** (`.board`): dva sloupce dlaždic různé výšky; fotka v původním poměru stran nahoře, pod ní
  štítek kategorie, popisek, poznámka a web odkazu. Ve „Co je 13“ má štítek jen výklad (obrys `idle`), fakta žádný.
- **Vděčnost**: políčko + hlavní tlačítko „Zapsat“ (`.thanks-form`), seznam s odrážkami v akcentu
  (`.thanks-list`), **mozaika** 12 týdnů × 7 dní (`.mosaic`: nic / 1 zápis / 2 a víc), série s plamínkem.
- **Pódium** (Síň slávy): 2.–1.–3. místo, vítěz s korunkou.
- **Karta modulu v pásu** (`.fav`): výřez z pozadí modulu se zrnem a jiskřením, ikona přímo na kartě, název a velké číslo v Anton (56 px) bez popisku – popisek je jen pro čtečku v aria-label; rychlá akce je malá světlá skleněná pilulka vpravo nahoře (36 px), aby se nebila s ikonou.
- **Záložky** (`Tabs`): bílá pilulka přes celou šířku, aktivní položka tmavá.
- **Místo pro ikonu** (`.icon-slot`): bez podkladu, silueta stojí přímo na pozadí. V hlavičce modulu je plakátová ilustrace
  (viz Layout); souhrny po hře a tréninku (`.summary-hero`) zůstávají na střed s menší ikonou.
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
- **Do:** nový modul = nová barva (a tmavší odstín pro přechod) + nová vystřižená ikona v `scripts/draw-icons.mjs` + vlastní herní metafora statistik.
- **Do:** barva nového modulu musí mít odstín zřetelně jiný než ostatní moduly (v carouselu a sekcích na Dnes stojí vedle sebe) a nesmí se krýt s `danger`.
- **Do:** čísla vždy v Anton a s tabulkovými číslicemi.
- **Don't:** čistá černá – tmavé prvky jsou vždy off-black `ink`.
- **Don't:** obrysy kolem karet, tvrdé posunuté stíny, limetka jako barva textu.
- **Don't:** jiné pozadí pro jednotlivé moduly – přechod je všude stejný, liší se jen barvou.
- **Don't:** obličeje na ikonách modulů.
- **Don't:** kreslit ikony znaky (▶ ★) – vždy ikona z `icons.ts`; bílé dlaždice pod ikonami.
- **Don't:** nadpisky nad nadpisy.
