// ═══════════════════════════════════════════════════════════
// MASTRO ERP — Modulo PORTE INTERNE v1.0
// Catalogo: GP Porte (Torano Castello, CS) + standard settore
// 8 linee prodotto, 21 sistemi apertura, campi misura completi
// ═══════════════════════════════════════════════════════════

// ─── PARTE 1: CATALOGO CONFIG ────────────────────────────
// Da aggiungere a mastro-accessori-config.tsx

// Materiali / Linee prodotto GP Porte
export const PORTE_MATERIALE = [
  { id: "pm01", code: "Legno",       desc: "Massello e impiallacciato, finiture pregiate" },
  { id: "pm02", code: "Laccato",     desc: "Laccatura RAL/NCS, opaco o lucido" },
  { id: "pm03", code: "Laminato",    desc: "CPL/HPL, alta resistenza, economico" },
  { id: "pm04", code: "Vetro",       desc: "Vetro temperato, trasparente/satinato/decorato" },
  { id: "pm05", code: "Blindata",    desc: "Alias — classe antieffrazione 3/4" },
  { id: "pm06", code: "Metallica",   desc: "Acciaio, REI antincendio" },
  { id: "pm07", code: "Light",       desc: "Economica, tamburata leggera" },
  { id: "pm08", code: "EI Hotel",    desc: "Taglio fuoco EI30/EI60/EI90/EI120, certificata EN 1634" },
];

// Sistemi di apertura (da pagina GP Porte sistemi-di-apertura)
export const PORTE_APERTURA = [
  // Battenti
  { id: "pa01", code: "Battente singola",           cat: "battente", ante: 1 },
  { id: "pa02", code: "Battente doppia",            cat: "battente", ante: 2 },
  { id: "pa03", code: "Ventola singola",            cat: "battente", ante: 1 },
  // Libro / Pieghevole
  { id: "pa04", code: "Libro simmetrica",           cat: "libro",    ante: 2 },
  { id: "pa05", code: "Libro asimmetrica",          cat: "libro",    ante: 2 },
  // Roto / Compack
  { id: "pa06", code: "Roto singola",               cat: "roto",     ante: 1 },
  { id: "pa07", code: "Compack 180",                cat: "roto",     ante: 1 },
  // Scorrevole a scomparsa
  { id: "pa08", code: "Scomparsa singola",          cat: "scomparsa", ante: 1 },
  { id: "pa09", code: "Scomparsa doppia",           cat: "scomparsa", ante: 2 },
  // Scorrevole esterno muro
  { id: "pa10", code: "Esterno muro mantovana singola",  cat: "esterno", ante: 1 },
  { id: "pa11", code: "Esterno muro mantovana doppia",   cat: "esterno", ante: 2 },
  { id: "pa12", code: "Esterno muro ruling singola",     cat: "esterno", ante: 1 },
  { id: "pa13", code: "Esterno muro ruling doppia",      cat: "esterno", ante: 2 },
  { id: "pa14", code: "Esterno muro thin singola",       cat: "esterno", ante: 1 },
  { id: "pa15", code: "Esterno muro thin doppia",        cat: "esterno", ante: 2 },
  { id: "pa16", code: "Esterno muro evolution singola",  cat: "esterno", ante: 1 },
  { id: "pa17", code: "Esterno muro evolution doppia",   cat: "esterno", ante: 2 },
  // Scorrevole sovrapposta / unilaterale
  { id: "pa18", code: "Sovrapposta 2 ante",         cat: "esterno", ante: 2 },
  { id: "pa19", code: "Sovrapposta 4 ante",         cat: "esterno", ante: 4 },
  { id: "pa20", code: "Unilaterale 2 ante",         cat: "esterno", ante: 2 },
  { id: "pa21", code: "Unilaterale 4 ante",         cat: "esterno", ante: 4 },
  // Tipo armadio
  { id: "pa22", code: "Tipo armadio",               cat: "armadio",  ante: 2 },
  // Filomuro
  { id: "pa23", code: "Filomuro battente",          cat: "filomuro", ante: 1 },
  { id: "pa24", code: "Filomuro scorrevole",        cat: "filomuro", ante: 1 },
];

