"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO HQ — Enterprise Dashboard v4
// Dark theme · Teal/Cyan accents · Mini charts · Dense data
// Based on approved Stitch AI mockup
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";

// ── DARK PALETTE ───────────────────────────────────────────────
const C = {
  bg:      '#0B0E11',
  card:    '#12161C',
  cardL:   '#181D25',
  border:  '#1E2530',
  borderL: '#252D3A',
  ink:     '#F0F2F5',
  text:    '#C8CDD5',
  sub:     '#6B7280',
  hint:    '#4B5563',
  teal:    '#2DD4BF',
  tealD:   '#0D9488',
  tealBg:  '#0D948815',
  cyan:    '#22D3EE',
  purple:  '#A78BFA',
  purpleBg:'#A78BFA15',
  red:     '#EF4444',
  redBg:   '#EF444415',
  amber:   '#F59E0B',
  amberBg: '#F59E0B15',
  green:   '#10B981',
  greenBg: '#10B98115',
  blue:    '#3B82F6',
  blueBg:  '#3B82F615',
  orange:  '#F97316',
  orangeBg:'#F9731615',
  white:   '#FFFFFF',
};
const FM = "'JetBrains Mono','SF Mono','Fira Code',monospace";
const FF = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";

// ── HELPERS ────────────────────────────────────────────────────
const fmtE = (n) => "€" + Math.round(n).toLocaleString("it-IT");
const fmtK = (n) => n >= 10000 ? "€" + Math.round(n/1000) + "k" : n >= 1000 ? "€" + (n/1000).toFixed(1) + "k" : fmtE(n);
const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;
const daysTo = (d) => Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
const TODAY = new Date().toISOString().split("T")[0];

const FASI = ["sopralluogo","preventivo","conferma","misure","ordini","produzione","posa","chiusura"];
const FL = { sopralluogo:"Sopralluogo", preventivo:"Preventivo", conferma:"Conferma", misure:"Misure", ordini:"Ordini", produzione:"Produzione", posa:"Posa", chiusura:"Chiusura" };
const FC = { sopralluogo:C.blue, preventivo:C.amber, conferma:C.teal, misure:C.purple, ordini:C.red, produzione:C.orange, posa:C.green, chiusura:C.hint };

