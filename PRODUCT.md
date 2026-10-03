# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jeden člověk: autor appky (Michael), česky mluvící, iPhone. Appku používá ve všech situacích:
rychle jednou rukou venku (hospoda, cestou: +1 pivo, zapsat hlášku dřív, než ji zapomene),
v klidu doma (statistiky, procházení hlášek, nastavení), v ranní a večerní rutině (meditace,
trénink, deník) a ukazuje ji kamarádům (hlášky, statistiky piv).

## Product Purpose

Osobní „appka na všechno“: jedno místo pro malé každodenní záznamy a jejich statistiky.
Úspěch = zápis trvá pár vteřin, appka se otevírá ráda, statistiky jsou na první pohled čitelné
a dají se ukázat kamarádům.

## Positioning

Není to produktivní nástroj ani obecný tracker: je to osobní sbírka vlastních rituálů a historek
(piva s kamarády, hlášky party, meditace), postavená přesně na míru jednomu člověku a jeho partě.

## Operating Context

- PWA přidaná na plochu iPhonu (Safari), běží na celou obrazovku; GitHub Pages + Supabase.
- Moduly: Piva (počítadlo půllitrů 0,5 l, bez druhů piv; statistiky po dnech, týdnech, podle dne
  v týdnu), Hláškomat (hláška, autor, kontext, datum, oblíbená), Meditace (časovač s gongem,
  historie délek, týdenní cíl), Vděčnost („Za co jsem dnes vděčný?“, série, mozaika, před rokem),
  Lidé a dárky (narozeniny, jmeniny podle jména, nápady na dárky, export do Kalendáře iPhonu).
  Trénink (doma s jednoručkami a s vlastní vahou: vlastní tréninky ze šablon, série × opakování × kg
  předvyplněné z minula, pauza s pípnutím, rekordy, cíl týdně).
  Cornhole (rodinné hry: týmy s hráči, 2 a víc týmů, body sčítáním nebo rozdílem, zápis pytlíků
  na desce / v díře po kolech, do 21, žebříček týmů a hráčů, rekordy).
  Odkazy (ukládání z menu Sdílet přes Zkratku, náhledy, kolekce, obrázky a screenshoty, na později).
  Filmy a knihy (zapisují se ručně textem: chci / teď / hotovo, hodnocení, kdo doporučil,
  čtenářská výzva).
  Wishlist (cena, priorita, pravidlo 30 dní, koupeno / už nechci a „ušetřeno“).
  Místa (tmavá mapa z OpenStreetMap, hledání míst, ťuknutí do mapy, seznamy, chci / byl jsem,
  navigace do Apple Map, Mapy.com a Google).
  13 – Untrois (osobní brand podle čísla 13: nápady na brand a významy čísla 13, odpočet do pátku 13.).
  Dechová cvičení (krabicové, 4-7-8, rezonanční, fyziologický vzdech, prodloužený výdech, střídavé,
  Wim Hof s měřením zadržení dechu; animovaný průvodce s tóny, historie).
  Finance (předplatné s obnovami a měsíčním součtem, kdo komu dluží, spořicí cíle, útrata za piva).
- Obrazovka Dnes: datum a kdo má svátek, počasí (Open-Meteo), souhrn dne, dluhy, pás připnutých modulů s rychlou akcí, kdo brzy slaví (7 dní), „Za co jsem dnes
  vděčný?“, jeden odkaz „Na později“, hláška dne. Pořadí připnutých modulů se upravuje jen v Profilu.

## Capabilities and Constraints

- React + TypeScript + Vite, plain CSS (`src/styles/app.css`), bez UI knihovny.
- Data jen přihlášeného uživatele (Supabase RLS); ukázkový režim bez Supabase v prohlížeči.
- iOS PWA omezení: žádné widgety, zvuk až po ťuknutí, při zamčeném displeji neběží JS.
- Čeština všude, včetně tvarů slov (1 pivo, 2 piva, 5 piv).

## Brand Commitments

- **Černé obrysy a tvrdé posunuté stíny** (neo brutalismus) zůstávají – jediná výslovně
  zachovaná vlastnost dosavadního vzhledu. Symboly a barvy modulů se smí změnit.
- Uživatel má rád: clean minimalism, neo brutalism, Bauhaus; jeho reference (screenshoty):
  pastelové karty s černým obrysem a tvrdým stínem, obrazovky v plných barvách, hravé ilustrace.
- „Fun“ podle uživatele: odměny a radost z akce (animace, oslava), plné barvy a velké tvary,
  hravé „živé“ postavičky/ilustrace, vtipné české texty.
- Výtky k verzi 1: všechno vypadá stejně (samé bílé karty), nudné a málo barev,
  statistiky a grafy se špatně čtou.

## Evidence on Hand

- Skutečná data: 110 piv (18. 8.–27. 9. 2026), 18 hlášek party (autoři Mišák, Juza, Jachym…).
- Žádné vlastní logo ani ilustrace; vše se kreslí v kódu (SVG).

## Product Principles

1. Zápis jedním ťuknutím; hlavní akce každého modulu je vždy největší věc na obrazovce.
2. Každý modul má na první pohled vlastní tvář – nikdy „samé stejné karty“.
3. Čísla se čtou bez přemýšlení: jedna hlavní informace na blok, srovnání vyjádřené tvarem, ne tabulkou.
4. Akce se odmění: každý zápis má viditelnou, hravou odezvu.
5. Appka mluví jako kamarád z party, ne jako úřad.

## Accessibility & Inclusion

Čitelnost venku na slunci a ve tmě hospody; dotykové cíle min. 44 px; respektovat
„Omezit pohyb“ v iOS.
