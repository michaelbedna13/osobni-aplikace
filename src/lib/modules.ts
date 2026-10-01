// Registr modulů: název, barva, symbol a plán.
// Symboly jsou složené z geometrických tvarů ve viewBoxu 0 0 100 100.
// Ve značkách: M = barva modulu, W = papír, K = černá. Náhled všech: design/symboly.html.

export type ModuleKey =
  | "piva" | "hlaskomat" | "trenink" | "meditace" | "lide" | "denik"
  | "odkazy" | "mista" | "filmy" | "wishlist" | "finance";

export interface ModuleDef {
  key: ModuleKey;
  name: string;
  color: string;
  /** Tmavší varianta barvy pro výplně na světlém podkladu. */
  deep?: string;
  /** Fáze, ve které modul vznikne (viz docs/KONCEPT.md). */
  phase: 1 | 2 | 3 | 4;
  /** Rychlá akce na kartě v pásu „Moje moduly“ a v nabídce (+). */
  quickAction: string;
  /** Co modul bude umět – zobrazuje se, dokud se modul staví. */
  plan: string[];
  svg: string;
}

export const MODULES: ModuleDef[] = [
  {
    key: "piva", name: "Piva", color: "#F6A623", phase: 1, quickAction: "Přidat pivo",
    plan: ["+1 pivo jedním ťuknutím", "Oblíbená piva a hospody", "Statistiky po dnech, týdnech a letech", "Limit na týden"],
    svg: `
      <circle cx="72" cy="58" r="15" fill="W"/>
      <rect x="20" y="30" width="50" height="62" rx="5" fill="M"/>
      <circle cx="30" cy="30" r="11" fill="W"/><circle cx="46" cy="27" r="12" fill="W"/><circle cx="61" cy="30" r="11" fill="W"/>`,
  },
  {
    key: "hlaskomat", name: "Hláškomat", color: "#FFE14D", phase: 1, quickAction: "Zapsat hlášku",
    plan: ["Převzetí stávajícího Hláškomatu i s hláškami", "Hláška dne", "Autor propojený s modulem Lidé", "Hláška jako obrázek do chatu"],
    svg: `
      <path d="M26 64 L8 94 L48 80 Z" fill="M"/>
      <circle cx="54" cy="44" r="38" fill="M"/>
      <path d="M26 64 L8 94 L48 80 Z" fill="M" stroke="none"/>
      <path d="M36 32 h13 v13 l-6 13 h-7 l4 -13 h-4 z" fill="K"/>
      <path d="M57 32 h13 v13 l-6 13 h-7 l4 -13 h-4 z" fill="K"/>`,
  },
  {
    key: "trenink", name: "Trénink", color: "#FF5A3C", phase: 2, quickAction: "Začít trénink",
    plan: ["Knihovna cviků a šablony tréninků", "Předvyplnění z minula", "Časovač pauzy", "Osobní rekordy a progres"],
    svg: `
      <rect x="16" y="45" width="68" height="10" fill="K"/>
      <rect x="6" y="30" width="14" height="40" rx="3" fill="M"/>
      <rect x="18" y="18" width="14" height="64" rx="3" fill="M"/>
      <rect x="68" y="18" width="14" height="64" rx="3" fill="M"/>
      <rect x="80" y="30" width="14" height="40" rx="3" fill="M"/>`,
  },
  {
    key: "meditace", name: "Meditace", color: "#A9CBA4", deep: "#5F9466", phase: 2, quickAction: "Začít meditaci",
    plan: ["Časovač s gongem", "Historie meditací a jejich délky", "Cíl, např. 5× týdně, a série", "Statistiky"],
    svg: `
      <path d="M50 22 A36 36 0 0 1 50 82 A36 36 0 0 1 50 22 Z" fill="W" transform="rotate(-55 50 82)"/>
      <path d="M50 22 A36 36 0 0 1 50 82 A36 36 0 0 1 50 22 Z" fill="W" transform="rotate(55 50 82)"/>
      <path d="M50 10 A40 40 0 0 1 50 82 A40 40 0 0 1 50 10 Z" fill="M"/>
      <rect x="8" y="84" width="84" height="7" rx="3.5" fill="K"/>`,
  },
  {
    key: "lide", name: "Lidé a dárky", color: "#FF9EC4", phase: 1, quickAction: "Přidat nápad na dárek",
    plan: ["Narozeniny a jmeniny kamarádů", "Nápady na dárky během roku", "Odběr do Kalendáře v iPhonu", "Poznámky k lidem"],
    svg: `
      <rect x="14" y="42" width="72" height="50" rx="4" fill="M"/>
      <rect x="8" y="30" width="84" height="16" rx="3" fill="M"/>
      <rect x="44" y="30" width="12" height="62" fill="K"/>
      <path d="M50 28 L26 12 V32 Z" fill="W"/><path d="M50 28 L74 12 V32 Z" fill="W"/>
      <circle cx="50" cy="28" r="5" fill="K"/>`,
  },
  {
    key: "denik", name: "Deník", color: "#E2C48E", deep: "#C79A4E", phase: 2, quickAction: "Zapsat do deníku",
    plan: ["Za co jsem dnes vděčný?", "Jedna věta a nálada denně", "Před rokem tentýž den", "Mozaika nálad"],
    svg: `
      <rect x="18" y="8" width="68" height="84" rx="5" fill="M"/>
      <rect x="18" y="8" width="14" height="84" fill="K"/>
      <path d="M62 8 V40 L69 33 L76 40 V8 Z" fill="W"/>
      <rect x="42" y="56" width="32" height="6" fill="K"/><rect x="42" y="70" width="22" height="6" fill="K"/>`,
  },
  {
    key: "odkazy", name: "Odkazy", color: "#5B8CFF", phase: 1, quickAction: "Uložit odkaz",
    plan: ["Uložení odkazu s náhledem", "Kolekce a moodboardy", "Uložení z menu Sdílet přes Zkratku", "Obrázky a screenshoty"],
    svg: `
      <g transform="rotate(-40 50 50)">
        <rect x="4" y="36" width="56" height="28" rx="14" fill="M"/>
        <rect x="16" y="45" width="32" height="10" rx="5" fill="W"/>
        <rect x="40" y="36" width="56" height="28" rx="14" fill="M"/>
        <rect x="52" y="45" width="32" height="10" rx="5" fill="W"/>
      </g>`,
  },
  {
    key: "mista", name: "Místa", color: "#62D0C4", phase: 3, quickAction: "Přidat místo",
    plan: ["Mapa s místy, kam se chceš podívat", "Seznamy a plány výletů", "Navigace v Apple Mapách nebo Mapy.com", "Import z Google Map"],
    svg: `
      <path d="M50 94 L23 54 A31 31 0 1 1 77 54 Z" fill="M"/>
      <circle cx="50" cy="38" r="12" fill="W"/>`,
  },
  {
    key: "filmy", name: "Filmy a knihy", color: "#D3D3CD", phase: 3, quickAction: "Přidat film nebo knihu",
    plan: ["Chci vidět / přečíst", "Hledání s plakáty a obálkami", "Kde film běží", "Čtenářská výzva"],
    svg: `
      <rect x="8" y="10" width="46" height="66" rx="3" fill="W"/>
      <rect x="8" y="10" width="10" height="66" fill="K"/>
      <circle cx="62" cy="60" r="32" fill="M"/>
      <circle cx="62" cy="42" r="7" fill="W"/><circle cx="80" cy="60" r="7" fill="W"/>
      <circle cx="62" cy="78" r="7" fill="W"/><circle cx="44" cy="60" r="7" fill="W"/>
      <circle cx="62" cy="60" r="4" fill="K"/>`,
  },
  {
    key: "wishlist", name: "Wishlist", color: "#C9B3FF", phase: 3, quickAction: "Přidat přání",
    plan: ["Věci, co chceš koupit", "Cena a priorita", "Pravidlo 30 dní", "Propojení se spořením"],
    svg: `
      <path d="M18 36 L33 14 H67 L82 36 L50 90 Z" fill="M"/>
      <path d="M40 36 H60 L50 90 Z" fill="W"/>
      <path d="M18 36 H82 M33 14 L40 36 M67 14 L60 36" fill="none"/>`,
  },
  {
    key: "finance", name: "Finance", color: "#3EC46D", phase: 4, quickAction: "Přidat výdaj",
    plan: ["Předplatné a jejich obnovy", "Spořicí cíle", "Kdo mi dluží a komu dlužím", "Útrata za piva"],
    svg: `
      <rect x="8" y="76" width="54" height="14" rx="7" fill="M"/>
      <rect x="14" y="62" width="54" height="14" rx="7" fill="M"/>
      <rect x="8" y="48" width="54" height="14" rx="7" fill="M"/>
      <circle cx="68" cy="32" r="24" fill="M"/>
      <rect x="62" y="26" width="12" height="12" fill="W"/>`,
  },
];

export const MODULE_BY_KEY = Object.fromEntries(MODULES.map((m) => [m.key, m])) as Record<ModuleKey, ModuleDef>;

export const isModuleKey = (value: string | undefined): value is ModuleKey =>
  !!value && value in MODULE_BY_KEY;

export const DEFAULT_PINNED: ModuleKey[] = ["piva", "meditace", "trenink", "hlaskomat", "denik"];

interface SymbolOptions {
  bg?: string;
  paper?: string;
  ink?: string;
  stroke?: number;
}

/** SVG kód symbolu modulu. */
export function symbolSvg(key: ModuleKey, size = 48, { bg, paper = "#FFFFFF", ink = "#000000", stroke }: SymbolOptions = {}) {
  const m = MODULE_BY_KEY[key];
  const sw = stroke ?? Math.max(2, Math.round(size / 40));
  const body = m.svg
    .replaceAll('fill="M"', `fill="${bg ?? m.color}"`)
    .replaceAll('fill="W"', `fill="${paper}"`)
    .replaceAll('fill="K"', `fill="${ink}"`);
  return `<svg class="sym" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round">${body}</svg>`;
}
