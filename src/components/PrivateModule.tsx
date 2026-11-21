import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useModuleAccess } from "../lib/access";
import type { ModuleKey } from "../lib/modules";

/** Obrazovka soukromého modulu: účet bez přístupu skončí v přehledu modulů (i když zná adresu). */
export function PrivateModule({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const { can, ready } = useModuleAccess();
  if (!ready) return null;
  return can(module) ? <>{children}</> : <Navigate to="/moduly" replace />;
}
