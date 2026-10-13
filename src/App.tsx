import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./lib/auth";
import { useClearBadge } from "./lib/push";
import { useSplash } from "./lib/splash";
import { isDemo } from "./lib/supabase";
import { Login } from "./screens/Login";
import { screenRoutes } from "./routes";
import { SaveErrors } from "./lib/saveErrors";
import { ConfirmHost } from "./components/Confirm";

export function App() {
  const { session, loading } = useAuth();
  useSplash(!loading);
  useClearBadge();

  if (loading) return <div className="splash" aria-label="Načítám" />;
  if (!isDemo && !session) return <Login />;

  return (
    <HashRouter>
      <SaveErrors />
      <ConfirmHost />
      <Routes>
        <Route element={<Layout />}>
          {screenRoutes}
        </Route>
      </Routes>
    </HashRouter>
  );
}
