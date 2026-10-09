import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles/fonts.css";
import "./styles/app.css";
import { App } from "./App";
import { AuthProvider } from "./lib/auth";

// chová se jako appka: žádné přibližování dvěma prsty (iOS ignoruje user-scalable=no, proto i gesta)
const stopZoom = (e: Event) => e.preventDefault();
document.addEventListener("gesturestart", stopZoom, { passive: false });
document.addEventListener("gesturechange", stopZoom, { passive: false });
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
