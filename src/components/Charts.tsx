import type { ReactNode } from "react";
import { formatNumber } from "../lib/format";

interface StackProps {
  values: (number | null)[];
  labels: string[];
  highlight?: number;
  color: string;
  label: string;
}

const MAX_BLOCKS = 10;

/**
 * Sloupce z kostiček: jedna kostička = jeden kus, takže se dá spočítat okem.
 * Při vyšších počtech jedna kostička zastupuje víc kusů (uvedeno pod grafem).
 */
export function BlockStacks({ values, labels, highlight, color, label }: StackProps) {
  const max = Math.max(1, ...values.map((v) => v ?? 0));
  const unit = Math.ceil(max / MAX_BLOCKS);
  return (
    <figure className="stacks" aria-label={label} role="img">
      <div className="stacks-row">
        {values.map((v, i) => (
          <div key={i} className={`stack${i === highlight ? " on" : ""}${v === null ? " future" : ""}`}>
            <span className="stack-num">{v ?? ""}</span>
            <span className="stack-blocks">
              {Array.from({ length: v ? Math.ceil(v / unit) : 0 }, (_, j) => (
                <i key={j} style={{ background: i === highlight ? `var(--chart-hl, ${color})` : undefined }} />
              ))}
              {v === 0 && <i className="zero" />}
            </span>
            <span className="stack-label">{labels[i]}</span>
          </div>
        ))}
      </div>
      {unit > 1 && <figcaption className="small">1 kostička = {unit}</figcaption>}
    </figure>
  );
}

interface BarRow {
  label: string;
  value: number;
}

/** Vodorovné pruhy z dílků; vítězný řádek dostane korunku (předává se jako `badge`). */
export function HBars({ rows, highlight, color, digits = 1, badge, label }: {
  rows: BarRow[];
  highlight?: number;
  color: string;
  digits?: number;
  badge?: ReactNode;
  label: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 0.0001);
  return (
    <ul className="hbars" aria-label={label}>
      {rows.map((r, i) => (
        <li key={r.label} className={i === highlight ? "on" : undefined}>
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track">
            <i style={{ width: `${(r.value / max) * 100}%`, background: i === highlight ? `var(--chart-hl, ${color})` : undefined }} />
          </span>
          <b className="hbar-value">{formatNumber(r.value, digits)}</b>
          <span className="hbar-badge">{i === highlight ? badge : null}</span>
        </li>
      ))}
    </ul>
  );
}

/** Svislé sloupce s hodnotou nahoře (pro větší čísla, např. týdny). */
export function Columns({ values, labels, highlight, color, label }: StackProps) {
  const max = Math.max(1, ...values.map((v) => v ?? 0));
  return (
    <figure className="columns" role="img" aria-label={label}>
      {values.map((v, i) => (
        <div key={i} className={`col${i === highlight ? " on" : ""}`}>
          <span className="col-num">{v || ""}</span>
          <span className="col-track">
            <i style={{ height: `${((v ?? 0) / max) * 100}%`, background: i === highlight ? `var(--chart-hl, ${color})` : undefined }} />
          </span>
          <span className="col-label">{labels[i]}</span>
        </div>
      ))}
    </figure>
  );
}