// Finiture
export const PORTE_FINITURA = [
  { id: "pf01", code: "Liscio" },
  { id: "pf02", code: "Pantografato" },
  { id: "pf03", code: "Inciso" },
  { id: "pf04", code: "Con vetro" },
  { id: "pf05", code: "Bugnato" },
  { id: "pf06", code: "Specchiato" },
  { id: "pf07", code: "Dogato orizzontale" },
  { id: "pf08", code: "Dogato verticale" },
];

// Tipo vetro inserti
export const PORTE_VETRO_INSERTO = [
  { id: "pv01", code: "Senza vetro" },
  { id: "pv02", code: "Vetro trasparente" },
  { id: "pv03", code: "Vetro satinato" },
  { id: "pv04", code: "Vetro decorato" },
  { id: "pv05", code: "Vetro laccato" },
  { id: "pv06", code: "Vetro temperato" },
];

// Maniglieria
export const PORTE_MANIGLIA = [
  { id: "ph01", code: "Su rosetta" },
  { id: "ph02", code: "Su placca" },
  { id: "ph03", code: "Incasso" },
  { id: "ph04", code: "Maniglione antipanico" },
  { id: "ph05", code: "Digitale / Elettronica" },
  { id: "ph06", code: "Nessuna (push)" },
];

// Senso apertura
export const PORTE_SENSO = [
  { id: "ps01", code: "DX spinta" },
  { id: "ps02", code: "DX tirare" },
  { id: "ps03", code: "SX spinta" },
  { id: "ps04", code: "SX tirare" },
];

// Classe EI (per porte tagliafuoco)
export const PORTE_CLASSE_EI = [
  { id: "pe01", code: "Non classificata" },
  { id: "pe02", code: "EI 30" },
  { id: "pe03", code: "EI 60" },
  { id: "pe04", code: "EI 90" },
  { id: "pe05", code: "EI 120" },
];

// Classe antieffrazione (per blindate)
export const PORTE_CLASSE_RC = [
  { id: "pr01", code: "Non classificata" },
  { id: "pr02", code: "RC 2 (WK2)" },
  { id: "pr03", code: "RC 3 (WK3)" },
  { id: "pr04", code: "RC 4 (WK4)" },
];

// Colori standard porte (i più comuni)
export const PORTE_COLORE_INIT = [
  { id: "pc01", code: "Bianco laccato" },
  { id: "pc02", code: "Bianco matrix" },
  { id: "pc03", code: "Grigio RAL 7035" },
  { id: "pc04", code: "Grigio RAL 7016" },
  { id: "pc05", code: "Noce nazionale" },
  { id: "pc06", code: "Noce canaletto" },
  { id: "pc07", code: "Rovere sbiancato" },
  { id: "pc08", code: "Rovere naturale" },
  { id: "pc09", code: "Rovere grigio" },
  { id: "pc10", code: "Wengé" },
  { id: "pc11", code: "Olmo" },
  { id: "pc12", code: "Frassino" },
  { id: "pc13", code: "RAL personalizzato" },
  { id: "pc14", code: "NCS personalizzato" },
];

// Controtelaio porta
export const PORTE_CONTROTELAIO = [
  { id: "pct01", code: "Standard legno" },
  { id: "pct02", code: "Metallo zincato" },
  { id: "pct03", code: "Scrigno scomparsa" },
  { id: "pct04", code: "Eclisse scomparsa" },
  { id: "pct05", code: "Filomuro alluminio" },
  { id: "pct06", code: "Esistente (adattamento)" },
  { id: "pct07", code: "Da definire" },
];

// Dimensioni standard porte italiane
export const PORTE_MISURE_STD = [
  { l: 600,  h: 2100, label: "60×210 (bagno)" },
  { l: 700,  h: 2100, label: "70×210 (standard)" },
  { l: 800,  h: 2100, label: "80×210 (standard)" },
  { l: 900,  h: 2100, label: "90×210 (accesso disabili)" },
  { l: 1000, h: 2100, label: "100×210 (grande)" },
  { l: 1200, h: 2100, label: "120×210 (doppia)" },
  { l: 800,  h: 2400, label: "80×240 (raso soffitto)" },
  { l: 900,  h: 2400, label: "90×240 (raso soffitto)" },
  { l: 0,    h: 0,    label: "Su misura" },
];


