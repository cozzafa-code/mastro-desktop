"use client";
// @ts-nocheck
// MASTRO — UpgradePrompt.tsx
// Banner/modal upgrade piano inline — usato nei moduli a pagamento

import { useState } from "react";
import { FF, FM } from "./mastro-constants";
import { useStripe, PIANI_INFO } from "../hooks/useStripe";

const TEAL="#1A9E73", DARK="#1A1A1C", AMBER="#E8A020", BLUE="#3B7FE0";

interface UpgradePromptProps {
  feature: string;
  titolo?: string;
  desc?: string;
  targetPiano?: "PRO" | "TITAN";
  compact?: boolean;
}

export default function UpgradePrompt({ feature, titolo, desc, targetPiano="PRO", compact=false }: UpgradePromptProps) {
  const { piano, startCheckout, loading } = useStripe();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const info = PIANI_INFO[targetPiano];
  const colore = targetPiano === "TITAN" ? DARK : TEAL;

  if (compact) return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, background:colore+"08", border:`1px solid ${colore}20`, fontFamily:FF }}>
      <span style={{ fontSize:12, color:colore, fontWeight:500, flex:1 }}>
        {titolo || `Funzione ${targetPiano}`} — richiede piano {targetPiano} (€{info.prezzo}/mese)
      </span>
      <button onClick={() => startCheckout(targetPiano.toLowerCase())} disabled={loading}
        style={{ padding:"5px 12px", borderRadius:6, background:colore, color:"#fff", border:"none", fontSize:11, fontWeight:500, cursor:loading?"not-allowed":"pointer", fontFamily:FF }}>
        {loading ? "..." : `Upgrade a ${targetPiano}`}
      </button>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column" as any, alignItems:"center", justifyContent:"center", height:"60vh", gap:16, padding:40, textAlign:"center" as any, fontFamily:FF }}>
      <div style={{ width:64, height:64, borderRadius:18, background:colore+"12", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colore} strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>
      <div style={{ fontSize:20, fontWeight:600, color:DARK }}>{titolo || `Funzione disponibile da piano ${targetPiano}`}</div>
      <div style={{ fontSize:14, color:"#6B7280", maxWidth:420, lineHeight:1.7 }}>
        {desc || `Questa funzione è disponibile dal piano ${targetPiano} a €${info.prezzo}/mese.`}
      </div>
      <div style={{ background:"#F8FAFC", borderRadius:12, padding:"16px 20px", border:"1px solid #E5E3DC", maxWidth:360, width:"100%", textAlign:"left" as any }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#6B7280", textTransform:"uppercase" as any, letterSpacing:0.5, marginBottom:10 }}>Piano {targetPiano} include</div>
        {info.features.filter(f=>f!=="tutto").slice(0,5).map((f,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:DARK, marginBottom:6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            {f}
          </div>
        ))}
        {targetPiano==="TITAN"&&<div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:DARK }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          Tutto di PRO + CNC + 50 leads + team illimitato
        </div>}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => setDismissed(true)}
          style={{ padding:"10px 18px", borderRadius:8, border:"1px solid #E5E3DC", background:"transparent", fontSize:13, color:"#6B7280", cursor:"pointer", fontFamily:FF }}>
          Forse dopo
        </button>
        <button onClick={() => startCheckout(targetPiano.toLowerCase())} disabled={loading}
          style={{ padding:"10px 24px", borderRadius:8, background:colore, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:FF }}>
          {loading ? "Caricamento..." : `Inizia 30 giorni gratis con ${targetPiano} →`}
        </button>
      </div>
      <div style={{ fontSize:11, color:"#9CA3AF" }}>Nessuna carta di credito · Cancella quando vuoi · Piano attuale: {piano}</div>
    </div>
  );
}
