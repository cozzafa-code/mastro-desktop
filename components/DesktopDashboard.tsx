"use client";
// ═══════════════════════════════════════════════════════════════
// MASTRO HQ — Centro di Controllo Totale
// Phase 1: Hero + Criticità + Pipeline Live + Economia + Team
// Design: Industrial Control Room — costoso, preciso, vivo
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";

// ── DESIGN TOKENS ──────────────────────────────────────────────
const C = {
  bg: "#F2F1EC",
  surface: "#FFFFFF",
  raised: "#F8F7F2",
  rim: "#E5E4DF",
  rimLight: "#F2F1EC",
  ink: "#1A1A1C",
  sub: "#86868b",
  ghost: "#C0C0C5",
  teal: "#1A9E73",
  amber: "#D08008",
  red: "#DC4444",
  blue: "#3B7FE0",
  purple: "#8B5CF6",
  orange: "#F97316",
  yellow: "#F59E0B",
};
const FM = "'JetBrains Mono','SF Mono','Fira Code',monospace";
const FF = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";

// ── HELPERS ────────────────────────────────────────────────────
const fmtE = (n: number) => "€" + Math.round(n).toLocaleString("it-IT");
const fmtK = (n: number) => (n >= 1000 ? "€" + Math.round(n / 1000) + "k" : fmtE(n));
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const daysTo = (d: string) => Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
const TODAY = new Date().toISOString().split("T")[0];

const FASI = ["sopralluogo", "preventivo", "conferma", "misure", "ordini", "produzione", "posa", "chiusura"] as const;
const FASE_LABEL: Record<string, string> = { sopralluogo: "Sopralluogo", preventivo: "Preventivo", conferma: "Conferma", misure: "Misure", ordini: "Ordini", produzione: "Produzione", posa: "Posa", chiusura: "Chiusura" };
const FASE_COLOR: Record<string, string> = { sopralluogo: C.blue, preventivo: C.amber, conferma: C.teal, misure: C.purple, ordini: C.red, produzione: C.orange, posa: C.yellow, chiusura: C.teal };

// ── MICRO COMPONENTS ───────────────────────────────────────────

function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ height: 3, borderRadius: 2, background: C.rimLight, overflow: "hidden", marginTop: 6 }}>
      <div style={{ height: "100%", width: `${Math.min(pct(value, max), 100)}%`, background: color, borderRadius: 2, transition: "width .4s ease" }} />
    </div>
  );
}

function SectionTitle({ children, count, color }: { children: string; count?: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      {color && <Dot color={color} />}
      <span style={{ fontSize: 13, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: 0.8 }}>{children}</span>
      {count !== undefined && <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: (color || C.ink) + "12", color: color || C.ink, fontWeight: 800 }}>{count}</span>}
    </div>
  );
}

