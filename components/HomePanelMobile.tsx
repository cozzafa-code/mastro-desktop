"use client";
// @ts-nocheck
// MASTRO ERP — HomePanel MOBILE — Restyled "Sistema Operativo" v2
import React, { useState, useEffect } from "react";
import { useMastro } from "./MastroContext";
import SpesaQuick from "./SpesaQuick";
import { ICO, I } from "./mastro-constants";

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
  redLight: "rgba(226,75,74,0.25)",
  amber: "#C4875A",
  amberLight: "rgba(232,168,124,0.18)",
  green: "#0F6E56",
  greenLight: "#E1F5EE",
};

const PIPE_COLORS: Record<string, string> = {
  sopralluogo: TH.teal, preventivo: "#1A7070", conferma: "#1060A0",
  ordini: "#806020", produzione: "#806020", posa: "#806020",
  collaudo: "#6B4FB0", chiusura: "#6B4FB0",
};

// ─── GRADIENT AVATARS ──────────────────────────────────────────────
const AV_GRADS = [
  "linear-gradient(145deg, #2BAFAF, #1E8585)",
  "linear-gradient(145deg, #D09560, #A87545)",
  "linear-gradient(145deg, #1A3535, #0D1F1F)",
  "linear-gradient(145deg, #3572A5, #245A85)",
  "linear-gradient(145deg, #7B6BA5, #5A4D85)",
  "linear-gradient(145deg, #5E8C5A, #3D6B3A)",
];

// ─── ICONS ─────────────────────────────────────────────────────────
const IcoBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TH.tealMuted} strokeWidth="2" strokeLinecap="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

// ─── COMPONENTS ────────────────────────────────────────────────────
const Card = ({ children, style = {}, borderLeft }: any) => (
  <div style={{ background: TH.card, borderRadius: 16, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", ...(borderLeft ? { borderLeft: `4px solid ${borderLeft}` } : {}), ...style }}>{children}</div>
);
const SecLabel = ({ children }: any) => (
  <span style={{ fontSize: 10, fontWeight: 700, color: TH.sub, letterSpacing: "0.5px" }}>{children}</span>
);
const Badge = ({ children, bg, color }: any) => (
  <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: bg, color, boxShadow: bg.includes("gradient") ? `0 2px 6px rgba(40,160,160,0.3)` : undefined }}>{children}</span>
);
const Av = ({ initials, bg, size = 40, fontSize = 16 }: any) => (
  <div style={{ width: size, height: size, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: bg.includes("#0D1F1F") || bg.includes("#1A3535") ? TH.teal : "#fff", fontSize, flexShrink: 0, boxShadow: "0 3px 8px rgba(0,0,0,0.15)" }}>{initials}</div>
);

