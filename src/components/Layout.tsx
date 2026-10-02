import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { SpriteName } from "../lib/sprites";
import { QuickAddSheet } from "./QuickAddSheet";
import { Sprite } from "./Sprite";

const tabs: ({ to: string; label: string; icon: SpriteName; end?: boolean } | null)[] = [
  { to: "/", label: "Dnes", icon: "i-home", end: true },
  { to: "/moduly", label: "Moduly", icon: "i-grid" },
  null,
  { to: "/mapa", label: "Mapa", icon: "i-map" },
  { to: "/profil", label: "Profil", icon: "i-user" },
];

export function Layout() {
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <div className="app">
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Hlavní navigace">
        {tabs.map((tab) =>
          tab ? (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `tab${isActive ? " on" : ""}`}>
              <span className="tab-ico"><Sprite name={tab.icon} size={22} /></span>
              {tab.label}
            </NavLink>
          ) : (
            <button key="add" className="tab-add tap" aria-label="Rychle přidat" onClick={() => setQuickOpen(true)}>
              <Sprite name="i-plus" size={26} />
            </button>
          ),
        )}
      </nav>
      {quickOpen && <QuickAddSheet onClose={() => setQuickOpen(false)} />}
    </div>
  );
}
