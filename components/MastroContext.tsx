// ═══════════════════════════════════════════════════════════
// MASTRO ERP — Context Provider
// Condivide stato, setter e helper tra tutti i componenti estratti
// ═══════════════════════════════════════════════════════════
import { createContext, useContext } from "react";

// Il tipo è `any` per semplicità — con 218 useState tipare tutto
// sarebbe 500+ righe di TypeScript. Lo miglioriamo dopo.
export const MastroContext = createContext<any>(null);

export const useMastro = () => {
  const ctx = useContext(MastroContext);
  if (!ctx) throw new Error("useMastro must be used within MastroContext.Provider");
  return ctx;
};
