"use client";
// @ts-nocheck
// ================================================================
// MASTRO ERP — CommessaIntegrata
// Pannello desktop: mostra TUTTO quello che riguarda una commessa.
// 8 sezioni: Riepilogo / Foto / Firme / Disegni / Alert / Avanzamenti / Timer / Missioni
// Questo e' il pannello che risolve "faccio una foto da telefono → la ritrovo nel desktop".
// File < 300 righe.
// ================================================================
import React, { useState } from "react";
import { useCommessaIntegrata } from "../hooks/useCommessaIntegrata";

const TEAL = "#28A0A0";
const DARK = "#156060";
const INK = "#0D1F1F";
const LIGHT = "#EEF8F8";
const BORDER = "#C8E4E4";
const SUB = "#86868b";
const RED = "#DC4444";
const AMBER = "#F59E0B";
const GREEN = "#10B981";
const CARD = "#ffffff";

type Tab = "riepilogo" | "foto" | "firme" | "disegni" | "alert" | "avanzamenti" | "timer" | "missioni";

export default function CommessaIntegrata({ commessaId }: { commessaId: string }) {
  const { loading, data, metriche, error, reload } = useCommessaIntegrata(commessaId);
  const [tab, setTab] = useState<Tab>("riepilogo");

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: SUB }}>Caricamento dati commessa...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: RED }}>{error}</div>;
  if (!data || !data.commessa) return <div style={{ padding: 40, textAlign: "center", color: SUB }}>Commessa non trovata</div>;

  const c = data.commessa;
  const m = metriche;

  const TABS: { id: Tab; label: string; count?: number; color?: string }[] = [
    { id: "riepilogo", label: "Riepilogo" },
    { id: "foto", label: "Foto", count: m?.totaleFoto, color: TEAL },
    { id: "firme", label: "Firme", count: m?.firmeFatte },
    { id: "disegni", label: "Disegni", count: m?.vaniConDisegno },
    { id: "alert", label: "Problemi", count: m?.alertAperti, color: RED },
    { id: "avanzamenti", label: "Avanzamento" },
    { id: "timer", label: "Ore", count: m?.oreLavorate ? Math.round(m.oreLavorate * 10) / 10 : undefined },
    { id: "missioni", label: "Missioni", count: m?.missioniAperte, color: TEAL },
  ];

  return (
    <div style={{ padding: 20, background: LIGHT, minHeight: 400 }}>
      {/* Header commessa */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: INK }}>{c.cliente || c.codice || "Commessa"}</h2>
          <div style={{ fontSize: 12, color: SUB, marginTop: 4 }}>{c.indirizzo || ""} {c.citta || ""}</div>
        </div>
        <button onClick={reload} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, color: TEAL, background: "transparent", border: `1px solid ${TEAL}`, borderRadius: 6, cursor: "pointer" }}>Aggiorna</button>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 16 }}>
        {[
          { l: "Vani", v: m?.totaleVani, c: INK },
          { l: "Foto", v: m?.totaleFoto, c: TEAL },
          { l: "Firma", v: m?.firmaCliente ? "SI" : "NO", c: m?.firmaCliente ? GREEN : AMBER },
          { l: "Alert", v: m?.alertAperti, c: m?.alertAperti ? RED : GREEN },
          { l: "Ore", v: m?.oreLavorate ? m.oreLavorate.toFixed(1) : "0", c: INK },
          { l: "Montaggi", v: `${m?.montaggiCompletati || 0}/${m?.montaggiTotali || 0}`, c: TEAL },
        ].map(k => (
          <div key={k.l} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 10, color: SUB, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${BORDER}`, overflowX: "auto" }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: active ? 900 : 600, color: active ? TEAL : SUB, borderBottom: active ? `3px solid ${TEAL}` : "3px solid transparent", marginBottom: -1, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              {t.label}
              {typeof t.count === "number" && t.count > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: t.color || SUB, padding: "2px 7px", borderRadius: 8 }}>{t.count}</span>}
            </div>
          );
        })}
      </div>

      {/* Contenuto tab */}
      {tab === "riepilogo" && <Riepilogo data={data} metriche={m} />}
      {tab === "foto" && <GalleriaFoto foto={data.foto} />}
      {tab === "firme" && <ListaFirme firme={data.firme} />}
      {tab === "disegni" && <ListaDisegni disegni={data.disegni} vani={data.vani} />}
      {tab === "alert" && <ListaAlert alert={data.alert} />}
      {tab === "avanzamenti" && <ListaAvanzamenti avanzamenti={data.avanzamenti} />}
      {tab === "timer" && <ListaTimer timer={data.timer} />}
      {tab === "missioni" && <ListaMissioni missioni={data.missioni} />}
    </div>
  );
}

function Riepilogo({ data, metriche }: any) {
  const e = metriche?.ultimoEvento;
  return (
    <div style={{ fontSize: 13, color: INK }}>
      {e && <div style={{ padding: 12, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 12 }}><b style={{ color: TEAL }}>Ultimo evento:</b> {e.descrizione || e.tipo_evento} — {e.evento_at && new Date(e.evento_at).toLocaleString("it-IT")}</div>}
      <div style={{ padding: 12, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 12, color: SUB }}>Questa vista mostra tutto quello che riguarda la commessa: foto scattate in cantiere, firme cliente, disegni tecnici, problemi segnalati, avanzamento fasi, ore lavorate e missioni TEAM OS. Tutto arriva automaticamente da mobile e satellite.</div>
    </div>
  );
}

function GalleriaFoto({ foto }: any) {
  if (!foto || foto.length === 0) return <div style={{ padding: 30, textAlign: "center", color: SUB, fontSize: 13 }}>Nessuna foto. Le foto scattate dal cantiere appariranno qui.</div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
      {foto.map((f: any) => (
        <div key={f.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
          {f.url && <img src={f.url} alt={f.note || "foto"} style={{ width: "100%", height: 120, objectFit: "cover" }} />}
          <div style={{ padding: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: INK }}>{f.tipo || "cantiere"}{f.fase_codice && ` - ${f.fase_codice}`}</div>
            {f.note && <div style={{ fontSize: 10, color: SUB, marginTop: 2 }}>{f.note}</div>}
            <div style={{ fontSize: 9, color: SUB, marginTop: 4 }}>{f.created_at && new Date(f.created_at).toLocaleString("it-IT")}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaFirme({ firme }: any) {
  if (!firme || firme.length === 0) return <div style={{ padding: 30, textAlign: "center", color: SUB, fontSize: 13 }}>Nessuna firma. Le firme del cliente appariranno qui dopo il collaudo.</div>;
  return (
    <div>
      {firme.map((f: any) => (
        <div key={f.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, marginBottom: 10, display: "flex", gap: 16, alignItems: "center" }}>
          {f.firma_svg && <div style={{ width: 120, height: 60, border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden", flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: f.firma_svg }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{f.firmato_da || f.cliente_nome || "Cliente"}</div>
            <div style={{ fontSize: 11, color: SUB }}>{f.firmato_il && new Date(f.firmato_il).toLocaleString("it-IT")}</div>
            {f.operatore && <div style={{ fontSize: 11, color: SUB }}>Operatore: {f.operatore}</div>}
            {f.note && <div style={{ fontSize: 11, color: SUB, marginTop: 2 }}>{f.note}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {f.vani_completati != null && <div style={{ fontSize: 12, color: TEAL, fontWeight: 700 }}>{f.vani_completati}/{f.vani_totali} vani</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaDisegni({ disegni, vani }: any) {
  if (!disegni || disegni.length === 0) return <div style={{ padding: 30, textAlign: "center", color: SUB, fontSize: 13 }}>Nessun disegno tecnico. I disegni CAD e le misure appariranno qui.</div>;
  const vaniById: any = {}; (vani || []).forEach((v: any) => vaniById[v.id] = v);
  return (
    <div>
      {disegni.map((d: any) => {
        const vano = vaniById[d.vano_id];
        return (
          <div key={d.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{d.tipologia || "Vano"} {d.sistema && `- ${d.sistema}`}</div>
              <span style={{ fontSize: 10, fontWeight: 700, color: d.stato === "confermato" ? GREEN : d.stato === "verificato" ? TEAL : AMBER, background: (d.stato === "confermato" ? GREEN : d.stato === "verificato" ? TEAL : AMBER) + "20", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>{d.stato || "bozza"}</span>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: SUB }}>
              {d.mis_l && <span>L: {d.mis_l} mm</span>}
              {d.mis_h && <span>H: {d.mis_h} mm</span>}
              {d.mis_diag1 && <span>D1: {d.mis_diag1} mm</span>}
              {d.mis_diag2 && <span>D2: {d.mis_diag2} mm</span>}
              {d.mis_spessore_muro && <span>Muro: {d.mis_spessore_muro} mm</span>}
            </div>
            {d.mis_note && <div style={{ fontSize: 11, color: SUB, marginTop: 4 }}>{d.mis_note}</div>}
            {d.mis_foto_urls?.length > 0 && <div style={{ display: "flex", gap: 6, marginTop: 8 }}>{d.mis_foto_urls.map((u: string, i: number) => <img key={i} src={u} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6, border: `1px solid ${BORDER}` }} />)}</div>}
          </div>
        );
      })}
    </div>
  );
}

function ListaAlert({ alert }: any) {
  if (!alert || alert.length === 0) return <div style={{ padding: 30, textAlign: "center", color: SUB, fontSize: 13 }}>Nessun problema segnalato.</div>;
  return (
    <div>
      {alert.map((a: any) => {
        const col = a.severita === "alta" || a.severita === "critica" ? RED : a.severita === "media" ? AMBER : SUB;
        return (
          <div key={a.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${col}`, borderRadius: 10, padding: 12, marginBottom: 8, opacity: a.risolto ? 0.5 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{a.messaggio}</div>
                <div style={{ fontSize: 11, color: SUB, marginTop: 2 }}>{a.tipo} {a.created_at && " - " + new Date(a.created_at).toLocaleString("it-IT")}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: col, background: col + "20", padding: "2px 8px", borderRadius: 4, alignSelf: "start" }}>{a.severita || "media"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListaAvanzamenti({ avanzamenti }: any) {
  if (!avanzamenti || avanzamenti.length === 0) return <div style={{ padding: 30, textAlign: "center", color: SUB, fontSize: 13 }}>Nessun avanzamento registrato.</div>;
  return (
    <div style={{ position: "relative", paddingLeft: 20 }}>
      <div style={{ position: "absolute", left: 6, top: 4, bottom: 4, width: 2, background: BORDER }} />
      {avanzamenti.map((a: any) => (
        <div key={a.id} style={{ position: "relative", marginBottom: 10, paddingLeft: 14 }}>
          <div style={{ position: "absolute", left: -14, top: 5, width: 12, height: 12, borderRadius: "50%", background: TEAL, border: "2px solid #fff" }} />
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: INK }}>{a.fase_codice} {"\u2192"} {a.stato}</div>
            {a.note && <div style={{ fontSize: 11, color: SUB, marginTop: 2 }}>{a.note}</div>}
            <div style={{ fontSize: 10, color: SUB, marginTop: 2 }}>{a.created_at && new Date(a.created_at).toLocaleString("it-IT")}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaTimer({ timer }: any) {
  if (!timer || timer.length === 0) return <div style={{ padding: 30, textAlign: "center", color: SUB, fontSize: 13 }}>Nessuna ora registrata.</div>;
  const totale = timer.reduce((s: number, t: any) => s + (t.durata_secondi || 0), 0) / 3600;
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 10 }}>Totale: {totale.toFixed(1)} ore</div>
      {timer.map((t: any) => (
        <div key={t.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, marginBottom: 6, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: INK }}>{t.fase_codice || "lavoro"}</span>
          <span style={{ color: TEAL, fontWeight: 700 }}>{((t.durata_secondi || 0) / 3600).toFixed(1)}h</span>
          <span style={{ color: SUB }}>{t.created_at && new Date(t.created_at).toLocaleString("it-IT", { day: "numeric", month: "short" })}</span>
        </div>
      ))}
    </div>
  );
}

function ListaMissioni({ missioni }: any) {
  if (!missioni || missioni.length === 0) return <div style={{ padding: 30, textAlign: "center", color: SUB, fontSize: 13 }}>Nessuna missione TEAM OS per questa commessa.</div>;
  return (
    <div>
      {missioni.map((m: any) => {
        const col = m.stato === "in_corso" ? TEAL : m.stato === "completata" ? GREEN : m.stato === "fallita" ? RED : AMBER;
        return (
          <div key={m.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${col}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{m.titolo}</div>
            <div style={{ fontSize: 11, color: SUB, marginTop: 2 }}>{m.stato?.replace(/_/g, " ")} {m.scadenza_at && " - " + new Date(m.scadenza_at).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        );
      })}
    </div>
  );
}
