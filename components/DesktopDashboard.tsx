"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO HQ — Centro di Controllo Totale v2
// fliwoX Design System · 3D Shadows · Real-time Context Data
// Enterprise Control Room — costoso, preciso, vivo
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from "react";
import { useMastro } from "./MastroContext";

// ── fliwoX DESIGN SYSTEM (IMMUTABILE) ─────────────────────────
const DS = {
  teal: '#28A0A0', tealDark: '#156060', tealHover: '#115E59',
  dark: '#0D1F1F', ink: '#0D1F1F',
  light: '#EEF8F8', bg: '#E8F4F4',
  border: '#C8E4E4', white: '#FFFFFF',
  red: '#DC4444', green: '#1A9E73', amber: '#F59E0B',
  blue: '#3B7FE0', purple: '#8B5CF6', pink: '#EC4899',
  orange: '#F97316',
};
const FM = "'JetBrains Mono','SF Mono','Fira Code',monospace";
const FF = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";

// ── HELPERS ────────────────────────────────────────────────────
const fmtE = (n) => "€" + Math.round(n).toLocaleString("it-IT");
const fmtK = (n) => n >= 1000 ? "€" + Math.round(n / 1000) + "k" : fmtE(n);
const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;
const daysTo = (d) => Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
const TODAY = new Date().toISOString().split("T")[0];

const FASI = ["sopralluogo","preventivo","conferma","misure","ordini","produzione","posa","chiusura"];
const FASE_LABEL = { sopralluogo:"Sopralluogo", preventivo:"Preventivo", conferma:"Conferma", misure:"Misure", ordini:"Ordini", produzione:"Produzione", posa:"Posa", chiusura:"Chiusura" };
const FASE_COLOR = { sopralluogo:DS.blue, preventivo:DS.amber, conferma:DS.teal, misure:DS.purple, ordini:DS.red, produzione:DS.orange, posa:DS.green, chiusura:"#6B7280" };

// ── 3D CARD STYLE ──────────────────────────────────────────────
const card3d = {
  background: DS.white, borderRadius: 14, border: `1px solid ${DS.border}`,
  boxShadow: `0 5px 0 ${DS.border}, 0 8px 16px rgba(0,0,0,0.07)`,
  overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s',
};
const card3dHover = (e) => { e.currentTarget.style.boxShadow = `0 7px 0 ${DS.teal}, 0 10px 20px rgba(0,0,0,0.1)`; e.currentTarget.style.transform = 'translateY(-2px)'; };
const card3dLeave = (e) => { e.currentTarget.style.boxShadow = `0 5px 0 ${DS.border}, 0 8px 16px rgba(0,0,0,0.07)`; e.currentTarget.style.transform = 'none'; };

const btn3d = (bg, shadow) => ({
  padding: '11px 20px', fontSize: 12, fontWeight: 700, color: DS.white, background: bg,
  border: 'none', borderRadius: 10, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  fontFamily: FF, boxShadow: `0 4px 0 ${shadow}, 0 6px 10px rgba(0,0,0,0.12)`, transition: 'transform 0.08s',
});
const press = (e) => { e.currentTarget.style.transform = 'translateY(3px)'; };
const release = (e) => { e.currentTarget.style.transform = 'none'; };

// ── MICRO COMPONENTS ───────────────────────────────────────────
function Dot({ color, size = 7 }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
}

