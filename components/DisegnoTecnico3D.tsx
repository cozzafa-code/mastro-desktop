"use client";
// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
const FF = "'Inter', sans-serif";
const FM = "'JetBrains Mono', monospace";
const EL = [
  { id: "telaio", icon: "□", label: "Telaio", color: "#3A3A3C" },
  { id: "montante", icon: "│", label: "Mont.", color: "#3A3A3C" },
  { id: "traverso", icon: "─", label: "Trav.", color: "#3A3A3C" },
  { id: "anta", icon: "▨", label: "Anta", color: "#3B7FE0" },
  { id: "porta", icon: "▮", label: "Porta", color: "#D08008" },
  { id: "scorrevole", icon: "▤", label: "Scorr.", color: "#0D9488" },
  { id: "persiana", icon: "▦", label: "Pers.", color: "#8B5CF6" },
  { id: "vetro", icon: "◇", label: "Vetro", color: "#3B7FE0" },
  { id: "oblo", icon: "○", label: "Oblo", color: "#3B7FE0" },
  { id: "pannello", icon: "▣", label: "Pann.", color: "#8E8E93" },
  { id: "linea", icon: "╱", label: "Linea", color: "#DC4444" },
  { id: "testo", icon: "Aa", label: "Testo", color: "#1A1A1C" },
  { id: "misure", icon: "↔", label: "Misure", color: "#D08008" },
];
const FA = {
  front: { label: "Prospetto", icon: "🪟", s: "F" },
  back: { label: "Esterno", icon: "↩", s: "E" },
  left: { label: "Spall.SX", icon: "◀", s: "SX" },
  right: { label: "Spall.DX", icon: "▶", s: "DX" },
  top: { label: "Architrave", icon: "⬆", s: "A" },
  bottom: { label: "Davanzale", icon: "⬇", s: "D" },
};
const FK = ["front", "back", "left", "right", "top", "bottom"];

function getFields(fk) {
  const n = { k: "note", l: "Note", type: "text" };
  if (fk === "front") return [{ k: "luce_l", l: "Luce L", u: "mm" }, { k: "luce_h", l: "Luce H", u: "mm" }, { k: "fuori_squadra", l: "Fuori squadra", u: "mm" }, { k: "tipo_apertura", l: "Tipo apertura", type: "text" }, n];
  if (fk === "back") return [{ k: "tipo_muro", l: "Tipo muro", type: "text" }, { k: "finitura", l: "Finitura est.", type: "text" }, { k: "spessore_intonaco", l: "Spess. intonaco", u: "mm" }, n];
  if (fk === "top") return [{ k: "arch_h", l: "Altezza", u: "mm" }, { k: "arch_tipo", l: "Tipo", type: "text" }, { k: "cassH", l: "Cassonetto H", u: "mm" }, { k: "cassP", l: "Cassonetto P", u: "mm" }, n];
  if (fk === "bottom") return [{ k: "dav_prof", l: "Profondita", u: "mm" }, { k: "dav_sporg", l: "Sporgenza", u: "mm" }, { k: "dav_mat", l: "Materiale", type: "text" }, n];
  return [{ k: "sp_larg", l: "Larghezza", u: "mm" }, { k: "sp_prof", l: "Profondita", u: "mm" }, { k: "sp_tipo", l: "Tipo muro", type: "text" }, { k: "fuori_piombo", l: "Fuori piombo", u: "mm" }, n];
}

