import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { CSSProperties } from "react";
import { backgroundOf } from "../lib/backgrounds";
import { useKeyboardAware } from "../lib/keyboard";
import type { IconName } from "../lib/icons";
import { Icon } from "./Icon";

const tabs: { to: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
  { to: "/", label: "Dnes", icon: "i-home", match: (p) => p === "/" },
  // obrazovky modulů patří pod Moduly
  { to: "/moduly", label: "Moduly", icon: "i-grid", match: (p) => p.startsWith("/moduly") || p.startsWith("/m/") },
  { to: "/profil", label: "Profil", icon: "i-user", match: (p) => p.startsWith("/profil") },
];

/** Které pozadí patří pod obrazovku: Dnes, modul podle adresy, jinak základní. */
const textureOf = (path: string) => (path === "/" ? "dnes" : path.match(/^\/m\/([a-z]+)/)?.[1] ?? "zaklad");

export function Layout() {
  const { pathname } = useLocation();
  useKeyboardAware();
  const tex = textureOf(pathname);
  return (
    <div className="app">
      <main className="app-main" data-tex={tex} style={{ "--bg": backgroundOf(tex) } as CSSProperties}>
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Hlavní navigace">
        <div className="tabbar-glass">
          {tabs.map((tab) => {
            const on = tab.match(pathname);
            return (
              <NavLink key={tab.to} to={tab.to} className={`tab${on ? " on" : ""}`} aria-label={tab.label} aria-current={on ? "page" : undefined}>
                <Icon name={tab.icon} size={24} />
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