// ═══════════════════════════════════════════════════════════
// PARTE 2: VANODETAILPANEL — BLOCCO ACCESSORIO PORTA INTERNA
// Aggiungi nella lista ACCESSORI_LISTA (nel file VanoAccessoriBlock-CODICE.tsx)
// ═══════════════════════════════════════════════════════════

/*
Nella lista accessori, aggiungi DOPO "cancello":

  { key: "porta_interna", icon: "🚪", label: "Porta interna", color: "#92400e", settore: "porte" },

Poi nel blocco render, aggiungi il caso porta_interna.
Sotto trovi il JSX completo da inserire.
*/

// ─── JSX BLOCCO PORTA INTERNA (da incollare nel VanoAccessoriBlock) ──

// /*
// 
// {acc.key === "porta_interna" && (<>
//   {/* MATERIALE / LINEA */}
//   <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Materiale / Linea</div>
//   <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
//     {(porteMaterialeDB || []).map(pm => (
//       <div key={pm.id} onClick={() => updateAccessorio(v.id, "porta_interna", "materiale", pm.code)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${a.materiale === pm.code ? acc.color : T.bdr}`, background: a.materiale === pm.code ? acc.color + "18" : T.card, fontSize: 11, cursor: "pointer", fontWeight: a.materiale === pm.code ? 700 : 400, color: a.materiale === pm.code ? acc.color : T.text }}>{pm.code}</div>
//     ))}
//   </div>
// 
//   {/* SISTEMA APERTURA */}
//   <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Sistema apertura</div>
//   <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, marginBottom: 10 }} value={a.apertura || ""} onChange={e => updateAccessorio(v.id, "porta_interna", "apertura", e.target.value)}>
//     <option value="">— Seleziona sistema —</option>
//     {(() => {
//       const cats = [
//         {id:"battente",label:"Battente"},{id:"libro",label:"Libro/Pieghevole"},{id:"roto",label:"Roto/Compack"},
//         {id:"scomparsa",label:"Scorrevole scomparsa"},{id:"esterno",label:"Scorrevole esterno muro"},
//         {id:"armadio",label:"Armadio"},{id:"filomuro",label:"Filomuro"},
//       ];
//       return cats.map(cat => {
//         const items = (porteAperturaDB || []).filter(pa => pa.cat === cat.id);
//         if (items.length === 0) return null;
//         return (
//           <optgroup key={cat.id} label={cat.label}>
//             {items.map(pa => <option key={pa.id} value={pa.code}>{pa.code}</option>)}
//           </optgroup>
//         );
//       });
//     })()}
//   </select>
// 
//   {/* MISURA RAPIDA */}
//   <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Misura standard</div>
//   <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
//     {[
//       {l:600,h:2100,label:"60×210"},{l:700,h:2100,label:"70×210"},{l:800,h:2100,label:"80×210"},
//       {l:900,h:2100,label:"90×210"},{l:800,h:2400,label:"80×240"},{l:0,h:0,label:"Su misura"},
//     ].map(ms => {
//       const isSel = a.larghezza === ms.l && a.altezza === ms.h;
//       return (
//         <div key={ms.label} onClick={() => {
//           if (ms.l > 0) {
//             updateAccessorio(v.id, "porta_interna", "larghezza", ms.l);
//             updateAccessorio(v.id, "porta_interna", "altezza", ms.h);
//           }
//         }} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${isSel ? acc.color : T.bdr}`, background: isSel ? acc.color + "18" : T.card, fontSize: 11, cursor: "pointer", fontWeight: isSel ? 700 : 400, color: isSel ? acc.color : T.text }}>{ms.label}</div>
//       );
//     })}
//   </div>
// 
//   {/* DIMENSIONI — Luce vano */}
//   <div style={{ marginBottom: 8 }}>
//     <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>Larghezza luce vano</div>
//     <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//       <input style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" placeholder="" value={a.larghezza || ""} onChange={e => updateAccessorio(v.id, "porta_interna", "larghezza", parseInt(e.target.value) || 0)} />
//       <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
//     </div>
//   </div>
//   <div style={{ marginBottom: 8 }}>
//     <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>Altezza luce vano</div>
//     <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//       <input style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" placeholder="" value={a.altezza || ""} onChange={e => updateAccessorio(v.id, "porta_interna", "altezza", parseInt(e.target.value) || 0)} />
//       <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
//     </div>
//   </div>
// 
//   {/* SPESSORE MURO — importante per scomparsa/filomuro */}
//   <div style={{ marginBottom: 8 }}>
//     <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>Spessore muro</div>
//     <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//       <input style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" placeholder="Es. 100, 120, 150..." value={a.spessoreMuro || ""} onChange={e => updateAccessorio(v.id, "porta_interna", "spessoreMuro", parseInt(e.target.value) || 0)} />
//       <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
//     </div>
//   </div>
// 
//   {/* SENSO APERTURA */}
//   <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Senso apertura</div>
//   <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
//     {["DX spinta", "DX tirare", "SX spinta", "SX tirare"].map(senso => (
//       <div key={senso} onClick={() => updateAccessorio(v.id, "porta_interna", "senso", senso)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${a.senso === senso ? acc.color : T.bdr}`, background: a.senso === senso ? acc.color + "18" : T.card, fontSize: 11, cursor: "pointer", fontWeight: a.senso === senso ? 700 : 400, color: a.senso === senso ? acc.color : T.text }}>{senso}</div>
//     ))}
//   </div>
// 
//   {/* FINITURA */}
//   <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Finitura</div>
//   <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
//     {(porteFinituraDB || []).map(pf => (
//       <div key={pf.id} onClick={() => updateAccessorio(v.id, "porta_interna", "finitura", pf.code)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${a.finitura === pf.code ? acc.color : T.bdr}`, background: a.finitura === pf.code ? acc.color + "18" : T.card, fontSize: 11, cursor: "pointer", fontWeight: a.finitura === pf.code ? 700 : 400, color: a.finitura === pf.code ? acc.color : T.text }}>{pf.code}</div>
//     ))}
//   </div>
// 
//   {/* VETRO INSERTO (se finitura "Con vetro") */}
//   {a.finitura === "Con vetro" && (<>
//     <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipo vetro</div>
//     <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
//       {(porteVetroDB || []).map(pv => (
//         <div key={pv.id} onClick={() => updateAccessorio(v.id, "porta_interna", "vetroInserto", pv.code)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${a.vetroInserto === pv.code ? acc.color : T.bdr}`, background: a.vetroInserto === pv.code ? acc.color + "18" : T.card, fontSize: 11, cursor: "pointer", fontWeight: a.vetroInserto === pv.code ? 700 : 400, color: a.vetroInserto === pv.code ? acc.color : T.text }}>{pv.code}</div>
//       ))}
//     </div>
//   </>)}
// 
//   {/* COLORE */}
//   <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Colore / Essenza</div>
//   <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, marginBottom: 10 }} value={a.colorePorta || ""} onChange={e => updateAccessorio(v.id, "porta_interna", "colorePorta", e.target.value)}>
//     <option value="">— Seleziona colore —</option>
//     {(porteColoreDB || []).map(pc => <option key={pc.id} value={pc.code}>{pc.code}</option>)}
//   </select>
// 
//   {/* CONTROTELAIO */}
//   <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Controtelaio</div>
//   <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
//     {(porteControtelaioDb || []).map(pct => (
//       <div key={pct.id} onClick={() => updateAccessorio(v.id, "porta_interna", "controtelaio", pct.code)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${a.controtelaio === pct.code ? acc.color : T.bdr}`, background: a.controtelaio === pct.code ? acc.color + "18" : T.card, fontSize: 11, cursor: "pointer", fontWeight: a.controtelaio === pct.code ? 700 : 400, color: a.controtelaio === pct.code ? acc.color : T.text }}>{pct.code}</div>
//     ))}
//   </div>
// 
//   {/* MANIGLIERIA */}
//   <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Maniglieria</div>
//   <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
//     {(porteManiglia || []).map(ph => (
//       <div key={ph.id} onClick={() => updateAccessorio(v.id, "porta_interna", "maniglia", ph.code)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${a.maniglia === ph.code ? acc.color : T.bdr}`, background: a.maniglia === ph.code ? acc.color + "18" : T.card, fontSize: 11, cursor: "pointer", fontWeight: a.maniglia === ph.code ? 700 : 400, color: a.maniglia === ph.code ? acc.color : T.text }}>{ph.code}</div>
//     ))}
//   </div>
// 
//   {/* CLASSE EI (solo se materiale = EI Hotel o Metallica) */}
//   {(a.materiale === "EI Hotel" || a.materiale === "Metallica") && (<>
//     <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Classe EI taglio fuoco</div>
//     <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
//       {(porteClasseEI || []).map(pe => (
//         <div key={pe.id} onClick={() => updateAccessorio(v.id, "porta_interna", "classeEI", pe.code)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${a.classeEI === pe.code ? "#ef4444" : T.bdr}`, background: a.classeEI === pe.code ? "#ef444418" : T.card, fontSize: 11, cursor: "pointer", fontWeight: a.classeEI === pe.code ? 700 : 400, color: a.classeEI === pe.code ? "#ef4444" : T.text }}>{pe.code}</div>
//       ))}
//     </div>
//     <div style={{ fontSize: 10, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px 10px", borderRadius: 6, marginBottom: 10 }}>
//       🔥 Certificazione EN 1634 — Resistenza fuoco fino a {a.classeEI || "..."} minuti
//     </div>
//   </>)}
// 
//   {/* CLASSE RC (solo se materiale = Blindata) */}
//   {a.materiale === "Blindata" && (<>
//     <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Classe antieffrazione</div>
//     <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
//       {(porteClasseRC || []).map(pr => (
//         <div key={pr.id} onClick={() => updateAccessorio(v.id, "porta_interna", "classeRC", pr.code)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${a.classeRC === pr.code ? "#f59e0b" : T.bdr}`, background: a.classeRC === pr.code ? "#f59e0b18" : T.card, fontSize: 11, cursor: "pointer", fontWeight: a.classeRC === pr.code ? 700 : 400, color: a.classeRC === pr.code ? "#f59e0b" : T.text }}>{pr.code}</div>
//       ))}
//     </div>
//     <div style={{ fontSize: 10, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", padding: "6px 10px", borderRadius: 6, marginBottom: 10 }}>
//       🛡 Porte blindate Alias — Pannelli coordinabili con linee GP Porte
//     </div>
//   </>)}
// 
//   {/* NOTE */}
//   <div style={{ marginBottom: 10 }}>
//     <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Note</div>
//     <textarea style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, minHeight: 50, resize: "vertical" }} placeholder="Es. Coprifilo da coordinare, soglia da incassare, muro curvo..." value={a.notePorta || ""} onChange={e => updateAccessorio(v.id, "porta_interna", "notePorta", e.target.value)} />
//   </div>
// </>)}
// 
// */


