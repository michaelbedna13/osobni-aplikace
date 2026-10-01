interface Props {
  values: (number | null)[];
  labels: string[];
  /** Zvýrazněný sloupec (např. dnešek). */
  highlight?: number;
  color: string;
  format?: (n: number) => string;
  /** Popis grafu pro čtečky obrazovky. */
  label: string;
}

/** Jednoduchý sloupcový graf jedné řady. Hodnota null = budoucí/neznámé (čárkovaně). */
export function BarChart({ values, labels, highlight, color, format = String, label }: Props) {
  const max = Math.max(1, ...values.map((v) => v ?? 0));
  return (
    <div className="chart" role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values.length}, 1fr)` }}>
      {values.map((v, i) => (
        <div key={i} className="bar-col" title={`${labels[i]}: ${v === null ? "–" : format(v)}`}>
          <span className="bar-val">{v ? format(v) : ""}</span>
          <div className="bar-wrap">
            <div
              className={`bar${v === null ? " future" : ""}`}
              style={{ height: v === null ? 0 : `${Math.max(v ? 6 : 2, (v / max) * 100)}%`, background: i === highlight ? color : undefined }}
            />
          </div>
          <span className={`bar-day${i === highlight ? " on" : ""}`}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
