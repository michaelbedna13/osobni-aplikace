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
    key: "piva", name: "Piva", color: "#FFB627", deep: "#C77700", light: "#FFE08A", phase: 1, ready: true, quickAction: "Přidat pivo",
    plan: ["+1 pivo jedním ťuknutím", "Statistiky po dnech a týdnech", "Den v týdnu, kdy piju nejvíc"]
  },
  {
    key: "hlaskomat", name: "Hláškomat", color: "#FFE04A", deep: "#B38A00", light: "#FFF3A8", phase: 1, ready: true, quickAction: "Zapsat hlášku",
    plan: ["Převzetí stávajícího Hláškomatu i s hláškami", "Hláška dne", "Autor propojený s modulem Lidé", "Hláška jako obrázek do chatu"]
  },
  {
    key: "trenink", name: "Trénink", color: "#FF6B4A", deep: "#C2381E", light: "#FFB3A3", phase: 2, quickAction: "Začít trénink",
    plan: ["Knihovna cviků a šablony tréninků", "Předvyplnění z minula", "Časovač pauzy", "Osobní rekordy a progres"]
  },
  {
    key: "meditace", name: "Meditace", color: "#9ED9A6", deep: "#3E8E58", light: "#D4F2D9", phase: 2, ready: true, quickAction: "Začít meditaci",
    plan: ["Časovač s gongem", "Historie meditací a jejich délky", "Cíl, např. 5× týdně, a série", "Statistiky"]
  },
  {
    key: "lide", name: "Lidé a dárky", color: "#FF8FC7", deep: "#D14E92", light: "#FFD0E8", phase: 1, quickAction: "Přidat nápad na dárek",
    plan: ["Narozeniny a jmeniny kamarádů", "Nápady na dárky během roku", "Odběr do Kalendáře v iPhonu", "Poznámky k lidem"]
  },
  {
    key: "denik", name: "Deník", color: "#E8B96A", deep: "#A8742A", light: "#F6DDB0", phase: 2, quickAction: "Zapsat do deníku",
    plan: ["Za co jsem dnes vděčný?", "Jedna věta a nálada denně", "Před rokem tentýž den", "Mozaika nálad"]
  },
  {
    key: "odkazy", name: "Odkazy", color: "#6C8CFF", deep: "#3550C4", light: "#BCCBFF", phase: 1, quickAction: "Uložit odkaz",
    plan: ["Uložení odkazu s náhledem", "Kolekce a moodboardy", "Uložení z menu Sdílet přes Zkratku", "Obrázky a screenshoty"]
  },
  {
    key: "mista", name: "Místa", color: "#4FD6C8", deep: "#1E9488", light: "#B5F0EA", phase: 3, quickAction: "Přidat místo",
    plan: ["Mapa s místy, kam se chceš podívat", "Seznamy a plány výletů", "Navigace v Apple Mapách nebo Mapy.com", "Import z Google Map"]
  },
  {
    key: "filmy", name: "Filmy a knihy", color: "#B9B6CF", deep: "#6E6A8C", light: "#E3E1EE", phase: 3, quickAction: "Přidat film nebo knihu",
    plan: ["Chci vidět / přečíst", "Hledání s plakáty a obálkami", "Kde film běží", "Čtenářská výzva"]
  },
  {
    key: "wishlist", name: "Wishlist", color: "#C59BFF", deep: "#8150D6", light: "#E6D5FF", phase: 3, quickAction: "Přidat přání",
    plan: ["Věci, co chceš koupit", "Cena a priorita", "Pravidlo 30 dní", "Propojení se spořením"]
  },
  {
    key: "finance", name: "Finance", color: "#4CD07D", deep: "#1F8F48", light: "#B8EFCB", phase: 4, quickAction: "Přidat výdaj",
    plan: ["Předplatné a jejich obnovy", "Spořicí cíle", "Kdo mi dluží a komu dlužím", "Útrata za piva"]
  },
];

export const MODULE_BY_KEY = Object.fromEntries(MODULES.map((m) => [m.key, m])) as Record<ModuleKey, ModuleDef>;

export const isModuleKey = (value: string | undefined): value is ModuleKey =>
  !!value && value in MODULE_BY_KEY;

export const DEFAULT_PINNED: ModuleKey[] = ["piva", "meditace", "trenink", "hlaskomat", "denik"];
