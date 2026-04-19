"use client";
// @ts-nocheck
// MASTRO ERP — ContabilitaPanel v5 — Restyled "Sistema Operativo"
import React from "react";
import { supabase } from "@/lib/supabase";
import { useMastro } from "./MastroContext";

// ─── THEME ─────────────────────────────────────────────────────────
const TH = {
  bg: "#0D1F1F", bgLight: "#F5F4F0", card: "#fff",
  teal: "#28A0A0", tealDark: "#1D7A7A", tealMuted: "#5A8A8A",
  ink: "#1A1A18", sub: "#B0B0A8", border: "#F0EFEC",
  red: "#E24B4A", amber: "#C4875A", green: "#0F6E56",
  greenLight: "#E1F5EE", purple: "#7B6BA5",
};

// ─── HELPERS ──────────────────────────────────────────────────────
const fmtK = (n: number) => {
  if (n >= 1000) return "€" + (n / 1000).toFixed(1).replace(".0", "") + "k";
  return "€" + n.toLocaleString("it-IT");
};
const fmtFull = (n: number) => "€" + n.toLocaleString("it-IT", { minimumFractionDigits: 0 });

// ─── SUB-COMPONENTS ──────────────────────────────────────────────
const KpiCard = ({ label, value, color, accent }: any) => (
  <div style={{ background: TH.card, borderRadius: 14, padding: "14px 10px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
    <p style={{ margin: "0 0 4px", fontSize: 9, color: TH.sub, fontWeight: 700, letterSpacing: "0.5px" }}>{label}</p>
    <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color }}>{value}</p>
  </div>
);

const BadgeStato = ({ pagata, tipo }: { pagata: boolean; tipo?: string }) => (
  <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
    background: pagata ? TH.greenLight : "rgba(226,75,74,0.1)",
    color: pagata ? TH.green : TH.red }}>
    {pagata ? (tipo === "ricevuta" ? "Pagata" : "Incassata") : (tipo === "ricevuta" ? "Da pagare" : "Da incassare")}
  </span>
);

const TipoBadge = ({ tipo }: { tipo: string }) => {
  const cfg: any = { acconto: { bg: "#FFF4E6", color: "#854F0B" }, saldo: { bg: TH.greenLight, color: TH.green }, proforma: { bg: "rgba(40,160,160,0.08)", color: TH.tealDark } };
  const c = cfg[tipo?.toLowerCase()] || { bg: "rgba(40,160,160,0.08)", color: TH.teal };
  return <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: c.bg, color: c.color }}>{(tipo || "").toUpperCase()}</span>;
};

const BtnAction = ({ children, onClick, bg, color: clr }: any) => (
  <button onClick={onClick} style={{ flex: 1, background: bg || TH.bg, border: "none", borderRadius: 12, padding: "12px 10px", fontSize: 12, fontWeight: 700, color: clr || TH.teal, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
    {children}
  </button>
);

// ─── GRAFICO BARRE ──────────────────────────────────────────────
const BarChart = ({ barData, barMax }: any) => (
  <div style={{ background: TH.card, borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
    <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: TH.ink }}>Andamento 6 mesi</p>
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 86, marginBottom: 10 }}>
      {barData.map((b: any, i: number) => {
        const isCurr = i === barData.length - 1;
        const emH = barMax > 0 ? Math.round((b.emesso / barMax) * 68) : 4;
        const coH = barMax > 0 ? Math.round((b.costi / barMax) * 68) : 4;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column" as any, alignItems: "center", gap: 3 }}>
            <div style={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-end", height: 68 }}>
              <div style={{ width: "48%", height: Math.max(emH, 4), background: TH.teal, borderRadius: "4px 4px 0 0" }} />
              <div style={{ width: "48%", height: Math.max(coH, 4), background: TH.amber, borderRadius: "4px 4px 0 0" }} />
            </div>
            <p style={{ margin: 0, fontSize: 8, color: isCurr ? TH.teal : TH.sub, fontWeight: isCurr ? 700 : 500 }}>{b.lbl}</p>
          </div>
        );
      })}
    </div>
    <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 12, height: 12, borderRadius: 3, background: TH.teal }} />
        <span style={{ fontSize: 10, color: TH.sub, fontWeight: 500 }}>Fatturato</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 12, height: 12, borderRadius: 3, background: TH.amber }} />
        <span style={{ fontSize: 10, color: TH.sub, fontWeight: 500 }}>Costi</span>
      </div>
    </div>
  </div>
);

