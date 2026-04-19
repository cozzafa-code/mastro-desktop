"use client";
// @ts-nocheck
// MASTRO ERP — AgendaPanel v3 — fliwoX Approved Mockup
import React from "react";
import { useMastro } from "./MastroContext";
import { ICO, I } from "./mastro-constants";

// ─── COLORI ────────────────────────────────────────────────────────────────────
const T_CLR = "#28A0A0";
const T_DARK = "#156060";
const T_LIGHT = "#EEF8F8";
const INK = "#0D1F1F";
const SUB = "#4A7070";
const BDR = "#C8E4E4";
const BLU = "#3B7FE0";
const BLD = "#1A5AAA";
const AMB = "#D08008";
const AMD = "#7A4800";
const RED = "#DC4444";
const GRN = "#1A9E73";

// ─── TIPI EVENTO → colore/label ───────────────────────────────────────────────
const TIPO_CFG: Record<string, { label: string; bg: string; border: string; shadow: string; textColor: string }> = {
  montaggio:   { label: "MONTAGGIO",   bg: "rgba(40,160,160,.10)",  border: "rgba(40,160,160,.25)",  shadow: "rgba(40,160,160,.2)",  textColor: T_DARK },
  sopralluogo: { label: "SOPRALLUOGO", bg: "rgba(59,127,224,.08)",  border: "rgba(59,127,224,.20)",  shadow: "rgba(59,127,224,.2)",  textColor: BLD },
  rilievo:     { label: "RILIEVO",     bg: "rgba(208,128,8,.08)",   border: "rgba(208,128,8,.20)",   shadow: "rgba(208,128,8,.2)",   textColor: AMD },
  default:     { label: "EVENTO",      bg: "rgba(40,160,160,.08)",  border: "rgba(40,160,160,.20)",  shadow: "rgba(40,160,160,.2)",  textColor: T_CLR },
};

const getTipoCfg = (ev: any) => {
  if (ev._isMontaggio) return TIPO_CFG.montaggio;
  const tipo = (ev.tipo || ev.type || "").toLowerCase();
  return TIPO_CFG[tipo] || TIPO_CFG.default;
};

