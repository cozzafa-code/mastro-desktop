"use client";
// @ts-nocheck
// MASTRO ERP — AgendaPanel v4 — Restyled "Sistema Operativo"
import React from "react";
import { useMastro } from "./MastroContext";
import { ICO, I } from "./mastro-constants";

// ─── THEME ─────────────────────────────────────────────────────────
const TH = {
  bg: "#0D1F1F", bgLight: "#F5F4F0", card: "#fff",
  teal: "#28A0A0", tealDark: "#1D7A7A", tealMuted: "#5A8A8A",
  ink: "#1A1A18", sub: "#B0B0A8", border: "#F0EFEC",
  red: "#E24B4A", amber: "#C4875A", green: "#0F6E56",
  greenLight: "#E1F5EE", blu: "#3572A5",
};

// ─── TIPI EVENTO → colore/label ───────────────────────────────────
const TIPO_CFG: Record<string, { label: string; bg: string; color: string }> = {
  montaggio:   { label: "MONTAGGIO",   bg: "rgba(40,160,160,.1)",  color: TH.tealDark },
  sopralluogo: { label: "SOPRALLUOGO", bg: "rgba(53,114,165,.08)", color: TH.blu },
  rilievo:     { label: "RILIEVO",     bg: "rgba(196,135,90,.1)",  color: "#854F0B" },
  default:     { label: "EVENTO",      bg: "rgba(40,160,160,.08)", color: TH.teal },
};
const getTipoCfg = (ev: any) => {
  if (ev._isMontaggio) return TIPO_CFG.montaggio;
  const tipo = (ev.tipo || ev.type || "").toLowerCase();
  return TIPO_CFG[tipo] || TIPO_CFG.default;
};
const getTipoColor = (ev: any) => {
  if (ev._isMontaggio) return TH.teal;
  if (ev._isScadenza) return ev._tipo === "incasso" ? TH.green : TH.amber;
  const tipo = (ev.tipo || ev.type || "").toLowerCase();
  if (tipo === "sopralluogo") return TH.blu;
  if (tipo === "rilievo") return TH.amber;
  return ev.color || TH.teal;
};