// ═══════════════════════════════════════════════════════════
// PARTE 3: SETTINGSPANEL — TAB PORTE INTERNE
// Da incollare nel SettingsPanel.tsx
// ═══════════════════════════════════════════════════════════

// /*
// STEP 1: Aggiungi nella lista tab (riga ~80):
//   { id: "porte", l: "🚪 Porte" },
// 
// STEP 2: Aggiungi nuovi state nel MastroERP:
//   const [porteMaterialeDB, setPorteMaterialeDB] = useState(PORTE_MATERIALE);
//   const [porteAperturaDB, setPorteAperturaDB] = useState(PORTE_APERTURA);
//   const [porteFinituraDB, setPorteFinituraDB] = useState(PORTE_FINITURA);
//   const [porteVetroDB, setPorteVetroDB] = useState(PORTE_VETRO_INSERTO);
//   const [porteColoreDB, setPorteColoreDB] = useState(PORTE_COLORE_INIT);
//   const [porteControtelaioDB, setPorteControtelaioDB] = useState(PORTE_CONTROTELAIO);
//   const [porteManiglia, setPorteManiglia] = useState(PORTE_MANIGLIA);
//   const [porteClasseEI, setPorteClasseEI] = useState(PORTE_CLASSE_EI);
//   const [porteClasseRC, setPorteClasseRC] = useState(PORTE_CLASSE_RC);
// 
// STEP 3: Incolla il blocco sotto nel SettingsPanel:
// */

