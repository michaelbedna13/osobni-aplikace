// Pixelové figurky 12 × 12: # obrys, x výplň, . průhledné.
import type { Color, PieceSymbol } from "chess.js";
import type { ReactElement } from "react";

const PIECES: Record<PieceSymbol, string[]> = {
  p: [
    "............",
    "............",
    "............",
    ".....##.....",
    "....#xx#....",
    "....#xx#....",
    ".....##.....",
    "....#xx#....",
    "...#xxxx#...",
    "..#xxxxxx#..",
    "..########..",
    "............",
  ],
  r: [
    "............",
    "..##.##.##..",
    "..#xxxxxx#..",
    "...#xxxx#...",
    "...#xxxx#...",
    "...#xxxx#...",
    "...#xxxx#...",
    "...#xxxx#...",
    "..#xxxxxx#..",
    "..#xxxxxx#..",
    "..########..",
    "............",
  ],
  n: [
    "............",
    "....##......",
    "...#xx##....",
    "..#xxxxx#...",
    ".#xx#xxxx#..",
    ".#xxxxxxx#..",
    "..##.#xxx#..",
    ".....#xxx#..",
    "....#xxxx#..",
    "...#xxxxxx#.",
    "...########.",
    "............",
  ],
  b: [
    ".....##.....",
    "....#xx#....",
    "...#xx#x#...",
    "...#x#xx#...",
    "...#xxxx#...",
    "....#xx#....",
    "...######...",
    "....#xx#....",
    "...#xxxx#...",
    "..#xxxxxx#..",
    "..########..",
    "............",
  ],
  q: [
    "............",
    "#....##....#",
    "##..#xx#..##",
    "#x##xxxx##x#",
    "#xxxxxxxxxx#",
    ".#xxxxxxxx#.",
    "..#xxxxxx#..",
    "...#xxxx#...",
    "...#xxxx#...",
    "..#xxxxxx#..",
    ".##########.",
    "............",
  ],
  k: [
    ".....##.....",
    "....####....",
    ".....##.....",
    "...##xx##...",
    "..#xxxxxx#..",
    "..#xxxxxx#..",
    "...#xxxx#...",
    "...#xxxx#...",
    "..#xxxxxx#..",
    "..#xxxxxx#..",
    ".##########.",
    "............",
  ],
};

export const PIECE_COLORS: Record<Color, { fill: string; line: string }> = {
  w: { fill: "#FEFAE0", line: "#000502" },
  b: { fill: "#1B2A22", line: "#000502" },
};

export function Piece({ type, color, size = 40 }: { type: PieceSymbol; color: Color; size?: number }) {
  const { fill, line } = PIECE_COLORS[color];
  const rects: ReactElement[] = [];
  PIECES[type].forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={ch === "#" ? line : fill} />);
    }),
  );
  return (
    <svg className="piece" viewBox="0 0 12 12" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {rects}
    </svg>
  );
}

export const PIECE_NAMES: Record<PieceSymbol, string> = { p: "pěšec", n: "jezdec", b: "střelec", r: "věž", q: "dáma", k: "král" };