function renderEl(el, sc, ox, oy) {
  const x = ox + el.x * sc, y = oy + el.y * sc, w = el.w * sc, h = el.h * sc;
  const et = EL.find(t => t.id === el.type); const c = et?.color || "#666"; const s = el._sel;
  const sb = s ? <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill="none" stroke="#3B7FE0" strokeWidth={1} strokeDasharray="3,2" /> : null;
  if (el.type === "telaio") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="none" stroke={c} strokeWidth={s ? 2.5 : 1.5} rx={1} />{sb}</g>;
  if (el.type === "montante") return <g key={el.id}><rect x={x} y={y} width={Math.max(w, 3)} height={h} fill={c} opacity={0.7} />{sb}</g>;
  if (el.type === "traverso") return <g key={el.id}><rect x={x} y={y} width={w} height={Math.max(h, 3)} fill={c} opacity={0.7} />{sb}</g>;
  if (el.type === "anta") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill={c + "15"} stroke={c} strokeWidth={1.2} rx={1} /><line x1={x} y1={y} x2={x + w} y2={y + h / 2} stroke={c + "40"} strokeWidth={0.5} /><line x1={x} y1={y + h} x2={x + w} y2={y + h / 2} stroke={c + "40"} strokeWidth={0.5} />{sb}</g>;
  if (el.type === "porta") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill={c + "12"} stroke={c} strokeWidth={1.5} rx={1} /><line x1={x + w * .15} y1={y + h * .35} x2={x + w * .15} y2={y + h * .65} stroke={c} strokeWidth={2} />{sb}</g>;
  if (el.type === "scorrevole") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#D6EEFF50" stroke={c} strokeWidth={1} strokeDasharray="4,2" rx={1} /><text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize={6} fill={c} fontFamily={FM}>SCORR.</text>{sb}</g>;
  if (el.type === "persiana") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill={c + "10"} stroke={c} strokeWidth={1} />{sb}</g>;
  if (el.type === "vetro") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#D6EEFF" stroke={c} strokeWidth={0.8} rx={1} /><line x1={x} y1={y} x2={x + w} y2={y + h} stroke={c + "20"} strokeWidth={0.3} />{sb}</g>;
  if (el.type === "oblo") return <g key={el.id}><ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill="#D6EEFF" stroke={c} strokeWidth={1} />{sb}</g>;
  if (el.type === "pannello") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#E8E4DF" stroke={c} strokeWidth={0.8} />{sb}</g>;
  if (el.type === "linea") return <g key={el.id}><line x1={x} y1={y} x2={x + w} y2={y + h} stroke={c} strokeWidth={1.5} /></g>;
  if (el.type === "testo") return <g key={el.id}><text x={x} y={y + 12} fontSize={10} fill="#1A1A1C" fontFamily={FM} fontWeight={600}>{el.text || "Testo"}</text>{sb}</g>;
  return <rect key={el.id} x={x} y={y} width={w} height={h} fill="#ccc" stroke="#999" strokeWidth={0.5} />;
}

