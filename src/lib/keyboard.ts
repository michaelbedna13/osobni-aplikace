import { useEffect } from "react";

/**
 * Klávesnice v iPhonu: když se píše, schová se plovoucí lišta (třída kb-open na <html>)
 * a okna a spodní panely se drží ve viditelné části obrazovky nad klávesnicí (--vv-top, --vv-h).
 */
export function useKeyboardAware() {
  useEffect(() => {
    const root = document.documentElement;
    const isField = (el: Element | null) =>
      !!el && (el.tagName === "TEXTAREA" || el.tagName === "SELECT" ||
        (el.tagName === "INPUT" && !["checkbox", "radio", "button", "submit", "file", "range"].includes((el as HTMLInputElement).type)));
    const onIn = (e: FocusEvent) => isField(e.target as Element) && root.classList.add("kb-open");
    const onOut = () => window.setTimeout(() => !isField(document.activeElement) && root.classList.remove("kb-open"), 50);

    const vv = window.visualViewport;
    const sync = () => {
      if (!vv) return;
      root.style.setProperty("--vv-top", `${vv.offsetTop}px`);
      root.style.setProperty("--vv-h", `${vv.height}px`);
    };
    sync();
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
    };
  }, []);
}
