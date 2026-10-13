// Jemné cvaknutí (haptika). Safari na iPhonu neumí navigator.vibrate, ale od iOS 18
// cvakne při přepnutí <input type="checkbox" switch>. Proto skrytý přepínač, který se „ťukne“.
// Funguje jen během ťuknutí uživatele; jinde (Android) se použije vibrate.

let label: HTMLLabelElement | null = null;

function ensure(): HTMLLabelElement {
  if (label?.isConnected) return label;
  label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.cssText = "position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-10px;top:0";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  label.appendChild(input);
  document.body.appendChild(label);
  return label;
}

/** Krátké cvaknutí pro potvrzení akce (odškrtnutí, přičtení). */
export function haptic() {
  if (typeof document === "undefined") return;
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(10);
    return;
  }
  try {
    ensure().click();
  } catch {
    // bez haptiky se nic neděje
  }
}
