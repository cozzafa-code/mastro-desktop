"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO HQ — Dashboard v5
// Style: Subcom ecommerce dashboard
// Light content, KPI + trend, chart, table, top lists
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";

// ── PALETTE ────────────────────────────────────────────────────
const C = {
  bg:      '#F9FAFB',
  card:    '#FFFFFF',
  border:  '#E5E7EB',
  borderL: '#F3F4F6',
  ink:     '#111827',
  text:    '#374151',
  sub:     '#6B7280',
  hint:    '#9CA3AF',
  green:   '#10B981',
  greenBg: '#D1FAE5',
  greenT:  '#065F46',
  red:     '#EF4444',
  redBg:   '#FEE2E2',
  redT:    '#991B1B',
  amber:   '#F59E0B',
  amberBg: '#FEF3C7',
  amberT:  '#92400E',
  blue:    '#3B82F6',
  blueBg:  '#DBEAFE',
  blueT:   '#1E40AF',
  purple:  '#8B5CF6',
  purpleBg:'#EDE9FE',
  purpleT: '#5B21B6',
  orange:  '#F97316',
  orangeBg:'#FFEDD5',
  orangeT: '#9A3412',
  teal:    '#14B8A6',
  tealBg:  '#CCFBF1',
  tealT:   '#115E59',
};
const FM = "'JetBrains Mono','SF Mono',monospace";
const FF = "-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif";

// ── HELPERS ────────────────────────────────────────────────────
const fmtE = (n) => "€" + Math.round(n).toLocaleString("it-IT");
const fmtK = (n) => n >= 10000 ? "€" + Math.round(n/1000) + "k" : n >= 1000 ? "€" + (n/1000).toFixed(1) + "k" : fmtE(n);
const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;
const daysTo = (d) => Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
const TODAY = new Date().toISOString().split("T")[0];
const FASI = ["sopralluogo","preventivo","conferma","misure","ordini","produzione","posa","chiusura"];
const FL = { sopralluogo:"Sopralluogo", preventivo:"Preventivo", conferma:"Conferma", misure:"Misure", ordini:"Ordini", produzione:"Produzione", posa:"Posa", chiusura:"Chiusura" };
const FC = { sopralluogo:C.blue, preventivo:C.amber, conferma:C.teal, misure:C.purple, ordini:C.red, produzione:C.orange, posa:C.green, chiusura:C.hint };

// ── TREND ARROW ────────────────────────────────────────────────
function Trend({ value, label, positive = true }) {
  const col = positive ? C.green : C.red;
  const bg = positive ? C.greenBg : C.redBg;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: bg, fontSize: 11, fontWeight: 600, color: positive ? C.greenT : C.redT }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {positive ? <path d="M1 7L5 3L9 7" /> : <path d="M1 3L5 7L9 3" />}
      </svg>
      {value}{label && <span style={{ fontWeight: 400 }}>{label}</span>}
    </div>
  );
}

// ── SPARKLINE ──────────────────────────────────────────────────
function SparkLine({ data, color, w = 280, h = 100 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 8 - ((v - min) / range) * (h - 16);
    return `${x},${y}`;
  });
  const areaPath = `M0,${h} L${pts.join(' L')} L${w},${h} Z`;
  const linePath = `M${pts.join(' L')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`g-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#g-${color.replace('#','')})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      {(() => { const last = pts[pts.length-1].split(','); return <circle cx={last[0]} cy={last[1]} r="4" fill={color} />; })()}
    </svg>
  );
}

// ── STATUS BADGE ───────────────────────────────────────────────
function Status({ stato, gg }) {
  const map = {
    sopralluogo: { bg: C.blueBg, color: C.blueT, label: 'Sopralluogo' },
    preventivo: { bg: C.amberBg, color: C.amberT, label: 'Preventivo' },
    conferma: { bg: C.tealBg, color: C.tealT, label: 'Confermato' },
    misure: { bg: C.purpleBg, color: C.purpleT, label: 'Misure' },
    ordini: { bg: C.redBg, color: C.redT, label: 'Ordini' },
    produzione: { bg: C.orangeBg, color: C.orangeT, label: 'Produzione' },
    posa: { bg: C.greenBg, color: C.greenT, label: 'Posa' },
    chiusura: { bg: C.borderL, color: C.sub, label: 'Chiuso' },
  };
  const s = map[stato] || { bg: C.borderL, color: C.sub, label: stato };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>;
}

