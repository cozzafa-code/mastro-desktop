"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO HQ — Dashboard v6 FULL
// Drag & drop widgets · Messaggi · Calendario · Produzione
// Style: Subcom ecommerce · Full width · Dense
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useMastro } from "./MastroContext";

const C = {
  bg:'#F9FAFB', card:'#FFFFFF', border:'#E5E7EB', borderL:'#F3F4F6',
  ink:'#111827', text:'#374151', sub:'#6B7280', hint:'#9CA3AF',
  green:'#10B981', greenBg:'#D1FAE5', greenT:'#065F46',
  red:'#EF4444', redBg:'#FEE2E2', redT:'#991B1B',
  amber:'#F59E0B', amberBg:'#FEF3C7', amberT:'#92400E',
  blue:'#3B82F6', blueBg:'#DBEAFE', blueT:'#1E40AF',
  purple:'#8B5CF6', purpleBg:'#EDE9FE', purpleT:'#5B21B6',
  orange:'#F97316', orangeBg:'#FFEDD5', orangeT:'#9A3412',
  teal:'#14B8A6', tealBg:'#CCFBF1', tealT:'#115E59',
};
const FM = "'JetBrains Mono','SF Mono',monospace";
const FF = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const fmtE = n => "€" + Math.round(n).toLocaleString("it-IT");
const fmtK = n => n >= 10000 ? "€" + Math.round(n/1000) + "k" : n >= 1000 ? "€" + (n/1000).toFixed(1) + "k" : fmtE(n);
const pct = (a, b) => b > 0 ? Math.round(a/b*100) : 0;
const daysTo = d => Math.floor((new Date(d).getTime()-Date.now())/86400000);
const TODAY = new Date().toISOString().split("T")[0];
const FASI = ["sopralluogo","preventivo","conferma","misure","ordini","produzione","posa","chiusura"];
const FL = { sopralluogo:"Sopralluogo", preventivo:"Preventivo", conferma:"Conferma", misure:"Misure", ordini:"Ordini", produzione:"Produzione", posa:"Posa", chiusura:"Chiusura" };
const FC = { sopralluogo:C.blue, preventivo:C.amber, conferma:C.teal, misure:C.purple, ordini:C.red, produzione:C.orange, posa:C.green, chiusura:C.hint };

// ── Micro components ───────────────────────────────────────────
function Trend({ value, positive = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 5, background: positive ? C.greenBg : C.redBg, fontSize: 10, fontWeight: 600, color: positive ? C.greenT : C.redT }}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {positive ? <path d="M1 6L4 2L7 6" /> : <path d="M1 2L4 6L7 2" />}
      </svg>
      {value}
    </span>
  );
}

function SparkLine({ data, color, w = 240, h = 80 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h-6-((v-min)/range)*(h-12)}`);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs><linearGradient id={`sg${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.12"/><stop offset="100%" stopColor={color} stopOpacity="0.01"/></linearGradient></defs>
      <path d={`M0,${h} L${pts.join(' L')} L${w},${h} Z`} fill={`url(#sg${color.slice(1)})`}/>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {(() => { const l = pts[pts.length-1].split(','); return <circle cx={l[0]} cy={l[1]} r="3" fill={color}/>; })()}
    </svg>
  );
}

function StatusBadge({ fase }) {
  const m = { sopralluogo:{bg:C.blueBg,c:C.blueT}, preventivo:{bg:C.amberBg,c:C.amberT}, conferma:{bg:C.tealBg,c:C.tealT}, misure:{bg:C.purpleBg,c:C.purpleT}, ordini:{bg:C.redBg,c:C.redT}, produzione:{bg:C.orangeBg,c:C.orangeT}, posa:{bg:C.greenBg,c:C.greenT}, chiusura:{bg:C.borderL,c:C.sub} };
  const s = m[fase] || m.chiusura;
  return <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.c, whiteSpace: 'nowrap' }}>{FL[fase]||fase}</span>;
}

