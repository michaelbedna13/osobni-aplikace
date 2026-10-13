import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Potvrzení jako nabídka zespodu (action sheet z iOS) místo window.confirm,
// které v appce na ploše ukazuje adresu webu a vypadá jako cizí okno.

export interface ConfirmOption<T> {
  label: string;
  value: T;
  /** Nevratná akce (smazat, zahodit) – červeně. */
  destructive?: boolean;
}

interface Request {
  message: string;
  options: ConfirmOption<unknown>[];
  cancel: string;
  resolve: (value: unknown) => void;
}

let push: ((r: Request) => void) | null = null;

/** Nabídka s více volbami. Zrušení (i ťuknutí mimo nebo Escape) vrátí null. */
export function choose<T>(message: string, options: ConfirmOption<T>[], cancel = "Zrušit"): Promise<T | null> {
  return new Promise((resolve) => {
    if (!push) return resolve(null);
    push({ message, options: options as ConfirmOption<unknown>[], cancel, resolve: resolve as (v: unknown) => void });
  });
}

/** Ano/ne potvrzení nevratné akce, např. confirmAction("Smazat hlášku?", "Smazat"). */
export async function confirmAction(message: string, action = "Smazat", cancel = "Zrušit"): Promise<boolean> {
  return (await choose(message, [{ label: action, value: true, destructive: true }], cancel)) === true;
}

/** Vykreslí otevřené potvrzení. Patří jednou do App. */
export function ConfirmHost() {
  const [req, setReq] = useState<Request | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    push = (r) => setReq((prev) => {
      prev?.resolve(null);
      return r;
    });
    return () => { push = null; };
  }, []);

  useEffect(() => {
    if (!req) return;
    // fokus na nabídku, ne na „Smazat“ – Enter nesmí nic smazat omylem
    box.current?.focus({ preventScroll: true });
    // Escape zavře jen potvrzení, ne okno pod ním
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      done(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  const done = (value: unknown) => {
    req?.resolve(value);
    setReq(null);
  };

  if (!req) return null;
  return createPortal(
    <div className="confirm-backdrop" onClick={() => done(null)}>
      <div ref={box} tabIndex={-1} className="confirm" role="alertdialog" aria-modal="true" aria-label={req.message} onClick={(e) => e.stopPropagation()}>
        <div className="confirm-group">
          <p className="confirm-msg">{req.message}</p>
          {req.options.map((o) => (
            <button key={o.label} type="button" className={o.destructive ? "danger" : undefined} onClick={() => done(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
        <button type="button" className="confirm-cancel" onClick={() => done(null)}>{req.cancel}</button>
      </div>
    </div>,
    document.body,
  );
}
