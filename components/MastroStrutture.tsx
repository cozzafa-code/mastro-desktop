"use client";
// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react"
import * as THREE from "three"

// ══════════════════════════════════════════════════════════════════
//  MASTRO STRUTTURE v7 — Mobile-first redesign
// ══════════════════════════════════════════════════════════════════

const DS = {
  bg: "#FFFFFF", bg2: "#F9F9F9", surface: "#FFFFFF",
  text: "#171717", text2: "#525252", text3: "#A3A3A3",
  border: "#E5E5E5", borderLight: "#F0F0F0",
  accent: "#171717", accentSoft: "#17171710",
  blue: "#2563EB", blueSoft: "#2563EB12",
  green: "#16A34A", greenSoft: "#16A34A12",
  red: "#DC2626", redSoft: "#DC262612",
  orange: "#EA580C",
  r: 10, r2: 14,
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 30px rgba(0,0,0,0.08)",
}
const F = "'SF Pro Display', -apple-system, system-ui, sans-serif"
const M = "'SF Mono', 'JetBrains Mono', monospace"

const Ic = ({ children, s = 20, c = DS.text }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
const ICO = {
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></>,
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  tool: <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>,
  box: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></>,
  drop: <><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></>,
  gate: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></>,
  pens: <><path d="M4 22V10"/><path d="M4 10h16l-3 12H4"/><path d="M4 14l13-2.5"/></>,
  print: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
}

// ─── PROFILI ──────────────────────────────────────────────────
const PROFILI = [
  { id: "TQ40x40x2", cat: "Tub. Quadro", nome: "40×40×2", lato: 40, sp: 2, pesoM: 2.31, sez: "quadro" },
  { id: "TQ50x50x2", cat: "Tub. Quadro", nome: "50×50×2", lato: 50, sp: 2, pesoM: 2.93, sez: "quadro" },
  { id: "TQ60x60x2", cat: "Tub. Quadro", nome: "60×60×2", lato: 60, sp: 2, pesoM: 3.56, sez: "quadro" },
  { id: "TQ60x60x3", cat: "Tub. Quadro", nome: "60×60×3", lato: 60, sp: 3, pesoM: 5.17, sez: "quadro" },
  { id: "TQ80x80x3", cat: "Tub. Quadro", nome: "80×80×3", lato: 80, sp: 3, pesoM: 7.01, sez: "quadro" },
  { id: "TQ100x100x3", cat: "Tub. Quadro", nome: "100×100×3", lato: 100, sp: 3, pesoM: 8.86, sez: "quadro" },
  { id: "TQ100x100x4", cat: "Tub. Quadro", nome: "100×100×4", lato: 100, sp: 4, pesoM: 11.7, sez: "quadro" },
  { id: "TQ120x120x4", cat: "Tub. Quadro", nome: "120×120×4", lato: 120, sp: 4, pesoM: 14.1, sez: "quadro" },
  { id: "TR60x40x2", cat: "Tub. Rett.", nome: "60×40×2", w: 60, h: 40, sp: 2, pesoM: 2.93, sez: "rett" },
  { id: "TR80x40x2", cat: "Tub. Rett.", nome: "80×40×2", w: 80, h: 40, sp: 2, pesoM: 3.56, sez: "rett" },
  { id: "TR80x40x3", cat: "Tub. Rett.", nome: "80×40×3", w: 80, h: 40, sp: 3, pesoM: 5.17, sez: "rett" },
  { id: "TR100x50x3", cat: "Tub. Rett.", nome: "100×50×3", w: 100, h: 50, sp: 3, pesoM: 6.71, sez: "rett" },
  { id: "TR120x60x3", cat: "Tub. Rett.", nome: "120×60×3", w: 120, h: 60, sp: 3, pesoM: 8.25, sez: "rett" },
  { id: "TR150x50x3", cat: "Tub. Rett.", nome: "150×50×3", w: 150, h: 50, sp: 3, pesoM: 9.02, sez: "rett" },
  { id: "TT48x2.5", cat: "Tub. Tondo", nome: "ø48×2.5", diam: 48, sp: 2.5, pesoM: 2.82, sez: "tondo" },
  { id: "TT60x2", cat: "Tub. Tondo", nome: "ø60×2", diam: 60, sp: 2, pesoM: 2.87, sez: "tondo" },
  { id: "IPE100", cat: "IPE", nome: "IPE 100", h: 100, b: 55, sp: 5.7, pesoM: 8.1, sez: "ipe" },
  { id: "IPE120", cat: "IPE", nome: "IPE 120", h: 120, b: 64, sp: 6.3, pesoM: 10.4, sez: "ipe" },
  { id: "IPE140", cat: "IPE", nome: "IPE 140", h: 140, b: 73, sp: 6.9, pesoM: 12.9, sez: "ipe" },
  { id: "UPN80", cat: "UPN", nome: "UPN 80", h: 80, b: 45, sp: 6, pesoM: 8.64, sez: "upn" },
  { id: "UPN100", cat: "UPN", nome: "UPN 100", h: 100, b: 50, sp: 6, pesoM: 10.6, sez: "upn" },
  { id: "L50x50x5", cat: "Angolare", nome: "L 50×50×5", lato: 50, sp: 5, pesoM: 3.77, sez: "ang" },
  { id: "PL50x5", cat: "Piatto", nome: "50×5", w: 50, sp: 5, pesoM: 1.96, sez: "piatto" },
  { id: "PL80x8", cat: "Piatto", nome: "80×8", w: 80, sp: 8, pesoM: 5.02, sez: "piatto" },
  { id: "LAM150x20", cat: "Lamella", nome: "150×20 biocl.", w: 150, sp: 20, pesoM: 1.8, sez: "lamella" },
  { id: "LAM200x25", cat: "Lamella", nome: "200×25 biocl.", w: 200, sp: 25, pesoM: 2.4, sez: "lamella" },
]
const CATS_PROF = [...new Set(PROFILI.map(p => p.cat))]

const COPERTURE = [
  { id: "lamelle", n: "Lamelle bioclimatiche" }, { id: "vetro", n: "Vetro" },
  { id: "pannello", n: "Pannello sandwich" }, { id: "policarbonato", n: "Policarbonato" },
  { id: "lamiera_coib", n: "Lamiera coibentata" }, { id: "tegolamiera", n: "Tegolamiera" },
  { id: "none", n: "Nessuna" },
]

// isPensilina flag changes the entire behavior
const TIPI = [
  { id: "pergola", n: "Pergola Bioclimatica", desc: "Lamelle orientabili", icon: ICO.sun, defW: 4000, defD: 3000, defH: 2800, col: "#404040", hasRoof: true, roofType: "lamelle", isPens: false, defProfili: { montanti: "TQ80x80x3", travi_sup: "TR120x60x3", travi_inf: "TR80x40x2", lamelle: "LAM200x25" } },
  { id: "veranda", n: "Veranda", desc: "Chiusura vetrata", icon: ICO.home, defW: 3000, defD: 2000, defH: 2500, col: "#D4D4D4", hasRoof: true, roofType: "vetro", isPens: false, defProfili: { montanti: "TQ60x60x2", travi_sup: "TR100x50x3", travi_inf: "TQ50x50x2", lamelle: "PL50x5" } },
  { id: "pensilina", n: "Pensilina", desc: "A sbalzo, fissata a parete", icon: ICO.pens, defW: 2000, defD: 1200, defH: 2600, col: "#525252", hasRoof: true, roofType: "policarbonato", isPens: true,
    defPens: { altFissaggio: 2600, sporto: 1200, larghezza: 2000, pendenza: 10, nBracci: 3, tipoBraccio: "triangolo", pannelloSx: false, pannelloDx: false, grondaFrontale: true, montantiFrontali: false },
    defProfili: { colmo: "TR80x40x3", bracci: "TQ60x60x3", frontale: "TR60x40x2", lamelle: "PL50x5" } },
  { id: "ferro", n: "Struttura Ferro", desc: "Carpenteria su misura", icon: ICO.tool, defW: 3000, defD: 2500, defH: 2700, col: "#262626", hasRoof: false, roofType: "none", isPens: false, defProfili: { montanti: "TQ100x100x4", travi_sup: "IPE140", travi_inf: "TQ60x60x3", lamelle: "PL50x5" } },
  { id: "box_alu", n: "Box Alluminio", desc: "Ripostiglio esterno", icon: ICO.box, defW: 2000, defD: 1000, defH: 2200, col: "#A3A3A3", hasRoof: true, roofType: "pannello", isPens: false, defProfili: { montanti: "TQ50x50x2", travi_sup: "TR80x40x2", travi_inf: "TQ40x40x2", lamelle: "PL50x5" } },
  { id: "box_doccia", n: "Box Doccia", desc: "Cabina su misura", icon: ICO.drop, defW: 1200, defD: 800, defH: 2100, col: "#D4D4D4", hasRoof: false, roofType: "none", isPens: false, defProfili: { montanti: "TQ40x40x2", travi_sup: "TQ40x40x2", travi_inf: "TQ40x40x2", lamelle: "PL50x5" } },
  { id: "cancello", n: "Cancello / Recinzione", desc: "Ingresso carraio/pedonale", icon: ICO.gate, defW: 4000, defD: 100, defH: 1800, col: "#171717", hasRoof: false, roofType: "none", isPens: false, defProfili: { montanti: "TQ100x100x3", travi_sup: "TR80x40x3", travi_inf: "TR80x40x3", lamelle: "PL50x5" } },
]

const ELEMENTI = [
  { id: "vetro_fisso", n: "Vetro Fisso", color: "#BFDBFE", op: 0.45 },
  { id: "vetro_scorr", n: "Scorrevole", color: "#93C5FD", op: 0.45 },
  { id: "finestra", n: "Finestra", color: "#BAE6FD", op: 0.5 },
  { id: "porta", n: "Porta", color: "#D6B48A", op: 0.7 },
  { id: "portone", n: "Portone", color: "#B8956A", op: 0.8 },
  { id: "pannello", n: "Pannello", color: "#A3A3A3", op: 0.85 },
  { id: "lamelle", n: "Lamelle", color: "#D4D4D4", op: 0.6 },
  { id: "persiana", n: "Persiana", color: "#86EFAC", op: 0.5 },
  { id: "rete", n: "Zanzariera", color: "#E5E5E5", op: 0.3 },
]
const COLORI = [
  { n: "Antracite 7016", h: "#404040" }, { n: "Bianco 9010", h: "#F5F5F5" },
  { n: "Nero 9005", h: "#171717" }, { n: "Marrone 8017", h: "#44322D" },
  { n: "Grigio 7035", h: "#D4D4D4" }, { n: "Verde 6005", h: "#14532D" },
  { n: "Corten", h: "#92400E" }, { n: "Noce", h: "#78350F" },
]

let _u = 0; const uid = () => `s${++_u}`

// ─── UI ───────────────────────────────────────────────────────
const Btn = ({ children, onClick, primary, small, active, style: sx }) => <button onClick={onClick} style={{ padding: small ? "6px 12px" : "10px 20px", borderRadius: DS.r, border: primary ? "none" : `1px solid ${active ? DS.accent : DS.border}`, background: primary ? DS.accent : active ? DS.accentSoft : DS.surface, color: primary ? "#fff" : active ? DS.accent : DS.text2, fontSize: small ? 12 : 14, fontWeight: 500, fontFamily: F, cursor: "pointer", transition: "all 0.15s", ...sx }}>{children}</button>
const Label = ({ children }) => <div style={{ fontSize: 11, fontWeight: 600, color: DS.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{children}</div>
const ProfSVG = ({ id, size = 28 }) => { const p = PROFILI.find(x => x.id === id); if (!p) return null; const s = size, c = s / 2; return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect width={s} height={s} rx={4} fill={DS.bg2} />{p.sez==="quadro"&&<rect x={s*.2} y={s*.2} width={s*.6} height={s*.6} fill="none" stroke={DS.text} strokeWidth={1.5}/>}{p.sez==="rett"&&<rect x={s*.12} y={s*.25} width={s*.76} height={s*.5} fill="none" stroke={DS.text} strokeWidth={1.5}/>}{p.sez==="tondo"&&<circle cx={c} cy={c} r={s*.3} fill="none" stroke={DS.text} strokeWidth={1.5}/>}{p.sez==="ipe"&&<><rect x={s*.15} y={s*.15} width={s*.7} height={s*.08} fill={DS.text}/><rect x={s*.15} y={s*.77} width={s*.7} height={s*.08} fill={DS.text}/><rect x={s*.42} y={s*.23} width={s*.16} height={s*.54} fill={DS.text}/></>}{p.sez==="upn"&&<><rect x={s*.2} y={s*.15} width={s*.08} height={s*.7} fill={DS.text}/><rect x={s*.2} y={s*.15} width={s*.55} height={s*.08} fill={DS.text}/><rect x={s*.2} y={s*.77} width={s*.55} height={s*.08} fill={DS.text}/></>}{p.sez==="ang"&&<><rect x={s*.2} y={s*.2} width={s*.1} height={s*.65} fill={DS.text}/><rect x={s*.2} y={s*.75} width={s*.6} height={s*.1} fill={DS.text}/></>}{(p.sez==="piatto"||p.sez==="lamella")&&<rect x={s*.1} y={s*.4} width={s*.8} height={s*.2} fill={DS.text} rx={1}/>}</svg> }

function ProfSelect({ value, onChange, label }) {
  const [open, setOpen] = useState(false); const [cf, setCf] = useState(null)
  const sel = PROFILI.find(p => p.id === value); const fl = cf ? PROFILI.filter(p => p.cat === cf) : PROFILI
  return <div style={{ position: "relative" }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: DS.text3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
    <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${open ? DS.accent : DS.border}`, background: DS.bg, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left", fontFamily: F }}>
      <ProfSVG id={value} size={22} /><div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 600 }}>{sel?.nome||"—"}</div><div style={{ fontSize: 9, color: DS.text3 }}>{sel?.cat}·{sel?.pesoM}kg/m</div></div><span style={{ fontSize: 10, color: DS.text3 }}>▾</span>
    </button>
    {open && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, marginTop: 4, background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.r, boxShadow: DS.shadowLg, maxHeight: 260, overflowY: "auto" }}>
      <div style={{ padding: "5px 5px 3px", display: "flex", gap: 3, flexWrap: "wrap", borderBottom: `1px solid ${DS.borderLight}`, position: "sticky", top: 0, background: DS.surface }}>
        <button onClick={() => setCf(null)} style={{ padding: "2px 6px", borderRadius: 5, border: "none", background: !cf ? DS.accent : DS.bg2, color: !cf ? "#fff" : DS.text3, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>Tutti</button>
        {CATS_PROF.map(c => <button key={c} onClick={() => setCf(c)} style={{ padding: "2px 6px", borderRadius: 5, border: "none", background: cf===c ? DS.accent : DS.bg2, color: cf===c ? "#fff" : DS.text3, fontSize: 9, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{c}</button>)}
      </div>
      {fl.map(p => <button key={p.id} onClick={() => { onChange(p.id); setOpen(false) }} style={{ width: "100%", padding: "6px 8px", border: "none", borderBottom: `1px solid ${DS.borderLight}`, background: value===p.id ? DS.accentSoft : "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, textAlign: "left" }}>
        <ProfSVG id={p.id} size={18} /><div style={{ flex: 1 }}><div style={{ fontSize: 10, fontWeight: 600 }}>{p.nome}</div></div><div style={{ fontSize: 9, fontFamily: M, color: DS.text3 }}>{p.pesoM}</div>
      </button>)}
    </div>}
  </div>
}

// ─── ETICHETTE (Labels) ───────────────────────────────────────
function EtichetteLayer({ etichette, fase, onAdd, onRemove, onEdit, addMode, svgOffset }) {
  const labels = etichette.filter(e => e.fase === fase)
  return <g>
    {labels.map(e => <g key={e.id}>
      <rect x={e.x - 2} y={e.y - 12} width={Math.max(e.testo.length * 6 + 12, 40)} height={18} rx={4} fill="#FFFDE7" stroke="#F59E0B" strokeWidth={0.8} style={{ cursor: "pointer" }} onClick={() => {
        const txt = prompt("Modifica etichetta:", e.testo)
        if (txt === null) return
        if (txt === "") onRemove(e.id)
        else onEdit(e.id, txt)
      }} />
      <text x={e.x + 4} y={e.y} fontSize={10} fill="#92400E" fontWeight={500} style={{ pointerEvents: "none" }}>{e.testo}</text>
      <circle cx={e.x + Math.max(e.testo.length * 6 + 8, 36)} cy={e.y - 8} r={5} fill="#DC2626" opacity={0.7} style={{ cursor: "pointer" }} onClick={ev => { ev.stopPropagation(); onRemove(e.id) }} />
      <text x={e.x + Math.max(e.testo.length * 6 + 8, 36)} y={e.y - 5} textAnchor="middle" fontSize={7} fill="#fff" fontWeight={700} style={{ pointerEvents: "none" }}>×</text>
    </g>)}
    {addMode && <rect width="100%" height="100%" fill="transparent" style={{ cursor: "crosshair" }} onClick={ev => {
      const svg = ev.currentTarget.closest("svg"); const r = svg.getBoundingClientRect()
      const x = ev.clientX - r.left - (svgOffset?.x || 0), y = ev.clientY - r.top - (svgOffset?.y || 0)
      const txt = prompt("Testo etichetta:")
      if (txt) onAdd({ id: uid(), testo: txt, x, y, fase })
    }} />}
  </g>
}

function useEtichette(st, up) {
  const addLabel = (label) => up(p => ({ ...p, etichette: [...(p.etichette || []), label] }))
  const removeLabel = (id) => up(p => ({ ...p, etichette: (p.etichette || []).filter(e => e.id !== id) }))
  const editLabel = (id, testo) => up(p => ({ ...p, etichette: (p.etichette || []).map(e => e.id === id ? { ...e, testo } : e) }))
  return { addLabel, removeLabel, editLabel, etichette: st.etichette || [] }
}

// ═══ MAIN ═════════════════════════════════════════════════════
export default function MastroStrutture({ onClose }: { onClose?: () => void }) {
  const [fase, setFase] = useState("tipo")
  const [tipo, setTipo] = useState(null)
  const [st, setSt] = useState(null)

  const init = t => {
    const tip = TIPI.find(x => x.id === t); setTipo(tip)
    if (tip.isPens) {
      // PENSILINA: logica completamente diversa
      const pens = tip.defPens
      setSt({ tipo: t, isPens: true, colStruct: tip.col, roofType: tip.roofType, profili: { ...tip.defProfili }, pens: { ...pens },
        pianta: [], lati: [], montantiOff: [], traviSupOff: [], traviInfOff: [],
        tetto: { pendenza: pens.pendenza, direzione: "fronte", gronda: pens.grondaFrontale, pluviali: false, sporto: 0 },
        etichette: [],
      })
    } else {
      const W = tip.defW, D = tip.defD, H = tip.defH
      setSt({ tipo: t, isPens: false, W, D, H, colStruct: tip.col, roofType: tip.roofType,
        profili: { ...tip.defProfili },
        tetto: { pendenza: 0, direzione: "fronte", gronda: true, pluviali: true, sporto: 100 },
        pianta: [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: D }, { x: 0, y: D }],
        lati: [], montantiOff: [], traviSupOff: [], traviInfOff: [],
        etichette: [],
      })
    }
    setFase(tip.isPens ? "config" : "pianta")
  }

  const compLati = useCallback(s => {
    if (!s || s.isPens) return s
    const pts = s.pianta, lati = pts.map((p, i) => {
      const nx = pts[(i + 1) % pts.length]; const dx = nx.x - p.x, dy = nx.y - p.y; const ex = s.lati?.[i]
      return { id: ex?.id || uid(), nome: ex?.nome || `Lato ${i+1}`, lunghezza: Math.round(Math.sqrt(dx*dx+dy*dy)), altezza: s.H, elementi: ex?.elementi || [], fromPt: p, toPt: nx }
    })
    return { ...s, lati }
  }, [])
  const up = fn => setSt(prev => compLati(typeof fn === "function" ? fn(prev) : fn))
  useEffect(() => { if (st && !st.isPens && st.lati.length === 0) setSt(compLati(st)) }, [st, compLati])

  // Dynamic phases based on isPens
  const FASI = tipo?.isPens
    ? [{ k: "tipo", l: "Tipo", n: 1 }, { k: "config", l: "Config", n: 2 }, { k: "profili", l: "Profili", n: 3 }, { k: "3d", l: "3D", n: 4 }, { k: "disegno", l: "Disegno", n: 5 }]
    : [{ k: "tipo", l: "Tipo", n: 1 }, { k: "pianta", l: "Pianta", n: 2 }, { k: "profili", l: "Profili", n: 3 }, { k: "lati", l: "Lati", n: 4 }, { k: "3d", l: "3D", n: 5 }, { k: "disegno", l: "Disegno", n: 6 }]

  return <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: DS.bg, display: "flex", flexDirection: "column", fontFamily: F, color: DS.text, overflow: "hidden" }}>
    <div style={{ minHeight: 52, borderBottom: `1px solid ${DS.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 10, flexShrink: 0 }}>
      {onClose && <button onClick={onClose} style={{ padding: "8px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: DS.text, WebkitTapHighlightColor: "transparent" }}>←</button>}
      <span style={{ fontSize: 15, fontWeight: 700 }}>MASTRO</span><span style={{ fontSize: 12, color: DS.text3 }}>Strutture</span>
      {st && tipo && <div style={{ fontSize: 12, fontWeight: 600, color: DS.accent, marginLeft: 4 }}>{tipo.n}</div>}
    </div>
    {st && <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "8px 16px", overflowX: "auto", WebkitOverflowScrolling: "touch", borderBottom: `1px solid ${DS.borderLight}`, flexShrink: 0 }}>
      {FASI.map((f, i) => { const isA = fase===f.k, isP = FASI.findIndex(x => x.k===fase) > i; return <button key={f.k} onClick={() => setFase(f.k)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 100, border: "none", cursor: "pointer", background: isA ? DS.accent : "transparent", color: isA ? "#fff" : isP ? DS.text : DS.text3, fontSize: 12, fontWeight: isA ? 600 : 500, fontFamily: F, whiteSpace: "nowrap", WebkitTapHighlightColor: "transparent", minHeight: 36 }}>
        <span style={{ width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, fontFamily: M, background: isA ? "rgba(255,255,255,0.2)" : isP ? DS.accentSoft : DS.borderLight }}>{isP ? "✓" : f.n}</span>{f.l}
      </button> })}
    </div>}
    <div style={{ flex: 1, overflow: "hidden" }}>
      {fase === "tipo" && <FaseTipo onSel={init} />}
      {fase === "config" && st?.isPens && <FasePensConfig st={st} tipo={tipo} up={up} next={() => setFase("profili")} />}
      {fase === "pianta" && st && !st.isPens && <FasePianta st={st} tipo={tipo} up={up} next={() => setFase("profili")} />}
      {fase === "profili" && st && <FaseProfili st={st} tipo={tipo} up={up} next={() => setFase(st.isPens ? "3d" : "lati")} />}
      {fase === "lati" && st && !st.isPens && <FaseLati st={st} tipo={tipo} up={up} next={() => setFase("3d")} />}
      {fase === "3d" && st && <Fase3D st={st} tipo={tipo} next={() => setFase("disegno")} />}
      {fase === "disegno" && st && <FaseDisegno st={st} tipo={tipo} />}
    </div>
  </div>
}

// ═══ TIPO ═════════════════════════════════════════════════════
function FaseTipo({ onSel }) {
  const [hov, setHov] = useState(null)
  return <div style={{ height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0 16px" }}>
    <div style={{ textAlign: "center", paddingTop: 48, marginBottom: 28 }}><h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.04em" }}>Cosa vuoi progettare?</h1><p style={{ fontSize: 13, color: DS.text3, marginTop: 6 }}>Configura profili, copertura e genera il disegno tecnico</p></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, maxWidth: 420, margin: "0 auto", paddingBottom: 32 }}>
      {TIPI.map(t => <button key={t.id} onClick={() => onSel(t.id)} onMouseEnter={() => setHov(t.id)} onMouseLeave={() => setHov(null)}
        style={{ padding: "20px 14px", borderRadius: DS.r2, cursor: "pointer", border: `1.5px solid ${hov===t.id ? DS.accent : DS.border}`, background: DS.surface, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, boxShadow: hov===t.id ? DS.shadowMd : DS.shadow, transition: "all 0.2s", textAlign: "left", minHeight: 110, WebkitTapHighlightColor: "transparent" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: DS.bg2, border: `1px solid ${DS.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic s={20}>{t.icon}</Ic></div>
        <div><div style={{ fontSize: 14, fontWeight: 600 }}>{t.n}</div><div style={{ fontSize: 11, color: DS.text3, marginTop: 3, lineHeight: 1.3 }}>{t.desc}</div></div>
      </button>)}
    </div>
  </div>
}

// ═══ PENSILINA CONFIG (replaces Pianta for pensiline) ════════
function FasePensConfig({ st, tipo, up, next }) {
  const p = st.pens
  const upP = (k, v) => up(prev => ({ ...prev, pens: { ...prev.pens, [k]: v } }))
  const [labelMode, setLabelMode] = useState(false)
  const { addLabel, removeLabel, editLabel, etichette } = useEtichette(st, up)
  const BRACCI = [
    { id: "triangolo", n: "Triangolare", desc: "Staffa a triangolo rettangolo" },
    { id: "curvo", n: "Curvo / Arco", desc: "Staffa curva decorativa" },
    { id: "mensola", n: "A mensola", desc: "Braccio dritto a sbalzo" },
    { id: "tirante", n: "Con tirante", desc: "Puntone + tirante superiore" },
  ]

  // SVG preview pensilina laterale
  const svgW = 400, svgH = 340
  const wallH = 280, wallX = 300
  const hFix = (p.altFissaggio / 3000) * wallH
  const sporto = (p.sporto / 2000) * 200
  const dropH = sporto * Math.tan(p.pendenza * Math.PI / 180)
  const topY = svgH - 30 - hFix
  const frontY = topY + dropH
  const frontX = wallX - sporto

  return <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
    {/* SVG Preview on top - compact */}
    <div style={{ background: DS.bg2, borderBottom: `1px solid ${DS.border}`, padding: "8px 0", flexShrink: 0, position: "relative" }}>
      <svg width="100%" height={180} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {/* Muro */}
        <rect x={wallX} y={svgH - 30 - wallH} width={60} height={wallH} fill="#E5E5E5" stroke={DS.text3} strokeWidth={1.5} />
        <text x={wallX + 30} y={svgH - 30 - wallH - 8} textAnchor="middle" fontSize={10} fill={DS.text3} fontWeight={600}>MURO</text>
        <line x1={wallX} y1={topY} x2={wallX + 6} y2={topY} stroke={st.colStruct} strokeWidth={6} />
        <line x1={wallX} y1={topY} x2={frontX} y2={frontY} stroke={st.colStruct} strokeWidth={3} />
        {Array.from({ length: Math.min(3, p.nBracci) }).map((_, i) => {
          const t = (i + 0.5) / Math.min(3, p.nBracci)
          const bx = wallX - sporto * t
          const by = topY + dropH * t
          const baseY = by + sporto * 0.6 * t
          if (p.tipoBraccio === "triangolo") return <g key={i}>
            <line x1={wallX} y1={by} x2={bx} y2={by} stroke={st.colStruct} strokeWidth={2} />
            <line x1={wallX} y1={Math.min(baseY, svgH - 32)} x2={bx} y2={by} stroke={st.colStruct} strokeWidth={2} />
            <line x1={wallX} y1={by} x2={wallX} y2={Math.min(baseY, svgH - 32)} stroke={st.colStruct} strokeWidth={2} />
          </g>
          if (p.tipoBraccio === "curvo") return <g key={i}>
            <path d={`M ${wallX} ${Math.min(baseY, svgH - 32)} Q ${bx + (wallX - bx) * 0.3} ${by + (baseY - by) * 0.2} ${bx} ${by}`} fill="none" stroke={st.colStruct} strokeWidth={2} />
          </g>
          if (p.tipoBraccio === "mensola") return <g key={i}>
            <line x1={wallX} y1={by} x2={bx} y2={by} stroke={st.colStruct} strokeWidth={2.5} />
          </g>
          return <g key={i}>
            <line x1={wallX} y1={by + sporto * 0.4 * t} x2={bx} y2={by} stroke={st.colStruct} strokeWidth={2} />
            <line x1={wallX} y1={by - sporto * 0.2 * t} x2={bx} y2={by} stroke={st.colStruct} strokeWidth={1} strokeDasharray="4,3" />
          </g>
        })}
        {p.grondaFrontale && <rect x={frontX - 4} y={frontY - 2} width={8} height={12} fill="#888" rx={1} />}
        {p.montantiFrontali && <line x1={frontX} y1={frontY} x2={frontX} y2={svgH - 30} stroke={st.colStruct} strokeWidth={3} />}
        <line x1={40} y1={svgH - 30} x2={wallX + 60} y2={svgH - 30} stroke={DS.text3} strokeWidth={1.5} />
        <line x1={frontX} y1={svgH - 18} x2={wallX} y2={svgH - 18} stroke={DS.blue} strokeWidth={1} />
        <text x={(frontX + wallX) / 2} y={svgH - 6} textAnchor="middle" fontSize={10} fontFamily={M} fontWeight={600} fill={DS.blue}>{p.sporto} mm</text>
        <line x1={wallX + 68} y1={topY} x2={wallX + 68} y2={svgH - 30} stroke={DS.blue} strokeWidth={1} />
        <text x={wallX + 80} y={(topY + svgH - 30) / 2} fontSize={10} fontFamily={M} fontWeight={600} fill={DS.blue} transform={`rotate(-90, ${wallX + 80}, ${(topY + svgH - 30) / 2})`} textAnchor="middle">{p.altFissaggio}</text>
        <text x={frontX + 10} y={frontY - 10} fontSize={9} fill={DS.orange} fontWeight={600}>{p.pendenza}%</text>
        <EtichetteLayer etichette={etichette} fase="config" onAdd={addLabel} onRemove={removeLabel} onEdit={editLabel} addMode={labelMode} />
      </svg>
    </div>

    {/* Controls — scrollable */}
    <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: DS.bg2, border: `1px solid ${DS.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic s={16}>{tipo.icon}</Ic></div>
        <div><div style={{ fontSize: 14, fontWeight: 600 }}>Pensilina</div><div style={{ fontSize: 11, color: DS.text3 }}>Fissata a parete, a sbalzo</div></div>
      </div>

      <div>
        <Label>Dimensioni</Label>
        {[{ k: "larghezza", l: "Larghezza (lungo muro)" }, { k: "sporto", l: "Sporto (profondità)" }, { k: "altFissaggio", l: "Altezza fissaggio a muro" }].map(d => <div key={d.k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: DS.text3, width: 100, fontWeight: 500 }}>{d.l}</span>
          <input type="number" value={p[d.k]} step={50} onChange={e => upP(d.k, parseInt(e.target.value) || 0)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${DS.border}`, fontSize: 15, fontFamily: M, textAlign: "right", background: DS.bg, outline: "none" }} />
          <span style={{ fontSize: 10, color: DS.text3, fontFamily: M }}>mm</span>
        </div>)}
      </div>

      <div>
        <Label>Pendenza</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="range" min={3} max={30} value={p.pendenza} onChange={e => upP("pendenza", parseInt(e.target.value))} style={{ flex: 1, height: 32 }} />
          <span style={{ fontSize: 15, fontFamily: M, fontWeight: 600, minWidth: 36 }}>{p.pendenza}%</span>
        </div>
      </div>

      <div>
        <Label>Tipo staffe / bracci ({p.nBracci})</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {BRACCI.map(b => <button key={b.id} onClick={() => upP("tipoBraccio", b.id)} style={{ padding: "12px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", border: p.tipoBraccio === b.id ? `1.5px solid ${DS.accent}` : `1px solid ${DS.border}`, background: p.tipoBraccio === b.id ? DS.accentSoft : DS.bg, color: p.tipoBraccio === b.id ? DS.accent : DS.text2, textAlign: "left", fontFamily: F, WebkitTapHighlightColor: "transparent" }}>
            <div>{b.n}</div><div style={{ fontSize: 9, color: DS.text3, marginTop: 1 }}>{b.desc}</div>
          </button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: DS.text3 }}>N. bracci</span>
          <input type="number" min={2} max={8} value={p.nBracci} onChange={e => upP("nBracci", parseInt(e.target.value) || 2)} style={{ width: 50, padding: "5px 6px", borderRadius: 6, border: `1px solid ${DS.border}`, fontSize: 12, fontFamily: M, textAlign: "center", background: DS.bg, outline: "none" }} />
        </div>
      </div>

      <div>
        <Label>Opzioni</Label>
        {[{ k: "pannelloSx", l: "Pannello laterale SX" }, { k: "pannelloDx", l: "Pannello laterale DX" }, { k: "grondaFrontale", l: "Gronda frontale" }, { k: "montantiFrontali", l: "Montanti frontali (2 piantoni)" }].map(o => <label key={o.k} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 0" }}>
          <input type="checkbox" checked={p[o.k]} onChange={e => upP(o.k, e.target.checked)} style={{ accentColor: DS.accent, width: 20, height: 20 }} />
          <span style={{ fontSize: 13 }}>{o.l}</span>
        </label>)}
      </div>

      <div>
        <Label>Copertura</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {COPERTURE.filter(c => c.id !== "none").map(c => <button key={c.id} onClick={() => up(prev => ({ ...prev, roofType: c.id }))} style={{ padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: st.roofType === c.id ? `1.5px solid ${DS.accent}` : `1px solid ${DS.border}`, background: st.roofType === c.id ? DS.accentSoft : DS.bg, color: st.roofType === c.id ? DS.accent : DS.text2, textAlign: "left", WebkitTapHighlightColor: "transparent" }}>{c.n}</button>)}
        </div>
      </div>

      <div>
        <Label>Colore</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
          {COLORI.map(c => <button key={c.h} onClick={() => up(prev => ({ ...prev, colStruct: c.h }))} title={c.n} style={{ width: "100%", aspectRatio: "1", borderRadius: 7, background: c.h, cursor: "pointer", border: st.colStruct === c.h ? `2px solid ${DS.accent}` : `1px solid ${DS.border}`, boxShadow: st.colStruct === c.h ? `0 0 0 2px #fff, 0 0 0 3.5px ${DS.accent}` : "none" }} />)}
        </div>
      </div>

      <div style={{ flex: 1 }} />
    </div>

    {/* Sticky bottom button */}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: DS.bg, borderTop: `1px solid ${DS.border}`, zIndex: 10 }}>
      <Btn primary onClick={next} style={{ width: "100%", padding: "14px 20px", fontSize: 15, fontWeight: 600 }}>Avanti — Profili →</Btn>
    </div>
  </div>
}

// ═══ PIANTA (solo strutture NON pensilina) ════════════════════
function FasePianta({ st, tipo, up, next }) {
  const svgRef = useRef(null); const [dragIdx, setDragIdx] = useState(null); const [hovIdx, setHovIdx] = useState(null); const [editDim, setEditDim] = useState(null)
  const [labelMode, setLabelMode] = useState(false)
  const { addLabel, removeLabel, editLabel, etichette } = useEtichette(st, up)
  const pts = st.pianta, sc = 0.12, pad = 80
  const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x)), minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y))
  const svgW = (maxX - minX) * sc + pad * 2, svgH = (maxY - minY) * sc + pad * 2
  const toS = p => ({ x: (p.x - minX) * sc + pad, y: (p.y - minY) * sc + pad })

  const onMv = useCallback(e => { if (dragIdx === null) return; const svg = svgRef.current; if (!svg) return; const r = svg.getBoundingClientRect(); const vb = svg.viewBox.baseVal; const scaleX = vb.width / r.width; const scaleY = vb.height / r.height; const svgX = (e.clientX - r.left) * scaleX; const svgY = (e.clientY - r.top) * scaleY; const snap = { x: Math.round(((svgX - pad) / sc + minX) / 50) * 50, y: Math.round(((svgY - pad) / sc + minY) / 50) * 50 }; up(p => { const np = [...p.pianta]; np[dragIdx] = snap; const xs = np.map(p => p.x), ys = np.map(p => p.y); return { ...p, pianta: np, W: Math.max(...xs) - Math.min(...xs), D: Math.max(...ys) - Math.min(...ys) } }) }, [dragIdx, sc, minX, minY, pad, up])
  const onUp = useCallback(() => setDragIdx(null), [])
  useEffect(() => { if (dragIdx !== null) { window.addEventListener("mousemove", onMv); window.addEventListener("mouseup", onUp); return () => { window.removeEventListener("mousemove", onMv); window.removeEventListener("mouseup", onUp) } } }, [dragIdx, onMv, onUp])
  const addPt = i => { const p1 = pts[i], p2 = pts[(i + 1) % pts.length]; up(p => { const np = [...p.pianta]; np.splice(i + 1, 0, { x: Math.round((p1.x + p2.x) / 2 / 50) * 50, y: Math.round((p1.y + p2.y) / 2 / 50) * 50 }); return { ...p, pianta: np } }) }
  const rmPt = i => { if (pts.length <= 3) return; up(p => ({ ...p, pianta: p.pianta.filter((_, j) => j !== i) })) }
  const applyDim = (i, v) => { if (!v || isNaN(v)) { setEditDim(null); return }; const p1 = pts[i], p2 = pts[(i + 1) % pts.length]; const dx = p2.x - p1.x, dy = p2.y - p1.y, ol = Math.sqrt(dx * dx + dy * dy); if (!ol) { setEditDim(null); return }; const r = v / ol; up(p => { const np = [...p.pianta]; np[(i + 1) % np.length] = { x: Math.round((p1.x + dx * r) / 50) * 50, y: Math.round((p1.y + dy * r) / 50) * 50 }; return { ...p, pianta: np } }); setEditDim(null) }
  const setShape = sh => { const W = st.W, D = st.D; let np; if (sh === "rect") np = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: D }, { x: 0, y: D }]; else if (sh === "L") np = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: D * 0.6 }, { x: W * 0.5, y: D * 0.6 }, { x: W * 0.5, y: D }, { x: 0, y: D }]; else if (sh === "U") np = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: D }, { x: W * 0.7, y: D }, { x: W * 0.7, y: D * 0.4 }, { x: W * 0.3, y: D * 0.4 }, { x: W * 0.3, y: D }, { x: 0, y: D }]; else np = [{ x: W * 0.1, y: 0 }, { x: W * 0.9, y: 0 }, { x: W, y: D }, { x: 0, y: D }]; up(p => ({ ...p, pianta: np.map(p => ({ x: Math.round(p.x / 50) * 50, y: Math.round(p.y / 50) * 50 })) })) }

  return <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
    {/* SVG Canvas on top */}
    <div style={{ flex: 1, minHeight: 180, maxHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", background: DS.bg2, overflow: "hidden", position: "relative", touchAction: "pan-x pan-y", padding: 8 }}>
      <svg ref={svgRef} viewBox={`0 0 ${Math.max(svgW, 300)} ${Math.max(svgH, 240)}`} style={{ width: "100%", height: "100%", touchAction: "none" }}>
        <defs><pattern id="grid" width={50 * sc} height={50 * sc} patternUnits="userSpaceOnUse"><path d={`M ${50 * sc} 0 L 0 0 0 ${50 * sc}`} fill="none" stroke={DS.borderLight} strokeWidth={0.5} /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <polygon points={pts.map(p => `${toS(p).x},${toS(p).y}`).join(" ")} fill={DS.bg} fillOpacity={0.6} stroke={st.colStruct} strokeWidth={3} />
        {pts.map((p, i) => { const nx = pts[(i + 1) % pts.length]; const v1 = toS(p), v2 = toS(nx); const mx = (v1.x + v2.x) / 2, my = (v1.y + v2.y) / 2; const len = Math.round(Math.sqrt((nx.x - p.x) ** 2 + (nx.y - p.y) ** 2)); const dx = v2.x - v1.x, dy = v2.y - v1.y, ang = Math.atan2(dy, dx) * 180 / Math.PI; const tx = mx - Math.sin(ang * Math.PI / 180) * 16, ty = my + Math.cos(ang * Math.PI / 180) * 16; return <g key={`e${i}`}>
          <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke={DS.accent} strokeWidth={2.5} />
          {editDim?.idx === i
            ? <foreignObject x={tx - 30} y={ty - 12} width={60} height={24}><input autoFocus type="number" defaultValue={len} onBlur={e => applyDim(i, parseInt(e.target.value))} onKeyDown={e => e.key === "Enter" && applyDim(i, parseInt(e.target.value))} style={{ width: "100%", height: "100%", borderRadius: 6, border: `2px solid ${DS.accent}`, textAlign: "center", fontSize: 11, fontFamily: M, fontWeight: 600, outline: "none", padding: 0 }} /></foreignObject>
          : <text x={tx} y={ty + 3} textAnchor="middle" fontSize={10} fontFamily={M} fontWeight={600} fill={DS.text} style={{ cursor: "pointer" }} onClick={() => setEditDim({ idx: i })}>{len}</text>}
          <circle cx={mx} cy={my} r={5} fill={DS.green} opacity={hovIdx === `e${i}` ? .85 : 0} style={{ cursor: "pointer" }} onMouseEnter={() => setHovIdx(`e${i}`)} onMouseLeave={() => setHovIdx(null)} onClick={e => { e.stopPropagation(); addPt(i) }} />
        </g> })}
        {pts.map((p, i) => { const v = toS(p); return <circle key={`v${i}`} cx={v.x} cy={v.y} r={dragIdx === i ? 10 : 7} fill={dragIdx === i ? DS.accent : DS.surface} stroke={DS.accent} strokeWidth={2.5} style={{ cursor: "grab" }} onMouseDown={e => { e.preventDefault(); setDragIdx(i) }} onTouchStart={e => { e.preventDefault(); setDragIdx(i) }} onDoubleClick={() => rmPt(i)} /> })}
        <EtichetteLayer etichette={etichette} fase="pianta" onAdd={addLabel} onRemove={removeLabel} onEdit={editLabel} addMode={labelMode} />
      </svg>
    </div>

    {/* Controls at bottom — scrollable */}
    <div style={{ borderTop: `1px solid ${DS.border}`, padding: "12px 16px 90px", overflowY: "auto", WebkitOverflowScrolling: "touch", maxHeight: "45%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: DS.bg2, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic s={14}>{tipo.icon}</Ic></div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{tipo.n}</div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Label>Dimensioni</Label>
        {[{ k: "W", l: "Largh." }, { k: "D", l: "Prof." }, { k: "H", l: "Alt." }].map(d => <div key={d.k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: DS.text3, width: 42, fontWeight: 500 }}>{d.l}</span>
          <input type="number" value={st[d.k]} step={50} onChange={e => { const v = parseInt(e.target.value) || 0; up(p => { const rw = d.k === "W" ? v / p.W : 1, rd = d.k === "D" ? v / p.D : 1; return { ...p, [d.k]: v, pianta: p.pianta.map(pt => ({ x: Math.round(pt.x * rw / 50) * 50, y: Math.round(pt.y * rd / 50) * 50 })) } }) }} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${DS.border}`, fontSize: 15, fontFamily: M, textAlign: "right", background: DS.bg, outline: "none" }} />
          <span style={{ fontSize: 10, color: DS.text3, fontFamily: M }}>mm</span>
        </div>)}
      </div>
      <div style={{ marginBottom: 12 }}>
        <Label>Forma</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {[{ k: "rect", svg: "M4,4 L28,4 L28,20 L4,20 Z" }, { k: "L", svg: "M4,4 L28,4 L28,14 L16,14 L16,20 L4,20 Z" }, { k: "U", svg: "M4,4 L28,4 L28,20 L22,20 L22,10 L10,10 L10,20 L4,20 Z" }, { k: "trap", svg: "M8,4 L24,4 L28,20 L4,20 Z" }].map(x => <button key={x.k} onClick={() => setShape(x.k)} style={{ padding: "12px 8px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bg, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}><svg width={28} height={18} viewBox="0 0 32 24"><path d={x.svg} fill="none" stroke={DS.text3} strokeWidth={1.5} /></svg></button>)}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Label>Colore</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {COLORI.map(c => <button key={c.h} onClick={() => up(p => ({ ...p, colStruct: c.h }))} style={{ width: "100%", aspectRatio: "1", borderRadius: 8, background: c.h, cursor: "pointer", border: st.colStruct === c.h ? `2.5px solid ${DS.accent}` : `1px solid ${DS.border}`, minHeight: 40 }} />)}
        </div>
      </div>
      {tipo.hasRoof && <div style={{ marginBottom: 12 }}>
        <Label>Copertura</Label>
        {COPERTURE.map(c => <button key={c.id} onClick={() => up(p => ({ ...p, roofType: c.id }))} style={{ display: "block", width: "100%", padding: "10px 12px", marginBottom: 4, borderRadius: 8, fontSize: 12, cursor: "pointer", border: st.roofType === c.id ? `1.5px solid ${DS.accent}` : `1px solid ${DS.border}`, background: st.roofType === c.id ? DS.accentSoft : DS.bg, color: st.roofType === c.id ? DS.accent : DS.text2, textAlign: "left", WebkitTapHighlightColor: "transparent" }}>{c.n}</button>)}
      </div>}
      {tipo.hasRoof && <div style={{ marginBottom: 12 }}>
        <Label>Pendenza tetto</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="range" min={0} max={30} value={st.tetto.pendenza} onChange={e => up(p => ({ ...p, tetto: { ...p.tetto, pendenza: parseInt(e.target.value) } }))} style={{ flex: 1, height: 32 }} /><span style={{ fontSize: 14, fontFamily: M, fontWeight: 600, minWidth: 36 }}>{st.tetto.pendenza}%</span></div>
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>{["fronte", "retro", "sx", "dx"].map(d => <button key={d} onClick={() => up(p => ({ ...p, tetto: { ...p.tetto, direzione: d } }))} style={{ flex: 1, padding: "10px 4px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: st.tetto.direzione === d ? `1.5px solid ${DS.accent}` : `1px solid ${DS.border}`, background: st.tetto.direzione === d ? DS.accentSoft : DS.bg, color: st.tetto.direzione === d ? DS.accent : DS.text3, textTransform: "capitalize", WebkitTapHighlightColor: "transparent" }}>{d}</button>)}</div>
      </div>}
    </div>

    {/* Sticky bottom button */}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: DS.bg, borderTop: `1px solid ${DS.border}`, zIndex: 10 }}>
      <Btn primary onClick={next} style={{ width: "100%", padding: "14px 20px", fontSize: 15, fontWeight: 600 }}>Avanti — Profili →</Btn>
    </div>
  </div>
}

// ═══ PROFILI (works for both pensilina and standard) ══════════
function FaseProfili({ st, tipo, up, next }) {
  const setP = (k, v) => up(p => ({ ...p, profili: { ...p.profili, [k]: v } }))
  const toggleMont = i => up(p => ({ ...p, montantiOff: p.montantiOff.includes(i) ? p.montantiOff.filter(x => x !== i) : [...p.montantiOff, i] }))

  return <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px 16px 100px" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Profili strutturali</h2>
        <p style={{ fontSize: 12, color: DS.text3, marginTop: 4 }}>{st.isPens ? "Assegna profilo a ogni componente della pensilina" : "Assegna profilo e togli montanti/travi se necessario"}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {st.isPens ? <>
        <ProfSelect label="Profilo colmo (a muro)" value={st.profili.colmo} onChange={v => setP("colmo", v)} />
        <ProfSelect label="Bracci / staffe" value={st.profili.bracci} onChange={v => setP("bracci", v)} />
        <ProfSelect label="Traversa frontale" value={st.profili.frontale} onChange={v => setP("frontale", v)} />
        <ProfSelect label="Copertura / lamelle" value={st.profili.lamelle} onChange={v => setP("lamelle", v)} />
      </> : <>
        <ProfSelect label="Montanti verticali" value={st.profili.montanti} onChange={v => setP("montanti", v)} />
        <ProfSelect label="Travi superiori" value={st.profili.travi_sup} onChange={v => setP("travi_sup", v)} />
        <ProfSelect label="Travi inferiori" value={st.profili.travi_inf} onChange={v => setP("travi_inf", v)} />
        {tipo.hasRoof && <ProfSelect label="Copertura" value={st.profili.lamelle} onChange={v => setP("lamelle", v)} />}
        <div style={{ height: 1, background: DS.borderLight }} />
        <div>
          <Label>Toggle montanti</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {st.pianta.map((_, i) => { const off = st.montantiOff.includes(i); return <button key={i} onClick={() => toggleMont(i)} style={{ width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${off ? DS.red : DS.green}`, background: off ? DS.redSoft : DS.greenSoft, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: M, color: off ? DS.red : DS.green, WebkitTapHighlightColor: "transparent" }}>{off ? "✕" : i + 1}</button> })}
          </div>
        </div>
      </>}
      </div>

      {/* Riepilogo inline */}
      <div style={{ marginTop: 20, background: DS.bg2, borderRadius: DS.r2, border: `1px solid ${DS.border}`, padding: 16 }}>
        <Label>Riepilogo</Label>
        {st.isPens ? <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <div>Larghezza: <strong style={{ fontFamily: M }}>{st.pens.larghezza} mm</strong></div>
          <div>Sporto: <strong style={{ fontFamily: M }}>{st.pens.sporto} mm</strong></div>
          <div>Altezza fissaggio: <strong style={{ fontFamily: M }}>{st.pens.altFissaggio} mm</strong></div>
          <div>Pendenza: <strong style={{ fontFamily: M }}>{st.pens.pendenza}%</strong></div>
          <div>Bracci: <strong>{st.pens.nBracci}× {st.pens.tipoBraccio}</strong></div>
          <div>Copertura: <strong>{COPERTURE.find(c => c.id === st.roofType)?.n}</strong></div>
          <div style={{ height: 1, background: DS.borderLight, margin: "4px 0" }} />
          <div>Colmo: <strong>{PROFILI.find(p => p.id === st.profili.colmo)?.nome}</strong></div>
          <div>Bracci: <strong>{PROFILI.find(p => p.id === st.profili.bracci)?.nome}</strong></div>
          <div>Frontale: <strong>{PROFILI.find(p => p.id === st.profili.frontale)?.nome}</strong></div>
        </div> : <div style={{ fontSize: 12, color: DS.text2 }}>
          <div>Montanti attivi: {st.pianta.length - st.montantiOff.length}/{st.pianta.length}</div>
          <div>Perimetro: {Math.round(st.pianta.reduce((s, p, i) => { const nx = st.pianta[(i + 1) % st.pianta.length]; return s + Math.sqrt((nx.x - p.x) ** 2 + (nx.y - p.y) ** 2) }, 0))} mm</div>
        </div>}
      </div>
    </div>

    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: DS.bg, borderTop: `1px solid ${DS.border}`, zIndex: 10 }}>
      <Btn primary onClick={next} style={{ width: "100%", padding: "14px 20px", fontSize: 15, fontWeight: 600 }}>{st.isPens ? "Avanti — 3D →" : "Avanti — Lati →"}</Btn>
    </div>
  </div>
}