function MiniBar({ value, max, color }) {
  return (
    <div style={{ height: 5, borderRadius: 3, background: DS.light, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${Math.min(pct(value, max), 100)}%`, background: color, borderRadius: 3, transition: 'width .4s ease' }} />
    </div>
  );
}

function WHead({ title, badge, badgeColor, dot, onAction, actionLabel }) {
  return (
    <div style={{ padding: '13px 18px', borderBottom: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: DS.dark, display: 'flex', alignItems: 'center', gap: 8 }}>
        {dot && <Dot color={dot} />}
        {title}
        {badge && <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 20, background: (badgeColor || DS.teal) + '15', color: badgeColor || DS.tealDark, fontWeight: 700 }}>{badge}</span>}
      </div>
      {onAction && <button onClick={onAction} style={{ fontSize: 10, color: DS.teal, fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', fontFamily: FF }}>
        {actionLabel || 'Vedi tutto →'}</button>}
    </div>
  );
}

function RowItem({ label, value, color, onClick, sub }) {
  return (
    <div onClick={onClick} style={{
      padding: '10px 18px', borderBottom: `1px solid ${DS.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      cursor: onClick ? 'pointer' : 'default', transition: 'background 0.1s', fontSize: 12, color: DS.dark,
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = DS.light)}
      onMouseLeave={e => (e.currentTarget.style.background = DS.white)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {color && <Dot color={color} size={6} />}
        <div>
          <span style={{ fontSize: 12, color: DS.dark }}>{label}</span>
          {sub && <div style={{ fontSize: 9, color: DS.tealDark, marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      <span style={{ fontWeight: 800, fontFamily: FM, fontSize: 16, color: color || DS.dark }}>{value}</span>
    </div>
  );
}

// ── SEMAFORO AZIENDA ───────────────────────────────────────────
function semaforoAzienda(ferme, attive, fattScadute, problemi) {
  const pFerme = attive > 0 ? (ferme / attive) * 100 : 0;
  if (pFerme > 25 || fattScadute > 3 || problemi > 5) return { color: DS.red, label: "CRITICITÀ OPERATIVE", glow: `0 0 20px ${DS.red}60` };
  if (pFerme > 10 || fattScadute > 0 || problemi > 0) return { color: DS.amber, label: "ATTENZIONE RICHIESTA", glow: `0 0 20px ${DS.amber}60` };
  return { color: DS.green, label: "SOTTO CONTROLLO", glow: `0 0 20px ${DS.green}60` };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DesktopDashboard() {
  const {
    T, cantieri = [], fattureDB = [], ordiniFornDB = [], montaggiDB = [],
    tasks = [], msgs = [], team = [], problemi = [], aziendaInfo,
    setTab, setSelectedCM, setFilterFase, giorniFermaCM, sogliaDays = 7,
  } = useMastro();

  const [showCriticita, setShowCriticita] = useState(true);

  // ── COMPUTED DATA ──────────────────────────────────────────
  const D = useMemo(() => {
    const attive = cantieri.filter(c => c.fase !== "chiusura");
    const ferme = attive.filter(c => giorniFermaCM(c) >= sogliaDays);
    const confermati = attive.filter(c => ["conferma","misure","ordini","produzione","posa"].includes(c.fase));
    const totPipeline = attive.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
    const totConfermato = confermati.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);

    const fattNonPagate = fattureDB.filter(f => !f.pagata);
    const daIncassare = fattNonPagate.reduce((s, f) => s + (f.importo || 0), 0);
    const fattScadute = fattureDB.filter(f => !f.pagata && f.scadenza && f.scadenza < TODAY);
    const totScaduto = fattScadute.reduce((s, f) => s + (f.importo || 0), 0);
    const fattTot = fattureDB.reduce((s, f) => s + (f.importo || 0), 0);

    const problemiAperti = (problemi || []).filter(p => p.stato !== "risolto");
    const montaggiOggi = montaggiDB.filter(m => m.data === TODAY);
    const taskOggi = tasks.filter(t => !t.done && t.date === TODAY);
    const msgNonLetti = msgs.filter(m => !m.letto).length;

    const inProduzione = attive.filter(c => c.fase === "produzione");
    const inPosa = attive.filter(c => c.fase === "posa");
    const inOrdini = attive.filter(c => c.fase === "ordini");

    // Criticità auto-generate
    const criticita = [];
    ferme.sort((a, b) => giorniFermaCM(b) - giorniFermaCM(a)).slice(0, 5).forEach(c => {
      const gg = giorniFermaCM(c);
      criticita.push({
        id: `f-${c.id}`, gravita: gg >= 30 ? "alta" : "media",
        titolo: `${c.cliente} ${c.cognome || ""} — ferma ${gg}gg`,
        dettaglio: `${FASE_LABEL[c.fase] || c.fase} · ${c.code}`,
        impatto: c.euro ? fmtK(parseFloat(c.euro)) : "—",
        color: gg >= 30 ? DS.red : DS.amber,
        onClick: () => { setSelectedCM(c); setTab("commesse"); },
      });
    });
    fattScadute.slice(0, 3).forEach(f => {
      criticita.push({
        id: `ft-${f.id}`, gravita: "alta",
        titolo: `Fattura scaduta — ${f.cliente || f.numero || "—"}`,
        dettaglio: `Scaduta da ${Math.abs(daysTo(f.scadenza))}gg`,
        impatto: fmtE(f.importo || 0), color: DS.red,
        onClick: () => setTab("contabilita"),
      });
    });
    problemiAperti.slice(0, 3).forEach(p => {
      criticita.push({
        id: `p-${p.id}`, gravita: p.priorita === "alta" ? "alta" : "media",
        titolo: p.titolo || "Problema aperto",
        dettaglio: `${p.tipo || ""}${p.commessa ? ` · ${p.commessa}` : ""}`,
        impatto: "Da risolvere", color: p.priorita === "alta" ? DS.red : DS.amber,
      });
    });

    const LIMIT7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const consegne7 = cantieri.filter(c => c.dataConsegna && c.dataConsegna >= TODAY && c.dataConsegna <= LIMIT7 && c.fase !== "chiusura");
    const montaggi7 = montaggiDB.filter(m => m.data >= TODAY && m.data <= LIMIT7);
    const ordFornAttivi = (ordiniFornDB || []).filter(o => o.stato === "inviato");

    const pratiche = { p50: cantieri.filter(c => c.detrazione === "50"), p65: cantieri.filter(c => c.detrazione === "65"), p75: cantieri.filter(c => c.detrazione === "75") };

    return {
      attive, ferme, confermati, totPipeline, totConfermato,
      daIncassare, fattScadute, totScaduto, fattNonPagate, fattTot,
      problemiAperti, montaggiOggi, taskOggi, msgNonLetti,
      inProduzione, inPosa, inOrdini, criticita,
      consegne7, montaggi7, ordFornAttivi, pratiche,
    };
  }, [cantieri, fattureDB, ordiniFornDB, montaggiDB, tasks, msgs, team, problemi, sogliaDays]);

  const semaforo = semaforoAzienda(D.ferme.length, D.attive.length, D.fattScadute.length, D.problemiAperti.length);
  const NOW = new Date();
  const h = NOW.getHours();
  const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  const nomeAzienda = aziendaInfo?.ragione || aziendaInfo?.nome || "Walter Cozza Serramenti";

  return (
    <div style={{ height: "100%", overflowY: "auto", background: DS.bg, fontFamily: FF }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px 40px" }}>

        {/* ═══ HERO TOPBAR ══════════════════════════════════════ */}
        <div style={{
          background: DS.dark, borderRadius: '0 0 18px 18px', padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
          marginBottom: 18,
          boxShadow: `0 6px 0 ${DS.tealDark}, 0 10px 30px rgba(0,0,0,0.2)`,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: semaforo.color, boxShadow: semaforo.glow }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: semaforo.color, textTransform: 'uppercase', letterSpacing: 1.5 }}>{semaforo.label}</span>
              <span style={{ fontSize: 10, color: '#ffffff40', marginLeft: 10 }}>{NOW.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.white, letterSpacing: -0.5 }}>
              {saluto}, {nomeAzienda}
            </h1>
            <div style={{ fontSize: 12, color: '#ffffff70', marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{D.attive.length} commesse attive</span>
              <span style={{ color: '#ffffff30' }}>·</span>
              <span>{D.montaggiOggi.length} montaggi oggi</span>
              <span style={{ color: '#ffffff30' }}>·</span>
              {D.ferme.length > 0
                ? <span style={{ color: DS.red, fontWeight: 700 }}>{D.ferme.length} ferme</span>
                : <span style={{ color: DS.green }}>nessuna ferma</span>}
              {D.fattScadute.length > 0 && <>
                <span style={{ color: '#ffffff30' }}>·</span>
                <span style={{ color: DS.amber, fontWeight: 700 }}>{fmtK(D.totScaduto)} scaduti</span>
              </>}
            </div>
          </div>

          {/* Quick action buttons */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button style={btn3d(DS.teal, DS.tealDark)} onMouseDown={press} onMouseUp={release} onClick={() => setTab("commesse")}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 2v10M2 7h10" /></svg>
              Commessa
            </button>
            <button style={btn3d(DS.blue, '#2563EB')} onMouseDown={press} onMouseUp={release} onClick={() => setTab("calendario")}>
              Agenda
            </button>
            <button style={btn3d(D.criticita.length > 0 ? DS.red : DS.green, D.criticita.length > 0 ? '#B91C1C' : DS.tealDark)} onMouseDown={press} onMouseUp={release} onClick={() => setShowCriticita(v => !v)}>
              {D.criticita.length} Criticità
            </button>
          </div>
        </div>

        {/* ═══ ALERT STRIP ══════════════════════════════════════ */}
        {(D.ferme.length > 0 || D.fattScadute.length > 0 || D.problemiAperti.length > 0) && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {D.ferme.length > 0 && (
              <div onClick={() => setTab("commesse")} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10,
                background: DS.white, border: `1.5px solid ${DS.red}40`, cursor: 'pointer',
                boxShadow: `0 3px 0 ${DS.border}, 0 4px 8px rgba(0,0,0,0.05)`,
              }}>
                <Dot color={DS.red} />
                <span style={{ fontSize: 12, fontWeight: 700, color: DS.red }}>{D.ferme.length} commesse ferme · {pct(D.ferme.length, D.attive.length)}% — sblocca subito</span>
              </div>
            )}
            {D.fattScadute.length > 0 && (
              <div onClick={() => setTab("contabilita")} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10,
                background: DS.white, border: `1.5px solid ${DS.amber}40`, cursor: 'pointer',
                boxShadow: `0 3px 0 ${DS.border}, 0 4px 8px rgba(0,0,0,0.05)`,
              }}>
                <Dot color={DS.amber} />
                <span style={{ fontSize: 12, fontWeight: 700, color: DS.amber }}>{D.fattScadute.length} fatture scadute · {fmtK(D.totScaduto)}</span>
              </div>
            )}
            {D.problemiAperti.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10,
                background: DS.white, border: `1.5px solid ${DS.red}40`,
                boxShadow: `0 3px 0 ${DS.border}, 0 4px 8px rgba(0,0,0,0.05)`,
              }}>
                <Dot color={DS.red} />
                <span style={{ fontSize: 12, fontWeight: 700, color: DS.red }}>{D.problemiAperti.length} problemi aperti</span>
              </div>
            )}
          </div>
        )}

        {/* ═══ KPI ROW ══════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 18 }}>
          {[
            { l: "Commesse attive", v: D.attive.length, sub: `${D.confermati.length} confermate`, c: DS.blue, pV: D.confermati.length, pO: D.attive.length, click: () => setTab("commesse") },
            { l: "Ferme", v: D.ferme.length, sub: `soglia ${sogliaDays}gg`, c: D.ferme.length > 0 ? DS.red : DS.green, alert: D.ferme.length > 0, click: () => setTab("commesse") },
            { l: "Pipeline", v: fmtK(D.totPipeline), sub: `${fmtK(D.totConfermato)} confermato`, c: DS.green, pV: D.totConfermato, pO: D.totPipeline },
            { l: "Da incassare", v: fmtK(D.daIncassare), sub: `${D.fattScadute.length} scadute`, c: D.daIncassare > 0 ? DS.amber : DS.green, alert: D.fattScadute.length > 0, click: () => setTab("contabilita") },
            { l: "Messaggi", v: D.msgNonLetti, sub: `${msgs.length} totali`, c: D.msgNonLetti > 0 ? DS.blue : DS.teal, click: () => setTab("messaggi") },
            { l: "Oggi", v: D.montaggiOggi.length + D.taskOggi.length, sub: `${D.montaggiOggi.length} montaggi · ${D.taskOggi.length} task`, c: DS.purple, click: () => setTab("calendario") },
          ].map(k => (
            <div key={k.l} onClick={k.click} style={{
              ...card3d, padding: '16px 18px', cursor: k.click ? 'pointer' : 'default',
              borderColor: k.alert ? k.c + '40' : DS.border,
            }}
              onMouseEnter={k.click ? card3dHover : undefined}
              onMouseLeave={k.click ? card3dLeave : undefined}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: DS.tealDark, marginBottom: 6 }}>{k.l}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: k.c, fontFamily: FM, lineHeight: 1 }}>{k.v}</div>
              <div style={{ fontSize: 9, color: DS.tealDark, marginTop: 4 }}>{k.sub}</div>
              {k.pO !== undefined && <MiniBar value={k.pV} max={Math.max(k.pO, 1)} color={k.c} />}
              {k.pO !== undefined && <div style={{ fontSize: 8, color: DS.tealDark, marginTop: 3 }}>{pct(k.pV, k.pO)}% confermato</div>}
            </div>
          ))}
        </div>

        {/* ═══ CRITICITÀ ════════════════════════════════════════ */}
        {D.criticita.length > 0 && showCriticita && (
          <div style={{ ...card3d, marginBottom: 18, borderColor: DS.red + '30' }}>
            <WHead title="Criticità prioritarie" badge={`${D.criticita.length}`} badgeColor={DS.red} dot={DS.red} />
            {D.criticita.map(cr => (
              <div key={cr.id} onClick={cr.onClick} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px',
                borderBottom: `1px solid ${DS.border}`, cursor: cr.onClick ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => cr.onClick && (e.currentTarget.style.background = DS.light)}
                onMouseLeave={e => (e.currentTarget.style.background = DS.white)}>
                <div style={{ width: 5, height: 32, borderRadius: 3, background: cr.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: DS.dark }}>{cr.titolo}</div>
                  <div style={{ fontSize: 10, color: DS.tealDark, marginTop: 2 }}>{cr.dettaglio}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: cr.color, fontFamily: FM }}>{cr.impatto}</div>
                </div>
                {cr.onClick && <span style={{ fontSize: 9, padding: '4px 10px', borderRadius: 6, border: `1px solid ${DS.border}`, color: DS.teal, fontWeight: 700, flexShrink: 0 }}>Apri →</span>}
              </div>
            ))}
          </div>
        )}

        {/* ═══ MAIN GRID ═══════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>

          {/* ── COL 1 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Pipeline */}
            <div style={card3d} onMouseEnter={card3dHover} onMouseLeave={card3dLeave}>
              <WHead title="Pipeline commesse" badge={`${D.attive.length} attive`} dot={DS.blue} onAction={() => setTab("commesse")} />
              <div style={{ padding: '14px 18px' }}>
                <div style={{ height: 8, borderRadius: 4, background: DS.light, display: 'flex', overflow: 'hidden', marginBottom: 12 }}>
                  {FASI.map(fase => {
                    const n = cantieri.filter(c => c.fase === fase).length;
                    if (!n) return null;
                    return <div key={fase} style={{ flex: n, background: FASE_COLOR[fase], minWidth: 4 }} title={`${FASE_LABEL[fase]}: ${n}`} />;
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {FASI.filter(f => f !== "chiusura").map(fase => {
                    const items = cantieri.filter(c => c.fase === fase);
                    const euro = items.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
                    const col = FASE_COLOR[fase];
                    return (
                      <div key={fase} onClick={() => { setFilterFase(fase); setTab("commesse"); }}
                        style={{ padding: '10px 12px', borderRadius: 10, background: DS.light, border: `1px solid ${DS.border}`, cursor: 'pointer', transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = col; e.currentTarget.style.background = DS.white; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = DS.light; }}>
                        <div style={{ fontSize: 9, color: DS.tealDark, fontWeight: 600 }}>{FASE_LABEL[fase]}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FM, color: items.length > 0 ? col : DS.tealDark, lineHeight: 1, marginTop: 2 }}>{items.length}</div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: col, marginTop: 3 }}>{pct(items.length, cantieri.length)}%</div>
                        {euro > 0 && <div style={{ fontSize: 8, color: DS.tealDark, marginTop: 1 }}>{fmtK(euro)}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Controllo Economico */}
            <div style={card3d} onMouseEnter={card3dHover} onMouseLeave={card3dLeave}>
              <WHead title="Controllo economico" dot={DS.green} onAction={() => setTab("contabilita")} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {[
                  { l: "Pipeline", v: fmtK(D.totPipeline), c: DS.dark },
                  { l: "Confermato", v: fmtK(D.totConfermato), c: DS.teal },
                  { l: "Da incassare", v: fmtK(D.daIncassare), c: DS.amber },
                  { l: "Scaduto", v: fmtK(D.totScaduto), c: D.totScaduto > 0 ? DS.red : DS.green },
                ].map((k, i) => (
                  <div key={k.l} style={{ padding: '14px 18px', borderBottom: i < 2 ? `1px solid ${DS.border}` : 'none', borderRight: i % 2 === 0 ? `1px solid ${DS.border}` : 'none' }}>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: DS.tealDark, marginBottom: 4 }}>{k.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: k.c, fontFamily: FM, lineHeight: 1 }}>{k.v}</div>
                  </div>
                ))}
              </div>
              {D.fattScadute.length > 0 && D.fattScadute.slice(0, 3).map(f => (
                <div key={f.id} onClick={() => setTab("contabilita")} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 18px',
                  borderTop: `1px solid ${DS.border}`, cursor: 'pointer', fontSize: 12, transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = DS.light)}
                  onMouseLeave={e => (e.currentTarget.style.background = DS.white)}>
                  <span style={{ color: DS.dark, fontWeight: 600 }}>{f.cliente || f.numero || "—"}</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontWeight: 800, color: DS.amber, fontFamily: FM }}>{fmtK(f.importo || 0)}</span>
                    <span style={{ fontWeight: 700, color: DS.red, fontSize: 11 }}>-{Math.abs(daysTo(f.scadenza))}gg</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Produzione */}
            <div style={card3d} onMouseEnter={card3dHover} onMouseLeave={card3dLeave}>
              <WHead title="Produzione e ordini" badge={`${D.inProduzione.length} attive`} badgeColor={DS.orange} dot={DS.orange} onAction={() => setTab("produzione")} />
              <RowItem label="In produzione" value={D.inProduzione.length} color={DS.orange} onClick={() => setTab("produzione")} />
              <RowItem label="Attesa ordini" value={D.inOrdini.length} color={DS.amber} onClick={() => setTab("ordini")} />
              <RowItem label="Pronte per posa" value={D.inPosa.length} color={DS.green} onClick={() => setTab("montaggi")} />
              <RowItem label="Ordini fornitori" value={D.ordFornAttivi.length} color={DS.blue} onClick={() => setTab("ordini")} />
            </div>
          </div>

          {/* ── COL 2 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Oggi + 7gg */}
            <div style={card3d} onMouseEnter={card3dHover} onMouseLeave={card3dLeave}>
              <WHead title="Oggi e prossimi 7 giorni" dot={DS.purple} onAction={() => setTab("calendario")} actionLabel="Agenda →" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                {[
                  { n: D.montaggiOggi.length, l: "montaggi oggi", c: DS.purple },
                  { n: D.taskOggi.length, l: "task oggi", c: DS.amber },
                  { n: D.montaggi7.length, l: "montaggi 7gg", c: DS.blue },
                  { n: D.consegne7.length, l: "consegne 7gg", c: DS.green },
                ].map((t, i) => (
                  <div key={t.l} style={{ textAlign: 'center', padding: '14px 8px', borderRight: i < 3 ? `1px solid ${DS.border}` : 'none' }}>
                    <div style={{ fontSize: 26, fontWeight: 900, fontFamily: FM, color: t.c, lineHeight: 1 }}>{t.n}</div>
                    <div style={{ fontSize: 8, color: DS.tealDark, marginTop: 4, fontWeight: 600 }}>{t.l}</div>
                  </div>
                ))}
              </div>
              {D.montaggiOggi.length > 0 && D.montaggiOggi.slice(0, 4).map(m => (
                <div key={m.id} style={{ padding: '9px 18px', borderTop: `1px solid ${DS.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: DS.dark }}>{m.cliente || "—"}</div>
                  <div style={{ fontSize: 10, color: DS.tealDark, marginTop: 1 }}>{m.orario || ""}{m.indirizzo ? ` · ${m.indirizzo}` : ""}</div>
                </div>
              ))}
            </div>

            {/* Commesse da sbloccare */}
            <div style={{ ...card3d, borderColor: D.ferme.length > 0 ? DS.red + '40' : DS.border }}
              onMouseEnter={card3dHover} onMouseLeave={card3dLeave}>
              <WHead title="Commesse da sbloccare" badge={D.ferme.length > 0 ? `${D.ferme.length} ferme` : ""} badgeColor={DS.red} dot={D.ferme.length > 0 ? DS.red : DS.green} onAction={D.ferme.length > 0 ? () => setTab("commesse") : undefined} />
              {D.ferme.length === 0
                ? <div style={{ padding: '20px 18px', fontSize: 12, color: DS.tealDark, textAlign: 'center' }}>Tutto in ordine ✓</div>
                : D.ferme.slice(0, 6).map(c => {
                    const gg = giorniFermaCM(c);
                    const col = gg >= 30 ? DS.red : gg >= 15 ? DS.orange : DS.amber;
                    return (
                      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: `1px solid ${DS.border}`, cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = DS.light)}
                        onMouseLeave={e => (e.currentTarget.style.background = DS.white)}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: col + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: col, flexShrink: 0 }}>{(c.cliente || "?")[0]}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: DS.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.cliente} {c.cognome || ""}</div>
                          <div style={{ fontSize: 10, color: DS.tealDark, marginTop: 1 }}>{FASE_LABEL[c.fase] || c.fase}{c.euro ? ` · ${fmtK(parseFloat(c.euro))}` : ""}</div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: col, fontFamily: FM }}>{gg}gg</div>
                      </div>
                    );
                  })
              }
            </div>

            {/* Team */}
            <div style={card3d} onMouseEnter={card3dHover} onMouseLeave={card3dLeave}>
              <WHead title="Team — adesso" dot={DS.teal} onAction={() => setTab("team")} />
              {(team.length > 0 ? team : [{ id: "1", nome: "Titolare", ruolo: "Titolare" }]).map((m, i) => {
                const inCantiere = montaggiDB.some(mt => mt.operatoreId === m.id && mt.data === TODAY);
                const tc = tasks.filter(t => t.assegnatoA === m.id && !t.done).length;
                return (
                  <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: `1px solid ${DS.border}` }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: DS.teal + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: DS.teal, flexShrink: 0 }}>{(m.nome || "?")[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: DS.dark }}>{m.nome}</div>
                      <div style={{ fontSize: 10, color: DS.tealDark, marginTop: 1 }}>{m.ruolo || "—"}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {inCantiere && <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: DS.green + '15', color: DS.green, fontWeight: 700 }}>Cantiere</span>}
                      {tc > 0 && <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: DS.amber + '15', color: DS.amber, fontWeight: 700 }}>{tc} task</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pratiche fiscali */}
            <div style={card3d} onMouseEnter={card3dHover} onMouseLeave={card3dLeave}>
              <WHead title="Pratiche fiscali" dot={DS.blue} onAction={() => setTab("enea")} />
              <RowItem label="Ristrutturazione 50%" value={D.pratiche.p50.length} color={DS.teal} onClick={() => setTab("enea")} />
              <RowItem label="Ecobonus 65%" value={D.pratiche.p65.length} color={DS.blue} onClick={() => setTab("enea")} />
              <RowItem label="Barriere 75%" value={D.pratiche.p75.length} color={DS.purple} onClick={() => setTab("enea")} />
            </div>

            {/* Problemi */}
            {D.problemiAperti.length > 0 && (
              <div style={{ ...card3d, borderColor: DS.red + '30' }} onMouseEnter={card3dHover} onMouseLeave={card3dLeave}>
                <WHead title="Problemi aperti" badge={`${D.problemiAperti.length}`} badgeColor={DS.red} dot={DS.red} />
                {D.problemiAperti.slice(0, 4).map((p, i) => (
                  <div key={p.id || i} style={{ padding: '10px 18px', borderBottom: `1px solid ${DS.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: DS.dark }}>{p.titolo || "—"}</span>
                      <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: p.priorita === "alta" ? DS.red + '15' : DS.amber + '15', color: p.priorita === "alta" ? DS.red : DS.amber, fontWeight: 700 }}>{p.priorita || "—"}</span>
                    </div>
                    <div style={{ fontSize: 10, color: DS.tealDark, marginTop: 2 }}>{p.tipo || ""}{p.commessa ? ` · ${p.commessa}` : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