// /*
// 
// {settingsTab === "porte" && (
//   <>
//     <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura materiali, aperture e opzioni porte interne (catalogo GP Porte)</div>
// 
//     {/* MATERIALI */}
//     <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>🚪 Materiali / Linee ({porteMaterialeDB.length})</div>
//     {porteMaterialeDB.map(pm => (
//       <div key={pm.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
//         <div>
//           <span style={{ fontSize: 13, fontWeight: 600 }}>{pm.code}</span>
//           {pm.desc && <span style={{ fontSize: 10, color: T.sub, marginLeft: 6 }}>{pm.desc}</span>}
//         </div>
//         <div onClick={() => setPorteMaterialeDB(prev => prev.filter(x => x.id !== pm.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
//       </div></div>
//     ))}
//     <div onClick={() => { let n; try{n=window.prompt("Nuovo materiale/linea porta:");}catch(e){} if (n?.trim()) setPorteMaterialeDB(prev => [...prev, { id: "pm" + Date.now(), code: n.trim(), desc: "" }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>+ Aggiungi materiale</div>
// 
//     {/* SISTEMI APERTURA */}
//     <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>🔓 Sistemi Apertura ({porteAperturaDB.length})</div>
//     <div style={{ maxHeight: 250, overflowY: "auto", marginBottom: 8 }}>
//       {["battente","libro","roto","scomparsa","esterno","armadio","filomuro"].map(catId => {
//         const items = porteAperturaDB.filter(pa => pa.cat === catId);
//         if (items.length === 0) return null;
//         const catLabel = {battente:"Battente",libro:"Libro/Pieghevole",roto:"Roto/Compack",scomparsa:"Scomparsa",esterno:"Esterno muro",armadio:"Armadio",filomuro:"Filomuro"}[catId];
//         return (
//           <div key={catId} style={{ marginBottom: 6 }}>
//             <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 2 }}>{catLabel}</div>
//             {items.map(pa => (
//               <div key={pa.id} style={{ ...S.card, marginBottom: 2 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px" }}>
//                 <span style={{ fontSize: 12, fontWeight: 500 }}>{pa.code}</span>
//                 <div onClick={() => setPorteAperturaDB(prev => prev.filter(x => x.id !== pa.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
//               </div></div>
//             ))}
//           </div>
//         );
//       })}
//     </div>
//     <div onClick={() => { let n; try{n=window.prompt("Nuovo sistema apertura:");}catch(e){} if (n?.trim()) { let c; try{c=window.prompt("Categoria (battente/libro/roto/scomparsa/esterno/armadio/filomuro):");}catch(e){} setPorteAperturaDB(prev => [...prev, { id: "pa" + Date.now(), code: n.trim(), cat: c?.trim() || "battente", ante: 1 }]); } }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>+ Aggiungi sistema</div>
// 
//     {/* FINITURE */}
//     <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>✨ Finiture</div>
//     {porteFinituraDB.map(pf => (
//       <div key={pf.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
//         <span style={{ fontSize: 13, fontWeight: 600 }}>{pf.code}</span>
//         <div onClick={() => setPorteFinituraDB(prev => prev.filter(x => x.id !== pf.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
//       </div></div>
//     ))}
//     <div onClick={() => { let n; try{n=window.prompt("Nuova finitura:");}catch(e){} if (n?.trim()) setPorteFinituraDB(prev => [...prev, { id: "pf" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>+ Aggiungi finitura</div>
// 
//     {/* COLORI */}
//     <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>🎨 Colori / Essenze ({porteColoreDB.length})</div>
//     <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
//       {porteColoreDB.map(pc => (
//         <div key={pc.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card }}>
//           <span style={{ fontSize: 11, fontWeight: 600 }}>{pc.code}</span>
//           <div onClick={() => setPorteColoreDB(prev => prev.filter(x => x.id !== pc.id))} style={{ cursor: "pointer", fontSize: 10, color: T.sub }}>✕</div>
//         </div>
//       ))}
//     </div>
//     <div onClick={() => { let n; try{n=window.prompt("Nuovo colore/essenza:");}catch(e){} if (n?.trim()) setPorteColoreDB(prev => [...prev, { id: "pc" + Date.now(), code: n.trim() }]); }} style={{ padding: "10px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 11, fontWeight: 600, marginBottom: 16 }}>+ Aggiungi colore</div>
// 
//     {/* CONTROTELAI */}
//     <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>🔲 Controtelai porta</div>
//     {porteControtelaioDB.map(pct => (
//       <div key={pct.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
//         <span style={{ fontSize: 13, fontWeight: 600 }}>{pct.code}</span>
//         <div onClick={() => setPorteControtelaioDB(prev => prev.filter(x => x.id !== pct.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
//       </div></div>
//     ))}
//     <div onClick={() => { let n; try{n=window.prompt("Nuovo controtelaio:");}catch(e){} if (n?.trim()) setPorteControtelaioDB(prev => [...prev, { id: "pct" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>+ Aggiungi controtelaio</div>
// 
//     {/* MANIGLIERIA */}
//     <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>🔑 Maniglieria</div>
//     {porteManiglia.map(ph => (
//       <div key={ph.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
//         <span style={{ fontSize: 13, fontWeight: 600 }}>{ph.code}</span>
//         <div onClick={() => setPorteManiglia(prev => prev.filter(x => x.id !== ph.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
//       </div></div>
//     ))}
//     <div onClick={() => { let n; try{n=window.prompt("Nuovo tipo maniglia:");}catch(e){} if (n?.trim()) setPorteManiglia(prev => [...prev, { id: "ph" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>+ Aggiungi maniglia</div>
// 
//     {/* INFO */}
//     <div style={{ padding: "12px 16px", borderRadius: 12, background: "#fef3c7", border: "1px solid #fde68a", marginTop: 12 }}>
//       <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>🏭 GP Porte — Torano Castello (CS)</div>
//       <div style={{ fontSize: 10, color: "#92400e", lineHeight: 1.5 }}>
//         700+ modelli Made in Italy. Legno, laccato, laminato, vetro, blindate Alias, metalliche, EI hotel.
//         21 sistemi di apertura. Certificazione EN 1634 (EI30-EI120). Pannelli coordinabili su blindate.
//       </div>
//     </div>
//   </>
// )}
// 
// */


// ═══════════════════════════════════════════════════════════
// PARTE 4: ACCESSORI_META — Aggiorna nel config
// ═══════════════════════════════════════════════════════════

export const PORTE_META = {
  porta_interna: {
    label: "Porta interna", icon: "🚪", color: "#92400e", settore: "porte",
    campi: ["materiale", "apertura", "larghezza", "altezza", "spessoreMuro", "senso", "finitura", "vetroInserto", "colorePorta", "controtelaio", "maniglia", "classeEI", "classeRC", "notePorta"],
  },
};

// Funzione riepilogo
export const riepilogoPorta = (v: any): string | null => {
  const a = v.accessori?.porta_interna;
  if (!a?.attivo) return null;
  return `Porta ${a.materiale || ""} ${a.apertura || ""} ${a.larghezza || "?"}×${a.altezza || "?"} ${a.colorePorta || ""} ${a.classeEI && a.classeEI !== "Non classificata" ? "🔥" + a.classeEI : ""} ${a.classeRC && a.classeRC !== "Non classificata" ? "🛡" + a.classeRC : ""}`.trim();
};
