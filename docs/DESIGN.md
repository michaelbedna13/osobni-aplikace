# Design – směr v0.1

Náhled obrazovek: [design/prototyp.html](../design/prototyp.html) (otevři v prohlížeči).

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

1. **Tvar a barva určují modul.** Každý modul má jeden tvar a jednu barvu. Stejný tvar je ikona,
   „plakát“ v hlavičce modulu i ukazatel plnění cíle (tvar se plní barvou zdola).
2. **Stín = dá se na to ťuknout.** Tvrdý stín 4 px mají jen interaktivní prvky. Po stisku se
   prvek posune o 4 px a stín zmizí („zamáčkne se“). Informace jsou ploché.
3. **Klidný základ, barva jen tam, kde něco znamená.** Bílé karty na světle šedém podkladu.
   Plná barva patří hlavičce modulu, hlášce dne a plnění cílů.
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
| `--yellow` | `#FFD84A` | Piva, Wishlist, tlačítko (+) |
| `--pink` | `#FFA9C6` | Hláškomat |
| `--lilac` | `#C3ADF7` | Meditace, Deník |
| `--lilac-deep` | `#7A5CE6` | plnění časovače meditace |
| `--sky` | `#A9D1F2` | Lidé, Odkazy, Filmy a knihy |
| `--mint` | `#A8DB8C` | Místa, Finance, stav „koupeno“ |
| `--tomato` | `#FF6F4F` | Trénink |

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

| Modul | Tvar | Barva |
|---|---|---|
| Piva | kruh | žlutá |
| Meditace | kruh | levandulová |
| Trénink | čtverec | rajčatová |
| Hláškomat | čtvrtkruh | růžová |
| Lidé (narozeniny, dárky) | kruh | nebeská |
| Deník | půlkruh | levandulová |
| Odkazy | půlkruh | nebeská |
| Místa | trojúhelník | mátová |
| Filmy a knihy | čtverec | nebeská |
| Wishlist | trojúhelník | žlutá |
| Finance | čtverec | mátová |

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
