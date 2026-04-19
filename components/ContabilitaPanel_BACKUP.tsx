"use client";
// @ts-nocheck
// MASTRO ERP — ContabilitaPanel v4 — fliwoX Approved Mockup
import React from "react";
import { supabase } from "@/lib/supabase";
import { useMastro } from "./MastroContext";

// ─── COLORI ────────────────────────────────────────────────────────────────────
const T_CLR = "#28A0A0";
const T_DARK = "#156060";
const T_LIGHT = "#EEF8F8";
const INK = "#0D1F1F";
const SUB = "#4A7070";
const BDR = "#C8E4E4";
const GRN = "#1A9E73";
const GND = "#0A5A3A";
const RED = "#DC4444";
const RDD = "#8A1818";
const AMB = "#D08008";
const AMD = "#7A4800";
const PUR = "#7C5FBF";
const PUD = "#4A3080";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtK = (n: number) => {
  if (n >= 1000) return "€" + (n / 1000).toFixed(1).replace(".0", "") + "k";
  return "€" + n.toLocaleString("it-IT");
};
const fmtFull = (n: number) => "€" + n.toLocaleString("it-IT", { minimumFractionDigits: 0 });

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
const KpiCard = ({ label, value, color, borderColor, shadowColor }: any) => (
  <div style={{ background: "white", borderRadius: 16, border: `1.5px solid ${borderColor || BDR}`, boxShadow: `0 6px 0 0 ${shadowColor || "#A8CCCC"}`, padding: "16px 10px", textAlign: "center" }}>
    <p style={{ margin: "0 0 6px", fontSize: 8, color: SUB, fontWeight: 800, textTransform: "uppercase" as any, letterSpacing: "0.05em" }}>{label}</p>
    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color }}>{value}</p>
  </div>
);

const BadgeStato = ({ pagata, tipo }: { pagata: boolean; tipo?: string }) => {
  if (pagata) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 900, background: "#D8F2EC", color: GND, boxShadow: "0 4px 0 0 #A8D8C8" }}>
      ✓ {tipo === "ricevuta" ? "Pagata" : "Incassata"}
    </span>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 900, background: "#FFE4E4", color: RDD, boxShadow: "0 4px 0 0 #FFAAAA" }}>
      {tipo === "ricevuta" ? "Da pagare" : "Da incassare"}
    </span>
  );
};

const TipoBadge = ({ tipo }: { tipo: string }) => {
  const cfg: any = { acconto: { bg: "#FFF0DC", color: AMD }, saldo: { bg: "#D8F2EC", color: GND }, proforma: { bg: T_LIGHT, color: T_DARK } };
  const c = cfg[tipo?.toLowerCase()] || { bg: T_LIGHT, color: T_CLR };
  return <span style={{ display: "inline-flex", padding: "6px 13px", borderRadius: 20, fontSize: 11, fontWeight: 900, background: c.bg, color: c.color }}>{(tipo || "").toUpperCase()}</span>;
};

