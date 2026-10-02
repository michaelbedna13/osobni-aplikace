import { memo } from "react";
import { MODULE_BY_KEY, isModuleKey, type ModuleKey } from "../lib/modules";
import { spriteRects, spriteSize, type SpriteName } from "../lib/sprites";

interface Props {
  name: SpriteName;
  /** Velikost v px (šířka). Ideálně násobek 16 kvůli ostrým pixelům. */
  size?: number;
  /** Barvy podle modulu; výchozí je modul se stejným jménem, jinak zlatá. */
  tone?: ModuleKey;
  anim?: "bob" | "jump" | "breathe" | "spin";
  className?: string;
  label?: string;
}

const GOLD = { M: "#FEE761", D: "#F77622", L: "#FFFFFF" };

/** Pixelová postavička nebo ikona. */
export const Sprite = memo(function Sprite({ name, size = 48, tone, anim, className, label }: Props) {
  const key = tone ?? (isModuleKey(name) ? name : undefined);
  const m = key ? MODULE_BY_KEY[key] : null;
  const colors = m ? { M: m.color, D: m.deep, L: m.light } : GOLD;
  const { w, h } = spriteSize(name);
  return (
    <svg
      className={["sprite", anim && `anim-${anim}`, className].filter(Boolean).join(" ")}
      width={size}
      height={(size * h) / w}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {spriteRects(name, colors).map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
});
