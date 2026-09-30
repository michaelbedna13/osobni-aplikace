# Design – směr v0.2

Náhled obrazovek: [design/prototyp.html](../design/prototyp.html) · symboly: [design/symboly.html](../design/symboly.html)
(zdroj symbolů pro appku: [design/symboly.js](../design/symboly.js))

## Zadání

- Styl: **clean minimalism + neo brutalism + Bauhaus**, spíš čistší
- Inspirace (dodané screenshoty): kuchařská appka s pastelovými kartami a tvrdým stínem,
  appka „PET“ s obrazovkami v plných barvách a tlačítky jako kostky, e-shop „GOLF“
  s pastelovými obrazovkami, černými obrysy a menu s barevnými čtverci
- Co z inspirace beru: **černé obrysy, tvrdé posunuté stíny, každá obrazovka / modul má svou plnou
  barvu, pilulkové štítky, výrazná čísla**
- Co vynechávám: ilustrace a pixel art (místo nich geometrické tvary z Bauhausu), 3D kostky
  a hustotu prvků – kvůli čistotě

## Principy

1. **Symbol a barva určují modul.** Každý modul má vlastní symbol složený z geometrických tvarů
   a barvu, která vystihuje jeho obsah. Symbol je ikona v přehledu, velký „plakát“ v hlavičce
   modulu a značka v pásu oblíbených.
2. **Stín = dá se na to ťuknout.** Tvrdý stín 4 px mají jen interaktivní prvky. Po stisku se
   prvek posune o 4 px a stín zmizí („zamáčkne se“). Informace jsou ploché.
3. **Klidný základ, barva jen tam, kde něco znamená.** Bílé karty na světle šedém podkladu.
   Plná barva patří hlavičce modulu, hlášce dne a plnění cílů; dlaždice modulů mají barvu
   zesvětlenou (průhlednost ~35 %).
4. **Čísla jsou hrdinové.** Počty a časy velkým širokým písmem.
5. **Jedno výrazné místo na obrazovku.** Na Pivech je to číslo a tlačítko +1, na Meditaci
   kruh časovače. Všechno ostatní je tiché.

## Tokeny

### Barvy

| Token | Hodnota | Použití |
|---|---|---|
| `--ink` | `#000000` | text, obrysy, stíny |
| `--ink-2` | `#4A4A52` | vedlejší text |
| `--paper` | `#FFFFFF` | karty |
| `--ground` | `#F3F3EF` | podklad obrazovky |
Barvy modulů jsou v tabulce [Moduly](#moduly) níže. Každý modul má jednu barvu; kde je potřeba
výraznější výplň (ukazatel na světlém podkladu), má i tmavší variantu:
`--meditace-deep: #5F9466`, `--denik-deep: #C79A4E`.

Text je na všech barvách modulů černý (kontrast vyhovuje WCAG AA).

### Písmo

- **Unbounded** (700–800) – nadpisy, velká čísla, citace
- **Onest** (400–700) – text, tlačítka, popisky
- Obě písma jsou na Google Fonts a podporují češtinu. Popisky v normálních velkých
  a malých písmenech, bez VERZÁLEK.

### Tvar a prostor

| Token | Hodnota |
|---|---|
| obrys | `2px solid #000` |
| stín | `4px 4px 0 #000` (velké tlačítko `6px 6px`) |
| zaoblení karet | `14px` |
| zaoblení tlačítek | `12px`, štítky `999px` |
| okraj obrazovky | `16px` |
| mřížka | násobky `4px`, mezi kartami `16px` |
| min. velikost dotyku | `44 × 44px` (hlavní tlačítka `48px`+) |

## Moduly

Každá barva je vybraná podle toho, co modul vystihuje. Symboly jsou složené z kruhů, čtverců,
trojúhelníků a oblouků; černá = obrys a detaily, bílá = „papír“.

| Modul | Symbol | Barva | Proč tahle barva |
|---|---|---|---|
| Piva | půllitr s pěnou | jantarová `#F6A623` | ležák v půllitru proti světlu |
| Hláškomat | bublina s uvozovkami | citronová `#FFE14D` | smích, komiksové bubliny |
| Trénink | činka | rajčatová `#FF5A3C` | energie, tep, námaha |
| Meditace | lotos nad hladinou | šalvějová `#A9CBA4` | tlumená zeleň přírody, klid, dech |
| Lidé a dárky | dárek s mašlí | růžová `#FF9EC4` | oslavy, dort, blízcí lidé |
| Deník | zápisník se záložkou | kraftová `#E2C48E` | hnědý papír obyčejného zápisníku |
| Odkazy | dva články řetězu | odkazová modrá `#5B8CFF` | modrá jako odkaz na webu |
| Místa | špendlík na mapě | tyrkysová `#62D0C4` | moře, obloha, cestování |
| Filmy a knihy | kniha a filmová cívka | grafitová `#D3D3CD` | černobílý film, tištěná stránka |
| Wishlist | drahokam | levandulová `#C9B3FF` | fialová = luxus a touha |
| Finance | mince | zelená `#3EC46D` | „v plusu“, peníze |

## Obrazovka Dnes

- **Pás „Moje moduly“** – karty připnutých modulů vedle sebe, posouvají se do boku (s přichycením
  na kartu). Každá karta: symbol, hlavní číslo, ukazatel cíle a **rychlá akce** přímo na kartě
  (Piva „+1“, Meditace a Trénink „spustit“, Hláškomat a Deník „zapsat“).
- Výběr a pořadí: „Upravit“ nad pásem nebo připnutí v přehledu Moduly (tečka u dlaždice).
- Pod pásem: hláška dne, nejbližší narozeniny, deník.

## Pohyb

- Stisk: posun + zmizení stínu, 80 ms
- Plnění ukazatelů cílů: jednou při otevření obrazovky
- Respektovat „Omezit pohyb“ v iOS (`prefers-reduced-motion`)

## Otevřené

- **Tmavý režim** – černé obrysy a stíny na tmavém podkladu nefungují 1:1. Navrhnu v Fázi 0
  (varianta: tmavé karty, světlé obrysy, barevné stíny modulu).
- Ikona appky na plochu (návrh: 2×2 mřížka tvarů – kruh, čtverec, trojúhelník, čtvrtkruh)
- Název appky

## Další inspirace

| Modul | Kam se podívat |
|---|---|
| Trénink | Hevy, Strong |
| Meditace | Medito, Oak |
| Odkazy | Raindrop.io, mymind |
| Piva | Untappd |
| Filmy a knihy | Letterboxd, StoryGraph |
| Mapa | Mapstr |
| Deník | Daylio, Bearable |

Kde hledat: Mobbin, Dribbble, Behance (hledat „neubrutalism app“, „bauhaus ui“).
