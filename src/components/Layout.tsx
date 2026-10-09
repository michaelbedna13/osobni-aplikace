import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useKeyboardAware } from "../lib/keyboard";
import { MODULE_BY_KEY, isModuleKey } from "../lib/modules";
import type { IconName } from "../lib/icons";
import { Icon } from "./Icon";

const tabs: { to: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
  { to: "/", label: "Dnes", icon: "i-home", match: (p) => p === "/" },
  // obrazovky modulů patří pod Moduly
  { to: "/moduly", label: "Moduly", icon: "i-grid", match: (p) => p.startsWith("/moduly") || p.startsWith("/m/") },
  { to: "/profil", label: "Profil", icon: "i-user", match: (p) => p.startsWith("/profil") },
];

/** Barva lišty s hodinami: v appce z plochy ji iPhone kreslí plnou barvou theme-color, tak ji ladíme
 *  s horním okrajem pozadí obrazovky (barva modulu, jinak šalvěj). */
const SAGE = "#A9C29A";
function useStatusBarColor(pathname: string) {
  useEffect(() => {
    const key = pathname.match(/^\/m\/([a-z]+)/)?.[1];
    const color = isModuleKey(key) ? MODULE_BY_KEY[key].color : SAGE;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  }, [pathname]);
}

// jako v nativní appce: prohlížeč si pozici posunu nepamatuje, každá obrazovka začíná nahoře
if (typeof history !== "undefined" && "scrollRestoration" in history) history.scrollRestoration = "manual";

export function Layout() {
  const { pathname } = useLocation();
  useKeyboardAware();
  useStatusBarColor(pathname);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="app">
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Hlavní navigace">
        <div className="tabbar-glass">
          {tabs.map((tab) => {
            const on = tab.match(pathname);
            return (
              <NavLink key={tab.to} to={tab.to} className={`tab${on ? " on" : ""}`} aria-label={tab.label} aria-current={on ? "page" : undefined}
                // ťuknutí na lištu vždy nahoru, i když už na té obrazovce jsi
                onClick={() => window.scrollTo({ top: 0, behavior: pathname === tab.to ? "smooth" : "auto" })}>
                <Icon name={tab.icon} size={24} />
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