// ─── MAIN ──────────────────────────────────────────────────────────
export default function HomePanel() {
  const {
    cantieri, events, problemi, fattureDB, operatori: operatoriDB,
    sogliaDays, setTab, setSelectedCM,
    setShowProblemiView, setShowModal,
    giorniFermaCM, today, aziendaInfo,
  } = useMastro();

  const [showSpesa, setShowSpesa] = useState(false);

  const todayISO = today.toISOString().split("T")[0];
  const h = today.getHours();
  const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  const dataLabel = today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const commesseAttive = (cantieri || []).filter(c => c.fase !== "chiusura").length;
  const totFat = (fattureDB || []).filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
  const fmtK = (n: number) => "\u20AC" + (n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : n.toLocaleString("it-IT"));

  // DA FARE ORA
  const ferme = (cantieri || []).filter(c => c.fase !== "chiusura" && giorniFermaCM(c) >= sogliaDays);
  const prevDaFare = (cantieri || []).filter(c => c.fase === "preventivo");
  const probAperti = (problemi || []).filter(p => p.stato !== "risolto");
  const todayEvs = (events || []).filter(e => e.date === todayISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const fatScadute = (fattureDB || []).filter(f => !f.pagata && f.scadenza && f.scadenza < todayISO);

  const tasks: any[] = [];
  if (probAperti.length > 0) tasks.push({ titolo: "Problema: " + (probAperti[0].titolo || "da risolvere"), sotto: probAperti.length + " aperti", color: TH.red, action: () => setShowProblemiView(true) });
  if (ferme.length > 0) { const c = ferme[0]; tasks.push({ titolo: "Sblocca " + c.cliente, sotto: c.code + " \u00B7 ferma da " + giorniFermaCM(c) + " gg", color: TH.red, action: () => { setSelectedCM(c); setTab("commesse"); } }); }
  if (prevDaFare.length > 0) { const c = prevDaFare[0]; tasks.push({ titolo: "Preventivo: " + c.cliente, sotto: prevDaFare.length + " in attesa", color: TH.amber, action: () => { setSelectedCM(c); setTab("commesse"); } }); }
  if (todayEvs.length > 0) { const e = todayEvs[0]; tasks.push({ titolo: e.text, sotto: (e.time || "") + (e.persona ? " \u00B7 " + e.persona : ""), color: TH.teal, action: () => setTab("agenda") }); }

  // ALERT COUNTS
  const alertRitardi = ferme.length;
  const alertPagamenti = fatScadute.length;
  const alertMateriali = probAperti.filter(p => (p.titolo || "").toLowerCase().includes("material")).length;
  const alertProblemi = probAperti.length;

  // OPERATORI
  const ops = (operatoriDB && operatoriDB.length > 0) ? operatoriDB.map((op: any, idx: number) => ({
    ini: ((op.nome || "?")[0] + (op.cognome || "?")[0]).toUpperCase(),
    bg: AV_GRADS[idx % AV_GRADS.length],
    nome: (op.nome || "") + " " + (op.cognome || ""),
    ruolo: op.ruolo || "Operatore",
    status: op.stato_oggi || "offline",
    dot: op.stato_oggi === "online" || op.stato_oggi === "in cantiere" ? TH.green : op.stato_oggi === "in rilievo" ? TH.amber : TH.tealMuted,
    opacity: op.stato_oggi === "offline" ? 0.55 : 1,
  })) : [];
  const onlineCount = ops.filter(o => o.status !== "offline").length;

  // COMMESSE RECENTI
  const recenti = [...(cantieri || [])].sort((a, b) => String(b.updatedAt || b.id || "").localeCompare(String(a.updatedAt || a.id || ""))).slice(0, 3);
  const FASI = ["sopralluogo", "preventivo", "ordini", "montaggio", "fattura"];

  // Problema per commessa
  const cmProblema = (c: any) => {
    const gg = giorniFermaCM(c);
    if (gg >= sogliaDays) return { text: `cliente fermo da ${gg}gg`, color: TH.amber };
    const prob = (problemi || []).find(p => p.commessa_id === c.id && p.stato !== "risolto");
    if (prob) return { text: prob.titolo || "problema aperto", color: TH.red };
    const fat = (fattureDB || []).find(f => f.commessa_id === c.id && !f.pagata && f.scadenza && f.scadenza < todayISO);
    if (fat) return { text: "fattura scaduta", color: TH.red };
    return null;
  };

  return (
    <div style={{ fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif", background: TH.bg, minHeight: "100%", overflowX: "hidden" }}>

      {/* ═══ HEADER SCURO ═══ */}
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 18px) 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p suppressHydrationWarning style={{ margin: 0, fontSize: 11, color: TH.tealMuted }}>
              {dataLabel.charAt(0).toUpperCase() + dataLabel.slice(1)}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>
              {saluto}{aziendaInfo?.nome ? ", " + aziendaInfo.nome.split(" ")[0] : ""}
            </p>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(40,160,160,0.15)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(40,160,160,0.3)" }}>
            <svg width="22" height="22" viewBox="0 0 200 200" fill="none"><g><rect x="95" y="15" width="10" height="10" rx="2" fill="#2FA7A2"/><rect x="130" y="25" width="10" height="10" rx="2" fill="#7ED957"/><rect x="155" y="50" width="10" height="10" rx="2" fill="#F59E0B"/><rect x="165" y="95" width="10" height="10" rx="2" fill="#7ED957"/><rect x="155" y="140" width="10" height="10" rx="2" fill="#F59E0B"/><rect x="130" y="165" width="10" height="10" rx="2" fill="#7ED957"/><rect x="95" y="175" width="10" height="10" rx="2" fill="#2FA7A2"/><rect x="60" y="165" width="10" height="10" rx="2" fill="#F59E0B"/><rect x="35" y="140" width="10" height="10" rx="2" fill="#7ED957"/><rect x="25" y="95" width="10" height="10" rx="2" fill="#F59E0B"/><rect x="35" y="50" width="10" height="10" rx="2" fill="#7ED957"/><rect x="60" y="25" width="10" height="10" rx="2" fill="#F59E0B"/></g><g transform="rotate(8 100 100)"><rect x="55" y="55" width="90" height="90" rx="22" fill="#2FA7A2"/><path d="M70 70 L130 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/><path d="M130 70 L70 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/></g></svg>
          </div>
        </div>

        {/* ALERT GLOBALI */}
        {(alertRitardi > 0 || alertPagamenti > 0 || alertProblemi > 0) && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
            {alertRitardi > 0 && (
              <div onClick={() => setShowProblemiView(true)} style={{ background: TH.redLight, border: "1px solid rgba(226,75,74,0.5)", borderRadius: 10, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: TH.red, boxShadow: `0 0 8px rgba(226,75,74,0.6)`, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#F7C1C1", fontWeight: 700 }}>{alertRitardi} RITARD{alertRitardi === 1 ? "O" : "I"} OGGI</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 4 }}>
              {alertPagamenti > 0 && (
                <div onClick={() => setTab("contabilita")} style={{ flex: 1, background: TH.amberLight, border: "1px solid rgba(232,168,124,0.35)", borderRadius: 10, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8A87C", flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "#E8A87C", fontWeight: 700 }}>{alertPagamenti} PAGAMENT{alertPagamenti === 1 ? "O" : "I"}</span>
                </div>
              )}
              {alertProblemi > 0 && (
                <div onClick={() => setShowProblemiView(true)} style={{ flex: 1, background: "rgba(196,135,90,0.15)", border: "1px solid rgba(196,135,90,0.3)", borderRadius: 10, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: TH.amber, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "#D09560", fontWeight: 700 }}>{alertProblemi} PROBLEM{alertProblemi === 1 ? "A" : "I"}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* KPI CON CONTESTO */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, paddingBottom: 18 }}>
          <div onClick={() => setTab("commesse")} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "12px 10px", textAlign: "center", cursor: "pointer" }}>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{commesseAttive}</p>
            <p style={{ margin: "3px 0 0", fontSize: 9, color: TH.tealMuted }}>COMMESSE</p>
            {ferme.length > 0 && <p style={{ margin: "2px 0 0", fontSize: 9, color: TH.red, fontWeight: 600 }}>{ferme.length} problemi</p>}
          </div>
          <div onClick={() => setTab("altro")} style={{ flex: 1, background: "rgba(40,160,160,0.12)", border: "0.5px solid rgba(40,160,160,0.2)", borderRadius: 14, padding: "12px 10px", textAlign: "center", cursor: "pointer" }}>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: TH.teal, lineHeight: 1 }}>{onlineCount}</p>
            <p style={{ margin: "3px 0 0", fontSize: 9, color: TH.tealMuted }}>IN CAMPO</p>
            <p style={{ margin: "2px 0 0", fontSize: 9, color: TH.teal, fontWeight: 600 }}>{onlineCount > 0 ? "tutti ok" : "nessuno"}</p>
          </div>
          <div onClick={() => setTab("contabilita")} style={{ flex: 1, background: "rgba(232,168,124,0.1)", border: "0.5px solid rgba(232,168,124,0.2)", borderRadius: 14, padding: "12px 10px", textAlign: "center", cursor: "pointer" }}>
            <p style={{ margin: "3px 0 0", fontSize: 22, fontWeight: 700, color: "#E8A87C", lineHeight: 1 }}>{fmtK(totFat)}</p>
            <p style={{ margin: "3px 0 0", fontSize: 9, color: TH.tealMuted }}>SCOPERTO</p>
            {fatScadute.length > 0 && <p style={{ margin: "2px 0 0", fontSize: 9, color: TH.red, fontWeight: 600 }}>{fatScadute.length} scadut{fatScadute.length === 1 ? "o" : "i"}</p>}
          </div>
        </div>
      </div>

      {/* ═══ CONTENUTO CHIARO ═══ */}
      <div style={{ background: TH.bgLight, borderRadius: "28px 28px 0 0", minHeight: 500, padding: "18px 14px 100px" }}>

        {/* PRIORITÀ ORA */}
        <Card borderLeft={TH.red} style={{ marginBottom: 10 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ background: TH.red, color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.5px" }}>PRIORITÀ ORA</span>
          </div>

          {tasks.length === 0
            ? <p style={{ margin: 0, fontSize: 12, color: TH.sub, textAlign: "center", padding: "8px 0" }}>Nessuna azione urgente</p>
            : <>
              {/* TASK HERO */}
              <div style={{ background: "#FEF6F5", borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: "0.5px solid rgba(226,75,74,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: tasks[0].color, flexShrink: 0, boxShadow: `0 0 8px ${tasks[0].color}66` }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TH.ink }}>{tasks[0].titolo}</p>
                    <p style={{ margin: 0, fontSize: 12, color: tasks[0].color, fontWeight: 600 }}>{tasks[0].sotto}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <div onClick={tasks[0].action} style={{ flex: 1, background: TH.bg, color: TH.teal, fontSize: 11, fontWeight: 700, padding: "8px 0", borderRadius: 8, cursor: "pointer", textAlign: "center" }}>Apri</div>
                  <div onClick={tasks[0].action} style={{ flex: 1, background: TH.teal, color: "#fff", fontSize: 11, fontWeight: 700, padding: "8px 0", borderRadius: 8, cursor: "pointer", textAlign: "center" }}>Completa</div>
                </div>
              </div>

              {/* ALTRI TASK */}
              {tasks.slice(1).map((t, i) => (
                <div key={i} onClick={t.action} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", borderTop: i === 0 ? "none" : undefined }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, color: TH.ink, fontWeight: 500 }}>{t.titolo}</p>
                    <p style={{ margin: 0, fontSize: 11, color: TH.sub }}>{t.sotto}</p>
                  </div>
                  <span style={{ fontSize: 11, color: TH.sub }}>›</span>
                </div>
              ))}
            </>
          }
        </Card>

        {/* SQUADRA IN CAMPO */}
        <Card style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SecLabel>SQUADRA IN CAMPO</SecLabel>
            <Badge bg={`linear-gradient(135deg, ${TH.teal}, ${TH.tealDark})`} color="#fff">{onlineCount} attivi</Badge>
          </div>
          {ops.length === 0
            ? <p style={{ margin: 0, fontSize: 12, color: TH.sub, textAlign: "center", padding: "8px 0" }}>Nessun operatore configurato</p>
            : <div style={{ display: "flex", gap: 8 }}>
              {ops.map((op, i) => (
                <div key={i} style={{ flex: 1, background: "#F7F7F5", borderRadius: 12, padding: "12px 6px", textAlign: "center", opacity: op.opacity }}>
                  <Av initials={op.ini} bg={op.bg} size={34} fontSize={11} />
                  <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 600, color: TH.ink }}>{op.nome.split(" ")[0]}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 9, color: op.dot === TH.green ? TH.green : op.dot === TH.amber ? "#854F0B" : TH.tealMuted, fontWeight: 600 }}>{op.ruolo.toLowerCase()}</p>
                </div>
              ))}
            </div>
          }
        </Card>

        {/* COMMESSE */}
        <Card style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <SecLabel>COMMESSE</SecLabel>
            <span onClick={() => setTab("commesse")} style={{ fontSize: 12, color: TH.teal, fontWeight: 600, cursor: "pointer" }}>Tutte →</span>
          </div>
          {recenti.length === 0
            ? <p style={{ margin: 0, fontSize: 12, color: TH.sub, textAlign: "center", padding: "8px 0" }}>Nessuna commessa</p>
            : recenti.map((c, i) => {
              const fi = FASI.indexOf(c.fase);
              const ini = (c.cliente || "??").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const bg = AV_GRADS[i % AV_GRADS.length];
              const faseLabel = c.fase || "sopralluogo";
              const faseColors: Record<string, { bg: string; color: string }> = {
                sopralluogo: { bg: TH.greenLight, color: TH.green },
                preventivo: { bg: TH.greenLight, color: TH.green },
                ordini: { bg: "#FFF4E6", color: "#854F0B" },
                montaggio: { bg: "#FFF4E6", color: "#854F0B" },
                fattura: { bg: TH.greenLight, color: "#085041" },
                chiusura: { bg: TH.greenLight, color: "#085041" },
              };
              const fc = faseColors[faseLabel] || faseColors.sopralluogo;
              const prob = cmProblema(c);
              const isLast = i === recenti.length - 1;
              return (
                <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                  style={{ padding: "10px 0", borderBottom: isLast ? "none" : `0.5px solid ${TH.border}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Av initials={ini} bg={bg} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: TH.ink }}>{c.cliente}</p>
                      <p style={{ margin: 0, fontSize: 11, color: TH.sub }}>{c.indirizzo || "—"} · {(c.vani || []).length || 0} vani</p>
                    </div>
                    <span style={{ background: fc.bg, color: fc.color, fontSize: 9, padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>{faseLabel}</span>
                  </div>
                  {prob && (
                    <div style={{ marginTop: 5, marginLeft: 52, display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: prob.color }} />
                      <span style={{ fontSize: 10, color: prob.color, fontWeight: 600 }}>{prob.text}</span>
                    </div>
                  )}
                </div>
              );
            })
          }
        </Card>

        {/* AZIONI COMPATTE */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div onClick={() => setShowModal("commessa")} style={{ flex: 1, background: TH.bg, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: TH.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <I d={ICO.folder} s={14} c="#fff" />
            </div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#fff" }}>Nuova commessa</p>
          </div>
          <div onClick={() => setShowSpesa(true)} style={{ flex: 1, background: TH.bg, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: TH.amber, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <I d={ICO.wallet} s={14} c="#fff" />
            </div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#fff" }}>Spesa</p>
          </div>
        </div>

        {/* SUGGERIMENTO AI */}
        {tasks.length > 0 && (
          <div onClick={tasks[0].action} style={{ background: `linear-gradient(145deg, #163333, ${TH.bg})`, borderRadius: 14, padding: "12px 16px", marginBottom: 14, border: `0.5px solid rgba(40,160,160,0.2)`, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TH.teal} strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span style={{ fontSize: 9, color: TH.tealMuted, fontWeight: 700, letterSpacing: "0.5px" }}>SUGGERIMENTO</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#fff", fontWeight: 500, lineHeight: 1.4 }}>
              {tasks[0].titolo}. <span style={{ color: TH.teal, fontWeight: 700 }}>{tasks[0].sotto}</span>
            </p>
          </div>
        )}

      </div>

      {showSpesa && <SpesaQuick onClose={() => setShowSpesa(false)} />}
    </div>
  );
}
