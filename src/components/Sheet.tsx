import type { ReactNode } from "react";
import { FormWindow } from "./Modal";

/**
 * Formulář v okně uprostřed obrazovky (dřív spodní panel). Okno se drží nad klávesnicí iPhonu,
 * zavírá se křížkem, ťuknutím mimo okno nebo klávesou Escape.
 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <FormWindow title={title} onClose={onClose}>{children}</FormWindow>;
}
