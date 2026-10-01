/** České tvary slova podle počtu: plural(3, ["pivo", "piva", "piv"]) → „piva“. */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  if (!Number.isInteger(n)) return few; // 2,4 piva
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

export const formatNumber = (n: number, digits = 1) =>
  n.toLocaleString("cs-CZ", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export const formatDate = (d: Date, withYear = false) =>
  `${d.getDate()}. ${d.getMonth() + 1}.${withYear ? ` ${d.getFullYear()}` : ""}`;