// ── SEMAFORO AZIENDA ───────────────────────────────────────────
function semaforoAzienda(ferme: number, attive: number, fattScadute: number, problemi: number): { color: string; label: string; level: string } {
  const pFerme = attive > 0 ? (ferme / attive) * 100 : 0;
  if (pFerme > 25 || fattScadute > 3 || problemi > 5) return { color: C.red, label: "Criticità operative", level: "ROSSO" };
  if (pFerme > 10 || fattScadute > 0 || problemi > 0) return { color: C.amber, label: "Attenzione richiesta", level: "GIALLO" };
  return { color: C.teal, label: "Sotto controllo", level: "VERDE" };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DesktopDashboard() {
  const {
    cantieri = [], fattureDB = [], ordiniFornDB = [], montaggiDB = [],
    tasks = [], msgs = [], team = [], problemi = [], aziendaInfo,
    setTab, setSelectedCM, setFilterFase, giorniFermaCM, sogliaDays = 7,
  } = useMastro();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // ── COMPUTED DATA ──────────────────────────────────────────
  const data = useMemo(() => {
    const attive = cantieri.filter((c: any) => c.fase !== "chiusura");
    const ferme = attive.filter((c: any) => giorniFermaCM(c) >= sogliaDays);
    const confermati = attive.filter((c: any) => ["conferma", "misure", "ordini", "produzione", "posa"].includes(c.fase));
    const totPipeline = attive.reduce((s: number, c: any) => s + (parseFloat(c.euro) || 0), 0);
    const totConfermato = confermati.reduce((s: number, c: any) => s + (parseFloat(c.euro) || 0), 0);

    const fattNonPagate = fattureDB.filter((f: any) => !f.pagata);
    const daIncassare = fattNonPagate.reduce((s: number, f: any) => s + (f.importo || 0), 0);
    const fattScadute = fattureDB.filter((f: any) => !f.pagata && f.scadenza && f.scadenza < TODAY);
    const totScaduto = fattScadute.reduce((s: number, f: any) => s + (f.importo || 0), 0);

    const problemiAperti = (problemi || []).filter((p: any) => p.stato !== "risolto");
    const montaggiOggi = montaggiDB.filter((m: any) => m.data === TODAY);
    const taskOggi = tasks.filter((t: any) => !t.done && t.date === TODAY);
    const msgNonLetti = msgs.filter((m: any) => !m.letto).length;

    const inProduzione = attive.filter((c: any) => c.fase === "produzione");
    const inPosa = attive.filter((c: any) => c.fase === "posa");
    const inOrdini = attive.filter((c: any) => c.fase === "ordini");

    // Criticità auto-generate
    const criticita: Array<{ id: string; gravita: "alta" | "media" | "bassa"; titolo: string; dettaglio: string; modulo: string; impatto: string; azione: string; onClick?: () => void }> = [];

    ferme.sort((a: any, b: any) => giorniFermaCM(b) - giorniFermaCM(a)).slice(0, 5).forEach((c: any) => {
      const gg = giorniFermaCM(c);
      criticita.push({
        id: `ferma-${c.id}`, gravita: gg >= 30 ? "alta" : "media",
        titolo: `${c.cliente} ${c.cognome || ""} — ferma da ${gg} giorni`,
        dettaglio: `Fase: ${FASE_LABEL[c.fase] || c.fase} · ${c.code}`,
        modulo: "Commesse", impatto: c.euro ? `${fmtK(parseFloat(c.euro))} bloccati` : "Blocco avanzamento",
        azione: "Apri commessa", onClick: () => { setSelectedCM(c); setTab("commesse"); },
      });
    });

    fattScadute.slice(0, 3).forEach((f: any) => {
      criticita.push({
        id: `fatt-${f.id}`, gravita: "alta",
        titolo: `Fattura scaduta — ${f.cliente || f.numero || "—"}`,
        dettaglio: `Scaduta da ${Math.abs(daysTo(f.scadenza))} giorni`,
        modulo: "Contabilità", impatto: fmtE(f.importo || 0),
        azione: "Vai a contabilità", onClick: () => setTab("contabilita"),
      });
    });

    problemiAperti.slice(0, 3).forEach((p: any) => {
      criticita.push({
        id: `prob-${p.id}`, gravita: p.priorita === "alta" ? "alta" : "media",
        titolo: p.titolo || "Problema aperto",
        dettaglio: `${p.tipo || ""} ${p.commessa ? `· ${p.commessa}` : ""}`,
        modulo: "Problemi", impatto: "Da risolvere",
        azione: "Dettaglio",
      });
    });

    criticita.sort((a, b) => (a.gravita === "alta" ? 0 : a.gravita === "media" ? 1 : 2) - (b.gravita === "alta" ? 0 : b.gravita === "media" ? 1 : 2));

    // Prossimi 7gg
    const LIMIT7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const consegne7 = cantieri.filter((c: any) => c.dataConsegna && c.dataConsegna >= TODAY && c.dataConsegna <= LIMIT7 && c.fase !== "chiusura");
    const montaggi7 = montaggiDB.filter((m: any) => m.data >= TODAY && m.data <= LIMIT7);

    return {
      attive, ferme, confermati, totPipeline, totConfermato,
      daIncassare, fattScadute, totScaduto, fattNonPagate,
      problemiAperti, montaggiOggi, taskOggi, msgNonLetti,
      inProduzione, inPosa, inOrdini, criticita,
      consegne7, montaggi7,
    };
  }, [cantieri, fattureDB, ordiniFornDB, montaggiDB, tasks, msgs, team, problemi, sogliaDays]);

  const semaforo = semaforoAzienda(data.ferme.length, data.attive.length, data.fattScadute.length, data.problemiAperti.length);
  const NOW = new Date();
  const h = NOW.getHours();
  const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  const nomeAzienda = aziendaInfo?.ragione || aziendaInfo?.nome || "MASTRO";

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg, fontFamily: FF }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "20px 28px 40px" }}>

        {/* ═══ HERO PANEL ═══════════════════════════════════════ */}
        <div style={{ background: C.ink, borderRadius: 16, padding: "24px 30px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
              {/* Semaforo */}
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: semaforo.color, boxShadow: `0 0 12px ${semaforo.color}80` }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: semaforo.color, textTransform: "uppercase", letterSpacing: 1 }}>{semaforo.label}</span>
              <span style={{ fontSize: 11, color: "#ffffff50", marginLeft: 8 }}>{NOW.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", letterSpacing: -0.5, lineHeight: 1.3 }}>
              {saluto}, {nomeAzienda}
            </div>
            <div style={{ fontSize: 13, color: "#ffffff80", marginTop: 6, lineHeight: 1.5 }}>
              {data.attive.length} commesse attive · {data.montaggiOggi.length} montaggi oggi · {data.ferme.length > 0 ? <span style={{ color: C.red }}>{data.ferme.length} ferme</span> : <span style={{ color: C.teal }}>nessuna ferma</span>}
              {data.fattScadute.length > 0 && <> · <span style={{ color: C.amber }}>{fmtK(data.totScaduto)} scaduti</span></>}
            </div>
          </div>
          {/* Quick actions */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            {[
              { label: "Criticità", color: data.criticita.length > 0 ? C.red : C.teal, count: data.criticita.length, action: () => setExpandedSection(expandedSection === "criticita" ? null : "criticita") },
              { label: "Agenda", color: C.purple, count: data.montaggiOggi.length + data.taskOggi.length, action: () => setTab("calendario") },
              { label: "Pipeline", color: C.blue, count: data.attive.length, action: () => setTab("commesse") },
            ].map((btn) => (
              <div key={btn.label} onClick={btn.action}
                style={{ padding: "12px 20px", borderRadius: 10, background: btn.color + "20", border: `1px solid ${btn.color}40`, cursor: "pointer", textAlign: "center", minWidth: 100, transition: "transform .1s" }}
                onMouseEnter={(e) => ((e.currentTarget as any).style.transform = "scale(1.03)")}
                onMouseLeave={(e) => ((e.currentTarget as any).style.transform = "scale(1)")}>
                <div style={{ fontSize: 22, fontWeight: 900, color: btn.color, fontFamily: FM, lineHeight: 1 }}>{btn.count}</div>
                <div style={{ fontSize: 11, color: "#ffffffCC", marginTop: 4, fontWeight: 700 }}>{btn.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ ALERT STRIP ══════════════════════════════════════ */}
        {(data.ferme.length > 0 || data.fattScadute.length > 0 || data.problemiAperti.length > 0) && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {data.ferme.length > 0 && (
              <div onClick={() => setTab("commesse")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: C.red + "08", border: `1px solid ${C.red}25`, cursor: "pointer" }}>
                <Dot color={C.red} size={6} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>{data.ferme.length} commesse ferme · {pct(data.ferme.length, data.attive.length)}% — sblocca</span>
              </div>
            )}
            {data.fattScadute.length > 0 && (
              <div onClick={() => setTab("contabilita")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: C.amber + "08", border: `1px solid ${C.amber}25`, cursor: "pointer" }}>
                <Dot color={C.amber} size={6} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.amber }}>{data.fattScadute.length} fatture scadute · {fmtK(data.totScaduto)}</span>
              </div>
            )}
            {data.problemiAperti.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: C.red + "08", border: `1px solid ${C.red}25` }}>
                <Dot color={C.red} size={6} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>{data.problemiAperti.length} problemi aperti</span>
              </div>
            )}
          </div>
        )}

        {/* ═══ KPI ROW ══════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { l: "Commesse attive", v: data.attive.length, sub: `${data.confermati.length} confermate`, color: C.teal, pV: data.confermati.length, pO: data.attive.length, pL: "confermate", click: () => setTab("commesse") },
            { l: "Ferme", v: data.ferme.length, sub: `soglia ${sogliaDays}gg`, color: data.ferme.length > 0 ? C.red : C.teal, pV: data.ferme.length, pO: data.attive.length, pL: "del totale", alert: data.ferme.length > 0, click: () => setTab("commesse") },
            { l: "Pipeline", v: fmtK(data.totPipeline), sub: `${fmtK(data.totConfermato)} confermato`, color: C.ink, pV: data.totConfermato, pO: data.totPipeline, pL: "confermato" },
            { l: "Da incassare", v: fmtK(data.daIncassare), sub: `${data.fattScadute.length} scadute`, color: data.daIncassare > 0 ? C.amber : C.teal, alert: data.fattScadute.length > 0, click: () => setTab("contabilita") },
            { l: "Messaggi", v: data.msgNonLetti, sub: `${msgs.length} totali`, color: data.msgNonLetti > 0 ? C.blue : C.teal, click: () => setTab("messaggi") },
            { l: "Oggi", v: data.montaggiOggi.length + data.taskOggi.length, sub: `${data.montaggiOggi.length} montaggi · ${data.taskOggi.length} task`, color: C.purple, click: () => setTab("calendario") },
          ].map((k) => (
            <div key={k.l} onClick={k.click} style={{ background: k.alert ? k.color + "06" : C.surface, borderRadius: 12, padding: "16px 18px", border: `1px solid ${k.alert ? k.color + "30" : C.rim}`, cursor: k.click ? "pointer" : "default", transition: "box-shadow .15s" }}
              onMouseEnter={(e) => k.click && ((e.currentTarget as any).style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)")}
              onMouseLeave={(e) => ((e.currentTarget as any).style.boxShadow = "none")}>
              <div style={{ fontSize: 10, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{k.l}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: k.color, fontFamily: FM, lineHeight: 1 }}>{k.v}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{k.sub}</div>
              {k.pO !== undefined && <MiniBar value={k.pV!} max={Math.max(k.pO, 1)} color={k.color} />}
              {k.pO !== undefined && <div style={{ fontSize: 9, color: C.sub, marginTop: 3 }}>{pct(k.pV!, k.pO)}% {k.pL}</div>}
            </div>
          ))}
        </div>

        {/* ═══ CRITICITÀ ESPANDIBILI ════════════════════════════ */}
        {data.criticita.length > 0 && expandedSection === "criticita" && (
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.red}20`, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
              <SectionTitle count={data.criticita.length} color={C.red}>Criticità prioritarie</SectionTitle>
            </div>
            {data.criticita.map((cr) => (
              <div key={cr.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: `1px solid ${C.rimLight}`, cursor: cr.onClick ? "pointer" : "default" }}
                onClick={cr.onClick}
                onMouseEnter={(e) => cr.onClick && ((e.currentTarget as any).style.background = C.raised)}
                onMouseLeave={(e) => ((e.currentTarget as any).style.background = "transparent")}>
                <Dot color={cr.gravita === "alta" ? C.red : cr.gravita === "media" ? C.amber : C.teal} size={10} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{cr.titolo}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{cr.dettaglio} · {cr.modulo}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: cr.gravita === "alta" ? C.red : C.amber }}>{cr.impatto}</div>
                </div>
                <div style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.rim}`, fontSize: 11, fontWeight: 700, color: C.sub, flexShrink: 0 }}>{cr.azione}</div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ MAIN GRID: 3 COLUMNS ════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, alignItems: "start" }}>

          {/* ── COL 1: STATO LIVE + PIPELINE ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Pipeline Live */}
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.rim}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                <SectionTitle count={data.attive.length} color={C.blue}>Pipeline live</SectionTitle>
                {/* Barra pipeline */}
                <div style={{ display: "flex", gap: 2, height: 14, borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
                  {FASI.map((fase) => {
                    const n = cantieri.filter((c: any) => c.fase === fase).length;
                    if (!n) return null;
                    return <div key={fase} style={{ flex: n, background: FASE_COLOR[fase], minWidth: 8, transition: "flex .4s" }} title={`${FASE_LABEL[fase]}: ${n}`} />;
                  })}
                </div>
              </div>
              {FASI.filter((f) => f !== "chiusura").map((fase) => {
                const items = cantieri.filter((c: any) => c.fase === fase);
                const euro = items.reduce((s: number, c: any) => s + (parseFloat(c.euro) || 0), 0);
                const col = FASE_COLOR[fase];
                return (
                  <div key={fase} onClick={() => { setFilterFase(fase); setTab("commesse"); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: `1px solid ${C.rimLight}`, cursor: "pointer" }}
                    onMouseEnter={(e) => ((e.currentTarget as any).style.background = C.raised)}
                    onMouseLeave={(e) => ((e.currentTarget as any).style.background = "transparent")}>
                    <Dot color={col} />
                    <span style={{ fontSize: 12, color: C.sub, flex: 1 }}>{FASE_LABEL[fase]}</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: items.length > 0 ? col : C.ghost, fontFamily: FM, minWidth: 28, textAlign: "right" }}>{items.length}</span>
                    {euro > 0 && <span style={{ fontSize: 11, color: C.sub, minWidth: 50, textAlign: "right" }}>{fmtK(euro)}</span>}
                  </div>
                );
              })}
            </div>

            {/* Produzione */}
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.rim}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                <SectionTitle color={C.orange}>Produzione e ordini</SectionTitle>
              </div>
              {[
                { l: "In produzione", n: data.inProduzione.length, c: C.orange },
                { l: "Attesa ordini", n: data.inOrdini.length, c: C.amber },
                { l: "Pronte posa", n: data.inPosa.length, c: C.teal },
                { l: "Ordini fornitori attivi", n: (ordiniFornDB || []).filter((o: any) => o.stato === "inviato").length, c: C.blue },
              ].map((r) => (
                <div key={r.l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Dot color={r.c} size={6} />
                    <span style={{ fontSize: 12, color: C.sub }}>{r.l}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: r.n > 0 ? r.c : C.ghost, fontFamily: FM }}>{r.n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── COL 2: ECONOMIA + CALENDARIO ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Controllo Economico */}
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.rim}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                <SectionTitle color={C.teal}>Controllo economico</SectionTitle>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                {[
                  { l: "Pipeline totale", v: fmtK(data.totPipeline), c: C.ink },
                  { l: "Confermato", v: fmtK(data.totConfermato), c: C.teal },
                  { l: "Da incassare", v: fmtK(data.daIncassare), c: C.amber },
                  { l: "Scaduto", v: fmtK(data.totScaduto), c: data.totScaduto > 0 ? C.red : C.teal },
                ].map((k, i) => (
                  <div key={k.l} style={{ padding: "14px 20px", borderBottom: i < 2 ? `1px solid ${C.rimLight}` : "none", borderRight: i % 2 === 0 ? `1px solid ${C.rimLight}` : "none" }}>
                    <div style={{ fontSize: 10, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{k.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: k.c, fontFamily: FM, lineHeight: 1 }}>{k.v}</div>
                  </div>
                ))}
              </div>
              {data.fattScadute.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.rimLight}` }}>
                  <div style={{ padding: "10px 20px 6px", fontSize: 10, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.5 }}>Fatture scadute</div>
                  {data.fattScadute.slice(0, 3).map((f: any) => (
                    <div key={f.id} onClick={() => setTab("contabilita")} style={{ display: "flex", justifyContent: "space-between", padding: "8px 20px", borderBottom: `1px solid ${C.rimLight}`, cursor: "pointer" }}>
                      <span style={{ fontSize: 12, color: C.ink }}>{f.cliente || f.numero || "—"}</span>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.amber }}>{fmtK(f.importo || 0)}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.red }}>-{Math.abs(daysTo(f.scadenza))}gg</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mini Calendario OPS */}
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.rim}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                <SectionTitle color={C.purple}>Prossimi 7 giorni</SectionTitle>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                <div style={{ padding: "14px 20px", borderRight: `1px solid ${C.rimLight}`, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.purple, fontFamily: FM, lineHeight: 1 }}>{data.montaggi7.length}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>montaggi</div>
                </div>
                <div style={{ padding: "14px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.amber, fontFamily: FM, lineHeight: 1 }}>{data.consegne7.length}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>consegne</div>
                </div>
              </div>
              {data.montaggiOggi.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.rimLight}` }}>
                  <div style={{ padding: "10px 20px 6px", fontSize: 10, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: 0.5 }}>Oggi</div>
                  {data.montaggiOggi.slice(0, 4).map((m: any) => (
                    <div key={m.id} style={{ padding: "8px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{m.cliente || "—"}</div>
                      <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{m.orario || ""}{m.indirizzo ? ` · ${m.indirizzo}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── COL 3: COMMESSE OSSERVATE + TEAM ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Commesse da sbloccare */}
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${data.ferme.length > 0 ? C.red + "30" : C.rim}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                <SectionTitle count={data.ferme.length} color={data.ferme.length > 0 ? C.red : C.teal}>Da sbloccare</SectionTitle>
              </div>
              {data.ferme.length === 0
                ? <div style={{ padding: "20px", fontSize: 12, color: C.sub, textAlign: "center" }}>Tutto in ordine</div>
                : data.ferme.slice(0, 6).map((c: any) => {
                    const gg = giorniFermaCM(c);
                    const col = gg >= 30 ? C.red : gg >= 15 ? C.orange : C.amber;
                    return (
                      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: `1px solid ${C.rimLight}`, cursor: "pointer" }}
                        onMouseEnter={(e) => ((e.currentTarget as any).style.background = C.raised)}
                        onMouseLeave={(e) => ((e.currentTarget as any).style.background = "transparent")}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: col + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: col, flexShrink: 0 }}>{(c.cliente || "?")[0]}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.cliente} {c.cognome || ""}</div>
                          <div style={{ fontSize: 10, color: C.sub }}>{FASE_LABEL[c.fase] || c.fase}{c.euro ? ` · ${fmtK(parseFloat(c.euro))}` : ""}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: col, fontFamily: FM }}>{gg}gg</div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>

            {/* Team Command */}
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.rim}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                <SectionTitle color={C.blue}>Team — adesso</SectionTitle>
              </div>
              {(team.length > 0 ? team : [{ id: "1", nome: "Titolare", ruolo: "Titolare" }]).map((m: any, i: number) => {
                const inCantiere = montaggiDB.some((mt: any) => mt.operatoreId === m.id && mt.data === TODAY);
                const tc = tasks.filter((t: any) => t.assegnatoA === m.id && !t.done).length;
                return (
                  <div key={m.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blue + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: C.blue, flexShrink: 0 }}>{(m.nome || "?")[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{m.nome}</div>
                      <div style={{ fontSize: 10, color: C.sub }}>{m.ruolo || "—"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {inCantiere && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: C.teal + "15", color: C.teal, fontWeight: 700 }}>Cantiere</span>}
                      {tc > 0 && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: C.amber + "15", color: C.amber, fontWeight: 700 }}>{tc} task</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Problemi */}
            {data.problemiAperti.length > 0 && (
              <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.red}20`, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                  <SectionTitle count={data.problemiAperti.length} color={C.red}>Problemi aperti</SectionTitle>
                </div>
                {data.problemiAperti.slice(0, 4).map((p: any, i: number) => (
                  <div key={p.id || i} style={{ padding: "10px 20px", borderBottom: `1px solid ${C.rimLight}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{p.titolo || "—"}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: p.priorita === "alta" ? C.red + "15" : C.amber + "15", color: p.priorita === "alta" ? C.red : C.amber, fontWeight: 700 }}>{p.priorita || "—"}</span>
                    </div>
                    <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>{p.tipo || ""}{p.commessa ? ` · ${p.commessa}` : ""}</div>
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
