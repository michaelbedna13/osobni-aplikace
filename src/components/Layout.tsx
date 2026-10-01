import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ModulesIcon, MapIcon, PlusIcon, ProfileIcon, TodayIcon } from "./Icons";
import { QuickAddSheet } from "./QuickAddSheet";

const tabs = [
  { to: "/", label: "Dnes", icon: <TodayIcon />, end: true },
  { to: "/moduly", label: "Moduly", icon: <ModulesIcon /> },
  null,
  { to: "/mapa", label: "Mapa", icon: <MapIcon /> },
  { to: "/profil", label: "Profil", icon: <ProfileIcon /> },
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
              {tab.icon}
              {tab.label}
            </NavLink>
          ) : (
            <button key="add" className="tab-add tap" aria-label="Rychle přidat" onClick={() => setQuickOpen(true)}>
              <PlusIcon />
            </button>
          ),
        )}
      </nav>
      {quickOpen && <QuickAddSheet onClose={() => setQuickOpen(false)} />}
    </div>
  );
}
