// components/ValidatoreAlert.tsx
// MASTRO AI — Componente UI per mostrare alert validazione vano
// Usa useValidatoreVano hook

"use client";
import React, { useState } from "react";
import { useValidatoreVano, DatiVano, AlertValidazione, Severita } from "../hooks/useValidatoreVano";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ValidatoreAlertProps {
  datiVano: DatiVano | null;
  compact?: boolean;  // true = solo icona badge, false = lista completa
  onBloccanteChange?: (hasBlocchi: boolean) => void;
}

// ─── Colori per severità ─────────────────────────────────────────────────────

const COLORI: Record<Severita, { bg: string; border: string; text: string; icon: string; label: string }> = {
  BLOCCANTE: { bg: "#FEE2E2", border: "#DC4444", text: "#991B1B", icon: "⛔", label: "Errore" },
  ALERT:     { bg: "#FEF3C7", border: "#D08008", text: "#92400E", icon: "⚠️", label: "Attenzione" },
  INFO:      { bg: "#DBEAFE", border: "#3B7FE0", text: "#1E40AF", icon: "ℹ️", label: "Info" },
};

// ─── Componente singolo alert ─────────────────────────────────────────────────

function AlertItem({ alert }: { alert: AlertValidazione }) {
  const [aperto, setAperto] = useState(false);
  const c = COLORI[alert.severita];

  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}40`,
      borderRadius: 8,
      padding: "8px 10px",
      marginBottom: 6,
      cursor: alert.suggerimento ? "pointer" : "default",
    }} onClick={() => alert.suggerimento && setAperto(p => !p)}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>{c.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, lineHeight: 1.3 }}>
            {alert.messaggio}
          </div>
          {aperto && alert.suggerimento && (
            <div style={{ fontSize: 11, color: c.text, marginTop: 4, opacity: 0.85, lineHeight: 1.4 }}>
              {alert.suggerimento}
            </div>
          )}
        </div>
        {alert.suggerimento && (
          <span style={{ fontSize: 10, color: c.text, opacity: 0.6, flexShrink: 0, marginTop: 2 }}>
            {aperto ? "▲" : "▼"}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Badge compatto ───────────────────────────────────────────────────────────

function BadgeCompatto({ bloccanti, alerts, info }: { bloccanti: number; alerts: number; info: number }) {
  if (bloccanti === 0 && alerts === 0 && info === 0) return null;
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {bloccanti > 0 && (
        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#FEE2E2", color: "#DC4444", border: "1px solid #DC444440" }}>
          ⛔ {bloccanti}
        </span>
      )}
      {alerts > 0 && (
        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#FEF3C7", color: "#D08008", border: "1px solid #D0800840" }}>
          ⚠️ {alerts}
        </span>
      )}
      {info > 0 && (
        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#DBEAFE", color: "#3B7FE0", border: "1px solid #3B7FE040" }}>
          ℹ️ {info}
        </span>
      )}
    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function ValidatoreAlert({ datiVano, compact = false, onBloccanteChange }: ValidatoreAlertProps) {
  const { alerts, bloccanti, alertList, infoList, hasBlocchi, loading } = useValidatoreVano(datiVano);

  // Notifica parent se cambiano i bloccanti
  React.useEffect(() => {
    onBloccanteChange?.(hasBlocchi);
  }, [hasBlocchi, onBloccanteChange]);

  if (loading) {
    return compact ? (
      <span style={{ fontSize: 10, color: "#6B7280" }}>⟳ validazione...</span>
    ) : (
      <div style={{ fontSize: 11, color: "#6B7280", padding: "6px 0" }}>⟳ Validazione in corso...</div>
    );
  }

  if (alerts.length === 0) {
    return compact ? null : (
      <div style={{ fontSize: 11, color: "#1A9E73", padding: "6px 8px", background: "#D1FAE5", borderRadius: 8, border: "1px solid #1A9E7330" }}>
        ✓ Nessun problema rilevato
      </div>
    );
  }

  // Modalità compatta: solo badge
  if (compact) {
    return <BadgeCompatto bloccanti={bloccanti.length} alerts={alertList.length} info={infoList.length} />;
  }

  // Modalità completa: lista alert
  return (
    <div style={{ marginTop: 8 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1A1C", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Validazione AI
        </div>
        <BadgeCompatto bloccanti={bloccanti.length} alerts={alertList.length} info={infoList.length} />
      </div>

      {/* Bloccanti */}
      {bloccanti.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#DC4444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Errori bloccanti ({bloccanti.length})
          </div>
          {bloccanti.map((a, i) => <AlertItem key={i} alert={a} />)}
        </div>
      )}

      {/* Alert */}
      {alertList.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#D08008", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Attenzione ({alertList.length})
          </div>
          {alertList.map((a, i) => <AlertItem key={i} alert={a} />)}
        </div>
      )}

      {/* Info */}
      {infoList.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B7FE0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Suggerimenti ({infoList.length})
          </div>
          {infoList.map((a, i) => <AlertItem key={i} alert={a} />)}
        </div>
      )}
    </div>
  );
}
