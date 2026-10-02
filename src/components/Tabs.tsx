interface Props<T extends string> {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}

/** Záložky obrazovky modulu – rozdělí dlouhý obsah, ať je vidět jen to podstatné. */
export function Tabs<T extends string>({ items, value, onChange, label }: Props<T>) {
  return (
    <div className="tabs" role="tablist" aria-label={label} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          aria-selected={value === it.id}
          className={value === it.id ? "on" : undefined}
          onClick={() => onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
