import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./lib/auth";
import { isDemo } from "./lib/supabase";
import { Login } from "./screens/Login";
import { ModuleScreen } from "./screens/ModuleScreen";
import { PivaScreen } from "./modules/piva/PivaScreen";
import { HlaskomatScreen } from "./modules/hlaskomat/HlaskomatScreen";
import { MeditaceScreen } from "./modules/meditace/MeditaceScreen";
import { VdecnostScreen } from "./modules/vdecnost/VdecnostScreen";
import { LideScreen } from "./modules/lide/LideScreen";
import { PersonScreen } from "./modules/lide/PersonScreen";
import { TreninkScreen } from "./modules/trenink/TreninkScreen";
import { WorkoutScreen } from "./modules/trenink/WorkoutScreen";
import { TemplateEditor } from "./modules/trenink/TemplateEditor";
import { CornholeScreen } from "./modules/cornhole/CornholeScreen";
import { GameScreen } from "./modules/cornhole/GameScreen";
import { MobileGameScreen } from "./modules/cornhole/MobileGame";
import { PlayScreen } from "./modules/skore/PlayScreen";
import { SkoreScreen } from "./modules/skore/SkoreScreen";
import { OdkazyScreen } from "./modules/odkazy/OdkazyScreen";
import { FilmyScreen } from "./modules/filmy/FilmyScreen";
import { WishlistScreen } from "./modules/wishlist/WishlistScreen";
import { MistaScreen } from "./modules/mista/MistaScreen";
import { FinanceScreen } from "./modules/finance/FinanceScreen";
import { DechScreen } from "./modules/dech/DechScreen";
import { UntroisScreen } from "./modules/untrois/UntroisScreen";
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
          <Route path="m/meditace" element={<MeditaceScreen />} />
          <Route path="m/vdecnost" element={<VdecnostScreen />} />
          <Route path="m/lide" element={<LideScreen />} />
          <Route path="m/lide/:id" element={<PersonScreen />} />
          <Route path="m/trenink" element={<TreninkScreen />} />
          <Route path="m/trenink/trenink" element={<WorkoutScreen />} />
          <Route path="m/trenink/sablona/:id" element={<TemplateEditor />} />
          <Route path="m/cornhole" element={<CornholeScreen />} />
          <Route path="m/cornhole/hra" element={<GameScreen />} />
          <Route path="m/cornhole/mobil" element={<MobileGameScreen />} />
          <Route path="m/skore" element={<SkoreScreen />} />
          <Route path="m/skore/hra" element={<PlayScreen />} />
          <Route path="m/odkazy" element={<OdkazyScreen />} />
          <Route path="m/filmy" element={<FilmyScreen />} />
          <Route path="m/wishlist" element={<WishlistScreen />} />
          <Route path="m/mista" element={<MistaScreen />} />
          <Route path="m/finance" element={<FinanceScreen />} />
          <Route path="m/dech" element={<DechScreen />} />
          <Route path="m/untrois" element={<UntroisScreen />} />
          <Route path="m/denik" element={<Navigate to="/m/vdecnost" replace />} />
          <Route path="m/:key" element={<ModuleScreen />} />
          <Route path="mapa" element={<Navigate to="/m/mista" replace />} />
          <Route path="profil" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
