import { NavLink, Outlet } from "react-router-dom";
import type { SpriteName } from "../lib/sprites";
import { Sprite } from "./Sprite";

const tabs: { to: string; label: string; icon: SpriteName; end?: boolean }[] = [
  { to: "/", label: "Dnes", icon: "i-home", end: true },
  { to: "/moduly", label: "Moduly", icon: "i-grid" },
  { to: "/profil", label: "Profil", icon: "i-user" },
];

export function Layout() {
  return (
    <div className="app">
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Hlavní navigace">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `tab${isActive ? " on" : ""}`}>
            <Sprite name={tab.icon} size={20} />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
