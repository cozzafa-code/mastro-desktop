"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO HQ — Enterprise Dashboard v3
// Design: Linear meets Stripe — dense, precise, zero waste
// Uses: mastro-design-system.ts
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import {
  P, FONT, S, SHADOW, CARD, CARD_HOVER, BTN, BADGE,
  SECTION_HEAD, ROW, ROW_HOVER_BG, AVATAR, DOT, progressBar,
  fmtE, fmtK, pct, daysTo, TODAY,
  FASI, FASE_LABEL, FASE_COLOR,
} from "./mastro-design-system";

// ── Hover helpers ──────────────────────────────────────────────
const hoverCard = (e) => { Object.assign(e.currentTarget.style, CARD_HOVER); };
const leaveCard = (e) => { e.currentTarget.style.boxShadow = SHADOW.card; e.currentTarget.style.borderColor = P.border; };
const hoverRow = (e) => { e.currentTarget.style.background = ROW_HOVER_BG; };
const leaveRow = (e) => { e.currentTarget.style.background = 'transparent'; };

// ── Semaforo logic ─────────────────────────────────────────────
function semaforo(ferme, attive, scadute, problemi) {
  const r = attive > 0 ? ferme / attive : 0;
  if (r > 0.25 || scadute > 3 || problemi > 5) return { c: P.red, l: "Criticità operativa" };
  if (r > 0.1 || scadute > 0 || problemi > 0) return { c: P.amber, l: "Attenzione richiesta" };
  return { c: P.green, l: "Operativo" };
}

