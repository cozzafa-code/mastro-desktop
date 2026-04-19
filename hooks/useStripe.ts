// hooks/useStripe.ts
// Hook per gestione piano Stripe lato frontend
// Usato da SettingsPanel, DesktopDashboard, moduli a pagamento

import { useState, useCallback } from "react";
import { useMastro } from "@/components/MastroContext";

export type Piano = "START" | "PRO" | "TITAN";

export interface PianoInfo {
  nome: Piano;
  prezzo: number;
  features: string[];
  limiti: { leads: number; agenti: number; cnc: number };
  stripe_price_id?: string;
}

export const PIANI_INFO: Record<Piano, PianoInfo> = {
  START: {
    nome: "START", prezzo: 29,
    features: ["commesse", "messaggi", "pdf", "mobile"],
    limiti: { leads: 0, agenti: 0, cnc: 0 },
  },
  PRO: {
    nome: "PRO", prezzo: 59,
    features: ["commesse", "messaggi", "pdf", "mobile", "leads", "ai", "enea", "report"],
    limiti: { leads: 20, agenti: 0, cnc: 1 },
  },
  TITAN: {
    nome: "TITAN", prezzo: 89,
    features: ["tutto"],
    limiti: { leads: 50, agenti: 10, cnc: 1 },
  },
};

export function useStripe() {
  const { aziendaInfo } = useMastro();
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const piano: Piano = ((aziendaInfo as any)?.piano as Piano) || "START";
  const pianoInfo   = PIANI_INFO[piano];
  const isTrialing  = (aziendaInfo as any)?.stripe_subscription_status === "trialing";
  const isAttivo    = (aziendaInfo as any)?.abbonamento_attivo ?? false;

  const haFeature = useCallback((feature: string): boolean => {
    if (piano === "TITAN") return true;
    return pianoInfo.features.includes(feature) || pianoInfo.features.includes("tutto");
  }, [piano, pianoInfo]);

  const isAboveLimit = useCallback((tipo: "leads" | "agenti" | "cnc", usato: number): boolean => {
    const limite = pianoInfo.limiti[tipo];
    return limite > 0 && usato >= limite;
  }, [pianoInfo]);

  const startCheckout = useCallback(async (targetPiano: string) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piano: targetPiano }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openBillingPortal = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    piano, pianoInfo, isTrialing, isAttivo,
    haFeature, isAboveLimit,
    startCheckout, openBillingPortal,
    loading, error,
    isStart: piano === "START",
    isPro:   piano === "PRO",
    isTitan: piano === "TITAN",
  };
}

// Componente gate: mostra upgrade se feature non disponibile
export function FeatureGate({ feature, children, fallback }: {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactElement {
  const { haFeature } = useStripe();
  if (haFeature(feature)) return children as React.ReactElement;
  return (fallback || null) as React.ReactElement;
}
