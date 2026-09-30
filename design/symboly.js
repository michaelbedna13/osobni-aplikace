// Poznávací symboly modulů – složené z geometrických tvarů (Bauhaus).
// Každý symbol je ve viewBoxu 0 0 100 100; M = barva modulu, W = papír, K = černá.

const MODULY = {
  piva: {
    nazev: "Piva", barva: "#F6A623", barvaNazev: "Jantarová",
    proc: "Barva ležáku v půllitru proti světlu.",
    tvar: "Půllitr: obdélník, kruhové ucho a tři kruhy pěny.",
    svg: `
      <circle cx="72" cy="58" r="15" fill="W"/>
      <rect x="20" y="30" width="50" height="62" rx="5" fill="M"/>
      <circle cx="30" cy="30" r="11" fill="W"/><circle cx="46" cy="27" r="12" fill="W"/><circle cx="61" cy="30" r="11" fill="W"/>`
  },
  hlaskomat: {
    nazev: "Hláškomat", barva: "#FFE14D", barvaNazev: "Citronová",
    proc: "Žlutá je barva smíchu a komiksových bublin.",
    tvar: "Kruhová bublina s trojúhelníkovým ocáskem a dvěma hranatými uvozovkami.",
    svg: `
      <path d="M26 64 L8 94 L48 80 Z" fill="M"/>
      <circle cx="54" cy="44" r="38" fill="M"/>
      <path d="M26 64 L8 94 L48 80 Z" fill="M" stroke="none"/>
      <path d="M36 32 h13 v13 l-6 13 h-7 l4 -13 h-4 z" fill="K"/>
      <path d="M57 32 h13 v13 l-6 13 h-7 l4 -13 h-4 z" fill="K"/>`
  },
  trenink: {
    nazev: "Trénink", barva: "#FF5A3C", barvaNazev: "Rajčatová",
    proc: "Energie, tep a námaha.",
    tvar: "Činka: černá tyč a obdélníkové kotouče.",
    svg: `
      <rect x="16" y="45" width="68" height="10" fill="K"/>
      <rect x="6" y="30" width="14" height="40" rx="3" fill="M"/>
      <rect x="18" y="18" width="14" height="64" rx="3" fill="M"/>
      <rect x="68" y="18" width="14" height="64" rx="3" fill="M"/>
      <rect x="80" y="30" width="14" height="40" rx="3" fill="M"/>`
  },
  meditace: {
    nazev: "Meditace", barva: "#A9CBA4", barvaNazev: "Šalvějová",
    proc: "Tlumená zeleň přírody, klidu a dechu.",
    tvar: "Lotos ze tří oblouků nad hladinou.",
    svg: `
      <path d="M50 22 A36 36 0 0 1 50 82 A36 36 0 0 1 50 22 Z" fill="W" transform="rotate(-55 50 82)"/>
      <path d="M50 22 A36 36 0 0 1 50 82 A36 36 0 0 1 50 22 Z" fill="W" transform="rotate(55 50 82)"/>
      <path d="M50 10 A40 40 0 0 1 50 82 A40 40 0 0 1 50 10 Z" fill="M"/>
      <rect x="8" y="84" width="84" height="7" rx="3.5" fill="K"/>`
  },
  lide: {
    nazev: "Lidé a dárky", barva: "#FF9EC4", barvaNazev: "Růžová",
    proc: "Oslavy, dort a vztahy s blízkými.",
    tvar: "Dárek: čtverec, stuha a mašle ze dvou trojúhelníků.",
    svg: `
      <rect x="14" y="42" width="72" height="50" rx="4" fill="M"/>
      <rect x="8" y="30" width="84" height="16" rx="3" fill="M"/>
      <rect x="44" y="30" width="12" height="62" fill="K"/>
      <path d="M50 28 L26 12 V32 Z" fill="W"/><path d="M50 28 L74 12 V32 Z" fill="W"/>
      <circle cx="50" cy="28" r="5" fill="K"/>`
  },
  denik: {
    nazev: "Deník", barva: "#E2C48E", barvaNazev: "Kraftová",
    proc: "Hnědý papír obyčejného zápisníku.",
    tvar: "Zápisník: obdélník, černý hřbet a záložka.",
    svg: `
      <rect x="18" y="8" width="68" height="84" rx="5" fill="M"/>
      <rect x="18" y="8" width="14" height="84" fill="K"/>
      <path d="M62 8 V40 L69 33 L76 40 V8 Z" fill="W"/>
      <rect x="42" y="56" width="32" height="6" fill="K"/><rect x="42" y="70" width="22" height="6" fill="K"/>`
  },
  odkazy: {
    nazev: "Odkazy", barva: "#5B8CFF", barvaNazev: "Odkazová modrá",
    proc: "Modrá jako odkaz na webu.",
    tvar: "Dva články řetězu z oválů.",
    svg: `
      <g transform="rotate(-40 50 50)">
        <rect x="4" y="36" width="56" height="28" rx="14" fill="M"/>
        <rect x="16" y="45" width="32" height="10" rx="5" fill="W"/>
        <rect x="40" y="36" width="56" height="28" rx="14" fill="M"/>
        <rect x="52" y="45" width="32" height="10" rx="5" fill="W"/>
      </g>`
  },
  mista: {
    nazev: "Místa", barva: "#62D0C4", barvaNazev: "Tyrkysová",
    proc: "Moře, obloha a cestování.",
    tvar: "Špendlík z kruhu a trojúhelníku.",
    svg: `
      <path d="M50 94 L23 54 A31 31 0 1 1 77 54 Z" fill="M"/>
      <circle cx="50" cy="38" r="12" fill="W"/>`
  },
  filmy: {
    nazev: "Filmy a knihy", barva: "#D3D3CD", barvaNazev: "Grafitová",
    proc: "Černobílý film a tištěná stránka.",
    tvar: "Kniha za kruhovou filmovou cívkou.",
    svg: `
      <rect x="8" y="10" width="46" height="66" rx="3" fill="W"/>
      <rect x="8" y="10" width="10" height="66" fill="K"/>
      <circle cx="62" cy="60" r="32" fill="M"/>
      <circle cx="62" cy="42" r="7" fill="W"/><circle cx="80" cy="60" r="7" fill="W"/>
      <circle cx="62" cy="78" r="7" fill="W"/><circle cx="44" cy="60" r="7" fill="W"/>
      <circle cx="62" cy="60" r="4" fill="K"/>`
  },
  wishlist: {
    nazev: "Wishlist", barva: "#C9B3FF", barvaNazev: "Levandulová",
    proc: "Fialová je barva luxusu a věcí, po kterých toužíš.",
    tvar: "Drahokam z trojúhelníků.",
    svg: `
      <path d="M18 36 L33 14 H67 L82 36 L50 90 Z" fill="M"/>
      <path d="M40 36 H60 L50 90 Z" fill="W"/>
      <path d="M18 36 H82 M33 14 L40 36 M67 14 L60 36" fill="none"/>`
  },
  finance: {
    nazev: "Finance", barva: "#3EC46D", barvaNazev: "Zelená",
    proc: "Zelená jako „v plusu“ a peníze.",
    tvar: "Sloupek mincí a mince se čtvercovým otvorem.",
    svg: `
      <rect x="8" y="76" width="54" height="14" rx="7" fill="M"/>
      <rect x="14" y="62" width="54" height="14" rx="7" fill="M"/>
      <rect x="8" y="48" width="54" height="14" rx="7" fill="M"/>
      <circle cx="68" cy="32" r="24" fill="M"/>
      <rect x="62" y="26" width="12" height="12" fill="W"/>`
  },
};

// Vrátí SVG symbolu. `bg` = barva „M“ (výchozí barva modulu), `paper` = barva „W“.
function symbol(klic, size = 48, { bg, paper = "#FFFFFF", ink = "#000000", stroke } = {}) {
  const m = MODULY[klic];
  const sw = stroke ?? Math.max(2, Math.round(size / 40));
  const body = m.svg
    .replaceAll('fill="M"', `fill="${bg || m.barva}"`)
    .replaceAll('fill="W"', `fill="${paper}"`)
    .replaceAll('fill="K"', `fill="${ink}"`);
  return `<svg class="sym" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"
    style="display:block;overflow:visible" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round">${body}</svg>`;
}