// ─── MAIN ────────────────────────────────────────────────────────
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

  const scadenzaUrgente = [...allRicevute.filter(f => !f.pagata && f.scadenza), ...allEmesse.filter(f => !f.pagata && f.scadenza)]
    .sort((a, b) => (a.scadenza || "").localeCompare(b.scadenza || ""))
    .find(f => f.scadenza < today.toISOString().split("T")[0]);

  const prossimaScadenza = allEmesse.filter(f => !f.pagata && f.scadenza && f.scadenza >= today.toISOString().split("T")[0])
    .sort((a, b) => (a.scadenza || "").localeCompare(b.scadenza || ""))[0];

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

  // ── PANORAMICA ──
  const renderPanoramica = () => (
    <div style={{ display: "flex", flexDirection: "column" as any, gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <KpiCard label="FATTURATO" value={fmtK(totEmesso)} color={TH.ink} />
        <KpiCard label="INCASSATO" value={fmtK(totIncassato)} color={TH.green} />
        <KpiCard label="DA INC." value={fmtK(totDaIncassare)} color={TH.red} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <KpiCard label="COSTI" value={fmtK(totCosti)} color={TH.amber} />
        <KpiCard label="DA PAG." value={fmtK(totDaPagare)} color={TH.amber} />
        <KpiCard label="MARGINE" value={fmtK(margine)} color={TH.green} />
      </div>

      <BarChart barData={barData} barMax={barMax} />

      {scadenzaUrgente && (
        <div style={{ background: TH.card, borderRadius: 14, padding: "14px 16px", borderLeft: `4px solid ${TH.red}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(226,75,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TH.red} strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TH.red }}>
                {typeof scadenzaUrgente.fornitore === "object" ? scadenzaUrgente.fornitore?.nome : (scadenzaUrgente.fornitore || scadenzaUrgente.cliente || "Scadenza")}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: TH.red, fontWeight: 600 }}>
                {scadenzaUrgente.pagata === false && scadenzaUrgente.scadenza < today.toISOString().split("T")[0]
                  ? `Scaduta ${Math.round((today.getTime() - new Date(scadenzaUrgente.scadenza).getTime()) / 86400000)} gg`
                  : "In scadenza"} · {scadenzaUrgente.fornitore ? "da pagare" : "da incassare"}
              </p>
            </div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: TH.red }}>{fmtFull(scadenzaUrgente.importo || 0)}</p>
          </div>
        </div>
      )}

      {/* Riepilogo mese */}
      <div style={{ background: TH.card, borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div onClick={prevMese} style={{ width: 34, height: 34, background: "#F7F7F5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TH.teal} strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TH.ink }}>{meseLbl.charAt(0).toUpperCase() + meseLbl.slice(1)}</p>
          <div onClick={nextMese} style={{ width: 34, height: 34, background: "#F7F7F5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TH.teal} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ padding: 14, borderRadius: 14, background: "rgba(40,160,160,0.06)", textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 9, color: TH.sub, fontWeight: 700 }}>EMESSO</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: TH.teal }}>{fmtK(meseEmTot)}</p>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: TH.sub }}>{meseEmesse.length} fatture</p>
          </div>
          <div style={{ padding: 14, borderRadius: 14, background: "rgba(196,135,90,0.06)", textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 9, color: TH.sub, fontWeight: 700 }}>COSTI</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: TH.amber }}>{fmtK(meseRicTot)}</p>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: TH.sub }}>{meseRicevute.length} fatture</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── EMESSE ──
  const renderEmesse = () => {
    const pagate = allEmesse.filter(f => f.pagata).length;
    const aperte = allEmesse.filter(f => !f.pagata).length;
    return (
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TH.ink }}>{allEmesse.length} fatture emesse</p>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: TH.greenLight, color: TH.green }}>{pagate} incassate</span>
            <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "rgba(226,75,74,0.1)", color: TH.red }}>{aperte} aperte</span>
          </div>
        </div>
        {allEmesse.length === 0 && <p style={{ textAlign: "center", color: TH.sub, fontSize: 13, padding: 20 }}>Nessuna fattura emessa</p>}
        {allEmesse.slice().sort((a, b) => (b.numero || 0) - (a.numero || 0)).map(f => (
          <div key={f.id} style={{ background: TH.card, borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TH.ink }}>N. {f.numero} / {f.anno}</p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: TH.sub }}>{f.cliente}{f.cmCode ? " · " + f.cmCode : ""}</p>
                {f.tipo && <div style={{ marginTop: 6 }}><TipoBadge tipo={f.tipo} /></div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: f.pagata ? TH.green : TH.red }}>{fmtFull(f.importo || 0)}</p>
                <div style={{ marginTop: 4 }}><BadgeStato pagata={f.pagata} /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <BtnAction onClick={() => generaFatturaPDF?.(f)} bg={TH.bg} color={TH.teal}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TH.teal} strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                PDF
              </BtnAction>
              <BtnAction onClick={() => generaXmlSDI?.(f)} bg={TH.purple} color="#fff">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                SDI
              </BtnAction>
              <BtnAction onClick={() => { const cm = cantieri.find(c => c.code === f.cmCode); if (cm) { setSelectedCM(cm); setTab("commesse"); } }} bg="#F7F7F5" color={TH.ink}>
                Commessa
              </BtnAction>
            </div>
          </div>
        ))}
        <button onClick={() => {}} style={{ width: "100%", background: TH.bg, border: "none", borderRadius: 14, padding: 16, fontSize: 14, fontWeight: 700, color: TH.teal, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TH.teal} strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Nuova fattura
        </button>
      </div>
    );
  };

  // ── RICEVUTE ──
  const renderRicevute = () => {
    const pagate = allRicevute.filter(f => f.pagata).length;
    const aperte = allRicevute.filter(f => !f.pagata).length;
    return (
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TH.ink }}>{allRicevute.length} fatture ricevute</p>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: TH.greenLight, color: TH.green }}>{pagate} pagate</span>
            <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "rgba(226,75,74,0.1)", color: TH.red }}>{aperte} aperte</span>
          </div>
        </div>
        {allRicevute.length === 0 && <p style={{ textAlign: "center", color: TH.sub, fontSize: 13, padding: 20 }}>Nessuna fattura ricevuta</p>}
        {allRicevute.slice().sort((a, b) => (b.dataISO || "").localeCompare(a.dataISO || "")).map(f => {
          const forn = typeof f.fornitore === "object" ? f.fornitore?.nome : (f.fornitore || "Fornitore");
          return (
            <div key={f.id} style={{ background: TH.card, borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TH.ink }}>{forn}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: TH.sub }}>{f.dataISO || f.data || ""}{f.scadenza ? " · scad. " + f.scadenza : ""}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: f.pagata ? TH.green : TH.amber }}>{fmtFull(f.importo || 0)}</p>
                  <div style={{ marginTop: 4 }}><BadgeStato pagata={f.pagata} tipo="ricevuta" /></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── SDI ──
  const renderSDI = () => (
    <div style={{ display: "flex", flexDirection: "column" as any, gap: 10 }}>
      <div style={{ background: TH.card, borderRadius: 14, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: TH.ink }}>Fatturazione Elettronica</p>
        <p style={{ margin: "0 0 4px", fontSize: 11, color: TH.sub }}>Genera XML FatturaPA 1.2 per il Sistema di Interscambio.</p>
        <p style={{ margin: 0, fontSize: 9, color: TH.sub }}>Formato: FPR12 · Regime: RF01</p>
      </div>
      {allEmesse.map(f => (
        <div key={f.id} style={{ display: "flex", alignItems: "center", padding: "10px 14px", background: TH.card, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: TH.ink }}>N. {f.numero}/{f.anno} — {f.cliente}</p>
            <p style={{ margin: 0, fontSize: 10, color: TH.sub }}>{f.tipo} · {f.dataISO} · {fmtFull(f.importo)}</p>
          </div>
          <div onClick={() => generaXmlSDI?.(f)} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(123,107,165,0.1)", color: TH.purple, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>XML</div>
        </div>
      ))}
    </div>
  );

  // ── SPESE ──
  const renderSpese = () => (
    <div style={{ display: "flex", flexDirection: "column" as any, gap: 10 }}>
      {loadingSpese && <p style={{ textAlign: "center", color: TH.sub, padding: 20 }}>Caricamento...</p>}
      {!loadingSpese && spese.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: TH.ink }}>Nessuna spesa</p>
          <p style={{ fontSize: 12, color: TH.sub, marginTop: 4 }}>Le spese degli operatori appariranno qui</p>
        </div>
      )}
      {spese.map(s => (
        <div key={s.id} style={{ background: TH.card, borderRadius: 12, padding: "12px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: TH.ink }}>{s.operatore_nome}</p>
            <p style={{ margin: 0, fontSize: 10, color: TH.sub }}>{s.categoria} · {new Date(s.created_at).toLocaleDateString("it-IT")}</p>
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TH.green }}>€{(s.importo || 0).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );

  // ── RENDER ──
  return (
    <div style={{ fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif", background: TH.bgLight, minHeight: "100%", paddingBottom: 100 }}>

      {/* TOPBAR SCURO */}
      <div style={{ background: TH.bg, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => setTab("home")} style={{ width: 34, height: 34, background: "rgba(255,255,255,.06)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </div>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", flex: 1 }}>Contabilità</p>
        <span style={{ fontSize: 11, color: TH.tealMuted }}>{today.getFullYear()}</span>
      </div>

      {/* TAB SWITCH */}
      <div style={{ display: "flex", background: TH.bg, padding: "0 12px 14px", gap: 3, overflowX: "auto" }}>
        {TABS.map(t => {
          const active = contabTab === t.id;
          return (
            <div key={t.id} onClick={() => setContabTab(t.id)}
              style={{ padding: "7px 10px", fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap",
                background: active ? "rgba(40,160,160,0.2)" : "transparent",
                color: active ? TH.teal : TH.tealMuted,
                borderRadius: 10 }}>
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
          <p style={{ textAlign: "center", color: TH.sub, padding: 40, fontSize: 13 }}>Calendario scadenze — coming soon</p>
        )}
        {contabTab === "spese" && renderSpese()}
        {contabTab === "sdi" && renderSDI()}
      </div>
    </div>
  );
}
