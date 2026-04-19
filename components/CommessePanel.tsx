"use client";
// @ts-nocheck
// MASTRO ERP — CommessePanel v5 — Restyled "Sistema Operativo"
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";
import RilieviListPanel from "./RilieviListPanel";
import CMDetailPanel from "./CMDetailPanel";
import VanoSectorRouter from "./VanoSectorRouter";
import RiepilogoPanel from "./RiepilogoPanel";

// ─── THEME ─────────────────────────────────────────────────────────
const TH = {
  bg: "#0D1F1F",
  bgLight: "#F5F4F0",
  card: "#fff",
  teal: "#28A0A0",
  tealDark: "#1D7A7A",
  tealMuted: "#5A8A8A",
  ink: "#1A1A18",
  sub: "#B0B0A8",
  border: "#F0EFEC",
  red: "#E24B4A",
  amber: "#C4875A",
  green: "#0F6E56",
  greenLight: "#E1F5EE",
};

const AV_GRADS = [
  "linear-gradient(145deg, #2BAFAF, #1E8585)",
  "linear-gradient(145deg, #D09560, #A87545)",
  "linear-gradient(145deg, #1A3535, #0D1F1F)",
  "linear-gradient(145deg, #3572A5, #245A85)",
  "linear-gradient(145deg, #7B6BA5, #5A4D85)",
  "linear-gradient(145deg, #5E8C5A, #3D6B3A)",
];

const PIPELINE_FLIWOX: Record<string,string> = {
  sopralluogo:"#28A0A0", preventivo:"#1A7070", conferma:"#1060A0",
  ordini:"#806020", produzione:"#806020", posa:"#806020",
  collaudo:"#6B4FB0", chiusura:"#6B4FB0",
};