// ═══════════════════════════════════════════════════════════════
export default function DesktopDashboard() {
  const {
    cantieri = [], fattureDB = [], ordiniFornDB = [], montaggiDB = [],
    tasks = [], msgs = [], team = [], problemi = [], aziendaInfo,
    setTab, setSelectedCM, setFilterFase, giorniFermaCM, sogliaDays = 7,
  } = useMastro();

  const D = useMemo(() => {
    const attive = cantieri.filter(c => c.fase !== "chiusura");
    const ferme = attive.filter(c => giorniFermaCM(c) >= sogliaDays).sort((a, b) => giorniFermaCM(b) - giorniFermaCM(a));
    const conf = attive.filter(c => ["conferma","misure","ordini","produzione","posa"].includes(c.fase));
    const pipe = attive.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
    const pipeConf = conf.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);

    const fattScad = fattureDB.filter(f => !f.pagata && f.scadenza && f.scadenza < TODAY);
    const daInc = fattureDB.filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
    const totScad = fattScad.reduce((s, f) => s + (f.importo || 0), 0);

    const probAp = (problemi || []).filter(p => p.stato !== "risolto");
    const montOggi = montaggiDB.filter(m => m.data === TODAY);
    const taskOggi = tasks.filter(t => !t.done && t.date === TODAY);
    const msgNL = msgs.filter(m => !m.letto).length;

    const inProd = attive.filter(c => c.fase === "produzione");
    const inOrd = attive.filter(c => c.fase === "ordini");
    const inPosa = attive.filter(c => c.fase === "posa");

    // Top commesse per valore
    const topCM = [...attive].sort((a, b) => (parseFloat(b.euro) || 0) - (parseFloat(a.euro) || 0)).slice(0, 5);
    // Recenti
    const recenti = [...cantieri].sort((a, b) => String(b.updatedAt || b.id || "").localeCompare(String(a.updatedAt || a.id || ""))).slice(0, 6);

    const LIMIT7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const mont7 = montaggiDB.filter(m => m.data >= TODAY && m.data <= LIMIT7);

    const convRate = attive.length > 0 ? pct(conf.length, attive.length) : 0;

    return { attive, ferme, conf, pipe, pipeConf, fattScad, daInc, totScad, probAp, montOggi, taskOggi, msgNL, inProd, inOrd, inPosa, topCM, recenti, mont7, convRate };
  }, [cantieri, fattureDB, ordiniFornDB, montaggiDB, tasks, msgs, team, problemi, sogliaDays]);

  const now = new Date();
  const nome = aziendaInfo?.ragione || aziendaInfo?.nome || "Walter Cozza Serramenti";
  const dateStr = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Fake chart data (pipeline growth simulation)
  const chartData = [22, 28, 35, 31, 42, 38, 45, 50, 48, 56, 62, 58, 65, 72, 68, 75, 80, 78, 85, 88, 84, 92];
  const chartData2 = [8, 12, 10, 15, 18, 14, 20, 22, 19, 25, 28, 24, 30, 32, 28, 35, 38, 34, 40, 42, 38, 44];

  const cardStyle = { background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' };

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg, fontFamily: FF, color: C.text }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 28px 48px" }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Bentornato, {nome.split(' ')[0]}!</h1>
            <p style={{ fontSize: 13, color: C.sub, margin: '4px 0 0' }}>Ecco cosa succede con la tua azienda oggi — {dateStr}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.card, fontFamily: FF, cursor: 'pointer' }}>
              <option>Ultimi 7 giorni</option>
              <option>Ultimo mese</option>
              <option>Ultimo anno</option>
            </select>
            <button onClick={() => setTab("commesse")} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.ink, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FF }}>Vedi tutto</button>
          </div>
        </div>

        {/* ═══ KPI ROW ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: "Commesse attive", value: D.attive.length, trend: `${D.attive.length}`, trendLabel: "", positive: true, sub: `[+${D.conf.length} conf.]`, click: () => setTab("commesse") },
            { label: "Pipeline totale", value: fmtK(D.pipe), trend: `${pct(D.pipeConf, D.pipe)}%`, trendLabel: " conf.", positive: true, sub: `${fmtK(D.pipeConf)} confermato` },
            { label: "Da incassare", value: fmtK(D.daInc), trend: `${D.fattScad.length}`, trendLabel: " scadute", positive: D.fattScad.length === 0, sub: D.fattScad.length > 0 ? `${fmtK(D.totScad)} scaduto` : "Tutto regolare", click: () => setTab("contabilita") },
            { label: "Commesse ferme", value: D.ferme.length, trend: `${pct(D.ferme.length, D.attive.length)}%`, trendLabel: "", positive: D.ferme.length === 0, sub: `soglia ${sogliaDays}gg`, click: () => setTab("commesse") },
            { label: "Tasso conferma", value: `${D.convRate}%`, trend: `${D.conf.length}`, trendLabel: " conf.", positive: D.convRate > 30, sub: `${D.conf.length} su ${D.attive.length} attive` },
          ].map(k => (
            <div key={k.label} onClick={k.click} style={{ ...cardStyle, padding: '20px', cursor: k.click ? 'pointer' : 'default', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => k.click && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>{k.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: C.ink, fontFamily: FM, lineHeight: 1 }}>{k.value}</span>
                <Trend value={k.trend} label={k.trendLabel} positive={k.positive} />
              </div>
              <div style={{ fontSize: 11, color: C.hint }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ═══ SUMMARY CHART + TOP COMMESSE ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginBottom: 24 }}>
          {/* Chart */}
          <div style={cardStyle}>
            <div style={{ padding: '18px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Andamento</span>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.sub }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 3, borderRadius: 2, background: C.teal, display: 'inline-block' }} /> Commesse</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 3, borderRadius: 2, background: C.purple, display: 'inline-block' }} /> Confermate</span>
              </div>
            </div>
            <div style={{ padding: '0 22px 18px', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <SparkLine data={chartData} color={C.teal} w={520} h={140} />
                <div style={{ position: 'absolute', top: 0, left: 0 }}>
                  <SparkLine data={chartData2} color={C.purple} w={520} h={140} />
                </div>
              </div>
              {/* Y axis labels */}
              <div style={{ position: 'absolute', top: 18, right: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 130 }}>
                {[100, 75, 50, 25, 0].map(v => <span key={v} style={{ fontSize: 9, color: C.hint, textAlign: 'right' }}>{v}</span>)}
              </div>
            </div>
          </div>

          {/* Top commesse per valore */}
          <div style={cardStyle}>
            <div style={{ padding: '18px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Top commesse</span>
              <span style={{ fontSize: 11, color: C.sub, cursor: 'pointer' }} onClick={() => setTab("commesse")}>···</span>
            </div>
            {D.topCM.map((c, i) => (
              <div key={c.id || i} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderTop: `1px solid ${C.borderL}`, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = C.borderL)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: FC[c.fase] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: FC[c.fase], flexShrink: 0 }}>{(c.cliente||"?")[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{c.cliente} {c.cognome||""}</div>
                  <div style={{ fontSize: 11, color: C.hint }}>ID: {c.code || `CM-${i}`}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{c.euro ? fmtK(parseFloat(c.euro)) : "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ RECENT COMMESSE TABLE + TEAM ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
          {/* Recent orders table */}
          <div style={cardStyle}>
            <div style={{ padding: '18px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Commesse recenti</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, cursor: 'pointer' }} onClick={() => setTab("commesse")}>Vedi tutte</span>
            </div>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 100px 90px 100px', padding: '10px 22px', borderTop: `1px solid ${C.borderL}`, borderBottom: `1px solid ${C.borderL}`, fontSize: 11, fontWeight: 600, color: C.hint }}>
              <span>Commessa</span><span>Cliente</span><span>Importo</span><span>Fase</span><span>Stato</span>
            </div>
            {D.recenti.map((c, i) => {
              const gg = giorniFermaCM(c);
              const ferma = gg >= sogliaDays;
              return (
                <div key={c.id || i} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 100px 90px 100px', padding: '12px 22px', borderBottom: `1px solid ${C.borderL}`, alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s', fontSize: 13 }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.borderL)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: FC[c.fase] + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: FC[c.fase], flexShrink: 0 }}>{(c.cliente||"?")[0]}</div>
                    <span style={{ fontWeight: 600, color: C.ink }}>{c.code || `CM-${String(i).padStart(4,'0')}`}</span>
                  </div>
                  <span style={{ color: C.text }}>{c.cliente} {c.cognome||""}</span>
                  <span style={{ fontWeight: 600, fontFamily: FM, fontSize: 12, color: C.ink }}>{c.euro ? fmtK(parseFloat(c.euro)) : "—"}</span>
                  <Status stato={c.fase} />
                  <div>
                    {ferma
                      ? <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: C.redBg, color: C.redT }}>Ferma</span>
                      : <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: C.greenBg, color: C.greenT }}>Attiva</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team + attività */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Team */}
            <div style={cardStyle}>
              <div style={{ padding: '18px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Team attivo</span>
                <span style={{ fontSize: 11, color: C.sub, cursor: 'pointer' }} onClick={() => setTab("team")}>···</span>
              </div>
              {(team.length > 0 ? team : [{ id: "1", nome: "Titolare", ruolo: "Titolare" }]).map((m, i) => {
                const inC = montaggiDB.some(mt => mt.operatoreId === m.id && mt.data === TODAY);
                const tc = tasks.filter(t => t.assegnatoA === m.id && !t.done).length;
                return (
                  <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderTop: `1px solid ${C.borderL}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.tealT, flexShrink: 0 }}>{(m.nome||"?")[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{m.nome}</div>
                      <div style={{ fontSize: 11, color: C.hint }}>{m.ruolo || "—"}{tc > 0 ? ` · ${tc} task` : ""}</div>
                    </div>
                    {inC && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: C.greenBg, color: C.greenT }}>Cantiere</span>}
                    {!inC && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: C.borderL, color: C.sub }}>Ufficio</span>}
                  </div>
                );
              })}
            </div>

            {/* Oggi */}
            <div style={cardStyle}>
              <div style={{ padding: '18px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Oggi</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, cursor: 'pointer' }} onClick={() => setTab("calendario")}>Agenda →</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${C.borderL}` }}>
                {[
                  { n: D.montOggi.length, l: "Montaggi", c: C.purple, bg: C.purpleBg },
                  { n: D.taskOggi.length, l: "Task", c: C.amber, bg: C.amberBg },
                  { n: D.mont7.length, l: "7gg mont.", c: C.blue, bg: C.blueBg },
                ].map((t, i) => (
                  <div key={t.l} style={{ textAlign: 'center', padding: '16px 8px', borderRight: i < 2 ? `1px solid ${C.borderL}` : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18, fontWeight: 700, color: t.c }}>{t.n}</div>
                    <div style={{ fontSize: 11, color: C.sub, fontWeight: 500 }}>{t.l}</div>
                  </div>
                ))}
              </div>
              {D.montOggi.length > 0 && D.montOggi.slice(0, 3).map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 22px', borderTop: `1px solid ${C.borderL}` }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{m.cliente || "—"}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.purple }}>{m.orario || ""}</span>
                </div>
              ))}
            </div>

            {/* Criticità count */}
            {(D.ferme.length > 0 || D.fattScad.length > 0 || D.probAp.length > 0) && (
              <div style={{ ...cardStyle, borderColor: C.red + '30' }}>
                <div style={{ padding: '18px 22px 14px' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Attenzione</span>
                </div>
                {D.ferme.length > 0 && (
                  <div onClick={() => setTab("commesse")} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 22px', borderTop: `1px solid ${C.borderL}`, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.borderL)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.amber }} />
                    <span style={{ flex: 1, fontSize: 13, color: C.text }}><strong>{D.ferme.length}</strong> commesse ferme · {pct(D.ferme.length, D.attive.length)}%</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={C.hint} strokeWidth="1.5"><path d="M6 4l4 4-4 4" /></svg>
                  </div>
                )}
                {D.fattScad.length > 0 && (
                  <div onClick={() => setTab("contabilita")} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 22px', borderTop: `1px solid ${C.borderL}`, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.borderL)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red }} />
                    <span style={{ flex: 1, fontSize: 13, color: C.text }}><strong>{D.fattScad.length}</strong> fatture scadute · {fmtK(D.totScad)}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={C.hint} strokeWidth="1.5"><path d="M6 4l4 4-4 4" /></svg>
                  </div>
                )}
                {D.probAp.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 22px', borderTop: `1px solid ${C.borderL}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red }} />
                    <span style={{ flex: 1, fontSize: 13, color: C.text }}><strong>{D.probAp.length}</strong> problemi aperti</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