const BtnGrn = ({ children, onClick }: any) => (
  <button onClick={onClick} style={{ flex: 1, background: GRN, border: "none", borderRadius: 14, padding: "15px 10px", fontSize: 14, fontWeight: 900, color: "white", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 7px 0 0 ${GND}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
    {children}
  </button>
);
const BtnPur = ({ children, onClick }: any) => (
  <button onClick={onClick} style={{ flex: 1, background: PUR, border: "none", borderRadius: 14, padding: "15px 10px", fontSize: 14, fontWeight: 900, color: "white", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 7px 0 0 ${PUD}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
    {children}
  </button>
);
const BtnWhite = ({ children, onClick }: any) => (
  <button onClick={onClick} style={{ flex: 1, background: "white", border: `2px solid ${BDR}`, borderRadius: 14, padding: "15px 10px", fontSize: 14, fontWeight: 800, color: INK, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 7px 0 0 #A8CCCC", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
    {children}
  </button>
);
const NavBtn = ({ onClick, children }: any) => (
  <div onClick={onClick} style={{ width: 40, height: 40, background: T_LIGHT, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${BDR}`, boxShadow: "0 5px 0 0 #A8CCCC", cursor: "pointer", flexShrink: 0 }}>
    {children}
  </div>
);

// ─── GRAFICO BARRE ────────────────────────────────────────────────────────────
const BarChart = ({ barData, barMax, currentMonth }: any) => (
  <div style={{ background: "white", borderRadius: 18, border: `1.5px solid ${BDR}`, boxShadow: "0 7px 0 0 #A8CCCC", padding: 16 }}>
    <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: INK }}>Andamento 6 mesi</p>
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 86, marginBottom: 10 }}>
      {barData.map((b: any, i: number) => {
        const isCurr = i === barData.length - 1;
        const emH = barMax > 0 ? Math.round((b.emesso / barMax) * 68) : 4;
        const coH = barMax > 0 ? Math.round((b.costi / barMax) * 68) : 4;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column" as any, alignItems: "center", gap: 3 }}>
            <div style={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-end", height: 68 }}>
              <div style={{ width: "48%", height: Math.max(emH, 4), background: T_CLR, borderRadius: "5px 5px 0 0", boxShadow: `0 ${isCurr ? 5 : 4}px 0 0 ${T_DARK}` }} />
              <div style={{ width: "48%", height: Math.max(coH, 4), background: AMB, borderRadius: "5px 5px 0 0", boxShadow: `0 3px 0 0 ${AMD}` }} />
            </div>
            <p style={{ margin: 0, fontSize: 8, color: isCurr ? T_CLR : SUB, fontWeight: isCurr ? 900 : 700, textTransform: "uppercase" as any }}>{b.lbl}</p>
          </div>
        );
      })}
    </div>
    <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 14, height: 14, borderRadius: 4, background: T_CLR, boxShadow: `0 3px 0 0 ${T_DARK}` }} />
        <span style={{ fontSize: 11, color: SUB, fontWeight: 600 }}>Fatturato</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 14, height: 14, borderRadius: 4, background: AMB, boxShadow: `0 3px 0 0 ${AMD}` }} />
        <span style={{ fontSize: 11, color: SUB, fontWeight: 600 }}>Costi</span>
      </div>
    </div>
  </div>
);

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function ContabilitaPanel() {
  const {
    cantieri, contabMese, contabTab, fattureDB, fatturePassive,
    setContabMese, setContabTab, setSelectedCM, setTab,
    generaFatturaPDF, generaXmlSDI,
  } = useMastro();

  const today = new Date();
  const [spese, setSpese] = React.useState<any[]>([]);
  const [loadingSpese, setLoadingSpese] = React.useState(false);

  const [cY, cM] = contabMese.split("-").map(Number);
  const meseLbl = new Date(cY, cM - 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const meseLblShort = new Date(cY, cM - 1).toLocaleDateString("it-IT", { month: "short", year: "numeric" });

  const allEmesse = fattureDB || [];
  const allRicevute = fatturePassive || [];
  const meseEmesse = allEmesse.filter(f => (f.dataISO || "").startsWith(contabMese));
  const meseRicevute = allRicevute.filter(f => (f.dataISO || f.data || "").startsWith(contabMese));

  const totEmesso = allEmesse.reduce((s, f) => s + (f.importo || 0), 0);
  const totIncassato = allEmesse.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
  const totDaIncassare = allEmesse.filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
  const totCosti = allRicevute.reduce((s, f) => s + (f.importo || 0), 0);
  const totDaPagare = allRicevute.filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
  const margine = totIncassato - (allRicevute.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0));
  const meseEmTot = meseEmesse.reduce((s, f) => s + (f.importo || 0), 0);
  const meseRicTot = meseRicevute.reduce((s, f) => s + (f.importo || 0), 0);

  // scadenza urgente (più vecchia non pagata)
  const scadenzaUrgente = [...allRicevute.filter(f => !f.pagata && f.scadenza), ...allEmesse.filter(f => !f.pagata && f.scadenza)]
    .sort((a, b) => (a.scadenza || "").localeCompare(b.scadenza || ""))
    .find(f => f.scadenza < today.toISOString().split("T")[0]);

  // prossima scadenza attiva (incasso)
  const prossimaScadenza = allEmesse.filter(f => !f.pagata && f.scadenza && f.scadenza >= today.toISOString().split("T")[0])
    .sort((a, b) => (a.scadenza || "").localeCompare(b.scadenza || ""))[0];

  // bar chart 6 mesi
  const barData = [];
  for (let i = 5; i >= 0; i--) {
    const bd = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, "0")}`;
    const lbl = bd.toLocaleDateString("it-IT", { month: "short" });
    const em = allEmesse.filter(f => (f.dataISO || "").startsWith(key)).reduce((s, f) => s + (f.importo || 0), 0);
    const co = allRicevute.filter(f => (f.dataISO || f.data || "").startsWith(key)).reduce((s, f) => s + (f.importo || 0), 0);
    barData.push({ lbl, emesso: em, costi: co });
  }
  const barMax = Math.max(...barData.map(b => Math.max(b.emesso, b.costi)), 1);

  const prevMese = () => { const d = new Date(cY, cM - 2, 1); setContabMese(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };
  const nextMese = () => { const d = new Date(cY, cM, 1); setContabMese(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };

  const TABS = [
    { id: "panoramica", l: "Panoramica" },
    { id: "emesse", l: "Emesse" },
    { id: "ricevute", l: "Ricevute" },
    { id: "calendario", l: "Calendario" },
    { id: "spese", l: "Spese" },
    { id: "sdi", l: "SDI" },
  ];

  // ── PANORAMICA ─────────────────────────────────────────────────────────────
  const renderPanoramica = () => (
    <div style={{ display: "flex", flexDirection: "column" as any, gap: 12 }}>
      {/* 6 KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <KpiCard label="Fatturato" value={fmtK(totEmesso)} color={INK} />
        <KpiCard label="Incassato" value={fmtK(totIncassato)} color={GRN} />
        <KpiCard label="Da inc." value={fmtK(totDaIncassare)} color={RED} borderColor="rgba(220,68,68,.4)" shadowColor="#FFAAAA" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <KpiCard label="Costi" value={fmtK(totCosti)} color={AMB} />
        <KpiCard label="Da pag." value={fmtK(totDaPagare)} color={AMB} />
        <KpiCard label="Margine" value={fmtK(margine)} color={GRN} borderColor="rgba(26,158,115,.5)" shadowColor="rgba(26,158,115,.35)" />
      </div>

      {/* Grafico */}
      <BarChart barData={barData} barMax={barMax} />

      {/* Scadenza urgente */}
      {scadenzaUrgente && (
        <div style={{ background: "#FFF4F4", borderRadius: 16, border: "2px solid rgba(220,68,68,.35)", padding: "14px 16px", boxShadow: "0 6px 0 0 #FFAAAA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, background: "rgba(220,68,68,.15)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 0 0 #FFAAAA" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: RED }}>
                {typeof scadenzaUrgente.fornitore === "object" ? scadenzaUrgente.fornitore?.nome : (scadenzaUrgente.fornitore || scadenzaUrgente.cliente || "Scadenza")}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: RED, fontWeight: 700 }}>
                {scadenzaUrgente.pagata === false && scadenzaUrgente.scadenza < today.toISOString().split("T")[0]
                  ? `Scaduta ${Math.round((today.getTime() - new Date(scadenzaUrgente.scadenza).getTime()) / 86400000)} gg`
                  : "In scadenza"} · {scadenzaUrgente.fornitore ? "da pagare" : "da incassare"}
              </p>
            </div>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: RED }}>{fmtFull(scadenzaUrgente.importo || 0)}</p>
          </div>
        </div>
      )}

      {/* Riepilogo mese */}
      <div style={{ background: "white", borderRadius: 18, border: `1.5px solid ${BDR}`, boxShadow: "0 7px 0 0 #A8CCCC", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <NavBtn onClick={prevMese}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T_CLR} strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </NavBtn>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: INK }}>{meseLbl.charAt(0).toUpperCase() + meseLbl.slice(1)}</p>
          <NavBtn onClick={nextMese}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T_CLR} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </NavBtn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ padding: 14, borderRadius: 14, background: "rgba(40,160,160,.1)", textAlign: "center", border: "2px solid rgba(40,160,160,.25)", boxShadow: "0 5px 0 0 rgba(40,160,160,.25)" }}>
            <p style={{ margin: "0 0 5px", fontSize: 9, color: SUB, fontWeight: 800, textTransform: "uppercase" as any }}>Emesso</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: T_CLR }}>{fmtK(meseEmTot)}</p>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: SUB }}>{meseEmesse.length} fatture</p>
          </div>
          <div style={{ padding: 14, borderRadius: 14, background: "rgba(208,128,8,.1)", textAlign: "center", border: "2px solid rgba(208,128,8,.25)", boxShadow: "0 5px 0 0 rgba(208,128,8,.25)" }}>
            <p style={{ margin: "0 0 5px", fontSize: 9, color: SUB, fontWeight: 800, textTransform: "uppercase" as any }}>Costi</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: AMB }}>{fmtK(meseRicTot)}</p>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: SUB }}>{meseRicevute.length} fatture</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── EMESSE ─────────────────────────────────────────────────────────────────
  const renderEmesse = () => {
    const pagate = allEmesse.filter(f => f.pagata).length;
    const aperte = allEmesse.filter(f => !f.pagata).length;
    return (
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: INK }}>{allEmesse.length} fatture emesse</p>
          <div style={{ display: "flex", gap: 7 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 900, background: "#D8F2EC", color: GND, boxShadow: "0 4px 0 0 #A8D8C8" }}>{pagate} ✓</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 900, background: "#FFE4E4", color: RDD, boxShadow: "0 4px 0 0 #FFAAAA" }}>{aperte} aperte</span>
          </div>
        </div>
        {allEmesse.length === 0 && <p style={{ textAlign: "center", color: SUB, fontSize: 13, padding: 20 }}>Nessuna fattura emessa</p>}
        {allEmesse.slice().sort((a, b) => (b.numero || 0) - (a.numero || 0)).map(f => (
          <div key={f.id} style={{ background: "white", borderRadius: 18, border: `1.5px solid ${BDR}`, boxShadow: "0 7px 0 0 #A8CCCC", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: INK }}>N. {f.numero} / {f.anno}</p>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: SUB }}>{f.cliente}{f.cmCode ? " · " + f.cmCode : ""}</p>
                {f.tipo && <div style={{ marginTop: 8 }}><TipoBadge tipo={f.tipo} /></div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: f.pagata ? GRN : RED }}>{fmtFull(f.importo || 0)}</p>
                <div style={{ marginTop: 6 }}><BadgeStato pagata={f.pagata} /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <BtnGrn onClick={() => generaFatturaPDF?.(f)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                PDF
              </BtnGrn>
              <BtnPur onClick={() => generaXmlSDI?.(f)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                SDI
              </BtnPur>
              <BtnWhite onClick={() => { const cm = cantieri.find(c => c.code === f.cmCode); if (cm) { setSelectedCM(cm); setTab("commesse"); } }}>
                Commessa
              </BtnWhite>
            </div>
          </div>
        ))}
        <button onClick={() => {}} style={{ width: "100%", background: T_CLR, border: "none", borderRadius: 16, padding: 17, fontSize: 16, fontWeight: 900, color: "white", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 0 0 ${T_DARK}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round"><path d="M12 4v16M4 12h16"/></svg>
          Nuova fattura
        </button>
      </div>
    );
  };

  // ── RICEVUTE ───────────────────────────────────────────────────────────────
  const renderRicevute = () => {
    const pagate = allRicevute.filter(f => f.pagata).length;
    const aperte = allRicevute.filter(f => !f.pagata).length;
    return (
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: INK }}>{allRicevute.length} fatture ricevute</p>
          <div style={{ display: "flex", gap: 7 }}>
            <span style={{ display: "inline-flex", padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 900, background: "#D8F2EC", color: GND, boxShadow: "0 4px 0 0 #A8D8C8" }}>{pagate} ✓</span>
            <span style={{ display: "inline-flex", padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 900, background: "#FFE4E4", color: RDD, boxShadow: "0 4px 0 0 #FFAAAA" }}>{aperte} aperte</span>
          </div>
        </div>
        {allRicevute.length === 0 && <p style={{ textAlign: "center", color: SUB, fontSize: 13, padding: 20 }}>Nessuna fattura ricevuta</p>}
        {allRicevute.slice().sort((a, b) => (b.dataISO || "").localeCompare(a.dataISO || "")).map(f => {
          const forn = typeof f.fornitore === "object" ? f.fornitore?.nome : (f.fornitore || "Fornitore");
          return (
            <div key={f.id} style={{ background: "white", borderRadius: 18, border: `1.5px solid ${BDR}`, boxShadow: "0 7px 0 0 #A8CCCC", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: INK }}>{forn}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: SUB }}>{f.dataISO || f.data || ""}{f.scadenza ? " · scad. " + f.scadenza : ""}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: f.pagata ? GRN : AMB }}>{fmtFull(f.importo || 0)}</p>
                  <div style={{ marginTop: 6 }}><BadgeStato pagata={f.pagata} tipo="ricevuta" /></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── SDI ────────────────────────────────────────────────────────────────────
  const renderSDI = () => (
    <div style={{ display: "flex", flexDirection: "column" as any, gap: 10 }}>
      <div style={{ background: "white", borderRadius: 14, border: `1px solid ${BDR}`, padding: 16, boxShadow: "0 5px 0 0 #A8CCCC" }}>
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: INK }}>Fatturazione Elettronica</p>
        <p style={{ margin: "0 0 4px", fontSize: 11, color: SUB }}>Genera XML FatturaPA 1.2 per il Sistema di Interscambio.</p>
        <p style={{ margin: 0, fontSize: 9, color: SUB }}>Formato: FPR12 · Regime: RF01</p>
      </div>
      {allEmesse.map(f => (
        <div key={f.id} style={{ display: "flex", alignItems: "center", padding: "10px 12px", background: "white", borderRadius: 12, border: `1px solid ${BDR}`, boxShadow: "0 4px 0 0 #A8CCCC" }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: INK }}>N. {f.numero}/{f.anno} — {f.cliente}</p>
            <p style={{ margin: 0, fontSize: 9, color: SUB }}>{f.tipo} · {f.dataISO} · {fmtFull(f.importo)}</p>
          </div>
          <div onClick={() => generaXmlSDI?.(f)} style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(124,95,191,.15)", color: PUR, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>XML</div>
        </div>
      ))}
    </div>
  );

  // ── SPESE ──────────────────────────────────────────────────────────────────
  const renderSpese = () => (
    <div style={{ display: "flex", flexDirection: "column" as any, gap: 10 }}>
      {loadingSpese && <p style={{ textAlign: "center", color: SUB, padding: 20 }}>Caricamento...</p>}
      {!loadingSpese && spese.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: SUB }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: INK }}>Nessuna spesa</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Le spese degli operatori appariranno qui</p>
        </div>
      )}
      {spese.map(s => (
        <div key={s.id} style={{ background: "white", borderRadius: 12, border: `1px solid ${BDR}`, padding: "12px 14px", boxShadow: "0 4px 0 0 #A8CCCC", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: INK }}>{s.operatore_nome}</p>
            <p style={{ margin: 0, fontSize: 10, color: SUB }}>{s.categoria} · {new Date(s.created_at).toLocaleDateString("it-IT")}</p>
          </div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: GRN }}>€{(s.importo || 0).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", backgroundColor: "#D8EEEE", backgroundImage: "linear-gradient(rgba(40,160,160,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,.18) 1px,transparent 1px)", backgroundSize: "24px 24px", minHeight: "100%", paddingBottom: 100 }}>

      {/* TOPBAR */}
      <div style={{ background: INK, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => setTab("home")} style={{ width: 36, height: 36, background: "rgba(255,255,255,.08)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.1)", cursor: "pointer", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </div>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "white", flex: 1 }}>Contabilita'</p>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>{today.getFullYear()}</p>
      </div>

      {/* TAB SWITCH */}
      <div style={{ display: "flex", background: "white", borderBottom: `3px solid ${BDR}` }}>
        {TABS.map(t => {
          const active = contabTab === t.id;
          return (
            <div key={t.id} onClick={() => setContabTab(t.id)}
              style={{ flex: 1, padding: "11px 2px", textAlign: "center", fontSize: 10, fontWeight: active ? 900 : 700, cursor: "pointer", background: active ? T_CLR : "white", color: active ? "white" : SUB, borderBottom: active ? `3px solid ${T_DARK}` : "none" }}>
              {t.l}
            </div>
          );
        })}
      </div>

      {/* BODY */}
      <div style={{ padding: 14 }}>
        {contabTab === "panoramica" && renderPanoramica()}
        {contabTab === "emesse" && renderEmesse()}
        {contabTab === "ricevute" && renderRicevute()}
        {contabTab === "calendario" && (
          <p style={{ textAlign: "center", color: SUB, padding: 40, fontSize: 13 }}>Calendario scadenze — coming soon</p>
        )}
        {contabTab === "spese" && renderSpese()}
        {contabTab === "sdi" && renderSDI()}
      </div>
    </div>
  );
}