const cardS = { background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' };
const headS = { padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.borderL}` };
const linkS = { fontSize: 11, fontWeight: 600, color: C.blue, cursor: 'pointer', background: 'none', border: 'none', fontFamily: FF };

// ── DEFAULT WIDGET ORDER ───────────────────────────────────────
const ALL_WIDGETS = ['chart_top','commesse_recenti','calendario','messaggi','produzione','scadenze','team','pratiche','attenzione'];
const DEFAULT_LEFT = ['chart_top','commesse_recenti','scadenze'];
const DEFAULT_RIGHT = ['calendario','messaggi','produzione','team','pratiche','attenzione'];

// ═══════════════════════════════════════════════════════════════
export default function DesktopDashboard() {
  const {
    cantieri=[], fattureDB=[], ordiniFornDB=[], montaggiDB=[],
    tasks=[], msgs=[], team=[], problemi=[], aziendaInfo,
    setTab, setSelectedCM, setFilterFase, giorniFermaCM, sogliaDays=7,
  } = useMastro();

  // ── Drag state ──
  const [leftCol, setLeftCol] = useState(() => { try { const s = localStorage.getItem('m_dash_l'); return s ? JSON.parse(s) : DEFAULT_LEFT; } catch { return DEFAULT_LEFT; } });
  const [rightCol, setRightCol] = useState(() => { try { const s = localStorage.getItem('m_dash_r'); return s ? JSON.parse(s) : DEFAULT_RIGHT; } catch { return DEFAULT_RIGHT; } });
  const dragItem = useRef(null);
  const dragCol = useRef(null);

  const saveLayout = useCallback((l, r) => { try { localStorage.setItem('m_dash_l', JSON.stringify(l)); localStorage.setItem('m_dash_r', JSON.stringify(r)); } catch {} }, []);

  const onDragStart = (id, col) => { dragItem.current = id; dragCol.current = col; };
  const onDrop = (targetId, targetCol) => {
    if (!dragItem.current || dragItem.current === targetId) return;
    const srcCol = dragCol.current;
    const [sl, setSl] = srcCol === 'left' ? [leftCol, setLeftCol] : [rightCol, setRightCol];
    const [tl, setTl] = targetCol === 'left' ? [leftCol, setLeftCol] : [rightCol, setRightCol];
    const newSrc = sl.filter(x => x !== dragItem.current);
    let newTgt = targetCol === srcCol ? newSrc : [...tl];
    const ti = newTgt.indexOf(targetId);
    newTgt.splice(ti >= 0 ? ti : newTgt.length, 0, dragItem.current);
    if (srcCol === targetCol) { setTl(newTgt); } else { setSl(newSrc); setTl(newTgt); }
    saveLayout(targetCol === 'left' ? newTgt : newSrc, targetCol === 'right' ? newTgt : newSrc);
    dragItem.current = null;
  };

  // ── Computed data ──
  const D = useMemo(() => {
    const attive = cantieri.filter(c => c.fase !== "chiusura");
    const ferme = attive.filter(c => giorniFermaCM(c) >= sogliaDays).sort((a,b) => giorniFermaCM(b)-giorniFermaCM(a));
    const conf = attive.filter(c => ["conferma","misure","ordini","produzione","posa"].includes(c.fase));
    const pipe = attive.reduce((s,c) => s+(parseFloat(c.euro)||0), 0);
    const pipeConf = conf.reduce((s,c) => s+(parseFloat(c.euro)||0), 0);
    const fattScad = fattureDB.filter(f => !f.pagata && f.scadenza && f.scadenza < TODAY);
    const daInc = fattureDB.filter(f => !f.pagata).reduce((s,f) => s+(f.importo||0), 0);
    const totScad = fattScad.reduce((s,f) => s+(f.importo||0), 0);
    const probAp = (problemi||[]).filter(p => p.stato !== "risolto");
    const montOggi = montaggiDB.filter(m => m.data === TODAY);
    const taskOggi = tasks.filter(t => !t.done && t.date === TODAY);
    const msgNL = msgs.filter(m => !m.letto);
    const inProd = attive.filter(c => c.fase === "produzione");
    const inOrd = attive.filter(c => c.fase === "ordini");
    const inPosa = attive.filter(c => c.fase === "posa");
    const ordForn = (ordiniFornDB||[]).filter(o => o.stato === "inviato");
    const topCM = [...attive].sort((a,b) => (parseFloat(b.euro)||0)-(parseFloat(a.euro)||0)).slice(0,5);
    const recenti = [...cantieri].sort((a,b) => String(b.updatedAt||b.id||"").localeCompare(String(a.updatedAt||a.id||""))).slice(0,10);
    const LIMIT7 = new Date(Date.now()+7*86400000).toISOString().split("T")[0];
    const LIMIT15 = new Date(Date.now()+15*86400000).toISOString().split("T")[0];
    const mont7 = montaggiDB.filter(m => m.data >= TODAY && m.data <= LIMIT7);
    const cons15 = cantieri.filter(c => c.dataConsegna && c.dataConsegna >= TODAY && c.dataConsegna <= LIMIT15 && c.fase !== "chiusura");
    const fattIn15 = fattureDB.filter(f => !f.pagata && f.scadenza && f.scadenza >= TODAY && f.scadenza <= LIMIT15);
    const convRate = attive.length > 0 ? pct(conf.length, attive.length) : 0;
    // Calendar: next 7 days
    const cal7 = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() + i * 86400000);
      const ds = d.toISOString().split("T")[0];
      const dayMont = montaggiDB.filter(m => m.data === ds);
      const dayTask = tasks.filter(t => t.date === ds && !t.done);
      const dayCons = cantieri.filter(c => c.dataConsegna === ds);
      cal7.push({ date: ds, dayName: d.toLocaleDateString("it-IT", { weekday: "short" }), dayNum: d.getDate(), mont: dayMont, task: dayTask, cons: dayCons, total: dayMont.length + dayTask.length + dayCons.length });
    }
    const prat = { p50: cantieri.filter(c=>c.detrazione==="50"), p65: cantieri.filter(c=>c.detrazione==="65"), p75: cantieri.filter(c=>c.detrazione==="75") };
    return { attive, ferme, conf, pipe, pipeConf, fattScad, daInc, totScad, probAp, montOggi, taskOggi, msgNL, inProd, inOrd, inPosa, ordForn, topCM, recenti, mont7, cons15, fattIn15, convRate, cal7, prat };
  }, [cantieri, fattureDB, ordiniFornDB, montaggiDB, tasks, msgs, team, problemi, sogliaDays]);

  const now = new Date();
  const nome = aziendaInfo?.ragione || aziendaInfo?.nome || "Walter Cozza Serramenti";
  const dateStr = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const sparkD = [22,28,35,31,42,38,45,50,48,56,62,58,65,72,68,75,80,78,85,88,84,92];
  const sparkD2 = [8,12,10,15,18,14,20,22,19,25,28,24,30,32,28,35,38,34,40,42,38,44];

  // ── Drag wrapper ──
  const DW = ({ id, col, children }) => (
    <div draggable onDragStart={() => onDragStart(id, col)} onDragOver={e => e.preventDefault()} onDrop={() => onDrop(id, col)}
      style={{ cursor: 'grab', transition: 'opacity 0.15s' }}
      onMouseDown={e => { if (e.target.closest('button,a,select,input')) e.stopPropagation(); }}>
      {children}
    </div>
  );

  // ── Widget renderers ──
  const widgets = {
    chart_top: (col) => (
      <DW id="chart_top" col={col} key="chart_top">
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
          <div style={cardS}>
            <div style={headS}><span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Andamento</span>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: C.sub }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, borderRadius: 1, background: C.teal, display: 'inline-block' }}/> Commesse</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, borderRadius: 1, background: C.purple, display: 'inline-block' }}/> Confermate</span>
              </div>
            </div>
            <div style={{ padding: '12px 18px', position: 'relative' }}>
              <SparkLine data={sparkD} color={C.teal} w={500} h={120}/>
              <div style={{ position: 'absolute', top: 12, left: 18 }}><SparkLine data={sparkD2} color={C.purple} w={500} h={120}/></div>
            </div>
          </div>
          <div style={cardS}>
            <div style={headS}><span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Top commesse</span><button onClick={() => setTab("commesse")} style={linkS}>···</button></div>
            {D.topCM.map((c, i) => (
              <div key={c.id||i} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderTop: i > 0 ? `1px solid ${C.borderL}` : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = C.borderL)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: (FC[c.fase]||C.teal)+'15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: FC[c.fase]||C.teal, flexShrink: 0 }}>{(c.cliente||"?")[0]}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{c.cliente} {c.cognome||""}</div><div style={{ fontSize: 10, color: C.hint }}>ID: {c.code||`CM-${i}`}</div></div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.ink, fontFamily: FM }}>{c.euro ? fmtK(parseFloat(c.euro)) : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </DW>
    ),

    commesse_recenti: (col) => (
      <DW id="commesse_recenti" col={col} key="commesse_recenti">
        <div style={cardS}>
          <div style={headS}><span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Commesse recenti</span><button onClick={() => setTab("commesse")} style={linkS}>Vedi tutte</button></div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 90px 90px 80px', padding: '8px 18px', borderBottom: `1px solid ${C.borderL}`, fontSize: 10, fontWeight: 600, color: C.hint }}>
            <span>Commessa</span><span>Cliente</span><span>Importo</span><span>Fase</span><span>Stato</span>
          </div>
          {D.recenti.map((c, i) => {
            const ferma = giorniFermaCM(c) >= sogliaDays;
            return (
              <div key={c.id||i} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 90px 90px 80px', padding: '10px 18px', borderBottom: `1px solid ${C.borderL}`, alignItems: 'center', cursor: 'pointer', transition: 'background 0.12s', fontSize: 12 }}
                onMouseEnter={e => (e.currentTarget.style.background = C.borderL)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: (FC[c.fase]||C.teal)+'12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: FC[c.fase]||C.teal, flexShrink: 0 }}>{(c.cliente||"?")[0]}</div>
                  <span style={{ fontWeight: 600, color: C.ink }}>{c.code||`S-${String(i).padStart(4,'0')}`}</span>
                </div>
                <span style={{ color: C.text }}>{c.cliente} {c.cognome||""}</span>
                <span style={{ fontWeight: 600, fontFamily: FM, fontSize: 11, color: C.ink }}>{c.euro ? fmtK(parseFloat(c.euro)) : "—"}</span>
                <StatusBadge fase={c.fase}/>
                {ferma ? <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: C.redBg, color: C.redT }}>Ferma</span>
                       : <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: C.greenBg, color: C.greenT }}>Attiva</span>}
              </div>
            );
          })}
        </div>
      </DW>
    ),

    calendario: (col) => (
      <DW id="calendario" col={col} key="calendario">
        <div style={cardS}>
          <div style={headS}><span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Calendario 7 giorni</span><button onClick={() => setTab("calendario")} style={linkS}>Agenda →</button></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${C.borderL}` }}>
            {D.cal7.map((d, i) => {
              const isToday = d.date === TODAY;
              return (
                <div key={d.date} style={{ textAlign: 'center', padding: '12px 4px', borderRight: i < 6 ? `1px solid ${C.borderL}` : 'none', background: isToday ? C.blueBg : 'transparent' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: isToday ? C.blueT : C.hint, textTransform: 'uppercase' }}>{d.dayName}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: isToday ? C.blueT : C.ink, marginTop: 2 }}>{d.dayNum}</div>
                  {d.total > 0 && <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 6 }}>
                    {d.mont.length > 0 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.purple }}/>}
                    {d.task.length > 0 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber }}/>}
                    {d.cons.length > 0 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }}/>}
                  </div>}
                  {d.total > 0 && <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>{d.total} att.</div>}
                </div>
              );
            })}
          </div>
          {D.montOggi.length > 0 && <div style={{ padding: '6px 0' }}>
            <div style={{ padding: '6px 18px', fontSize: 10, fontWeight: 600, color: C.purple, textTransform: 'uppercase' }}>Oggi</div>
            {D.montOggi.slice(0, 3).map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 18px', fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: C.ink }}>{m.cliente||"—"}</span>
                <span style={{ fontWeight: 600, color: C.purple, fontFamily: FM }}>{m.orario||""}</span>
              </div>
            ))}
          </div>}
        </div>
      </DW>
    ),

    messaggi: (col) => (
      <DW id="messaggi" col={col} key="messaggi">
        <div style={cardS}>
          <div style={headS}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Messaggi</span>
              {D.msgNL.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: C.blueBg, color: C.blueT }}>{D.msgNL.length} nuovi</span>}
            </div>
            <button onClick={() => setTab("messaggi")} style={linkS}>Tutti →</button>
          </div>
          {D.msgNL.length === 0 && msgs.length === 0
            ? <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: C.hint }}>Nessun messaggio</div>
            : (D.msgNL.length > 0 ? D.msgNL : msgs).slice(0, 5).map((m, i) => (
              <div key={m.id||i} onClick={() => setTab("messaggi")}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderTop: i > 0 ? `1px solid ${C.borderL}` : 'none', cursor: 'pointer', transition: 'background 0.12s', background: m.letto ? 'transparent' : C.blueBg + '40' }}
                onMouseEnter={e => (e.currentTarget.style.background = C.borderL)} onMouseLeave={e => (e.currentTarget.style.background = m.letto ? 'transparent' : C.blueBg + '40')}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.blueT, flexShrink: 0 }}>{(m.mittente||m.cliente||"?")[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.mittente||m.cliente||"Messaggio"}</div>
                  <div style={{ fontSize: 11, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{m.testo||m.oggetto||m.body||"—"}</div>
                </div>
                {!m.letto && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue, flexShrink: 0 }}/>}
              </div>
            ))}
        </div>
      </DW>
    ),

    produzione: (col) => (
      <DW id="produzione" col={col} key="produzione">
        <div style={cardS}>
          <div style={headS}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Produzione</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: C.orangeBg, color: C.orangeT }}>{D.inProd.length}</span>
            </div>
            <button onClick={() => setTab("produzione")} style={linkS}>Dettagli →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { n: D.inProd.length, l: "In prod.", c: C.orange, bg: C.orangeBg },
              { n: D.inOrd.length, l: "Att. ordini", c: C.amber, bg: C.amberBg },
              { n: D.inPosa.length, l: "Pronte posa", c: C.green, bg: C.greenBg },
              { n: D.ordForn.length, l: "Ord. forn.", c: C.blue, bg: C.blueBg },
            ].map((t, i) => (
              <div key={t.l} style={{ textAlign: 'center', padding: '14px 6px', borderRight: i < 3 ? `1px solid ${C.borderL}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 16, fontWeight: 700, color: t.c }}>{t.n}</div>
                <div style={{ fontSize: 10, color: C.sub }}>{t.l}</div>
              </div>
            ))}
          </div>
        </div>
      </DW>
    ),

    scadenze: (col) => (
      <DW id="scadenze" col={col} key="scadenze">
        <div style={cardS}>
          <div style={headS}><span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Scadenze 15 giorni</span></div>
          {D.fattScad.length === 0 && D.cons15.length === 0 && D.fattIn15.length === 0
            ? <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: C.hint }}>Nessuna scadenza</div>
            : <>
              {D.fattScad.length > 0 && <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 600, color: C.red, textTransform: 'uppercase' }}>Fatture scadute</div>}
              {D.fattScad.map(f => (
                <div key={f.id} onClick={() => setTab("contabilita")} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 18px', borderBottom: `1px solid ${C.borderL}`, cursor: 'pointer', fontSize: 12, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.borderL)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ fontWeight: 600, color: C.ink }}>{f.cliente||f.numero||"—"}</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: C.amber, fontFamily: FM }}>{fmtK(f.importo||0)}</span>
                    <span style={{ fontWeight: 600, color: C.red, fontSize: 10 }}>-{Math.abs(daysTo(f.scadenza))}gg</span>
                  </div>
                </div>
              ))}
              {D.cons15.length > 0 && <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 600, color: C.green, textTransform: 'uppercase' }}>Consegne in arrivo</div>}
              {D.cons15.slice(0, 4).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 18px', borderBottom: `1px solid ${C.borderL}`, fontSize: 12 }}>
                  <span style={{ color: C.ink }}>{c.cliente} {c.cognome||""}</span>
                  <span style={{ fontWeight: 600, color: C.green }}>{daysTo(c.dataConsegna)}gg</span>
                </div>
              ))}
              {D.fattIn15.length > 0 && <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 600, color: C.amber, textTransform: 'uppercase' }}>Fatture in scadenza</div>}
              {D.fattIn15.slice(0, 4).map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 18px', borderBottom: `1px solid ${C.borderL}`, fontSize: 12 }}>
                  <span style={{ color: C.ink }}>{f.cliente||f.numero||"—"}</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontWeight: 600, fontFamily: FM }}>{fmtK(f.importo||0)}</span>
                    <span style={{ color: C.amber }}>{daysTo(f.scadenza)}gg</span>
                  </div>
                </div>
              ))}
            </>}
        </div>
      </DW>
    ),

    team: (col) => (
      <DW id="team" col={col} key="team">
        <div style={cardS}>
          <div style={headS}><span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Team attivo</span><button onClick={() => setTab("team")} style={linkS}>Gestione →</button></div>
          {(team.length > 0 ? team : [{id:"1",nome:"Titolare",ruolo:"Titolare"}]).map((m, i) => {
            const inC = montaggiDB.some(mt => mt.operatoreId === m.id && mt.data === TODAY);
            const tc = tasks.filter(t => t.assegnatoA === m.id && !t.done).length;
            return (
              <div key={m.id||i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderTop: i > 0 ? `1px solid ${C.borderL}` : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.tealT, flexShrink: 0 }}>{(m.nome||"?")[0]}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{m.nome}</div><div style={{ fontSize: 10, color: C.hint }}>{m.ruolo||"—"}{tc > 0 ? ` · ${tc} task` : ""}</div></div>
                {inC ? <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: C.greenBg, color: C.greenT }}>Cantiere</span>
                     : <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: C.borderL, color: C.sub }}>Ufficio</span>}
              </div>
            );
          })}
        </div>
      </DW>
    ),

    pratiche: (col) => (
      <DW id="pratiche" col={col} key="pratiche">
        <div style={cardS}>
          <div style={headS}><span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Pratiche fiscali</span></div>
          {[
            { l: "Ristrutturazione 50%", n: D.prat.p50.length, c: C.teal, bg: C.tealBg },
            { l: "Ecobonus 65%", n: D.prat.p65.length, c: C.blue, bg: C.blueBg },
            { l: "Barriere 75%", n: D.prat.p75.length, c: C.purple, bg: C.purpleBg },
          ].map((r, i) => (
            <div key={r.l} onClick={() => setTab("enea")} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderTop: i > 0 ? `1px solid ${C.borderL}` : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = C.borderL)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: 12, color: C.text }}>{r.l}</span>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: r.c }}>{r.n}</div>
            </div>
          ))}
        </div>
      </DW>
    ),

    attenzione: (col) => (
      <DW id="attenzione" col={col} key="attenzione">
        {(D.ferme.length > 0 || D.fattScad.length > 0 || D.probAp.length > 0) && (
          <div style={{ ...cardS, borderColor: C.red + '30' }}>
            <div style={headS}><span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Attenzione</span></div>
            {D.ferme.length > 0 && (
              <div onClick={() => setTab("commesse")} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderTop: `1px solid ${C.borderL}`, cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = C.borderL)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.amber }}/>
                <span style={{ flex: 1, fontSize: 12, color: C.text }}><strong>{D.ferme.length}</strong> commesse ferme · {pct(D.ferme.length, D.attive.length)}%</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={C.hint} strokeWidth="1.5"><path d="M5 3l4 4-4 4"/></svg>
              </div>
            )}
            {D.fattScad.length > 0 && (
              <div onClick={() => setTab("contabilita")} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderTop: `1px solid ${C.borderL}`, cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = C.borderL)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red }}/>
                <span style={{ flex: 1, fontSize: 12, color: C.text }}><strong>{D.fattScad.length}</strong> fatture scadute · {fmtK(D.totScad)}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={C.hint} strokeWidth="1.5"><path d="M5 3l4 4-4 4"/></svg>
              </div>
            )}
            {D.probAp.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderTop: `1px solid ${C.borderL}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red }}/>
                <span style={{ fontSize: 12, color: C.text }}><strong>{D.probAp.length}</strong> problemi aperti</span>
              </div>
            )}
          </div>
        )}
      </DW>
    ),
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg, fontFamily: FF, color: C.text }}>
      <div style={{ padding: "16px 28px 40px" }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Bentornato, {(nome.split(' ')[0] || nome)}!</h1>
            <p style={{ fontSize: 12, color: C.sub, margin: '4px 0 0' }}>Ecco cosa succede con la tua azienda oggi — {dateStr}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, background: C.card, fontFamily: FF }}>
              <option>Ultimi 7 giorni</option><option>Ultimo mese</option>
            </select>
            <button onClick={() => setTab("commesse")} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: C.ink, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FF }}>Vedi tutto</button>
          </div>
        </div>

        {/* KPI ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { l: "Commesse attive", v: D.attive.length, t: `${D.attive.length}`, pos: true, s: `[+${D.conf.length} conf.]`, fn: () => setTab("commesse") },
            { l: "Pipeline totale", v: fmtK(D.pipe), t: `${pct(D.pipeConf, D.pipe)}% conf.`, pos: true, s: `${fmtK(D.pipeConf)} confermato` },
            { l: "Da incassare", v: fmtK(D.daInc), t: `${D.fattScad.length} scadute`, pos: D.fattScad.length===0, s: D.totScad > 0 ? `${fmtK(D.totScad)} scaduto` : "Tutto ok", fn: () => setTab("contabilita") },
            { l: "Commesse ferme", v: D.ferme.length, t: `${pct(D.ferme.length, D.attive.length)}%`, pos: D.ferme.length===0, s: `soglia ${sogliaDays}gg`, fn: () => setTab("commesse") },
            { l: "Tasso conferma", v: `${D.convRate}%`, t: `${D.conf.length} conf.`, pos: D.convRate > 30, s: `${D.conf.length} su ${D.attive.length}` },
          ].map(k => (
            <div key={k.l} onClick={k.fn} style={{ ...cardS, padding: '18px', cursor: k.fn ? 'pointer' : 'default', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => k.fn && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)')} onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>{k.l}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: C.ink, fontFamily: FM, lineHeight: 1 }}>{k.v}</span>
                <Trend value={k.t} positive={k.pos}/>
              </div>
              <div style={{ fontSize: 10, color: C.hint }}>{k.s}</div>
            </div>
          ))}
        </div>

        {/* WIDGETS GRID — 2 columns, draggable */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {leftCol.map(id => widgets[id] ? widgets[id]('left') : null)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {rightCol.map(id => widgets[id] ? widgets[id]('right') : null)}
          </div>
        </div>

      </div>
    </div>
  );
}