const getTipoColor = (ev: any) => {
  if (ev._isMontaggio) return T_CLR;
  if (ev._isScadenza) return ev._tipo === "incasso" ? GRN : AMB;
  const tipo = (ev.tipo || ev.type || "").toLowerCase();
  if (tipo === "sopralluogo") return BLU;
  if (tipo === "rilievo") return AMB;
  return ev.color || T_CLR;
};

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const IcoPlus = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round">
    <path d="M12 4v16M4 12h16"/>
  </svg>
);
const IcoChevL = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T_CLR} strokeWidth="2.5" strokeLinecap="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);
const IcoChevR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T_CLR} strokeWidth="2.5" strokeLinecap="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const dateStr = (d: Date) => d.toISOString().split("T")[0];
const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GG = ["L","M","M","G","V","S","D"];
// fix testo corrotto da encoding UTF-16
const fixText = (s: string) => (s || "").replace(/â€"/g, "–").replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"').replace(/Ã /g, "à").replace(/Ã©/g, "é").replace(/Ã¨/g, "è").replace(/Ã¬/g, "ì").replace(/Ã²/g, "ò").replace(/Ã¹/g, "ù");

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
const NavBtn = ({ onClick, children }: any) => (
  <div onClick={onClick} style={{ width: 36, height: 36, background: T_LIGHT, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${BDR}`, boxShadow: `0 4px 0 0 #A8CCCC`, cursor: "pointer", flexShrink: 0 }}>
    {children}
  </div>
);

const TipoBadge = ({ cfg }: { cfg: typeof TIPO_CFG["default"] }) => (
  <div style={{ display: "inline-block", background: cfg.bg, borderRadius: 20, padding: "3px 10px", boxShadow: `0 2px 0 0 ${cfg.shadow}`, marginBottom: 6 }}>
    <span style={{ fontSize: 10, fontWeight: 800, color: cfg.textColor }}>{cfg.label}</span>
  </div>
);

const Avatar = ({ ini, bg }: { ini: string; bg: string }) => (
  <div style={{ width: 24, height: 24, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "white", border: "2px solid white", flexShrink: 0 }}>
    {ini}
  </div>
);

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function AgendaPanel() {
  const {
    agendaView, cantieri, deleteEvent, events, montaggiDB, fattureDB, fatturePassive,
    ordiniFornDB, squadreDB, selDate, selectedEvent,
    setAgendaView, setSelDate, setSelectedCM, setSelectedEvent, setShowNewEvent, setTab,
    agendaFilters,
  } = useMastro();

  const todayStr = dateStr(new Date());

  // merge tutti gli items
  const montaggiItems = (montaggiDB || []).filter(m => m.data).map(m => {
    const sq = (squadreDB || []).find(s => s.id === m.squadraId);
    return { id: "mag_" + m.id, date: m.data, time: m.orario || "08:00", text: (m.cliente || "Montaggio"), persona: m.cliente || "", cm: m.cmCode || "", color: T_CLR, durata: (m.giorni || 1) * 480, _isMontaggio: true, _stato: m.stato, _squadra: sq, _vani: m.vani || 0 };
  });
  const scadenzeItems = [
    ...(fattureDB || []).filter(f => !f.pagata && f.scadenza).map(f => ({ id: "scad_e_" + f.id, date: f.scadenza, time: "", text: "Incasso " + f.cliente, persona: f.cliente, cm: f.cmCode || "", color: GRN, _isScadenza: true, _importo: f.importo, _tipo: "incasso" })),
    ...(fatturePassive || []).filter(f => !f.pagata && f.scadenza).map(f => ({ id: "scad_p_" + f.id, date: f.scadenza, time: "", text: "Pagamento " + (typeof f.fornitore === "object" ? f.fornitore?.nome : f.fornitore || ""), color: AMB, _isScadenza: true, _importo: f.importo || 0, _tipo: "pagamento" })),
  ];
  const allItems = [...events, ...montaggiItems, ...scadenzeItems];

  const eventsOn = (d: Date) => allItems.filter(e => e.date === dateStr(d));
  const dayEvents = allItems.filter(e => e.date === dateStr(selDate)).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));

  const navDate = (dir: number) => {
    const d = new Date(selDate);
    if (agendaView === "giorno") d.setDate(d.getDate() + dir);
    else if (agendaView === "settimana") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setSelDate(d);
  };

  // settimana
  const weekStart = new Date(selDate);
  const dow = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1));
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });

  // settimana items raggruppati per giorno (solo giorni con eventi)
  const weekGrouped = weekDays
    .map(d => ({ d, evts: eventsOn(d) }))
    .filter(g => g.evts.length > 0);

  // mese
  const monthStart = new Date(selDate.getFullYear(), selDate.getMonth(), 1);
  const firstDow = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const daysInMonth = new Date(selDate.getFullYear(), selDate.getMonth() + 1, 0).getDate();
  const calCells = Array.from({ length: firstDow + daysInMonth }, (_, i) => {
    if (i < firstDow) return null;
    return new Date(selDate.getFullYear(), selDate.getMonth(), i - firstDow + 1);
  });

  // prossimi (vista mese)
  const prossimi = allItems.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99").localeCompare(b.time || "99")).slice(0, 3);

  // ── RENDER EVENT CARD (giorno/settimana) ──────────────────────────────────
  const renderEventCard = (ev: any) => {
    const cfg = getTipoCfg(ev);
    const clr = getTipoColor(ev);
    const montSq = ev._isMontaggio && ev._squadra;
    return (
      <div key={ev.id} onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}
        style={{ background: "white", borderRadius: 14, border: `1.5px solid ${BDR}`, padding: "12px 14px", boxShadow: "0 5px 0 0 #A8CCCC", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: montSq ? 8 : 0 }}>
          <div style={{ flex: 1 }}>
            <TipoBadge cfg={cfg} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: INK }}>{fixText(ev.text)}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: SUB }}>{fixText(ev.persona)}{ev.cm ? " · " + ev.cm : ""}{ev.time ? " · " + ev.time : ""}</p>
          </div>
          {ev._isMontaggio && ev.durata && (
            <div style={{ background: T_CLR, borderRadius: 9, padding: "4px 8px", boxShadow: `0 3px 0 0 ${T_DARK}`, flexShrink: 0, marginLeft: 8 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: "white" }}>{Math.round(ev.durata / 60)}h</p>
            </div>
          )}
        </div>
        {montSq && (
          <div style={{ background: "rgba(255,255,255,.7)", borderRadius: 9, padding: "8px 10px", border: `1px solid rgba(40,160,160,.2)` }}>
            <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 800, color: SUB, textTransform: "uppercase" as any }}>Squadra montaggio</p>
            <div style={{ display: "flex", flexDirection: "column" as any, gap: 5 }}>
              {(montSq.membri || []).slice(0, 3).map((m: any, mi: number) => (
                <div key={mi} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar ini={(m.nome || "?").slice(0, 2).toUpperCase()} bg={mi === 0 ? "#1A7878" : "#1060A0"} />
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: INK }}>{m.nome}</p>
                  <div style={{ marginLeft: "auto", background: mi === 0 ? "rgba(40,160,160,.15)" : T_LIGHT, borderRadius: 6, padding: "2px 8px", border: mi === 0 ? "none" : `1px solid ${BDR}` }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: mi === 0 ? T_DARK : SUB }}>{mi === 0 ? "Capo squadra" : "Aiuto"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {ev._isScadenza && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: SUB }}>{ev._tipo === "incasso" ? "Da incassare" : "Da pagare"}: <b style={{ color: clr }}>€{(ev._importo || 0).toLocaleString("it-IT")}</b></p>
        )}
      </div>
    );
  };

  // ── VISTA MESE ────────────────────────────────────────────────────────────
  const renderMese = () => (
    <div style={{ display: "flex", flexDirection: "column" as any, gap: 12 }}>
      {/* navigazione mese */}
      <div style={{ background: "white", borderRadius: 14, border: `1.5px solid ${BDR}`, boxShadow: `0 7px 0 0 #A8CCCC`, padding: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <NavBtn onClick={() => navDate(-1)}><IcoChevL /></NavBtn>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: INK }}>{MESI[selDate.getMonth()]} {selDate.getFullYear()}</p>
          <NavBtn onClick={() => navDate(1)}><IcoChevR /></NavBtn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
          {GG.map((g, i) => <p key={i} style={{ margin: 0, textAlign: "center", fontSize: 10, fontWeight: 800, color: i === 6 ? "rgba(220,68,68,.7)" : SUB }}>{g}</p>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {calCells.map((d, i) => {
            if (!d) return <div key={i} />;
            const iso = dateStr(d);
            const isToday = iso === todayStr;
            const isSel = iso === dateStr(selDate);
            const evts = eventsOn(d);
            const isSun = d.getDay() === 0;
            const isSat = d.getDay() === 6;
            return (
              <div key={i} onClick={() => { setSelDate(new Date(d)); setAgendaView("giorno"); }}
                style={{ padding: 3, textAlign: "center", borderRadius: 9, cursor: "pointer",
                  background: isToday ? T_CLR : isSel ? "rgba(40,160,160,.1)" : "transparent",
                  boxShadow: isToday ? `0 3px 0 0 ${T_DARK}` : "none",
                  border: isSel && !isToday ? `1.5px solid rgba(40,160,160,.25)` : "none" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: isToday || evts.length > 0 ? 900 : 700, lineHeight: "1.5", color: isToday ? "white" : isSun ? "rgba(220,68,68,.6)" : isSat ? SUB : INK }}>{d.getDate()}</p>
                {evts.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 1 }}>
                    {evts.slice(0, 3).map((ev, ei) => {
                      const c = ev._isMontaggio ? T_CLR : ((ev.tipo || "").toLowerCase() === "sopralluogo" ? BLU : AMB);
                      return <span key={ei} style={{ width: 5, height: 5, borderRadius: "50%", background: isToday ? "white" : c, display: "inline-block" }} />;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* legenda */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10 }}>
          {[{ c: T_CLR, l: "Montaggio" }, { c: BLU, l: "Sopralluogo" }, { c: AMB, l: "Rilievo" }].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.c, display: "inline-block" }} />
              <span style={{ fontSize: 10, color: SUB, fontWeight: 600 }}>{item.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* prossimi eventi */}
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: INK, padding: "0 2px" }}>Prossimi eventi</p>
      {prossimi.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", padding: 16 }}>Nessun evento in programma</p>
      ) : prossimi.map(ev => {
        const cfg = getTipoCfg(ev);
        const clr = getTipoColor(ev);
        return (
          <div key={ev.id} onClick={() => setSelectedEvent(ev)}
            style={{ background: "white", borderRadius: 16, border: `1.5px solid ${BDR}`, boxShadow: `0 5px 0 0 #A8CCCC`, padding: "14px 16px", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 0 0 ${cfg.shadow}` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2.2" strokeLinecap="round">
                  {ev._isMontaggio ? <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/> : <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: INK }}>{ev.text}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: SUB }}>{ev.persona}{ev.cm ? " · " + ev.cm : ""}{ev.date ? " · " + new Date(ev.date + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : ""}{ev.time ? " · " + ev.time : ""}</p>
              </div>
              <NavBtn onClick={() => {}}><IcoChevR /></NavBtn>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── VISTA SETTIMANA ────────────────────────────────────────────────────────
  const renderSettimana = () => {
    const wLabel = `${weekDays[0].getDate()} ${MESI[weekDays[0].getMonth()].slice(0,3)} – ${weekDays[6].getDate()} ${MESI[weekDays[6].getMonth()].slice(0,3)} ${weekDays[6].getFullYear()}`;
    return (
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 12 }}>
        {/* header settimana */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <NavBtn onClick={() => navDate(-1)}><IcoChevL /></NavBtn>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: INK }}>{wLabel}</p>
          <NavBtn onClick={() => navDate(1)}><IcoChevR /></NavBtn>
        </div>
        {/* 7 giorni */}
        <div style={{ background: "white", borderRadius: 14, border: `1.5px solid ${BDR}`, boxShadow: `0 7px 0 0 #A8CCCC`, padding: "14px 12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {weekDays.map((d, i) => {
              const iso = dateStr(d);
              const isToday = iso === todayStr;
              const isSel = iso === dateStr(selDate);
              const evts = eventsOn(d);
              const isSun = d.getDay() === 0;
              const isSat = d.getDay() === 6;
              return (
                <div key={i} onClick={() => { setSelDate(new Date(d)); }} style={{ display: "flex", flexDirection: "column" as any, alignItems: "center", gap: 5, cursor: "pointer" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: isToday ? 900 : 700, color: isToday ? T_CLR : isSun ? "rgba(220,68,68,.6)" : SUB }}>{GG[i]}</p>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: isToday ? T_CLR : isSel ? T_LIGHT : T_LIGHT, border: isToday ? "none" : `1.5px solid ${BDR}`, boxShadow: isToday ? `0 4px 0 0 ${T_DARK}` : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: isToday ? 900 : 700, color: isToday ? "white" : isSun ? "rgba(220,68,68,.5)" : INK }}>{d.getDate()}</p>
                  </div>
                  {evts.length > 0 ? (
                    <div style={{ display: "flex", gap: 2 }}>
                      {evts.slice(0, 2).map((ev, ei) => {
                        const c = ev._isMontaggio ? T_CLR : ((ev.tipo || "").toLowerCase() === "sopralluogo" ? BLU : AMB);
                        return <span key={ei} style={{ width: 5, height: 5, borderRadius: "50%", background: c, display: "inline-block" }} />;
                      })}
                    </div>
                  ) : <div style={{ height: 5 }} />}
                </div>
              );
            })}
          </div>
        </div>
        {/* eventi raggruppati per giorno */}
        {weekGrouped.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", padding: 16 }}>Nessun evento questa settimana</p>
        ) : weekGrouped.map(({ d, evts }) => {
          const iso = dateStr(d);
          const isToday = iso === todayStr;
          const label = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
          const dotClr = isToday ? T_CLR : BLU;
          return (
            <div key={iso}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotClr, boxShadow: isToday ? `0 2px 0 0 ${T_DARK}` : "none" }} />
                <p style={{ margin: 0, fontSize: isToday ? 12 : 13, fontWeight: isToday ? 900 : 800, color: isToday ? T_CLR : INK }}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}{isToday ? " · oggi" : ""}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as any, gap: 8 }}>
                {evts.map(ev => renderEventCard(ev))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── VISTA GIORNO ──────────────────────────────────────────────────────────
  const renderGiorno = () => {
    const dayLabel = selDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
    const weekNum = Math.ceil((selDate.getDate() + new Date(selDate.getFullYear(), selDate.getMonth(), 1).getDay()) / 7);
    return (
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 12 }}>
        {/* nav giorno */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <NavBtn onClick={() => navDate(-1)}><IcoChevL /></NavBtn>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: INK }}>{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
            <p style={{ margin: 0, fontSize: 10, color: SUB }}>settimana {weekNum}</p>
          </div>
          <NavBtn onClick={() => navDate(1)}><IcoChevR /></NavBtn>
        </div>
        {/* timeline */}
        <div style={{ background: "white", borderRadius: 18, border: `1.5px solid ${BDR}`, boxShadow: `0 7px 0 0 #A8CCCC`, padding: 16 }}>
          {dayEvents.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", padding: "12px 0" }}>Nessun evento oggi</p>
          ) : dayEvents.map((ev, idx) => {
            const clr = getTipoColor(ev);
            const isLast = idx === dayEvents.length - 1;
            const nextEv = dayEvents[idx + 1];
            return (
              <div key={ev.id} style={{ display: "flex", gap: 10, marginBottom: isLast ? 0 : 14, paddingBottom: isLast ? 0 : 14, borderBottom: isLast ? "none" : `1px solid ${T_LIGHT}` }}>
                {/* colonna orario + barra */}
                <div style={{ display: "flex", flexDirection: "column" as any, alignItems: "center", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: SUB, width: 38, textAlign: "center" }}>{ev.time || "—"}</p>
                  <div style={{ width: 2, flex: 1, background: clr, borderRadius: 2, margin: "4px 0", minHeight: ev._isMontaggio ? 70 : 44 }} />
                  {nextEv?.time && <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: SUB, width: 38, textAlign: "center" }}>{nextEv.time}</p>}
                </div>
                {/* card evento */}
                <div style={{ flex: 1 }}>
                  {renderEventCard(ev)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  const views = ["mese", "settimana", "giorno"] as const;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", backgroundColor: "#D8EEEE", backgroundImage: "linear-gradient(rgba(40,160,160,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,.18) 1px,transparent 1px)", backgroundSize: "24px 24px", minHeight: "100%", paddingBottom: 100 }}>

      {/* TOPBAR */}
      <div style={{ background: INK, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "white", flex: 1 }}>Agenda</p>
        {dayEvents.length > 0 && agendaView === "giorno" && (
          <div style={{ background: "rgba(40,160,160,.2)", borderRadius: 10, padding: "6px 12px", boxShadow: "0 3px 0 0 rgba(21,96,96,.4)" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: T_CLR }}>{dayEvents.length} eventi</p>
          </div>
        )}
        <div onClick={() => setShowNewEvent(true)} style={{ width: 36, height: 36, background: "rgba(40,160,160,.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 0 0 rgba(21,96,96,.4)", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T_CLR} strokeWidth="2.2" strokeLinecap="round"><path d="M12 4v16M4 12h16"/></svg>
        </div>
      </div>

      {/* TAB SWITCH */}
      <div style={{ display: "flex", background: "white", borderBottom: `3px solid ${BDR}` }}>
        {views.map(v => {
          const active = agendaView === v;
          const label = v.charAt(0).toUpperCase() + v.slice(1);
          return (
            <div key={v} onClick={() => setAgendaView(v)}
              style={{ flex: 1, padding: "11px 4px", textAlign: "center", fontSize: 12, fontWeight: active ? 900 : 700, cursor: "pointer", background: active ? T_CLR : "white", color: active ? "white" : SUB, borderBottom: active ? `3px solid ${T_DARK}` : "none" }}>
              {label}
            </div>
          );
        })}
      </div>

      {/* BODY */}
      <div style={{ padding: 14 }}>
        {agendaView === "mese" && renderMese()}
        {agendaView === "settimana" && renderSettimana()}
        {agendaView === "giorno" && renderGiorno()}

        {/* NUOVO EVENTO */}
        <div style={{ marginTop: 14 }}>
          <button onClick={() => setShowNewEvent(true)} style={{ width: "100%", background: T_CLR, border: "none", borderRadius: 16, padding: 17, fontSize: 16, fontWeight: 900, color: "white", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 0 0 ${T_DARK}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
            <IcoPlus />
            Nuovo evento
          </button>
        </div>
      </div>
    </div>
  );
}