function FaceCanvas({ T, faceKey, realW, realH, elements, onUpdateElements, activeTool }) {
  const svgRef = useRef(null);
  const [ds, setDs] = useState(null); const [dc, setDc] = useState(null); const [selId, setSelId] = useState(null);
  const face = FA[faceKey]; const sc = Math.min(0.16, 280 / Math.max(realW, realH));
  const W = realW * sc, H = realH * sc, pad = 35, svgW = W + pad * 2 + 20, svgH = H + pad * 2 + 20;
  const gpt = (e) => { const r = svgRef.current?.getBoundingClientRect(); return r ? { x: (e.clientX - r.left - pad) / sc, y: (e.clientY - r.top - pad) / sc } : { x: 0, y: 0 }; };
  const hDown = (e) => { if (!activeTool || activeTool === "select") { const pt = gpt(e); const hit = [...(elements || [])].reverse().find((el) => pt.x >= el.x && pt.x <= el.x + el.w && pt.y >= el.y && pt.y <= el.y + el.h); setSelId(hit?.id || null); return; } setDs(gpt(e)); setDc(gpt(e)); };
  const hMove = (e) => { if (ds) setDc(gpt(e)); };
  const hUp = () => { if (!ds || !dc || !activeTool) { setDs(null); setDc(null); return; } const x = Math.min(ds.x, dc.x), y = Math.min(ds.y, dc.y), w = Math.abs(dc.x - ds.x), h = Math.abs(dc.y - ds.y); if (w < 10 && h < 10) { setDs(null); setDc(null); return; } onUpdateElements([...(elements || []), { id: "el_" + Date.now(), type: activeTool, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), face: faceKey }]); setDs(null); setDc(null); };
  const els = (elements || []).map((el) => ({ ...el, _sel: el.id === selId }));
  return (<div>
    <div style={{ display: "flex", alignItems: "center", padding: "6px 10px", gap: 6, background: T.purple + "06", borderBottom: "1px solid " + T.bdr }}>
      <span style={{ fontSize: 12 }}>{face.icon}</span><span style={{ fontSize: 11, fontWeight: 800, color: T.purple, flex: 1 }}>{face.label}</span><span style={{ fontSize: 8, color: T.sub, fontFamily: FM }}>{realW}x{realH}mm</span>
      {elements?.length > 0 && <span style={{ padding: "1px 6px", borderRadius: 4, background: T.grn + "18", fontSize: 8, fontWeight: 800, color: T.grn }}>{elements.length} el.</span>}
      {selId && <span onClick={() => { onUpdateElements((elements || []).filter((el) => el.id !== selId)); setSelId(null); }} style={{ padding: "2px 6px", borderRadius: 4, background: T.red + "15", fontSize: 8, fontWeight: 700, color: T.red, cursor: "pointer" }}>Elimina</span>}
    </div>
    <div style={{ display: "flex", justifyContent: "center", padding: 6, background: "#FAFAF7" }}>
      <svg ref={svgRef} width={svgW} height={svgH} onPointerDown={hDown} onPointerMove={hMove} onPointerUp={hUp} style={{ background: "#fff", borderRadius: 6, border: "1px solid " + T.bdr, cursor: activeTool && activeTool !== "select" ? "crosshair" : "default", touchAction: "none" }}>
        {Array.from({ length: Math.ceil(W / 20) + 1 }).map((_, i) => <line key={"v" + i} x1={pad + i * 20} y1={pad} x2={pad + i * 20} y2={pad + H} stroke="#F0F0F0" strokeWidth={0.5} />)}
        {Array.from({ length: Math.ceil(H / 20) + 1 }).map((_, i) => <line key={"h" + i} x1={pad} y1={pad + i * 20} x2={pad + W} y2={pad + i * 20} stroke="#F0F0F0" strokeWidth={0.5} />)}
        <rect x={pad} y={pad} width={W} height={H} fill="#F8F7F4" stroke="#3A3A3C" strokeWidth={1.5} rx={1} />
        {els.map((el) => renderEl(el, sc, pad, pad))}
        {ds && dc && activeTool && (() => { const x2 = Math.min(ds.x, dc.x) * sc + pad, y2 = Math.min(ds.y, dc.y) * sc + pad, w2 = Math.abs(dc.x - ds.x) * sc, h2 = Math.abs(dc.y - ds.y) * sc; const et = EL.find(t => t.id === activeTool); return <rect x={x2} y={y2} width={w2} height={h2} fill={(et?.color || "#666") + "15"} stroke={et?.color || "#666"} strokeWidth={1} strokeDasharray="4,2" />; })()}
      </svg>
    </div>
  </div>);
}