// ═══ LATI (solo strutture NON pensilina) ═════════════════════
function FaseLati({ st, tipo, up, next }) {
  const [sel, setSel] = useState(0); const [addM, setAddM] = useState(null)
  const [labelMode, setLabelMode] = useState(false)
  const { addLabel, removeLabel, editLabel, etichette } = useEtichette(st, up)
  const lato = st.lati[sel]; if (!lato) return null
  const sx = 0.15, sW = lato.lunghezza * sx, sH = lato.altezza * sx, px = 60, py = 50
  const addEl = (t, x) => up(p => { const nl = [...p.lati], l = { ...nl[sel] }; l.elementi = [...l.elementi, { id: uid(), tipo: t, x: x || 200, y: t === "finestra" ? Math.round(lato.altezza * 0.3) : 0, w: Math.round(lato.lunghezza * 0.25), h: t === "finestra" ? Math.round(lato.altezza * 0.4) : lato.altezza }]; nl[sel] = l; return { ...p, lati: nl } })
  const rmEl = id => up(p => { const nl = [...p.lati], l = { ...nl[sel] }; l.elementi = l.elementi.filter(e => e.id !== id); nl[sel] = l; return { ...p, lati: nl } })
  const upEl = (id, ch) => up(p => { const nl = [...p.lati], l = { ...nl[sel] }; l.elementi = l.elementi.map(e => e.id === id ? { ...e, ...ch } : e); nl[sel] = l; return { ...p, lati: nl } })

  return <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
    {/* Horizontal tab bar for lati */}
    <div style={{ display: "flex", gap: 4, padding: "8px 12px", overflowX: "auto", WebkitOverflowScrolling: "touch", borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
      {st.lati.map((l, i) => <button key={l.id} onClick={() => setSel(i)} style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", border: sel === i ? `1.5px solid ${DS.accent}` : `1px solid ${DS.border}`, background: sel === i ? DS.accentSoft : DS.bg, whiteSpace: "nowrap", fontSize: 12, fontWeight: sel === i ? 600 : 400, fontFamily: F, WebkitTapHighlightColor: "transparent" }}>{l.nome} <span style={{ fontSize: 10, color: DS.text3, fontFamily: M }}>{l.elementi.length}</span></button>)}
    </div>

    {/* Element toolbar — horizontal scroll */}
    <div style={{ padding: "6px 12px", borderBottom: `1px solid ${DS.border}`, display: "flex", gap: 4, alignItems: "center", overflowX: "auto", WebkitOverflowScrolling: "touch", flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: DS.text3, marginRight: 4, whiteSpace: "nowrap" }}>INSERISCI</span>
      {ELEMENTI.map(el => <Btn key={el.id} small active={addM === el.id} onClick={() => { setAddM(addM === el.id ? null : el.id); setLabelMode(false) }} style={{ fontSize: 10, padding: "6px 10px", whiteSpace: "nowrap" }}>{el.n}</Btn>)}
    </div>

    {/* SVG canvas */}
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: DS.bg2, overflow: "auto", touchAction: "pan-x pan-y" }}>
      <svg width={Math.max(sW + px * 2, 320)} height={Math.max(sH + py * 2, 240)} onClick={e => { if (labelMode || !addM) return; const r = e.currentTarget.getBoundingClientRect(); addEl(addM, Math.round((e.clientX - r.left - px) / sx / 50) * 50); setAddM(null) }} style={{ cursor: addM ? "crosshair" : "default" }}>
        <rect x={px} y={py} width={sW} height={sH} fill="none" stroke={st.colStruct} strokeWidth={4} />
        {lato.elementi.map(el => { const ed = ELEMENTI.find(e => e.id === el.tipo); const ex = px + el.x * sx, ey = py + el.y * sx, ew = el.w * sx, eh = el.h * sx; return <g key={el.id}>
          <rect x={ex} y={ey} width={ew} height={eh} fill={ed?.color || "#ccc"} fillOpacity={ed?.op || 0.5} stroke={st.colStruct} strokeWidth={1.5} />
          <text x={ex + ew / 2} y={ey - 5} textAnchor="middle" fontSize={8} fill={DS.text3}>{ed?.n}</text>
          <circle cx={ex + ew - 1} cy={ey + 1} r={7} fill={DS.red} opacity={0.85} style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); rmEl(el.id) }} />
          <text x={ex + ew - 1} y={ey + 4} textAnchor="middle" fontSize={8} fill="#fff" fontWeight={600} style={{ pointerEvents: "none" }}>×</text>
        </g> })}
        <text x={px + sW / 2} y={py - 22} textAnchor="middle" fontSize={10} fontFamily={M} fontWeight={600}>{lato.lunghezza}</text>
        <text x={px + sW / 2} y={18} textAnchor="middle" fontSize={13} fontWeight={600}>{lato.nome}</text>
        <EtichetteLayer etichette={etichette} fase={`lato_${sel}`} onAdd={addLabel} onRemove={removeLabel} onEdit={editLabel} addMode={labelMode} />
      </svg>
    </div>

    {/* Element list if any */}
    {lato.elementi.length > 0 && <div style={{ padding: "6px 12px", borderTop: `1px solid ${DS.border}`, display: "flex", gap: 4, overflowX: "auto", flexShrink: 0 }}>
      {lato.elementi.map(el => <div key={el.id} style={{ display: "flex", gap: 3, alignItems: "center", padding: "6px 8px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bg, fontSize: 10, whiteSpace: "nowrap" }}>
        <span style={{ fontWeight: 500 }}>{ELEMENTI.find(e => e.id === el.tipo)?.n}</span>
        {["x", "y", "w", "h"].map(k => <input key={k} type="number" value={el[k]} step={50} onChange={e => upEl(el.id, { [k]: parseInt(e.target.value) || 0 })} style={{ width: 44, padding: "4px", borderRadius: 6, border: `1px solid ${DS.border}`, fontSize: 11, fontFamily: M, textAlign: "right", background: DS.bg, outline: "none" }} />)}
        <button onClick={() => rmEl(el.id)} style={{ padding: "3px 6px", borderRadius: 6, border: "none", background: DS.redSoft, color: DS.red, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>✕</button>
      </div>)}
    </div>}

    {/* Sticky bottom */}
    <div style={{ padding: "10px 16px", background: DS.bg, borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
      <Btn primary onClick={next} style={{ width: "100%", padding: "14px 20px", fontSize: 15, fontWeight: 600 }}>Avanti — 3D →</Btn>
    </div>
  </div>
}

// ═══ 3D (handles both pensilina and standard) ═════════════════
function Fase3D({ st, tipo, next }) {
  const ref = useRef(null); const [rot, setRot] = useState(true); const [wf, setWf] = useState(false)

  useEffect(() => {
    const c = ref.current; if (!c) return; while (c.firstChild) c.removeChild(c.firstChild)
    const w = c.clientWidth, h = c.clientHeight
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#F9F9F9"); scene.fog = new THREE.Fog("#F9F9F9", 15, 35)
    const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setSize(w, h); ren.setPixelRatio(Math.min(devicePixelRatio, 2)); ren.shadowMap.enabled = true; c.appendChild(ren.domElement)
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const sun = new THREE.DirectionalLight(0xffffff, 0.6); sun.position.set(5, 8, 5); sun.castShadow = true; scene.add(sun)
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshLambertMaterial({ color: 0xF0F0F0 })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; scene.add(gnd)
    const grid = new THREE.GridHelper(10, 20, 0xE5E5E5, 0xF0F0F0); grid.position.set(0, 0.001, 0); scene.add(grid)

    const sc3 = new THREE.Color(st.colStruct)
    const sm = new THREE.MeshPhongMaterial({ color: sc3, wireframe: wf })
    const s3 = 1 / 1000

    if (st.isPens) {
      // ─── PENSILINA 3D ───────────────────────────────────
      const p = st.pens
      const larg = p.larghezza * s3, sporto = p.sporto * s3, altF = p.altFissaggio * s3
      const drop = sporto * (p.pendenza / 100)
      const profColmo = PROFILI.find(x => x.id === st.profili.colmo)
      const profBracci = PROFILI.find(x => x.id === st.profili.bracci)
      const bS = (profBracci?.lato || profBracci?.diam || 60) * s3
      const cH = (profColmo?.h || profColmo?.lato || 50) * s3

      // Muro
      const wallMat = new THREE.MeshPhongMaterial({ color: 0xD4D4D4, wireframe: wf })
      const wall = new THREE.Mesh(new THREE.BoxGeometry(larg + 0.6, altF + 0.5, 0.2), wallMat)
      wall.position.set(0, (altF + 0.5) / 2, 0.1); wall.receiveShadow = true; scene.add(wall)

      // Colmo a muro
      const colmo = new THREE.Mesh(new THREE.BoxGeometry(larg, cH, cH), sm)
      colmo.position.set(0, altF, 0); colmo.castShadow = true; scene.add(colmo)

      // Traversa frontale
      const front = new THREE.Mesh(new THREE.BoxGeometry(larg, cH * 0.8, cH * 0.8), sm)
      front.position.set(0, altF - drop, -sporto); front.castShadow = true; scene.add(front)

      // Bracci
      for (let i = 0; i < p.nBracci; i++) {
        const t = (i + 0.5) / p.nBracci
        const bx = -larg / 2 + larg * t
        const braccioLen = Math.sqrt(sporto * sporto + drop * drop)
        const angle = Math.atan2(drop, sporto)

        if (p.tipoBraccio === "triangolo") {
          // Horizontal from wall
          const horiz = new THREE.Mesh(new THREE.BoxGeometry(bS, bS, sporto), sm)
          horiz.position.set(bx, altF - drop / 2, -sporto / 2); scene.add(horiz)
          // Diagonal brace
          const diagLen = Math.sqrt(sporto * sporto + (sporto * 0.6) ** 2)
          const diagAngle = Math.atan2(sporto * 0.6, sporto)
          const diag = new THREE.Mesh(new THREE.BoxGeometry(bS * 0.7, bS * 0.7, diagLen), sm)
          diag.position.set(bx, altF - drop - sporto * 0.3, -sporto / 2)
          diag.rotation.x = diagAngle; scene.add(diag)
          // Vertical at wall
          const vert = new THREE.Mesh(new THREE.BoxGeometry(bS, sporto * 0.6, bS), sm)
          vert.position.set(bx, altF - drop - sporto * 0.3, 0); scene.add(vert)
        } else if (p.tipoBraccio === "mensola") {
          const arm = new THREE.Mesh(new THREE.BoxGeometry(bS, bS * 1.2, braccioLen), sm)
          arm.position.set(bx, altF - drop / 2, -sporto / 2)
          arm.rotation.x = angle; scene.add(arm)
        } else if (p.tipoBraccio === "curvo") {
          const segs = 8
          for (let j = 0; j < segs; j++) {
            const t1 = j / segs, t2 = (j + 1) / segs
            const a1 = Math.PI / 2 * t1, a2 = Math.PI / 2 * t2
            const z1 = -sporto * Math.sin(a1), y1 = altF - drop - sporto * 0.6 * (1 - Math.cos(a1))
            const z2 = -sporto * Math.sin(a2), y2 = altF - drop - sporto * 0.6 * (1 - Math.cos(a2))
            const sl = Math.sqrt((z2 - z1) ** 2 + (y2 - y1) ** 2)
            const sa = Math.atan2(y2 - y1, z2 - z1)
            const seg = new THREE.Mesh(new THREE.BoxGeometry(bS * 0.8, bS * 0.8, sl), sm)
            seg.position.set(bx, (y1 + y2) / 2, (z1 + z2) / 2)
            seg.rotation.x = -sa; scene.add(seg)
          }
        } else {
          // tirante
          const arm = new THREE.Mesh(new THREE.BoxGeometry(bS, bS, braccioLen), sm)
          arm.position.set(bx, altF - drop / 2, -sporto / 2)
          arm.rotation.x = angle; scene.add(arm)
          const tire = new THREE.Mesh(new THREE.BoxGeometry(bS * 0.5, bS * 0.5, braccioLen * 0.9), sm)
          tire.position.set(bx, altF + drop * 0.2, -sporto / 2 * 0.9)
          tire.rotation.x = -angle * 0.5; scene.add(tire)
        }
      }

      // Copertura
      const roofLen = Math.sqrt(sporto * sporto + drop * drop)
      const roofAngle = Math.atan2(drop, sporto)
      const roofColor = { lamiera_coib: 0x808080, tegolamiera: 0x8B4513, pannello: sc3, policarbonato: 0xDDDDDD }[st.roofType] || 0xBFDBFE
      const roofOp = (st.roofType === "vetro" || st.roofType === "policarbonato") ? 0.25 : 0.9
      const roofMat = new THREE.MeshPhongMaterial({ color: roofColor, transparent: roofOp < 1, opacity: roofOp, wireframe: wf, side: THREE.DoubleSide })
      const roof = new THREE.Mesh(new THREE.BoxGeometry(larg + 0.05, 0.015, roofLen + 0.03), roofMat)
      roof.position.set(0, altF - drop / 2, -sporto / 2)
      roof.rotation.x = roofAngle; roof.castShadow = true; scene.add(roof)

      // Gronda frontale
      if (p.grondaFrontale) {
        const gMat = new THREE.MeshPhongMaterial({ color: 0x888888, wireframe: wf })
        const gronda = new THREE.Mesh(new THREE.BoxGeometry(larg + 0.1, 0.04, 0.06), gMat)
        gronda.position.set(0, altF - drop - 0.02, -sporto); scene.add(gronda)
      }

      // Montanti frontali opzionali
      if (p.montantiFrontali) {
        const pH = altF - drop
        const pg = new THREE.BoxGeometry(bS, pH, bS)
        ;[-larg / 2 + bS, larg / 2 - bS].forEach(bx => {
          const m = new THREE.Mesh(pg, sm); m.position.set(bx, pH / 2, -sporto); m.castShadow = true; scene.add(m)
        })
      }

      // Pannelli laterali
      if (p.pannelloSx || p.pannelloDx) {
        const panMat = new THREE.MeshPhysicalMaterial({ color: 0xBFDBFE, transparent: true, opacity: 0.25, wireframe: wf })
        if (p.pannelloSx) { const pan = new THREE.Mesh(new THREE.BoxGeometry(0.008, altF, sporto), panMat); pan.position.set(-larg / 2, altF / 2, -sporto / 2); scene.add(pan) }
        if (p.pannelloDx) { const pan = new THREE.Mesh(new THREE.BoxGeometry(0.008, altF, sporto), panMat); pan.position.set(larg / 2, altF / 2, -sporto / 2); scene.add(pan) }
      }

      cam.position.set(larg * 1.5, altF * 0.8, -sporto * 2)
      cam.lookAt(0, altF * 0.7, -sporto / 2)
    } else {
      // ─── STANDARD 3D (pergola, veranda, ferro, etc) ──────
      const pts = st.pianta, H = st.H * s3
      const pM = PROFILI.find(p => p.id === st.profili.montanti)
      const pT = PROFILI.find(p => p.id === st.profili.travi_sup)
      const postS = (pM?.lato || pM?.diam || 60) * s3
      const beamH = (pT?.h || pT?.lato || 50) * s3
      const beamW = (pT?.w || pT?.b || pT?.lato || 50) * s3

      const getH = i => {
        if (!tipo.hasRoof || st.tetto.pendenza === 0) return H
        const p = pts[i], xs = pts.map(pp => pp.x), ys = pts.map(pp => pp.y)
        const minXp = Math.min(...xs), maxXp = Math.max(...xs), minYp = Math.min(...ys), maxYp = Math.max(...ys)
        let t = 0; const dir = st.tetto.direzione
        if (dir === "fronte") t = (p.y - minYp) / (maxYp - minYp || 1)
        else if (dir === "retro") t = 1 - (p.y - minYp) / (maxYp - minYp || 1)
        else if (dir === "sx") t = (p.x - minXp) / (maxXp - minXp || 1)
        else t = 1 - (p.x - minXp) / (maxXp - minXp || 1)
        const drop = (st.tetto.pendenza / 100) * Math.max(st.W, st.D) * s3
        return H + drop * (1 - t) - drop * 0.5
      }

      pts.forEach((p, i) => { if (st.montantiOff.includes(i)) return; const pH = getH(i); const m = new THREE.Mesh(new THREE.BoxGeometry(postS, pH, postS), sm); m.position.set(p.x * s3, pH / 2, p.y * s3); m.castShadow = true; scene.add(m) })

      pts.forEach((p, i) => {
        if (st.traviSupOff?.includes(i)) return
        const nx = pts[(i + 1) % pts.length], dx = (nx.x - p.x) * s3, dz = (nx.y - p.y) * s3, len = Math.sqrt(dx * dx + dz * dz), a = Math.atan2(dz, dx)
        const h1 = getH(i), h2 = getH((i + 1) % pts.length), avgH = (h1 + h2) / 2
        const bt = new THREE.Mesh(new THREE.BoxGeometry(len, beamH, beamW), sm)
        bt.position.set((p.x + nx.x) / 2 * s3, avgH - beamH / 2, (p.y + nx.y) / 2 * s3)
        bt.rotation.y = -a; bt.rotation.z = Math.atan2(h2 - h1, len); bt.castShadow = true; scene.add(bt)
      })

      st.lati.forEach(lato => {
        const p = lato.fromPt, nx = lato.toPt, dx = (nx.x - p.x) * s3, dz = (nx.y - p.y) * s3, wl = Math.sqrt(dx * dx + dz * dz), a = Math.atan2(dz, dx)
        lato.elementi.forEach(el => {
          const ed = ELEMENTI.find(e => e.id === el.tipo); if (!ed) return
          const ew = el.w * s3, eh = el.h * s3, exx = el.x * s3 + ew / 2, ey = el.y * s3 + eh / 2, t = exx / wl
          const wx = p.x * s3 + dx * t, wz = p.y * s3 + dz * t
          const mat = el.tipo.includes("vetro") || el.tipo === "finestra" ? new THREE.MeshPhysicalMaterial({ color: 0xBFDBFE, transparent: true, opacity: 0.3, wireframe: wf }) : new THREE.MeshPhongMaterial({ color: new THREE.Color(ed.color), transparent: ed.op < 1, opacity: ed.op, wireframe: wf })
          const pn = new THREE.Mesh(new THREE.BoxGeometry(ew, eh, 0.012), mat); pn.position.set(wx, ey, wz); pn.rotation.y = -a; pn.castShadow = true; scene.add(pn)
        })
      })

      if (tipo.hasRoof && st.roofType !== "none") {
        const xs = pts.map(p => p.x * s3), zs = pts.map(p => p.y * s3), sp = (st.tetto?.sporto || 0) * s3
        const rx1 = Math.min(...xs) - sp, rx2 = Math.max(...xs) + sp, rz1 = Math.min(...zs) - sp, rz2 = Math.max(...zs) + sp
        const avgRH = pts.reduce((s, _, i) => s + getH(i), 0) / pts.length
        const roofColor = { lamiera_coib: 0x808080, tegolamiera: 0x8B4513 }[st.roofType] || 0xBFDBFE
        const roofOp = (st.roofType === "vetro" || st.roofType === "policarbonato") ? 0.25 : 1
        if (st.roofType === "lamelle") {
          const rW = rx2 - rx1, rD = rz2 - rz1, nB = Math.max(3, Math.floor(rD / 0.2))
          for (let i = 0; i <= nB; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(rW, 0.018, 0.15), new THREE.MeshPhongMaterial({ color: sc3, wireframe: wf })); b.position.set((rx1 + rx2) / 2, avgRH + 0.01, rz1 + i * (rD / nB)); b.castShadow = true; scene.add(b) }
        } else {
          const roof = new THREE.Mesh(new THREE.BoxGeometry(rx2 - rx1, 0.015, rz2 - rz1), new THREE.MeshPhongMaterial({ color: roofColor, transparent: roofOp < 1, opacity: roofOp, wireframe: wf, side: THREE.DoubleSide }))
          roof.position.set((rx1 + rx2) / 2, avgRH, (rz1 + rz2) / 2); roof.castShadow = true; scene.add(roof)
        }
      }

      const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length * s3, cz = pts.reduce((a, p) => a + p.y, 0) / pts.length * s3
      scene.children.forEach(o => { if (o !== gnd && !(o instanceof THREE.Light) && !(o instanceof THREE.GridHelper)) { o.position.x -= cx; o.position.z -= cz } })
      const md = Math.max(st.W, st.D, st.H) / 1000
      cam.position.set(md * 1.8, md * 1.2, md * 1.8); cam.lookAt(0, H / 2, 0)
    }

    let th = Math.PI / 4, ph = Math.PI / 4
    let dist = st.isPens ? Math.max(st.pens.larghezza, st.pens.sporto) / 1000 * 3 : Math.max(st.W, st.D, st.H) / 1000 * 2.5
    let isDr = false, lx = 0, ly = 0
    const oD = e => { isDr = true; lx = e.clientX; ly = e.clientY }; const oU = () => isDr = false
    const oM = e => { if (!isDr) return; th -= (e.clientX - lx) * 0.005; ph = Math.max(0.1, Math.min(1.5, ph - (e.clientY - ly) * 0.005)); lx = e.clientX; ly = e.clientY }
    const oW = e => dist = Math.max(0.5, Math.min(15, dist + e.deltaY * 0.003))
    // Touch support
    const oTD = e => { if (e.touches.length === 1) { isDr = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY } }
    const oTM = e => { if (!isDr || e.touches.length !== 1) return; e.preventDefault(); th -= (e.touches[0].clientX - lx) * 0.005; ph = Math.max(0.1, Math.min(1.5, ph - (e.touches[0].clientY - ly) * 0.005)); lx = e.touches[0].clientX; ly = e.touches[0].clientY }
    const oTU = () => isDr = false
    ren.domElement.addEventListener("mousedown", oD); ren.domElement.addEventListener("mouseup", oU); ren.domElement.addEventListener("mousemove", oM); ren.domElement.addEventListener("wheel", oW)
    ren.domElement.addEventListener("touchstart", oTD, { passive: true }); ren.domElement.addEventListener("touchmove", oTM, { passive: false }); ren.domElement.addEventListener("touchend", oTU)

    const lookY = st.isPens ? st.pens.altFissaggio * 0.7 / 1000 : (st.H || 2500) / 2000
    let aid; const an = () => { aid = requestAnimationFrame(an); if (rot && !isDr) th += 0.003; cam.position.set(dist * Math.sin(ph) * Math.cos(th), dist * Math.cos(ph), dist * Math.sin(ph) * Math.sin(th)); cam.lookAt(0, lookY, st.isPens ? -st.pens.sporto / 2000 : 0); ren.render(scene, cam) }; an()
    const oR = () => { cam.aspect = c.clientWidth / c.clientHeight; cam.updateProjectionMatrix(); ren.setSize(c.clientWidth, c.clientHeight) }; window.addEventListener("resize", oR)
    return () => { cancelAnimationFrame(aid); window.removeEventListener("resize", oR); ren.dispose() }
  }, [st, tipo, wf, rot])

  return <div style={{ height: "100%", position: "relative" }}>
    <div ref={ref} style={{ width: "100%", height: "100%", touchAction: "none" }} />
    <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, display: "flex", gap: 8 }}>
      <div style={{ padding: "10px 14px", borderRadius: DS.r2, background: "rgba(255,255,255,0.96)", boxShadow: DS.shadowMd, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{tipo.n}</div>
        <div style={{ fontSize: 10, color: DS.text3, fontFamily: M }}>{st.isPens ? `${st.pens.larghezza}×${st.pens.sporto} · ${st.pens.pendenza}% · ${st.pens.nBracci} bracci` : `${st.W}×${st.D}×${st.H}`}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Btn small onClick={() => setRot(!rot)} style={{ padding: "10px 14px", fontSize: 12 }}>{rot ? "⏸" : "▶"}</Btn>
        <Btn small primary onClick={next} style={{ padding: "10px 14px", fontSize: 12 }}>Disegno →</Btn>
      </div>
    </div>
  </div>
}

// ═══ DISEGNO TECNICO ══════════════════════════════════════════
function FaseDisegno({ st, tipo }) {
  const printRef = useRef(null)
  const allLabels = st.etichette || []
  const handlePrint = () => { const el = printRef.current; if (!el) return; const win = window.open("", "_blank"); win.document.write(`<!DOCTYPE html><html><head><title>DT — ${tipo.n}</title><style>@media print{@page{margin:8mm}body{margin:0;font-family:Arial,sans-serif;color:#171717;font-size:10px}}body{margin:0;font-family:Arial,sans-serif}</style></head><body>${el.innerHTML}</body></html>`); win.document.close(); setTimeout(() => win.print(), 300) }

  return <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <div style={{ padding: "10px 16px", borderBottom: `1px solid ${DS.border}`, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>Disegno Tecnico</span><div style={{ flex: 1 }} />
      <Btn small onClick={handlePrint} style={{ padding: "10px 14px", fontSize: 12 }}><Ic s={14} c={DS.text2}>{ICO.print}</Ic> Stampa/PDF</Btn>
    </div>
    <div style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch", padding: 16, background: DS.bg2 }}>
      <div ref={printRef} style={{ maxWidth: 900, margin: "0 auto", background: "#fff", padding: "20px 16px", borderRadius: DS.r2, boxShadow: DS.shadowLg, border: `1px solid ${DS.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `2px solid ${DS.accent}`, paddingBottom: 12, marginBottom: 20 }}>
          <div><div style={{ fontSize: 18, fontWeight: 700 }}>MASTRO STRUTTURE</div><div style={{ fontSize: 12, color: DS.text2, marginTop: 3 }}>{tipo.n} — Disegno Tecnico</div></div>
          <div style={{ textAlign: "right", fontSize: 10, color: DS.text3, fontFamily: M }}><div>{new Date().toLocaleDateString("it-IT")}</div></div>
        </div>

        {st.isPens ? <>
          {/* PENSILINA DRAWING */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>1. Sezione laterale</div>
            <svg width="100%" viewBox="0 0 500 280" preserveAspectRatio="xMidYMid meet" style={{ display: "block", margin: "0 auto" }}>
              <rect x={350} y={20} width={40} height={230} fill="#E5E5E5" stroke={DS.text3} strokeWidth={1} />
              <text x={370} y={15} textAnchor="middle" fontSize={9} fill={DS.text3}>MURO</text>
              {(() => {
                const sp = st.pens.sporto * 0.18, hF = st.pens.altFissaggio * 0.08
                const topY = 250 - hF, drop = sp * (st.pens.pendenza / 100)
                const frontX = 350 - sp, frontY = topY + drop
                return <>
                  <line x1={350} y1={topY} x2={frontX} y2={frontY} stroke={st.colStruct} strokeWidth={3} />
                  <line x1={350} y1={topY} x2={350} y2={topY + sp * 0.5} stroke={st.colStruct} strokeWidth={2} />
                  <line x1={350} y1={topY + sp * 0.5} x2={frontX} y2={frontY} stroke={st.colStruct} strokeWidth={2} />
                  {st.pens.montantiFrontali && <line x1={frontX} y1={frontY} x2={frontX} y2={250} stroke={st.colStruct} strokeWidth={2} />}
                  <line x1={frontX} y1={260} x2={350} y2={260} stroke={DS.blue} strokeWidth={1} />
                  <text x={(frontX + 350) / 2} y={273} textAnchor="middle" fontSize={9} fontFamily={M} fontWeight={600} fill={DS.blue}>{st.pens.sporto} mm</text>
                  <line x1={360} y1={topY} x2={360} y2={250} stroke={DS.blue} strokeWidth={1} />
                  <text x={375} y={(topY + 250) / 2} fontSize={9} fontFamily={M} fontWeight={600} fill={DS.blue} transform={`rotate(-90,375,${(topY + 250) / 2})`} textAnchor="middle">{st.pens.altFissaggio}</text>
                  <text x={frontX + 20} y={frontY - 8} fontSize={9} fill={DS.orange} fontWeight={600}>{st.pens.pendenza}%</text>
                </>
              })()}
              <line x1={50} y1={250} x2={390} y2={250} stroke={DS.text3} strokeWidth={1.5} />
            </svg>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>2. Vista frontale</div>
            <svg width="100%" viewBox="0 0 500 200" preserveAspectRatio="xMidYMid meet" style={{ display: "block", margin: "0 auto" }}>
              {(() => {
                const w = st.pens.larghezza * 0.1, x0 = (500 - w) / 2
                return <>
                  <rect x={x0} y={40} width={w} height={8} fill={st.colStruct} rx={2} />
                  {Array.from({ length: st.pens.nBracci }).map((_, i) => { const bx = x0 + (i + 0.5) / st.pens.nBracci * w; return <g key={i}><line x1={bx} y1={40} x2={bx} y2={120} stroke={st.colStruct} strokeWidth={1.5} strokeDasharray="4,3" /><text x={bx} y={135} textAnchor="middle" fontSize={8} fill={DS.text3}>B{i + 1}</text></g> })}
                  <line x1={x0} y1={160} x2={x0 + w} y2={160} stroke={DS.blue} strokeWidth={1} />
                  <text x={250} y={175} textAnchor="middle" fontSize={10} fontFamily={M} fontWeight={600} fill={DS.blue}>{st.pens.larghezza} mm</text>
                </>
              })()}
            </svg>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>3. Specifiche</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <tbody>
                {[
                  ["Larghezza", `${st.pens.larghezza} mm`], ["Sporto", `${st.pens.sporto} mm`],
                  ["Altezza fissaggio", `${st.pens.altFissaggio} mm`], ["Pendenza", `${st.pens.pendenza}%`],
                  ["N. bracci", st.pens.nBracci], ["Tipo bracci", st.pens.tipoBraccio],
                  ["Copertura", COPERTURE.find(c => c.id === st.roofType)?.n],
                  ["Montanti frontali", st.pens.montantiFrontali ? "Sì" : "No"],
                  ["Pannello SX", st.pens.pannelloSx ? "Sì" : "No"], ["Pannello DX", st.pens.pannelloDx ? "Sì" : "No"],
                  ["Gronda frontale", st.pens.grondaFrontale ? "Sì" : "No"],
                  ["Profilo colmo", PROFILI.find(p => p.id === st.profili.colmo)?.nome],
                  ["Profilo bracci", PROFILI.find(p => p.id === st.profili.bracci)?.nome],
                  ["Profilo frontale", PROFILI.find(p => p.id === st.profili.frontale)?.nome],
                ].map(([k, v], i) => <tr key={i} style={{ borderBottom: `1px solid ${DS.borderLight}` }}>
                  <td style={{ padding: "6px 4px", fontWeight: 500, width: 180 }}>{k}</td>
                  <td style={{ padding: "6px 4px", fontFamily: M }}>{v}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </> : <>
          {/* STANDARD DRAWING */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>1. Pianta</div>
            <svg width={Math.min(st.W * 0.08 + 80, 700)} height={Math.min(st.D * 0.08 + 60, 350)} style={{ display: "block", margin: "0 auto" }}>
              <polygon points={st.pianta.map(p => `${p.x * 0.08 + 30},${p.y * 0.08 + 20}`).join(" ")} fill="#F9F9F9" stroke={DS.accent} strokeWidth={2} />
              {st.pianta.map((p, i) => { const nx = st.pianta[(i + 1) % st.pianta.length]; const mx = (p.x + nx.x) / 2 * 0.08 + 30, my = (p.y + nx.y) / 2 * 0.08 + 20; const len = Math.round(Math.sqrt((nx.x - p.x) ** 2 + (nx.y - p.y) ** 2)); return <g key={i}><rect x={mx - 18} y={my - 7} width={36} height={14} rx={3} fill="#fff" stroke={DS.border} strokeWidth={0.5} /><text x={mx} y={my + 3} textAnchor="middle" fontSize={8} fontFamily={M} fontWeight={600}>{len}</text></g> })}
            </svg>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>2. Prospetti</div>
            <div style={{ display: "grid", gridTemplateColumns: st.lati.length <= 4 ? "1fr 1fr" : "1fr", gap: 10 }}>
              {st.lati.map((l, i) => { const lsc = Math.min(0.1, 260 / l.lunghezza); return <div key={l.id} style={{ border: `1px solid ${DS.borderLight}`, borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{l.nome} — {l.lunghezza}×{l.altezza}</div>
                <svg width={l.lunghezza * lsc + 40} height={l.altezza * lsc + 30}><rect x={20} y={10} width={l.lunghezza * lsc} height={l.altezza * lsc} fill="none" stroke={DS.accent} strokeWidth={1.5} />
                  {l.elementi.map(el => { const ed = ELEMENTI.find(e => e.id === el.tipo); return <rect key={el.id} x={20 + el.x * lsc} y={10 + el.y * lsc} width={el.w * lsc} height={el.h * lsc} fill={ed?.color || "#ccc"} fillOpacity={ed?.op || 0.5} stroke={DS.text3} strokeWidth={0.5} /> })}
                </svg>
              </div> })}
            </div>
          </div>
        </>}

        {/* Annotazioni / Etichette */}
        {allLabels.length > 0 && <div style={{ marginBottom: 20, padding: 16, background: "#FFFDE7", borderRadius: 8, border: "1px solid #F59E0B" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, color: "#92400E" }}>{st.isPens ? "5" : "5"}. Note e annotazioni</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {allLabels.map((e, i) => <div key={e.id} style={{ fontSize: 11, display: "flex", gap: 8 }}>
              <span style={{ fontWeight: 600, color: "#92400E", minWidth: 20 }}>{i + 1}.</span>
              <span>{e.testo}</span>
              <span style={{ color: DS.text3, fontSize: 9, fontFamily: M }}>({e.fase})</span>
            </div>)}
          </div>
        </div>}

        <div style={{ borderTop: `1px solid ${DS.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 9, color: DS.text3 }}>
          <div>MASTRO STRUTTURE — {new Date().toLocaleString("it-IT")}</div>
          <div>Rif. {tipo.id.toUpperCase()}-{Date.now().toString(36).toUpperCase()}</div>
        </div>
      </div>
    </div>
  </div>
}
