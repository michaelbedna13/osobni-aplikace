// Figurky ve stylu vystřižených z papíru (tvary v src/lib/icons.ts): bílé krémové s tmavým okrajem, černé off-black se světlým.
import type { Color, PieceSymbol } from "chess.js";
import { PIECE_SHAPES } from "../../lib/icons";

export const PIECE_COLORS: Record<Color, { fill: string; line: string; edge: number }> = {
  w: { fill: "#FBFAF6", line: "#23211F", edge: 7 },
  b: { fill: "#23211F", line: "#FBFAF6", edge: 4 },
};

export function Piece({ type, color, size = 40 }: { type: PieceSymbol; color: Color; size?: number }) {
  const { fill, line, edge } = PIECE_COLORS[color];
  const layers = PIECE_SHAPES[type];
  const shapes = layers.filter(([k]) => k === "i");
  return (
    <svg className="piece" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* nejdřív obrys (tah kolem všech tvarů), pak výplň – vnitřní hrany mezi díly tak nejsou vidět */}
      {shapes.map(([, d], i) => <path key={`o${i}`} d={d} fill={line} stroke={line} strokeWidth={edge} strokeLinejoin="round" />)}
      {shapes.map(([, d], i) => <path key={`f${i}`} d={d} fill={fill} />)}
      {layers.filter(([k]) => k === "c").map(([, d], i) => <path key={`c${i}`} d={d} fill={line} />)}
    </svg>
  );
}

export const PIECE_NAMES: Record<PieceSymbol, string> = { p: "pěšec", n: "jezdec", b: "střelec", r: "věž", q: "dáma", k: "král" };
