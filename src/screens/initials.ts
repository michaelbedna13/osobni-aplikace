/** Iniciály ze jména pro kolečko místo fotky: „Petra Nová“ → „PN“, „Kája“ → „K“. */
export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