export default function CommessePanel() {
  const {
    T, isDesktop, isTablet, PIPELINE,
    cantieri, filtered, selectedCM, setSelectedCM, selectedRilievo, selectedVano,
    showRiepilogo, cmView, setCmView, filterFase, setFilterFase,
    searchQ, setSearchQ, setShowModal, setTab,
    getVaniAttivi, giorniFermaCM, sogliaDays, fattureDB,
  } = useMastro();

  const TODAY = new Date().toISOString().split("T")[0];
  const [sortBy, setSortBy] = React.useState("default");
  const fmtEuro = (n: number) => n > 0 ? "€" + n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) : "";
  const fmtData = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "";
  const initials = (c: any) => ((c.cliente || "?").charAt(0) + (c.cognome || "").charAt(0)).toUpperCase();

  const getFaseInfo = (c: any) => PIPELINE.find(p => p.id === c.fase) || { nome: c.fase, color: T.acc };
  const getProgress = (c: any) => {
    const idx = PIPELINE.findIndex(p => p.id === c.fase);
    return idx >= 0 ? Math.round((idx + 1) / PIPELINE.length * 100) : 0;
  };
  const isFerma = (c: any) => giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura";
  const isScaduta = (c: any) => c.scadenza && c.scadenza < TODAY;

  const getFaseColor = (fase: string, alert: boolean) =>
    alert ? TH.red : (PIPELINE_FLIWOX[fase] || TH.teal);

  const faseStyle = (fase: string, alert: boolean, ferma: boolean, scad: boolean, gg: number, nome: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      sopralluogo: { bg: TH.greenLight, color: TH.green },
      preventivo: { bg: TH.greenLight, color: TH.green },
      ordini: { bg: "#FFF4E6", color: "#854F0B" },
      montaggio: { bg: "#FFF4E6", color: "#854F0B" },
      posa: { bg: "#FFF4E6", color: "#854F0B" },
      fattura: { bg: TH.greenLight, color: "#085041" },
      chiusura: { bg: TH.greenLight, color: "#085041" },
    };
    if (alert) return { bg: "rgba(226,75,74,0.1)", color: TH.red, text: ferma ? `Ferma ${gg}gg` : "Scaduta" };
    const fc = colors[fase] || colors.sopralluogo;
    return { ...fc, text: nome };
  };

  // ── CARD VIEW ──
  const renderCard = (c: any, idx: number) => {
    const fase = getFaseInfo(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const vaniA = getVaniAttivi(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const fs = faseStyle(c.fase, alert, ferma, scad, giorniFermaCM(c), fase.nome);

    return (
      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
        style={{
          background: TH.card, borderRadius: 16, padding: "14px 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          cursor: "pointer", position: "relative",
          borderLeft: alert ? `4px solid ${TH.red}` : undefined,
        }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: AV_GRADS[idx % AV_GRADS.length],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff",
            boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
          }}>{initials(c)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: TH.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.cliente}{c.cognome ? " " + c.cognome : ""}
            </div>
            <div style={{ fontSize: 11, color: TH.sub, marginTop: 1 }}>
              {c.code}{c.indirizzo ? " · " + c.indirizzo : ""}
            </div>
          </div>
          <span style={{ background: fs.bg, color: fs.color, fontSize: 9, padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>{fs.text}</span>
        </div>

        {/* Pipeline dots */}
        <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
          {PIPELINE.filter(p => p.attiva).map(p => {
            const isActive = p.id === c.fase;
            const isDone = PIPELINE.findIndex(pp => pp.id === p.id) < PIPELINE.findIndex(pp => pp.id === c.fase);
            const dc = PIPELINE_FLIWOX[p.id] || TH.teal;
            return <div key={p.id} style={{ flex: 1, height: 3, borderRadius: 2, background: isActive ? dc : isDone ? dc : "#E8E8E4" }} />;
          })}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {vaniA.length > 0 && <span style={{ fontSize: 10, color: TH.sub, fontWeight: 600 }}>{vaniA.length} vani</span>}
            {c.scadenza && !scad && <span style={{ fontSize: 10, color: TH.sub }}>{fmtData(c.scadenza)}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {euroVal > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: TH.ink, fontFamily: FM }}>{fmtEuro(euroVal)}</span>}
            {(() => {
              const fatture = (fattureDB || []).filter((f: any) => f.cmId === c.id);
              if (fatture.length === 0) return null;
              const tuttePagate = fatture.every((f: any) => f.pagata);
              return (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: tuttePagate ? TH.greenLight : "#FFF4E6", color: tuttePagate ? TH.green : "#854F0B" }}>
                  {tuttePagate ? "Pagata" : "Fattura"}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Alert sotto */}
        {alert && (
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: TH.red }} />
            <span style={{ fontSize: 10, color: TH.red, fontWeight: 600 }}>
              {ferma ? `cliente fermo da ${giorniFermaCM(c)}gg` : "scadenza superata"}
            </span>
          </div>
        )}
      </div>
    );
  };

  // ── LIST VIEW ──
  const renderRow = (c: any, idx: number) => {
    const fase = getFaseInfo(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const vaniA = getVaniAttivi(c);
    const fs = faseStyle(c.fase, alert, ferma, scad, giorniFermaCM(c), fase.nome);

    return (
      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", borderBottom: `0.5px solid ${TH.border}`, background: TH.card }}>

        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: AV_GRADS[idx % AV_GRADS.length],
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "#fff",
          boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
        }}>{initials(c)}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: TH.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
              {c.cliente}{c.cognome ? " " + c.cognome : ""}
            </span>
            {alert && <div style={{ width: 6, height: 6, borderRadius: "50%", background: TH.red, flexShrink: 0 }} />}
          </div>
          <div style={{ fontSize: 11, color: TH.sub, marginBottom: 4 }}>{c.code}{c.indirizzo ? " · " + c.indirizzo : ""}</div>
          <div style={{ display: "flex", gap: 2 }}>
            {PIPELINE.filter(p => p.attiva).map(p => {
              const isActive = p.id === c.fase;
              const isDone = PIPELINE.findIndex(pp => pp.id === p.id) < PIPELINE.findIndex(pp => pp.id === c.fase);
              const dc = PIPELINE_FLIWOX[p.id] || TH.teal;
              return <div key={p.id} style={{ flex: 1, height: 3, borderRadius: 2, background: isActive ? dc : isDone ? dc : "#E8E8E4" }} />;
            })}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ background: fs.bg, color: fs.color, fontSize: 9, padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>{fs.text}</span>
          {euroVal > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: TH.ink, fontFamily: FM }}>{fmtEuro(euroVal)}</span>}
        </div>
      </div>
    );
  };

  // ── ROUTING ──
  if (showRiepilogo && selectedCM) return <RiepilogoPanel />;
  if (selectedVano) return <VanoSectorRouter />;
  if (selectedRilievo) return <CMDetailPanel />;
  if (selectedCM) return <RilieviListPanel />;

  const fermeCount = cantieri.filter(c => isFerma(c)).length;
  const totaleEuro = filtered.reduce((sum, c) => sum + (c.euro ? parseFloat(c.euro) : 0), 0);
  const filteredSorted = [...filtered].sort((a, b) => {
    if (sortBy === "nome") return (a.cliente || "").localeCompare(b.cliente || "");
    if (sortBy === "euro") return (parseFloat(b.euro) || 0) - (parseFloat(a.euro) || 0);
    if (sortBy === "data") return (b.aggiornato || b.creato || "").localeCompare(a.aggiornato || a.creato || "");
    return 0;
  });

  return (
    <div style={{ background: TH.bgLight, minHeight: "100%", paddingBottom: 80 }}>

      {/* Header scuro */}
      <div style={{ background: TH.bg, padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>Commesse</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
              <span style={{ fontSize: 12, color: TH.tealMuted }}>{cantieri.length} totali</span>
              {fermeCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#F7C1C1", background: "rgba(226,75,74,0.25)", padding: "2px 8px", borderRadius: 6 }}>
                  {fermeCount} ferme
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Toggle view */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 3, gap: 2 }}>
              <div onClick={() => setCmView("list")} style={{ width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: cmView === "list" ? "rgba(40,160,160,0.2)" : "transparent" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cmView === "list" ? TH.teal : TH.tealMuted} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </div>
              <div onClick={() => setCmView("card")} style={{ width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: cmView === "card" ? "rgba(40,160,160,0.2)" : "transparent" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cmView === "card" ? TH.teal : TH.tealMuted} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </div>
            </div>
            {/* Nuova commessa */}
            <div onClick={() => setShowModal("commessa")} style={{ width: 36, height: 36, borderRadius: 10, background: TH.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 2px 8px rgba(40,160,160,0.4)` }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "0.5px solid rgba(255,255,255,0.1)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TH.tealMuted} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, fontWeight: 500, color: "#fff", outline: "none", fontFamily: FF }} placeholder="Cerca cliente, codice..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            {searchQ && <div onClick={() => setSearchQ("")} style={{ cursor: "pointer", fontSize: 16, color: TH.tealMuted, lineHeight: 1 }}>×</div>}
          </div>
        </div>
      </div>

      {/* Chips fase + Sort */}
      <div style={{ padding: "12px 14px 10px", background: TH.bgLight }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 8, overflowX: "auto" }}>
          {[{ id: "tutte", nome: "Tutte", count: cantieri.length },
            ...PIPELINE.filter(p => p.attiva).map(p => ({ ...p, count: cantieri.filter(c => c.fase === p.id).length })).filter(p => p.count > 0)
          ].map(p => {
            const sel = filterFase === p.id;
            return (
              <div key={p.id} onClick={() => setFilterFase(sel && p.id !== "tutte" ? "tutte" : p.id)} style={{
                padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                background: sel ? TH.bg : TH.card,
                color: sel ? TH.teal : TH.sub,
                border: `0.5px solid ${sel ? TH.bg : TH.border}`,
              }}>{p.nome} · {p.count}</div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[["default","Recenti"],["nome","A-Z"],["euro","€"],["data","Data"]].map(([v,l]) => (
            <div key={v} onClick={() => setSortBy(v as any)} style={{
              padding: "5px 10px", borderRadius: 16, fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              background: sortBy === v ? TH.bg : "transparent",
              color: sortBy === v ? TH.teal : TH.sub,
            }}>{l}</div>
          ))}
          {totaleEuro > 0 && (
            <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: TH.ink, fontFamily: FM }}>
              {filtered.length} · €{totaleEuro.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(40,160,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TH.teal} strokeWidth="2" strokeLinecap="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TH.ink }}>Nessuna commessa</div>
          <div style={{ fontSize: 12, color: TH.sub, marginTop: 4 }}>Modifica i filtri o crea una nuova commessa</div>
          <div onClick={() => setShowModal("commessa")} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, background: TH.teal, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 2px 8px rgba(40,160,160,0.3)` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuova commessa
          </div>
        </div>
      ) : cmView === "list" ? (
        <div style={{ margin: "0 14px", borderRadius: 16, overflow: "hidden", background: TH.card, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {filteredSorted.map((c, i) => renderRow(c, i))}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : isTablet ? "1fr 1fr" : "1fr",
          gap: 10, padding: "0 14px"
        }}>
          {filteredSorted.map((c, i) => renderCard(c, i))}
        </div>
      )}
    </div>
  );
}
