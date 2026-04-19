"use client";
// @ts-nocheck
// MASTRO ERP — CommessePanel v4 — Design moderno
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";
import RilieviListPanel from "./RilieviListPanel";
import CMDetailPanel from "./CMDetailPanel";
import VanoSectorRouter from "./VanoSectorRouter";
import RiepilogoPanel from "./RiepilogoPanel";

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

  // ── fliwoX colori pipeline ──
  const PIPELINE_FLIWOX: Record<string,string> = {
    sopralluogo:"#28A0A0", preventivo:"#1A7070", conferma:"#1060A0",
    ordini:"#806020", produzione:"#806020", posa:"#806020",
    collaudo:"#6B4FB0", chiusura:"#6B4FB0",
  };
  const getFaseColor = (fase: string, alert: boolean) =>
    alert ? "#DC4444" : (PIPELINE_FLIWOX[fase] || "#28A0A0");

  // ── CARD VIEW ──
  const renderCard = (c: any) => {
    const fase = getFaseInfo(c);
    const prog = getProgress(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const vaniA = getVaniAttivi(c);
    const vaniOk = vaniA.filter(v => Object.values(v.misure || {}).filter((x: any) => x > 0).length >= 6).length;
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;

    return (
      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
        style={{
          background: "white", borderRadius: 18, padding: "14px 14px 13px",
          border: `1.5px solid ${alert ? T.red + "50" : "#C8E4E4"}`,
          borderLeft: `4px solid ${getFaseColor(c.fase, alert)}`,
          cursor: "pointer", position: "relative",
          boxShadow: `0 6px 0 0 ${alert ? "#FFAAAA" : "#A8CCCC"}`,
        }}>

        {/* Header: avatar + nome + codice */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: getFaseColor(c.fase, alert) + "20",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: getFaseColor(c.fase, alert),
            boxShadow: `0 3px 0 0 ${getFaseColor(c.fase, alert)}44`,
          }}>{initials(c)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#0D1F1F", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.cliente}{c.cognome ? " " + c.cognome : ""}
            </div>
            <div style={{ fontSize: 12, color: "#28A0A0", fontFamily: FM, fontWeight: 900, marginTop: 2, letterSpacing: "0.02em" }}>{c.code}</div>
          </div>
          {alert && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.red, flexShrink: 0, marginTop: 5 }} />}
        </div>

        {/* Indirizzo */}
        {c.indirizzo && (
          <div style={{ fontSize: 11, color: "#4A7070", fontWeight: 700, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {c.indirizzo}
          </div>
        )}

        {/* Pipeline dots */}
        <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
          {PIPELINE.filter(p => p.attiva).map(p => {
            const isActive = p.id === c.fase;
            const isDone = PIPELINE.findIndex(pp => pp.id === p.id) < PIPELINE.findIndex(pp => pp.id === c.fase);
            const dotColor = PIPELINE_FLIWOX[p.id] || "#28A0A0";
            return (
              <div key={p.id} style={{
                flex: 1, height: 5, borderRadius: 3,
                background: isActive ? dotColor : isDone ? dotColor + "60" : "#D0E8E8",
                boxShadow: isActive ? `0 2px 0 0 ${dotColor}88` : "none",
              }} />
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 900,
            background: getFaseColor(c.fase, alert) + "18",
            color: getFaseColor(c.fase, alert),
            boxShadow: `0 2px 0 0 ${getFaseColor(c.fase, alert)}44`,
          }}>
            {ferma ? `Ferma ${giorniFermaCM(c)}gg` : scad ? "Scaduta" : fase.nome}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {vaniA.length > 0 && <span style={{ fontSize: 10, color: "#4A7070", fontWeight: 700 }}>{vaniOk}/{vaniA.length} vani</span>}
            {euroVal > 0 && <span style={{ fontSize: 14, fontWeight: 900, color: "#0D1F1F", fontFamily: FM }}>{fmtEuro(euroVal)}</span>}
            {(() => {
              const fatture = (fattureDB || []).filter((f: any) => f.cmId === c.id);
              if (fatture.length === 0) return null;
              const tuttePagate = fatture.every((f: any) => f.pagata);
              return (
                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: tuttePagate ? "#1A9E7320" : "#D0800820", color: tuttePagate ? "#1A9E73" : "#D08008", flexShrink: 0 }}>
                  {tuttePagate ? "✓ Pagata" : "📋 Fattura"}
                </span>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // ── LIST VIEW ──
  const renderRow = (c: any) => {
    const fase = getFaseInfo(c);
    const prog = getProgress(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const vaniA = getVaniAttivi(c);

    return (
      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", cursor: "pointer", borderBottom: "1px solid #EEF8F8", background: "white", position: "relative" }}>

        {/* Avatar fliwoX */}
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: getFaseColor(c.fase, alert) + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 900, color: getFaseColor(c.fase, alert),
          boxShadow: `0 3px 0 0 ${getFaseColor(c.fase, alert)}40`,
        }}>{initials(c)}</div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#0D1F1F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
              {c.cliente}{c.cognome ? " " + c.cognome : ""}
            </span>
            <span style={{ fontSize: 11, color: "#28A0A0", fontFamily: FM, fontWeight: 900, flexShrink: 0 }}>{c.code}</span>
            {alert && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.red, flexShrink: 0 }} />}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{
              fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 20,
              background: getFaseColor(c.fase, alert) + "18", color: getFaseColor(c.fase, alert),
            }}>
              {ferma ? `Ferma ${giorniFermaCM(c)}gg` : scad ? "Scaduta" : fase.nome}
            </span>
            {vaniA.length > 0 && <span style={{ fontSize: 10, color: "#4A7070", fontWeight: 700 }}>{vaniA.length} vani</span>}
            {c.scadenza && !scad && <span style={{ fontSize: 10, color: "#4A7070" }}>{fmtData(c.scadenza)}</span>}
          </div>
          {/* Pipeline mini dots */}
          <div style={{ display: "flex", gap: 2, marginTop: 5 }}>
            {PIPELINE.filter(p => p.attiva).map(p => {
              const isActive = p.id === c.fase;
              const isDone = PIPELINE.findIndex(pp => pp.id === p.id) < PIPELINE.findIndex(pp => pp.id === c.fase);
              const dc = PIPELINE_FLIWOX[p.id] || "#28A0A0";
              return <div key={p.id} style={{ flex: 1, height: 3, borderRadius: 2, background: isActive ? dc : isDone ? dc + "50" : "#D0E8E8" }} />;
            })}
          </div>
        </div>

        {/* Right */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {euroVal > 0 && <div style={{ fontSize: 14, fontWeight: 900, color: "#0D1F1F", fontFamily: FM }}>{fmtEuro(euroVal)}</div>}
          <div style={{ fontSize: 10, color: "#4A7070", fontWeight: 700, marginTop: 2 }}>{prog}%</div>
          {(() => {
            const fatture = (fattureDB || []).filter((f: any) => f.cmId === c.id);
            if (fatture.length === 0) return null;
            const tuttePagate = fatture.every((f: any) => f.pagata);
            return (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 5, background: tuttePagate ? "#1A9E7320" : "#D0800820", color: tuttePagate ? "#1A9E73" : "#D08008", marginTop: 2, display: "block", textAlign: "right" }}>
                {tuttePagate ? "✓ Pag." : "📋"}
              </span>
            );
          })()}
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
    <div style={{ paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: "-0.03em" }}>Commesse</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
            <span style={{ fontSize: 12, color: T.sub }}>{cantieri.length} totali</span>
            {fermeCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: T.red, background: T.red + "12", padding: "2px 7px", borderRadius: 6 }}>
                {fermeCount} ferme
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Toggle view */}
          <div style={{ display: "flex", background: T.bg, borderRadius: 10, padding: 3, border: `1px solid ${T.bdr}`, gap: 2 }}>
            <div onClick={() => setCmView("list")} style={{ width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: cmView === "list" ? T.card : "transparent", boxShadow: cmView === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cmView === "list" ? T.text : T.sub} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </div>
            <div onClick={() => setCmView("card")} style={{ width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: cmView === "card" ? T.card : "transparent", boxShadow: cmView === "card" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cmView === "card" ? T.text : T.sub} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </div>
          </div>
          {/* Nuova commessa */}
          <div onClick={() => setShowModal("commessa")} style={{ width: 36, height: 36, borderRadius: 10, background: T.acc, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 22, fontWeight: 300, lineHeight: 1 }}>+</div>
        </div>
      </div>

      {/* fliwoX Search */}
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "white", borderRadius: 14, border: "1.5px solid #C8E4E4", boxShadow: "0 5px 0 0 #A8CCCC" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A7070" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, fontWeight: 700, color: "#0D1F1F", outline: "none", fontFamily: FF }} placeholder="Cerca cliente, codice, indirizzo..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          {searchQ && <div onClick={() => setSearchQ("")} style={{ cursor: "pointer", fontSize: 18, color: "#4A7070", lineHeight: 1 }}>×</div>}
        </div>
      </div>

      {/* fliwoX Chips fase + Sort */}
      <div style={{ padding: "0 14px 10px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as any, paddingBottom: 8 }}>
          {[{ id: "tutte", nome: "Tutte", color: "#28A0A0", count: cantieri.length },
            ...PIPELINE.filter(p => p.attiva).map(p => ({ ...p, count: cantieri.filter(c => c.fase === p.id).length })).filter(p => p.count > 0)
          ].map(p => {
            const sel = filterFase === p.id;
            const fc = PIPELINE_FLIWOX[p.id] || "#28A0A0";
            return (
              <div key={p.id} onClick={() => setFilterFase(sel && p.id !== "tutte" ? "tutte" : p.id)} style={{
                padding: "7px 13px", borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" as any,
                background: sel ? (p.id === "tutte" ? "#28A0A0" : fc) : "white",
                color: sel ? "white" : "#4A7070",
                border: `1.5px solid ${sel ? (p.id === "tutte" ? "#156060" : fc) : "#C8E4E4"}`,
                boxShadow: sel ? `0 4px 0 0 ${p.id === "tutte" ? "#156060" : fc}88` : "0 3px 0 0 #A8CCCC",
              }}>{p.nome} · {p.count}</div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as any }}>
          {[["default","Recenti"],["nome","A-Z"],["euro","€"],["data","Data"]].map(([v,l]) => (
            <div key={v} onClick={() => setSortBy(v as any)} style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" as any,
              background: sortBy === v ? "#28A0A0" : "white",
              color: sortBy === v ? "white" : "#4A7070",
              border: `1.5px solid ${sortBy === v ? "#156060" : "#C8E4E4"}`,
              boxShadow: sortBy === v ? "0 3px 0 0 #156060" : "0 3px 0 0 #A8CCCC",
            }}>{l}</div>
          ))}
          {totaleEuro > 0 && (
            <div style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 20, background: "white", border: "1.5px solid #C8E4E4", boxShadow: "0 3px 0 0 #A8CCCC", display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#4A7070", fontWeight: 700 }}>{filtered.length} comm.</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#0D1F1F", fontFamily: FM }}>€{totaleEuro.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</span>
            </div>
          )}
        </div>
      </div>

      {/* fliwoX Content */}
      {filtered.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(40,160,160,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 5px 0 0 #A8CCCC" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#0D1F1F" }}>Nessuna commessa</div>
          <div style={{ fontSize: 13, color: "#4A7070", fontWeight: 700, marginTop: 4 }}>Modifica i filtri o crea una nuova commessa</div>
          <div onClick={() => setShowModal("commessa")} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 24px", borderRadius: 16, background: "#28A0A0", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 7px 0 0 #156060" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round"><path d="M12 4v16M4 12h16"/></svg>
            Nuova commessa
          </div>
        </div>
      ) : cmView === "list" ? (
        <div style={{ margin: "0 14px", borderRadius: 18, border: "1.5px solid #C8E4E4", overflow: "hidden", background: "white", boxShadow: "0 7px 0 0 #A8CCCC" }}>
          {filteredSorted.map(c => renderRow(c))}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : isTablet ? "1fr 1fr" : "1fr",
          gap: 10, padding: "0 14px"
        }}>
          {filteredSorted.map(c => renderCard(c))}
        </div>
      )}
    </div>
  );
}
