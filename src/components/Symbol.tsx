import { symbolSvg, type ModuleKey } from "../lib/modules";

interface Props {
  module: ModuleKey;
  size?: number;
  /** Barva hlavní plochy symbolu (výchozí je barva modulu). */
  bg?: string;
  className?: string;
}

/** Poznávací symbol modulu. SVG pochází z registru modulů, ne od uživatele. */
export function Symbol({ module, size = 40, bg, className }: Props) {
  return (
    <span
      className={["sym-wrap", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: symbolSvg(module, size, { bg }) }}
    />
  );
}