// ─── HELPERS ──────────────────────────────────────────────────────
const dateStr = (d: Date) => d.toISOString().split("T")[0];
const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GG = ["L","M","M","G","V","S","D"];
const fixText = (s: string) => (s || "").replace(/â€"/g, "–").replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"').replace(/Ã /g, "à").replace(/Ã©/g, "é").replace(/Ã¨/g, "è").replace(/Ã¬/g, "ì").replace(/Ã²/g, "ò").replace(/Ã¹/g, "ù");

// ─── SUB-COMPONENTS ──────────────────────────────────────────────
const NavBtn = ({ onClick, children }: any) => (
  <div onClick={onClick} style={{ width: 34, height: 34, background: "rgba(255,255,255,0.06)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
    {children}
  </div>
);
const NavBtnLight = ({ onClick, children }: any) => (
  <div onClick={onClick} style={{ width: 34, height: 34, background: TH.card, border: `0.5px solid ${TH.border}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
    {children}
  </div>
);
const IcoChevL = ({ color = TH.teal }: any) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
);
const IcoChevR = ({ color = TH.teal }: any) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
);

// ─── MAIN ────────────────────────────────────────────────────────
export default function AgendaPanel() {
  const {
    agendaView, cantieri, deleteEvent, events, montaggiDB, fattureDB, fatturePassive,
    ordiniFornDB, squadreDB, selDate, selectedEvent,
    setAgendaView, setSelDate, setSelectedCM, setSelectedEvent, setShowNewEvent, setTab,
    agendaFilters,
  } = useMastro();

  const todayStr = dateStr(new Date());

  const montaggiItems = (montaggiDB || []).filter(m => m.data).map(m => {
    const sq = (squadreDB || []).find(s => s.id === m.squadraId);
    return { id: "mag_" + m.id, date: m.data, time: m.orario || "08:00", text: (m.cliente || "Montaggio"), persona: m.cliente || "", cm: m.cmCode || "", color: TH.teal, durata: (m.giorni || 1) * 480, _isMontaggio: true, _stato: m.stato, _squadra: sq, _vani: m.vani || 0 };
  });
  const scadenzeItems = [
    ...(fattureDB || []).filter(f => !f.pagata && f.scadenza).map(f => ({ id: "scad_e_" + f.id, date: f.scadenza, time: "", text: "Incasso " + f.cliente, persona: f.cliente, cm: f.cmCode || "", color: TH.green, _isScadenza: true, _importo: f.importo, _tipo: "incasso" })),
    ...(fatturePassive || []).filter(f => !f.pagata && f.scadenza).map(f => ({ id: "scad_p_" + f.id, date: f.scadenza, time: "", text: "Pagamento " + (typeof f.fornitore === "object" ? f.fornitore?.nome : f.fornitore || ""), color: TH.amber, _isScadenza: true, _importo: f.importo || 0, _tipo: "pagamento" })),
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

  const weekStart = new Date(selDate);
  const dow = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1));
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const weekGrouped = weekDays.map(d => ({ d, evts: eventsOn(d) })).filter(g => g.evts.length > 0);

  const monthStart = new Date(selDate.getFullYear(), selDate.getMonth(), 1);
  const firstDow = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const daysInMonth = new Date(selDate.getFullYear(), selDate.getMonth() + 1, 0).getDate();
  const calCells = Array.from({ length: firstDow + daysInMonth }, (_, i) => {
    if (i < firstDow) return null;
    return new Date(selDate.getFullYear(), selDate.getMonth(), i - firstDow + 1);
  });
  const prossimi = allItems.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99").localeCompare(b.time || "99")).slice(0, 3);

  // ── RENDER EVENT CARD ──
  const renderEventCard = (ev: any) => {
    const cfg = getTipoCfg(ev);
    const clr = getTipoColor(ev);
    const montSq = ev._isMontaggio && ev._squadra;
    return (
      <div key={ev.id} onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}
        style={{ background: TH.card, borderRadius: 14, padding: "12px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: montSq ? 8 : 0 }}>
          <div style={{ flex: 1 }}>
            <span style={{ display: "inline-block", background: cfg.bg, borderRadius: 6, padding: "2px 8px", marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
            </span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: TH.ink }}>{fixText(ev.text)}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: TH.sub }}>{fixText(ev.persona)}{ev.cm ? " · " + ev.cm : ""}{ev.time ? " · " + ev.time : ""}</p>
          </div>
          {ev._isMontaggio && ev.durata && (
            <div style={{ background: TH.teal, borderRadius: 8, padding: "4px 8px", flexShrink: 0, marginLeft: 8 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#fff" }}>{Math.round(ev.durata / 60)}h</p>
            </div>
          )}
        </div>
        {montSq && (
          <div style={{ background: "#F7F7F5", borderRadius: 10, padding: "8px 10px", marginTop: 4 }}>
            <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: TH.sub, letterSpacing: "0.5px" }}>SQUADRA</p>
            <div style={{ display: "flex", flexDirection: "column" as any, gap: 5 }}>
              {(montSq.membri || []).slice(0, 3).map((m: any, mi: number) => (
                <div key={mi} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: mi === 0 ? TH.teal : TH.blu, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {(m.nome || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: TH.ink }}>{m.nome}</p>
                  <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: mi === 0 ? TH.green : TH.sub, background: mi === 0 ? TH.greenLight : "#F0EFEC", padding: "2px 6px", borderRadius: 4 }}>
                    {mi === 0 ? "Capo" : "Aiuto"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {ev._isScadenza && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: TH.sub }}>{ev._tipo === "incasso" ? "Da incassare" : "Da pagare"}: <b style={{ color: clr }}>€{(ev._importo || 0).toLocaleString("it-IT")}</b></p>
        )}
      </div>
    );
  };

  // ── VISTA MESE ──
  const renderMese = () => (
    <div style={{ display: "flex", flexDirection: "column" as any, gap: 12 }}>
      <div style={{ background: TH.card, borderRadius: 16, padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <NavBtnLight onClick={() => navDate(-1)}><IcoChevL /></NavBtnLight>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: TH.ink }}>{MESI[selDate.getMonth()]} {selDate.getFullYear()}</p>
          <NavBtnLight onClick={() => navDate(1)}><IcoChevR /></NavBtnLight>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
          {GG.map((g, i) => <p key={i} style={{ margin: 0, textAlign: "center", fontSize: 10, fontWeight: 600, color: i === 6 ? "rgba(226,75,74,.6)" : TH.sub }}>{g}</p>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {calCells.map((d, i) => {
            if (!d) return <div key={i} />;
            const iso = dateStr(d);
            const isToday = iso === todayStr;
            const isSel = iso === dateStr(selDate);
            const evts = eventsOn(d);
            const isSun = d.getDay() === 0;
            return (
              <div key={i} onClick={() => { setSelDate(new Date(d)); setAgendaView("giorno"); }}
                style={{ padding: 3, textAlign: "center", borderRadius: 8, cursor: "pointer",
                  background: isToday ? TH.teal : isSel ? "rgba(40,160,160,.08)" : "transparent",
                  border: isSel && !isToday ? "0.5px solid rgba(40,160,160,.2)" : "none" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: isToday || evts.length > 0 ? 600 : 400, lineHeight: "1.5", color: isToday ? "#fff" : isSun ? "rgba(226,75,74,.5)" : TH.ink }}>{d.getDate()}</p>
                {evts.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 1 }}>
                    {evts.slice(0, 3).map((ev, ei) => {
                      const c = ev._isMontaggio ? TH.teal : ((ev.tipo || "").toLowerCase() === "sopralluogo" ? TH.blu : TH.amber);
                      return <span key={ei} style={{ width: 4, height: 4, borderRadius: "50%", background: isToday ? "#fff" : c, display: "inline-block" }} />;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10 }}>
          {[{ c: TH.teal, l: "Montaggio" }, { c: TH.blu, l: "Sopralluogo" }, { c: TH.amber, l: "Rilievo" }].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: item.c, display: "inline-block" }} />
              <span style={{ fontSize: 10, color: TH.sub, fontWeight: 500 }}>{item.l}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TH.ink, padding: "0 2px" }}>Prossimi eventi</p>
      {prossimi.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: TH.sub, textAlign: "center", padding: 16 }}>Nessun evento in programma</p>
      ) : prossimi.map(ev => {
        const cfg = getTipoCfg(ev);
        const clr = getTipoColor(ev);
        return (
          <div key={ev.id} onClick={() => setSelectedEvent(ev)}
            style={{ background: TH.card, borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round">
                  {ev._isMontaggio ? <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/> : <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: TH.ink }}>{ev.text}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: TH.sub }}>{ev.persona}{ev.cm ? " · " + ev.cm : ""}{ev.date ? " · " + new Date(ev.date + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : ""}{ev.time ? " · " + ev.time : ""}</p>
              </div>
              <span style={{ fontSize: 14, color: TH.sub }}>›</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── VISTA SETTIMANA ──
  const renderSettimana = () => {
    const wLabel = `${weekDays[0].getDate()} ${MESI[weekDays[0].getMonth()].slice(0,3)} – ${weekDays[6].getDate()} ${MESI[weekDays[6].getMonth()].slice(0,3)} ${weekDays[6].getFullYear()}`;
    return (
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <NavBtnLight onClick={() => navDate(-1)}><IcoChevL /></NavBtnLight>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TH.ink }}>{wLabel}</p>
          <NavBtnLight onClick={() => navDate(1)}><IcoChevR /></NavBtnLight>
        </div>
        <div style={{ background: TH.card, borderRadius: 16, padding: "14px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {weekDays.map((d, i) => {
              const iso = dateStr(d);
              const isToday = iso === todayStr;
              const isSel = iso === dateStr(selDate);
              const evts = eventsOn(d);
              const isSun = d.getDay() === 0;
              return (
                <div key={i} onClick={() => setSelDate(new Date(d))} style={{ display: "flex", flexDirection: "column" as any, alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 500, color: isToday ? TH.teal : isSun ? "rgba(226,75,74,.5)" : TH.sub }}>{GG[i]}</p>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: isToday ? TH.teal : "transparent", border: isSel && !isToday ? `0.5px solid ${TH.teal}` : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? "#fff" : isSun ? "rgba(226,75,74,.5)" : TH.ink }}>{d.getDate()}</p>
                  </div>
                  {evts.length > 0 ? (
                    <div style={{ display: "flex", gap: 2 }}>
                      {evts.slice(0, 2).map((ev, ei) => {
                        const c = ev._isMontaggio ? TH.teal : ((ev.tipo || "").toLowerCase() === "sopralluogo" ? TH.blu : TH.amber);
                        return <span key={ei} style={{ width: 4, height: 4, borderRadius: "50%", background: c, display: "inline-block" }} />;
                      })}
                    </div>
                  ) : <div style={{ height: 4 }} />}
                </div>
              );
            })}
          </div>
        </div>
        {weekGrouped.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: TH.sub, textAlign: "center", padding: 16 }}>Nessun evento questa settimana</p>
        ) : weekGrouped.map(({ d, evts }) => {
          const iso = dateStr(d);
          const isToday = iso === todayStr;
          const label = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
          return (
            <div key={iso}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: isToday ? TH.teal : TH.sub }} />
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: isToday ? TH.teal : TH.ink }}>
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

  // ── VISTA GIORNO ──
  const renderGiorno = () => {
    const dayLabel = selDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
    return (
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <NavBtnLight onClick={() => navDate(-1)}><IcoChevL /></NavBtnLight>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TH.ink }}>{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
          </div>
          <NavBtnLight onClick={() => navDate(1)}><IcoChevR /></NavBtnLight>
        </div>
        <div style={{ background: TH.card, borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {dayEvents.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: TH.sub, textAlign: "center", padding: "12px 0" }}>Nessun evento oggi</p>
          ) : dayEvents.map((ev, idx) => {
            const clr = getTipoColor(ev);
            const isLast = idx === dayEvents.length - 1;
            return (
              <div key={ev.id} style={{ display: "flex", gap: 10, marginBottom: isLast ? 0 : 14, paddingBottom: isLast ? 0 : 14, borderBottom: isLast ? "none" : `0.5px solid ${TH.border}` }}>
                <div style={{ display: "flex", flexDirection: "column" as any, alignItems: "center", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: TH.sub, width: 38, textAlign: "center" }}>{ev.time || "—"}</p>
                  <div style={{ width: 2, flex: 1, background: clr, borderRadius: 2, margin: "4px 0", minHeight: ev._isMontaggio ? 70 : 44, opacity: 0.4 }} />
                </div>
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

  // ── RENDER ──
  const views = ["mese", "settimana", "giorno"] as const;

  return (
    <div style={{ fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif", background: TH.bgLight, minHeight: "100%", paddingBottom: 100 }}>

      {/* TOPBAR SCURO */}
      <div style={{ background: TH.bg, padding: "calc(env(safe-area-inset-top, 0px) + 14px) 18px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <svg width="22" height="22" viewBox="0 0 200 200" fill="none"><g><rect x="95" y="15" width="10" height="10" rx="2" fill="#2FA7A2"/><rect x="130" y="25" width="10" height="10" rx="2" fill="#7ED957"/><rect x="155" y="50" width="10" height="10" rx="2" fill="#F59E0B"/><rect x="165" y="95" width="10" height="10" rx="2" fill="#7ED957"/><rect x="155" y="140" width="10" height="10" rx="2" fill="#F59E0B"/><rect x="130" y="165" width="10" height="10" rx="2" fill="#7ED957"/><rect x="95" y="175" width="10" height="10" rx="2" fill="#2FA7A2"/><rect x="60" y="165" width="10" height="10" rx="2" fill="#F59E0B"/><rect x="35" y="140" width="10" height="10" rx="2" fill="#7ED957"/><rect x="25" y="95" width="10" height="10" rx="2" fill="#F59E0B"/><rect x="35" y="50" width="10" height="10" rx="2" fill="#7ED957"/><rect x="60" y="25" width="10" height="10" rx="2" fill="#F59E0B"/></g><g transform="rotate(8 100 100)"><rect x="55" y="55" width="90" height="90" rx="22" fill="#2FA7A2"/><path d="M70 70 L130 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/><path d="M130 70 L70 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/></g></svg>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", flex: 1 }}>Agenda</p>
        {dayEvents.length > 0 && agendaView === "giorno" && (
          <span style={{ background: "rgba(40,160,160,.2)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: TH.teal }}>{dayEvents.length} eventi</span>
        )}
        <div onClick={() => setShowNewEvent(true)} style={{ width: 34, height: 34, borderRadius: 10, background: TH.teal, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 2px 8px rgba(40,160,160,0.4)` }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
      </div>

      {/* TAB SWITCH */}
      <div style={{ display: "flex", background: TH.bg, padding: "0 18px 14px", gap: 4 }}>
        {views.map(v => {
          const active = agendaView === v;
          const label = v.charAt(0).toUpperCase() + v.slice(1);
          return (
            <div key={v} onClick={() => setAgendaView(v)}
              style={{ flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
                background: active ? "rgba(40,160,160,0.2)" : "transparent",
                color: active ? TH.teal : TH.tealMuted,
                borderRadius: 10 }}>
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

        <div style={{ marginTop: 14 }}>
          <button onClick={() => setShowNewEvent(true)} style={{ width: "100%", background: TH.bg, border: "none", borderRadius: 14, padding: 16, fontSize: 14, fontWeight: 700, color: TH.teal, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TH.teal} strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Nuovo evento
          </button>
        </div>
      </div>
    </div>
  );
}
