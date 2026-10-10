import { memo, useId } from "react";
import { ICONS, type IconName } from "../lib/icons";
import { MODULE_BY_KEY, isModuleKey, type ModuleKey } from "../lib/modules";

interface Props {
  name: IconName;
  /** Velikost v px. */
  size?: number;
  /** Obarví ikonu barvou modulu (jinak má barvu textu). */
  tone?: ModuleKey;
  anim?: "bob" | "jump" | "breathe" | "spin";
  className?: string;
  label?: string;
}

/** Ikona jako vystřižená z papíru: plocha v barvě textu, výstřižky jsou průhledné a prosvítá jimi podklad.
 *  Barevné kousky navrch („a“, třeba pytlík na desce Cornhole) mají světlý odstín svého modulu. */
export const Icon = memo(function Icon({ name, size = 48, tone, anim, className, label }: Props) {
  // useId vrací dvojtečky, které v url(#…) nefungují všude
  const id = `ic${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const layers = ICONS[name];
  const accent = isModuleKey(name) ? MODULE_BY_KEY[name].light : "currentColor";
  return (
    <svg
      className={["icon", anim && `anim-${anim}`, className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={tone ? { color: MODULE_BY_KEY[tone].color } : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <mask id={id} maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
        {layers.map(([kind, d], i) => (kind === "i" || kind === "c") && <path key={i} d={d} fill={kind === "i" ? "#FFFFFF" : "#000000"} />)}
      </mask>
      <rect x="-10" y="-10" width="120" height="120" fill="currentColor" mask={`url(#${id})`} />
      {layers.map(([kind, d], i) => (kind === "a" || kind === "k") && <path key={i} d={d} fill={kind === "a" ? accent : "currentColor"} />)}
    </svg>
  );
});
