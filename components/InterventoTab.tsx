"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — InterventoTab v1
// Widget per CMDetailPanel: mostra storico interventi
// della commessa con timeline, stato e problemi
// ═══════════════════════════════════════════════════════════
import React from "react";
import { FM, ICO, Ico } from "./mastro-constants";

const FASI_LABEL = {
  programmato:{ icon:"📋", color:"#3B7FE0", label:"Programmato" },
  in_viaggio: { icon:"🚐", color:"#8B5CF6", label:"In viaggio" },
  arrivato:   { icon:"📍", color:"#D08008", label:"Arrivato" },
  in_corso:   { icon:"🔧", color:"#E8A020", label:"In corso" },
  completato: { icon:"✅", color:"#1A9E73", label:"Completato" },
  collaudo:   { icon:"🔍", color:"#0D7C6B", label:"Collaudo" },
  chiuso:     { icon:"🤝", color:"#1A9E73", label:"Chiuso" },
};

export default function InterventoTab({ montaggiDB, cmId, squadreDB, T, onOpenIntervento }) {
  const interventi = (montaggiDB || []).filter(m => String(m.cmId) === String(cmId));

  if (interventi.length === 0) {
    return (
      <div style={{ padding:"24px", textAlign:"center" }}>
        <div style={{ fontSize:28, marginBottom:8 }}>🔧</div>
        <div style={{ fontSize:12, fontWeight:600, color:T.sub }}>Nessun intervento programmato</div>
        <div style={{ fontSize:10, color:T.sub, marginTop:4 }}>Programma un montaggio dal Calendario Cantieri</div>
      </div>
    );
  }

  return (
    <div style={{ padding:"0 0 16px" }}>
      {interventi.map((m, idx) => {
        const fase = FASI_LABEL[m.interventoStato || m.stato] || FASI_LABEL.programmato;
        const sq = squadreDB?.find(s => s.id === m.squadraId);
        const hasFirma = !!m.firmaCliente;
        const problemiCount = (m.problemi || []).length;
        const problemiAperti = (m.problemi || []).filter(p => p.stato === "aperto").length;
        const checkDone = (m.checkComp || []).filter(c => c.checked).length;
        const checkTotal = (m.checkComp || []).length;
        const fotoCount = (m.fotoIntervento || []).length;
        const timeline = m.timeline || {};

        // Calcola durata effettiva se ci sono dati timeline
        let durataEffettiva = "";
        if (timeline.arrivato && (timeline.completato || timeline.chiuso)) {
          const start = new Date(timeline.arrivato);
          const end = new Date(timeline.chiuso || timeline.completato);
          const diffH = Math.round((end - start) / (1000 * 60 * 60) * 10) / 10;
          durataEffettiva = diffH > 0 ? diffH + "h" : "";
        }

        return (
          <div key={m.id} onClick={() => onOpenIntervento?.(m)} style={{
            margin:"0 0 8px", padding:"14px 16px", borderRadius:12,
            background:T.card, border:"1px solid "+T.bdr,
            cursor:"pointer", transition:"box-shadow 0.2s",
          }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:18 }}>{fase.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:T.text }}>Montaggio #{idx + 1}</div>
                  <div style={{ fontSize:10, color:T.sub }}>{(m.data ? new Date(m.data+'T12:00:00').toLocaleDateString('it-IT') : m.data)} · {m.orario || "—"} · {m.durata || m.giorni + "g"}</div>
                </div>
              </div>
              <div style={{ padding:"4px 10px", borderRadius:8, background:fase.color+"15", border:"1px solid "+fase.color+"30", fontSize:10, fontWeight:800, color:fase.color }}>
                {fase.label}
              </div>
            </div>

            {/* Squadra + info */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
              {sq && (
                <div style={{ padding:"3px 8px", borderRadius:6, background:(sq.colore||T.acc)+"10", fontSize:9, fontWeight:700, color:sq.colore||T.acc, border:"1px solid "+(sq.colore||T.acc)+"25" }}>
                  {sq.nome}
                </div>
              )}
              {durataEffettiva && (
                <div style={{ padding:"3px 8px", borderRadius:6, background:"#3B7FE010", fontSize:9, fontWeight:700, color:"#3B7FE0" }}>
                  Effettivo: {durataEffettiva}
                </div>
              )}
              {fotoCount > 0 && (
                <div style={{ padding:"3px 8px", borderRadius:6, background:T.bg, fontSize:9, fontWeight:600, color:T.sub }}>
                  📷 {fotoCount} foto
                </div>
              )}
              {checkTotal > 0 && (
                <div style={{ padding:"3px 8px", borderRadius:6, background:checkDone === checkTotal ? "#1A9E7310" : T.bg, fontSize:9, fontWeight:600, color:checkDone === checkTotal ? "#1A9E73" : T.sub }}>
                  ✓ {checkDone}/{checkTotal}
                </div>
              )}
              {hasFirma && (
                <div style={{ padding:"3px 8px", borderRadius:6, background:"#1A9E7310", fontSize:9, fontWeight:700, color:"#1A9E73" }}>
                  ✍ Firmato
                </div>
              )}
            </div>

            {/* Problemi */}
            {problemiCount > 0 && (
              <div style={{ padding:"6px 10px", borderRadius:8, background:problemiAperti > 0 ? "#DC444408" : "#1A9E7308", borderLeft:"3px solid "+(problemiAperti > 0 ? "#DC4444" : "#1A9E73"), fontSize:10 }}>
                <span style={{ fontWeight:700, color:problemiAperti > 0 ? "#DC4444" : "#1A9E73" }}>
                  {problemiAperti > 0 ? `${problemiAperti} problema${problemiAperti>1?"i":""} apert${problemiAperti>1?"i":"o"}` : `${problemiCount} problema${problemiCount>1?"i":""} risolto${problemiCount>1?"i":""}`}
                </span>
              </div>
            )}

            {/* Mini timeline */}
            <div style={{ display:"flex", gap:2, marginTop:8 }}>
              {["programmato","in_viaggio","arrivato","in_corso","completato","collaudo","chiuso"].map((fId, i) => {
                const fInfo = FASI_LABEL[fId];
                const curIdx = ["programmato","in_viaggio","arrivato","in_corso","completato","collaudo","chiuso"].indexOf(m.interventoStato || m.stato);
                return (
                  <div key={fId} style={{ flex:1, height:3, borderRadius:2, background:i <= curIdx ? fInfo.color : T.bdr + "30" }} />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