function Iso3D({ T, realW, realH, profMuro, faceData, activeFace, onSelectFace }) {
  const mx = Math.max(realW, realH, profMuro), bs = 110 / mx, W = realW * bs, H = realH * bs, D = profMuro * bs;
  const c30 = Math.cos(Math.PI / 6), s30 = 0.5;
  const iX = (x, y, z) => (x - z) * c30, iY = (x, y, z) => (x + z) * s30 - y;
  const cx = 170, cy = 165;
  const co = { fbl: { x: 0, y: 0, z: 0 }, fbr: { x: W, y: 0, z: 0 }, ftl: { x: 0, y: H, z: 0 }, ftr: { x: W, y: H, z: 0 }, bbl: { x: 0, y: 0, z: D }, bbr: { x: W, y: 0, z: D }, btl: { x: 0, y: H, z: D }, btr: { x: W, y: H, z: D } };
  const p = (v) => (cx + iX(v.x, v.y, v.z)) + "," + (cy + iY(v.x, v.y, v.z));
  const fp = { front: { pts: p(co.fbl) + " " + p(co.fbr) + " " + p(co.ftr) + " " + p(co.ftl), fill: "#B8D4E8" }, right: { pts: p(co.fbr) + " " + p(co.bbr) + " " + p(co.btr) + " " + p(co.ftr), fill: "#9AB8CC" }, top: { pts: p(co.ftl) + " " + p(co.ftr) + " " + p(co.btr) + " " + p(co.btl), fill: "#D4CFC4" }, left: { pts: p(co.fbl) + " " + p(co.bbl) + " " + p(co.btl) + " " + p(co.ftl), fill: "#C8C4B8" }, bottom: { pts: p(co.fbl) + " " + p(co.fbr) + " " + p(co.bbr) + " " + p(co.bbl), fill: "#E8D8B0" }, back: { pts: p(co.bbl) + " " + p(co.bbr) + " " + p(co.btr) + " " + p(co.btl), fill: "#A8C4D8" } };
  const G = T.grn || "#1A9E73";
  const lps = { front: { x: W / 2, y: H / 2, z: 0 }, right: { x: W, y: H / 2, z: D / 2 }, top: { x: W / 2, y: H, z: D / 2 }, left: { x: 0, y: H / 2, z: D / 2 }, bottom: { x: W / 2, y: 0, z: D / 2 }, back: { x: W / 2, y: H / 2, z: D } };
  return (<svg width={340} height={280} style={{ background: "#fff", borderRadius: 6, border: "1px solid " + T.bdr }}>
    {[0, 1, 2, 3, 4].map(i => <line key={"z" + i} x1={cx + iX(0, 0, (i / 4) * D)} y1={cy + iY(0, 0, (i / 4) * D)} x2={cx + iX(W, 0, (i / 4) * D)} y2={cy + iY(W, 0, (i / 4) * D)} stroke="#E8E8E8" strokeWidth={0.5} />)}
    {[0, 1, 2, 3, 4].map(i => <line key={"x" + i} x1={cx + iX((i / 4) * W, 0, 0)} y1={cy + iY((i / 4) * W, 0, 0)} x2={cx + iX((i / 4) * W, 0, D)} y2={cy + iY((i / 4) * W, 0, D)} stroke="#E8E8E8" strokeWidth={0.5} />)}
    {["back", "bottom", "left", "right", "front", "top"].map(fk => { const f = fp[fk], sel = activeFace === fk, els = faceData[fk]?.elements || [], has = els.length > 0; const lp = lps[fk], lx = cx + iX(lp.x, lp.y, lp.z), ly = cy + iY(lp.x, lp.y, lp.z);
      return (<g key={fk} onClick={() => onSelectFace(fk)} style={{ cursor: "pointer" }}><polygon points={f.pts} fill={sel ? T.purple + "40" : has ? G + "15" : f.fill} stroke={sel ? T.purple : has ? G : "#666"} strokeWidth={sel ? 2.5 : 1} strokeLinejoin="round" /><text x={lx} y={ly - 3} textAnchor="middle" fontSize={sel ? 10 : 7} fontWeight={sel ? 800 : 600} fontFamily={FM} fill={sel ? T.purple : has ? G : "#555"}>{FA[fk].label}</text>{has && <text x={lx} y={ly + 8} textAnchor="middle" fontSize={7} fontFamily={FM} fill={G}>{els.length} el.</text>}</g>); })}
    <text x={(cx + iX(0, 0, 0) + cx + iX(W, 0, 0)) / 2} y={(cy + iY(0, 0, 0) + cy + iY(W, 0, 0)) / 2 + 22} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={FM} fill={T.acc}>L {realW}</text>
    <text x={cx + iX(0, H / 2, 0) - 22} y={cy + iY(0, H / 2, 0) + 3} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={FM} fill={T.acc}>H {realH}</text>
    <text x={170} y={270} textAnchor="middle" fontSize={8} fill={T.sub} fontFamily={FF}>Tap su una faccia per disegnare</text>
  </svg>);
}