// ── STYLES ─────────────────────────────────────────────────────
const card = { background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' };
const head = { padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` };
const headT = { fontSize: 13, fontWeight: 700, color: C.ink, display: 'flex', alignItems: 'center', gap: 10 };
const link = { fontSize: 11, fontWeight: 600, color: C.teal, cursor: 'pointer', background: 'none', border: 'none', fontFamily: FF };
const badge = (c, bg) => ({ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: c, background: bg, display: 'inline-flex', alignItems: 'center', gap: 5 });
const dot = (c, s = 8) => ({ width: s, height: s, borderRadius: '50%', background: c, flexShrink: 0, display: 'inline-block' });
const row = { display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: `1px solid ${C.border}`, gap: 12, transition: 'background 0.15s', cursor: 'pointer' };
const rowH = (e) => { e.currentTarget.style.background = C.cardL; };
const rowL = (e) => { e.currentTarget.style.background = 'transparent'; };
const avatar = (c, s = 34) => ({ width: s, height: s, borderRadius: 8, background: c + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: s * 0.38, fontWeight: 800, color: c, flexShrink: 0 });
const btn = (bg) => ({ padding: '8px 18px', fontSize: 12, fontWeight: 700, color: C.bg, background: bg, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: FF, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s' });

// ── MINI SPARKLINE SVG ─────────────────────────────────────────
function Spark({ data, color, w = 80, h = 28 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── MINI BAR ───────────────────────────────────────────────────
function Bar({ value, max, color }) {
  return (
    <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ height: '100%', width: `${pct(value, max)}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function DesktopDashboard() {
  const {
    cantieri = [], fattureDB = [], ordiniFornDB = [], montaggiDB = [],
    tasks = [], msgs = [], team = [], problemi = [], aziendaInfo,
    setTab, setSelectedCM, setFilterFase, giorniFermaCM, sogliaDays = 7,
  } = useMastro();

  const [critOpen, setCritOpen] = useState(true);

  const D = useMemo(() => {
    const attive = cantieri.filter(c => c.fase !== "chiusura");
    const ferme = attive.filter(c => giorniFermaCM(c) >= sogliaDays).sort((a, b) => giorniFermaCM(b) - giorniFermaCM(a));
    const conf = attive.filter(c => ["conferma","misure","ordini","produzione","posa"].includes(c.fase));
    const pipe = attive.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
    const pipeConf = conf.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);

    const fattScad = fattureDB.filter(f => !f.pagata && f.scadenza && f.scadenza < TODAY);
    const daInc = fattureDB.filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
    const totScad = fattScad.reduce((s, f) => s + (f.importo || 0), 0);
    const fattTot = fattureDB.reduce((s, f) => s + (f.importo || 0), 0);

    const probAp = (problemi || []).filter(p => p.stato !== "risolto");
    const montOggi = montaggiDB.filter(m => m.data === TODAY);
    const taskOggi = tasks.filter(t => !t.done && t.date === TODAY);
    const msgNL = msgs.filter(m => !m.letto).length;

    const inProd = attive.filter(c => c.fase === "produzione");
    const inOrd = attive.filter(c => c.fase === "ordini");
    const inPosa = attive.filter(c => c.fase === "posa");
    const ordForn = (ordiniFornDB || []).filter(o => o.stato === "inviato");

    const LIMIT7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const mont7 = montaggiDB.filter(m => m.data >= TODAY && m.data <= LIMIT7);
    const cons7 = cantieri.filter(c => c.dataConsegna && c.dataConsegna >= TODAY && c.dataConsegna <= LIMIT7 && c.fase !== "chiusura");

    // Criticità
    const crit = [];
    ferme.slice(0, 4).forEach(c => { const gg = giorniFermaCM(c); crit.push({ id: `f${c.id}`, t: `${c.cliente} ${c.cognome||""}`, d: `${FL[c.fase]||c.fase} · ${c.code} · ferma ${gg}gg`, imp: c.euro ? fmtK(parseFloat(c.euro)) : "—", col: gg>=30?C.red:C.amber, gg, fn: () => { setSelectedCM(c); setTab("commesse"); } }); });
    fattScad.slice(0, 3).forEach(f => { crit.push({ id: `s${f.id}`, t: `Fattura scaduta — ${f.cliente||f.numero||"—"}`, d: `Scaduta da ${Math.abs(daysTo(f.scadenza))}gg`, imp: fmtE(f.importo||0), col: C.red, fn: () => setTab("contabilita") }); });
    probAp.slice(0, 2).forEach(p => { crit.push({ id: `p${p.id}`, t: p.titolo||"Problema", d: `${p.tipo||""}${p.commessa?` · ${p.commessa}`:""}`, imp: "—", col: p.priorita==="alta"?C.red:C.amber }); });

    return { attive, ferme, conf, pipe, pipeConf, fattScad, daInc, totScad, fattTot, probAp, montOggi, taskOggi, msgNL, inProd, inOrd, inPosa, ordForn, mont7, cons7, crit };
  }, [cantieri, fattureDB, ordiniFornDB, montaggiDB, tasks, msgs, team, problemi, sogliaDays]);

  const now = new Date();
  const sal = now.getHours() < 12 ? "Buongiorno" : now.getHours() < 18 ? "Buon pomeriggio" : "Buonasera";
  const nome = aziendaInfo?.ragione || aziendaInfo?.nome || "Walter Cozza Serramenti";
  const dateStr = now.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  // Fake sparkline data (will be real when we have historical data)
  const sparkPipe = [40, 52, 48, 61, 58, 72, 68, 75, 82, 78, 85, 92];
  const sparkRev = [12, 18, 15, 22, 28, 24, 31, 27, 34, 30, 38, 34];

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg, fontFamily: FF, color: C.text }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "20px 28px 48px" }}>

        {/* ═══ TOP BAR ═══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 2 }}>{dateStr} · {timeStr}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{sal}, <span style={{ color: C.teal }}>{nome}</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.sub }}>{D.attive.length} attive · {D.montOggi.length} montaggi oggi{D.ferme.length > 0 ? ` · ${D.ferme.length} ferme` : ''}</span>
            <button style={btn(C.teal)} onClick={() => setTab("commesse")}>+ Commessa</button>
            <button style={{ ...btn('transparent'), color: C.text, border: `1px solid ${C.border}` }} onClick={() => setTab("calendario")}>Agenda</button>
          </div>
        </div>

        {/* ═══ KPI CARDS (3 big like mockup) ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
          {/* Pipeline */}
          <div style={{ ...card, padding: '22px 24px', borderColor: C.teal + '30', cursor: 'pointer' }} onClick={() => setTab("commesse")}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Pipeline attiva</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.ink, fontFamily: FM, lineHeight: 1 }}>{fmtK(D.pipe)}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>{D.attive.length} commesse · {D.conf.length} confermate</div>
              </div>
              <Spark data={sparkPipe} color={C.teal} w={90} h={36} />
            </div>
            <Bar value={D.pipeConf} max={D.pipe || 1} color={C.teal} />
            <div style={{ fontSize: 9, color: C.hint, marginTop: 4 }}>{pct(D.pipeConf, D.pipe)}% confermato · {fmtK(D.pipeConf)}</div>
          </div>

          {/* Da incassare */}
          <div style={{ ...card, padding: '22px 24px', borderColor: D.fattScad.length > 0 ? C.red + '30' : C.border, cursor: 'pointer' }} onClick={() => setTab("contabilita")}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Da incassare</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.ink, fontFamily: FM, lineHeight: 1 }}>{fmtK(D.daInc)}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>{D.fattScad.length} scadute · {fmtK(D.totScad)} scaduto</div>
              </div>
              <Spark data={sparkRev} color={C.amber} w={90} h={36} />
            </div>
            {D.fattScad.length > 0 && <div style={{ marginTop: 10, padding: '6px 10px', borderRadius: 6, background: C.redBg, fontSize: 11, fontWeight: 600, color: C.red, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={dot(C.red, 5)} /> {D.fattScad.length} fatture scadute
            </div>}
          </div>

          {/* Stato operativo */}
          <div style={{ ...card, padding: '22px 24px', borderColor: C.purple + '30' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Stato operativo</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.ink, fontFamily: FM, lineHeight: 1 }}>{D.montOggi.length}</div>
                <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>montaggi oggi</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.ink, fontFamily: FM, lineHeight: 1 }}>{D.taskOggi.length}</div>
                <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>task oggi</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: D.ferme.length > 0 ? C.red : C.green, fontFamily: FM, lineHeight: 1 }}>{D.ferme.length}</div>
                <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>ferme &gt;{sogliaDays}gg</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: D.probAp.length > 0 ? C.red : C.green, fontFamily: FM, lineHeight: 1 }}>{D.probAp.length}</div>
                <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>problemi</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ PIPELINE BAR FULL WIDTH ═══ */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={head}>
            <div style={headT}><span style={dot(C.teal)} /> Pipeline commesse <span style={badge(C.teal, C.tealBg)}>{D.attive.length}</span></div>
            <button onClick={() => setTab("commesse")} style={link}>Vedi tutte →</button>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 2, height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 14 }}>
              {FASI.map(f => { const n = cantieri.filter(c => c.fase === f).length; return n ? <div key={f} style={{ flex: n, background: FC[f], minWidth: 4, transition: 'flex .4s' }} title={`${FL[f]}: ${n}`} /> : null; })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
              {FASI.filter(f => f !== "chiusura").map(f => {
                const n = cantieri.filter(c => c.fase === f).length;
                const e = cantieri.filter(c => c.fase === f).reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
                return (
                  <div key={f} onClick={() => { setFilterFase(f); setTab("commesse"); }}
                    style={{ padding: '12px', borderRadius: 10, background: n > 0 ? FC[f] + '10' : C.cardL, border: `1px solid ${n > 0 ? FC[f] + '25' : C.border}`, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}
                    onMouseEnter={e2 => { e2.currentTarget.style.borderColor = FC[f]; }}
                    onMouseLeave={e2 => { e2.currentTarget.style.borderColor = n > 0 ? FC[f] + '25' : C.border; }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>{FL[f]}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, fontFamily: FM, color: n > 0 ? FC[f] : C.hint, lineHeight: 1, marginTop: 4 }}>{n}</div>
                    {e > 0 && <div style={{ fontSize: 9, color: C.sub, marginTop: 3 }}>{fmtK(e)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ RECENT COMMESSE TABLE (like mockup transactions) ═══ */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={head}>
            <div style={headT}>Commesse recenti</div>
            <button onClick={() => setTab("commesse")} style={link}>Vedi tutte →</button>
          </div>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 120px 120px', padding: '10px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.hint, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            <span>Codice</span><span>Cliente</span><span>Importo</span><span>Fase</span><span>Stato</span>
          </div>
          {cantieri.slice(0, 8).map((c, i) => {
            const gg = giorniFermaCM(c);
            const ferma = gg >= sogliaDays;
            return (
              <div key={c.id || i} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 120px 120px', padding: '12px 20px', borderBottom: `1px solid ${C.border}`, alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={rowH} onMouseLeave={rowL}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.teal, fontFamily: FM }}>{c.code || `CM-${String(i).padStart(4,'0')}`}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={avatar(FC[c.fase] || C.teal, 28)}>{(c.cliente||"?")[0]}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{c.cliente} {c.cognome||""}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: FM }}>{c.euro ? fmtK(parseFloat(c.euro)) : "—"}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: FC[c.fase] || C.sub }}>{FL[c.fase] || c.fase}</span>
                <div>
                  {ferma
                    ? <span style={badge(C.red, C.redBg)}>Ferma {gg}gg</span>
                    : <span style={badge(C.green, C.greenBg)}>Attiva</span>
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ BOTTOM GRID: Criticità + Team + Oggi ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

          {/* Criticità */}
          <div style={{ ...card, borderColor: D.crit.length > 0 ? C.red + '25' : C.border }}>
            <div style={head}>
              <div style={headT}><span style={dot(C.red)} /> Criticità <span style={badge(C.red, C.redBg)}>{D.crit.length}</span></div>
            </div>
            {D.crit.length === 0
              ? <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: C.sub }}>Nessuna criticità</div>
              : D.crit.map(cr => (
                <div key={cr.id} onClick={cr.fn} style={{ ...row }} onMouseEnter={rowH} onMouseLeave={rowL}>
                  <div style={{ width: 3, height: 28, borderRadius: 2, background: cr.col, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cr.t}</div>
                    <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>{cr.d}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: cr.col, fontFamily: FM }}>{cr.imp}</span>
                </div>
              ))
            }
          </div>

          {/* Team */}
          <div style={card}>
            <div style={head}>
              <div style={headT}><span style={dot(C.teal)} /> Team</div>
              <button onClick={() => setTab("team")} style={link}>Gestione →</button>
            </div>
            {(team.length > 0 ? team : [{ id: "1", nome: "Titolare", ruolo: "Titolare" }]).map((m, i) => {
              const inC = montaggiDB.some(mt => mt.operatoreId === m.id && mt.data === TODAY);
              const tc = tasks.filter(t => t.assegnatoA === m.id && !t.done).length;
              return (
                <div key={m.id || i} style={{ ...row, borderBottom: `1px solid ${C.border}` }}>
                  <div style={avatar(C.teal)}>{(m.nome || "?")[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{m.nome}</div>
                    <div style={{ fontSize: 10, color: C.sub }}>{m.ruolo || "—"}</div>
                  </div>
                  {inC && <span style={badge(C.green, C.greenBg)}>Cantiere</span>}
                  {tc > 0 && <span style={badge(C.amber, C.amberBg)}>{tc} task</span>}
                  {!inC && tc === 0 && <span style={badge(C.sub, C.cardL)}>—</span>}
                </div>
              );
            })}
          </div>

          {/* Oggi + 7gg */}
          <div style={card}>
            <div style={head}>
              <div style={headT}><span style={dot(C.purple)} /> Agenda</div>
              <button onClick={() => setTab("calendario")} style={link}>Completa →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${C.border}` }}>
              {[
                { n: D.montOggi.length, l: "Montaggi oggi", c: C.purple },
                { n: D.mont7.length, l: "Montaggi 7gg", c: C.blue },
              ].map((t, i) => (
                <div key={t.l} style={{ textAlign: 'center', padding: '16px 8px', borderRight: i === 0 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, fontFamily: FM, color: t.c, lineHeight: 1 }}>{t.n}</div>
                  <div style={{ fontSize: 9, color: C.sub, marginTop: 5, fontWeight: 600, textTransform: 'uppercase' }}>{t.l}</div>
                </div>
              ))}
            </div>
            {D.montOggi.length === 0
              ? <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: C.sub }}>Nessun montaggio oggi</div>
              : D.montOggi.slice(0, 4).map(m => (
                <div key={m.id} style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{m.cliente || "—"}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.purple, fontFamily: FM }}>{m.orario || ""}</span>
                  </div>
                  {m.indirizzo && <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>{m.indirizzo}</div>}
                </div>
              ))
            }
            {D.cons7.length > 0 && (
              <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Consegne 7gg</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.green, fontFamily: FM }}>{D.cons7.length}</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
