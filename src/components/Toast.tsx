import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ToastAction {
  label: string;
  run: () => void;
}

interface ToastState {
  message: string;
  actions: ToastAction[];
  key: number;
}

/** Krátké potvrzení dole na obrazovce, s akcemi typu „Zpět“. Zmizí po 5 s. */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((message: string, actions: ToastAction[] = []) => {
    window.clearTimeout(timer.current);
    setToast({ message, actions, key: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // do <body>, aby toast nebyl pod spodní lištou (obrazovka má vlastní vrstvení kvůli textuře)
  const element = toast && createPortal(
    <div className="toast" role="status" key={toast.key}>
      <span>{toast.message}</span>
      {toast.actions.map((a) => (
        <button key={a.label} className="toast-action" onClick={() => { setToast(null); a.run(); }}>{a.label}</button>
      ))}
    </div>,
    document.body,
  );

  return { show, element };
}