function RenderPreview({ T, realW, realH, faceData }) {
  const sc = Math.min(0.15, 280 / Math.max(realW, realH)), W = realW * sc, H = realH * sc, pad = 30; const els = faceData["front"]?.elements || [];
  return (<div style={{ padding: 8 }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>RENDERING PROSPETTO</div>
    <svg width={W + pad * 2} height={H + pad * 2 + 10} style={{ background: "#fff", borderRadius: 8, border: "1px solid " + T.bdr, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#87CEEB" /><stop offset="100%" stopColor="#E0F0FF" /></linearGradient></defs>
      <rect x={0} y={0} width={W + pad * 2} height={pad + 5} fill="url(#sky)" rx={8} />
      <rect x={pad} y={pad} width={W} height={H} fill="#F5F0E8" stroke="#8B7D6B" strokeWidth={2} rx={2} />
      {els.map((el) => { const x = pad + el.x * sc, y = pad + el.y * sc, w = el.w * sc, h = el.h * sc;
        if (el.type === "vetro" || el.type === "anta") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#A8D8EA" stroke="#5B8FA8" strokeWidth={1.5} rx={2} /></g>;
        if (el.type === "porta") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#C4A882" stroke="#8B7D6B" strokeWidth={2} rx={2} /><circle cx={x + w * .15} cy={y + h * .5} r={2} fill="#8B7D6B" /></g>;
        if (el.type === "scorrevole") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#B0D8EA90" stroke="#5B8FA8" strokeWidth={1} rx={1} /><line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#5B8FA860" strokeWidth={1} /></g>;
        if (el.type === "telaio") return <rect key={el.id} x={x} y={y} width={w} height={h} fill="none" stroke="#5B5B5B" strokeWidth={2} rx={1} />;
        return <rect key={el.id} x={x} y={y} width={w} height={h} fill="#DDD" stroke="#AAA" strokeWidth={0.5} />; })}
      <rect x={0} y={pad + H - 2} width={W + pad * 2} height={pad + 12} fill="#D4C8B0" />
    </svg>
    {els.length === 0 && <div style={{ textAlign: "center", padding: 12, fontSize: 10, color: T.sub }}>Disegna elementi sul Prospetto per il rendering</div>}
  </div>);
}

function FDataPanel({ T, faceKey, faceData, setFaceData, onClose }) {
  const face = FA[faceKey], data = faceData[faceKey]?.fields || {}, fields = getFields(faceKey);
  const setF = (k, v) => setFaceData((prev) => ({ ...prev, [faceKey]: { ...(prev[faceKey] || {}), fields: { ...(prev[faceKey]?.fields || {}), [k]: v } } }));
  return (<div style={{ borderTop: "1.5px solid " + T.purple + "40", background: T.card || "#fff", padding: "8px 12px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span style={{ fontSize: 12 }}>{face.icon}</span><span style={{ fontSize: 11, fontWeight: 800, color: T.purple }}>{face.label} - Dati</span><span style={{ flex: 1 }} /><span onClick={onClose} style={{ fontSize: 11, cursor: "pointer", color: T.sub }}>x</span></div>
    {fields.map((f) => (<div key={f.k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, minWidth: 72 }}>{f.l}</span>
      {f.type === "text" ? <input value={data[f.k] || ""} placeholder="..." onChange={(e) => setF(f.k, e.target.value)} style={{ flex: 1, padding: "4px 8px", border: "1px solid " + T.bdr, borderRadius: 5, fontSize: 10, fontFamily: FF, color: T.text }} />
        : <div style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="number" value={data[f.k] || ""} placeholder="-" onChange={(e) => setF(f.k, parseInt(e.target.value) || 0)} style={{ width: 56, padding: "4px", border: "1px solid " + T.bdr, borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: FM, textAlign: "center", color: T.text }} />{f.u && <span style={{ fontSize: 8, color: T.sub }}>{f.u}</span>}</div>}
    </div>))}
  </div>);
}

export default function DisegnoTecnico3D({ vanoId, vanoNome, vanoDisegno, realW, realH, onUpdate, onUpdateField, onClose, T }) {
  const [mode, setMode] = useState("3d");
  const [activeFace, setActiveFace] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [faceData, setFaceData] = useState(vanoDisegno?.faceData || {});
  const [showFields, setShowFields] = useState(false);

  useEffect(() => { const t = setTimeout(() => { const all = []; FK.forEach(fk => { (faceData[fk]?.elements || []).forEach((el) => all.push({ ...el, face: fk })); }); onUpdate({ ...(vanoDisegno || {}), faceData, elements: all }); }, 500); return () => clearTimeout(t); }, [faceData]);

  const pm = vanoDisegno?.profMuro || 350;
  const totalEls = FK.reduce((s, fk) => s + (faceData[fk]?.elements?.length || 0), 0);
  const updateFaceEls = (fk, els) => setFaceData((prev) => ({ ...prev, [fk]: { ...(prev[fk] || {}), elements: els } }));
  const openFace = (fk) => { setActiveFace(fk); setMode("face"); setActiveTool(null); };
  const G = T.grn || "#1A9E73";

  return (<div style={{ marginTop: 8, borderRadius: 10, border: "1.5px solid " + T.purple, overflow: "hidden", background: T.card || "#fff" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.purple + "08", borderBottom: "1px solid " + T.bdr }}>
      <span style={{ fontSize: 13 }}>✏️</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: T.purple, flex: 1 }}>Disegno 3D - {vanoNome} ({realW}x{realH})</span>
      {totalEls > 0 && <span style={{ padding: "1px 6px", borderRadius: 4, background: G + "18", fontSize: 8, fontWeight: 800, color: G }}>{totalEls} el.</span>}
      <span onClick={onClose} style={{ fontSize: 12, cursor: "pointer", color: T.sub, padding: "2px 6px" }}>x</span>
    </div>
    <div style={{ display: "flex", borderBottom: "1px solid " + T.bdr }}>
      {[{ id: "3d", l: "3D" }, { id: "face", l: activeFace ? FA[activeFace].label : "Faccia" }, { id: "render", l: "Render" }].map(m => (
        <div key={m.id} onClick={() => setMode(m.id)} style={{ flex: 1, padding: "6px 0", textAlign: "center", cursor: "pointer", fontSize: 10, fontWeight: mode === m.id ? 800 : 500, color: mode === m.id ? T.purple : T.sub, borderBottom: "2px solid " + (mode === m.id ? T.purple : "transparent") }}>{m.l}</div>
      ))}
    </div>
    {mode === "3d" && <div style={{ display: "flex", justifyContent: "center", padding: "8px 4px" }}><Iso3D T={T} realW={realW} realH={realH} profMuro={pm} faceData={faceData} activeFace={activeFace} onSelectFace={openFace} /></div>}
    {mode === "face" && activeFace && (<>
      <div style={{ padding: "6px 8px", display: "flex", gap: 4, flexWrap: "wrap", borderBottom: "1px solid " + T.bdr, background: T.bg }}>
        {EL.map(et => (<div key={et.id} onClick={() => setActiveTool(activeTool === et.id ? null : et.id)} style={{ padding: "4px 8px", borderRadius: 6, border: "1.5px solid " + (activeTool === et.id ? et.color : T.bdr), background: activeTool === et.id ? et.color + "12" : T.card || "#fff", fontSize: 9, fontWeight: activeTool === et.id ? 800 : 600, color: activeTool === et.id ? et.color : T.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}><span style={{ fontSize: 10 }}>{et.icon}</span> {et.label}</div>))}
      </div>
      <FaceCanvas T={T} faceKey={activeFace} realW={realW} realH={realH} elements={faceData[activeFace]?.elements || []} onUpdateElements={(els) => updateFaceEls(activeFace, els)} activeTool={activeTool} />
      <div onClick={() => setShowFields(!showFields)} style={{ padding: "6px 12px", borderTop: "1px solid " + T.bdr, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: T.purple }}>Dati {FA[activeFace].label}</span>
        <span style={{ fontSize: 8, color: T.sub, transform: showFields ? "rotate(180deg)" : "none" }}>V</span>
      </div>
      {showFields && <FDataPanel T={T} faceKey={activeFace} faceData={faceData} setFaceData={setFaceData} onClose={() => setShowFields(false)} />}
    </>)}
    {mode === "render" && <RenderPreview T={T} realW={realW} realH={realH} faceData={faceData} />}
    <div style={{ padding: "6px 10px", borderTop: "1px solid " + T.bdr, display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
      {FK.map(k => { const els = faceData[k]?.elements || []; const active = activeFace === k && mode === "face"; return (
        <div key={k} onClick={() => openFace(k)} style={{ padding: "3px 7px", borderRadius: 5, border: "1.5px solid " + (active ? T.purple : els.length > 0 ? G : T.bdr), background: active ? T.purple + "12" : els.length > 0 ? G + "08" : T.card || "#fff", cursor: "pointer", fontSize: 8, fontWeight: 700, color: active ? T.purple : els.length > 0 ? G : T.sub, display: "flex", alignItems: "center", gap: 2 }}>
          {FA[k].icon} {FA[k].s}{els.length > 0 && <span style={{ fontSize: 7, opacity: 0.7 }}>({els.length})</span>}
        </div>); })}
    </div>
  </div>);
}