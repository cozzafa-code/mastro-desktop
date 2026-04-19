// ============================================================
// VanoSectorRouter.tsx — MASTRO ERP v2 Multi-Settore
// ============================================================
// Legge selectedVano, updateVanoField, goBack, userId, selectedCM
// dal MastroContext. Non servono props.
//
// In MastroERP.tsx resta così com'è:
//   const renderVanoDetail = () => <VanoSectorRouter />;
// ============================================================

import React, { useContext, useCallback } from "react";
import { MastroContext } from "./MastroContext";

// --- IMPORT TUTTI I PANEL SETTORE ---
import VanoDetailPanel from "./VanoDetailPanel";
import PorteDetailPanel from "./PorteDetailPanel";
import BoxDocciaDetailPanel from "./BoxDocciaDetailPanel";
import CancelliDetailPanel from "./CancelliDetailPanel";
import PersianeDetailPanel from "./PersianeDetailPanel";
import TapparelleDetailPanel from "./TapparelleDetailPanel";
import TendeSoleDetailPanel from "./TendeSoleDetailPanel";
import ZanzariereDetailPanel from "./ZanzariereDetailPanel";

// --- MAPPA SETTORI → COMPONENTI ---
const SECTOR_PANELS: Record<string, React.FC<any>> = {
  serramenti:  VanoDetailPanel,
  porte:       PorteDetailPanel,
  boxdoccia:   BoxDocciaDetailPanel,
  cancelli:    CancelliDetailPanel,
  persiane:    PersianeDetailPanel,
  tapparelle:  TapparelleDetailPanel,
  tendesole:   TendeSoleDetailPanel,
  zanzariere:  ZanzariereDetailPanel,
};

// --- COMPONENTE ROUTER ---
export default function VanoSectorRouter() {
  const ctx = useContext(MastroContext);
  const { selectedVano, selectedCM, updateVanoField, goBack, userId } = ctx as any;

  const vano = selectedVano;
  if (!vano) return null;

  const settore = vano.settore || "serramenti";
  const PanelComponent = SECTOR_PANELS[settore] || VanoDetailPanel;

  // Wrapper: updateVanoField(vanoId, field, value) → onUpdate(field, value)
  const onUpdate = useCallback((field: string, value: any) => {
    updateVanoField(vano.id, field, value);
  }, [vano?.id, updateVanoField]);

  const onBack = useCallback(() => {
    goBack();
  }, [goBack]);

  return (
    <PanelComponent
      vano={vano}
      onUpdate={onUpdate}
      onBack={onBack}
      aziendaId={userId || ""}
      cmId={selectedCM?.id ? String(selectedCM.id) : ""}
    />
  );
}
