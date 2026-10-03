// Dechová cvičení: rytmus (fáze se sekundami) a průvodní texty.

export type PhaseKind = "nadech" | "zadrz" | "vydech" | "zadrz-prazdno";

export interface Phase {
  kind: PhaseKind;
  seconds: number;
  /** Vlastní pokyn místo výchozího (např. „Nádech levou dírkou“). */
  label?: string;
}

export interface BreathExercise {
  key: string;
  name: string;
  /** Krátce, k čemu je. */
  for: string;
  /** Rytmus „4-4-4-4“ pro štítek. */
  pattern: string;
  phases: Phase[];
  /** Výchozí počet minut (u Wima Hofa počet kol). */
  defaultLength: number;
  lengths: number[];
  unit: "min" | "kol";
  how: string[];
  why: string;
  caution?: string;
}

export const PHASE_NAMES: Record<PhaseKind, string> = {
  nadech: "Nádech",
  zadrz: "Zadrž",
  vydech: "Výdech",
  "zadrz-prazdno": "Zadrž na prázdno",
};

export const EXERCISES: BreathExercise[] = [
  {
    key: "krabice",
    name: "Krabicové dýchání",
    for: "Zklidnění a soustředění (parasympatikus)",
    pattern: "4-4-4-4",
    phases: [{ kind: "nadech", seconds: 4 }, { kind: "zadrz", seconds: 4 }, { kind: "vydech", seconds: 4 }, { kind: "zadrz-prazdno", seconds: 4 }],
    defaultLength: 4, lengths: [2, 4, 6, 10], unit: "min",
    how: ["Nadechuj se nosem 4 doby.", "Zadrž dech 4 doby.", "Vydechuj pomalu 4 doby.", "Na prázdno počkej 4 doby a znovu."],
    why: "Rovnoměrný rytmus se zadrženími zpomalí dech a tep a přepne tělo z „bojuj, nebo uteč“ do klidu. Používají ho piloti i vojáci před výkonem.",
  },
  {
    key: "478",
    name: "4-7-8 na usnutí",
    for: "Usínání a úzkost",
    pattern: "4-7-8",
    phases: [{ kind: "nadech", seconds: 4, label: "Nádech nosem" }, { kind: "zadrz", seconds: 7 }, { kind: "vydech", seconds: 8, label: "Výdech ústy se „šššš“" }],
    defaultLength: 2, lengths: [1, 2, 3, 5], unit: "min",
    how: ["Špičku jazyka opři za horní zuby.", "Nadechni se nosem na 4.", "Zadrž dech na 7.", "Vydechuj ústy se syčením na 8."],
    why: "Dlouhý výdech a zadržení výrazně zpomalí dech. Technika Dr. Andrewa Weila; skvělá v posteli před spaním.",
    caution: "Začni se 4 cykly. Když se zatočí hlava, vrať se k normálnímu dechu.",
  },
  {
    key: "rezonance",
    name: "Rezonanční dýchání",
    for: "Dlouhodobý klid, srdce a HRV",
    pattern: "5,5-5,5",
    phases: [{ kind: "nadech", seconds: 5.5 }, { kind: "vydech", seconds: 5.5 }],
    defaultLength: 10, lengths: [5, 10, 15, 20], unit: "min",
    how: ["Dýchej nosem, klidně a do břicha.", "Nádech i výdech trvají 5,5 s – asi 5,5 dechu za minutu.", "Žádné zadržování, plynulá vlna."],
    why: "Při zhruba 6 deších za minutu se srdeční rytmus a dech „rozkmitají“ spolu – stoupá variabilita srdečního tepu (HRV), klesá stres. Nejlepší jako denní rutina na 10 minut.",
  },
  {
    key: "vzdech",
    name: "Fyziologický vzdech",
    for: "Nejrychlejší úleva od stresu",
    pattern: "2+1-6",
    phases: [{ kind: "nadech", seconds: 2, label: "Nádech nosem" }, { kind: "nadech", seconds: 1, label: "Ještě kousek nádechu" }, { kind: "vydech", seconds: 6, label: "Dlouhý výdech ústy" }],
    defaultLength: 2, lengths: [1, 2, 3, 5], unit: "min",
    how: ["Hluboký nádech nosem.", "Hned připoj krátký druhý nádech – dofoukni plíce.", "Pomalý dlouhý výdech ústy až do konce."],
    why: "Dvojitý nádech znovu rozvine plicní sklípky a dlouhý výdech vyplaví CO₂. Ve studii Stanfordu (Huberman, 2023) zlepšoval náladu a snižoval stres rychleji než jiné techniky – stačí 1–5 minut.",
  },
  {
    key: "vydech46",
    name: "Prodloužený výdech",
    for: "Rychlé zklidnění kdykoliv",
    pattern: "4-6",
    phases: [{ kind: "nadech", seconds: 4 }, { kind: "vydech", seconds: 6 }],
    defaultLength: 3, lengths: [2, 3, 5, 10], unit: "min",
    how: ["Nadechni se nosem na 4.", "Vydechuj pomalu nosem nebo sešpulenými rty na 6."],
    why: "Delší výdech než nádech aktivuje bloudivý nerv a zpomaluje tep. Nenápadné – jde dělat v práci, v autě i před důležitým rozhovorem.",
  },
  {
    key: "stridave",
    name: "Střídavé dýchání",
    for: "Vyrovnání a soustředění (Nadi Shodhana)",
    pattern: "4-4-4",
    phases: [
      { kind: "nadech", seconds: 4, label: "Nádech levou dírkou" }, { kind: "zadrz", seconds: 4 }, { kind: "vydech", seconds: 4, label: "Výdech pravou dírkou" },
      { kind: "nadech", seconds: 4, label: "Nádech pravou dírkou" }, { kind: "zadrz", seconds: 4 }, { kind: "vydech", seconds: 4, label: "Výdech levou dírkou" },
    ],
    defaultLength: 5, lengths: [3, 5, 10], unit: "min",
    how: ["Pravým palcem zavři pravou nosní dírku, prsteníčkem levou.", "Nádech levou, zadrž, výdech pravou.", "Nádech pravou, zadrž, výdech levou – a znovu."],
    why: "Jógová technika, která zpomalí dech a zlepší soustředění. Hodí se před meditací nebo prací.",
  },
  {
    key: "wimhof",
    name: "Wim Hof",
    for: "Energie, odolnost vůči stresu a chladu",
    pattern: "30× + zadržení",
    phases: [{ kind: "nadech", seconds: 1.6 }, { kind: "vydech", seconds: 1.4 }],
    defaultLength: 3, lengths: [2, 3, 4], unit: "kol",
    how: [
      "30 hlubokých nádechů: plný nádech nosem nebo ústy, volný výdech (nevytlačuj).",
      "Po posledním výdechu zadrž dech na prázdno, jak dlouho to jde příjemně. Pak ťukni.",
      "Nadechni se naplno a zadrž 15 s. To je jedno kolo.",
    ],
    why: "Řízená hyperventilace a zadržení dechu na chvíli zvednou adrenalin a okysličení. Lidé popisují příval energie a klidnou hlavu; spojuje se se studenou sprchou.",
    caution: "Jen vsedě nebo vleže. Nikdy ve vodě, ve vaně, při řízení ani ve stoje. Mravenčení a lehká závrať jsou normální. Nedělej v těhotenství, při epilepsii, vysokém tlaku nebo nemocech srdce.",
  },
];

export const EXERCISE_BY_KEY = Object.fromEntries(EXERCISES.map((e) => [e.key, e])) as Record<string, BreathExercise>;

export const cycleSeconds = (e: BreathExercise) => e.phases.reduce((s, p) => s + p.seconds, 0);

/** Kde v rytmu jsme po `elapsed` sekundách: fáze, kolik z ní zbývá, kolikátý cyklus. */
export function phaseAt(e: BreathExercise, elapsed: number) {
  const cycle = cycleSeconds(e);
  const n = Math.floor(elapsed / cycle);
  let t = elapsed - n * cycle;
  for (let i = 0; i < e.phases.length; i++) {
    const p = e.phases[i];
    if (t < p.seconds) return { index: i, phase: p, left: p.seconds - t, progress: t / p.seconds, cycle: n };
    t -= p.seconds;
  }
  const last = e.phases.length - 1;
  return { index: last, phase: e.phases[last], left: 0, progress: 1, cycle: n };
}