// ═══════════════════════════════════════════════════════════════
export default function DesktopDashboard() {
  const {
    cantieri = [], fattureDB = [], ordiniFornDB = [], montaggiDB = [],
    tasks = [], msgs = [], team = [], problemi = [], aziendaInfo,
    setTab, setSelectedCM, setFilterFase, giorniFermaCM, sogliaDays = 7,
  } = useMastro();

  const [critOpen, setCritOpen] = useState(true);
  const today = TODAY();

  const D = useMemo(() => {
    const attive = cantieri.filter(c => c.fase !== "chiusura");
    const ferme = attive.filter(c => giorniFermaCM(c) >= sogliaDays).sort((a, b) => giorniFermaCM(b) - giorniFermaCM(a));
    const conf = attive.filter(c => ["conferma","misure","ordini","produzione","posa"].includes(c.fase));
    const pipe = attive.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
    const pipeConf = conf.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);

    const fattScad = fattureDB.filter(f => !f.pagata && f.scadenza && f.scadenza < today);
    const daInc = fattureDB.filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
    const totScad = fattScad.reduce((s, f) => s + (f.importo || 0), 0);

    const probAp = (problemi || []).filter(p => p.stato !== "risolto");
    const montOggi = montaggiDB.filter(m => m.data === today);
    const taskOggi = tasks.filter(t => !t.done && t.date === today);
    const msgNL = msgs.filter(m => !m.letto).length;

    const inProd = attive.filter(c => c.fase === "produzione");
    const inOrd = attive.filter(c => c.fase === "ordini");
    const inPosa = attive.filter(c => c.fase === "posa");
    const ordForn = (ordiniFornDB || []).filter(o => o.stato === "inviato");

    const LIMIT7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const mont7 = montaggiDB.filter(m => m.data >= today && m.data <= LIMIT7);
    const cons7 = cantieri.filter(c => c.dataConsegna && c.dataConsegna >= today && c.dataConsegna <= LIMIT7 && c.fase !== "chiusura");

    // Criticità
    const crit = [];
    ferme.slice(0, 5).forEach(c => {
      const gg = giorniFermaCM(c);
      crit.push({ id: `f${c.id}`, t: `${c.cliente} ${c.cognome||""} — ferma ${gg}gg`, d: `${FASE_LABEL[c.fase]||c.fase} · ${c.code}`, imp: c.euro ? fmtK(parseFloat(c.euro)) : "—", col: gg>=30?P.red:P.amber, fn: () => { setSelectedCM(c); setTab("commesse"); } });
    });
    fattScad.slice(0, 3).forEach(f => {
      crit.push({ id: `s${f.id}`, t: `Fattura scaduta — ${f.cliente||f.numero||"—"}`, d: `Da ${Math.abs(daysTo(f.scadenza))}gg`, imp: fmtE(f.importo||0), col: P.red, fn: () => setTab("contabilita") });
    });
    probAp.slice(0, 2).forEach(p => {
      crit.push({ id: `p${p.id}`, t: p.titolo||"Problema", d: `${p.tipo||""}${p.commessa?` · ${p.commessa}`:""}`, imp: "—", col: p.priorita==="alta"?P.red:P.amber });
    });

    const prat = { p50: cantieri.filter(c=>c.detrazione==="50"), p65: cantieri.filter(c=>c.detrazione==="65"), p75: cantieri.filter(c=>c.detrazione==="75") };

    return { attive, ferme, conf, pipe, pipeConf, fattScad, daInc, totScad, probAp, montOggi, taskOggi, msgNL, inProd, inOrd, inPosa, ordForn, mont7, cons7, crit, prat };
  }, [cantieri, fattureDB, ordiniFornDB, montaggiDB, tasks, msgs, team, problemi, sogliaDays]);

  const sem = semaforo(D.ferme.length, D.attive.length, D.fattScad.length, D.probAp.length);
  const now = new Date();
  const sal = now.getHours() < 12 ? "Buongiorno" : now.getHours() < 18 ? "Buon pomeriggio" : "Buonasera";
  const nome = aziendaInfo?.ragione || aziendaInfo?.nome || "Walter Cozza Serramenti";
  const dateStr = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ height: "100%", overflowY: "auto", background: P.bg, fontFamily: FONT.sans }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');`}</style>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 28px 48px" }}>

        {/* ═══ PAGE HEADER ═══ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ ...DOT(sem.c, 10) }} />
              <span style={{ fontSize: S.xs, fontWeight: 700, color: sem.c, textTransform: "uppercase", letterSpacing: 1 }}>{sem.l}</span>
            </div>
            <h1 style={{ fontSize: S.h1, fontWeight: 800, color: P.ink, margin: 0, letterSpacing: -0.5 }}>{sal}, {nome}</h1>
            <p style={{ fontSize: S.md, color: P.hint, margin: "4px 0 0" }}>{dateStr}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: S.sm, color: P.hint, marginRight: 8 }}>
              {D.attive.length} attive · {D.montOggi.length} montaggi oggi
              {D.ferme.length > 0 && <span style={{ color: P.red, fontWeight: 700 }}> · {D.ferme.length} ferme</span>}
            </span>
            <button style={BTN.primary} onClick={() => setTab("commesse")}>+ Commessa</button>
            <button style={BTN.secondary} onClick={() => setTab("calendario")}>Agenda</button>
          </div>
        </div>

        {/* ═══ ALERT STRIP ═══ */}
        {(D.fattScad.length > 0 || D.ferme.length > 0) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {D.fattScad.length > 0 && (
              <div onClick={() => setTab("contabilita")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: S.r8, background: P.redL, border: `1px solid ${P.red}20`, cursor: "pointer" }}>
                <div style={DOT(P.red, 6)} />
                <span style={{ fontSize: S.sm, fontWeight: 700, color: P.red }}>{D.fattScad.length} fatture scadute · {fmtK(D.totScad)}</span>
              </div>
            )}
            {D.ferme.length > 0 && (
              <div onClick={() => setTab("commesse")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: S.r8, background: P.amberL, border: `1px solid ${P.amber}20`, cursor: "pointer" }}>
                <div style={DOT(P.amber, 6)} />
                <span style={{ fontSize: S.sm, fontWeight: 700, color: P.amber }}>{D.ferme.length} commesse ferme · {pct(D.ferme.length, D.attive.length)}%</span>
              </div>
            )}
            {D.probAp.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: S.r8, background: P.redL, border: `1px solid ${P.red}20` }}>
                <div style={DOT(P.red, 6)} />
                <span style={{ fontSize: S.sm, fontWeight: 700, color: P.red }}>{D.probAp.length} problemi</span>
              </div>
            )}
          </div>
        )}

        {/* ═══ KPI ROW ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { l: "Commesse attive", v: D.attive.length, s: `${D.conf.length} confermate`, c: P.blue, pV: D.conf.length, pO: D.attive.length, fn: () => setTab("commesse") },
            { l: "Ferme", v: D.ferme.length, s: `soglia ${sogliaDays}gg`, c: D.ferme.length>0?P.red:P.green, fn: () => setTab("commesse") },
            { l: "Pipeline", v: fmtK(D.pipe), s: `${fmtK(D.pipeConf)} confermato`, c: P.green, pV: D.pipeConf, pO: D.pipe },
            { l: "Da incassare", v: fmtK(D.daInc), s: `${D.fattScad.length} scadute`, c: D.fattScad.length>0?P.amber:P.green, fn: () => setTab("contabilita") },
            { l: "Messaggi", v: D.msgNL, s: `${msgs.length} totali`, c: D.msgNL>0?P.blue:P.teal, fn: () => setTab("messaggi") },
            { l: "Oggi", v: D.montOggi.length+D.taskOggi.length, s: `${D.montOggi.length} mont · ${D.taskOggi.length} task`, c: P.purple, fn: () => setTab("calendario") },
          ].map(k => {
            const pb = k.pO !== undefined ? progressBar(k.pV, k.pO, k.c) : null;
            return (
              <div key={k.l} onClick={k.fn} style={{ ...CARD, padding: "18px 20px", cursor: k.fn ? "pointer" : "default" }}
                onMouseEnter={k.fn ? hoverCard : undefined} onMouseLeave={k.fn ? leaveCard : undefined}>
                <div style={{ fontSize: S.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: P.hint, marginBottom: 8 }}>{k.l}</div>
                <div style={{ fontSize: S.hero, fontWeight: 900, color: k.c, fontFamily: FONT.mono, lineHeight: 1 }}>{k.v}</div>
                <div style={{ fontSize: S.xs, color: P.hint, marginTop: 6 }}>{k.s}</div>
                {pb && <><div style={pb.container}><div style={pb.fill} /></div><div style={{ fontSize: 9, color: P.hint, marginTop: 3 }}>{pct(k.pV, k.pO)}%</div></>}
              </div>
            );
          })}
        </div>

        {/* ═══ CRITICITÀ ═══ */}
        {D.crit.length > 0 && critOpen && (
          <div style={{ ...CARD, marginBottom: 20, borderColor: P.red + '25' }}>
            <div style={{ ...SECTION_HEAD }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={DOT(P.red)} />
                <span style={{ fontSize: S.lg, fontWeight: 800, color: P.ink }}>Criticità prioritarie</span>
                <span style={BADGE(P.red, P.redL)}>{D.crit.length}</span>
              </div>
              <button onClick={() => setCritOpen(false)} style={BTN.ghost}>Nascondi</button>
            </div>
            {D.crit.map(cr => (
              <div key={cr.id} onClick={cr.fn} style={{ ...ROW, gap: 14 }}
                onMouseEnter={cr.fn ? hoverRow : undefined} onMouseLeave={cr.fn ? leaveRow : undefined}>
                <div style={{ width: 3, height: 28, borderRadius: 2, background: cr.col, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: S.md, fontWeight: 700, color: P.ink }}>{cr.t}</div>
                  <div style={{ fontSize: S.sm, color: P.hint, marginTop: 2 }}>{cr.d}</div>
                </div>
                <span style={{ fontSize: S.lg, fontWeight: 800, color: cr.col, fontFamily: FONT.mono }}>{cr.imp}</span>
                {cr.fn && <span style={{ fontSize: S.xs, color: P.teal, fontWeight: 700, padding: "4px 10px", borderRadius: S.r6, border: `1px solid ${P.border}`, cursor: "pointer" }}>Apri →</span>}
              </div>
            ))}
          </div>
        )}

        {/* ═══ MAIN GRID ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

          {/* COL 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Pipeline */}
            <div style={CARD} onMouseEnter={hoverCard} onMouseLeave={leaveCard}>
              <div style={SECTION_HEAD}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={DOT(P.blue)} />
                  <span style={{ fontSize: S.lg, fontWeight: 800, color: P.ink }}>Pipeline</span>
                  <span style={BADGE(P.blue, P.blueL)}>{D.attive.length}</span>
                </div>
                <button onClick={() => setTab("commesse")} style={BTN.ghost}>Tutte →</button>
              </div>
              <div style={{ padding: "16px 20px 12px" }}>
                <div style={{ display: "flex", gap: 2, height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
                  {FASI.map(f => { const n = cantieri.filter(c => c.fase === f).length; return n ? <div key={f} style={{ flex: n, background: FASE_COLOR[f], minWidth: 3, transition: "flex .4s" }} title={`${FASE_LABEL[f]}: ${n}`} /> : null; })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {FASI.filter(f => f !== "chiusura").map(f => {
                    const n = cantieri.filter(c => c.fase === f).length;
                    const e = cantieri.filter(c => c.fase === f).reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
                    return (
                      <div key={f} onClick={() => { setFilterFase(f); setTab("commesse"); }}
                        style={{ padding: "10px 12px", borderRadius: S.r10, background: P.raised, border: `1px solid ${P.borderL}`, cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e2 => { e2.currentTarget.style.borderColor = FASE_COLOR[f]; e2.currentTarget.style.background = P.surface; }}
                        onMouseLeave={e2 => { e2.currentTarget.style.borderColor = P.borderL; e2.currentTarget.style.background = P.raised; }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: P.hint, textTransform: "uppercase" }}>{FASE_LABEL[f]}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: FONT.mono, color: n > 0 ? FASE_COLOR[f] : P.ghost, lineHeight: 1, marginTop: 3 }}>{n}</div>
                        {e > 0 && <div style={{ fontSize: 9, color: P.hint, marginTop: 3 }}>{fmtK(e)}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Economia */}
            <div style={CARD} onMouseEnter={hoverCard} onMouseLeave={leaveCard}>
              <div style={SECTION_HEAD}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={DOT(P.green)} />
                  <span style={{ fontSize: S.lg, fontWeight: 800, color: P.ink }}>Controllo economico</span>
                </div>
                <button onClick={() => setTab("contabilita")} style={BTN.ghost}>Dettagli →</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {[
                  { l: "Pipeline", v: fmtK(D.pipe), c: P.ink },
                  { l: "Confermato", v: fmtK(D.pipeConf), c: P.teal },
                  { l: "Da incassare", v: fmtK(D.daInc), c: P.amber },
                  { l: "Scaduto", v: fmtK(D.totScad), c: D.totScad > 0 ? P.red : P.green },
                ].map((k, i) => (
                  <div key={k.l} style={{ padding: "16px 20px", borderBottom: i < 2 ? `1px solid ${P.borderL}` : "none", borderRight: i % 2 === 0 ? `1px solid ${P.borderL}` : "none" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: P.hint, marginBottom: 6 }}>{k.l}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: k.c, fontFamily: FONT.mono, lineHeight: 1 }}>{k.v}</div>
                  </div>
                ))}
              </div>
              {D.fattScad.length > 0 && D.fattScad.slice(0, 3).map(f => (
                <div key={f.id} onClick={() => setTab("contabilita")} style={{ ...ROW, gap: 12 }}
                  onMouseEnter={hoverRow} onMouseLeave={leaveRow}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: S.md, fontWeight: 600, color: P.ink }}>{f.cliente || f.numero || "—"}</span>
                  </div>
                  <span style={{ fontSize: S.md, fontWeight: 800, color: P.amber, fontFamily: FONT.mono }}>{fmtK(f.importo || 0)}</span>
                  <span style={{ fontSize: S.sm, fontWeight: 700, color: P.red }}>-{Math.abs(daysTo(f.scadenza))}gg</span>
                </div>
              ))}
            </div>

            {/* Produzione */}
            <div style={CARD} onMouseEnter={hoverCard} onMouseLeave={leaveCard}>
              <div style={SECTION_HEAD}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={DOT(P.orange)} />
                  <span style={{ fontSize: S.lg, fontWeight: 800, color: P.ink }}>Produzione</span>
                  <span style={BADGE(P.orange, P.orangeL)}>{D.inProd.length}</span>
                </div>
                <button onClick={() => setTab("produzione")} style={BTN.ghost}>Dettagli →</button>
              </div>
              {[
                { l: "In produzione", v: D.inProd.length, c: P.orange, fn: () => setTab("produzione") },
                { l: "Attesa ordini", v: D.inOrd.length, c: P.amber, fn: () => setTab("ordini") },
                { l: "Pronte posa", v: D.inPosa.length, c: P.green, fn: () => setTab("montaggi") },
                { l: "Ordini fornitori", v: D.ordForn.length, c: P.blue, fn: () => setTab("ordini") },
              ].map(r => (
                <div key={r.l} onClick={r.fn} style={{ ...ROW, justifyContent: "space-between" }}
                  onMouseEnter={hoverRow} onMouseLeave={leaveRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={DOT(r.c, 6)} />
                    <span style={{ fontSize: S.md, color: P.text }}>{r.l}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, fontFamily: FONT.mono, color: r.v > 0 ? r.c : P.ghost }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COL 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Oggi + 7gg */}
            <div style={CARD} onMouseEnter={hoverCard} onMouseLeave={leaveCard}>
              <div style={SECTION_HEAD}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={DOT(P.purple)} />
                  <span style={{ fontSize: S.lg, fontWeight: 800, color: P.ink }}>Oggi e prossimi 7 giorni</span>
                </div>
                <button onClick={() => setTab("calendario")} style={BTN.ghost}>Agenda →</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
                {[
                  { n: D.montOggi.length, l: "montaggi oggi", c: P.purple },
                  { n: D.taskOggi.length, l: "task oggi", c: P.amber },
                  { n: D.mont7.length, l: "montaggi 7gg", c: P.blue },
                  { n: D.cons7.length, l: "consegne 7gg", c: P.green },
                ].map((t, i) => (
                  <div key={t.l} style={{ textAlign: "center", padding: "16px 8px", borderRight: i < 3 ? `1px solid ${P.borderL}` : "none" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, fontFamily: FONT.mono, color: t.c, lineHeight: 1 }}>{t.n}</div>
                    <div style={{ fontSize: 9, color: P.hint, marginTop: 6, fontWeight: 600, textTransform: "uppercase" }}>{t.l}</div>
                  </div>
                ))}
              </div>
              {D.montOggi.length > 0 && D.montOggi.slice(0, 4).map(m => (
                <div key={m.id} style={{ padding: "9px 20px", borderTop: `1px solid ${P.borderL}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: S.md, fontWeight: 700, color: P.ink }}>{m.cliente || "—"}</span>
                    <span style={{ fontSize: S.md, fontWeight: 700, color: P.purple, fontFamily: FONT.mono }}>{m.orario || ""}</span>
                  </div>
                  {m.indirizzo && <div style={{ fontSize: S.sm, color: P.hint, marginTop: 1 }}>{m.indirizzo}</div>}
                </div>
              ))}
            </div>

            {/* Ferme */}
            <div style={{ ...CARD, borderColor: D.ferme.length > 0 ? P.red + '25' : P.border }} onMouseEnter={hoverCard} onMouseLeave={leaveCard}>
              <div style={SECTION_HEAD}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={DOT(D.ferme.length > 0 ? P.red : P.green)} />
                  <span style={{ fontSize: S.lg, fontWeight: 800, color: P.ink }}>Da sbloccare</span>
                  {D.ferme.length > 0 && <span style={BADGE(P.red, P.redL)}>{D.ferme.length}</span>}
                </div>
                {D.ferme.length > 0 && <button onClick={() => setTab("commesse")} style={BTN.ghost}>Tutte →</button>}
              </div>
              {D.ferme.length === 0
                ? <div style={{ padding: "20px", fontSize: S.md, color: P.hint, textAlign: "center" }}>Tutto in ordine</div>
                : D.ferme.slice(0, 6).map(c => {
                    const gg = giorniFermaCM(c);
                    const col = gg >= 30 ? P.red : gg >= 15 ? P.orange : P.amber;
                    return (
                      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                        style={{ ...ROW, gap: 12 }} onMouseEnter={hoverRow} onMouseLeave={leaveRow}>
                        <div style={AVATAR(34, col)}>{(c.cliente || "?")[0]}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: S.md, fontWeight: 700, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.cliente} {c.cognome || ""}</div>
                          <div style={{ fontSize: S.sm, color: P.hint }}>{FASE_LABEL[c.fase] || c.fase}{c.euro ? ` · ${fmtK(parseFloat(c.euro))}` : ""}</div>
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 900, color: col, fontFamily: FONT.mono }}>{gg}gg</span>
                      </div>
                    );
                  })
              }
            </div>

            {/* Team */}
            <div style={CARD} onMouseEnter={hoverCard} onMouseLeave={leaveCard}>
              <div style={SECTION_HEAD}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={DOT(P.teal)} />
                  <span style={{ fontSize: S.lg, fontWeight: 800, color: P.ink }}>Team</span>
                </div>
                <button onClick={() => setTab("team")} style={BTN.ghost}>Gestione →</button>
              </div>
              {(team.length > 0 ? team : [{ id: "1", nome: "Titolare", ruolo: "Titolare" }]).map((m, i) => {
                const inC = montaggiDB.some(mt => mt.operatoreId === m.id && mt.data === today);
                const tc = tasks.filter(t => t.assegnatoA === m.id && !t.done).length;
                return (
                  <div key={m.id || i} style={{ ...ROW, gap: 12 }}>
                    <div style={AVATAR(34, P.teal)}>{(m.nome || "?")[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: S.md, fontWeight: 700, color: P.ink }}>{m.nome}</div>
                      <div style={{ fontSize: S.sm, color: P.hint }}>{m.ruolo || "—"}</div>
                    </div>
                    {inC && <span style={BADGE(P.green, P.greenL)}>Cantiere</span>}
                    {tc > 0 && <span style={BADGE(P.amber, P.amberL)}>{tc} task</span>}
                  </div>
                );
              })}
            </div>

            {/* Pratiche */}
            <div style={CARD} onMouseEnter={hoverCard} onMouseLeave={leaveCard}>
              <div style={SECTION_HEAD}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={DOT(P.blue)} />
                  <span style={{ fontSize: S.lg, fontWeight: 800, color: P.ink }}>Pratiche fiscali</span>
                </div>
              </div>
              {[
                { l: "Ristrutturazione 50%", v: D.prat.p50.length, c: P.teal },
                { l: "Ecobonus 65%", v: D.prat.p65.length, c: P.blue },
                { l: "Barriere 75%", v: D.prat.p75.length, c: P.purple },
              ].map(r => (
                <div key={r.l} onClick={() => setTab("enea")} style={{ ...ROW, justifyContent: "space-between" }}
                  onMouseEnter={hoverRow} onMouseLeave={leaveRow}>
                  <span style={{ fontSize: S.md, color: P.text }}>{r.l}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, fontFamily: FONT.mono, color: r.v > 0 ? r.c : P.ghost }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
