import type { ReactNode } from "react";
import { FormWindow } from "./Modal";

/**
 * Formulář v okně uprostřed obrazovky (dřív spodní panel). Okno se drží nad klávesnicí iPhonu,
 * zavírá se křížkem, stažením dolů, ťuknutím mimo okno nebo klávesou Escape.
 */
export function Sheet({ title, onClose, children, scrollList }: { title: string; onClose: () => void; children: ReactNode; scrollList?: boolean }) {
  return <FormWindow title={title} onClose={onClose} scrollList={scrollList}>{children}</FormWindow>;
}
