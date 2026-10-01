import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./lib/auth";
import { isDemo } from "./lib/supabase";
import { Login } from "./screens/Login";
import { ModuleScreen } from "./screens/ModuleScreen";
import { PivaScreen } from "./modules/piva/PivaScreen";
import { HlaskomatScreen } from "./modules/hlaskomat/HlaskomatScreen";
import { Modules } from "./screens/Modules";
import { Profile } from "./screens/Profile";
import { Today } from "./screens/Today";

export function App() {
  const { session, loading } = useAuth();

  if (loading) return <div className="splash" aria-label="Načítám" />;
  if (!isDemo && !session) return <Login />;

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Today />} />
          <Route path="moduly" element={<Modules />} />
          <Route path="m/piva" element={<PivaScreen />} />
          <Route path="m/hlaskomat" element={<HlaskomatScreen />} />
          <Route path="m/:key" element={<ModuleScreen />} />
          <Route path="mapa" element={<ModuleScreen moduleKey="mista" showBack={false} />} />
          <Route path="profil" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
