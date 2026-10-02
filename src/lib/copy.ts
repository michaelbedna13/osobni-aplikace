// Hlas appky: kamarád z party, ne úřad.

const pick = <T,>(list: T[], seed = Date.now()) => list[Math.abs(seed) % list.length];

export function beerCheer(nthToday: number) {
  if (nthToday === 1) return pick(["První dneska. Na zdraví!", "Tak jedno na začátek.", "Otvíráme lístek."]);
  if (nthToday === 2) return pick(["Druhý. Rozjíždíme se.", "Dvojka v kapse.", "Na jednu nohu se nestojí."]);
  if (nthToday === 3) return pick(["Třetí. Číšník už ví.", "Trojka, klasika.", "Tři, to je slušný večer."]);
  if (nthToday === 5) return "Pátý! Čárky už se přeškrtávají.";
  if (nthToday >= 8) return pick(["Respekt. A teď sklenici vody.", "Dneska se píše historie.", "Lístek už nestačí."]);
  return pick(["Píšu čárku.", "Na zdraví!", "Další do sbírky.", "Zapsáno, pokračuj."]);
}

export function beerHeadline(today: number) {
  if (today === 0) return "Dneska zatím na suchu";
  if (today === 1) return "pivo dnes";
  if (today <= 4) return "piva dnes";
  return "piv dnes";
}

export const quoteSaved = () => pick(["Zapsáno do dějin.", "Tohle se nesmí zapomenout.", "Hláška uložena. Legenda žije."]);

export function meditationDone(minutes: number) {
  if (minutes >= 20) return pick(["Hluboký zen. Klobouk dolů.", "Mistr klidu."]);
  return pick(["Hotovo. Hlava vyvětraná.", "Pěkně jsi to udýchal.", "Klid uložen."]);
}

export function gratitudeSaved(nthToday: number) {
  if (nthToday === 1) return pick(["Zapsáno. Den má základ.", "První dnešní díky.", "Hezký. Tohle si pamatuj."]);
  if (nthToday === 2) return pick(["Dvě věci. Dobrá bilance.", "A ještě jedna. Paráda."]);
  if (nthToday === 3) return pick(["Tři! Tohle je dobrý den.", "Trojka vděčnosti, klasika."]);
  return pick(["Hojnost. Zapsáno.", "Dneska se daří.", "Další do sbírky."]);
}
