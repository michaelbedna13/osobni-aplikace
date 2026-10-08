import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/jersey-10";
import "@fontsource-variable/space-grotesk";
// bitmapové písmo pro LED tabuli s hláškou dne (jen latinka a čeština)
import "@fontsource/tiny5/latin-400.css";
import "@fontsource/tiny5/latin-ext-400.css";
import "./styles/app.css";
import { App } from "./App";
import { AuthProvider } from "./lib/auth";
import { applyBackground } from "./lib/background";

applyBackground();

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
