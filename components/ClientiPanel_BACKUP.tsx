"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — ClientiPanel v3 — Diario + Impostazioni
// Tab Diario con tag colorati, tasto impostazioni cliente
// ═══════════════════════════════════════════════════════════
import React from "react";
import { useMastro } from "./MastroContext";
import { FF, ICO, Ico } from "./mastro-constants";

const tipoEvColor = (tipo) => {
  const map = { sopralluogo: "#3B7FE0", montaggio: "#E8A020", consegna: "#0D7C6B", preventivo: "#D08008", posa: "#059669", collaudo: "#10B981", chiamata: "#af52de" };
  return map[tipo] || "#D08008";
};

const DIARIO_TAGS = [
  { id: "nota", label: "Nota", color: "#6B7280" },
  { id: "attenzione", label: "Attenzione", color: "#E8A020" },
  { id: "positivo", label: "Positivo", color: "#0D7C6B" },
  { id: "commerciale", label: "Commerciale", color: "#3B7FE0" },
  { id: "problema", label: "Problema", color: "#DC4444" },
];


// ─── Lumina Design Tokens ────────────────────────────────
const L = {
  bg:          "#f9f9fb",
  surface:     "#ffffff",
  surfaceLow:  "#f3f3f5",
  surfaceMid:  "#eeeef0",
  primary:     "#031631",
  primaryCont: "#1a2b47",
  onPrimary:   "#ffffff",
  muted:       "#8293b4",
  text:        "#1a1c1d",
  sub:         "#44474d",
  placeholder: "#75777e",
  green:       "#1a9e73",
  red:         "#dc4444",
  amber:       "#e4c18c",
  amberBg:     "#ffdeac",
  border:      "rgba(197,198,206,0.25)",
  glass:       "rgba(255,255,255,0.85)",
} as const;
const SH = {
  ambient: "0 20px 40px rgba(26,28,29,0.04)",
  float:   "0 20px 40px rgba(26,28,29,0.08)",
  sm:      "0 2px 8px rgba(26,28,29,0.05)",
} as const;
// ─────────────────────────────────────────────────────────
export default function ClientiPanel() {
  const {
    T, S, isDesktop, fs,
    PIPELINE, cantieri, contatti, events, fattureDB, setContatti, setNewCM, setSelectedCM, setTab,
    clientiSearch, setClientiSearch, clientiFilter, setClientiFilter,
    selectedCliente, setSelectedCliente,
    showNewCliente, setShowNewCliente, newCliente, setNewCliente,
  } = useMastro();

  const [clienteDetailTab, setClienteDetailTab] = React.useState("info");
  const [clienteNotes, setClienteNotes] = React.useState<Record<string, string>>({});
  const [editMode, setEditMode] = React.useState(false);
  const [editForm, setEditForm] = React.useState<any>(null);
  const [newDiarioText, setNewDiarioText] = React.useState("");
  const [newDiarioTag, setNewDiarioTag] = React.useState("nota");

    const filters = [
      { id: "tutti", l: "Tutti", c: L.primary },
      { id: "cliente", l: "Clienti", c: "#007aff" },
      { id: "fornitore", l: "Fornitori", c: "#34c759" },
      { id: "professionista", l: "Professionisti", c: "#af52de" },
    ];
    const filtered = contatti
      .filter(c => clientiFilter === "tutti" || c.tipo === clientiFilter)
      .filter(c => {
        if (!clientiSearch) return true;
        const s = clientiSearch.toLowerCase();
        return (c.nome||"").toLowerCase().includes(s) || (c.cognome||"").toLowerCase().includes(s) || (c.telefono||"").includes(s) || (c.email||"").toLowerCase().includes(s) || (c.indirizzo||"").toLowerCase().includes(s);
      })
      .sort((a, b) => (a.nome||"").localeCompare(b.nome||""));

    const matchCliente = (cm: any, c: any) => {
    if (c.id && cm.clienteId === c.id) return true;
    const nomeCompleto = [c.nome, c.cognome].filter(Boolean).join(" ").toLowerCase();
    const cmNome = [cm.cliente, cm.cognome].filter(Boolean).join(" ").toLowerCase();
    if (nomeCompleto && cmNome && nomeCompleto === cmNome) return true;
    if (c.telefono && cm.telefono && c.telefono.replace(/\D/g,"") === cm.telefono.replace(/\D/g,"")) return true;
    return false;
  };
  const cmCountFor = (c) => cantieri.filter(cm => matchCliente(cm, c)).length;

    // ═══ EDIT CLIENT ═══
    if (editMode && editForm) {
      return (
        <div style={{ padding: "0 0 100px" }}>
          <div style={{ ...S.header, display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => { setEditMode(false); setEditForm(null); }} style={{ cursor: "pointer", padding: 4 }}>
              <Ico d={ICO.back} s={22} c={L.text} />
            </div>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>Modifica cliente</div>
          </div>
          <div style={{ padding: "0 16px" }}>
            {[
              { l: "Nome", k: "nome", ph: "Mario" },
              { l: "Cognome", k: "cognome", ph: "Rossi" },
              { l: "Telefono", k: "telefono", ph: "+39 333 1234567" },
              { l: "Email", k: "email", ph: "mario@email.it" },
              { l: "Indirizzo", k: "indirizzo", ph: "Via Roma 1, Cosenza" },
              { l: "P.IVA", k: "piva", ph: "IT01234567890" },
              { l: "Codice Fiscale", k: "cf", ph: "RSSMRA65A41D086Z" },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: L.sub, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.l}</div>
                <input value={editForm[f.k] || ""} onChange={e => setEditForm(prev => ({...prev, [f.k]: e.target.value}))}
                  placeholder={f.ph} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${L.border}`, background: L.surface, fontSize: 13, color: L.text, fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: L.sub, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Note</div>
              <textarea value={editForm.note || ""} onChange={e => setEditForm(prev => ({...prev, note: e.target.value}))}
                placeholder="Note..." rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${L.border}`, background: L.surface, fontSize: 13, color: L.text, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => { setEditMode(false); setEditForm(null); }} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${L.border}`, background: L.bg, fontSize: 14, fontWeight: 600, cursor: "pointer", color: L.text, fontFamily: "inherit" }}>Annulla</button>
              <button onClick={() => {
                setContatti(prev => prev.map(x => x.id === editForm.id ? { ...x, ...editForm } : x));
                setSelectedCliente({ ...selectedCliente, ...editForm });
                setEditMode(false); setEditForm(null);
              }} style={{ flex: 2, padding: 14, borderRadius: 12, border: "none", background: L.primary, fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>Salva</button>
            </div>
          </div>
        </div>
      );
    }

    // ═══ DETAIL VIEW ═══
    if (selectedCliente) {
      const c = selectedCliente;
      const cmList = cantieri.filter(cm => matchCliente(cm, c));
      const evList = events.filter(ev => ev.persona === c.nome || ev.persona === (c.nome + " " + (c.cognome||"")).trim());
      const fattureTot = fattureDB.filter(f => cmList.some(cm => cm.id === f.cmId)).reduce((s, f) => s + (f.importo || 0), 0);
      const cmAttive = cmList.filter(cm => cm.fase !== "chiusura").length;
      const diario = c.diario || [];

      const tabs = [
        { id: "info", label: "Info" },
        { id: "diario", label: "Diario" },
        { id: "storia", label: "Storia" },
        { id: "fatturato", label: "€" },
      ];

      const addDiarioEntry = () => {
        if (!newDiarioText.trim()) return;
        const entry = { id: "D-" + Date.now(), data: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short" }), testo: newDiarioText, tag: newDiarioTag };
        const updatedDiario = [entry, ...diario];
        setContatti(prev => prev.map(x => x.id === c.id ? { ...x, diario: updatedDiario } : x));
        setSelectedCliente({ ...c, diario: updatedDiario });
        setNewDiarioText(""); setNewDiarioTag("nota");
      };

      return (
        <div style={{ padding: "0 0 100px" }}>
          {/* Header + gear */}
          <div style={{ ...S.header, display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => { setSelectedCliente(null); setClienteDetailTab("info"); }} style={{ cursor: "pointer", padding: 4 }}>
              <Ico d={ICO.back} s={22} c={L.text} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{c.nome} {c.cognome || ""}</div>
              <div style={{ fontSize: 11, color: L.sub }}>{c.tipo === "cliente" ? "Cliente" : c.tipo === "fornitore" ? "Fornitore" : "Professionista"}</div>
            </div>
            {/* SETTINGS BUTTON */}
            <div onClick={() => { setEditForm({ ...c }); setEditMode(true); }}
              style={{ width: 34, height: 34, borderRadius: 8, background: L.bg, border: "1px solid " + L.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Ico d={ICO.settings} s={16} c={L.sub} />
            </div>
            <div onClick={() => { const idx = contatti.findIndex(x => x.id === c.id); if (idx >= 0) { const updated = { ...c, preferito: !c.preferito }; setContatti(prev => prev.map(x => x.id === c.id ? updated : x)); setSelectedCliente(updated); } }} style={{ fontSize: 22, cursor: "pointer" }}>
              {c.preferito ? "⭐" : ""}
            </div>
          </div>

          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "0 16px 12px" }}>
            <div style={{ background: L.surface, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid " + L.border }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: L.primary }}>{cmList.length}</div>
              <div style={{ fontSize: 10, color: L.sub, fontWeight: 600 }}>Commesse</div>
            </div>
            <div style={{ background: L.surface, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid " + L.border }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: L.green }}>{cmAttive}</div>
              <div style={{ fontSize: 10, color: L.sub, fontWeight: 600 }}>Attive</div>
            </div>
            <div style={{ background: L.surface, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid " + L.border }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: L.amber }}>{fattureTot > 0 ? (fattureTot / 1000).toFixed(1) + "k" : "0"}</div>
              <div style={{ fontSize: 10, color: L.sub, fontWeight: 600 }}>€ Totale</div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, margin: "0 16px 12px", background: L.bg, borderRadius: 10, padding: 3 }}>
            {tabs.map(t => (
              <div key={t.id} onClick={() => setClienteDetailTab(t.id)}
                style={{ flex: 1, padding: "8px 4px", textAlign: "center", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", transition: "all .2s",
                  background: clienteDetailTab === t.id ? L.surface : "transparent",
                  color: clienteDetailTab === t.id ? L.primary : L.sub,
                  boxShadow: clienteDetailTab === t.id ? L.surfaceSh : "none"
                }}>
                {t.label}
              </div>
            ))}
          </div>

          {/* TAB: Info */}
          {clienteDetailTab === "info" && <>
            <div style={{ margin: "0 16px 12px", background: L.surface, borderRadius: 14, padding: 16, border: "1px solid " + L.border }}>
              {c.telefono && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 14 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                <div style={{ flex: 1, fontSize: 13, color: L.text }}>{c.telefono}</div>
                <div onClick={() => { window.location.href="tel:" + c.telefono; }} style={{ padding: "6px 12px", borderRadius: 8, background: "#d1fae5", color: L.green, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Chiama</div>
                <div onClick={() => window.open("https://wa.me/" + c.telefono.replace(/\s/g, ""))} style={{ padding: "6px 12px", borderRadius: 8, background: "#dcf8c6", color: "#128c7e", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>WA</div>
              </div>}
              {c.email && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 14 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg></div>
                <div style={{ flex: 1, fontSize: 13, color: L.text }}>{c.email}</div>
                <div onClick={() => window.open("mailto:" + c.email)} style={{ padding: "6px 12px", borderRadius: 8, background: "#dbeafe", color: "#3b7fe0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Email</div>
              </div>}
              {c.indirizzo && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 14 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                <div style={{ flex: 1, fontSize: 13, color: L.text }}>{c.indirizzo}</div>
                <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(c.indirizzo))} style={{ padding: "6px 12px", borderRadius: 8, background: L.bg, color: L.sub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Mappa</div>
              </div>}
              {c.piva && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 14 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4"/></svg></div>
                <div style={{ fontSize: 13, color: L.sub, fontFamily: "'JetBrains Mono',monospace" }}>{c.piva}</div>
              </div>}
              {c.cf && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 14 }}>🆔</div>
                <div style={{ fontSize: 13, color: L.sub, fontFamily: "'JetBrains Mono',monospace" }}>{c.cf}</div>
              </div>}
              {c.note && <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: L.primary + "08", border: "1px solid " + L.primary + "15" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: L.primary, marginBottom: 3 }}>NOTE</div>
                <div style={{ fontSize: 12, color: L.text, lineHeight: 1.4 }}>{c.note}</div>
              </div>}
            </div>
            <div style={{ margin: "0 16px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: L.text, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> Commesse ({cmList.length})</span>
                <div onClick={() => { setNewCM(prev => ({ ...prev, cliente: c.nome, cognome: c.cognome || "", telefono: c.telefono || "", indirizzo: c.indirizzo || "", clienteId: c.id })); setTab("commesse"); }} style={{ fontSize: 11, fontWeight: 700, color: L.primary, cursor: "pointer" }}>+ Nuova commessa</div>
              </div>
              {cmList.length === 0 && <div style={{ padding: 16, background: L.surface, borderRadius: 10, textAlign: "center", fontSize: 12, color: L.sub }}>Nessuna commessa</div>}
              {cmList.map(cm => (
                <div key={cm.id} onClick={() => { setSelectedCM(cm); setTab("commesse"); }} style={{ padding: "10px 12px", background: L.surface, borderRadius: 10, border: "1px solid " + L.border, marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: (PIPELINE.find(p => p.id === cm.fase)?.color || L.primary) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {PIPELINE.find(p => p.id === cm.fase)?.icon || ""}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: L.text }}>{cm.code}</div>
                    <div style={{ fontSize: 11, color: L.sub }}>{PIPELINE.find(p => p.id === cm.fase)?.nome || cm.fase} · {cm.indirizzo || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* ═══ TAB: DIARIO ═══ */}
          {clienteDetailTab === "diario" && <>
            <div style={{ margin: "0 16px 12px" }}>
              {/* New entry */}
              <div style={{ background: L.surface, borderRadius: 14, padding: 14, border: "1px solid " + L.border, marginBottom: 12 }}>
                <textarea value={newDiarioText} onChange={e => setNewDiarioText(e.target.value)}
                  placeholder="Annota qualcosa su questo cliente..."
                  style={{ width: "100%", minHeight: 60, border: "none", outline: "none", fontSize: 13, fontFamily: "inherit", resize: "none", background: "transparent", color: L.text, boxSizing: "border-box" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                  {DIARIO_TAGS.map(tag => (
                    <div key={tag.id} onClick={() => setNewDiarioTag(tag.id)} style={{
                      padding: "3px 8px", borderRadius: 6, cursor: "pointer",
                      border: "1px solid " + tag.color + (newDiarioTag === tag.id ? "" : "40"),
                      background: newDiarioTag === tag.id ? tag.color : "transparent",
                      color: newDiarioTag === tag.id ? "#fff" : tag.color,
                      fontSize: 10, fontWeight: 600,
                    }}>{tag.label}</div>
                  ))}
                  <div style={{ flex: 1 }} />
                  <div onClick={addDiarioEntry} style={{ padding: "5px 14px", background: L.primary, color: "#fff", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Salva</div>
                </div>
              </div>

              {/* Entries */}
              {diario.length === 0 && (
                <div style={{ padding: "30px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: L.sub }}>Nessuna nota nel diario</div>
                  <div style={{ fontSize: 12, color: L.sub, marginTop: 4 }}>Scrivi sensazioni, alert, appunti commerciali</div>
                </div>
              )}
              {diario.map(d => {
                const tagObj = DIARIO_TAGS.find(t => t.id === d.tag) || DIARIO_TAGS[0];
                return (
                  <div key={d.id} style={{ background: L.surface, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: "1px solid " + L.border, borderLeft: "3px solid " + tagObj.color }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: tagObj.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{tagObj.label}</span>
                      <span style={{ fontSize: 10, color: L.sub }}>{d.data ? new Date(d.data+'T12:00:00').toLocaleDateString('it-IT') : d.data}</span>
                    </div>
                    <div style={{ fontSize: 13, color: L.text, lineHeight: 1.4 }}>{d.testo}</div>
                  </div>
                );
              })}
            </div>
          </>}

          {/* TAB: Storia */}
          {clienteDetailTab === "storia" && <>
            <div style={{ margin: "0 16px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: L.text, marginBottom: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/></svg> Timeline</div>
              {[...evList].sort((a, b) => (b.date || "").localeCompare(a.date || "")).length === 0 &&
                <div style={{ padding: 24, background: L.surface, borderRadius: 12, textAlign: "center", fontSize: 12, color: L.sub }}>Nessuna attività registrata</div>
              }
              {[...evList].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((ev, i) => (
                <div key={ev.id || i} style={{ display: "flex", gap: 12, marginBottom: 2 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: tipoEvColor(ev.tipo), border: "2px solid " + L.surface }} />
                    {i < evList.length - 1 && <div style={{ width: 2, flex: 1, background: L.border }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: L.text }}>{ev.text}</div>
                    <div style={{ fontSize: 11, color: L.sub }}>{ev.date} {ev.time && "· " + ev.time} {ev.tipo && "· " + ev.tipo}</div>
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* TAB: Fatturato */}
          {clienteDetailTab === "fatturato" && <>
            <div style={{ margin: "0 16px 12px" }}>
              {(() => {
                const fattList = fattureDB.filter(f => cmList.some(cm => cm.id === f.cmId));
                const totaleFatt = fattList.reduce((s, f) => s + (f.importo || 0), 0);
                const totalePagato = fattList.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
                const totaleNonPagato = totaleFatt - totalePagato;
                return <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    <div style={{ background: L.surface, borderRadius: 12, padding: 14, border: "1px solid " + L.border }}>
                      <div style={{ fontSize: 10, color: L.sub, fontWeight: 600, marginBottom: 4 }}>Fatturato totale</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: L.text }}>€ {totaleFatt.toLocaleString("it-IT")}</div>
                    </div>
                    <div style={{ background: L.surface, borderRadius: 12, padding: 14, border: "1px solid " + L.border }}>
                      <div style={{ fontSize: 10, color: L.sub, fontWeight: 600, marginBottom: 4 }}>Da incassare</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: totaleNonPagato > 0 ? L.red : L.green }}>€ {totaleNonPagato.toLocaleString("it-IT")}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: L.text, marginBottom: 8 }}>Fatture ({fattList.length})</div>
                  {fattList.length === 0 && <div style={{ padding: 24, background: L.surface, borderRadius: 12, textAlign: "center", fontSize: 12, color: L.sub }}>Nessuna fattura</div>}
                  {fattList.map(f => (
                    <div key={f.id} style={{ padding: "10px 12px", background: L.surface, borderRadius: 10, border: "1px solid " + L.border, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.pagata ? L.green : L.red }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: L.text }}>€ {(f.importo || 0).toLocaleString("it-IT")}</div>
                        <div style={{ fontSize: 11, color: L.sub }}>{f.numero || "N/D"} · {f.data || ""}</div>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: f.pagata ? "#d1fae5" : "#ffdad6", color: f.pagata ? L.green : L.red }}>{f.pagata ? "Pagata" : "Da pagare"}</div>
                    </div>
                  ))}
                </>;
              })()}
            </div>
          </>}

          {/* Azioni */}
          <div style={{ margin: "12px 16px 0", display: "flex", gap: 8 }}>
            <div onClick={() => { if(confirm("Eliminare " + c.nome + "?")) { setContatti(prev => prev.filter(x => x.id !== c.id)); setSelectedCliente(null); }}} style={{ flex: 1, padding: 12, borderRadius: 10, background: "#ffdad6", color: L.red, textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Elimina</div>
          </div>
        </div>
      );
    }

    // ═══ NUOVO CLIENTE ═══
    if (showNewCliente) {
      return (
        <div style={{ padding: "0 0 100px" }}>
          <div style={{ ...S.header, display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => setShowNewCliente(false)} style={{ cursor: "pointer", padding: 4 }}>
              <Ico d={ICO.back} s={22} c={L.text} />
            </div>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>Nuovo contatto</div>
          </div>
          <div style={{ padding: "0 16px" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[{id:"cliente",l:"Cliente"},{id:"fornitore",l:"Fornitore"},{id:"professionista",l:"Professionista"}].map(t => (
                <div key={t.id} onClick={() => setNewCliente(prev => ({...prev, tipo: t.id}))} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, border: `1.5px solid ${newCliente.tipo === t.id ? L.primary : L.border}`, background: newCliente.tipo === t.id ? L.amberBg : L.surface, textAlign: "center", fontSize: 11, fontWeight: 700, cursor: "pointer", color: newCliente.tipo === t.id ? L.primary : L.sub }}>{t.l}</div>
              ))}
            </div>
            {[
              { l: "Nome *", k: "nome", ph: "Mario" },
              { l: "Cognome", k: "cognome", ph: "Rossi" },
              { l: "Telefono", k: "telefono", ph: "+39 333 1234567" },
              { l: "Email", k: "email", ph: "mario@email.it" },
              { l: "Indirizzo", k: "indirizzo", ph: "Via Roma 1, Cosenza" },
              { l: "P.IVA / C.F.", k: "piva", ph: "IT01234567890" },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: L.sub, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.l}</div>
                <input value={newCliente[f.k]} onChange={e => setNewCliente(prev => ({...prev, [f.k]: e.target.value}))}
                  placeholder={f.ph} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${L.border}`, background: L.surface, fontSize: 13, color: L.text, fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: L.sub, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Note</div>
              <textarea value={newCliente.note} onChange={e => setNewCliente(prev => ({...prev, note: e.target.value}))}
                placeholder="Note aggiuntive..." rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${L.border}`, background: L.surface, fontSize: 13, color: L.text, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            {savedCliente ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ textAlign: "center", padding: "12px 0 16px" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}><I d={ICO.checkCircle} s={28} c={L.green} /></div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: L.text }}>{savedCliente.nome} {savedCliente.cognome || ""} salvato!</div>
                  <div style={{ fontSize: 12, color: L.sub, marginTop: 2 }}>Cosa vuoi fare adesso?</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div onClick={() => { setNewCM(prev => ({ ...prev, cliente: savedCliente.nome, cognome: savedCliente.cognome || "", telefono: savedCliente.telefono || "", indirizzo: savedCliente.indirizzo || "" })); setTab("commesse"); setShowNewCliente(false); setSavedCliente(null); }} style={{ padding: "14px 16px", borderRadius: 12, background: L.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <I d={ICO.folder} s={18} c="#fff" /> Crea commessa per {savedCliente.nome}
                  </div>
                  <div onClick={() => { setTab("agenda"); setShowNewCliente(false); setSavedCliente(null); }} style={{ padding: "14px 16px", borderRadius: 12, background: "#3b7fe0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <I d={ICO.check} s={18} c="#fff" /> Aggiungi task / appuntamento
                  </div>
                  <div onClick={() => { setTab("agenda"); setShowNewCliente(false); setSavedCliente(null); }} style={{ padding: "14px 16px", borderRadius: 12, background: "#5856d6", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <I d={ICO.calendar} s={18} c="#fff" /> Crea appuntamento
                  </div>
                  <div onClick={() => { setShowNewCliente(false); setSavedCliente(null); }} style={{ padding: "14px 16px", borderRadius: 12, background: L.bg, color: L.sub, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "center", border: `1px solid ${L.border}` }}>
                    Chiudi
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => {
                  if (!newCliente.nome.trim()) return;
                  const nuovoC = { id: "CT-" + Date.now(), ...newCliente, preferito: false, diario: [] };
                  setContatti(prev => [...prev, nuovoC]);
                  setSavedCliente(nuovoC);
                  setNewCliente({ nome: "", cognome: "", tipo: "cliente", telefono: "", email: "", indirizzo: "", piva: "", note: "" });
                }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#1A9E73", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <I d={ICO.checkCircle} s={16} c="#fff" /> Salva contatto
                </button>
                <button onClick={() => {
                  if (!newCliente.nome.trim()) return;
                  const nuovoC = { id: "CT-" + Date.now(), ...newCliente, preferito: false, diario: [] };
                  setContatti(prev => [...prev, nuovoC]);
                  setNewCM(prev => ({ ...prev, cliente: nuovoC.nome, cognome: nuovoC.cognome || "", telefono: nuovoC.telefono || "", indirizzo: nuovoC.indirizzo || "", clienteId: nuovoC.id }));
                  setTab("commesse");
                  setShowNewCliente(false);
                  setNewCliente({ nome: "", cognome: "", tipo: "cliente", telefono: "", email: "", indirizzo: "", piva: "", note: "" });
                }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#D08008", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <I d={ICO.folder} s={16} c="#fff" /> Salva e crea commessa
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ═══ LISTA ═══
    return (
      <div style={{ padding: "0 0 100px" }}>
        <div style={{ ...S.header, flexDirection: "column", alignItems: "stretch" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>Clienti</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: L.sub, fontWeight: 600 }}>{contatti.length}</span>
              <div onClick={() => setShowNewCliente(true)} style={{ width: 32, height: 32, borderRadius: 8, background: L.primary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Ico d={ICO.plus} s={16} c="#fff" />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, border: `1px solid ${L.border}`, background: L.surface, marginBottom: 8 }}>
            <Ico d={ICO.search} s={14} c={L.sub} />
            <input value={clientiSearch} onChange={e => setClientiSearch(e.target.value)} placeholder="Cerca..." style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: L.text, outline: "none", fontFamily: "inherit" }} />
            {clientiSearch && <div onClick={() => setClientiSearch("")} style={{ cursor: "pointer", fontSize: 12, color: L.sub }}></div>}
          </div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
            {filters.map(f => (
              <div key={f.id} onClick={() => setClientiFilter(f.id)} style={{ padding: "5px 10px", borderRadius: 16, border: `1px solid ${clientiFilter === f.id ? f.c : L.border}`, background: clientiFilter === f.id ? f.c + "15" : L.surface, fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", color: clientiFilter === f.id ? f.c : L.sub }}>
                {f.l}{f.id !== "tutti" ? ` ${contatti.filter(c => c.tipo === f.id).length}` : ""}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "0 16px" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: L.text, marginBottom: 4 }}>Nessun contatto</div>
              <div style={{ fontSize: 12, color: L.sub }}>Aggiungi il tuo primo cliente</div>
            </div>
          )}
          {filtered.map(c => {
            const cmCount = cmCountFor(c);
            const tipoColor = c.tipo === "cliente" ? "#007aff" : c.tipo === "fornitore" ? "#34c759" : "#af52de";
            const initials = ((c.nome||"")[0] || "") + ((c.cognome||"")[0] || "");
            return (
              <div key={c.id} onClick={() => setSelectedCliente(c)} style={{ padding: "12px 14px", background: L.surface, borderRadius: 12, border: `1px solid ${L.border}`, marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: tipoColor + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: tipoColor, flexShrink: 0 }}>
                  {initials.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: L.text, display: "flex", alignItems: "center", gap: 4 }}>
                    {c.nome} {c.cognome || ""}
                    {c.preferito && <span style={{ fontSize: 12 }}>⭐</span>}
                  </div>
                  <div style={{ fontSize: 11, color: L.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.telefono || c.email || c.indirizzo || "Nessun dettaglio"}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                    <span style={{ ...S.badge(tipoColor + "15", tipoColor), fontSize: 9 }}>{c.tipo === "cliente" ? "Cliente" : c.tipo === "fornitore" ? "Fornitore" : "Professionista"}</span>
                    {cmCount > 0 && <span style={{ ...S.badge(L.amberBg, L.primary), fontSize: 9 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> {cmCount}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {c.telefono && <div onClick={(e) => { e.stopPropagation(); window.location.href="tel:" + c.telefono; }} style={{ width: 32, height: 32, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}></div>}
                  {c.telefono && <div onClick={(e) => { e.stopPropagation(); window.open("https://wa.me/" + (c.telefono||"").replace(/\s/g, "")); }} style={{ width: 32, height: 32, borderRadius: "50%", background: "#dcf8c6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
}
