// Registr modulů: název, barva, symbol a plán.
// Symboly jsou složené z geometrických tvarů ve viewBoxu 0 0 100 100.
// Ve značkách: M = barva modulu, W = papír, K = černá. Náhled všech: design/symboly.html.

export type ModuleKey =
  | "piva" | "hlaskomat" | "trenink" | "meditace" | "lide" | "vdecnost"
  | "odkazy" | "mista" | "filmy" | "wishlist" | "finance";

export interface ModuleDef {
  key: ModuleKey;
  name: string;
  color: string;
  /** Tmavší odstín (stíny pixelů, výplně na světlém podkladu). */
  deep: string;
  /** Světlejší odstín (odlesky, podklady). */
  light: string;
  /** Fáze, ve které modul vznikne (viz docs/KONCEPT.md). */
  phase: 1 | 2 | 3 | 4;
  /** Modul je hotový a má vlastní obrazovku. */
  ready?: boolean;
  /** Rychlá akce na kartě v pásu „Moje moduly“ a v nabídce (+). */
  quickAction: string;
  /** Co modul bude umět – zobrazuje se, dokud se modul staví. */
  plan: string[];
}

export const MODULES: ModuleDef[] = [
  {
    key: "piva", name: "Piva", color: "#FEAE34", deep: "#F77622", light: "#FEE761", phase: 1, ready: true, quickAction: "Přidat pivo",
    plan: ["+1 pivo jedním ťuknutím", "Statistiky po dnech a týdnech", "Den v týdnu, kdy piju nejvíc"]
  },
  {
    key: "hlaskomat", name: "Hláškomat", color: "#0099DB", deep: "#124E89", light: "#2CE8F5", phase: 1, ready: true, quickAction: "Zapsat hlášku",
    plan: ["Převzetí stávajícího Hláškomatu i s hláškami", "Hláška dne", "Autor propojený s modulem Lidé", "Hláška jako obrázek do chatu"]
  },
  {
    key: "trenink", name: "Trénink", color: "#E43B44", deep: "#A22633", light: "#F6757A", phase: 2, quickAction: "Začít trénink",
    plan: ["Knihovna cviků a šablony tréninků", "Předvyplnění z minula", "Časovač pauzy", "Osobní rekordy a progres"]
  },
  {
    key: "meditace", name: "Meditace", color: "#63C74D", deep: "#3E8948", light: "#B8E986", phase: 2, ready: true, quickAction: "Začít meditaci",
    plan: ["Časovač s gongem", "Historie meditací a jejich délky", "Cíl, např. 5× týdně, a série", "Statistiky"]
  },
  {
    key: "lide", name: "Lidé a dárky", color: "#B55088", deep: "#68386C", light: "#F6757A", phase: 1, quickAction: "Přidat nápad na dárek",
    plan: ["Narozeniny a jmeniny kamarádů", "Nápady na dárky během roku", "Odběr do Kalendáře v iPhonu", "Poznámky k lidem"]
  },
  {
    key: "vdecnost", name: "Vděčnost", color: "#E4A672", deep: "#B86F50", light: "#EAD4AA", phase: 1, ready: true, quickAction: "Zapsat vděčnost",
    plan: ["Za co jsem dnes vděčný?", "Série dní v řadě", "Mozaika posledních týdnů", "Vzpomínka na starší zápis"]
  },
  {
    key: "odkazy", name: "Odkazy", color: "#2CE8F5", deep: "#0099DB", light: "#C7F9FC", phase: 1, quickAction: "Uložit odkaz",
    plan: ["Uložení odkazu s náhledem", "Kolekce a moodboardy", "Uložení z menu Sdílet přes Zkratku", "Obrázky a screenshoty"]
  },
  {
    key: "mista", name: "Místa", color: "#C28569", deep: "#733E39", light: "#E8B796", phase: 3, quickAction: "Přidat místo",
    plan: ["Mapa s místy, kam se chceš podívat", "Seznamy a plány výletů", "Navigace v Apple Mapách nebo Mapy.com", "Import z Google Map"]
  },
  {
    key: "filmy", name: "Filmy a knihy", color: "#8B9BB4", deep: "#5A6988", light: "#C0CBDC", phase: 3, quickAction: "Přidat film nebo knihu",
    plan: ["Chci vidět / přečíst", "Hledání s plakáty a obálkami", "Kde film běží", "Čtenářská výzva"]
  },
  {
    key: "wishlist", name: "Wishlist", color: "#F6757A", deep: "#B55088", light: "#FAD4D6", phase: 3, quickAction: "Přidat přání",
    plan: ["Věci, co chceš koupit", "Cena a priorita", "Pravidlo 30 dní", "Propojení se spořením"]
  },
  {
    key: "finance", name: "Finance", color: "#FEE761", deep: "#FEAE34", light: "#FFF7C2", phase: 4, quickAction: "Přidat výdaj",
    plan: ["Předplatné a jejich obnovy", "Spořicí cíle", "Kdo mi dluží a komu dlužím", "Útrata za piva"]
  },
];

export const MODULE_BY_KEY = Object.fromEntries(MODULES.map((m) => [m.key, m])) as Record<ModuleKey, ModuleDef>;

export const isModuleKey = (value: string | undefined): value is ModuleKey =>
  !!value && value in MODULE_BY_KEY;

export const DEFAULT_PINNED: ModuleKey[] = ["piva", "vdecnost", "meditace", "hlaskomat", "trenink"];
