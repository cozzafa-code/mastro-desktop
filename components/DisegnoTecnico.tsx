"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — DisegnoTecnico (Shared Drawing Module)
// Usato da: CMDetailPanel (preventivo) + VanoDetailPanel (rilievo)
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// 3D ISOMETRIC VIEW — 6 Faces + Per-face drawing + Render
// ═══════════════════════════════════════════════════════════
const FM3 = "'SF Mono','JetBrains Mono',monospace";
const FF3 = "'SF Pro Display',-apple-system,sans-serif";

const EL3D = [
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
];
const FA3: any = {
  front: { label: "Prospetto", icon: "🪟", s: "F" },
  back: { label: "Esterno", icon: "↩", s: "E" },
  left: { label: "Spall.SX", icon: "◀", s: "SX" },
  right: { label: "Spall.DX", icon: "▶", s: "DX" },
  top: { label: "Architrave", icon: "⬆", s: "A" },
  bottom: { label: "Davanzale", icon: "⬇", s: "D" },
};
const FK3 = ["front", "back", "left", "right", "top", "bottom"];

function getFields3D(fk: string) {
  const n = { k: "note", l: "Note", type: "text" };
  if (fk === "front") return [{ k: "luce_l", l: "Luce L", u: "mm" }, { k: "luce_h", l: "Luce H", u: "mm" }, { k: "fuori_squadra", l: "Fuori squadra", u: "mm" }, { k: "tipo_apertura", l: "Tipo apertura", type: "text" }, n];
  if (fk === "back") return [{ k: "tipo_muro", l: "Tipo muro", type: "text" }, { k: "finitura", l: "Finitura est.", type: "text" }, { k: "spessore_intonaco", l: "Spess. intonaco", u: "mm" }, n];
  if (fk === "top") return [{ k: "arch_h", l: "Altezza", u: "mm" }, { k: "arch_tipo", l: "Tipo", type: "text" }, { k: "cassH", l: "Cassonetto H", u: "mm" }, { k: "cassP", l: "Cassonetto P", u: "mm" }, n];
  if (fk === "bottom") return [{ k: "dav_prof", l: "Profondita", u: "mm" }, { k: "dav_sporg", l: "Sporgenza", u: "mm" }, { k: "dav_mat", l: "Materiale", type: "text" }, n];
  return [{ k: "sp_larg", l: "Larghezza", u: "mm" }, { k: "sp_prof", l: "Profondita", u: "mm" }, { k: "sp_tipo", l: "Tipo muro", type: "text" }, { k: "fuori_piombo", l: "Fuori piombo", u: "mm" }, n];
}

function renderEl3D(el: any, sc: number, ox: number, oy: number) {
  const x = ox + el.x * sc, y = oy + el.y * sc, w = el.w * sc, h = el.h * sc;
  const et = EL3D.find(t => t.id === el.type); const c = et?.color || "#666"; const s = el._sel;
  const sb = s ? <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill="none" stroke="#3B7FE0" strokeWidth={1} strokeDasharray="3,2" /> : null;
  if (el.type === "telaio") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="none" stroke={c} strokeWidth={s ? 2.5 : 1.5} rx={1} />{sb}</g>;
  if (el.type === "montante") return <g key={el.id}><rect x={x} y={y} width={Math.max(w, 3)} height={h} fill={c} opacity={0.7} />{sb}</g>;
  if (el.type === "traverso") return <g key={el.id}><rect x={x} y={y} width={w} height={Math.max(h, 3)} fill={c} opacity={0.7} />{sb}</g>;
  if (el.type === "anta") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill={c + "15"} stroke={c} strokeWidth={1.2} rx={1} /><line x1={x} y1={y} x2={x + w} y2={y + h / 2} stroke={c + "40"} strokeWidth={0.5} /><line x1={x} y1={y + h} x2={x + w} y2={y + h / 2} stroke={c + "40"} strokeWidth={0.5} />{sb}</g>;
  if (el.type === "porta") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill={c + "12"} stroke={c} strokeWidth={1.5} rx={1} /><line x1={x + w * .15} y1={y + h * .35} x2={x + w * .15} y2={y + h * .65} stroke={c} strokeWidth={2} />{sb}</g>;
  if (el.type === "scorrevole") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#D6EEFF50" stroke={c} strokeWidth={1} strokeDasharray="4,2" rx={1} /><text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize={6} fill={c} fontFamily={FM3}>SCORR.</text>{sb}</g>;
  if (el.type === "persiana") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill={c + "10"} stroke={c} strokeWidth={1} />{Array.from({ length: Math.max(2, Math.floor(h / 5)) }).map((_, i, a) => <line key={i} x1={x + 2} y1={y + (i / a.length) * h + h / a.length / 2} x2={x + w - 2} y2={y + (i / a.length) * h + h / a.length / 2} stroke={c + "50"} strokeWidth={0.5} />)}{sb}</g>;
  if (el.type === "vetro") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#D6EEFF" stroke={c} strokeWidth={0.8} rx={1} /><line x1={x} y1={y} x2={x + w} y2={y + h} stroke={c + "20"} strokeWidth={0.3} />{sb}</g>;
  if (el.type === "oblo") return <g key={el.id}><ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill="#D6EEFF" stroke={c} strokeWidth={1} />{sb}</g>;
  if (el.type === "pannello") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#E8E4DF" stroke={c} strokeWidth={0.8} />{sb}</g>;
  if (el.type === "linea") return <g key={el.id}><line x1={x} y1={y} x2={x + w} y2={y + h} stroke={c} strokeWidth={1.5} /></g>;
  if (el.type === "testo") return <g key={el.id}><text x={x} y={y + 12} fontSize={10} fill="#1A1A1C" fontFamily={FM3} fontWeight={600}>{el.text || "Testo"}</text>{sb}</g>;
  return <rect key={el.id} x={x} y={y} width={w} height={h} fill="#ccc" stroke="#999" strokeWidth={0.5} />;
}

function Iso3D({ T, realW, realH, profMuro, faceData, activeFace, onSelectFace }: any) {
  const mx = Math.max(realW, realH, profMuro), bs = 110 / mx, W = realW * bs, H = realH * bs, D = profMuro * bs;
  const c30 = Math.cos(Math.PI / 6), s30 = 0.5;
  const iX = (x: number, y: number, z: number) => (x - z) * c30, iY = (x: number, y: number, z: number) => (x + z) * s30 - y;
  const cx = 170, cy = 165;
  const co = { fbl: { x: 0, y: 0, z: 0 }, fbr: { x: W, y: 0, z: 0 }, ftl: { x: 0, y: H, z: 0 }, ftr: { x: W, y: H, z: 0 }, bbl: { x: 0, y: 0, z: D }, bbr: { x: W, y: 0, z: D }, btl: { x: 0, y: H, z: D }, btr: { x: W, y: H, z: D } };
  const p = (v: any) => `${cx + iX(v.x, v.y, v.z)},${cy + iY(v.x, v.y, v.z)}`;
  const fp: any = { front: { pts: `${p(co.fbl)} ${p(co.fbr)} ${p(co.ftr)} ${p(co.ftl)}`, fill: "#B8D4E8" }, right: { pts: `${p(co.fbr)} ${p(co.bbr)} ${p(co.btr)} ${p(co.ftr)}`, fill: "#9AB8CC" }, top: { pts: `${p(co.ftl)} ${p(co.ftr)} ${p(co.btr)} ${p(co.btl)}`, fill: "#D4CFC4" }, left: { pts: `${p(co.fbl)} ${p(co.bbl)} ${p(co.btl)} ${p(co.ftl)}`, fill: "#C8C4B8" }, bottom: { pts: `${p(co.fbl)} ${p(co.fbr)} ${p(co.bbr)} ${p(co.bbl)}`, fill: "#E8D8B0" }, back: { pts: `${p(co.bbl)} ${p(co.bbr)} ${p(co.btr)} ${p(co.btl)}`, fill: "#A8C4D8" } };
  const G = T.grn || "#1A9E73";
  const lps: any = { front: { x: W / 2, y: H / 2, z: 0 }, right: { x: W, y: H / 2, z: D / 2 }, top: { x: W / 2, y: H, z: D / 2 }, left: { x: 0, y: H / 2, z: D / 2 }, bottom: { x: W / 2, y: 0, z: D / 2 }, back: { x: W / 2, y: H / 2, z: D } };
  return (<svg width={340} height={280} style={{ background: "#fff", borderRadius: 6, border: `1px solid ${T.bdr}`, maxWidth: "100%" }}>
    {[0, 1, 2, 3, 4].map(i => <line key={`z${i}`} x1={cx + iX(0, 0, (i / 4) * D)} y1={cy + iY(0, 0, (i / 4) * D)} x2={cx + iX(W, 0, (i / 4) * D)} y2={cy + iY(W, 0, (i / 4) * D)} stroke="#E8E8E8" strokeWidth={0.5} />)}
    {[0, 1, 2, 3, 4].map(i => <line key={`x${i}`} x1={cx + iX((i / 4) * W, 0, 0)} y1={cy + iY((i / 4) * W, 0, 0)} x2={cx + iX((i / 4) * W, 0, D)} y2={cy + iY((i / 4) * W, 0, D)} stroke="#E8E8E8" strokeWidth={0.5} />)}
    {["back", "bottom", "left", "right", "front", "top"].map(fk => { const f = fp[fk], sel = activeFace === fk, els = faceData[fk]?.elements || [], has = els.length > 0; const lp = lps[fk], lx = cx + iX(lp.x, lp.y, lp.z), ly = cy + iY(lp.x, lp.y, lp.z);
      return (<g key={fk} onClick={() => onSelectFace(fk)} style={{ cursor: "pointer" }}><polygon points={f.pts} fill={sel ? "#1A9E73" + "40" : has ? G + "15" : f.fill} stroke={sel ? "#1A9E73" : has ? G : "#666"} strokeWidth={sel ? 2.5 : 1} strokeLinejoin="round" /><text x={lx} y={ly - 3} textAnchor="middle" fontSize={sel ? 10 : 7} fontWeight={sel ? 800 : 600} fontFamily={FM3} fill={sel ? "#1A9E73" : has ? G : "#555"}>{FA3[fk].label}</text>{has && <text x={lx} y={ly + 8} textAnchor="middle" fontSize={7} fontFamily={FM3} fill={G}>{els.length} el.</text>}</g>); })}
    <text x={(cx + iX(0, 0, 0) + cx + iX(W, 0, 0)) / 2} y={(cy + iY(0, 0, 0) + cy + iY(W, 0, 0)) / 2 + 22} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={FM3} fill={T.acc}>L {realW}</text>
    <text x={cx + iX(0, H / 2, 0) - 22} y={cy + iY(0, H / 2, 0) + 3} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={FM3} fill={T.acc}>H {realH}</text>
    <text x={170} y={270} textAnchor="middle" fontSize={8} fill={T.sub} fontFamily={FF3}>Tap su una faccia per disegnare</text>
  </svg>);
}

function FaceCanvas3D({ T, faceKey, realW, realH, elements, onUpdateElements, activeTool }: any) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ds, setDs] = useState<any>(null); const [dc, setDc] = useState<any>(null); const [selId, setSelId] = useState<string | null>(null);
  const face = FA3[faceKey]; const sc = Math.min(0.16, 280 / Math.max(realW, realH));
  const W = realW * sc, H = realH * sc, pad = 35, svgW = W + pad * 2 + 20, svgH = H + pad * 2 + 20;
  const gpt = (e: any) => { const r = svgRef.current?.getBoundingClientRect(); const ct = e.touches ? e.touches[0] : e; return r ? { x: (ct.clientX - r.left - pad) / sc, y: (ct.clientY - r.top - pad) / sc } : { x: 0, y: 0 }; };
  const hDown = (e: any) => { if (!activeTool || activeTool === "select") { const pt = gpt(e); const hit = [...(elements || [])].reverse().find((el: any) => pt.x >= el.x && pt.x <= el.x + el.w && pt.y >= el.y && pt.y <= el.y + el.h); setSelId(hit?.id || null); return; } setDs(gpt(e)); setDc(gpt(e)); };
  const hMove = (e: any) => { if (ds) { const ct = e.touches ? e.touches[0] : e; setDc(gpt(e)); } };
  const hUp = () => { if (!ds || !dc || !activeTool) { setDs(null); setDc(null); return; } const x = Math.min(ds.x, dc.x), y = Math.min(ds.y, dc.y), w = Math.abs(dc.x - ds.x), h = Math.abs(dc.y - ds.y); if (w < 10 && h < 10) { setDs(null); setDc(null); return; } onUpdateElements([...(elements || []), { id: `el_${Date.now()}`, type: activeTool, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), face: faceKey }]); setDs(null); setDc(null); };
  const els = (elements || []).map((el: any) => ({ ...el, _sel: el.id === selId }));
  return (<div>
    <div style={{ display: "flex", alignItems: "center", padding: "6px 10px", gap: 6, background: `${"#1A9E73"}06`, borderBottom: `1px solid ${T.bdr}` }}>
      <span style={{ fontSize: 12 }}>{face.icon}</span><span style={{ fontSize: 11, fontWeight: 800, color: "#1A9E73", flex: 1 }}>{face.label}</span><span style={{ fontSize: 8, color: T.sub, fontFamily: FM3 }}>{realW}x{realH}mm</span>
      {elements?.length > 0 && <span style={{ padding: "1px 6px", borderRadius: 4, background: `${T.grn || "#1A9E73"}18`, fontSize: 8, fontWeight: 800, color: T.grn || "#1A9E73" }}>{elements.length} el.</span>}
      {selId && <span onClick={() => { onUpdateElements((elements || []).filter((el: any) => el.id !== selId)); setSelId(null); }} style={{ padding: "2px 6px", borderRadius: 4, background: `${T.red || "#DC4444"}15`, fontSize: 8, fontWeight: 700, color: T.red || "#DC4444", cursor: "pointer" }}>🗑 Elimina</span>}
    </div>
    <div style={{ display: "flex", justifyContent: "center", padding: 6, background: "#FAFAF7" }}>
      <svg ref={svgRef} width={svgW} height={svgH} onPointerDown={hDown} onPointerMove={hMove} onPointerUp={hUp} style={{ background: "#fff", borderRadius: 6, border: `1px solid ${T.bdr}`, cursor: activeTool && activeTool !== "select" ? "crosshair" : "default", touchAction: "none", maxWidth: "100%" }}>
        {Array.from({ length: Math.ceil(W / 20) + 1 }).map((_, i) => <line key={`v${i}`} x1={pad + i * 20} y1={pad} x2={pad + i * 20} y2={pad + H} stroke="#F0F0F0" strokeWidth={0.5} />)}
        {Array.from({ length: Math.ceil(H / 20) + 1 }).map((_, i) => <line key={`h${i}`} x1={pad} y1={pad + i * 20} x2={pad + W} y2={pad + i * 20} stroke="#F0F0F0" strokeWidth={0.5} />)}
        <rect x={pad} y={pad} width={W} height={H} fill="#F8F7F4" stroke="#3A3A3C" strokeWidth={1.5} rx={1} />
        {els.map((el: any) => renderEl3D(el, sc, pad, pad))}
        {ds && dc && activeTool && (() => { const x = Math.min(ds.x, dc.x) * sc + pad, y = Math.min(ds.y, dc.y) * sc + pad, w = Math.abs(dc.x - ds.x) * sc, h = Math.abs(dc.y - ds.y) * sc; const et = EL3D.find(t => t.id === activeTool); return <rect x={x} y={y} width={w} height={h} fill={(et?.color || "#666") + "15"} stroke={et?.color || "#666"} strokeWidth={1} strokeDasharray="4,2" />; })()}
      </svg>
    </div>
  </div>);
}

function RenderPreview3D({ T, realW, realH, faceData }: any) {
  const sc = Math.min(0.15, 280 / Math.max(realW, realH)), W = realW * sc, H = realH * sc, pad = 30; const els = faceData["front"]?.elements || [];
  return (<div style={{ padding: 8 }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>RENDERING PROSPETTO</div>
    <svg width={W + pad * 2} height={H + pad * 2 + 10} style={{ background: "#fff", borderRadius: 8, border: `1px solid ${T.bdr}`, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", maxWidth: "100%" }}>
      <defs><linearGradient id="sky3d" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#87CEEB" /><stop offset="100%" stopColor="#E0F0FF" /></linearGradient></defs>
      <rect x={0} y={0} width={W + pad * 2} height={pad + 5} fill="url(#sky3d)" rx={8} />
      <rect x={pad} y={pad} width={W} height={H} fill="#F5F0E8" stroke="#8B7D6B" strokeWidth={2} rx={2} />
      {els.map((el: any) => { const x = pad + el.x * sc, y = pad + el.y * sc, w = el.w * sc, h = el.h * sc;
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

function FDataPanel3D({ T, faceKey, faceData, setFaceData, onClose }: any) {
  const face = FA3[faceKey], data = faceData[faceKey]?.fields || {}, fields = getFields3D(faceKey);
  const setF = (k: string, v: any) => setFaceData((prev: any) => ({ ...prev, [faceKey]: { ...(prev[faceKey] || {}), fields: { ...(prev[faceKey]?.fields || {}), [k]: v } } }));
  return (<div style={{ borderTop: `1.5px solid ${"#1A9E73"}40`, background: T.card || "#fff", padding: "8px 12px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span style={{ fontSize: 12 }}>{face.icon}</span><span style={{ fontSize: 11, fontWeight: 800, color: "#1A9E73" }}>{face.label} - Dati</span><span style={{ flex: 1 }} /><span onClick={onClose} style={{ fontSize: 11, cursor: "pointer", color: T.sub }}>✕</span></div>
    {fields.map((f: any) => (<div key={f.k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, minWidth: 72 }}>{f.l}</span>
      {f.type === "text" ? <input value={data[f.k] || ""} placeholder="..." onChange={(e: any) => setF(f.k, e.target.value)} style={{ flex: 1, padding: "4px 8px", border: `1px solid ${T.bdr}`, borderRadius: 5, fontSize: 10, fontFamily: FF3, color: T.text }} />
        : <div style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="number" value={data[f.k] || ""} placeholder="—" onChange={(e: any) => setF(f.k, parseInt(e.target.value) || 0)} style={{ width: 56, padding: "4px", border: `1px solid ${T.bdr}`, borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: FM3, textAlign: "center", color: T.text }} />{f.u && <span style={{ fontSize: 8, color: T.sub }}>{f.u}</span>}</div>}
    </div>))}
  </div>);
}

function View3D({ T, realW, realH, vanoDisegno, onUpdate, pts, H, sp, mats, onMatsChange, onHChange, onSpChange }: any) {
  // Dimensioni dai pts condivisi
  const xs3 = (pts||[]).map((p:any)=>p.x), ys3 = (pts||[]).map((p:any)=>p.y);
  const L = xs3.length ? Math.max(...xs3)-Math.min(...xs3) : realW||1200;
  const P = ys3.length ? Math.max(...ys3)-Math.min(...ys3) : 350;
  const [selFace, setSelFace] = useState<string|null>(null);

  const MAT3D = [
    {id:"alluminio",l:"Alluminio",c:"#CBD5E1",b:"#475569"},
    {id:"pvc",      l:"PVC",      c:"#93C5FD",b:"#3B7FE0"},
    {id:"acciaio",  l:"Acciaio",  c:"#9CA3AF",b:"#374151"},
    {id:"vetro",    l:"Vetro",    c:"#BAE6FD",b:"#0EA5E9"},
    {id:"legno",    l:"Legno",    c:"#D6B896",b:"#92400E"},
    {id:"eps",      l:"Coib.",    c:"#FDE68A",b:"#D08008"},
  ];
  const getMat = (id:string) => MAT3D.find(m=>m.id===id)||MAT3D[0];

  // Isometrica
  const mx = Math.max(L, H, P, 1);
  const sc3 = 90/mx;
  const W3=L*sc3, H3=H*sc3, D3=P*sc3;
  const s3=sp*sc3;
  const c30=Math.cos(Math.PI/6), s30=0.5;
  const iX=(x:number,_y:number,z:number)=>(x-z)*c30;
  const iY=(x:number,y:number,z:number)=>(x+z)*s30-y;
  const CX=185, CY=170;
  const p3=(x:number,y:number,z:number)=>`${(CX+iX(x,y,z)).toFixed(1)},${(CY+iY(x,y,z)).toFixed(1)}`;

  // Normalizza i pts della pianta in coordinate 0..L, 0..P
  const normPts = (pts||[]).map((p:any) => ({
    x: (p.x - Math.min(...(pts||[{x:0}]).map((q:any)=>q.x))) / Math.max(L,1) * W3,
    z: (p.y - Math.min(...(pts||[{y:0}]).map((q:any)=>q.y))) / Math.max(P,1) * D3,
  }));
  const isBox = normPts.length === 4;

  // Genera le facce laterali dalla pianta estrusa
  const sideFaces = normPts.length >= 3 ? normPts.map((np:any, i:number) => {
    const next = normPts[(i+1)%normPts.length];
    const pts3 = `${p3(np.x,0,np.z)} ${p3(next.x,0,next.z)} ${p3(next.x,H3,next.z)} ${p3(np.x,H3,np.z)}`;
    return {id:`side${i}`, pts:pts3, matKey:"front", op:0.85};
  }) : [];

  // Pianta in basso e tetto
  const bottomPts3 = normPts.map((np:any)=>p3(np.x,0,np.z)).join(" ");
  const topPts3    = normPts.map((np:any)=>p3(np.x,H3,np.z)).join(" ");

  const FACES = isBox ? [
    {id:"back",   pts:`${p3(0,0,D3)} ${p3(W3,0,D3)} ${p3(W3,H3,D3)} ${p3(0,H3,D3)}`, op:0.6, matKey:"back"},
    {id:"bottom", pts:`${p3(0,0,0)} ${p3(W3,0,0)} ${p3(W3,0,D3)} ${p3(0,0,D3)}`,     op:0.7, matKey:"bottom"},
    {id:"left",   pts:`${p3(0,0,0)} ${p3(0,0,D3)} ${p3(0,H3,D3)} ${p3(0,H3,0)}`,     op:0.85,matKey:"left"},
    {id:"right",  pts:`${p3(W3,0,0)} ${p3(W3,0,D3)} ${p3(W3,H3,D3)} ${p3(W3,H3,0)}`, op:0.9, matKey:"right"},
    {id:"front",  pts:`${p3(0,0,0)} ${p3(W3,0,0)} ${p3(W3,H3,0)} ${p3(0,H3,0)}`,     op:1.0, matKey:"front"},
    {id:"top",    pts:`${p3(0,H3,0)} ${p3(W3,H3,0)} ${p3(W3,H3,D3)} ${p3(0,H3,D3)}`, op:0.95,matKey:"top"},
  ] : [
    // Forma libera: fondo + lati laterali + tetto
    {id:"bottom", pts:bottomPts3, op:0.7, matKey:"bottom"},
    ...sideFaces,
    {id:"top",    pts:topPts3,    op:0.95,matKey:"top"},
  ];

  const faceLabels:any = {
    front:"Fronte", back:"Retro", left:"Sx", right:"Dx", top:"Coperchio", bottom:"Fondo"
  };
  const visibleLabels = [
    {id:"front", lx:CX+iX(W3/2,H3/2,0),     ly:CY+iY(W3/2,H3/2,0)},
    {id:"right", lx:CX+iX(W3,H3/2,D3/2),    ly:CY+iY(W3,H3/2,D3/2)},
    {id:"top",   lx:CX+iX(W3/2,H3,D3/2),    ly:CY+iY(W3/2,H3,D3/2)},
  ];

  const inp = { width:"100%", padding:"5px 3px", border:`1.5px solid ${T.bdr}`,
    borderRadius:6, fontSize:13, fontWeight:800,
    fontFamily:"'JetBrains Mono',monospace", textAlign:"center" as const,
    color:T.text, background:T.card||"#fff", boxSizing:"border-box" as const };

  return (
    <div>
      {/* 3D SVG */}
      <div style={{display:"flex",justifyContent:"center",padding:"10px 6px",background:"#F0F8FF"}}>
        <svg width={370} height={290} style={{maxWidth:"100%",background:"#fff",
          borderRadius:8,border:`1px solid ${T.bdr}`}}>

          {/* Piano griglia */}
          {[0,0.25,0.5,0.75,1].map((t,i)=>(
            <line key={"gz"+i}
              x1={CX+iX(0,0,t*D3)} y1={CY+iY(0,0,t*D3)}
              x2={CX+iX(W3,0,t*D3)} y2={CY+iY(W3,0,t*D3)}
              stroke="#E8F0FF" strokeWidth="0.6"/>
          ))}
          {[0,0.5,1].map((t,i)=>(
            <line key={"gx"+i}
              x1={CX+iX(t*W3,0,0)} y1={CY+iY(t*W3,0,0)}
              x2={CX+iX(t*W3,0,D3)} y2={CY+iY(t*W3,0,D3)}
              stroke="#E8F0FF" strokeWidth="0.6"/>
          ))}

          {/* Facce */}
          {FACES.map(f=>{
            const mat = getMat(mats?.[f.matKey||f.id]||"alluminio");
            const isSel = selFace===f.id;
            return (
              <polygon key={f.id} points={f.pts}
                fill={mat.c + Math.round(f.op*255).toString(16).padStart(2,"0")}
                stroke={isSel?"#F59E0B":mat.b}
                strokeWidth={isSel?2.5:1}
                strokeLinejoin="round"
                style={{cursor:"pointer"}}
                onClick={()=>setSelFace(selFace===f.id?null:f.id)}/>
            );
          })}

          {/* Label facce visibili */}
          {visibleLabels.map(f=>{
            const mat=getMat(mats[f.id]);
            const isSel=selFace===f.id;
            return (
              <g key={f.id} style={{pointerEvents:"none"}}>
                <text x={f.lx} y={f.ly-3} textAnchor="middle" fontSize={isSel?"11":"9"}
                  fontWeight="800" fill={isSel?"#F59E0B":mat.b}>
                  {faceLabels[f.id]}
                </text>
                <text x={f.lx} y={f.ly+9} textAnchor="middle" fontSize="8" fill={mat.b}>
                  {mat.l}
                </text>
              </g>
            );
          })}

          {/* Quote L */}
          <line x1={CX+iX(0,0,0)} y1={CY+iY(0,0,0)}
            x2={CX+iX(W3,0,0)} y2={CY+iY(W3,0,0)}
            stroke="#D08008" strokeWidth="1" strokeDasharray="4,2"/>
          <text x={(CX+iX(0,0,0)+CX+iX(W3,0,0))/2}
            y={(CY+iY(0,0,0)+CY+iY(W3,0,0))/2+16}
            textAnchor="middle" fontSize="9" fontWeight="800" fill="#D08008">L {L}mm</text>

          {/* Quote H */}
          <line x1={CX+iX(W3,0,0)} y1={CY+iY(W3,0,0)}
            x2={CX+iX(W3,H3,0)} y2={CY+iY(W3,H3,0)}
            stroke="#D08008" strokeWidth="1" strokeDasharray="4,2"/>
          <text x={CX+iX(W3,0,0)+28} y={(CY+iY(W3,0,0)+CY+iY(W3,H3,0))/2}
            textAnchor="start" fontSize="9" fontWeight="800" fill="#D08008">H {H}mm</text>

          {/* Quote P */}
          <line x1={CX+iX(W3,0,0)} y1={CY+iY(W3,0,0)}
            x2={CX+iX(W3,0,D3)} y2={CY+iY(W3,0,D3)}
            stroke="#D08008" strokeWidth="1" strokeDasharray="4,2"/>
          <text x={(CX+iX(W3,0,0)+CX+iX(W3,0,D3))/2+16}
            y={(CY+iY(W3,0,0)+CY+iY(W3,0,D3))/2}
            textAnchor="start" fontSize="9" fontWeight="800" fill="#D08008">P {P}mm</text>

          <text x={185} y={282} textAnchor="middle" fontSize="8" fill="#94A3B8">
            Tap faccia → assegna materiale
          </text>
        </svg>
      </div>

      {/* Dimensioni compatte */}
      <div style={{padding:"7px 10px",borderTop:`1px solid ${T.bdr}`,background:T.bg||"#F2F1EC"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5}}>
          {[{l:"L",v:L,set:(v:number)=>{/* readonly */}},{l:"H",v:H||280,set:onHChange},{l:"P",v:P,set:(v:number)=>{/* readonly */}},{l:"Sp.",v:sp||40,set:onSpChange}].map(({l,v,set})=>(
            <div key={l}>
              <div style={{fontSize:9,color:T.sub,fontWeight:700,marginBottom:2}}>{l} (mm)</div>
              <input type="number" value={v}
                onChange={(e:any)=>set(Math.max(1,parseInt(e.target.value)||1))}
                style={inp}/>
            </div>
          ))}
        </div>
        <div style={{marginTop:6,padding:"4px 8px",borderRadius:6,background:"#EFF8FF",
          display:"flex",justifyContent:"space-around"}}>
          <span style={{fontSize:9,fontWeight:700,color:"#3B7FE0"}}>Int. {Math.max(0,L-sp*2)}×{Math.max(0,H-sp*2)}×{Math.max(0,P-sp*2)}mm</span>
        </div>
      </div>

      {/* Selezione materiale */}
      {selFace && (
        <div style={{padding:"8px 10px",borderTop:`1px solid ${T.bdr}`,background:"#fff"}}>
          <div style={{fontSize:11,fontWeight:800,color:T.text,marginBottom:8}}>
            {faceLabels[selFace]}
            <span style={{fontSize:9,color:T.sub,fontWeight:400,marginLeft:6}}>
              {["front","back"].includes(selFace)?"(stesso per fronte/retro)":
               ["left","right"].includes(selFace)?"(stesso per sx/dx)":"(stesso per top/fondo)"}
            </span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
            {MAT3D.map(m=>{
              const cur=mats[selFace];
              const isSel=cur===m.id;
              const apply = (id:string) => {
                const pair:any = {front:["front","back"],left:["left","right"],right:["left","right"],back:["front","back"],top:["top","bottom"],bottom:["top","bottom"]};
                const keys=pair[selFace]||[selFace];
                const next:any={...mats};
                keys.forEach((k:string)=>next[k]=id);
                onMatsChange(next);
              };
              return (
                <div key={m.id} onClick={()=>apply(m.id)}
                  style={{padding:"8px 5px",borderRadius:8,cursor:"pointer",textAlign:"center",
                    border:`2px solid ${isSel?m.b:"#E2E8F0"}`,background:m.c+"80"}}>
                  <div style={{width:18,height:18,borderRadius:4,background:m.c,
                    border:`2px solid ${m.b}`,margin:"0 auto 4px"}}/>
                  <div style={{fontSize:11,fontWeight:700,color:"#0F172A"}}>{m.l}</div>
                  {isSel&&<div style={{fontSize:8,color:m.b}}>✓</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FORMA EDITOR — Polygon-based shape builder
// ═══════════════════════════════════════════════════════════
const FM2 = "'SF Mono','JetBrains Mono',monospace";
const distPt = (a: any, b: any) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
const segLenPt = (a: any, b: any) => Math.round(distPt(a, b));
function nearSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  if (len2 === 0) return { t: 0, dist: distPt({ x: px, y: py }, { x: ax, y: ay }), x: ax, y: ay };
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return { t, dist: distPt({ x: px, y: py }, { x: cx, y: cy }), x: cx, y: cy };
}
const makeRectPts = (w = 1200, h = 1400) => [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];

function FormaEditor({ T, realW, realH, pts, onPtsChange, H, onHChange, sp, onSpChange }: any) {
  // Legge L e P dai pts condivisi
  const xs = pts.map((p:any)=>p.x), ys = pts.map((p:any)=>p.y);
  const L = Math.max(...xs) - Math.min(...xs) || realW || 1200;
  const P = Math.max(...ys) - Math.min(...ys) || 350;
  const setL = (v:number) => {
    onPtsChange([{x:0,y:0},{x:v,y:0},{x:v,y:P},{x:0,y:P}]);
  };
  const setP2 = (v:number) => {
    onPtsChange([{x:0,y:0},{x:L,y:0},{x:L,y:v},{x:0,y:v}]);
  };

  const SVW = 300, SVH = 260, PAD = 40;
  const scL = (SVW - PAD*2) / Math.max(L, 1);
  const scP = (SVH - PAD*2) / Math.max(P, 1);
  const sc = Math.min(scL, scP, 0.5);
  const bw = L*sc, bd = P*sc;
  const ox = (SVW - bw)/2, oy = (SVH - bd)/2;
  const spx = sp*sc;

  const inp = { width:"100%", padding:"6px 4px", border:`1.5px solid ${T.bdr}`,
    borderRadius:6, fontSize:14, fontWeight:800,
    fontFamily:"'JetBrains Mono',monospace", textAlign:"center" as const, color:T.text,
    background:T.card||"#fff", boxSizing:"border-box" as const };

  // Dimensioni interne
  const Li = L - sp*2, Pi = P - sp*2;

  return (
    <div>
      {/* SVG pianta con spessori */}
      <div style={{display:"flex",justifyContent:"center",padding:"12px 8px",background:"#F8FAFC"}}>
        <svg width={SVW} height={SVH} style={{borderRadius:8,border:`1px solid ${T.bdr}`,background:"#fff",maxWidth:"100%"}}>
          {/* Griglia */}
          {Array.from({length:7}).map((_,i)=>(
            <line key={"gx"+i} x1={ox+i*bw/6} y1={oy} x2={ox+i*bw/6} y2={oy+bd} stroke="#F0EEE8" strokeWidth="0.4"/>
          ))}
          {Array.from({length:6}).map((_,i)=>(
            <line key={"gy"+i} x1={ox} y1={oy+i*bd/5} x2={ox+bw} y2={oy+i*bd/5} stroke="#F0EEE8" strokeWidth="0.4"/>
          ))}

          {/* Muro esterno */}
          <rect x={ox} y={oy} width={bw} height={bd}
            fill="#CBD5E1" stroke="#475569" strokeWidth="2"/>

          {/* Interno */}
          <rect x={ox+spx} y={oy+spx} width={Math.max(bw-spx*2,2)} height={Math.max(bd-spx*2,2)}
            fill="#EFF8FF" stroke="#3B7FE0" strokeWidth="1" strokeDasharray="4,2"/>

          {/* Label interno */}
          <text x={SVW/2} y={SVH/2-4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#3B7FE0">
            {Li > 0 ? `${Li}×${Pi}` : "—"}
          </text>
          <text x={SVW/2} y={SVH/2+10} textAnchor="middle" fontSize="8" fill="#94A3B8">int. mm</text>

          {/* Quote esterne L */}
          <line x1={ox} y1={oy-14} x2={ox+bw} y2={oy-14} stroke="#D08008" strokeWidth="1"/>
          <line x1={ox} y1={oy-10} x2={ox} y2={oy-18} stroke="#D08008" strokeWidth="1"/>
          <line x1={ox+bw} y1={oy-10} x2={ox+bw} y2={oy-18} stroke="#D08008" strokeWidth="1"/>
          <text x={SVW/2} y={oy-18} textAnchor="middle" fontSize="10" fontWeight="800" fill="#D08008">{L}mm</text>

          {/* Quote esterne P */}
          <line x1={ox+bw+14} y1={oy} x2={ox+bw+14} y2={oy+bd} stroke="#D08008" strokeWidth="1"/>
          <line x1={ox+bw+10} y1={oy} x2={ox+bw+18} y2={oy} stroke="#D08008" strokeWidth="1"/>
          <line x1={ox+bw+10} y1={oy+bd} x2={ox+bw+18} y2={oy+bd} stroke="#D08008" strokeWidth="1"/>
          <text x={ox+bw+26} y={SVH/2+4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#D08008"
            transform={`rotate(90,${ox+bw+26},${SVH/2+4})`}>{P}mm</text>

          {/* Label spessore muro */}
          <text x={ox+spx/2} y={SVH/2} textAnchor="middle" fontSize="8" fontWeight="700"
            fill="#475569" transform={`rotate(-90,${ox+spx/2},${SVH/2})`}>{sp}mm</text>

          {/* Label vista */}
          <text x={SVW/2} y={SVH-6} textAnchor="middle" fontSize="8" fill="#94A3B8">pianta (vista dall'alto)</text>
        </svg>
      </div>

      {/* Campi */}
      <div style={{padding:"8px 10px",borderTop:`1px solid ${T.bdr}`,background:T.bg||"#F2F1EC"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
          {[{l:"Larghezza",v:L,set:setL},{l:"Profondità",v:P,set:setP2}].map(({l,v,set})=>(
            <div key={l}>
              <div style={{fontSize:9,color:T.sub,fontWeight:700,marginBottom:3}}>{l} (mm)</div>
              <input type="number" value={v} onChange={(e:any)=>set(Math.max(1,parseInt(e.target.value)||1))} style={inp}/>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[{l:"Altezza",v:H,set:onHChange},{l:"Spessore muri",v:sp,set:onSpChange}].map(({l,v,set})=>(
            <div key={l}>
              <div style={{fontSize:9,color:T.sub,fontWeight:700,marginBottom:3}}>{l} (mm)</div>
              <input type="number" value={v} onChange={(e:any)=>set(Math.max(1,parseInt(e.target.value)||1))} style={inp}/>
            </div>
          ))}
        </div>
        <div style={{marginTop:8,padding:"6px 8px",borderRadius:8,background:"#EFF8FF",
          display:"flex",justifyContent:"space-around"}}>
          <span style={{fontSize:10,fontWeight:700,color:"#3B7FE0"}}>Int. L: {Math.max(0,L-sp*2)}mm</span>
          <span style={{fontSize:10,fontWeight:700,color:"#3B7FE0"}}>Int. P: {Math.max(0,P-sp*2)}mm</span>
          <span style={{fontSize:10,fontWeight:700,color:"#3B7FE0"}}>Int. H: {Math.max(0,H-sp*2)}mm</span>
          <div style={{width:"100%",textAlign:"center",marginTop:6}}>
            <span style={{fontSize:10,color:"#1A9E73",fontWeight:700}}>
              → Vai al tab 3D per vedere il modello
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// LIBERO EDITOR — disegno libero infisso con Paper.js
// ═══════════════════════════════════════════════════════════
function LiberoEditor({ T, realW, realH, onPtsChange, onGoTo3D }: any) {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({x:60, y:60});
  const [tool, setTool] = React.useState<"muro"|"oggetto"|"select">("muro");
  const [spessore, setSpessore] = React.useState(15);
  const [shapes, setShapes] = React.useState<any[]>([]);
  const [curPt, setCurPt] = React.useState<any>(null);
  const [mousePos, setMousePos] = React.useState<any>(null);
  const [joinMenu, setJoinMenu] = React.useState<any>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const isPanRef = React.useRef(false);
  const lastPanPt = React.useRef({x:0,y:0});
  const lastPinch = React.useRef<number|null>(null);

  const GRID = 20;
  const scale = GRID / 10;

  function toSvg(e: any) {
    const svg = svgRef.current; if (!svg) return {x:0,y:0};
    const r = svg.getBoundingClientRect();
    const ct = e.touches ? e.touches[0] : e;
    return {
      x: (ct.clientX - r.left) / zoom - pan.x,
      y: (ct.clientY - r.top)  / zoom - pan.y,
    };
  }

  function snapPt(pt: any) {
    const g = GRID;
    let sx = Math.round(pt.x/g)*g, sy = Math.round(pt.y/g)*g;
    for (const s of shapes) {
      for (const p of [s.a, s.b]) {
        if (p && Math.hypot(p.x-pt.x,p.y-pt.y) < 18/zoom) return {x:p.x,y:p.y};
      }
    }
    if (curPt) {
      const dx=Math.abs(sx-curPt.x), dy=Math.abs(sy-curPt.y);
      if (dx>dy*1.8) sy=curPt.y;
      else if (dy>dx*1.8) sx=curPt.x;
    }
    return {x:sx,y:sy};
  }

  function pxToCm(px: number) { return Math.round(Math.abs(px)/scale); }
  function lenLabel(px: number) {
    const cm = pxToCm(px);
    return cm>=100?(cm/100).toFixed(2)+"m":cm+"cm";
  }
  function segLen(a:any,b:any) { return Math.hypot(b.x-a.x,b.y-a.y); }

  function lineIntersect(p1:any,d1:any,p2:any,d2:any) {
    const cross = d1.x*d2.y - d1.y*d2.x;
    if (Math.abs(cross)<0.001) return null;
    const t=((p2.x-p1.x)*d2.y-(p2.y-p1.y)*d2.x)/cross;
    return {x:p1.x+d1.x*t, y:p1.y+d1.y*t};
  }

  // Genera i 4 punti del poligono di un segmento
  // join="miter" | "wins" (rimane intatto, si estende) | "loses" (si accorcia al bordo del vincitore)
  // winnerSpA/winnerSpB = spessore del segmento vincitore (usato per calcolare il ritiro corretto del perdente)
  function segPolygon(a:any, b:any, sp:number,
    prevB:any=null, nextA:any=null,
    joinAtA="miter", joinAtB="miter",
    winnerSpA:number=sp, winnerSpB:number=sp) {
    const sp2 = sp*scale*0.5;
    const dx=b.x-a.x, dy=b.y-a.y, len=Math.hypot(dx,dy)||1;
    const ux=dx/len, uy=dy/len;
    const nx=-uy, ny=ux; // normale (sinistra)

    // Base: taglio dritto
    let aL={x:a.x+nx*sp2, y:a.y+ny*sp2};
    let aR={x:a.x-nx*sp2, y:a.y-ny*sp2};
    let bL={x:b.x+nx*sp2, y:b.y+ny*sp2};
    let bR={x:b.x-nx*sp2, y:b.y-ny*sp2};

    // LATO A
    if (prevB) {
      const pdx=a.x-prevB.x, pdy=a.y-prevB.y, pl=Math.hypot(pdx,pdy)||1;
      const pux=pdx/pl, puy=pdy/pl;
      const pnx=-puy, pny=pux;

      if (joinAtA==="miter") {
        // Miter: intersezione geometrica delle due pareti
        const prevSp2 = winnerSpA*scale*0.5;
        const iL=lineIntersect({x:prevB.x+pnx*prevSp2,y:prevB.y+pny*prevSp2},{x:pux,y:puy},{x:a.x+nx*sp2,y:a.y+ny*sp2},{x:ux,y:uy});
        if(iL&&isFinite(iL.x)) aL=iL;
        const iR=lineIntersect({x:prevB.x-pnx*prevSp2,y:prevB.y-pny*prevSp2},{x:pux,y:puy},{x:a.x-nx*sp2,y:a.y-ny*sp2},{x:ux,y:uy});
        if(iR&&isFinite(iR.x)) aR=iR;
      } else if (joinAtA==="wins") {
        // Vince: il segmento corrente passa sopra — si estende di metà spessore del perdente
        // nella direzione opposta al segmento prev (cioè fuori dal punto di giunzione)
        const retract = winnerSpA*scale*0.5;
        aL={x:a.x+nx*sp2-pux*retract, y:a.y+ny*sp2-puy*retract};
        aR={x:a.x-nx*sp2-pux*retract, y:a.y-ny*sp2-puy*retract};
      } else if (joinAtA==="loses") {
        // Perde: il segmento si ritira dentro il vincitore
        // Il suo endpoint A si sposta di metà spessore del vincitore verso l'interno
        const retract = winnerSpA*scale*0.5;
        aL={x:a.x+nx*sp2+ux*retract, y:a.y+ny*sp2+uy*retract};
        aR={x:a.x-nx*sp2+ux*retract, y:a.y-ny*sp2+uy*retract};
      }
    }

    // LATO B
    if (nextA) {
      const ndx=nextA.x-b.x, ndy=nextA.y-b.y, nl=Math.hypot(ndx,ndy)||1;
      const nux=ndx/nl, nuy=ndy/nl;
      const nnx=-nuy, nny=nux;

      if (joinAtB==="miter") {
        const nextSp2 = winnerSpB*scale*0.5;
        const iL=lineIntersect({x:b.x+nx*sp2,y:b.y+ny*sp2},{x:ux,y:uy},{x:b.x+nnx*nextSp2,y:b.y+nny*nextSp2},{x:nux,y:nuy});
        if(iL&&isFinite(iL.x)) bL=iL;
        const iR=lineIntersect({x:b.x-nx*sp2,y:b.y-ny*sp2},{x:ux,y:uy},{x:b.x-nnx*nextSp2,y:b.y-nny*nextSp2},{x:nux,y:nuy});
        if(iR&&isFinite(iR.x)) bR=iR;
      } else if (joinAtB==="wins") {
        // Vince: si estende oltre il punto B nella direzione del segmento corrente
        // di metà spessore del perdente
        const retract = winnerSpB*scale*0.5;
        bL={x:b.x+nx*sp2+ux*retract, y:b.y+ny*sp2+uy*retract};
        bR={x:b.x-nx*sp2+ux*retract, y:b.y-ny*sp2+uy*retract};
      } else if (joinAtB==="loses") {
        // Perde: il bordo B arretra di metà spessore del vincitore
        const retract = winnerSpB*scale*0.5;
        bL={x:b.x+nx*sp2-ux*retract, y:b.y+ny*sp2-uy*retract};
        bR={x:b.x-nx*sp2-ux*retract, y:b.y-ny*sp2-uy*retract};
      }
    }

    return `${aL.x},${aL.y} ${bL.x},${bL.y} ${bR.x},${bR.y} ${aR.x},${aR.y}`;
  }

  function onDown(e: any) {
    if (e.button===1||(e.touches?.length>=2)) {
      isPanRef.current=true;
      const ct=e.touches
        ?{clientX:(e.touches[0].clientX+e.touches[1].clientX)/2,clientY:(e.touches[0].clientY+e.touches[1].clientY)/2}:e;
      lastPanPt.current={x:ct.clientX,y:ct.clientY};
      if(e.touches?.length===2)
        lastPinch.current=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      return;
    }
    const raw = toSvg(e);
    const pt = snapPt(raw);

    if (tool==="select") {
      const join = findJoin(raw);
      if (join) {
        const r = svgRef.current!.getBoundingClientRect();
        setJoinMenu({...join, screenX:(join.jPt.x+pan.x)*zoom, screenY:(join.jPt.y+pan.y)*zoom});
      } else setJoinMenu(null);
      return;
    }
    setJoinMenu(null);
    if (!curPt) { setCurPt(pt); }
    else {
      if (segLen(curPt,pt)>4)
        setShapes(s=>[...s,{id:Date.now(),type:tool,a:curPt,b:pt,spessore,joinA:"miter",joinB:"miter"}]);
      setCurPt(pt);
    }
  }

  function onMove(e: any) {
    const ct = e.touches ? e.touches[0] : e;
    if (isPanRef.current) {
      if (e.touches?.length===2 && lastPinch.current) {
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        setZoom(z=>Math.max(0.1,Math.min(8,z*(d/lastPinch.current))));
        lastPinch.current=d;
      }
      setPan(p=>({x:p.x+(ct.clientX-lastPanPt.current.x)/zoom,y:p.y+(ct.clientY-lastPanPt.current.y)/zoom}));
      lastPanPt.current={x:ct.clientX,y:ct.clientY};
      return;
    }
    setMousePos(snapPt(toSvg(e)));
  }

  function onUp() { isPanRef.current=false; lastPinch.current=null; }
  function onDblClick() { if(tool!=="select") setCurPt(null); }
  function onWheel(e: any) {
    e.preventDefault();
    const nz=Math.max(0.1,Math.min(8,zoom*(e.deltaY<0?1.12:0.89)));
    const r=svgRef.current!.getBoundingClientRect();
    const mx=(e.clientX-r.left)/zoom,my=(e.clientY-r.top)/zoom;
    setPan(p=>({x:p.x-mx*(1-zoom/nz),y:p.y-my*(1-zoom/nz)}));
    setZoom(nz);
  }
  function onKeyDown(e: any) {
    if (e.key==="Escape") { setCurPt(null); setJoinMenu(null); }
    if ((e.key==="z"||e.key==="Z")&&(e.ctrlKey||e.metaKey)) {
      if(curPt) setCurPt(null); else setShapes(s=>s.slice(0,-1));
    }
  }

  function findJoin(pt: any) {
    const tol = 20/zoom;
    for(let i=0;i<shapes.length;i++) {
      for(let j=i+1;j<shapes.length;j++) {
        const si=shapes[i], sj=shapes[j];
        for(const pi of [si.a,si.b]) {
          for(const pj of [sj.a,sj.b]) {
            if(Math.hypot(pi.x-pj.x,pi.y-pj.y)<2 && Math.hypot(pt.x-pi.x,pt.y-pi.y)<tol) {
              return {
                jPt:pi, segA:si, segB:sj,
                endA:Math.hypot(si.a.x-pi.x,si.a.y-pi.y)<2?"a":"b",
                endB:Math.hypot(sj.a.x-pi.x,sj.a.y-pi.y)<2?"a":"b"
              };
            }
          }
        }
      }
    }
    return null;
  }

  // A vince → A wins al suo endpoint, B loses al suo endpoint
  // B vince → B wins al suo endpoint, A loses al suo endpoint
  function applyJoin(winner: "A"|"B") {
    if(!joinMenu) return;
    const {segA,segB,endA,endB}=joinMenu;
    setShapes(s=>s.map(sh=>{
      if(sh.id===segA.id) {
        const k=endA==="a"?"joinA":"joinB";
        return {...sh,[k]:winner==="A"?"wins":"loses"};
      }
      if(sh.id===segB.id) {
        const k=endB==="a"?"joinA":"joinB";
        return {...sh,[k]:winner==="B"?"wins":"loses"};
      }
      return sh;
    }));
    setJoinMenu(null);
  }

  function getAdj(s:any) {
    const EPS = 3; // tolleranza snap
    // Solo segmenti dello stesso tipo — muro non si fonde con oggetto
    const others=shapes.filter((x:any)=>x.id!==s.id && x.type===s.type);

    // Cerca segmento il cui endpoint tocca s.a
    // prevB = il punto OPPOSTO dell'adiacente (per calcolare la direzione entrante)
    let prevSeg:any=null, prevB:any=null;
    for(const x of others) {
      if(Math.hypot(x.b.x-s.a.x,x.b.y-s.a.y)<EPS) { prevSeg=x; prevB=x.a; break; }
      if(Math.hypot(x.a.x-s.a.x,x.a.y-s.a.y)<EPS) { prevSeg=x; prevB=x.b; break; }
    }

    // Cerca segmento il cui endpoint tocca s.b
    let nextSeg:any=null, nextA:any=null;
    for(const x of others) {
      if(x.id===prevSeg?.id) continue; // non riusare lo stesso
      if(Math.hypot(x.a.x-s.b.x,x.a.y-s.b.y)<EPS) { nextSeg=x; nextA=x.b; break; }
      if(Math.hypot(x.b.x-s.b.x,x.b.y-s.b.y)<EPS) { nextSeg=x; nextA=x.a; break; }
    }

    return {
      prevB,
      nextA,
      prevSp:prevSeg?.spessore||s.spessore,
      nextSp:nextSeg?.spessore||s.spessore,
    };
  }

  function renderSeg(a:any,b:any,type:string,sp:number,preview=false,id:any=null,
    prevB:any=null,nextA:any=null,joinA="miter",joinB="miter",
    winnerSpA:number=sp,winnerSpB:number=sp) {
    const col=type==="oggetto"?"#3B7FE0":"#1A2B4A";
    const fill=type==="oggetto"?"rgba(59,127,224,0.12)":"rgba(26,43,74,0.14)";
    const len=segLen(a,b);
    const poly=segPolygon(a,b,sp,
      preview?null:prevB, preview?null:nextA,
      preview?"miter":joinA, preview?"miter":joinB,
      winnerSpA, winnerSpB
    );
    const mx2=(a.x+b.x)/2,my2=(a.y+b.y)/2;
    const ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
    const fixAng=Math.abs(ang)>90?ang+180:ang;
    return (
      <g key={id||"prev"}>
        <polygon points={poly}
          fill={preview?fill.replace("0.12","0.04").replace("0.14","0.04"):fill}
          stroke={col} strokeWidth={preview?"1":"1.5"} strokeLinejoin="miter" strokeMiterlimit="10"/>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={type==="oggetto"?"#93C5FD":"#94A3B8"} strokeWidth="0.5" strokeDasharray="5,4"/>
        {!preview&&len>15&&<g>
          <rect x={mx2-18} y={my2-8} width={36} height={14} rx="3"
            fill={type==="oggetto"?"rgba(59,127,224,0.9)":"rgba(26,43,74,0.9)"}/>
          <text x={mx2} y={my2+4} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="800"
            transform={`rotate(${fixAng},${mx2},${my2})`}>{lenLabel(len)}</text>
        </g>}
      </g>
    );
  }

  const joinPoints=React.useMemo(()=>{
    const pts:any[]=[];
    for(let i=0;i<shapes.length;i++)
      for(let j=i+1;j<shapes.length;j++){
        const si=shapes[i],sj=shapes[j];
        for(const pi of [si.a,si.b])
          for(const pj of [sj.a,sj.b])
            if(Math.hypot(pi.x-pj.x,pi.y-pj.y)<2) pts.push({x:pi.x,y:pi.y,si,sj});
      }
    return pts;
  },[shapes]);

  const liveLen=curPt&&mousePos&&tool!=="select"?lenLabel(segLen(curPt,mousePos)):"";
  const col=tool==="muro"?"#1A2B4A":tool==="oggetto"?"#3B7FE0":"#D08008";
  const bs2=(on=false,c="#031631")=>({
    padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,
    background:on?c:"#fff",color:on?"#fff":"#44474d",
    border:"1.5px solid "+(on?c:"rgba(197,198,206,0.5)"),
  });

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,outline:"none"}}
      tabIndex={0} onKeyDown={onKeyDown}>
      <div style={{display:"flex",gap:5,padding:"7px 10px",flexWrap:"wrap",alignItems:"center",
        background:"#fff",borderBottom:"1px solid rgba(197,198,206,0.3)",flexShrink:0}}>
        <div onClick={()=>{setTool("muro");setCurPt(null);setJoinMenu(null);}} style={bs2(tool==="muro","#1A2B4A")}>▬ Muro</div>
        <div onClick={()=>{setTool("oggetto");setCurPt(null);setJoinMenu(null);}} style={bs2(tool==="oggetto","#3B7FE0")}>⬜ Oggetto</div>
        <div onClick={()=>{setTool("select");setCurPt(null);}} style={bs2(tool==="select","#D08008")}>✂ Angoli</div>
        <div style={{width:1,height:22,background:"rgba(197,198,206,0.4)"}}/>
        <select value={spessore} onChange={e=>setSpessore(parseInt(e.target.value))}
          style={{padding:"5px 8px",borderRadius:7,border:"1.5px solid rgba(197,198,206,0.5)",
            fontSize:12,fontWeight:700,cursor:"pointer",background:"#fff"}}>
          {[5,8,10,12,15,20,25,30].map(v=><option key={v} value={v}>{v}cm</option>)}
        </select>
        <div style={{width:1,height:22,background:"rgba(197,198,206,0.4)"}}/>
        <div onClick={()=>setZoom(z=>Math.min(8,z*1.2))} style={bs2()}>＋</div>
        <div style={{fontSize:11,fontWeight:700,color:"#64748B",minWidth:36,textAlign:"center"}}>{Math.round(zoom*100)}%</div>
        <div onClick={()=>setZoom(z=>Math.max(0.1,z*0.83))} style={bs2()}>－</div>
        <div onClick={()=>{setZoom(1);setPan({x:60,y:60});}} style={bs2()}>↺</div>
        <div style={{flex:1}}/>
        <div onClick={()=>{if(curPt)setCurPt(null);else setShapes(s=>s.slice(0,-1));}} style={bs2()}>↩</div>
        <div onClick={()=>{setShapes([]);setCurPt(null);setJoinMenu(null);}} style={{...bs2(),color:"#dc4444",borderColor:"#dc444440"}}>Reset</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 12px",
        background:"#F8FAFC",borderBottom:"1px solid rgba(197,198,206,0.2)",flexShrink:0}}>
        <span style={{fontSize:10,color:"#64748B",fontWeight:500}}>
          {tool==="select"?"Tap punto arancione → scegli quale lato vince"
           :!curPt?`Clic punto iniziale ${tool}`
           :"Clic punto finale · continua · Doppio clic per fermare"}
        </span>
        {liveLen&&<span style={{fontSize:13,fontWeight:800,color:col,
          background:"#EFF8FF",padding:"2px 10px",borderRadius:6,marginLeft:"auto"}}>{liveLen}</span>}
      </div>
      <div style={{flex:1,minHeight:0,position:"relative"}}>
        <svg ref={svgRef}
          style={{width:"100%",height:"100%",display:"block",background:"#F9F9FB",
            cursor:isPanRef.current?"grabbing":tool==="select"?"pointer":"crosshair",
            touchAction:"none",userSelect:"none"}}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onDoubleClick={onDblClick}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          onWheel={onWheel}>
          <g transform={`scale(${zoom}) translate(${pan.x},${pan.y})`}>
            <defs>
              <pattern id="lib-sm" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"/>
              </pattern>
              <pattern id="lib-lg" width={GRID*5} height={GRID*5} patternUnits="userSpaceOnUse">
                <rect width={GRID*5} height={GRID*5} fill="url(#lib-sm)"/>
                <path d={`M ${GRID*5} 0 L 0 0 0 ${GRID*5}`} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect x={-9999} y={-9999} width={19998} height={19998} fill="url(#lib-lg)"/>
            <line x1={-9999} y1={0} x2={9999} y2={0} stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
            <line x1={0} y1={-9999} x2={0} y2={9999} stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
            {shapes.map((s:any)=>{
              const {prevB,nextA,prevSp,nextSp}=getAdj(s);
              return renderSeg(s.a,s.b,s.type,s.spessore,false,s.id,prevB,nextA,s.joinA||"miter",s.joinB||"miter",prevSp,nextSp);
            })}
            {curPt&&mousePos&&tool!=="select"&&renderSeg(curPt,mousePos,tool==="select"?"muro":tool,spessore,true)}
            {curPt&&<circle cx={curPt.x} cy={curPt.y} r={6/zoom} fill="#dc4444" stroke="#fff" strokeWidth={2/zoom}/>}
            {tool==="select"&&joinPoints.map((jp:any,i:number)=>(
              <circle key={i} cx={jp.x} cy={jp.y} r={8/zoom}
                fill={joinMenu&&Math.hypot(joinMenu.jPt.x-jp.x,joinMenu.jPt.y-jp.y)<2?"#dc4444":"#D08008"}
                stroke="#fff" strokeWidth={2/zoom} style={{cursor:"pointer"}}/>
            ))}
            {mousePos&&tool!=="select"&&<circle cx={mousePos.x} cy={mousePos.y} r={3/zoom}
              stroke={col} strokeWidth={1/zoom} fill="rgba(59,127,224,0.2)"/>}
          </g>
        </svg>

        {joinMenu&&(
          <div style={{
            position:"absolute",
            left:Math.min(Math.max(joinMenu.screenX-75,8),240),
            top:Math.max(joinMenu.screenY-110,8),
            background:"#fff",borderRadius:12,padding:"12px",
            boxShadow:"0 4px 24px rgba(0,0,0,0.18)",
            border:"1px solid #E2E8F0",zIndex:100,width:160,
          }}>
            <div style={{fontSize:11,fontWeight:800,color:"#1A2B4A",marginBottom:10,textAlign:"center"}}>
              Chi passa sopra?
            </div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <div onClick={()=>applyJoin("A")}
                style={{flex:1,padding:"10px 4px",borderRadius:8,cursor:"pointer",textAlign:"center",
                  background:"rgba(26,43,74,0.08)",border:"2px solid #1A2B4A"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#1A2B4A"}}>A</div>
                <div style={{fontSize:9,color:"#64748B",marginTop:2}}>vince</div>
              </div>
              <div onClick={()=>applyJoin("B")}
                style={{flex:1,padding:"10px 4px",borderRadius:8,cursor:"pointer",textAlign:"center",
                  background:"rgba(59,127,224,0.08)",border:"2px solid #3B7FE0"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#3B7FE0"}}>B</div>
                <div style={{fontSize:9,color:"#64748B",marginTop:2}}>vince</div>
              </div>
            </div>
            <div onClick={()=>{
              const {segA,segB,endA,endB}=joinMenu;
              setShapes(s=>s.map(sh=>{
                if(sh.id===segA.id) return {...sh,[endA==="a"?"joinA":"joinB"]:"miter"};
                if(sh.id===segB.id) return {...sh,[endB==="a"?"joinA":"joinB"]:"miter"};
                return sh;
              }));
              setJoinMenu(null);
            }} style={{textAlign:"center",fontSize:10,color:"#94A3B8",cursor:"pointer",padding:"4px"}}>
              ↺ Ripristina miter
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DisegnoTecnico({ vanoId, vanoNome, vanoDisegno, realW: propRealW, realH: propRealH, onUpdate, onUpdateField, onClose, T }) {
  const [viewTab, setViewTab] = React.useState("disegno");
  const [menuTab, setMenuTab] = React.useState<"struttura"|"profili"|"aperture"|"sensi"|"strumenti"|null>(null);
  const [vista, setVista] = React.useState<"interna"|"esterna">("interna");

  const [dimEdit, setDimEdit] = React.useState<{id: any, val: string, x: number, y: number} | null>(null);
  const realW = propRealW || 1200;
  const realH = propRealH || 1000;
                            const dw = vanoDisegno || { elements: [], selectedId: null, drawMode: null, history: [] };
                            const els = dw.elements || [];
                            const selId = dw.selectedId || null;
                            const drawMode = dw.drawMode || null; // "line"|"apertura"|"place-anta"|"place-vetro"|"place-ap"
                            // dwRef: sempre aggiornato, usato nei click handler per evitare stale closure
                            const dwRef = React.useRef(dw);
                            dwRef.current = dw;
                            // Refs per pinch/pan touch (SVG principale canvas mobile)
                            const _lastPinch = React.useRef<number|null>(null);
                            const _panStart = React.useRef<{x:number,y:number,panX:number,panY:number}|null>(null);
                            const placeApType = dw._placeApType || "SX";
                            const zoom = dw._zoom || 1;
                            const panX = dw._panX || 0, panY = dw._panY || 0;
                            const canvasW = Math.min(window.innerWidth > 768 ? 900 : window.innerWidth - 8, window.innerWidth - 8);
                            const GRID = 1; // movimento fluido al pixel
                            // Touch detection: dita richiedono raggio molto piu' grande del mouse
                            const _isTouch = typeof window !== "undefined" && (("ontouchstart" in window) || (navigator.maxTouchPoints > 0));
                            // Base: 120 su touch (pollice + imprecisione), 28 mouse. Diviso per zoom.
                            const SNAP_R = (_isTouch ? 60 : 12) / Math.max(0.4, (dw._zoom || 1));

                            const aspect = realW / realH;
                            const PAD = 24, PAD_DIM = 28;
                            const maxW = canvasW - PAD * 2 - PAD_DIM;
                            // Compute content bounds (considering multiple frames and freeLines)
                            let contentW = maxW, contentH = maxW / aspect;
                            // No height cap — use full space
                            if (contentH > maxW * 1.5) { contentH = maxW * 1.5; contentW = contentH * aspect; }
                            let fW = contentW, fH = contentH;
                            // For multi-frame: compute bounding box of all frames
                            const allFrames = els.filter(e => e.type === "rect");
                            if (allFrames.length > 1) {
                              const bx1 = Math.min(...allFrames.map(f => f.x));
                              const by1 = Math.min(...allFrames.map(f => f.y));
                              const bx2 = Math.max(...allFrames.map(f => f.x + f.w));
                              const by2 = Math.max(...allFrames.map(f => f.y + f.h));
                              fW = bx2 - bx1 + PAD; fH = by2 - by1 + PAD;
                            }
                            const baseCanvasH = Math.max(400, fH + PAD * 2 + PAD_DIM);
                            const canvasH = baseCanvasH;
                            const fX = PAD, fY = PAD;
                            const snap = (v2) => Math.round(v2 / GRID) * GRID;

                            // ══ CELL DETECTION ══
                            const frames = els.filter(e => e.type === "rect");
                            const frame = frames[0] || null; // primary frame for compat
                            const allMontanti = els.filter(e => e.type === "montante");
                            const allTraversi = els.filter(e => e.type === "traverso");
                            const TK_FRAME = 6, TK_MONT = 7, TK_ANTA = 9, TK_PORTA = 10, TK_SOGLIA = 3, TK_ZOCCOLO = 8, TK_FASCIA = 5, TK_PROFCOMP = 4;
                            const HM = TK_MONT / 2;

                            // ══ POLYGONS from freeLines — tutte le catene chiuse ══
                            const getPolygons = () => {
                              const lines = els.filter(e => e.type === "freeLine");
                              if (lines.length < 3) return [];
                              const CONN = 15;
                              const usedGlobal = new Set();
                              const result = [];
                              const buildChain = (startIdx) => {
                                const used = new Set();
                                const pts = [];
                                const addP = (x, y) => { const k = `${Math.round(x)},${Math.round(y)}`; if (!pts.length || k !== `${Math.round(pts[pts.length-1][0])},${Math.round(pts[pts.length-1][1])}`) pts.push([x, y]); };
                                const fl = lines[startIdx];
                                addP(fl.x1, fl.y1); addP(fl.x2, fl.y2); used.add(startIdx);
                                for (let it = 0; it < lines.length; it++) {
                                  const last = pts[pts.length-1];
                                  let found = false;
                                  for (let li = 0; li < lines.length; li++) {
                                    if (used.has(li) || usedGlobal.has(li)) continue;
                                    const l = lines[li];
                                    if (Math.hypot(l.x1-last[0],l.y1-last[1])<CONN) { addP(l.x2,l.y2); used.add(li); found=true; break; }
                                    if (Math.hypot(l.x2-last[0],l.y2-last[1])<CONN) { addP(l.x1,l.y1); used.add(li); found=true; break; }
                                  }
                                  if (!found) break;
                                }
                                if (pts.length < 3) return null;
                                const first = pts[0], lastPt = pts[pts.length-1];
                                if (Math.hypot(first[0]-lastPt[0],first[1]-lastPt[1]) < CONN) {
                                  used.forEach(i => usedGlobal.add(i));
                                  return pts;
                                }
                                return null;
                              };
                              for (let i = 0; i < lines.length; i++) {
                                if (usedGlobal.has(i)) continue;
                                const chain = buildChain(i);
                                if (chain) result.push(chain);
                              }
                              return result;
                            };
                            const polys = getPolygons();
                            const poly = polys.length > 0 ? polys.reduce((a,b) => {
                              const area = (p) => Math.abs(p.reduce((s,pt,i)=>{ const q=p[(i+1)%p.length]; return s+(pt[0]*q[1]-q[0]*pt[1]); },0)/2);
                              return area(a) >= area(b) ? a : b;
                            }) : null;
                            // Poly con virtualClose inclusa — solo per calcolo anta
                            const _getPolysVC = () => {
                              const vcs = els.filter(e => e.type === "virtualClose");
                              if (vcs.length === 0) return polys;
                              const lines = [...els.filter(e => e.type === "freeLine"), ...vcs];
                              if (lines.length < 3) return polys;
                              const CONN = 30;
                              const usedG = new Set();
                              const res: number[][][] = [];
                              for (let si = 0; si < lines.length; si++) {
                                if (usedG.has(si)) continue;
                                const used = new Set<number>();
                                const pts: number[][] = [];
                                const addP = (x:number,y:number) => { const k=`${Math.round(x)},${Math.round(y)}`; if(!pts.length||k!==`${Math.round(pts[pts.length-1][0])},${Math.round(pts[pts.length-1][1])}`) pts.push([x,y]); };
                                addP(lines[si].x1, lines[si].y1); addP(lines[si].x2, lines[si].y2); used.add(si);
                                for (let it=0; it<lines.length; it++) {
                                  const last=pts[pts.length-1]; let found=false;
                                  for (let li=0; li<lines.length; li++) {
                                    if (used.has(li)||usedG.has(li)) continue;
                                    const l=lines[li];
                                    if (Math.hypot(l.x1-last[0],l.y1-last[1])<CONN) { addP(l.x2,l.y2); used.add(li); found=true; break; }
                                    if (Math.hypot(l.x2-last[0],l.y2-last[1])<CONN) { addP(l.x1,l.y1); used.add(li); found=true; break; }
                                  }
                                  if (!found) break;
                                }
                                if (pts.length>=3 && Math.hypot(pts[0][0]-pts[pts.length-1][0],pts[0][1]-pts[pts.length-1][1])<CONN) {
                                  used.forEach(i=>usedG.add(i)); res.push(pts);
                                }
                              }
                              return res.length > 0 ? res : polys;
                            };
                            const polyVC = (() => {
                              const pvc = _getPolysVC();
                              return pvc.length > 0 ? pvc.reduce((a,b) => {
                                const area = (p: number[][]) => Math.abs(p.reduce((s,pt,i)=>{ const q=p[(i+1)%p.length]; return s+(pt[0]*q[1]-q[0]*pt[1]); },0)/2);
                                return area(a) >= area(b) ? a : b;
                              }) : null;
                            })();

                            // ══ Line-segment intersection helpers ══
                            const segIntersectV = (x, pts2) => {
                              // Find Y values where vertical line x=X intersects polygon edges
                              const ys = [];
                              for (let i = 0; i < pts2.length; i++) {
                                const a = pts2[i], b = pts2[(i + 1) % pts2.length];
                                const minX = Math.min(a[0], b[0]), maxX = Math.max(a[0], b[0]);
                                if (x >= minX - 1 && x <= maxX + 1 && Math.abs(b[0] - a[0]) > 0.5) {
                                  const t = (x - a[0]) / (b[0] - a[0]);
                                  if (t >= -0.01 && t <= 1.01) ys.push(a[1] + t * (b[1] - a[1]));
                                }
                              }
                              ys.sort((a2, b2) => a2 - b2);
                              return ys.length >= 2 ? [ys[0], ys[ys.length - 1]] : null;
                            };
                            const segIntersectH = (y, pts2) => {
                              const xs = [];
                              for (let i = 0; i < pts2.length; i++) {
                                const a = pts2[i], b = pts2[(i + 1) % pts2.length];
                                const minY = Math.min(a[1], b[1]), maxY = Math.max(a[1], b[1]);
                                if (y >= minY - 1 && y <= maxY + 1 && Math.abs(b[1] - a[1]) > 0.5) {
                                  const t = (y - a[1]) / (b[1] - a[1]);
                                  if (t >= -0.01 && t <= 1.01) xs.push(a[0] + t * (b[0] - a[0]));
                                }
                              }
                              xs.sort((a2, b2) => a2 - b2);
                              return xs.length >= 2 ? [xs[0], xs[xs.length - 1]] : null;
                            };

                            // ══ BSP Cell Splitting ══
                            const bspSplit = (startCells) => {
                              let cl = startCells;
                              allMontanti.forEach((m, mi) => {
                                const next = [];
                                cl.forEach(c => {
                                  const my1 = m.y1 !== undefined ? m.y1 : c.y;
                                  const my2 = m.y2 !== undefined ? m.y2 : c.y + c.h;
                                  if (m.x > c.x + HM + 2 && m.x < c.x + c.w - HM - 2 && my1 <= c.y + c.h * 0.4 && my2 >= c.y + c.h * 0.6) {
                                    next.push({ x: c.x, y: c.y, w: m.x - HM - c.x, h: c.h, id: c.id + "L" + mi });
                                    next.push({ x: m.x + HM, y: c.y, w: c.x + c.w - m.x - HM, h: c.h, id: c.id + "R" + mi });
                                  } else { next.push(c); }
                                });
                                cl = next;
                              });
                              allTraversi.forEach((t, ti) => {
                                const next = [];
                                cl.forEach(c => {
                                  const tx1 = t.x1 !== undefined ? t.x1 : c.x;
                                  const tx2 = t.x2 !== undefined ? t.x2 : c.x + c.w;
                                  if (t.y > c.y + HM + 2 && t.y < c.y + c.h - HM - 2 && tx1 <= c.x + 2 && tx2 >= c.x + c.w - 2) {
                                    next.push({ x: c.x, y: c.y, w: c.w, h: t.y - HM - c.y, id: c.id + "T" + ti });
                                    next.push({ x: c.x, y: t.y + HM, w: c.w, h: c.y + c.h - t.y - HM, id: c.id + "B" + ti });
                                  } else { next.push(c); }
                                });
                                cl = next;
                              });
                              return cl;
                            };
                            const getCells = () => {
                              // Multi-frame support (zoppi): each frame gets its own cells
                              if (frames.length > 0) {
                                let allCells = [];
                                frames.forEach((fr, fi) => {
                                  const iX = fr.x + TK_FRAME, iY = fr.y + TK_FRAME;
                                  const iW = fr.w - TK_FRAME * 2, iH = fr.h - TK_FRAME * 2;
                                  if (iW < 4 || iH < 4) return;
                                  const startCells = [{ x: iX, y: iY, w: iW, h: iH, id: `F${fi}` }];
                                  allCells = allCells.concat(bspSplit(startCells));
                                });
                                return allCells;
                              }
                              // Polygon cells
                              if (poly) {
                                const allX2 = poly.map(p => p[0]), allY2 = poly.map(p => p[1]);
                                const pL = Math.min(...allX2) + TK_FRAME, pR = Math.max(...allX2) - TK_FRAME;
                                const pT = Math.min(...allY2) + TK_FRAME, pB = Math.max(...allY2) - TK_FRAME;
                                return bspSplit([{ x: pL, y: pT, w: pR - pL, h: pB - pT, id: "P0" }]);
                              }
                              // Fallback: poly non chiuso — usa bbox delle freeLine senza subType
                              const _bboxLines = els.filter((e: any) => e.type === "freeLine" && !e.subType);
                              if (_bboxLines.length >= 2) {
                                const _bX = _bboxLines.flatMap((l: any) => [l.x1, l.x2]);
                                const _bY = _bboxLines.flatMap((l: any) => [l.y1, l.y2]);
                                const _bbox = { x: Math.min(..._bX) + TK_FRAME, y: Math.min(..._bY) + TK_FRAME, w: Math.max(..._bX) - Math.min(..._bX) - TK_FRAME * 2, h: Math.max(..._bY) - Math.min(..._bY) - TK_FRAME * 2, id: "BBOX" };
                                if (_bbox.w > 10 && _bbox.h > 10) return bspSplit([_bbox]);
                              }
                              return [];
                            };
                            const cells = getCells();

                            const findCellAt = (mx, my) => {
                              return cells.find(c2 => mx >= c2.x && mx <= c2.x + c2.w && my >= c2.y && my <= c2.y + c2.h);
                            };

                            // ══ Snap points ══
                            const getSnapPoints = () => {
                              const pts = [];
                              // Frame: angoli + mezzerie + bordi continui
                              frames.forEach(fr => {
                                const fx = fr.x, fy = fr.y, fw = fr.w, fh2 = fr.h;
                                pts.push({x:fx,y:fy},{x:fx+fw,y:fy},{x:fx,y:fy+fh2},{x:fx+fw,y:fy+fh2});
                                pts.push({x:fx+fw/2,y:fy},{x:fx+fw/2,y:fy+fh2},{x:fx,y:fy+fh2/2},{x:fx+fw,y:fy+fh2/2});
                                for (let t = GRID; t < fw; t += GRID) pts.push({x:fx+t,y:fy},{x:fx+t,y:fy+fh2});
                                for (let t = GRID; t < fh2; t += GRID) pts.push({x:fx,y:fy+t},{x:fx+fw,y:fy+t});
                                // ── BORDO INTERNO del telaio (dove si aggancia lo zoccolo/soglia al telaio) ──
                                // Lati interni a filo TK_FRAME dall'esterno
                                // Flag _antaSnap + _antaOri, così profileMode (zoccolo/soglia) li vede.
                                const ix1 = fx + TK_FRAME, ix2 = fx + fw - TK_FRAME;
                                const iy1 = fy + TK_FRAME, iy2 = fy + fh2 - TK_FRAME;
                                // 4 angoli interni (senza _antaSnap, per snap generale)
                                pts.push({x:ix1,y:iy1},{x:ix2,y:iy1},{x:ix1,y:iy2},{x:ix2,y:iy2});
                                // Bordi interni continui ogni 2px, con flag _antaSnap per attivarsi in profileMode
                                // Top (ori H) e Bot (ori H): per soglia/zoccolo orizzontali
                                for (let xx = ix1; xx <= ix2; xx += 2) {
                                  pts.push({x:xx, y:iy1, _antaSnap:true, _antaOri:"H"});
                                  pts.push({x:xx, y:iy2, _antaSnap:true, _antaOri:"H"});
                                }
                                // Left (ori V) e Right (ori V): per profili verticali
                                for (let yy = iy1; yy <= iy2; yy += 2) {
                                  pts.push({x:ix1, y:yy, _antaSnap:true, _antaOri:"V"});
                                  pts.push({x:ix2, y:yy, _antaSnap:true, _antaOri:"V"});
                                }
                              });
                              // Celle
                              cells.forEach(c2 => {
                                pts.push({x:c2.x,y:c2.y},{x:c2.x+c2.w,y:c2.y},{x:c2.x,y:c2.y+c2.h},{x:c2.x+c2.w,y:c2.y+c2.h});
                              });
                              // Montanti — estremità + mezza altezza
                              els.filter(e => e.type === "montante").forEach(m => {
                                const my1 = m.y1 ?? (frame ? frame.y : fY);
                                const my2 = m.y2 ?? (frame ? frame.y + frame.h : fY + fH);
                                pts.push({x:m.x, y:my1},{x:m.x, y:my2},{x:m.x, y:(my1+my2)/2});
                                // Snap lungo tutto il montante (ogni GRID pixel)
                                for (let y = my1 + GRID; y < my2; y += GRID) pts.push({x:m.x, y});
                              });
                              // Traversi — bordi superiore e inferiore + centro
                              els.filter(e => e.type === "traverso").forEach(t => {
                                const tx1 = t.x1 ?? (frame ? frame.x : fX);
                                const tx2 = t.x2 ?? (frame ? frame.x + frame.w : fX + fW);
                                const HT2 = TK_MONT / 2;
                                // centro, bordo sup, bordo inf
                                pts.push({x:tx1, y:t.y},{x:tx2, y:t.y},{x:(tx1+tx2)/2, y:t.y});
                                pts.push({x:tx1, y:t.y-HT2},{x:tx2, y:t.y-HT2},{x:(tx1+tx2)/2, y:t.y-HT2});
                                pts.push({x:tx1, y:t.y+HT2},{x:tx2, y:t.y+HT2},{x:(tx1+tx2)/2, y:t.y+HT2});
                                for (let x = tx1 + GRID; x < tx2; x += GRID) pts.push({x, y:t.y});
                              });
                              // FreeLine — snap a bordi esatti del profilo renderizzato
                              // Bordo sup zoccolo = l.y1 - halfT + TK_FRAME, bordo inf = l.y1 + halfT + TK_FRAME
                              const tkSnapMap: any = { soglia: TK_SOGLIA, zoccolo: TK_ZOCCOLO, fascia: TK_FASCIA, profcomp: TK_PROFCOMP };
                              els.filter(e => e.type === "freeLine").forEach(l => {
                                const len = Math.hypot(l.x2-l.x1, l.y2-l.y1) || 1;
                                const ux = (l.x2-l.x1)/len, uy = (l.y2-l.y1)/len;
                                const hT = l.subType ? (tkSnapMap[l.subType] || TK_FRAME) : TK_FRAME;
                                const isHz = l.subType && Math.abs(l.y2-l.y1) <= Math.abs(l.x2-l.x1) + 0.5;
                                const mx2 = (l.x1+l.x2)/2, my2 = (l.y1+l.y2)/2;
                                // Estremità e centro sulla linea
                                pts.push({x:l.x1,y:l.y1},{x:l.x2,y:l.y2},{x:mx2,y:my2});
                                if (isHz) {
                                  // Bordo superiore renderizzato: ey1 = l.y1 - hT + TK_FRAME
                                  const yTop = l.y1 - hT + TK_FRAME;
                                  // Bordo inferiore renderizzato: ey1 + ny*2 = yTop + hT*2
                                  const yBot = yTop + hT * 2;
                                  pts.push({x:l.x1,y:yTop},{x:l.x2,y:yTop},{x:mx2,y:yTop});
                                  pts.push({x:l.x1,y:yBot},{x:l.x2,y:yBot},{x:mx2,y:yBot});
                                  // Snap ogni GRID lungo i bordi
                                  for (let d = GRID; d < len; d += GRID) {
                                    pts.push({x:l.x1+ux*d, y:yTop});
                                    pts.push({x:l.x1+ux*d, y:yBot});
                                  }
                                }
                                // Snap lungo la linea ogni GRID pixel
                                for (let d = GRID; d < len; d += GRID) pts.push({x:l.x1+ux*d, y:l.y1+uy*d});
                              });
                              // ── SNAP sui lati ELIMINATI delle ante (aggancio profilo allo spazio vuoto) ──
                              // Flag _antaSnap = true → questi punti hanno raggio snap più ampio (vedi findSnap)
                              els.filter(e => e.type === "innerRect" && (e.hiddenSides || []).length > 0).forEach(a => {
                                const TK = a.subType === "porta" ? TK_PORTA : TK_ANTA;
                                const hid = a.hiddenSides || [];
                                const offLeft = hid.includes("left") ? 0 : TK;
                                const offRight = hid.includes("right") ? 0 : TK;
                                const offTop = hid.includes("top") ? 0 : TK;
                                const offBot = hid.includes("bot") ? 0 : TK;
                                const pushA = (p: any) => pts.push({ ...p, _antaSnap: true });
                                const pushAO = (p: any, ori: string) => pts.push({ ...p, _antaSnap: true, _antaOri: ori });
                                hid.forEach((side: string) => {
                                  if (side === "top") {
                                    const y = a.y + TK + 2;
                                    const x1 = a.x + offLeft - 2, x2 = a.x + a.w - offRight + 2;
                                    pushAO({x: x1, y}, "H"); pushAO({x: x2, y}, "H"); pushAO({x: (x1+x2)/2, y}, "H");
                                    for (let d = GRID; d < (x2-x1); d += GRID) pushAO({x: x1+d, y}, "H");
                                  } else if (side === "bot") {
                                    const y = a.y + a.h - TK + 2;
                                    const x1 = a.x + offLeft - 2, x2 = a.x + a.w - offRight + 2;
                                    pushAO({x: x1, y}, "H"); pushAO({x: x2, y}, "H"); pushAO({x: (x1+x2)/2, y}, "H");
                                    for (let d = GRID; d < (x2-x1); d += GRID) pushAO({x: x1+d, y}, "H");
                                  } else if (side === "left") {
                                    const x = a.x + TK + 2;
                                    const y1 = a.y + offTop - 2, y2 = a.y + a.h - offBot + 2;
                                    pushAO({x, y: y1}, "V"); pushAO({x, y: y2}, "V"); pushAO({x, y: (y1+y2)/2}, "V");
                                    for (let d = GRID; d < (y2-y1); d += GRID) pushAO({x, y: y1+d}, "V");
                                  } else if (side === "right") {
                                    const x = a.x + a.w - TK + 2;
                                    const y1 = a.y + offTop - 2, y2 = a.y + a.h - offBot + 2;
                                    pushAO({x, y: y1}, "V"); pushAO({x, y: y2}, "V"); pushAO({x, y: (y1+y2)/2}, "V");
                                    for (let d = GRID; d < (y2-y1); d += GRID) pushAO({x, y: y1+d}, "V");
                                  }
                                });
                              });
                              // ── SNAP esteso: spazio tra 2+ ante con stesso lato hidden allineato ──
                              // Esempio: 2 ante affiancate con lato "bot" eliminato → zoccolo deve passare anche nello spazio centrale
                              // FIX: pushAG ora porta anche _antaOri (H/V) così il secondo click forza l'allineamento rigido
                              const pushAG = (p: any, ori: string) => pts.push({ ...p, _antaSnap: true, _antaOri: ori });
                              const antasWithHidden = els.filter(e => e.type === "innerRect" && (e.hiddenSides || []).length > 0);
                              ["top", "bot"].forEach(sideKey => {
                                const group = antasWithHidden.filter(a => (a.hiddenSides || []).includes(sideKey));
                                if (group.length < 2) return;
                                // Raggruppa per Y allineata (tolleranza 5px)
                                const getY = (a: any) => { const tkA = a.subType==="porta"?TK_PORTA:TK_ANTA; return sideKey === "top" ? a.y + tkA + 2 : a.y + a.h - tkA + 2; };
                                const sorted = [...group].sort((a,b) => a.x - b.x);
                                for (let i = 0; i < sorted.length - 1; i++) {
                                  const a1 = sorted[i], a2 = sorted[i+1];
                                  const y1 = getY(a1), y2 = getY(a2);
                                  if (Math.abs(y1 - y2) > 5) continue; // non allineate
                                  const y = (y1 + y2) / 2;
                                  const xStart = a1.x + a1.w, xEnd = a2.x;
                                  if (xEnd <= xStart) continue;
                                  // Punti lungo lo spazio tra le due ante (orizzontale → _antaOri="H")
                                  pushAG({x: xStart, y}, "H"); pushAG({x: xEnd, y}, "H"); pushAG({x: (xStart+xEnd)/2, y}, "H");
                                  for (let d = 0; d <= (xEnd-xStart); d += GRID) pushAG({x: xStart+d, y}, "H");
                                }
                              });
                              ["left", "right"].forEach(sideKey => {
                                const group = antasWithHidden.filter(a => (a.hiddenSides || []).includes(sideKey));
                                if (group.length < 2) return;
                                const getX = (a: any) => { const tkA = a.subType==="porta"?TK_PORTA:TK_ANTA; return sideKey === "left" ? a.x + tkA + 2 : a.x + a.w - tkA + 2; };
                                const sorted = [...group].sort((a,b) => a.y - b.y);
                                for (let i = 0; i < sorted.length - 1; i++) {
                                  const a1 = sorted[i], a2 = sorted[i+1];
                                  const x1 = getX(a1), x2 = getX(a2);
                                  if (Math.abs(x1 - x2) > 5) continue;
                                  const x = (x1 + x2) / 2;
                                  const yStart = a1.y + a1.h, yEnd = a2.y;
                                  if (yEnd <= yStart) continue;
                                  // Verticale → _antaOri="V"
                                  pushAG({x, y: yStart}, "V"); pushAG({x, y: yEnd}, "V"); pushAG({x, y: (yStart+yEnd)/2}, "V");
                                  for (let d = 0; d <= (yEnd-yStart); d += GRID) pushAG({x, y: yStart+d}, "V");
                                }
                              });
                              return pts;
                            };
                            const findSnap = (mx, my) => {
                              const pts = getSnapPoints();
                              const chainStart = dw._chainStart;
                              const freeLines = els.filter(e => e.type === "freeLine");
                              const canClose = freeLines.length >= 3;
                              let best = null, bestD = SNAP_R;
                              const ANTA_SNAP_R = 60; // raggio snap per lati ante eliminati (domina su vertici telaio)
                              const isProfileMode = dw.drawMode === "line" && ["zoccolo","soglia","fascia","profcomp","soglia_rib"].includes(dw._lineSubType);
                              // FIX: in profileMode, i punti _antaSnap hanno PRIORITA' ASSOLUTA.
                              // Prima passo: cerco solo tra i punti _antaSnap con raggio esteso. Se trovo, vince.
                              if (isProfileMode) {
                                let bestAnta = null, bestAntaD = ANTA_SNAP_R;
                                pts.forEach(p => {
                                  if (!p._antaSnap) return;
                                  if (!canClose && chainStart && Math.hypot(p.x - chainStart.x, p.y - chainStart.y) < 20) return;
                                  const d = Math.hypot(p.x - mx, p.y - my);
                                  if (d < bestAntaD) { bestAntaD = d; bestAnta = p; }
                                });
                                if (bestAnta) { best = bestAnta; bestD = bestAntaD; }
                              }
                              // Secondo passo: fallback su punti normali solo se nessun anta ha matchato
                              if (!best) {
                                pts.forEach(p => {
                                  if (p._antaSnap) return; // già valutati sopra
                                  if (!canClose && chainStart && Math.hypot(p.x - chainStart.x, p.y - chainStart.y) < 20) return;
                                  const d = Math.hypot(p.x - mx, p.y - my);
                                  if (d < SNAP_R && d < bestD) { bestD = d; best = p; }
                                });
                              }
                              // Snap al chainStart (chiusura forma) solo se ≥3 segmenti e non montante/traverso
                              if (canClose && chainStart && !dw._lineSubType) {
                                const d = Math.hypot(chainStart.x - mx, chainStart.y - my);
                                if (d < bestD + 4) { best = chainStart; }
                              }
                              return best;
                            };

                            // ══ State helpers ══
                            const pushHistory = () => {
                              const hist = dw.history || [];
                              return [...hist.slice(-20), JSON.stringify(els)];
                            };
                            const setDW = (newEls, extra = {}) => {
                              const hist = pushHistory();
                              onUpdate({ ...dw, elements: newEls, history: hist, ...extra });
                            };
                            const setMode = (extra) => onUpdate({ ...dw, ...extra });

                            // ══ JUNCTIONS — rilevamento automatico punti di contatto ══
                            const junctions = React.useMemo(() => {
                              const result: any[] = [];
                              const JTOL = 18; // tolleranza px per rilevare contatto
                              const freeLines = els.filter(e => e.type === "freeLine");
                              const montanti = els.filter(e => e.type === "montante");
                              const traversi = els.filter(e => e.type === "traverso");
                              // freeLine vs freeLine
                              for (let i = 0; i < freeLines.length; i++) {
                                for (let j = i + 1; j < freeLines.length; j++) {
                                  const a = freeLines[i], b = freeLines[j];
                                  const pts = [{x:a.x1,y:a.y1},{x:a.x2,y:a.y2}];
                                  const pts2 = [{x:b.x1,y:b.y1},{x:b.x2,y:b.y2}];
                                  for (const pa of pts) for (const pb of pts2) {
                                    if (Math.hypot(pa.x-pb.x, pa.y-pb.y) < JTOL) {
                                      const existing = dw._junctions?.find((jj:any) => jj.elA === a.id && jj.elB === b.id);
                                      result.push({ id: `j_${a.id}_${b.id}`, ptX: (pa.x+pb.x)/2, ptY: (pa.y+pb.y)/2, elA: a.id, elB: b.id, type: existing?.type || "90", winner: existing?.winner || "A" });
                                    }
                                  }
                                }
                              }
                              // montante vs freeLine orizzontale
                              for (const m of montanti) {
                                const mx = m.x, my1 = m.y1 ?? (frame?.y || fY), my2 = m.y2 ?? (frame?.y+frame?.h || fY+fH);
                                for (const l of freeLines) {
                                  const pts = [{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}];
                                  for (const p of pts) {
                                    if (Math.abs(p.x - mx) < JTOL && (Math.abs(p.y - my1) < JTOL || Math.abs(p.y - my2) < JTOL)) {
                                      const existing = dw._junctions?.find((jj:any) => jj.elA === m.id && jj.elB === l.id);
                                      result.push({ id: `j_${m.id}_${l.id}`, ptX: mx, ptY: p.y, elA: m.id, elB: l.id, type: existing?.type || "90", winner: existing?.winner || "A" });
                                    }
                                  }
                                }
                              }
                              // montante vs traverso
                              for (const m of montanti) {
                                for (const t of traversi) {
                                  const tx1 = t.x1 ?? fX, tx2 = t.x2 ?? fX+fW;
                                  const my1 = m.y1 ?? fY, my2 = m.y2 ?? fY+fH;
                                  if (m.x > tx1 && m.x < tx2 && t.y > my1 && t.y < my2) {
                                    const existing = dw._junctions?.find((jj:any) => jj.elA === m.id && jj.elB === t.id);
                                    result.push({ id: `j_${m.id}_${t.id}`, ptX: m.x, ptY: t.y, elA: m.id, elB: t.id, type: existing?.type || "90", winner: existing?.winner || "A" });
                                  }
                                }
                              }
                              // Deduplica per id
                              const seen = new Set();
                              return result.filter(j => { if (seen.has(j.id)) return false; seen.add(j.id); return true; });
                            }, [els, dw._junctions]);

                            const [junctionEdit, setJunctionEdit] = React.useState<any>(null);

                            const undo = () => {
                              const hist = dw.history || [];
                              if (hist.length === 0) return;
                              const prev = JSON.parse(hist[hist.length - 1]);
                              onUpdate({ ...dw, elements: prev, history: hist.slice(0, -1), selectedId: null });
                            };

                            const getSvgXY = (e2, svg) => {
                              const r2 = svg.getBoundingClientRect();
                              const clientX = e2.touches ? e2.touches[0].clientX : e2.clientX;
                              const clientY = e2.touches ? e2.touches[0].clientY : e2.clientY;
                              // Use SVG native coordinate transform (handles viewBox + scaling correctly)
                              const pt = svg.createSVGPoint();
                              pt.x = clientX;
                              pt.y = clientY;
                              const ctm = svg.getScreenCTM();
                              if (ctm) {
                                const svgPt = pt.matrixTransform(ctm.inverse());
                                return { mx: svgPt.x, my: svgPt.y };
                              }
                              // Fallback manuale se getScreenCTM non disponibile
                              const px = clientX - r2.left;
                              const py = clientY - r2.top;
                              const scaleX = canvasW / r2.width;
                              const scaleY = canvasH / r2.height;
                              return { mx: panX + px * scaleX / zoom, my: panY + py * scaleY / zoom };
                            };

                            // ── Drag ──
                            const onDrag = (e2, elId) => {
                              if (drawMode) return;
                              e2.stopPropagation(); e2.preventDefault();
                              const svg = e2.currentTarget.closest("svg");
                              if (!svg) return;
                              const el = els.find(x => x.id === elId);
                              if (!el) return;
                              setMode({ selectedId: elId });
                              const { mx: sx, my: sy } = getSvgXY(e2, svg);
                              const orig = { ...el };
                              let latestEls = els;
                              const onM = (ev) => {
                                ev.preventDefault();
                                const { mx, my } = getSvgXY(ev, svg);
                                const dx = snap(mx - sx), dy = snap(my - sy);
                                const upd = els.map(x => {
                                  if (x.id !== elId) return x;
                                  // Snap a vertici vicini durante drag
                                  if (x.type === "montante") {
                                    const newX = snap(orig.x + dx);
                                    // Recalculate y1/y2 from polygon if present
                                    if (poly) {
                                      const ys = segIntersectV(newX, poly);
                                      if (ys) return { ...x, x: newX, y1: ys[0], y2: ys[1] };
                                    }
                                    return { ...x, x: newX };
                                  }
                                  if (x.type === "traverso") {
                                    const newY = snap(orig.y + dy);
                                    if (poly) {
                                      const xs2 = segIntersectH(newY, poly);
                                      if (xs2) return { ...x, y: newY, x1: xs2[0], x2: xs2[1] };
                                    }
                                    return { ...x, y: newY };
                                  }
                                  if (x.type === "circle") return { ...x, cx: orig.cx + dx, cy: orig.cy + dy };
                                  if (x.x1 !== undefined) return { ...x, x1: orig.x1 + dx, y1: orig.y1 + dy, x2: orig.x2 + dx, y2: orig.y2 + dy };
                                  if (x.x !== undefined) return { ...x, x: orig.x + dx, y: orig.y + dy };
                                  return x;
                                });
                                latestEls = upd;
                                // Live dim for montante/traverso
                                let dragDim = null;
                                if (el.type === "montante") {
                                  const newX = snap(orig.x + dx);
                                  if (frame) {
                                    const innerW = frame.w - TK_FRAME * 2;
                                    const posRatio = innerW > 0 ? (newX - frame.x - TK_FRAME) / innerW : 0.5;
                                    const leftMM = Math.round(Math.max(0, Math.min(realW, posRatio * realW)));
                                    const rightMM = realW - leftMM;
                                    const my1 = el.y1 !== undefined ? el.y1 : frame.y;
                                    const my2 = el.y2 !== undefined ? el.y2 : frame.y + frame.h;
                                    dragDim = { type: "v", x: newX, y1: my1, y2: my2, leftMM, rightMM };
                                  } else if (poly) {
                                    const pxs = poly.map(p => p[0]);
                                    const pL = Math.min(...pxs), pR = Math.max(...pxs);
                                    const posRatio = pR > pL ? (newX - pL) / (pR - pL) : 0.5;
                                    const leftMM = Math.round(Math.max(0, Math.min(realW, posRatio * realW)));
                                    const rightMM = realW - leftMM;
                                    const ys = segIntersectV(newX, poly);
                                    const my1 = ys ? ys[0] : Math.min(...poly.map(p => p[1]));
                                    const my2 = ys ? ys[1] : Math.max(...poly.map(p => p[1]));
                                    dragDim = { type: "v", x: newX, y1: my1, y2: my2, leftMM, rightMM };
                                  }
                                }
                                if (el.type === "traverso") {
                                  const newY = snap(orig.y + dy);
                                  if (frame) {
                                    const innerH = frame.h - TK_FRAME * 2;
                                    const posRatio = innerH > 0 ? (newY - frame.y - TK_FRAME) / innerH : 0.5;
                                    const topMM = Math.round(Math.max(0, Math.min(realH, posRatio * realH)));
                                    const botMM = realH - topMM;
                                    const tx1 = el.x1 !== undefined ? el.x1 : frame.x;
                                    const tx2 = el.x2 !== undefined ? el.x2 : frame.x + frame.w;
                                    dragDim = { type: "h", y: newY, x1: tx1, x2: tx2, topMM, botMM };
                                  } else if (poly) {
                                    const pys = poly.map(p => p[1]);
                                    const pT = Math.min(...pys), pB = Math.max(...pys);
                                    const posRatio = pB > pT ? (newY - pT) / (pB - pT) : 0.5;
                                    const topMM = Math.round(Math.max(0, Math.min(realH, posRatio * realH)));
                                    const botMM = realH - topMM;
                                    const xs2 = segIntersectH(newY, poly);
                                    const tx1 = xs2 ? xs2[0] : Math.min(...poly.map(p => p[0]));
                                    const tx2 = xs2 ? xs2[1] : Math.max(...poly.map(p => p[0]));
                                    dragDim = { type: "h", y: newY, x1: tx1, x2: tx2, topMM, botMM };
                                  }
                                }
                                onUpdate({ ...dw, elements: upd, selectedId: elId, _dragDim: dragDim });
                              };
                              const onU = () => {
                                document.removeEventListener("mousemove", onM); document.removeEventListener("mouseup", onU);
                                document.removeEventListener("touchmove", onM); document.removeEventListener("touchend", onU);
                                // Saldatura: snap finale a TUTTI i punti rilevanti (frame, montanti, traversi, freeLine)
                                const WELD = SNAP_R;
                                const buildWeldPts = (allEls) => {
                                  const pts = [];
                                  allEls.forEach(o => {
                                    // freeLine / apLine / righello — punti estremi
                                    if (o.x1 !== undefined) { pts.push({x:o.x1,y:o.y1}); pts.push({x:o.x2,y:o.y2}); }
                                    // frame rect — 4 angoli
                                    if (o.type === "rect") { pts.push({x:o.x,y:o.y},{x:o.x+o.w,y:o.y},{x:o.x,y:o.y+o.h},{x:o.x+o.w,y:o.y+o.h}); }
                                    // montante — top/bottom
                                    if (o.type === "montante") { const my1=o.y1??o.y, my2=o.y2??(o.y+(o.h||0)); pts.push({x:o.x,y:my1},{x:o.x,y:my2}); }
                                    // traverso — left/right
                                    if (o.type === "traverso") { const tx1=o.x1??o.x, tx2=o.x2??(o.x+(o.w||0)); pts.push({x:tx1,y:o.y},{x:tx2,y:o.y}); }
                                  });
                                  return pts;
                                };
                                const welded = latestEls.map(x => {
                                  if (x.id !== elId || x.x1 === undefined) return x;
                                  const otherPts = buildWeldPts(latestEls.filter(o => o.id !== elId));
                                  let nx1=x.x1, ny1=x.y1, nx2=x.x2, ny2=x.y2;
                                  otherPts.forEach(p => {
                                    if (Math.hypot(p.x-x.x1,p.y-x.y1)<WELD) { nx1=p.x; ny1=p.y; }
                                    if (Math.hypot(p.x-x.x2,p.y-x.y2)<WELD) { nx2=p.x; ny2=p.y; }
                                  });
                                  if (nx1!==x.x1||ny1!==x.y1||nx2!==x.x2||ny2!==x.y2) return {...x,x1:nx1,y1:ny1,x2:nx2,y2:ny2};
                                  return x;
                                });
                                onUpdate({ ...dw, elements: welded, selectedId: elId, _dragDim: null });
                              };
                              document.addEventListener("mousemove", onM); document.addEventListener("mouseup", onU);
                              document.addEventListener("touchmove", onM, { passive: false }); document.addEventListener("touchend", onU);
                            };

                            // ── SVG Click ──
                            const onSvgClick = (e2) => {
                              const svg = e2.currentTarget;
                              const { mx, my } = getSvgXY(e2, svg);
                              // Usa dwRef.current per avere sempre lo stato fresco (evita stale closure)
                              const dw = dwRef.current;
                              const els = dw.elements || [];
                              const drawMode = dw.drawMode || null;
                              // In modalità pan non creare elementi al click
                              if (drawMode === "pan") return;

                              // Place montante/traverso — click on cell OR polygon
                              if (drawMode === "place-mont") {
                                const cell = findCellAt(mx, my);
                                if (cell) {
                                  const cx = snap(mx);
                                  const clampedX = Math.max(cell.x + 10, Math.min(cell.x + cell.w - 10, cx));
                                  const tkMapLocal: any = { soglia: TK_SOGLIA, zoccolo: TK_ZOCCOLO, fascia: TK_FASCIA, profcomp: TK_PROFCOMP };
                                  const adjY = (y: number, dir: number) => {
                                    let result = y;
                                    els.filter(e => e.type === "freeLine" && Math.abs(e.y2-e.y1) <= Math.abs(e.x2-e.x1)+1).forEach(l => {
                                      const lHT = tkMapLocal[l.subType] || TK_FRAME;
                                      const lY = (l.y1+l.y2)/2;
                                      if (Math.abs(lY - y) < lHT*2+10) result = dir > 0 ? lY + lHT : lY - lHT;
                                    });
                                    return result;
                                  };
                                  if (poly) {
                                    const ys = segIntersectV(clampedX, poly);
                                    if (ys) setDW([...els, { id: Date.now(), type: "montante", x: clampedX, y1: adjY(ys[0],-1), y2: adjY(ys[1],1) }]);
                                  } else {
                                    setDW([...els, { id: Date.now(), type: "montante", x: clampedX, y1: adjY(cell.y,-1), y2: adjY(cell.y+cell.h,1) }]);
                                  }
                                } else if (poly) {
                                  const cx = snap(mx);
                                  const ys = segIntersectV(cx, poly);
                                  if (ys) setDW([...els, { id: Date.now(), type: "montante", x: cx, y1: ys[0], y2: ys[1] }]);
                                } else if (!frame) {
                                  setDW([...els, { id: Date.now(), type: "montante", x: snap(mx), y1: fY, y2: fY + fH }]);
                                }
                                return;
                              }
                              if (drawMode === "place-trav") {
                                const cell = findCellAt(mx, my);
                                if (cell) {
                                  const cy = snap(my);
                                  const clampedY = Math.max(cell.y + 10, Math.min(cell.y + cell.h - 10, cy));
                                  if (poly) {
                                    const xs = segIntersectH(clampedY, poly);
                                    if (xs) setDW([...els, { id: Date.now(), type: "traverso", y: clampedY, x1: xs[0], x2: xs[1] }]);
                                  } else {
                                    setDW([...els, { id: Date.now(), type: "traverso", y: clampedY, x1: cell.x, x2: cell.x + cell.w }]);
                                  }
                                } else if (poly) {
                                  const cy = snap(my);
                                  const xs = segIntersectH(cy, poly);
                                  if (xs) setDW([...els, { id: Date.now(), type: "traverso", y: cy, x1: xs[0], x2: xs[1] }]);
                                } else if (!frame) {
                                  setDW([...els, { id: Date.now(), type: "traverso", y: snap(my), x1: fX, x2: fX + fW }]);
                                }
                                return;
                              }

                              // Mont.Lib — due click con snap: primo=inizio, secondo=fine
                              if (drawMode === "place-mont-free") {
                                const pending = dw._pendingLine;
                                // Snap generico + snap verticale al frame/zoccolo/traversi
                                const snapPt = findSnap(Math.round(mx), Math.round(my));
                                let rx = snapPt ? snapPt.x : Math.round(mx);
                                let ry = snapPt ? snapPt.y : Math.round(my);
                                if (!pending) {
                                  setMode({ _pendingLine: { x1: rx, y1: ry, _subType: "montante" } });
                                } else {
                                  const x = pending.x1;
                                  // FIX: cerco snap al punto reale (mx,my) invece che solo sulla colonna x fissa
                                  const snap2 = findSnap(Math.round(mx), Math.round(my));
                                  const finalY = snap2 ? snap2.y : Math.round(my);
                                  let y1 = Math.min(pending.y1, finalY);
                                  let y2 = Math.max(pending.y1, finalY);
                                  // Aggiusta y1/y2 al bordo del profilo orizzontale più vicino
                                  const tkMapLocal: any = { soglia: TK_SOGLIA, zoccolo: TK_ZOCCOLO, fascia: TK_FASCIA, profcomp: TK_PROFCOMP };
                                  els.filter(e => e.type === "freeLine" && Math.abs(e.y2-e.y1) <= Math.abs(e.x2-e.x1)+1).forEach(l => {
                                    const lHT = tkMapLocal[l.subType] || TK_FRAME;
                                    const lY = (l.y1+l.y2)/2;
                                    if (Math.abs(lY - y2) < lHT*2+10) y2 = lY + lHT; // scende al bordo inferiore
                                    if (Math.abs(lY - y1) < lHT*2+10) y1 = lY - lHT; // sale al bordo superiore
                                  });
                                  if (Math.abs(y2 - y1) < 3) return;
                                  setDW([...els, { id: Date.now(), type: "montante", x, y1, y2 }], { _pendingLine: null });
                                }
                                return;
                              }

                              // Trav.Lib — due click con snap: primo=inizio, secondo=fine
                              if (drawMode === "place-trav-free") {
                                const pending = dw._pendingLine;
                                const snapPt = findSnap(Math.round(mx), Math.round(my));
                                let rx = snapPt ? snapPt.x : Math.round(mx);
                                let ry = snapPt ? snapPt.y : Math.round(my);
                                if (!pending) {
                                  setMode({ _pendingLine: { x1: rx, y1: ry, _subType: "traverso" } });
                                } else {
                                  // Y fisso al primo click, snap X al secondo
                                  const y = pending.y1;
                                  // FIX: cerco snap al punto reale (mx,my) NON solo sulla riga y fissa
                                  // Così posso agganciarmi a bordi verticali del telaio anche se la y non combacia
                                  const snap2 = findSnap(Math.round(mx), Math.round(my));
                                  const finalX = snap2 ? snap2.x : Math.round(mx);
                                  const x1 = Math.min(pending.x1, finalX);
                                  const x2 = Math.max(pending.x1, finalX);
                                  if (Math.abs(x2 - x1) < 3) return;
                                  setDW([...els, { id: Date.now(), type: "traverso", y, x1, x2 }], { _pendingLine: null });
                                }
                                return;
                              }

                              // Profile.Lib — soglia/zoccolo/fascia/soglia_rib/profcomp a 2 click (un segmento singolo)
                              if (drawMode === "place-profile-free") {
                                const pending = dw._pendingLine;
                                const sub = dw._profileSub || "zoccolo";
                                // Snap 1° click: bordi frame + vertici freeLine esistenti
                                let rx = Math.round(mx), ry = Math.round(my);
                                // Snap ai vertici freeLine esistenti (priorità)
                                const verts1: {x:number,y:number}[] = [];
                                els.filter((e: any) => e.type === "freeLine").forEach((l: any) => {
                                  verts1.push({ x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 });
                                });
                                let bestV1D = 20, bestV1: {x:number,y:number}|null = null;
                                verts1.forEach(pt => {
                                  const d = Math.hypot(rx - pt.x, ry - pt.y);
                                  if (d < bestV1D) { bestV1D = d; bestV1 = pt; }
                                });
                                if (bestV1) { rx = bestV1.x; ry = bestV1.y; }
                                else {
                                  // Snap single-axis ai vertici
                                  verts1.forEach(pt => {
                                    if (Math.abs(ry - pt.y) < 20) ry = pt.y;
                                    if (Math.abs(rx - pt.x) < 20) rx = pt.x;
                                  });
                                }
                                // Snap ai bordi interni del telaio
                                if (frame) {
                                  const iy1 = frame.y + TK_FRAME, iy2 = frame.y + frame.h - TK_FRAME;
                                  const ix1 = frame.x + TK_FRAME, ix2 = frame.x + frame.w - TK_FRAME;
                                  if (Math.abs(ry - iy1) < 20) ry = iy1;
                                  else if (Math.abs(ry - iy2) < 20) ry = iy2;
                                  if (Math.abs(rx - ix1) < 20) rx = ix1;
                                  else if (Math.abs(rx - ix2) < 20) rx = ix2;
                                }
                                if (!pending) {
                                  setMode({ _pendingLine: { x1: rx, y1: ry, _subType: sub } });
                                } else {
                                  // 2° click: snap ai bordi frame + snap ai vertici freeLine esistenti
                                  let fx2 = Math.round(mx), fy2 = Math.round(my);
                                  const SNAP_SOFT = 20;
                                  // 1) Snap ai vertici di tutte le freeLine esistenti (allinea gambe)
                                  const allVerts: {x:number,y:number}[] = [];
                                  els.filter((e: any) => e.type === "freeLine").forEach((l: any) => {
                                    allVerts.push({ x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 });
                                  });
                                  let bestSnapD = SNAP_SOFT, bestSnapPt: {x:number,y:number}|null = null;
                                  allVerts.forEach(pt => {
                                    const d = Math.hypot(fx2 - pt.x, fy2 - pt.y);
                                    if (d < bestSnapD) { bestSnapD = d; bestSnapPt = pt; }
                                  });
                                  // Snap anche solo su singolo asse (Y per allineare piedi, X per allineare lati)
                                  if (!bestSnapPt) {
                                    allVerts.forEach(pt => {
                                      if (Math.abs(fy2 - pt.y) < SNAP_SOFT) fy2 = pt.y;
                                      if (Math.abs(fx2 - pt.x) < SNAP_SOFT) fx2 = pt.x;
                                    });
                                  } else {
                                    fx2 = bestSnapPt.x; fy2 = bestSnapPt.y;
                                  }
                                  // 2) Snap ai bordi interni del telaio
                                  if (frame) {
                                    const iy1 = frame.y + TK_FRAME, iy2 = frame.y + frame.h - TK_FRAME;
                                    const ix1 = frame.x + TK_FRAME, ix2 = frame.x + frame.w - TK_FRAME;
                                    if (Math.abs(fy2 - iy1) < SNAP_SOFT) fy2 = iy1;
                                    else if (Math.abs(fy2 - iy2) < SNAP_SOFT) fy2 = iy2;
                                    if (Math.abs(fx2 - ix1) < SNAP_SOFT) fx2 = ix1;
                                    else if (Math.abs(fx2 - ix2) < SNAP_SOFT) fx2 = ix2;
                                  }
                                  // 3) Forza asse: montante=verticale, traverso=orizzontale
                                  const _st = pending._subType || sub;
                                  let x2f = fx2, y2f = fy2;
                                  if (_st === "montante") {
                                    x2f = pending.x1; // forza verticale
                                  } else if (_st === "traverso") {
                                    y2f = pending.y1; // forza orizzontale
                                  } else {
                                    // Generico: forza asse se prevalente
                                    const ddx = Math.abs(fx2 - pending.x1);
                                    const ddy = Math.abs(fy2 - pending.y1);
                                    if (ddx > ddy * 3) y2f = pending.y1;
                                    else if (ddy > ddx * 3) x2f = pending.x1;
                                  }
                                  if (Math.hypot(x2f - pending.x1, y2f - pending.y1) < 5) return;
                                  setDW([...els, { id: Date.now(), type: "freeLine", subType: sub, x1: pending.x1, y1: pending.y1, x2: x2f, y2: y2f }], { _pendingLine: null });
                                }
                                return;
                              }

                              // Place modes — click on cell OR polygon fallback for complex shapes
                              if (drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") {
                                let cell = findCellAt(mx, my);
                                // Se findCellAt fallisce ma ci sono celle, prendi la più vicina
                                if (!cell && cells.length > 0) {
                                  let best = null, bestD = Infinity;
                                  cells.forEach(c2 => {
                                    const cx = c2.x + c2.w / 2, cy = c2.y + c2.h / 2;
                                    const d = Math.hypot(mx - cx, my - cy);
                                    if (d < bestD) { bestD = d; best = c2; }
                                  });
                                  cell = best;
                                }
                                // Anta usa il poly se esiste un telaio libero non rettangolare (poligono reale)
                                // Altrimenti usa innerRect (caso normale: telaio rect senza freeLine)
                                const _polyForCheck = polyVC || poly;
                                const hasRealPoly = _polyForCheck && (() => {
                                  const xs = _polyForCheck.map(p => p[0]), ys = _polyForCheck.map(p => p[1]);
                                  const minX = Math.min(...xs), maxX = Math.max(...xs);
                                  const minY = Math.min(...ys), maxY = Math.max(...ys);
                                  // Se il poligono ha >4 vertici o se non è rettangolare, è un poly reale
                                  if (_polyForCheck.length > 4) return true;
                                  return !_polyForCheck.every(p => (p[0] === minX || p[0] === maxX) && (p[1] === minY || p[1] === maxY));
                                })();
                                if (cell && !cell.poly && hasRealPoly) {
                                  cell = { id: cell.id, poly: [
                                    [cell.x, cell.y], [cell.x + cell.w, cell.y],
                                    [cell.x + cell.w, cell.y + cell.h], [cell.x, cell.y + cell.h]
                                  ], _bspInset: true };
                                }
                                if (!cell && cells.length === 0) {
                                  // Usa il poligono reale chiuso se disponibile
                                  const _polyFallback = polyVC || poly;
                                  if (_polyFallback && _polyFallback.length >= 3) {
                                    cell = { id: "poly", poly: _polyFallback };
                                  } else {
                                    // Fallback: BBOX delle freeLine
                                    const telLines = els.filter(e => e.type === "freeLine" && !e.subType);
                                    if (telLines.length >= 2) {
                                      const allX = telLines.flatMap(l => [l.x1, l.x2]);
                                      const allY = telLines.flatMap(l => [l.y1, l.y2]);
                                      const bMinX = Math.min(...allX), bMaxX = Math.max(...allX);
                                      const bMinY = Math.min(...allY), bMaxY = Math.max(...allY);
                                      cell = { id: "poly", poly: [
                                        [bMinX, bMinY], [bMaxX, bMinY], [bMaxX, bMaxY], [bMinX, bMaxY]
                                      ]};
                                    }
                                  }
                                  // Fallback apLine
                                  if (!cell) {
                                    const apLines = els.filter(e => e.type === "apLine");
                                    if (apLines.length > 0) {
                                      const allX = apLines.flatMap(l => [l.x1, l.x2]);
                                      const allY = apLines.flatMap(l => [l.y1, l.y2]);
                                      cell = { x: Math.min(...allX), y: Math.min(...allY), w: Math.max(...allX) - Math.min(...allX), h: Math.max(...allY) - Math.min(...allY), id: "bbox" };
                                    }
                                  }
                                }
                                if (!cell) return;
                                
                                // Polygon shape handling
                                if (cell.poly) {
                                  // Bordi del polygon esterno (linea centrale delle freeLine)
                                  const _cpAllX = cell.poly.map(p => p[0]);
                                  const _cpAllY = cell.poly.map(p => p[1]);
                                  const _cpMinX = Math.min(..._cpAllX), _cpMaxX = Math.max(..._cpAllX);
                                  const _cpMinY = Math.min(..._cpAllY), _cpMaxY = Math.max(..._cpAllY);
                                  // Divisori verticali: montanti classici + freeLine verticali INTERNE al telaio
                                  const classicMont = els.filter(e => e.type === "montante");
                                  // freeLine verticali interne (non sono i bordi sx/dx del telaio)
                                  const vertFreeLines = els.filter(e => 
                                    e.type === "freeLine" && !e.subType && 
                                    Math.abs(e.x2 - e.x1) < Math.abs(e.y2 - e.y1) + 1 &&
                                    e.x1 > _cpMinX + 10 && e.x1 < _cpMaxX - 10
                                  );
                                  const freeMontanti = [...classicMont, ...vertFreeLines.map(l => ({ x: (l.x1 + l.x2) / 2 }))];
                                  // Inseta il poly di TK_FRAME per stare dentro il telaio (bordo INTERNO del profilo)
                                  // Se la cella viene da BSP (getCells), è GIÀ insetata — usa offset 0
                                  const _cpInset = cell._bspInset ? 0 : TK_FRAME;
                                  let cellPoly = [
                                    [_cpMinX + _cpInset, _cpMinY + _cpInset],
                                    [_cpMaxX - _cpInset, _cpMinY + _cpInset],
                                    [_cpMaxX - _cpInset, _cpMaxY - _cpInset],
                                    [_cpMinX + _cpInset, _cpMaxY - _cpInset]
                                  ];
                                  if (freeMontanti.length > 0) {
                                    // Taglia il poligono con linee verticali dei montanti
                                    const allPolyX = cell.poly.map(p => p[0]);
                                    const polyMinX = Math.min(...allPolyX);
                                    const polyMaxX = Math.max(...allPolyX);
                                    const montX = freeMontanti
                                      .map(m => m.x !== undefined ? m.x : (m.x1 + m.x2) / 2)
                                      .filter(x => x > polyMinX + 5 && x < polyMaxX - 5)
                                      .sort((a, b) => a - b);
                                    if (montX.length > 0) {
                                      let subX1 = polyMinX, subX2 = polyMaxX;
                                      for (let i = 0; i < montX.length; i++) {
                                        if (mx < montX[i]) { subX2 = montX[i]; break; }
                                        subX1 = montX[i];
                                      }
                                      cellPoly = [
                                        [subX1 + _cpInset, _cpMinY + _cpInset],
                                        [subX2 - _cpInset, _cpMinY + _cpInset],
                                        [subX2 - _cpInset, _cpMaxY - _cpInset],
                                        [subX1 + _cpInset, _cpMaxY - _cpInset]
                                      ];
                                    }
                                  }
                                  // ── Clip Y per zoccolo/soglia/fascia/traverso orizzontali dentro la cella ──
                                  const cpLeft = Math.min(cellPoly[0][0], cellPoly[3][0]);
                                  const cpRight = Math.max(cellPoly[1][0], cellPoly[2][0]);
                                  let cpTop = cellPoly[0][1];
                                  let cpBot = cellPoly[2][1];
                                  const horzSubEls = els.filter(e => 
                                    e.type === "freeLine" && e.subType && 
                                    Math.abs(e.y2 - e.y1) <= Math.abs(e.x2 - e.x1) + 1
                                  );
                                  horzSubEls.forEach(h => {
                                    const hMidY = (h.y1 + h.y2) / 2;
                                    const hMinX = Math.min(h.x1, h.x2), hMaxX = Math.max(h.x1, h.x2);
                                    // Controlla che la freeLine si sovrapponga alla sotto-cella in X
                                    if (hMaxX < cpLeft + 5 || hMinX > cpRight - 5) return;
                                    // Usa la linea centrale come confine: l'anta non attraversa il profilo
                                    const cellMidY = (cpTop + cpBot) / 2;
                                    if (hMidY > cellMidY && hMidY < cpBot) {
                                      cpBot = Math.min(cpBot, hMidY);
                                    }
                                    if (hMidY < cellMidY && hMidY > cpTop) {
                                      cpTop = Math.max(cpTop, hMidY);
                                    }
                                  });
                                  // Controlla se c'è un poly reale (non rettangolare) da usare per l'anta
                                  let _realPoly = polyVC || poly;
                                  if (!_realPoly) {
                                    // Telaio aperto: costruisci poly dalla catena di freeLine + virtualClose
                                    const _fls = els.filter(e => (e.type === "freeLine" && !e.subType) || e.type === "virtualClose");
                                    if (_fls.length >= 2) {
                                      const _CONN = 15;
                                      const _used = new Set();
                                      const _pts: number[][] = [];
                                      const _addP = (x:number,y:number) => { const k=`${Math.round(x)},${Math.round(y)}`; if(!_pts.length||k!==`${Math.round(_pts[_pts.length-1][0])},${Math.round(_pts[_pts.length-1][1])}`) _pts.push([x,y]); };
                                      _addP(_fls[0].x1, _fls[0].y1); _addP(_fls[0].x2, _fls[0].y2); _used.add(0);
                                      for (let it=0; it<_fls.length; it++) {
                                        const last=_pts[_pts.length-1];
                                        for (let li=0; li<_fls.length; li++) {
                                          if (_used.has(li)) continue;
                                          const l=_fls[li];
                                          if (Math.hypot(l.x1-last[0],l.y1-last[1])<_CONN) { _addP(l.x2,l.y2); _used.add(li); break; }
                                          if (Math.hypot(l.x2-last[0],l.y2-last[1])<_CONN) { _addP(l.x1,l.y1); _used.add(li); break; }
                                        }
                                      }
                                      if (_pts.length >= 3) _realPoly = _pts;
                                    }
                                  }
                                  if (!_realPoly) {
                                    // Nessun poly reale — applica clamp Y rettangolare (logica originale)
                                    cellPoly = [
                                      [cellPoly[0][0], cpTop],
                                      [cellPoly[1][0], cpTop],
                                      [cellPoly[2][0], cpBot],
                                      [cellPoly[3][0], cpBot]
                                    ];
                                    _realPoly = cell.poly;
                                  }
                                  if (_realPoly && _realPoly.length >= 3) {
                                    // Anta: scala basata su TK_FRAME — margine fisso in pixel
                                    const _cx = _realPoly.reduce((s,p)=>s+p[0],0)/_realPoly.length;
                                    const _cy = _realPoly.reduce((s,p)=>s+p[1],0)/_realPoly.length;
                                    // Calcola il raggio medio dal centroide
                                    const _avgR = _realPoly.reduce((s,p)=>s+Math.hypot(p[0]-_cx,p[1]-_cy),0)/_realPoly.length;
                                    // Scala = (raggio - TK_FRAME) / raggio
                                    const _scale = _avgR > TK_FRAME*2 ? (_avgR - TK_FRAME) / _avgR : 0.9;
                                    cellPoly = _realPoly.map(p => [
                                      _cx + (p[0] - _cx) * _scale,
                                      _cy + (p[1] - _cy) * _scale
                                    ]);
                                  }
                                  if (drawMode === "place-anta" || drawMode === "place-porta") {
                                    // Rimuovi solo le polyAnta nella stessa zona X
                                    const subMinX = Math.min(...cellPoly.map(p => p[0]));
                                    const subMaxX = Math.max(...cellPoly.map(p => p[0]));
                                    const newEls = els.filter(e => {
                                      if (e.type !== "polyAnta") return true;
                                      const eMinX = Math.min(...e.poly.map(p => p[0]));
                                      const eMaxX = Math.max(...e.poly.map(p => p[0]));
                                      // Rimuovi se si sovrappone alla zona cliccata
                                      return !(eMinX < subMaxX - 5 && eMaxX > subMinX + 5);
                                    });
                                    newEls.push({ id: Date.now(), type: "polyAnta", poly: cellPoly, subType: drawMode === "place-porta" ? "porta" : undefined });
                                    setDW(newEls);
                                  } else if (drawMode === "place-vetro") {
                                    const newEls = els.filter(e => e.type !== "polyGlass");
                                    newEls.push({ id: Date.now(), type: "polyGlass", poly: cellPoly });
                                    setDW(newEls);
                                  } else if (drawMode === "place-persiana") {
                                    const newEls = els.filter(e => e.type !== "polyPersiana");
                                    newEls.push({ id: Date.now(), type: "polyPersiana", poly: cellPoly });
                                    setDW(newEls);
                                  }
                                  return;
                                }
                                
                                // Match elements to cell by position overlap (BSP IDs change dynamically)
                                const inCell = (el2) => el2.x !== undefined && el2.w !== undefined &&
                                  el2.x >= cell.x - 2 && el2.y >= cell.y - 2 &&
                                  el2.x + el2.w <= cell.x + cell.w + 2 && el2.y + el2.h <= cell.y + cell.h + 2;
                                
                                // ── Clip Y cella per zoccolo/soglia/fascia dentro la cella ──
                                let cellY = cell.y, cellH = cell.h;
                                const horzSubInCell = els.filter(e => 
                                  e.type === "freeLine" && e.subType && 
                                  Math.abs(e.y2 - e.y1) <= Math.abs(e.x2 - e.x1) + 1
                                );
                                document.title = `cell[${cell.y.toFixed(0)}-${(cell.y+cell.h).toFixed(0)}] hSubs=${horzSubInCell.length} ${horzSubInCell.map(h=>`${h.subType}@${((h.y1+h.y2)/2).toFixed(0)}`).join(",")}`;
                                horzSubInCell.forEach(h => {
                                  const hMidY = (h.y1 + h.y2) / 2;
                                  const hMinX = Math.min(h.x1, h.x2), hMaxX = Math.max(h.x1, h.x2);
                                  if (hMaxX < cell.x + 5 || hMinX > cell.x + cell.w - 5) return;
                                  const cellMidY = cellY + cellH / 2;
                                  if (hMidY > cellMidY && hMidY < cellY + cellH) {
                                    cellH = hMidY - cellY;
                                  }
                                  if (hMidY < cellMidY && hMidY > cellY) {
                                    cellH = cellH - (hMidY - cellY);
                                    cellY = hMidY;
                                  }
                                });

                                // Regular cell handling
                                if (drawMode === "place-anta") {
                                  const existingAnta = els.find(e => (e.type === "innerRect" || e.type === "persiana") && inCell(e));
                                  if (existingAnta) {
                                    const midX = snap(cell.x + cell.w / 2);
                                    const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana" || e.type === "glass") && inCell(e)));
                                    newEls.push({ id: Date.now(), type: "montante", x: midX, y1: cellY - HM, y2: cellY + cellH + HM });
                                    setDW(newEls);
                                  } else {
                                    const newEls = [...els];
                                    newEls.push({ id: Date.now() + Math.floor(Math.random()*10000), type: "innerRect", x: cell.x + 1, y: cellY + 1, w: cell.w - 2, h: cellH + 10, cellId: cell.id });
                                    setDW(newEls, { drawMode: null });
                                  }
                                } else if (drawMode === "place-porta") {
                                  const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana") && inCell(e)));
                                  newEls.push({ id: Date.now() + Math.floor(Math.random()*10000), type: "innerRect", subType: "porta", x: cell.x + 1, y: cellY + 1, w: cell.w - 2, h: cellH + 10, cellId: cell.id });
                                  setDW(newEls);
                                  setMode({ drawMode: null });
                                } else if (drawMode === "place-persiana") {
                                  const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana") && inCell(e)));
                                  newEls.push({ id: Date.now(), type: "persiana", x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2, cellId: cell.id });
                                  setDW(newEls);
                                  setMode({ drawMode: null });
                                } else if (drawMode === "place-vetro") {
                                  const anta = els.find(e => (e.type === "innerRect") && inCell(e));
                                  const tk = anta ? (anta.subType === "porta" ? TK_PORTA : TK_ANTA) : 1;
                                  const base = anta || { x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2 };
                                  const newEls = els.filter(e => !(e.type === "glass" && inCell(e)));
                                  newEls.push({ id: Date.now(), type: "glass", x: base.x + tk, y: base.y + tk, w: base.w - tk * 2, h: base.h - tk * 2, cellId: cell.id });
                                  setDW(newEls);
                                }
                                return;
                              }

                              if (drawMode === "place-ap") {
                                let cell = findCellAt(mx, my);
                                document.title = "mx="+mx.toFixed(0)+" celle="+cells.map(c=>"["+c.x.toFixed(0)+"-"+(c.x+c.w).toFixed(0)+"]").join("")+" hit="+(cell?cell.id:"null");
                                if (!cell && cells.length === 0) {
                                  const lines = els.filter(e => e.type === "freeLine" || e.type === "apLine");
                                  if (lines.length > 0) {
                                    const allX = lines.flatMap(l => [l.x1, l.x2]);
                                    const allY = lines.flatMap(l => [l.y1, l.y2]);
                                    cell = { x: Math.min(...allX), y: Math.min(...allY), w: Math.max(...allX) - Math.min(...allX), h: Math.max(...allY) - Math.min(...allY), id: "bbox" };
                                  }
                                }
                                if (!cell) return;
                                const t = Date.now();
                                // Remove old aperture elements in this cell by position
                                const inC = (el2) => el2.x !== undefined ? (el2.x >= cell.x - 3 && el2.x <= cell.x + cell.w + 3 && el2.y >= cell.y - 3 && el2.y <= cell.y + cell.h + 3) :
                                  (el2.x1 !== undefined && el2.x1 >= cell.x - 3 && el2.x1 <= cell.x + cell.w + 3 && el2.y1 >= cell.y - 3 && el2.y1 <= cell.y + cell.h + 3);
                                const newEls = els.filter(e => !((e.type === "apLine" || e.type === "apLabel") && inC(e)));
                                const P = 6;
                                const L = cell.x + P, R = cell.x + cell.w - P;
                                const T2 = cell.y + P, B = cell.y + cell.h - P;
                                const MX = cell.x + cell.w / 2, MY = cell.y + cell.h / 2;
                                const ap = placeApType;
                                if (ap === "SX") {
                                  // Cardine sinistro: triangolo simmetrico, cardine a SX
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: B, x2: R, y2: B, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 1, type: "apLine", x1: L, y1: B, x2: MX, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLabel", x: MX - cell.w * 0.2, y: MY + 5, label: "← SX", cellId: cell.id });
                                } else if (ap === "DX") {
                                  // Cardine destro: triangolo simmetrico, cardine a DX
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: B, x2: R, y2: B, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 1, type: "apLine", x1: R, y1: B, x2: MX, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLabel", x: MX + cell.w * 0.2, y: MY + 5, label: "DX →", cellId: cell.id });
                                } else if (ap === "RIB") {
                                  // Ribalta: triangolo simmetrico dal basso-centro verso alto
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: T2, x2: R, y2: T2, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 1, type: "apLine", x1: MX, y1: B, x2: L, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLine", x1: MX, y1: B, x2: R, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY + 5, label: "↕ RIB", cellId: cell.id });
                                } else if (ap === "OB") {
                                  // Anta-ribalta: SX simmetrico (solido) + RIB (tratteggiato)
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: B, x2: MX, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: MX, y1: B, x2: L, y2: T2, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 2, type: "apLine", x1: MX, y1: B, x2: R, y2: T2, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY, label: "↙↕ OB", cellId: cell.id });
                                } else if (ap === "ALZ") {
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: MY, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: R - 12, y1: MY - 8, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLine", x1: R - 12, y1: MY + 8, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY - 14, label: "→ ALZ", cellId: cell.id });
                                } else if (ap === "SCO") {
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: MY, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: L + 10, y1: MY - 8, x2: L, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLine", x1: R - 10, y1: MY - 8, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY - 14, label: "↔ SCO", cellId: cell.id });
                                } else if (ap === "FISSO") {
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: T2, x2: R, y2: B, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: R, y1: T2, x2: L, y2: B, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLabel", x: MX, y: MY, label: "FISSO", cellId: cell.id });
                                }
                                setDW(newEls);
                                return;
                              }

                              // Line / apertura draw modes
                              // ═══ AGGANCIO AUTOMATICO: click su lato anta vuoto crea freeLine esatta ═══
                              if (drawMode === "line" && dw._lineSubType && !dw._pendingLine) {
                                const profileSub = dw._lineSubType;
                                if (["zoccolo","soglia","fascia","profcomp","soglia_rib"].includes(profileSub)) {
                                  // Cerca un'anta il cui lato hidden contiene il click
                                  const TK_anta = (a: any) => a.subType === "porta" ? TK_PORTA : TK_ANTA;
                                  const antaFound = els.find((e: any) => {
                                    if (e.type !== "innerRect") return false;
                                    const hidden = e.hiddenSides || [];
                                    if (hidden.length === 0) return false;
                                    const TK = TK_anta(e);
                                    // Definizione area di ogni lato hidden con AMPIA tolleranza verso l'interno dell'anta
                                    // Per top/bot: strip orizzontale che occupa 30% dell'altezza dall'estremo
                                    // Per left/right: strip verticale che occupa 30% della larghezza dall'estremo
                                    const TOL = 30; // tolleranza ESTERNA (oltre il bordo dell'anta)
                                    const sidesZone: any = {
                                      top: { x: e.x - TOL, y: e.y - TOL, w: e.w + TOL*2, h: e.h * 0.3 + TOL },
                                      bot: { x: e.x - TOL, y: e.y + e.h * 0.7, w: e.w + TOL*2, h: e.h * 0.3 + TOL },
                                      left: { x: e.x - TOL, y: e.y - TOL, w: e.w * 0.3 + TOL, h: e.h + TOL*2 },
                                      right: { x: e.x + e.w * 0.7, y: e.y - TOL, w: e.w * 0.3 + TOL, h: e.h + TOL*2 }
                                    };
                                    return hidden.some((side: string) => {
                                      const r = sidesZone[side];
                                      if (!r) return false;
                                      return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
                                    });
                                  });
                                  if (antaFound) {
                                    const hidden = antaFound.hiddenSides || [];
                                    const TK = TK_anta(antaFound);
                                    const sides: any = {
                                      top: { x: antaFound.x, y: antaFound.y, w: antaFound.w, h: TK },
                                      bot: { x: antaFound.x, y: antaFound.y + antaFound.h - TK, w: antaFound.w, h: TK },
                                      left: { x: antaFound.x, y: antaFound.y + TK, w: TK, h: Math.max(0, antaFound.h - TK*2) },
                                      right: { x: antaFound.x + antaFound.w - TK, y: antaFound.y + TK, w: TK, h: Math.max(0, antaFound.h - TK*2) }
                                    };
                                    // Trova quale lato hidden è stato cliccato (il primo che contiene il click)
                                    const TOL2 = 30;
                                    const zonesForClicked: any = {
                                      top: { x: antaFound.x - TOL2, y: antaFound.y - TOL2, w: antaFound.w + TOL2*2, h: antaFound.h * 0.3 + TOL2 },
                                      bot: { x: antaFound.x - TOL2, y: antaFound.y + antaFound.h * 0.7, w: antaFound.w + TOL2*2, h: antaFound.h * 0.3 + TOL2 },
                                      left: { x: antaFound.x - TOL2, y: antaFound.y - TOL2, w: antaFound.w * 0.3 + TOL2, h: antaFound.h + TOL2*2 },
                                      right: { x: antaFound.x + antaFound.w * 0.7, y: antaFound.y - TOL2, w: antaFound.w * 0.3 + TOL2, h: antaFound.h + TOL2*2 }
                                    };
                                    const clickedSide = hidden.find((side: string) => {
                                      const r = zonesForClicked[side];
                                      if (!r) return false;
                                      return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
                                    });
                                    if (clickedSide) {
                                      const r = sides[clickedSide];
                                      // Offset dai lati ADIACENTI ancora presenti (non hidden)
                                      // Per top/bot: offset sx/dx. Per left/right: offset top/bot.
                                      const offLeft = hidden.includes("left") ? 0 : TK;
                                      const offRight = hidden.includes("right") ? 0 : TK;
                                      const offTop = hidden.includes("top") ? 0 : TK;
                                      const offBot = hidden.includes("bot") ? 0 : TK;
                                      // Coordinate della freeLine: linea centrale del lato, con offset dai lati presenti
                                      let lx1, ly1, lx2, ly2;
                                      // Fine-tune: profilo 4px più lungo (2 per lato) + 2px più in basso
                                    if (clickedSide === "top") {
                                        const cy = antaFound.y + TK + 2;
                                        lx1 = antaFound.x + offLeft - 2; ly1 = cy;
                                        lx2 = antaFound.x + antaFound.w - offRight + 2; ly2 = cy;
                                      } else if (clickedSide === "bot") {
                                        const cy = antaFound.y + antaFound.h - TK + 2;
                                        lx1 = antaFound.x + offLeft - 2; ly1 = cy;
                                        lx2 = antaFound.x + antaFound.w - offRight + 2; ly2 = cy;
                                      } else if (clickedSide === "left") {
                                        const cx = antaFound.x + TK + 2;
                                        lx1 = cx; ly1 = antaFound.y + offTop - 2;
                                        lx2 = cx; ly2 = antaFound.y + antaFound.h - offBot + 2;
                                      } else {
                                        const cx = antaFound.x + antaFound.w - TK + 2;
                                        lx1 = cx; ly1 = antaFound.y + offTop - 2;
                                        lx2 = cx; ly2 = antaFound.y + antaFound.h - offBot + 2;
                                      }
                                      const newEls = [...els, {
                                        id: Date.now() + Math.floor(Math.random()*10000),
                                        type: "freeLine",
                                        subType: profileSub,
                                        x1: lx1, y1: ly1, x2: lx2, y2: ly2
                                      }];
                                      setDW(newEls, { drawMode: null, _lineSubType: null, _pendingLine: null });
                                      return;
                                    }
                                  }
                                }
                              }

                              if (drawMode === "line" || drawMode === "apertura") {
                                const pending = dw._pendingLine;
                                // Leggi subType sia da dw che da pending (pending ├¿ pi├╣ affidabile)
                                const subTypeVal = (pending && pending._subType) || dw._lineSubType || null;
                                const isMont = subTypeVal === "montante";
                                const isTrav = subTypeVal === "traverso";

                                // Coordinate raw del click
                                let px = Math.round(mx);
                                let py = Math.round(my);

                                if (!pending) {
                                  // PRIMO CLICK
                                  if (isMont) {
                                    // Montante: X rimane dove clicchi, snap Y solo agli elementi interni (traversi, bordi frame)
                                    // Prima guarda traversi/altri elementi orizzontali
                                    const horzPts = els.filter(e=>e.x1!==undefined && e.subType!=="montante")
                                      .flatMap(l=>[{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}]);
                                    let bestY=null, bestDY=SNAP_R;
                                    horzPts.forEach(p=>{ const d=Math.abs(p.y-py); if(d<bestDY){bestDY=d;bestY=p.y;} });
                                    if(bestY!==null) { py=bestY; }
                                    else if (frame) {
                                      // Snap ai bordi interni del frame
                                      const distTop = Math.abs(py - frame.y);
                                      const distBot = Math.abs(py - (frame.y + frame.h));
                                      if (distTop < SNAP_R) py = frame.y;
                                      else if (distBot < SNAP_R) py = frame.y + frame.h;
                                    }
                                    setMode({ _pendingLine: { x1: px, y1: py, _subType: subTypeVal }, _chainStart: { x: px, y: py }, _lineSubType: subTypeVal });
                                  } else if (isTrav) {
                                    // Traverso: Y rimane dove clicchi, snap X agli elementi verticali o bordi frame
                                    const vertPts = els.filter(e=>e.x1!==undefined && e.subType!=="traverso")
                                      .flatMap(l=>[{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}]);
                                    let bestX=null, bestDX=SNAP_R;
                                    vertPts.forEach(p=>{ const d=Math.abs(p.x-px); if(d<bestDX){bestDX=d;bestX=p.x;} });
                                    if(bestX!==null) { px=bestX; }
                                    else if (frame) {
                                      const distL = Math.abs(px - frame.x);
                                      const distR = Math.abs(px - (frame.x + frame.w));
                                      if (distL < SNAP_R) px = frame.x;
                                      else if (distR < SNAP_R) px = frame.x + frame.w;
                                    }
                                    setMode({ _pendingLine: { x1: px, y1: py, _subType: subTypeVal }, _chainStart: { x: px, y: py }, _lineSubType: subTypeVal });
                                  } else {
                                    // Soglia, zoccolo, fascia, profcomp, tel.libero — snap unificato
                                    const snapPt = findSnap(px, py);
                                    if (snapPt) { px = snapPt.x; py = snapPt.y; }
                                    // Extra: snap forte ai vertici freeLine esistenti (angoli perfetti)
                                    if (!snapPt) {
                                      let bestVD = 25, bestV: any = null;
                                      els.filter(e => e.type === "freeLine").forEach(l => {
                                        [{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}].forEach(p => {
                                          const d = Math.hypot(px-p.x, py-p.y);
                                          if (d < bestVD) { bestVD = d; bestV = p; }
                                        });
                                      });
                                      if (bestV) { px = bestV.x; py = bestV.y; }
                                    }
                                    setMode({ _pendingLine: { x1: px, y1: py, _subType: subTypeVal }, _chainStart: dw._chainStart || { x: px, y: py }, _lineSubType: subTypeVal });
                                  }
                                } else {
                                  // SECONDO CLICK ÔÇö crea il segmento

                                  // Montante: X SEMPRE uguale al primo punto, Y libera
                                  if (isMont) {
                                    px = pending.x1;
                                    // Snap Y: bordi frame + punti freeLine sulla stessa colonna, escludi punto di partenza
                                    const framePtsY = frames.flatMap(f=>[{x:f.x,y:f.y},{x:f.x,y:f.y+f.h},{x:f.x+f.w,y:f.y},{x:f.x+f.w,y:f.y+f.h}]);
                                    const colPts = [
                                      ...els.filter(e=>e.x1!==undefined).flatMap(l=>[{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}]),
                                      ...framePtsY
                                    ].filter(p=>Math.abs(p.x-px)<12 && Math.abs(p.y-pending.y1)>5);
                                    let bestY=null, bestDY=SNAP_R;
                                    colPts.forEach(p=>{const d=Math.abs(p.y-py);if(d<bestDY){bestDY=d;bestY=p.y;}});
                                    if(bestY!==null) py=bestY;
                                    // Se nessuno snap: accetta py grezzo (non bloccare il click)
                                  }
                                  // Traverso: Y SEMPRE uguale al primo punto, X libera
                                  else if (isTrav) {
                                    py = pending.y1;
                                    // Snap X: bordi frame + punti freeLine sulla stessa riga, escludi punto di partenza
                                    const framePtsX = frames.flatMap(f=>[{x:f.x,y:f.y},{x:f.x,y:f.y+f.h},{x:f.x+f.w,y:f.y},{x:f.x+f.w,y:f.y+f.h}]);
                                    const rowPts = [
                                      ...els.filter(e=>e.x1!==undefined).flatMap(l=>[{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}]),
                                      ...framePtsX
                                    ].filter(p=>Math.abs(p.y-py)<12 && Math.abs(p.x-pending.x1)>5);
                                    let bestX=null, bestDX=SNAP_R;
                                    rowPts.forEach(p=>{const d=Math.abs(p.x-px);if(d<bestDX){bestDX=d;bestX=p.x;}});
                                    if(bestX!==null) px=bestX;
                                    // Se nessuno snap: accetta px grezzo
                                  }
                                  // Telaio libero / altri: snap semplice (come vecchio codice stabile)
                                  else {
                                    const sp = findSnap(px, py);
                                    if (sp) { px = sp.x; py = sp.y; }
                                    // H/V snap entro 8px
                                    if (Math.abs(px-pending.x1)<8 && Math.abs(py-pending.y1)>8) px=pending.x1;
                                    if (Math.abs(py-pending.y1)<8 && Math.abs(px-pending.x1)>8) py=pending.y1;
                                    // chiusura forma
                                    if (!subTypeVal) {
                                      const cs = dw._chainStart;
                                      const freeLines = els.filter(e=>e.type==="freeLine");
                                      if (cs && freeLines.length>=2 && Math.hypot(px-cs.x,py-cs.y)<SNAP_R+6) { px=cs.x; py=cs.y; }
                                    }
                                  }

                                  if (!isMont && !isTrav && px===pending.x1 && py===pending.y1) return;
                                  if (isMont && py===pending.y1) return;
                                  if (isTrav && px===pending.x1) return;
                                  const lineType = drawMode==="apertura" ? "apLine" : "freeLine";
                                  // Crea elemento direttamente con px,py (già snappati)
                                  const newEl = { id: Date.now(), type: lineType, x1: pending.x1, y1: pending.y1, x2: px, y2: py, ...(subTypeVal ? { subType: subTypeVal } : {}) };
                                  // Per montante/traverso: reset, per telaio libero: concatena dal punto finale
                                  const newChainStart = (isMont || isTrav) ? null : dw._chainStart;
                                  const newPending = (isMont || isTrav) ? null : { x1: px, y1: py, _subType: subTypeVal || null };
                                  setDW([...els, newEl], { _pendingLine: newPending, _chainStart: newChainStart, _lineSubType: subTypeVal });
                                }
                                return;
                              }
                              // Righello — traccia misura con punti di riferimento
                              if (drawMode === "righello") {
                                const sp = findSnap(mx, my);
                                let px2 = sp ? sp.x : snap(mx);
                                let py2 = sp ? sp.y : snap(my);
                                const pending2 = dw._pendingLine;
                                if (!pending2) {
                                  setMode({ _pendingLine: { x1: px2, y1: py2 }, _chainStart: { x: px2, y: py2 } });
                                } else {
                                  if (px2 === pending2.x1 && py2 === pending2.y1) return;
                                  const dx2r = px2 - pending2.x1, dy2r = py2 - pending2.y1;
                                  const lenPxR = Math.hypot(dx2r, dy2r) || 1;
                                  const refLenR = frame ? Math.max(frame.w, frame.h) : Math.max(fW, fH);
                                  const refRealR = frame ? (frame.w >= frame.h ? realW : realH) : Math.max(realW, realH);
                                  const mmR = Math.round(lenPxR / refLenR * refRealR);
                                  const hist = pushHistory();
                                  // Una sola chiamata — aggiunge elemento e resetta drawMode
                                  onUpdate({ ...dw, elements: [...els, { id: Date.now(), type: "righello", x1: pending2.x1, y1: pending2.y1, x2: px2, y2: py2, label: String(mmR) }], history: hist, drawMode: "righello", _pendingLine: null, _chainStart: null });
                                }
                                return;
                              }

                              // ═══ Angolo 45°/90° — click su angolo intersezione ═══
                              if (drawMode === "corner-45" || drawMode === "corner-90") {
                                const TOL = 20;
                                const angle = drawMode === "corner-45" ? 45 : 90;
                                // Trova angoli: intersezione tra montante/verticale e freeLine orizzontale
                                const horzEls = els.filter(e => (e.type === "freeLine" && e.subType) && Math.abs(e.y2-e.y1) <= Math.abs(e.x2-e.x1)+0.5);
                                const vertEls = [
                                  ...els.filter(e => e.type === "montante"),
                                  ...els.filter(e => e.type === "freeLine" && !e.subType && Math.abs(e.x2-e.x1) < Math.abs(e.y2-e.y1)+1),
                                ];
                                let bestCorner: any = null, bestD = TOL;
                                horzEls.forEach(h => {
                                  vertEls.forEach(v => {
                                    const vx = v.type === "montante" ? v.x : (v.x1+v.x2)/2;
                                    const hy = (h.y1+h.y2)/2;
                                    // Check intersezione X e Y
                                    const hx1 = Math.min(h.x1,h.x2), hx2 = Math.max(h.x1,h.x2);
                                    const vy1 = v.type==="montante" ? (v.y1??fY) : Math.min(v.y1,v.y2);
                                    const vy2 = v.type==="montante" ? (v.y2??fY+fH) : Math.max(v.y1,v.y2);
                                    if (vx < hx1-TOL || vx > hx2+TOL) return;
                                    if (hy < vy1-TOL || hy > vy2+TOL) return;
                                    // Corner point
                                    const cx2 = vx, cy2 = hy;
                                    const d = Math.hypot(mx-cx2, my-cy2);
                                    if (d < bestD) {
                                      bestD = d;
                                      bestCorner = { hId: h.id, vId: v.id, cx: cx2, cy: cy2, angle };
                                    }
                                  });
                                });
                                if (bestCorner) {
                                  const hist = pushHistory();
                                  const updEls = els.map(e => {
                                    if (e.id === bestCorner.hId || e.id === bestCorner.vId) {
                                      const corners = e.corners ? [...e.corners.filter(c => Math.hypot(c.cx-bestCorner.cx,c.cy-bestCorner.cy)>5)] : [];
                                      if (angle !== 90) corners.push({ cx: bestCorner.cx, cy: bestCorner.cy, angle });
                                      return { ...e, corners };
                                    }
                                    return e;
                                  });
                                  onUpdate({ ...dw, elements: updEls, history: hist });
                                }
                                return;
                              }

                              // ═══ Angolo 45°/90° ═══
                              if (drawMode === "corner-45" || drawMode === "corner-90") {
                                const TOL = 20;
                                const angle = drawMode === "corner-45" ? 45 : 90;
                                const horzEls = els.filter(e => e.type === "freeLine" && e.subType && Math.abs(e.y2-e.y1) <= Math.abs(e.x2-e.x1)+0.5);
                                const vertEls = [
                                  ...els.filter(e => e.type === "montante"),
                                  ...els.filter(e => e.type === "freeLine" && !e.subType && Math.abs(e.x2-e.x1) < Math.abs(e.y2-e.y1)+1),
                                ];
                                let bestCorner = null, bestD = TOL;
                                horzEls.forEach(h => {
                                  vertEls.forEach(v => {
                                    const vx = v.type === "montante" ? v.x : (v.x1+v.x2)/2;
                                    const hy = (h.y1+h.y2)/2;
                                    const hx1 = Math.min(h.x1,h.x2), hx2 = Math.max(h.x1,h.x2);
                                    const vy1 = v.type==="montante" ? (v.y1??fY) : Math.min(v.y1,v.y2);
                                    const vy2 = v.type==="montante" ? (v.y2??(fY+fH)) : Math.max(v.y1,v.y2);
                                    if (vx < hx1-TOL || vx > hx2+TOL) return;
                                    if (hy < vy1-TOL || hy > vy2+TOL) return;
                                    const d = Math.hypot(mx-vx, my-hy);
                                    if (d < bestD) { bestD = d; bestCorner = { hId: h.id, vId: v.id, cx: vx, cy: hy, angle }; }
                                  });
                                });
                                if (bestCorner) {
                                  const hist = pushHistory();
                                  const updEls = els.map(e => {
                                    if (e.id === bestCorner.hId || e.id === bestCorner.vId) {
                                      const corners = (e.corners||[]).filter(c => Math.hypot(c.cx-bestCorner.cx,c.cy-bestCorner.cy)>5);
                                      if (angle !== 90) corners.push({ cx: bestCorner.cx, cy: bestCorner.cy, angle });
                                      return { ...e, corners };
                                    }
                                    return e;
                                  });
                                  onUpdate({ ...dw, elements: updEls, history: hist });
                                }
                                return;
                              }


                              // Modalità giunzione — click su marker apre pannello
                              if (drawMode === "junction") {
                                const JTOL = 24;
                                const nearest = junctions.reduce((best: any, j: any) => {
                                  const d = Math.hypot(j.ptX - mx, j.ptY - my);
                                  return (!best || d < best.d) ? { ...j, d } : best;
                                }, null);
                                if (nearest && nearest.d < JTOL) {
                                  setJunctionEdit(nearest);
                                }
                                return;
                              }

                              // Default — deselect
                              setMode({ selectedId: null });
                            };

                            // ══ Styles ══
                            const bs = (active = false) => ({ padding: "3px 6px", borderRadius: 5, border: `1px solid ${active ? "#1A9E73" : T.bdr}`, background: active ? `${"#1A9E73"}12` : T.card, fontSize: 9, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: active ? "#1A9E73" : T.text });
                            const bAp = (active = false) => ({ padding: "3px 6px", borderRadius: 5, border: `1px solid ${active ? T.blue : T.blue + "30"}`, background: active ? `${T.blue}12` : `${T.blue}05`, fontSize: 9, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: T.blue });
                            const bDel = (c2 = T.red) => ({ padding: "5px 9px", borderRadius: 6, border: `1px solid ${c2}30`, background: `${c2}08`, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: c2 });

                            const cursorMode = drawMode === "line" || drawMode === "apertura" || drawMode === "righello" || drawMode === "place-mont-free" || drawMode === "place-trav-free" || drawMode === "place-profile-free" ? "crosshair" : drawMode ? "pointer" : "default";

                            // ══ Apply dim change con propagazione catena ══
                            const dimEditRef = dimEdit; // accessibile in applyDimChange
                            const applyDimChange = (elId, valStr, isDim = false, side = 'right') => {
                              const newMM = parseInt(valStr);
                              if (isNaN(newMM) || newMM <= 0) return;

                              // Caso 1: dim di tipo "dim" (misure telaio)
                              if (isDim) {
                                const dimEl = els.find(x => x.id === elId);
                                if (!dimEl) return;
                                const oldVal = parseInt(dimEl.label);
                                if (isNaN(oldVal) || oldVal <= 0 || oldVal === newMM) return;
                                const isH = Math.abs(dimEl.y1 - dimEl.y2) < 2;
                                let upd = els.map(x => x.id === elId ? { ...x, label: String(newMM) } : x);
                                if (frame) {
                                  // Scala px→mm: quanti px vale 1mm in questo disegno
                                  const pxPerMmW = frame.w / (oldVal > 0 ? oldVal : 1);
                                  const pxPerMmH = frame.h / (oldVal > 0 ? oldVal : 1);
                                  if (isH) {
                                    // Larghezza — cambia solo frame.w, aggiorna dim label
                                    const newPxW = Math.round(newMM * pxPerMmW);
                                    const diff = newPxW - frame.w;
                                    upd = upd.map(x => {
                                      if (x.type === "rect") return { ...x, w: newPxW };
                                      if (x.type === "montante") {
                                        // Mantieni proporzione relativa
                                        const ratio = frame.w > 0 ? (x.x - frame.x) / frame.w : 0.5;
                                        return { ...x, x: Math.round(frame.x + ratio * newPxW) };
                                      }
                                      if (x.type === "dim" && x.id !== elId && isH) {
                                        // Aggiorna dim della larghezza totale
                                        return { ...x, x2: Math.round(x.x1 + newPxW) };
                                      }
                                      if ((x.type === "innerRect" || x.type === "glass")) {
                                        const ratio = frame.w > 0 ? (x.x - frame.x) / frame.w : 0;
                                        return { ...x, x: Math.round(frame.x + ratio * newPxW), w: Math.round(x.w * newPxW / frame.w) };
                                      }
                                      return x;
                                    });
                                    onUpdateField && onUpdateField("larghezza", newMM);
                                  } else {
                                    // Altezza — cambia solo frame.h
                                    const newPxH = Math.round(newMM * pxPerMmH);
                                    upd = upd.map(x => {
                                      if (x.type === "rect") return { ...x, h: newPxH };
                                      if (x.type === "traverso") {
                                        const ratio = frame.h > 0 ? (x.y - frame.y) / frame.h : 0.5;
                                        return { ...x, y: Math.round(frame.y + ratio * newPxH) };
                                      }
                                      if ((x.type === "innerRect" || x.type === "glass")) {
                                        const ratio = frame.h > 0 ? (x.y - frame.y) / frame.h : 0;
                                        return { ...x, y: Math.round(frame.y + ratio * newPxH), h: Math.round(x.h * newPxH / frame.h) };
                                      }
                                      return x;
                                    });
                                    onUpdateField && onUpdateField("altezza", newMM);
                                  }
                                }
                                setDW(upd);
                                return;
                              }
                              // Caso 2: freeLine — side: 'left'|'right'|'both'
                              if (isNaN(newMM) || newMM <= 0) return;
                              const el2 = els.find(x => x.id === elId);
                              if (!el2 || el2.type !== "freeLine") return;
                              const dx2 = el2.x2 - el2.x1, dy2 = el2.y2 - el2.y1;
                              const lenPx = Math.hypot(dx2, dy2) || 1;
                              const curMM = (dimEditRef as any)?.curMM ?? el2._mmOverride ?? Math.round(lenPx);
                              if (curMM <= 0) return;
                              const newLenPx = lenPx * newMM / curMM;
                              const ux = dx2 / lenPx, uy = dy2 / lenPx;
                              const CONN = 15;
                              // Calcola spostamento per ogni modalità
                              // right: sposta x2 (punto finale), left: sposta x1 (punto iniziale), both: metà per ciascuno
                              let updEls;
                              if (side === 'right') {
                                // Allunga/accorcia dal lato destro: x2 si sposta, x1 fisso
                                const newX2 = Math.round(el2.x1 + ux * newLenPx);
                                const newY2 = Math.round(el2.y1 + uy * newLenPx);
                                const ddx = newX2 - el2.x2, ddy = newY2 - el2.y2;
                                updEls = els.map(x => {
                                  if (x.id === elId) return { ...x, x2: newX2, y2: newY2, _mmOverride: newMM };
                                  if (x.type !== "freeLine") return x;
                                  if (Math.hypot(x.x1 - el2.x2, x.y1 - el2.y2) < CONN) return { ...x, x1: Math.round(x.x1 + ddx), y1: Math.round(x.y1 + ddy) };
                                  if (Math.hypot(x.x2 - el2.x2, x.y2 - el2.y2) < CONN) return { ...x, x2: Math.round(x.x2 + ddx), y2: Math.round(x.y2 + ddy) };
                                  return x;
                                });
                              } else if (side === 'left') {
                                // Allunga/accorcia dal lato sinistro: x1 si sposta, x2 fisso
                                const newX1 = Math.round(el2.x2 - ux * newLenPx);
                                const newY1 = Math.round(el2.y2 - uy * newLenPx);
                                const ddx = newX1 - el2.x1, ddy = newY1 - el2.y1;
                                updEls = els.map(x => {
                                  if (x.id === elId) return { ...x, x1: newX1, y1: newY1, _mmOverride: newMM };
                                  if (x.type !== "freeLine") return x;
                                  if (Math.hypot(x.x1 - el2.x1, x.y1 - el2.y1) < CONN) return { ...x, x1: Math.round(x.x1 + ddx), y1: Math.round(x.y1 + ddy) };
                                  if (Math.hypot(x.x2 - el2.x1, x.y2 - el2.y1) < CONN) return { ...x, x2: Math.round(x.x2 + ddx), y2: Math.round(x.y2 + ddy) };
                                  return x;
                                });
                              } else {
                                // both: distribuisce la differenza a metà su entrambi i lati
                                const diff = newLenPx - lenPx;
                                const halfDiff = diff / 2;
                                const newX1 = Math.round(el2.x1 - ux * halfDiff);
                                const newY1 = Math.round(el2.y1 - uy * halfDiff);
                                const newX2 = Math.round(el2.x2 + ux * halfDiff);
                                const newY2 = Math.round(el2.y2 + uy * halfDiff);
                                const ddxL = newX1 - el2.x1, ddyL = newY1 - el2.y1;
                                const ddxR = newX2 - el2.x2, ddyR = newY2 - el2.y2;
                                updEls = els.map(x => {
                                  if (x.id === elId) return { ...x, x1: newX1, y1: newY1, x2: newX2, y2: newY2, _mmOverride: newMM };
                                  if (x.type !== "freeLine") return x;
                                  if (Math.hypot(x.x1 - el2.x1, x.y1 - el2.y1) < CONN) return { ...x, x1: Math.round(x.x1 + ddxL), y1: Math.round(x.y1 + ddyL) };
                                  if (Math.hypot(x.x2 - el2.x1, x.y2 - el2.y1) < CONN) return { ...x, x2: Math.round(x.x2 + ddxL), y2: Math.round(x.y2 + ddyL) };
                                  if (Math.hypot(x.x1 - el2.x2, x.y1 - el2.y2) < CONN) return { ...x, x1: Math.round(x.x1 + ddxR), y1: Math.round(x.y1 + ddyR) };
                                  if (Math.hypot(x.x2 - el2.x2, x.y2 - el2.y2) < CONN) return { ...x, x2: Math.round(x.x2 + ddxR), y2: Math.round(x.y2 + ddyR) };
                                  return x;
                                });
                              }
                              setDW(updEls);
                            };

                            return (
                              <>
                              <div style={{
                                marginTop: window.innerWidth > 768 ? 8 : 0,
                                background: T.card,
                                borderRadius: window.innerWidth > 768 ? 12 : 0,
                                border: window.innerWidth > 768 ? `1.5px solid ${"#1A9E73"}` : "none",
                                overflow: "hidden",
                                // Mobile: posizione fissa fullscreen
                                ...(window.innerWidth <= 768 ? {
                                  position: "fixed" as const,
                                  top: 0, left: 0, right: 0, bottom: 0,
                                  paddingTop: "env(safe-area-inset-top)",
                                  paddingLeft: "env(safe-area-inset-left)",
                                  paddingRight: "env(safe-area-inset-right)",
                                  paddingBottom: "env(safe-area-inset-bottom)",
                                  zIndex: 1000,
                                  display: "flex",
                                  flexDirection: "column" as const,
                                  overflow: "hidden",
                                  borderRadius: 0,
                                  margin: 0,
                                  background: T.card,
                                } : {})
                              }}>
                                {/* Header */}
                                <div style={{ padding: "8px 12px", background: `${"#1A9E73"}10`, display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 14 }}>✏️</span>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: "#1A9E73", flex: 1 }}>Disegno — {vanoNome || "Vano"} ({realW}×{realH})</span>
                                  {/* Toggle Vista Interna / Esterna */}
                                  <div onClick={() => setVista(vista === "interna" ? "esterna" : "interna")}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                                      padding: "3px 8px", borderRadius: 12,
                                      background: vista === "interna" ? "#1A9E7320" : "#D0800820",
                                      border: `1.5px solid ${vista === "interna" ? "#1A9E73" : "#D08008"}`,
                                      fontSize: 10, fontWeight: 800,
                                      color: vista === "interna" ? "#1A9E73" : "#D08008",
                                    }}>
                                    {vista === "interna" ? "🏠 INT" : "🌳 EST"} ⇄
                                  </div>
                                  <span onClick={() => onClose()} style={{ fontSize: 16, cursor: "pointer", color: T.sub, padding: "2px 6px" }}>✕</span>
                                </div>

                                {/* ═══ TAB BAR ═══ */}
                                <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}` }}>
                                  {[{ id: "disegno", l: "✏️ Disegno", c: "#1A9E73" }, { id: "libero", l: "✍️ Libero", c: "#6366f1" }].map(tab => (
                                    <div key={tab.id} onClick={() => setViewTab(tab.id)}
                                      style={{ flex: 1, padding: "7px 0", textAlign: "center", fontSize: 11, fontWeight: viewTab === tab.id ? 800 : 500, color: viewTab === tab.id ? tab.c : T.sub, borderBottom: viewTab === tab.id ? `2.5px solid ${tab.c}` : "2.5px solid transparent", cursor: "pointer", transition: "all 0.15s" }}>
                                      {tab.l}
                                    </div>
                                  ))}
                                </div>

                                {/* ═══ TAB: FORMA ═══ */}
                                

                                {/* ═══ TAB: 3D ═══ */}
                                

                                {/* ═══ TAB: LIBERO (Paper.js) ═══ */}
                                {viewTab === "libero" && <LiberoEditor T={T} realW={realW} realH={realH} />}

                                {/* ═══ TAB: DISEGNO (originale) ═══ */}
                                {viewTab === "disegno" && <>
                                {/* Mode indicators */}
                                <div style={{ padding: "4px 8px 0", display: "flex", gap: 4, flexWrap: "wrap" }}>
                                  {drawMode === "line" && <span style={{ fontSize: 9, background: "#333", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>╱ STRUTTURA</span>}
                                  {drawMode === "apertura" && <span style={{ fontSize: 9, background: T.blue, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>↗ APERTURA</span>}
                                  {(drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") && <span style={{ fontSize: 9, background: T.grn, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>👆 CLICK su cella</span>}
                                  {(drawMode === "place-mont" || drawMode === "place-trav") && <span style={{ fontSize: 9, background: "#555", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>👆 {drawMode === "place-mont" ? "MONTANTE" : "TRAVERSO"} — click cella</span>}
                                  {drawMode === "place-mont-free" && <span style={{ fontSize: 9, background: "#555", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>{dw._pendingLine ? "2° click → fine montante" : "1° click → inizio montante"}</span>}
                                  {drawMode === "place-trav-free" && <span style={{ fontSize: 9, background: "#555", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>{dw._pendingLine ? "2° click → fine traverso" : "1° click → inizio traverso"}</span>}
                                  {drawMode === "place-profile-free" && <span style={{ fontSize: 9, background: "#D08008", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>{dw._pendingLine ? `2° click → fine ${dw._profileSub}` : `1° click → inizio ${dw._profileSub}`}</span>}
                                  {drawMode === "pan" && <span style={{ fontSize: 9, background: "#1A9E73", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>✋ SPOSTA — trascina il dito</span>}
                                  {drawMode === "place-ap" && <span style={{ fontSize: 9, background: T.blue, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>👆 {placeApType} — click cella</span>}
                                </div>

                                {/* ═══ TAB BAR MENU a 5 sezioni ═══ */}
                                <div style={{ display: "flex", gap: 3, padding: "4px 6px", borderBottom: `1px solid ${T.bdr}`, background: "#F8FAFA" }}>
                                  {[
                                    {id:"struttura",l:"Struttura",c:"#1A9E73"},
                                    {id:"profili",l:"Profili",c:"#1A7070"},
                                    {id:"aperture",l:"Aperture",c:"#3B7FE0"},
                                    {id:"sensi",l:"Sensi",c:"#D08008"},
                                    {id:"strumenti",l:"Strumenti",c:"#6366f1"},
                                  ].map(mt => (
                                    <div key={mt.id} onClick={() => setMenuTab(menuTab === mt.id ? null : mt.id as any)} style={{
                                      flex: 1, padding: "5px 0", textAlign: "center", fontSize: 9, fontWeight: 800,
                                      borderRadius: 6, cursor: "pointer",
                                      background: menuTab === mt.id ? mt.c : "white",
                                      color: menuTab === mt.id ? "white" : T.sub,
                                      border: `1px solid ${menuTab === mt.id ? mt.c : T.bdr}`,
                                    }}>{mt.l}</div>
                                  ))}
                                </div>

                                {/* ═══ TAB 1: STRUTTURA ═══ */}
                                {menuTab === "struttura" && <>
                                <div style={{ display: "flex", gap: 3, padding: "4px 6px 3px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={() => {
                                    if (frames.length === 0) {
                                      setDW([...els, { id: Date.now(), type: "rect", x: fX, y: fY, w: fW, h: fH }]);
                                    } else {
                                      const lastF = frames[frames.length - 1];
                                      const nw = lastF.w * 0.6, nh = lastF.h * 0.5;
                                      setDW([...els, { id: Date.now(), type: "rect", x: snap(lastF.x + lastF.w - TK_FRAME), y: snap(lastF.y + lastF.h - nh), w: snap(nw), h: snap(nh) }]);
                                    }
                                  }} style={bs()}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="3" width="18" height="18" rx="1"/></svg>Telaio</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "line" && !dw._lineSubType ? null : "line", _lineSubType: null, _pendingLine: null })} style={bs(drawMode === "line" && !dw._lineSubType)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polygon points="12,3 21,8 21,17 12,22 3,17 3,8"/></svg>Tel.Lib.</div>
                                  {drawMode === "line" && !dw._lineSubType && els.filter(e => e.type === "freeLine" && !e.subType).length >= 2 && (<>
                                    <div onClick={() => {
                                      const fl = els.filter(e => e.type === "freeLine");
                                      const ptCount = {};
                                      fl.forEach(l => { const k1 = Math.round(l.x1)+","+Math.round(l.y1); const k2 = Math.round(l.x2)+","+Math.round(l.y2); ptCount[k1]=(ptCount[k1]||0)+1; ptCount[k2]=(ptCount[k2]||0)+1; });
                                      const freePts = [];
                                      fl.forEach(l => { const k1=Math.round(l.x1)+","+Math.round(l.y1); const k2=Math.round(l.x2)+","+Math.round(l.y2); if(ptCount[k1]===1)freePts.push({x:l.x1,y:l.y1}); if(ptCount[k2]===1)freePts.push({x:l.x2,y:l.y2}); });
                                      if (freePts.length >= 2) { setDW([...els, { id: Date.now(), type: "freeLine", x1: freePts[0].x, y1: freePts[0].y, x2: freePts[1].x, y2: freePts[1].y }], { _pendingLine: null }); }
                                      else { setDW([...els, { id: Date.now(), type: "freeLine", x1: fl[fl.length-1].x2, y1: fl[fl.length-1].y2, x2: fl[0].x1, y2: fl[0].y1 }], { _pendingLine: null }); }

                                    }} style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #1A9E73", background: "#1A9E73", fontSize: 9, fontWeight: 800, cursor: "pointer", color: "#fff", whiteSpace: "nowrap" }}>Chiudi</div>
                                    <div onClick={() => {
                                      const fl = els.filter(e => e.type === "freeLine" && !e.subType);
                                      const ptCount: Record<string,number> = {};
                                      fl.forEach(l => { const k1 = Math.round(l.x1)+","+Math.round(l.y1); const k2 = Math.round(l.x2)+","+Math.round(l.y2); ptCount[k1]=(ptCount[k1]||0)+1; ptCount[k2]=(ptCount[k2]||0)+1; });
                                      const freePts: {x:number,y:number}[] = [];
                                      fl.forEach(l => { const k1=Math.round(l.x1)+","+Math.round(l.y1); const k2=Math.round(l.x2)+","+Math.round(l.y2); if(ptCount[k1]===1)freePts.push({x:l.x1,y:l.y1}); if(ptCount[k2]===1)freePts.push({x:l.x2,y:l.y2}); });
                                      if (freePts.length >= 2) { setDW([...els, { id: Date.now(), type: "virtualClose", x1: freePts[0].x, y1: freePts[0].y, x2: freePts[1].x, y2: freePts[1].y }], { _pendingLine: null }); }
                                    }} style={{ padding: "3px 8px", borderRadius: 5, border: "1px dashed #1A9E73", background: "#fff", fontSize: 9, fontWeight: 800, cursor: "pointer", color: "#1A9E73", whiteSpace: "nowrap" }}>Chiudi ⓥ</div>
                                  </>)}
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-mont" ? null : "place-mont", _pendingLine: null, _lineSubType: null })} style={bs(drawMode === "place-mont")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="12" y1="3" x2="12" y2="21"/></svg>Mont.</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-trav" ? null : "place-trav", _pendingLine: null, _lineSubType: null })} style={bs(drawMode === "place-trav")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="3" y1="12" x2="21" y2="12"/></svg>Trav.</div>
                                </div>
                                </>}

                                {/* ═══ TAB 2: PROFILI ═══ */}
                                {menuTab === "profili" && <>
                                <div style={{ display: "flex", gap: 3, padding: "4px 6px 3px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-mont-free" ? null : "place-mont-free", _pendingLine: null })}
                                    style={bs(drawMode === "place-mont-free")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="12" y1="3" x2="12" y2="21"/></svg>Mont.Lib.</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-trav-free" ? null : "place-trav-free", _pendingLine: null })}
                                    style={bs(drawMode === "place-trav-free")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="3" y1="12" x2="21" y2="12"/></svg>Trav.Lib.</div>
                                  {/* Soglia / Zoccolo / Fascia / Soglia Rib. / Prof.Comp. — catena a filo */}
                                  <div onClick={() => setMode({ drawMode: drawMode === "line" && dw._lineSubType === "soglia" ? null : "line", _lineSubType: "soglia", _pendingLine: null })}
                                    style={bs(drawMode === "line" && dw._lineSubType === "soglia")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="14" width="18" height="4" rx="0.5"/></svg>Soglia</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "line" && dw._lineSubType === "zoccolo" ? null : "line", _lineSubType: "zoccolo", _pendingLine: null })}
                                    style={bs(drawMode === "line" && dw._lineSubType === "zoccolo")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="16" width="18" height="6" rx="0.5" fill="currentColor" fillOpacity="0.15"/></svg>Zoccolo</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "line" && dw._lineSubType === "fascia" ? null : "line", _lineSubType: "fascia", _pendingLine: null })}
                                    style={bs(drawMode === "line" && dw._lineSubType === "fascia")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="2" width="18" height="5" rx="0.5"/></svg>Fascia</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "line" && dw._lineSubType === "soglia_rib" ? null : "line", _lineSubType: "soglia_rib", _pendingLine: null })}
                                    style={bs(drawMode === "line" && dw._lineSubType === "soglia_rib")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><path d="M3 18 L8 14 L16 14 L21 18 Z"/></svg>Sog.Rib.</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "line" && dw._lineSubType === "profcomp" ? null : "line", _lineSubType: "profcomp", _pendingLine: null })}
                                    style={bs(drawMode === "line" && dw._lineSubType === "profcomp")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="3" y1="12" x2="21" y2="12" strokeWidth="3"/></svg>Prof.Comp.</div>
                                </div>
                                {/* Sub-riga: versioni LIBERE a 2 click (parte-fine libero) */}
                                <div style={{ display: "flex", gap: 3, padding: "0 6px 4px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}`, background: "#FCF9F4" }}>
                                  <span style={{ fontSize: 8, fontWeight: 800, color: "#888", alignSelf: "center", marginRight: 4 }}>LIB.</span>
                                  {[
                                    {id:"soglia",l:"Soglia"},
                                    {id:"zoccolo",l:"Zoccolo"},
                                    {id:"fascia",l:"Fascia"},
                                    {id:"soglia_rib",l:"Sog.Rib."},
                                    {id:"profcomp",l:"P.Comp."},
                                  ].map(pf => {
                                    const active = drawMode === "place-profile-free" && dw._profileSub === pf.id;
                                    return (
                                      <div key={pf.id} onClick={() => setMode({ drawMode: active ? null : "place-profile-free", _profileSub: pf.id, _pendingLine: null, _lineSubType: null })}
                                        style={{ ...bs(active), borderStyle: "dashed" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" style={{display:"inline",verticalAlign:"middle",marginRight:2}}><line x1="3" y1="12" x2="21" y2="12"/></svg>{pf.l}</div>
                                    );
                                  })}
                                </div>
                                </>}

                                {/* ═══ TAB 3: APERTURE (tipo) ═══ */}
                                {menuTab === "aperture" && <>
                                <div style={{ display: "flex", gap: 3, padding: "4px 6px 3px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-anta" ? null : "place-anta", _pendingLine: null })} style={bs(drawMode === "place-anta")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="4" y="3" width="16" height="18" rx="0.5"/><line x1="12" y1="3" x2="12" y2="21"/></svg>Anta</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-porta" ? null : "place-porta", _pendingLine: null })} style={bs(drawMode === "place-porta")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><path d="M4 21 V4 Q4 3 5 3 H19 Q20 3 20 4 V21"/><circle cx="16" cy="12" r="1" fill="currentColor"/></svg>Porta</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-persiana" ? null : "place-persiana", _pendingLine: null })} style={bs(drawMode === "place-persiana")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="3" width="18" height="18" rx="0.5"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/></svg>Pers.</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-vetro" ? null : "place-vetro", _pendingLine: null })} style={bs(drawMode === "place-vetro")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="3" width="18" height="18" rx="0.5"/><line x1="6" y1="6" x2="10" y2="6"/><line x1="6" y1="6" x2="6" y2="10"/></svg>Vetro</div>
                                  <div onClick={() => { const cx=frame?frame.x+frame.w/2:fX+fW/2; const cy=frame?frame.y+frame.h/2:fY+fH/2; setDW([...els,{id:Date.now(),type:"circle",cx,cy,r:Math.min(fW,fH)/4}]); }} style={bs()}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><circle cx="12" cy="12" r="9"/></svg>Oblò</div>
                                </div>
                                </>}

                                {/* ═══ TAB 4: SENSI APERTURA ═══ */}
                                {menuTab === "sensi" && <>
                                <div style={{ display: "flex", gap: 3, padding: "4px 6px 3px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
                                  {[
                                    {id:"SX",l:"SX",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="15,6 9,12 15,18"/></svg>},
                                    {id:"DX",l:"DX",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="9,6 15,12 9,18"/></svg>},
                                    {id:"RIB",l:"Rib.",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="6,9 12,3 18,9"/><polyline points="6,15 12,21 18,15"/></svg>},
                                    {id:"OB",l:"OB",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="6,15 4,21 10,19"/><polyline points="6,9 12,3 18,9"/><line x1="12" y1="3" x2="4" y2="21"/></svg>},
                                    {id:"ALZ",l:"Alz.",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="6,14 12,8 18,14"/><line x1="4" y1="20" x2="20" y2="20"/></svg>},
                                    {id:"SCO",l:"Sco.",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="7,9 3,12 7,15"/><polyline points="17,9 21,12 17,15"/><line x1="3" y1="12" x2="21" y2="12"/></svg>},
                                    {id:"FISSO",l:"Fisso",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="4" y="4" width="16" height="16" rx="0.5"/><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>},
                                  ].map(ap => (
                                    <div key={ap.id} onClick={() => setMode({ drawMode: "place-ap", _placeApType: ap.id, _pendingLine: null })} style={bAp(drawMode === "place-ap" && placeApType === ap.id)}>{ap.icon}{ap.l}</div>
                                  ))}
                                </div>
                                </>}

                                {/* ═══ GRUPPO 3: ANNOTAZIONI + STRUMENTI ═══ */}
                                {menuTab === "strumenti" && <>
                                <div style={{ display: "flex", gap: 2, padding: "4px 6px 3px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
                                  {/* Sposta — pan del canvas con 1 dito */}
                                  <div onClick={() => setMode({ drawMode: drawMode === "pan" ? null : "pan", _pendingLine: null })} style={{ ...bs(drawMode === "pan"), background: drawMode === "pan" ? "#1A9E7312" : undefined, color: drawMode === "pan" ? "#1A9E73" : undefined, border: `1px solid ${drawMode === "pan" ? "#1A9E73" : T.bdr}` }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="5,9 2,12 5,15"/><polyline points="9,5 12,2 15,5"/><polyline points="15,19 12,22 9,19"/><polyline points="19,9 22,12 19,15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>Sposta</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "apertura" ? null : "apertura", _pendingLine: null })} style={bAp(drawMode === "apertura")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="5" y1="19" x2="19" y2="5"/><polyline points="10,5 19,5 19,14"/></svg>Linea lib.</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "pen" ? null : "pen", _penPath: null })} style={bs(drawMode === "pen")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><line x1="2" y1="2" x2="7.586" y2="7.586"/></svg>Penna</div>
                                  <div onClick={() => { const txt = prompt("Testo:"); if (!txt) return; const cx2=frame?frame.x+frame.w/2:fX+fW/2; const cy2=frame?frame.y+frame.h/2:fY+fH/2; setDW([...els,{id:Date.now(),type:"label",x:cx2,y:cy2,text:txt,fontSize:11}]); }} style={bs()}>Aa Testo</div>
                                  <div onClick={() => {
                                    const nEls = els.filter(e => e.type !== "dim");
                                    if (frame) {
                                      nEls.push({id:Date.now()+300,type:"dim",x1:frame.x,y1:frame.y+frame.h+14,x2:frame.x+frame.w,y2:frame.y+frame.h+14,label:String(realW)},{id:Date.now()+301,type:"dim",x1:frame.x+frame.w+14,y1:frame.y,x2:frame.x+frame.w+14,y2:frame.y+frame.h,label:String(realH)});
                                      const iT=frame.y+TK_FRAME,iL=frame.x+TK_FRAME;
                                      const topCells=cells.filter(c2=>Math.abs(c2.y-iT)<4).sort((a,b)=>a.x-b.x);
                                      if(topCells.length>1)topCells.forEach((c2,i)=>nEls.push({id:Date.now()+310+i,type:"dim",x1:c2.x,y1:frame.y-10,x2:c2.x+c2.w,y2:frame.y-10,label:String(Math.round(c2.w/fW*realW))}));
                                      const leftCells=cells.filter(c2=>Math.abs(c2.x-iL)<4).sort((a,b)=>a.y-b.y);
                                      if(leftCells.length>1)leftCells.forEach((c2,i)=>nEls.push({id:Date.now()+330+i,type:"dim",x1:frame.x-14,y1:c2.y,x2:frame.x-14,y2:c2.y+c2.h,label:String(Math.round(c2.h/fH*realH))}));
                                    } else if (poly) {
                                      const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);
                                      const bL=Math.min(...xs),bR=Math.max(...xs),bT=Math.min(...ys),bB=Math.max(...ys);
                                      nEls.push({id:Date.now()+300,type:"dim",x1:bL,y1:bB+14,x2:bR,y2:bB+14,label:String(realW)},{id:Date.now()+301,type:"dim",x1:bR+14,y1:bT,x2:bR+14,y2:bB,label:String(realH)});
                                      els.filter(e=>e.type==="freeLine").forEach((fl,fi)=>{const dx2=fl.x2-fl.x1,dy2=fl.y2-fl.y1;const segPx=Math.hypot(dx2,dy2);const diagMM=Math.hypot(realW,realH);const totalPx=Math.hypot(bR-bL,bB-bT);const segMM=Math.round(segPx/totalPx*diagMM);const cx=(bL+bR)/2,cy=(bT+bB)/2;const mx=(fl.x1+fl.x2)/2,my=(fl.y1+fl.y2)/2;const toCx=cx-mx,toCy=cy-my;const dist=Math.hypot(toCx,toCy)||1;const offX=-toCx/dist*16,offY=-toCy/dist*16;nEls.push({id:Date.now()+350+fi,type:"dim",x1:fl.x1+offX,y1:fl.y1+offY,x2:fl.x2+offX,y2:fl.y2+offY,label:String(segMM)});});
                                    }
                                    setDW(nEls);
                                  }} style={bs()}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="9" x2="3" y2="15"/><line x1="21" y1="9" x2="21" y2="15"/></svg>Misure</div>
                                  {/* Righello / Metro */}
                                  <div onClick={() => setMode({ drawMode: drawMode === "righello" ? null : "righello", _pendingLine: null })} style={{ ...bs(drawMode === "righello"), background: drawMode === "righello" ? "#3B7FE012" : undefined, color: drawMode === "righello" ? T.blue : undefined, border: `1px solid ${drawMode === "righello" ? T.blue : T.bdr}` }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><path d="M3 21L21 3L21 9L3 21Z"/><line x1="7" y1="17" x2="9" y2="15"/><line x1="11" y1="13" x2="13" y2="11"/><line x1="15" y1="9" x2="17" y2="7"/></svg>Righello</div>
                                  {/* Toggle Gradi — mostra angoli numerici sui vertici */}
                                  <div onClick={() => setMode({ _showGradi: !dw._showGradi })} style={{ ...bs(dw._showGradi), background: dw._showGradi ? "#D0800812" : undefined, color: dw._showGradi ? "#D08008" : undefined, border: `1px solid ${dw._showGradi ? "#D08008" : T.bdr}` }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><path d="M3 21 L21 21 L3 3 Z"/><path d="M8 21 A5 5 0 0 0 3 16" strokeWidth="1.5"/></svg>Gradi</div>
                                  {/* Toggle Miter 45 — forza taglio 45 a tutti gli angoli del telaio libero */}
                                  <div onClick={() => {
                                    const next = !dw._miter45;
                                    if (next) {
                                      // Applica 45 a tutte le giunzioni esistenti
                                      const all45 = junctions.map((j: any) => ({ ...j, type: "45", winner: "A" }));
                                      setMode({ _miter45: true, _junctions: all45 });
                                    } else {
                                      // Riporta a 90
                                      const all90 = (dw._junctions || []).map((j: any) => ({ ...j, type: "90" }));
                                      setMode({ _miter45: false, _junctions: all90 });
                                    }
                                  }} style={{ ...bs(dw._miter45), background: dw._miter45 ? "#1A9E7312" : undefined, color: dw._miter45 ? "#1A9E73" : undefined, border: `1px solid ${dw._miter45 ? "#1A9E73" : T.bdr}` }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="3" y1="21" x2="12" y2="12"/><line x1="12" y1="12" x2="21" y2="21"/><line x1="12" y1="12" x2="12" y2="3"/></svg>Angoli 45°</div>
                                  {/* Distinta materiali */}
                                  <div onClick={() => setMode({ _showDistinta: !dw._showDistinta })} style={{ ...bs(dw._showDistinta), background: dw._showDistinta ? "#D0800812" : undefined, color: dw._showDistinta ? "#D08008" : undefined, border: `1px solid ${dw._showDistinta ? "#D08008" : T.bdr}` }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="5" y="3" width="14" height="18" rx="1"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>Distinta</div>
                                  {/* Giunzioni */}
                                  {junctions.length > 0 && <div onClick={() => setMode({ drawMode: drawMode === "junction" ? null : "junction", _pendingLine: null })} style={{ ...bs(drawMode === "junction"), background: drawMode === "junction" ? "#3B7FE012" : undefined, color: drawMode === "junction" ? T.blue : undefined, border: `1.5px solid ${drawMode === "junction" ? T.blue : T.bdr}` }}>⌐ Giunzioni ({junctions.length})</div>}
                                </div>
                                </>}



                                {/* Row 3: Azioni */}
                                <div style={{ display: "flex", gap: 3, padding: "0 8px 6px", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={undo} style={bDel(T.acc)}>↩ Annulla</div>
                                  {selId && <div onClick={() => {
                                    // Se selId è "antaId:side", elimina solo quel lato aggiungendolo a hiddenSides
                                    const selStr = String(selId);
                                    if (selStr.includes(":")) {
                                      const [antaIdStr, side] = selStr.split(":");
                                      const antaId = isNaN(Number(antaIdStr)) ? antaIdStr : Number(antaIdStr);
                                      const upd = els.map(e => {
                                        if (e.id !== antaId) return e;
                                        const hidden = [...(e.hiddenSides || []), side];
                                        return { ...e, hiddenSides: hidden };
                                      });
                                      setDW(upd, { selectedId: null });
                                    } else {
                                      setDW(els.filter(e => e.id !== selId), { selectedId: null });
                                    }
                                  }} style={bDel()}>Elimina</div>}
                                  {selId && (() => {
                                    const selEl = els.find(e => e.id === selId);
                                    if (!selEl) return null;
                                    const canChange = ["polyAnta","polyGlass","polyPersiana","innerRect","persiana","glass"].includes(selEl.type);
                                    if (!canChange) return null;
                                    const changeType = (newType, newSubType) => {
                                      const upd = els.map(e => {
                                        if (e.id !== selId) return e;
                                        if (newType === "polyAnta") return { ...e, type: "polyAnta", subType: newSubType || undefined };
                                        if (newType === "polyGlass") return { ...e, type: "polyGlass", subType: undefined };
                                        if (newType === "polyPersiana") return { ...e, type: "polyPersiana", subType: undefined };
                                        return e;
                                      });
                                      setDW(upd, { selectedId: selId });
                                    };
                                    return <>
                                      {selEl.type !== "polyAnta" && <div onClick={() => changeType("polyAnta")} style={bDel("#1A9E73")}>Anta</div>}
                                      {(selEl.type !== "polyAnta" || selEl.subType !== "porta") && <div onClick={() => changeType("polyAnta","porta")} style={bDel("#D08008")}>Porta</div>}
                                      {selEl.type !== "polyGlass" && <div onClick={() => changeType("polyGlass")} style={bDel("#3B7FE0")}>Vetro</div>}
                                      {selEl.type !== "polyPersiana" && <div onClick={() => changeType("polyPersiana")} style={bDel("#666")}>Persiana</div>}
                                    </>;
                                  })()}
                                  <div style={{ flex: 1 }} />
                                  <div onClick={() => setDW([], { selectedId: null, drawMode: null, _pendingLine: null, history: [] })} style={bDel()}>🗑 Reset</div>
                                  {frame && <div onClick={() => {
                                    // Aggiusta tutti i freeLine al bordo interno del frame
                                    const TKF = 6;
                                    const fi = {l:frame.x+TKF, r:frame.x+frame.w-TKF, t:frame.y+TKF, b:frame.y+frame.h-TKF};
                                    const fixed = els.map(e => {
                                      if (e.type !== "freeLine") return e;
                                      const isH = Math.abs(e.x2-e.x1) >= Math.abs(e.y2-e.y1);
                                      if (isH) {
                                        const dTop = Math.abs(e.y1 - fi.t), dBot = Math.abs(e.y1 - fi.b);
                                        const newY = dTop <= dBot ? fi.t : fi.b;
                                        return {...e, x1:Math.max(fi.l,Math.min(fi.r,e.x1)), x2:Math.max(fi.l,Math.min(fi.r,e.x2)), y1:newY, y2:newY};
                                      } else {
                                        const dL = Math.abs(e.x1 - fi.l), dR = Math.abs(e.x1 - fi.r);
                                        const newX = dL <= dR ? fi.l : fi.r;
                                        return {...e, y1:Math.max(fi.t,Math.min(fi.b,e.y1)), y2:Math.max(fi.t,Math.min(fi.b,e.y2)), x1:newX, x2:newX};
                                      }
                                    });
                                    setDW(fixed);
                                  }} style={{...bDel("#1A9E73"), background:"#1A9E7312"}}>⚡ Aggiusta</div>}
                                  <div style={{ flex: 1 }} />
                                  <div onClick={() => setMode({ _zoom: Math.max(0.5, (zoom || 1) - 0.25) })} style={{ ...bs(), fontSize: 14, padding: "3px 8px" }}>−</div>
                                  <div style={{ fontSize: 9, fontWeight: 800, color: T.sub, minWidth: 32, textAlign: "center" }}>{Math.round(zoom * 100)}%</div>
                                  <div onClick={() => setMode({ _zoom: Math.min(4, (zoom || 1) + 0.25) })} style={{ ...bs(), fontSize: 14, padding: "3px 8px" }}>+</div>
                                  <div onClick={() => setMode({ _zoom: 1, _panX: 0, _panY: 0 })} style={{ ...bs(), fontSize: 9 }}>Fit</div>
                                </div>

                                {/* SVG Canvas — zoomable with wheel + pannable */}
                                <div style={{ overflow: "hidden", position: "relative", flex: "1 1 0", minHeight: 300, border: `1px solid ${T.bdr}` }}>
                                {/* Badge Vista — fisso sopra al canvas */}
                                <div style={{
                                  position: "absolute", top: 8, left: 8, zIndex: 10,
                                  padding: "4px 10px", borderRadius: 14,
                                  background: vista === "interna" ? "#1A9E73" : "#D08008",
                                  color: "white", fontSize: 10, fontWeight: 900,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                                  pointerEvents: "none",
                                  letterSpacing: 0.5,
                                }}>
                                  {vista === "interna" ? "🏠 VISTA INTERNA" : "🌳 VISTA ESTERNA (specchiata)"}
                                </div>
                                <svg width="100%" height="100%"
                                  viewBox={`${panX} ${panY} ${canvasW / zoom} ${canvasH / zoom}`}
                                  style={{ display: "block", background: "#fff", touchAction: "none", cursor: drawMode ? cursorMode : (zoom > 1 ? "grab" : "default"), transform: vista === "esterna" ? "scaleX(-1)" : "none", transition: "transform 0.3s ease" }}
                                  onClick={onSvgClick}
                                  onWheel={(e2) => {
                                    e2.preventDefault();
                                    const newZoom = Math.max(0.15, Math.min(6, zoom + (e2.deltaY < 0 ? 0.15 : -0.15)));
                                    setMode({ _zoom: newZoom });
                                  }}
                                  onMouseDown={(e2) => {
                                    // Pen mode — inizia tracciato
                                    if (drawMode === "pen" && e2.button === 0) {
                                      const svg = e2.currentTarget;
                                      const { mx: gmx, my: gmy } = getSvgXY(e2, svg);
                                      onUpdate({ ...dw, _penActive: true, _penPath: [[Math.round(gmx), Math.round(gmy)]] });
                                      return;
                                    }
                                    // Pan with middle mouse or shift+left
                                    if (e2.button === 1 || (e2.shiftKey && e2.button === 0)) {
                                      e2.preventDefault();
                                      const sx = e2.clientX, sy = e2.clientY;
                                      const sp = panX, spp = panY;
                                      const onPM = (ev) => {
                                        const ndx = (ev.clientX - sx) / zoom;
                                        const ndy = (ev.clientY - sy) / zoom;
                                        onUpdate({ ...dw, _panX: sp - ndx, _panY: spp - ndy });
                                      };
                                      const onPU = () => { document.removeEventListener("mousemove", onPM); document.removeEventListener("mouseup", onPU); };
                                      document.addEventListener("mousemove", onPM);
                                      document.addEventListener("mouseup", onPU);
                                    }
                                  }}
                                  onMouseMove={(e2) => {
                                    const dw = dwRef.current;
                                    const els = dw.elements || [];
                                    const drawMode = dw.drawMode || null;
                                    const svg = e2.currentTarget;
                                    // Pen mode — traccia path
                                    if (drawMode === "pen" && dw._penActive) {
                                      const { mx: gmx, my: gmy } = getSvgXY(e2, svg);
                                      const cur = dw._penPath || [];
                                      onUpdate({ ...dw, _penPath: [...cur, [Math.round(gmx), Math.round(gmy)]] });
                                      return;
                                    }
                                    if (!dw._pendingLine || !(drawMode === "line" || drawMode === "apertura" || drawMode === "righello" || drawMode === "place-mont-free" || drawMode === "place-trav-free" || drawMode === "place-profile-free")) return;
                                    const { mx: gmx, my: gmy } = getSvgXY(e2, svg);
                                    let gx = Math.round(gmx), gy = Math.round(gmy);
                                    const p = dw._pendingLine;
                                    // Snap a punti esistenti durante il movimento
                                    const snapPt = findSnap(gx, gy);
                                    if (snapPt) { gx = snapPt.x; gy = snapPt.y; }
                                    // H/V snap: forza allineamento SEMPRE se quasi verticale/orizzontale
                                    const adx = Math.abs(gx - p.x1), ady = Math.abs(gy - p.y1);
                                    if (adx < 25 && ady > adx * 1.5) gx = p.x1;
                                    if (ady < 25 && adx > ady * 1.5) gy = p.y1;
                                    // Tel.Lib. senza subType: snap Y ai piedi di altri segmenti verticali
                                    if (drawMode === "line" && !dw._lineSubType && !p._subType && gx === p.x1) {
                                      const _otherVY = els.filter((e: any) => e.type === "freeLine" && !e.subType && Math.abs(e.x1 - e.x2) < 3)
                                        .flatMap((l: any) => [l.y1, l.y2]);
                                      _otherVY.forEach(vy => { if (Math.abs(gy - vy) < 10) gy = vy; });
                                    }
                                    // Mont.Lib / Profile montante: forza verticale
                                    const _pSub = p._subType || dw._lineSubType;
                                    if (drawMode === "place-mont-free" || _pSub === "montante") {
                                      gx = p.x1;
                                      // Snap Y solo a vertici sulla stessa colonna (±30px) per allineare piedi
                                      const colVerts = els.filter((e: any) => e.type === "freeLine").flatMap((l: any) => [
                                        { x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }
                                      ]);
                                      let bestYsnap = 10, bestYval: number|null = null;
                                      colVerts.forEach(pt => {
                                        if (Math.abs(pt.x - p.x1) > 30) { // vertici su ALTRE colonne
                                          const dy = Math.abs(gy - pt.y);
                                          if (dy < bestYsnap) { bestYsnap = dy; bestYval = pt.y; }
                                        }
                                      });
                                      if (bestYval !== null) gy = bestYval;
                                      if (frame) gy = Math.max(frame.y, Math.min(frame.y + frame.h, gy));
                                    }
                                    // Trav.Lib / Profile traverso: forza orizzontale
                                    if (drawMode === "place-trav-free" || _pSub === "traverso") {
                                      gy = p.y1;
                                      if (frame) gx = Math.max(frame.x, Math.min(frame.x + frame.w, gx));
                                    }
                                    const deg = Math.round(Math.atan2(-(gy - p.y1), gx - p.x1) * 180 / Math.PI);
                                    const len = Math.round(Math.hypot(gx - p.x1, gy - p.y1) / fW * realW);
                                    if (dw._guideX !== gx || dw._guideY !== gy) {
                                      onUpdate({ ...dw, _guideX: gx, _guideY: gy, _guideDeg: deg, _guideLen: len });
                                    }
                                  }}
                                  onMouseUp={(e2) => {
                                    // Pen mode — salva path come elemento
                                    if (drawMode === "pen" && dw._penActive) {
                                      const pts2 = dw._penPath || [];
                                      if (pts2.length > 2) {
                                        const d = pts2.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
                                        setDW([...els, { id: Date.now(), type: "penPath", d }], { _penActive: false, _penPath: null });
                                      } else {
                                        onUpdate({ ...dw, _penActive: false, _penPath: null });
                                      }
                                    }
                                  }}
                                  onTouchStart={(e2) => {
                                    // ── Pinch zoom con 2 dita ──
                                    if (e2.touches.length === 2) {
                                      e2.preventDefault();
                                      _lastPinch.current = Math.hypot(
                                        e2.touches[0].clientX - e2.touches[1].clientX,
                                        e2.touches[0].clientY - e2.touches[1].clientY
                                      );
                                      return;
                                    }
                                    // ── Pan con 1 dito in modalità "pan" ──
                                    if (drawMode === "pan") {
                                      e2.preventDefault();
                                      const t = e2.touches[0];
                                      _panStart.current = { x: t.clientX, y: t.clientY, panX, panY };
                                      return;
                                    }
                                    if (drawMode === "pen") {
                                      e2.preventDefault();
                                      const svg = e2.currentTarget;
                                      const t = e2.touches[0];
                                      const rect = svg.getBoundingClientRect();
                                      const vb = svg.viewBox?.baseVal;
                                      const sx = vb ? vb.width / rect.width : 1;
                                      const sy2 = vb ? vb.height / rect.height : 1;
                                      const gmx = Math.round((t.clientX - rect.left) * sx);
                                      const gmy = Math.round((t.clientY - rect.top) * sy2);
                                      onUpdate({ ...dw, _penActive: true, _penPath: [[gmx, gmy]] });
                                    }
                                  }}
                                  onTouchMove={(e2) => {
                                    const dw = dwRef.current;
                                    const els = dw.elements || [];
                                    const drawMode = dw.drawMode || null;
                                    // ── Pinch zoom con 2 dita ──
                                    if (e2.touches.length === 2 && _lastPinch.current != null) {
                                      e2.preventDefault();
                                      const d = Math.hypot(
                                        e2.touches[0].clientX - e2.touches[1].clientX,
                                        e2.touches[0].clientY - e2.touches[1].clientY
                                      );
                                      const delta = (d - _lastPinch.current) / 100;
                                      const newZoom = Math.max(0.15, Math.min(6, (dw._zoom || 1) + delta));
                                      onUpdate({ ...dw, _zoom: newZoom });
                                      _lastPinch.current = d;
                                      return;
                                    }
                                    // ── Pan con 1 dito in modalità "pan" ──
                                    if (drawMode === "pan" && _panStart.current) {
                                      e2.preventDefault();
                                      const t = e2.touches[0];
                                      const svg = e2.currentTarget;
                                      const rect = svg.getBoundingClientRect();
                                      const vb = svg.viewBox?.baseVal;
                                      const sx = vb ? vb.width / rect.width : 1;
                                      const sy2 = vb ? vb.height / rect.height : 1;
                                      const dx = (t.clientX - _panStart.current.x) * sx;
                                      const dy = (t.clientY - _panStart.current.y) * sy2;
                                      onUpdate({ ...dw, _panX: _panStart.current.panX - dx, _panY: _panStart.current.panY - dy });
                                      return;
                                    }
                                    e2.preventDefault();
                                    const svg = e2.currentTarget;
                                    const t = e2.touches[0];
                                    const rect = svg.getBoundingClientRect();
                                    const vb = svg.viewBox?.baseVal;
                                    const sx = vb ? vb.width / rect.width : 1;
                                    const sy2 = vb ? vb.height / rect.height : 1;
                                    const gmx = (t.clientX - rect.left) * sx;
                                    const gmy = (t.clientY - rect.top) * sy2;
                                    // Pen mode touch
                                    if (drawMode === "pen" && dw._penActive) {
                                      const cur = dw._penPath || [];
                                      onUpdate({ ...dw, _penPath: [...cur, [Math.round(gmx), Math.round(gmy)]] });
                                      return;
                                    }
                                    if (!dw._pendingLine || !(drawMode === "line" || drawMode === "apertura" || drawMode === "righello" || drawMode === "place-mont-free" || drawMode === "place-trav-free" || drawMode === "place-profile-free")) return;
                                    let gx = Math.round(gmx), gy = Math.round(gmy);
                                    const pp = dw._pendingLine;
                                    const snapPtT = findSnap(gx, gy);
                                    if (snapPtT) { gx = snapPtT.x; gy = snapPtT.y; }
                                    // H/V snap: forza allineamento SEMPRE se quasi verticale/orizzontale
                                    const adxT = Math.abs(gx - pp.x1), adyT = Math.abs(gy - pp.y1);
                                    if (adxT < 25 && adyT > adxT * 1.5) gx = pp.x1;
                                    if (adyT < 25 && adxT > adyT * 1.5) gy = pp.y1;
                                    // Tel.Lib. senza subType: snap Y ai piedi di altri montanti
                                    if (drawMode === "line" && !dw._lineSubType && !pp._subType && gx === pp.x1) {
                                      const _otherVYT = els.filter((e: any) => e.type === "freeLine" && !e.subType && Math.abs(e.x1 - e.x2) < 3)
                                        .flatMap((l: any) => [l.y1, l.y2]);
                                      _otherVYT.forEach(vy => { if (Math.abs(gy - vy) < 10) gy = vy; });
                                    }
                                    const _pSubT = pp._subType || dw._lineSubType;
                                    if (drawMode === "place-mont-free" || _pSubT === "montante") {
                                      gx = pp.x1;
                                      const colVertsT = els.filter((e: any) => e.type === "freeLine").flatMap((l: any) => [
                                        { x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }
                                      ]);
                                      let bestYsT = 10, bestYvT: number|null = null;
                                      colVertsT.forEach(pt => {
                                        if (Math.abs(pt.x - pp.x1) > 30) {
                                          const dy = Math.abs(gy - pt.y);
                                          if (dy < bestYsT) { bestYsT = dy; bestYvT = pt.y; }
                                        }
                                      });
                                      if (bestYvT !== null) gy = bestYvT;
                                      if (frame) gy = Math.max(frame.y, Math.min(frame.y + frame.h, gy));
                                    }
                                    if (drawMode === "place-trav-free" || _pSubT === "traverso") { gy = pp.y1; if (frame) gx = Math.max(frame.x, Math.min(frame.x + frame.w, gx)); }
                                    const deg = Math.round(Math.atan2(-(gy - pp.y1), gx - pp.x1) * 180 / Math.PI);
                                    const len = Math.round(Math.hypot(gx - pp.x1, gy - pp.y1) / fW * realW);
                                    if (dw._guideX !== gx || dw._guideY !== gy) {
                                      onUpdate({ ...dw, _guideX: gx, _guideY: gy, _guideDeg: deg, _guideLen: len });
                                    }
                                  }}
                                  onTouchEnd={(e2) => {
                                    // Reset refs pinch/pan
                                    if (e2.touches.length < 2) _lastPinch.current = null;
                                    if (e2.touches.length === 0) _panStart.current = null;
                                    if (drawMode === "pen" && dw._penActive) {
                                      const pts2 = dw._penPath || [];
                                      if (pts2.length > 2) {
                                        const d = pts2.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
                                        setDW([...els, { id: Date.now(), type: "penPath", d }], { _penActive: false, _penPath: null });
                                      } else {
                                        onUpdate({ ...dw, _penActive: false, _penPath: null });
                                      }
                                    }
                                  }}
                                  onMouseLeave={() => { if (dw._guideX != null) onUpdate({ ...dw, _guideX: null, _guideY: null }); }}>
                                  <defs>
                                    <pattern id={`dg-${vanoId}`} width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                                      <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                                    </pattern>
                                    {(polyVC || poly) && <clipPath id={`polyClip-${vanoId}`}><polygon points={(polyVC || poly).map(p => p.join(",")).join(" ")} /></clipPath>}
                                    {frame && <clipPath id={`frameClip-${vanoId}`}><rect x={frame.x+6} y={frame.y+6} width={frame.w-12} height={frame.h-12} /></clipPath>}
                                  </defs>
                                  <rect x={panX - 100} y={panY - 100} width={canvasW / zoom + 200} height={canvasH / zoom + 200} fill={`url(#dg-${vanoId})`} />

                                  {/* Cell highlights in place mode — clipped to polygon if present */}
                                  {(drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-ap" || drawMode === "place-mont" || drawMode === "place-trav" || drawMode === "place-porta" || drawMode === "place-persiana") && cells.length > 0 && (
                                    <g clipPath={(polyVC || poly) ? `url(#polyClip-${vanoId})` : undefined}>
                                      {cells.map(c2 => (
                                        <rect key={`cell-${c2.id}`} x={c2.x + 1} y={c2.y + 1} width={c2.w - 2} height={c2.h - 2}
                                          fill={drawMode === "place-ap" ? T.blue : drawMode === "place-mont" || drawMode === "place-trav" ? "#555" : T.grn} fillOpacity={0.06}
                                          stroke={drawMode === "place-ap" ? T.blue : drawMode === "place-mont" || drawMode === "place-trav" ? "#555" : T.grn} strokeWidth={1} strokeDasharray="4,3" rx={2} />
                                      ))}
                                    </g>
                                  )}
                                  {/* Polygon shape highlight when no cells but freeLines exist */}
                                  {(drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-ap" || drawMode === "place-porta" || drawMode === "place-persiana") && cells.length === 0 && (() => {
                                    const lines = els.filter(e => e.type === "freeLine" || e.type === "virtualClose");
                                    if (lines.length < 2) return null;
                                    // Build point chain from connected lines (tolleranza 30px per angoli imprecisi)
                                    const pts = [];
                                    const used = new Set();
                                    const addPt = (x, y) => { const k = `${Math.round(x)},${Math.round(y)}`; if (!pts.length || k !== `${Math.round(pts[pts.length-1][0])},${Math.round(pts[pts.length-1][1])}`) pts.push([x, y]); };
                                    addPt(lines[0].x1, lines[0].y1); addPt(lines[0].x2, lines[0].y2); used.add(0);
                                    for (let iter = 0; iter < lines.length; iter++) {
                                      const last = pts[pts.length - 1];
                                      for (let li = 0; li < lines.length; li++) {
                                        if (used.has(li)) continue;
                                        const l = lines[li];
                                        if (Math.hypot(l.x1 - last[0], l.y1 - last[1]) < 30) { addPt(l.x2, l.y2); used.add(li); break; }
                                        if (Math.hypot(l.x2 - last[0], l.y2 - last[1]) < 30) { addPt(l.x1, l.y1); used.add(li); break; }
                                      }
                                    }
                                    const clr = drawMode === "place-ap" ? T.blue : T.grn;
                                    if (pts.length >= 4) {
                                      return <polygon points={pts.map(p => p.join(",")).join(" ")} fill={clr} fillOpacity={0.08} stroke={clr} strokeWidth={1.5} strokeDasharray="6,4" />;
                                    }
                                    // Fallback to bbox
                                    const allX = lines.flatMap(l => [l.x1, l.x2]), allY = lines.flatMap(l => [l.y1, l.y2]);
                                    return <rect x={Math.min(...allX)+1} y={Math.min(...allY)+1} width={Math.max(...allX)-Math.min(...allX)-2} height={Math.max(...allY)-Math.min(...allY)-2}
                                      fill={clr} fillOpacity={0.08} stroke={clr} strokeWidth={1.5} strokeDasharray="6,4" rx={2} />;
                                  })()}

                                  {/* Snap points in draw mode */}
                                  {(drawMode === "line" || drawMode === "apertura" || drawMode === "righello") && dw._pendingLine && getSnapPoints().map((p, pi) => (
                                    <circle key={`sp${pi}`} cx={p.x} cy={p.y} r={3} fill={drawMode === "apertura" ? T.blue : "#1A9E73"} fillOpacity={0.2} />
                                  ))}

                                  {/* ══ PUNTI DI RIFERIMENTO — vertici telaio visibili SEMPRE in draw mode ══ */}
                                  {drawMode && (() => {
                                    const verts = [];
                                    // Vertici freeLine (telaio + profili)
                                    els.filter(e => e.type === "freeLine").forEach(l => {
                                      verts.push({x:l.x1,y:l.y1,sub:l.subType||"telaio"});
                                      verts.push({x:l.x2,y:l.y2,sub:l.subType||"telaio"});
                                    });
                                    // Vertici frame
                                    frames.forEach(fr => {
                                      verts.push({x:fr.x,y:fr.y,sub:"frame"});
                                      verts.push({x:fr.x+fr.w,y:fr.y,sub:"frame"});
                                      verts.push({x:fr.x,y:fr.y+fr.h,sub:"frame"});
                                      verts.push({x:fr.x+fr.w,y:fr.y+fr.h,sub:"frame"});
                                    });
                                    // Montanti
                                    els.filter(e => e.type === "montante").forEach(m => {
                                      const my1 = m.y1 ?? (frame ? frame.y : fY);
                                      const my2 = m.y2 ?? (frame ? frame.y + frame.h : fY + fH);
                                      verts.push({x:m.x,y:my1,sub:"montante"});
                                      verts.push({x:m.x,y:my2,sub:"montante"});
                                    });
                                    // Traversi
                                    els.filter(e => e.type === "traverso").forEach(t => {
                                      const tx1 = t.x1 ?? (frame ? frame.x : fX);
                                      const tx2 = t.x2 ?? (frame ? frame.x + frame.w : fX + fW);
                                      verts.push({x:tx1,y:t.y,sub:"traverso"});
                                      verts.push({x:tx2,y:t.y,sub:"traverso"});
                                    });
                                    // Deduplica
                                    const seen2 = new Set();
                                    const uv = verts.filter(p => {
                                      const k = Math.round(p.x/4)+","+Math.round(p.y/4);
                                      if (seen2.has(k)) return false;
                                      seen2.add(k); return true;
                                    });
                                    const colMap = {telaio:"#1A9E73",frame:"#555",montante:"#D08008",traverso:"#D08008",soglia:"#8B5E3C",zoccolo:"#8B5E3C",fascia:"#666"};
                                    return uv.map((v,vi) => {
                                      const c = colMap[v.sub] || "#1A9E73";
                                      return <g key={`ref-${vi}`}>
                                        <line x1={v.x-6} y1={v.y} x2={v.x+6} y2={v.y} stroke={c} strokeWidth={1.5} opacity={0.7} />
                                        <line x1={v.x} y1={v.y-6} x2={v.x} y2={v.y+6} stroke={c} strokeWidth={1.5} opacity={0.7} />
                                      </g>;
                                    });
                                  })()}

                                  {/* ══ OPEN CHAIN PROFILES — catene non chiuse renderizzate come polyline ══ */}
                                  {(() => {
                                    // Trova catene di freeLine senza subType che NON fanno parte di un poly chiuso
                                    const closedFLIds = new Set();
                                    // Segna tutte le freeLine che fanno parte di un poly chiuso
                                    polys.forEach(polyPts => {
                                      els.filter(e => e.type === "freeLine" && !e.subType).forEach(fl => {
                                        const p1in = polyPts.some(p => Math.hypot(p[0]-fl.x1,p[1]-fl.y1) < 15);
                                        const p2in = polyPts.some(p => Math.hypot(p[0]-fl.x2,p[1]-fl.y2) < 15);
                                        if (p1in && p2in) closedFLIds.add(fl.id);
                                      });
                                    });
                                    // FreeLine non-chiuse senza subType
                                    const openFLs = els.filter(e => e.type === "freeLine" && !e.subType && !closedFLIds.has(e.id));
                                    if (openFLs.length < 2) return null;
                                    // Costruisci catena
                                    const CONN = 15;
                                    const used = new Set();
                                    const chains: number[][][] = [];
                                    for (let si = 0; si < openFLs.length; si++) {
                                      if (used.has(si)) continue;
                                      const pts: number[][] = [];
                                      pts.push([openFLs[si].x1, openFLs[si].y1], [openFLs[si].x2, openFLs[si].y2]);
                                      used.add(si);
                                      for (let it = 0; it < openFLs.length; it++) {
                                        const last = pts[pts.length - 1];
                                        for (let li = 0; li < openFLs.length; li++) {
                                          if (used.has(li)) continue;
                                          const l = openFLs[li];
                                          if (Math.hypot(l.x1-last[0],l.y1-last[1]) < CONN) { pts.push([l.x2,l.y2]); used.add(li); break; }
                                          if (Math.hypot(l.x2-last[0],l.y2-last[1]) < CONN) { pts.push([l.x1,l.y1]); used.add(li); break; }
                                        }
                                      }
                                      if (pts.length >= 2) chains.push(pts);
                                    }
                                    const TK = TK_FRAME * 2;
                                    return chains.map((ch, ci) => {
                                      const ptStr = ch.map(p => `${p[0]},${p[1]}`).join(" ");
                                      return <g key={`oc${ci}`}>
                                        <polyline points={ptStr} fill="none" stroke="#1A1A1C" strokeWidth={TK + 1} strokeLinejoin="miter" strokeMiterlimit={20} strokeLinecap="square" />
                                        <polyline points={ptStr} fill="none" stroke="#eceae0" strokeWidth={TK - 0.5} strokeLinejoin="miter" strokeMiterlimit={20} strokeLinecap="square" />

                                        {ch.map((p,pi) => <circle key={`occ${ci}-${pi}`} cx={p[0]} cy={p[1]} r={3} fill="#333" />)}
                                      </g>;
                                    });
                                  })()}
                                  {/* ══ CLOSED POLYGON PROFILES ══ */}
                                  {polys.map((polyPts, polyIdx) => {
                                    if (polyPts.length < 3) return null;
                                    const TK = TK_FRAME * 2; // spessore profilo
                                    const ptStr = polyPts.map(p => `${p[0]},${p[1]}`).join(" ");
                                    return (
                                      <g key={`pp${polyIdx}`}>
                                        {/* 1. Stroke spesso nero — va TK/2 dentro e TK/2 fuori */}
                                        <polygon points={ptStr} fill="none" stroke="#1A1A1C" strokeWidth={TK + 1} strokeLinejoin="miter" strokeMiterlimit="20" />
                                        {/* 2. Stroke beige più stretto — colore profilo */}
                                        <polygon points={ptStr} fill="none" stroke="#eceae0" strokeWidth={TK - 0.5} strokeLinejoin="miter" strokeMiterlimit="20" />
                                        {/* 3. Fill bianco — copre la metà interna dello stroke */}
                                        <polygon points={ptStr} fill="#fff" stroke="none" />
                                        {/* 4. Bordo interno netto */}
                                        <polygon points={ptStr} fill="none" stroke="#1A1A1C" strokeWidth={0.8} strokeLinejoin="miter" />
                                        {/* Corner dots */}
                                        {polyPts.map((p,pi)=><circle key={`pc${polyIdx}-${pi}`} cx={p[0]} cy={p[1]} r={3} fill="#333" />)}
                                      </g>
                                    );
                                  })}

                                                                    {/* ══ SOGLIA / ZOCCOLO / FASCIA / PROFCOMP ══ */}
                                  {els.filter(e => ["soglia","fascia","profcomp"].includes(e.type)).map(el => {
                                    const sel = el.id === selId;
                                    const hc = sel ? "#1A9E73" : undefined;
                                    const isSoglia = el.subType === "soglia";
                                    const isZoccolo = el.subType === "zoccolo";
                                    const isFascia = el.type === "fascia";
                                    const isProfComp = el.type === "profcomp";
                                    const tkH = isSoglia ? TK_SOGLIA*2 : isZoccolo ? TK_ZOCCOLO*2 : isFascia ? TK_FASCIA*2 : TK_PROFCOMP*2;
                                    const fillC = isSoglia ? "#e8e6de" : isZoccolo ? "#d8d6ce" : isFascia ? "#eeecea" : "#e0dedc";
                                    const refX = el.x !== undefined ? el.x : (frame ? frame.x : fX);
                                    const refW = el.w !== undefined ? el.w : (frame ? frame.w : fW);
                                    const refY = el.y !== undefined ? el.y : (frame ? frame.y + frame.h - tkH : fY);
                                    const labelTxt = el.profilo || el.subType || el.type;
                                    return (
                                      <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}
                                        {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id), onTouchStart: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "move" }}>
                                        <rect x={refX} y={refY} width={refW} height={tkH} fill={hc ? hc+"20" : fillC} stroke={hc || "#555"} strokeWidth={sel ? 1.5 : 0.8} />
                                        {/* Etichetta profilo */}
                                        <text x={refX + refW/2} y={refY + tkH/2 + 3} textAnchor="middle" fontSize={7} fontWeight={700} fill={hc || "#333"} fontFamily="monospace">{labelTxt}</text>
                                        {sel && <><circle cx={refX} cy={refY+tkH/2} r={3} fill={"#1A9E73"}/><circle cx={refX+refW} cy={refY+tkH/2} r={3} fill={"#1A9E73"}/></>}
                                      </g>
                                    );
                                  })}

                                  {/* ══ DISTINTA MATERIALI ══ */}
                                  {dw._showDistinta && (() => {
                                    const distinta = [];
                                    // Telaio
                                    if (frame) {
                                      const perim = Math.round(2*(realW+realH));
                                      distinta.push({ tipo: "Telaio", profilo: "Telaio", q: 1, lung: `${realW}×${realH}`, note: `Perimetro ${perim}mm` });
                                    }
                                    // Montanti
                                    const monts = els.filter(e => e.type === "montante");
                                    if (monts.length > 0) distinta.push({ tipo: "Montante", profilo: "Montante", q: monts.length, lung: `${Math.round(realH)}`, note: `×${monts.length} pz` });
                                    // Traversi
                                    const travs = els.filter(e => e.type === "traverso");
                                    if (travs.length > 0) distinta.push({ tipo: "Traverso", profilo: "Traverso", q: travs.length, lung: `${Math.round(realW)}`, note: `×${travs.length} pz` });
                                    // Soglie/Zoccoli/Fasce
                                    els.filter(e => ["soglia","fascia","profcomp"].includes(e.type)).forEach(el => {
                                      distinta.push({ tipo: el.profilo || el.subType, profilo: el.profilo || el.type, q: 1, lung: String(realW), note: el.subType || el.type });
                                    });
                                    // FreeLine
                                    const fls = els.filter(e => e.type === "freeLine");
                                    if (fls.length > 0) {
                                      const allFL2 = fls;
                                      const allXs2 = allFL2.flatMap(l => [l.x1,l.x2]), allYs2 = allFL2.flatMap(l => [l.y1,l.y2]);
                                      const bboxW2 = Math.max(...allXs2)-Math.min(...allXs2)||1, bboxH2 = Math.max(...allYs2)-Math.min(...allYs2)||1;
                                      const mmPerPx2 = Math.max(realW/bboxW2, realH/bboxH2);
                                      fls.forEach(fl => {
                                        const mmL = fl._mmOverride ?? Math.round(Math.hypot(fl.x2-fl.x1,fl.y2-fl.y1)*mmPerPx2);
                                        distinta.push({ tipo: "Tel.Libero", profilo: "Profilo telaio", q: 1, lung: String(mmL), note: `${mmL}mm` });
                                      });
                                    }
                                    if (distinta.length === 0) return null;
                                    const bx = canvasW - 180, by = 20;
                                    return (
                                      <g>
                                        <rect x={bx-8} y={by-8} width={188} height={distinta.length*16+32} fill="#fff" stroke="#D08008" strokeWidth={1.2} rx={6} opacity={0.97} />
                                        <text x={bx} y={by+8} fontSize={9} fontWeight={800} fill="#D08008" fontFamily="monospace">📋 DISTINTA MATERIALI</text>
                                        {distinta.map((d, i) => (
                                          <g key={i}>
                                            <text x={bx} y={by+22+i*16} fontSize={8} fontWeight={700} fill="#1A1A1C" fontFamily="monospace">{d.tipo}</text>
                                            <text x={bx+75} y={by+22+i*16} fontSize={8} fill="#555" fontFamily="monospace">{d.lung}mm</text>
                                            <text x={bx+130} y={by+22+i*16} fontSize={8} fill="#888" fontFamily="monospace">{d.note}</text>
                                          </g>
                                        ))}
                                      </g>
                                    );
                                  })()}

                                  {/* ══ ELEMENTS ══ */}
                                  {/* Render in z-order: montanti/traversi prima, freeLine orizzontali sopra */}
                                  {[
                                    ...els.filter(e => e.type === "montante" || e.type === "traverso"),
                                    ...els.filter(e => e.type !== "montante" && e.type !== "traverso"),
                                  ].map(el => {
                                    const sel = el.id === selId;
                                    const hc = sel ? "#1A9E73" : undefined;
                                    const dp = !drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id), onTouchStart: (e3) => onDrag(e3, el.id), style: { cursor: "move" } } : {};

                                    // ═══ TELAIO — doppio rettangolo con spessore ═══
                                    if (el.type === "rect") {
                                      // Nascondo il frame rect se ci sono freeLine del telaio libero
                                      const _hasFreeTel = els.some(e => e.type === "freeLine" && !e.subType);
                                      if (_hasFreeTel) return <g key={el.id} />;
                                      return (
                                        <g key={el.id} {...dp} style={drawMode ? { pointerEvents: "none" } : undefined}>
                                          <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="#f8f8f6" stroke={hc || "#1A1A1C"} strokeWidth={1.5} rx={1} />
                                          <rect x={el.x + TK_FRAME} y={el.y + TK_FRAME} width={el.w - TK_FRAME * 2} height={el.h - TK_FRAME * 2} fill="none" stroke={hc || "#1A1A1C"} strokeWidth={1} rx={0.5} />
                                          {sel && [[el.x,el.y],[el.x+el.w,el.y],[el.x,el.y+el.h],[el.x+el.w,el.y+el.h]].map(([px,py],pi) => <circle key={pi} cx={px} cy={py} r={4} fill={"#1A9E73"} />)}
                                        </g>
                                      );
                                    }

                                    // ═══ MONTANTE — render semplice, freeLine non si estende verso di lui ═══
                                    if (el.type === "montante") {
                                      const my1raw = el.y1 !== undefined ? el.y1 : (frame ? frame.y : fY);
                                      const my2raw = el.y2 !== undefined ? el.y2 : (frame ? frame.y + frame.h : fY + fH);
                                      const zoccoloEl = els.find((e: any) => e.type === "freeLine" && e.subType === "zoccolo" &&
                                        Math.max(e.x1, e.x2) >= el.x - TK_MONT && Math.min(e.x1, e.x2) <= el.x + TK_MONT);
                                      const my2 = zoccoloEl ? zoccoloEl.y1 + TK_FRAME : my2raw;
                                      const HM2 = TK_MONT / 2;
                                      const mX1 = el.x - HM2, mX2 = el.x + HM2;
                                      // Calcola tagli 45° agli angoli
                                      const mCorners = el.corners || [];
                                      // Costruisci polygon con tagli 45° dove richiesto
                                      const buildMontPoly = () => {
                                        // Angoli: TL, TR, BR, BL
                                        let pts = [[mX1,my1raw],[mX2,my1raw],[mX2,my2],[mX1,my2]];
                                        mCorners.forEach(c => {
                                          const cut = HM2; // dimensione taglio = mezza larghezza
                                          if (Math.abs(c.cy - my1raw) < 8) {
                                            // Angolo top
                                            if (Math.abs(c.cx - mX1) < 8) pts = [[mX1+cut,my1raw],[mX2,my1raw],[mX2,my2],[mX1,my2],[mX1,my1raw+cut]];
                                            else pts = [[mX1,my1raw],[mX2-cut,my1raw],[mX2,my1raw+cut],[mX2,my2],[mX1,my2]];
                                          } else if (Math.abs(c.cy - my2) < 8) {
                                            // Angolo bottom
                                            if (Math.abs(c.cx - mX1) < 8) pts = [[mX1,my1raw],[mX2,my1raw],[mX2,my2],[mX1+cut,my2],[mX1,my2-cut]];
                                            else pts = [[mX1,my1raw],[mX2,my1raw],[mX2,my2-cut],[mX2-cut,my2],[mX1,my2]];
                                          } else {
                                            // Angolo intermedio (intersezione con profilo orizzontale)
                                            const isRight = c.cx > el.x;
                                            if (isRight) {
                                              // Taglia angolo in basso-destra e alto-destra
                                              pts = pts.map(p => p);
                                            }
                                          }
                                        });
                                        return pts.map(p => p.join(",")).join(" ");
                                      };
                                      const hasCuts = mCorners.length > 0;
                                      const fillC = sel ? "#1A9E7318" : "#e8e8e4";
                                      const strokeC = sel ? "#1A9E73" : "#3A3A3C";
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "ew-resize" }}>
                                          {hasCuts
                                            ? <polygon points={buildMontPoly()} fill={fillC} stroke={strokeC} strokeWidth={sel ? 1.5 : 0.8} />
                                            : <rect x={mX1} y={my1raw} width={TK_MONT} height={my2 - my1raw} fill={fillC} stroke={strokeC} strokeWidth={sel ? 1.5 : 0.8} />
                                          }
                                          {sel && <><circle cx={el.x} cy={my1raw} r={4} fill="#1A9E73"/><circle cx={el.x} cy={my2} r={4} fill="#1A9E73"/></>}
                                          {/* Marker angoli */}
                                          {mCorners.map((c,ci) => (
                                            <circle key={ci} cx={c.cx} cy={c.cy} r={3} fill="#D08008" opacity={0.6} />
                                          ))}
                                        </g>
                                      );
                                    }

                                    // ═══ TRAVERSO — tagliato ai montanti, esteso ai profili verticali adiacenti ═══
                                    if (el.type === "traverso") {
                                      const tx1raw = el.x1 !== undefined ? el.x1 : (frame ? frame.x : fX);
                                      const tx2raw = el.x2 !== undefined ? el.x2 : (frame ? frame.x + frame.w : fX + fW);
                                      const HM2 = TK_MONT / 2;
                                      const tkMapLocal: any = { soglia: TK_SOGLIA, zoccolo: TK_ZOCCOLO, fascia: TK_FASCIA, profcomp: TK_PROFCOMP };
                                      const ETOL = 30;
                                      const vertLines = els.filter(e => e.type === "freeLine" && e.x1 !== undefined);
                                      let extL = 0, extR = 0;
                                      vertLines.forEach(l => {
                                        const lHalfT = tkMapLocal[l.subType] || TK_FRAME;
                                        const isVert = Math.abs(l.x2 - l.x1) < Math.abs(l.y2 - l.y1) + 1;
                                        if (!isVert) return;
                                        const lX = (l.x1 + l.x2) / 2;
                                        const dL = Math.abs(lX - tx1raw);
                                        if (dL < ETOL) extL = Math.max(extL, lHalfT - (tx1raw - lX));
                                        const dR = Math.abs(lX - tx2raw);
                                        if (dR < ETOL) extR = Math.max(extR, lHalfT - (lX - tx2raw));
                                      });
                                      const tx1 = tx1raw - Math.max(0, extL);
                                      const tx2 = tx2raw + Math.max(0, extR);
                                      // Taglia il traverso ai montanti che lo attraversano
                                      const intersectingMonts = allMontanti.filter(m => {
                                        const mx1 = m.x - HM2, mx2 = m.x + HM2;
                                        const mmy1 = m.y1 ?? (frame ? frame.y : fY);
                                        const mmy2 = m.y2 ?? (frame ? frame.y + frame.h : fY + fH);
                                        return mx1 > tx1 + 2 && mx2 < tx2 - 2 && mmy1 <= el.y + HM2 && mmy2 >= el.y - HM2;
                                      });
                                      const segments: {x1:number,x2:number}[] = [];
                                      let cur = tx1;
                                      const cuts = intersectingMonts.map(m => ({ x1: m.x - HM2, x2: m.x + HM2 })).sort((a,b) => a.x1 - b.x1);
                                      cuts.forEach(cut => { if (cur < cut.x1) segments.push({ x1: cur, x2: cut.x1 }); cur = cut.x2; });
                                      if (cur < tx2) segments.push({ x1: cur, x2: tx2 });
                                      if (segments.length === 0) segments.push({ x1: tx1, x2: tx2 });
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "ns-resize" }}>
                                          {segments.map((seg, si) => (
                                            <rect key={si} x={seg.x1} y={el.y - HM2} width={seg.x2 - seg.x1} height={TK_MONT} fill={sel ? "#1A9E7318" : "#e8e8e4"} stroke={sel ? "#1A9E73" : "#3A3A3C"} strokeWidth={sel ? 1.5 : 0.8} />
                                          ))}
                                          {sel && <><circle cx={tx1raw} cy={el.y} r={4} fill="#1A9E73"/><circle cx={tx2raw} cy={el.y} r={4} fill="#1A9E73"/></>}
                                        </g>
                                      );
                                    }

                                    // ═══ ANTA — doppio rettangolo, clipped to polygon ═══
                                    if (el.type === "innerRect") {
                                      const hiddenSides = el.hiddenSides || [];
                                      const clrBase = hc || "#1A1A1C";
                                      const TK = el.subType === "porta" ? TK_PORTA : TK_ANTA;
                                      // Fill interno (sfondo anta) — visibile solo se almeno un lato non è hidden
                                      const hasAnySide = ["top","bot","left","right"].some(s => !hiddenSides.includes(s));
                                      // Se un lato è hidden, estendi lo sfondo fino al bordo su quel lato (niente gap visivo)
                                      const bgTop = hiddenSides.includes("top") ? el.y : el.y + TK;
                                      const bgBot = hiddenSides.includes("bot") ? el.y + el.h : el.y + el.h - TK;
                                      const bgLeft = hiddenSides.includes("left") ? el.x : el.x + TK;
                                      const bgRight = hiddenSides.includes("right") ? el.x + el.w : el.x + el.w - TK;
                                      // 4 lati come rect separati cliccabili
                                      // I lati left/right si estendono verticalmente se top/bot sono hidden
                                      // I lati top/bot si estendono orizzontalmente se left/right sono hidden
                                      const hidTop = hiddenSides.includes("top");
                                      const hidBot = hiddenSides.includes("bot");
                                      const hidLeft = hiddenSides.includes("left");
                                      const hidRight = hiddenSides.includes("right");
                                      // Top: parte da el.x se left hidden, sennò da el.x (pezzo copre già angolo)
                                      const topX = hidLeft ? el.x : el.x;
                                      const topW = el.w - (hidLeft ? 0 : 0) - (hidRight ? 0 : 0);
                                      // Bot: idem
                                      const botX = topX;
                                      const botW = topW;
                                      // Left: parte da el.y se top hidden, altrimenti da el.y+TK; finisce a el.y+el.h se bot hidden, altrimenti el.y+el.h-TK
                                      const leftY = hidTop ? el.y : el.y + TK;
                                      const leftH = (hidBot ? el.y + el.h : el.y + el.h - TK) - leftY;
                                      // Right: idem
                                      const rightY = leftY;
                                      const rightH = leftH;
                                      const sideRect = (side, rx, ry, rw, rh) => {
                                        if (hiddenSides.includes(side)) return null;
                                        const sideId = `${el.id}:${side}`;
                                        const isSelSide = selId === sideId;
                                        const sideClr = isSelSide ? "#1A9E73" : clrBase;
                                        const sideFill = isSelSide ? "#1A9E7333" : "#e8e8e4";
                                        const sideSw = isSelSide ? 2 : 1;
                                        return (
                                          <rect key={side} x={rx} y={ry} width={Math.max(0, rw)} height={Math.max(0, rh)} fill={sideFill} stroke={sideClr} strokeWidth={sideSw}
                                            onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: sideId }); }}
                                            style={{ cursor: drawMode ? undefined : "pointer" }}
                                          />
                                        );
                                      };
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${vanoId})` : undefined}>
                                          {/* Sfondo interno (vetro area) */}
                                          {hasAnySide && <rect x={bgLeft} y={bgTop} width={Math.max(0, bgRight - bgLeft)} height={Math.max(0, bgBot - bgTop)} fill="#f8f8f6" stroke="none" pointerEvents="none" />}
                                          {/* Lato TOP (esteso orizzontalmente se left/right hidden) */}
                                          {sideRect("top", topX, el.y, topW, TK)}
                                          {/* Lato BOT */}
                                          {sideRect("bot", botX, el.y + el.h - TK, botW, TK)}
                                          {/* Lato LEFT (esteso verticalmente se top/bot hidden) */}
                                          {sideRect("left", el.x, leftY, TK, leftH)}
                                          {/* Lato RIGHT */}
                                          {sideRect("right", el.x + el.w - TK, rightY, TK, rightH)}
                                          {el.subType === "porta" && <text x={el.x + el.w / 2} y={el.y + 12} textAnchor="middle" fontSize={7} fill="#555" fontWeight={700} pointerEvents="none">PORTA</text>}
                                        </g>
                                      );
                                    }

                                    // ═══ PERSIANA — clipped to polygon ═══
                                    if (el.type === "persiana") {
                                      const slats = [];
                                      const gap = 8;
                                      const pk = 3;
                                      for (let sy = el.y + pk + gap; sy < el.y + el.h - pk; sy += gap) slats.push(sy);
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${vanoId})` : undefined} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="#f5f0e8" stroke={hc || "#8a7a60"} strokeWidth={1} />
                                          <rect x={el.x + pk} y={el.y + pk} width={el.w - pk * 2} height={el.h - pk * 2} fill="none" stroke={hc || "#8a7a60"} strokeWidth={0.5} />
                                          {slats.map((sy2, si) => <line key={si} x1={el.x + pk + 1} y1={sy2} x2={el.x + el.w - pk - 1} y2={sy2} stroke={hc || "#a09080"} strokeWidth={0.8} />)}
                                          <text x={el.x + el.w / 2} y={el.y + 10} textAnchor="middle" fontSize={6} fill="#8a7a60" fontWeight={700}>PERSIANA</text>
                                        </g>
                                      );
                                    }

                                    // ═══ VETRO — clipped to polygon ═══
                                    if (el.type === "glass") return (
                                      <g key={el.id} clipPath={poly ? `url(#polyClip-${vanoId})` : undefined} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                        <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="#d8ecf8" fillOpacity={0.25} stroke={hc || "#8bb8e8"} strokeWidth={0.5} />
                                        <line x1={el.x} y1={el.y} x2={el.x + Math.min(el.w, el.h) * 0.3} y2={el.y + Math.min(el.w, el.h) * 0.3} stroke="#b0d4f0" strokeWidth={0.5} />
                                      </g>
                                    );

                                    // ═══ POLYGON ANTA — follows actual shape ═══
                                    if (el.type === "polyAnta" && el.poly) {
                                      const pts = el.poly;
                                      const tk = el.subType === "porta" ? 4 : 3; // ridotto per anta piu grande
                                      // Outer polygon — riempie tutta la cella
                                      const outerPts = pts.map(p => p.join(",")).join(" ");
                                      // Inner polygon — inset rettangolare di tk (come il vecchio codice stabile)
                                      const apAllX = pts.map(p => p[0]);
                                      const apAllY = pts.map(p => p[1]);
                                      const apMinX = Math.min(...apAllX) + tk, apMaxX = Math.max(...apAllX) - tk;
                                      const apMinY = Math.min(...apAllY) + tk, apMaxY = Math.max(...apAllY) - tk;
                                      const innerPts = [[apMinX,apMinY],[apMaxX,apMinY],[apMaxX,apMaxY],[apMinX,apMaxY]];
                                      const cx2 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
                                      const cy2 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
                                      const innerStr = innerPts.map(p => p.join(",")).join(" ");
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <polygon points={outerPts} fill="#f8f8f6" fillOpacity={0.3} stroke={hc || "#777"} strokeWidth={1} />
                                          <polygon points={innerStr} fill="none" stroke={hc || "#777"} strokeWidth={0.6} />
                                          {/* Linee maniglia — dal punto medio del lato sinistro al centroide */}
                                          {!el.subType && (() => {
                                            // Lato sinistro: media dei punti con X minore
                                            const sortedByX = [...pts].sort((a,b) => a[0] - b[0]);
                                            const leftPts = sortedByX.slice(0, Math.ceil(pts.length/2));
                                            const handleX = leftPts.reduce((s,p) => s+p[0],0)/leftPts.length;
                                            const handleTopY = Math.min(...leftPts.map(p=>p[1]));
                                            const handleBotY = Math.max(...leftPts.map(p=>p[1]));
                                            const handleMidY = (handleTopY + handleBotY) / 2;
                                            return <>
                                              <line x1={handleX} y1={handleTopY} x2={cx2} y2={handleMidY} stroke={(hc || "#777") + "40"} strokeWidth={0.5} />
                                              <line x1={handleX} y1={handleBotY} x2={cx2} y2={handleMidY} stroke={(hc || "#777") + "40"} strokeWidth={0.5} />
                                            </>;
                                          })()}
                                          {el.subType === "porta" && <text x={cx2} y={cy2} textAnchor="middle" fontSize={8} fill="#555" fontWeight={700}>PORTA</text>}
                                        </g>
                                      );
                                    }

                                    // ═══ POLYGON VETRO — glass following shape ═══
                                    if (el.type === "polyGlass" && el.poly) {
                                      const pts = el.poly;
                                      const cx2 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
                                      const cy2 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
                                      const shrink = TK_ANTA + 2;
                                      const glassPts = pts.map(p => {
                                        const dx2 = cx2 - p[0], dy2 = cy2 - p[1];
                                        const dist = Math.hypot(dx2, dy2) || 1;
                                        return [(p[0] + dx2 / dist * shrink), (p[1] + dy2 / dist * shrink)];
                                      });
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <polygon points={glassPts.map(p => p.join(",")).join(" ")} fill="#d8ecf8" fillOpacity={0.25} stroke={hc || "#8bb8e8"} strokeWidth={0.5} />
                                          <line x1={glassPts[0][0]} y1={glassPts[0][1]} x2={cx2} y2={cy2} stroke="#b0d4f0" strokeWidth={0.4} />
                                        </g>
                                      );
                                    }

                                    // ═══ POLYGON PERSIANA — slats following shape ═══
                                    if (el.type === "polyPersiana" && el.poly) {
                                      const pts = el.poly;
                                      const outerPts = pts.map(p => p.join(",")).join(" ");
                                      const allY2 = pts.map(p => p[1]);
                                      const minY2 = Math.min(...allY2), maxY2 = Math.max(...allY2);
                                      const allX2 = pts.map(p => p[0]);
                                      const minX2 = Math.min(...allX2), maxX2 = Math.max(...allX2);
                                      const clipId = `pers-${el.id}`;
                                      const slats = [];
                                      for (let sy = minY2 + 10; sy < maxY2 - 4; sy += 8) slats.push(sy);
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <defs><clipPath id={clipId}><polygon points={outerPts} /></clipPath></defs>
                                          <polygon points={outerPts} fill="#f5f0e8" stroke={hc || "#8a7a60"} strokeWidth={1} />
                                          <g clipPath={`url(#${clipId})`}>
                                            {slats.map((sy, si) => <line key={si} x1={minX2 + 4} y1={sy} x2={maxX2 - 4} y2={sy} stroke="#a09080" strokeWidth={0.8} />)}
                                          </g>
                                        </g>
                                      );
                                    }

                                    if (el.type === "circle") return (
                                      <g key={el.id} {...dp}>
                                        <circle cx={el.cx} cy={el.cy} r={el.r} fill="#e8f4fc" fillOpacity={0.2} stroke={hc || "#4a90d9"} strokeWidth={sel ? 2.5 : 1.5} />
                                        {sel && [[el.cx,el.cy-el.r],[el.cx+el.r,el.cy],[el.cx,el.cy+el.r],[el.cx-el.r,el.cy]].map(([px,py],pi) => <circle key={pi} cx={px} cy={py} r={4} fill={"#1A9E73"} />)}
                                      </g>
                                    );

                                    // ═══ TEXT LABEL — draggable, editable on double-click ═══
                                    if (el.type === "label") return (
                                      <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}
                                        {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})}
                                        onDoubleClick={() => {
                                          const newTxt = prompt("Modifica testo:", el.text);
                                          if (newTxt !== null) setDW(els.map(x => x.id === el.id ? { ...x, text: newTxt } : x));
                                        }}
                                        style={{ cursor: drawMode ? undefined : "move" }}>
                                        {sel && <rect x={el.x - 4} y={el.y - (el.fontSize || 11) - 2} width={Math.max(40, (el.text || "").length * 6)} height={(el.fontSize || 11) + 8} fill={`${"#1A9E73"}10`} stroke={"#1A9E73"} strokeWidth={1} strokeDasharray="3,2" rx={3} />}
                                        <text x={el.x} y={el.y} fontSize={el.fontSize || 11} fontWeight={700} fill={hc || "#333"} fontFamily="Inter, sans-serif">{el.text}</text>
                                      </g>
                                    );

                                    if (el.type === "freeLine") {
                                      const dx2 = el.x2 - el.x1, dy2 = el.y2 - el.y1;
                                      const len = Math.hypot(dx2, dy2) || 1;
                                      const subType = el.subType || null;
                                      const tkMap: any = { soglia: TK_SOGLIA, zoccolo: TK_ZOCCOLO, fascia: TK_FASCIA, profcomp: TK_PROFCOMP, montante: TK_MONT, traverso: TK_MONT, soglia_rib: TK_SOGLIA };
                                      const halfT = subType ? (tkMap[subType] || TK_FRAME) : TK_FRAME;
                                      const fillMap: any = { soglia: "#d8d6d0", zoccolo: "#c8c6c0", fascia: "#e8e4dc", profcomp: "#dcdad4", montante: "#e4e2d8", traverso: "#e4e2d8", soglia_rib: "#c0beb8" };
                                      const fillC = subType ? (fillMap[subType] || "#f0efe8") : "#f0efe8";
                                      const labelMap: any = { soglia: "SOGLIA", zoccolo: "ZOCCOLO", fascia: "FASCIA", profcomp: "PROF.COMP.", montante: "MONTANTE", traverso: "TRAVERSO", soglia_rib: "SOGLIA RIB." };
                                      const labelTxt = subType ? (labelMap[subType] || subType.toUpperCase()) : null;
                                      const refLen = frame ? Math.max(frame.w, frame.h) : Math.max(fW, fH);
                                      const refReal = frame ? (frame.w >= frame.h ? realW : realH) : Math.max(realW, realH);
                                      const mmLen = el._mmOverride != null ? el._mmOverride : Math.round(len / refLen * refReal);
                                      const isPartOfPoly = poly && poly.length >= 3;
                                      // Controlla se questa freeLine fa parte di una catena aperta (≥2 segmenti connessi)
                                      const isPartOfChain = !subType && !isPartOfPoly && (() => {
                                        const others = els.filter(e => e.type === "freeLine" && !e.subType && e.id !== el.id);
                                        return others.some(o => 
                                          Math.hypot(o.x1-el.x1,o.y1-el.y1)<15 || Math.hypot(o.x2-el.x1,o.y2-el.y1)<15 ||
                                          Math.hypot(o.x1-el.x2,o.y1-el.y2)<15 || Math.hypot(o.x2-el.x2,o.y2-el.y2)<15
                                        );
                                      })();
                                      // ── Determina se la linea è orizzontale o verticale ──
                                      const isHorzLine = Math.abs(dy2) <= Math.abs(dx2) + 0.5;
                                      // ── SubType con spessore fisso: usa RECT agganciato al frame (come il telaio) ──
                                      // ── Tutte le freeLine usano logica polygon con spessore halfT ──
                                      const ux = dx2 / len, uy = dy2 / len;
                                      const nx = -uy * halfT, ny = ux * halfT;
                                      const midX = (el.x1 + el.x2) / 2, midY = (el.y1 + el.y2) / 2;
                                      const ang = Math.atan2(dy2, dx2) * 180 / Math.PI;
                                      const lx = midX + nx * 2, ly = midY + ny * 2;
                                      const lxN = midX - nx * (halfT + 8), lyN = midY - ny * (halfT + 8);
                                      const WCONN = halfT * 2 + TK_MONT;
                                      const HM_loc = TK_MONT / 2;
                                      const hasMontAt1 = els.some(m => m.type === "montante" && Math.abs(m.x - el.x1) < WCONN && ((m.y1 ?? fY) <= el.y1 + WCONN) && ((m.y2 ?? fY+fH) >= el.y1 - WCONN));
                                      const hasMontAt2 = els.some(m => m.type === "montante" && Math.abs(m.x - el.x2) < WCONN && ((m.y1 ?? fY) <= el.y2 + WCONN) && ((m.y2 ?? fY+fH) >= el.y2 - WCONN));
                                      // Per freeLine orizzontali con subType: considera anche le freeLine verticali del Tel.Lib.
                                      const isHorzEl = subType && Math.abs(dy2) <= Math.abs(dx2) + 0.5;
                                      const hasVertAt1 = isHorzEl && els.some(v => v.type === "freeLine" && !v.subType && Math.abs(v.x2-v.x1) < Math.abs(v.y2-v.y1)+1 && Math.abs((v.x1+v.x2)/2 - el.x1) < WCONN);
                                      const hasVertAt2 = isHorzEl && els.some(v => v.type === "freeLine" && !v.subType && Math.abs(v.x2-v.x1) < Math.abs(v.y2-v.y1)+1 && Math.abs((v.x1+v.x2)/2 - el.x2) < WCONN);
                                      
                                      // ext1: si estende verso montante sx (SVG) = dx utente
                                      // ext2: si ferma su el.x2, non esce
                                      const ext1 = (hasMontAt1 || hasVertAt1) ? -TK_MONT : halfT;
                                      const ext2 = (hasMontAt2 || hasVertAt2) ? -HM_loc : halfT;
                                      let ex1 = el.x1 - ux * ext1, ey1 = el.y1 - uy * ext1;
                                      let ex2 = el.x2 + ux * ext2, ey2 = el.y2 + uy * ext2;
                                      // Per orizzontali: bordo basso polygon = el.y1
                                      if (isHorzEl && !isPartOfPoly) {
                                        ey1 = el.y1 - halfT + TK_FRAME;
                                        ey2 = el.y2 - halfT + TK_FRAME;
                                      }
                                      // Taglio 45° sul profilo freeLine orizzontale
                                      const flCorners = el.corners || [];
                                      const buildFreePoly = () => {
                                        // pts4 base: TL, TR, BR, BL (top=ey+ny, bot=ey-ny)
                                        let p = [
                                          [ex1+nx, ey1+ny], [ex2+nx, ey2+ny],
                                          [ex2-nx, ey2-ny], [ex1-nx, ey1-ny]
                                        ];
                                        flCorners.forEach(c => {
                                          // Per orizzontale: cx = x del taglio, cy ~ ey
                                          // Lato sinistro = ex1, lato destro = ex2
                                          const cut = halfT; // dimensione taglio diagonale
                                          const isLeft = Math.abs(c.cx - ex1) < halfT * 3;
                                          const isRight = Math.abs(c.cx - ex2) < halfT * 3;
                                          if (isLeft) {
                                            // Taglia angolo TL e BL
                                            p = [[ex1+cut+nx, ey1+ny],[ex2+nx, ey2+ny],[ex2-nx, ey2-ny],[ex1+cut-nx, ey1-ny],[ex1-nx, ey1-ny+cut],[ex1+nx, ey1+ny-cut]];
                                          } else if (isRight) {
                                            // Taglia angolo TR e BR
                                            p = [[ex1+nx, ey1+ny],[ex2-cut+nx, ey2+ny],[ex2+nx, ey2+ny-cut],[ex2-nx, ey2-ny+cut],[ex2-cut-nx, ey2-ny],[ex1-nx, ey1-ny]];
                                          }
                                        });
                                        return p.map(pt => pt.join(",")).join(" ");
                                      };
                                      const pts4 = flCorners.length > 0 ? buildFreePoly() : `${ex1+nx},${ey1+ny} ${ex2+nx},${ey2+ny} ${ex2-nx},${ey2-ny} ${ex1-nx},${ey1-ny}`;
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id), onTouchStart: (e3) => onDrag(e3, el.id) } : {})}>
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="transparent" strokeWidth={Math.max(14, halfT * 3)} />
                                          {!isPartOfPoly && !isPartOfChain && <>
                                            <polygon points={pts4} fill={sel ? "#1A9E7318" : fillC} stroke="none" />
                                            <polygon points={pts4} fill="none" stroke={sel ? "#1A9E73" : "#3A3A3C"} strokeWidth={sel ? 1.5 : 0.7} strokeLinejoin="miter" strokeMiterlimit={20} />
                                          </>}
                                          {sel && <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#1A9E73" strokeWidth={2} opacity={0.3} />}

                                          {labelTxt && (
                                            <g transform={`rotate(${ang > 90 || ang < -90 ? ang + 180 : ang}, ${lxN}, ${lyN})`}>
                                              <rect x={lxN - labelTxt.length*3.5} y={lyN - 7} width={labelTxt.length*7+4} height={13} fill="#1A1A1C" rx={3} opacity={0.85} />
                                              <text x={lxN} y={lyN + 3} textAnchor="middle" fontSize={7} fontWeight={800} fill="#fff" fontFamily="monospace">{labelTxt}</text>
                                            </g>
                                          )}
                                          <g transform={`rotate(${ang > 90 || ang < -90 ? ang + 180 : ang}, ${lx}, ${ly})`}
                                            onClick={(e3) => { e3.stopPropagation(); if (drawMode) return; const svgEl = e3.currentTarget.closest("svg"); const r = svgEl?.getBoundingClientRect(); setDimEdit({ id: el.id, val: String(mmLen), curMM: mmLen, lenPx: len, x: r ? r.left + r.width / 2 : 200, y: r ? r.top + 80 : 80 }); }}
                                            style={{ cursor: "pointer" }}>
                                            <rect x={lx - 18} y={ly - 7} width={36} height={14} fill={dimEdit?.id === el.id ? "#1A9E73" : "#fff"} rx={3} stroke={dimEdit?.id === el.id ? "#1A9E73" : T.acc} strokeWidth={dimEdit?.id === el.id ? 1.5 : 0.6} opacity={0.9} />
                                            <text x={lx} y={ly + 4} textAnchor="middle" fontSize={8} fontWeight={700} fill={dimEdit?.id === el.id ? "#fff" : T.acc} fontFamily="monospace">{mmLen}</text>
                                          </g>
                                          {sel && <><circle cx={el.x1} cy={el.y1} r={5} fill="#1A9E73" /><circle cx={el.x2} cy={el.y2} r={5} fill="#1A9E73" /></>}
                                        </g>
                                      );
                                    }

                                    if (el.type === "apLine") return (
                                      <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                        <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={hc || T.blue} strokeWidth={sel ? 3 : 2} strokeDasharray={el.dash ? "6,4" : "none"} />
                                        <circle cx={el.x1} cy={el.y1} r={sel ? 5 : 3} fill={hc || T.blue} />
                                        <circle cx={el.x2} cy={el.y2} r={sel ? 5 : 3} fill={hc || T.blue} />
                                      </g>
                                    );

                                    if (el.type === "apLabel") {
                                      const tw = String(el.label).length * 7 + 14;
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <rect x={el.x - tw / 2} y={el.y - 8} width={tw} height={16} fill={hc || T.blue} rx={3} fillOpacity={0.85} />
                                          <text x={el.x} y={el.y + 4} textAnchor="middle" fontSize={9} fontWeight={800} fill="#fff">{el.label}</text>
                                        </g>
                                      );
                                    }

                                    if (el.type === "dim") {
                                      const isH = Math.abs(el.y1 - el.y2) < 2;
                                      const mx2 = (el.x1 + el.x2) / 2, my2 = (el.y1 + el.y2) / 2;
                                      const tw = String(el.label).length * 6.5 + 16;
                                      return (
                                        <g key={el.id} onClick={(e3) => {
                                          e3.stopPropagation();
                                          if (drawMode) return;
                                          setDimEdit({ id: el.id, val: el.label, x: 0, y: 0, isDim: true });
                                        }} style={{ cursor: "pointer" }}>
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={T.acc} strokeWidth={0.8} />
                                          {isH ? <><line x1={el.x1} y1={el.y1-5} x2={el.x1} y2={el.y1+5} stroke={T.acc} strokeWidth={0.8}/><line x1={el.x2} y1={el.y2-5} x2={el.x2} y2={el.y2+5} stroke={T.acc} strokeWidth={0.8}/></>
                                            : <><line x1={el.x1-5} y1={el.y1} x2={el.x1+5} y2={el.y1} stroke={T.acc} strokeWidth={0.8}/><line x1={el.x2-5} y1={el.y2} x2={el.x2+5} y2={el.y2} stroke={T.acc} strokeWidth={0.8}/></>}
                                          <rect x={mx2-tw/2} y={my2-9} width={tw} height={18} fill={dimEdit?.id === el.id ? "#1A9E73" : "#fff"} rx={3} stroke={T.acc} strokeWidth={0.6}/>
                                          <text x={mx2} y={my2+4} textAnchor="middle" fontSize={10} fontWeight={800} fill={dimEdit?.id === el.id ? "#fff" : T.acc} fontFamily="monospace">{el.label}</text>
                                        </g>
                                      );
                                    }
                                    if (el.type === "virtualClose") return null;
                                    if (el.type === "penPath") return (
                                      <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                        <path d={el.d} fill="none" stroke={sel ? "#1A9E73" : "#1A1A1C"} strokeWidth={sel ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
                                        {sel && <path d={el.d} fill="none" stroke={"#1A9E73"} strokeWidth={8} opacity={0.12} strokeLinecap="round" />}
                                      </g>
                                    );

                                    if (el.type === "righello") {
                                      const dx2r = el.x2 - el.x1, dy2r = el.y2 - el.y1;
                                      const lenR = Math.hypot(dx2r, dy2r) || 1;
                                      const angR = Math.atan2(dy2r, dx2r) * 180 / Math.PI;
                                      const midXR = (el.x1 + el.x2) / 2, midYR = (el.y1 + el.y2) / 2;
                                      const nxR = -dy2r / lenR * 10, nyR = dx2r / lenR * 10;
                                      const BLUE = T.blue || "#3B7FE0";
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}
                                          {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "move" }}>
                                          {/* Linea tratteggiata blu */}
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={BLUE} strokeWidth={1.2} strokeDasharray="6,3" opacity={0.7} />
                                          {/* Tacche estremità */}
                                          <line x1={el.x1-nxR*0.6} y1={el.y1-nyR*0.6} x2={el.x1+nxR*0.6} y2={el.y1+nyR*0.6} stroke={BLUE} strokeWidth={1.5} />
                                          <line x1={el.x2-nxR*0.6} y1={el.y2-nyR*0.6} x2={el.x2+nxR*0.6} y2={el.y2+nyR*0.6} stroke={BLUE} strokeWidth={1.5} />
                                          {/* Punti di ancoraggio */}
                                          <circle cx={el.x1} cy={el.y1} r={sel ? 5 : 3} fill={BLUE} opacity={0.8} />
                                          <circle cx={el.x2} cy={el.y2} r={sel ? 5 : 3} fill={BLUE} opacity={0.8} />
                                          {/* Badge misura */}
                                          <g transform={`rotate(${angR > 90 || angR < -90 ? angR + 180 : angR}, ${midXR + nxR}, ${midYR + nyR})`}>
                                            <rect x={midXR + nxR - 20} y={midYR + nyR - 8} width={40} height={16} fill={BLUE} rx={4} opacity={0.9} />
                                            <text x={midXR + nxR} y={midYR + nyR + 5} textAnchor="middle" fontSize={9} fontWeight={800} fill="#fff" fontFamily="monospace">{el.label}</text>
                                          </g>
                                        </g>
                                      );
                                    }

                                    return null;
                                  })}

                                  {/* Path live penna durante disegno */}
                                  {drawMode === "pen" && dw._penPath && dw._penPath.length > 1 && (
                                    <path d={dw._penPath.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ")} fill="none" stroke="#1A1A1C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
                                  )}
                                  {dw._pendingLine && (() => {
                                    const clr = drawMode === "apertura" ? T.blue : "#333";
                                    const p = dw._pendingLine;
                                    // Per Mont.Lib forza sempre gx=p.x1, per Trav.Lib forza gy=p.y1
                                    let gx = dw._guideX, gy = dw._guideY;
                                    const _subType = p._subType || dw._lineSubType;
                                    if (_subType === "montante" || drawMode === "place-mont-free") gx = p.x1;
                                    if (_subType === "traverso" || drawMode === "place-trav-free") gy = p.y1;
                                    document.title = `sub=${_subType} dm=${drawMode} gx=${gx} px1=${p.x1}`;
                                    // Raccoglie tutti i vertici esistenti dei freeLine
                                    const existingPts = els.filter(e => e.type === "freeLine").flatMap(l => [
                                      { x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }
                                    ]);
                                    // Deduplica (arrotonda a 5px)
                                    const seen = new Set();
                                    const uniquePts = existingPts.filter(pt => {
                                      const k = `${Math.round(pt.x/5)*5},${Math.round(pt.y/5)*5}`;
                                      if (seen.has(k)) return false;
                                      seen.add(k); return true;
                                    });
                                    return <>
                                      {/* Guide H/V dai vertici esistenti — solo visive */}
                                      {uniquePts.map((pt, i) => (
                                        <g key={`guide-${i}`} opacity={0.45}>
                                          <line x1={panX - 500} y1={pt.y} x2={panX + canvasW/zoom + 500} y2={pt.y} stroke="#1A9E73" strokeWidth={0.6} strokeDasharray="6,6" />
                                          <line x1={pt.x} y1={panY - 500} x2={pt.x} y2={panY + canvasH/zoom + 500} stroke="#1A9E73" strokeWidth={0.6} strokeDasharray="6,6" />
                                        </g>
                                      ))}
                                      {/* H/V guide lines from pending point */}
                                      <line x1={panX - 500} y1={p.y1} x2={panX + canvasW/zoom + 500} y2={p.y1} stroke="#ccc" strokeWidth={0.5} strokeDasharray="4,4" />
                                      <line x1={p.x1} y1={panY - 500} x2={p.x1} y2={panY + canvasH/zoom + 500} stroke="#ccc" strokeWidth={0.5} strokeDasharray="4,4" />
                                      {/* PASSIVE LEG ALIGNMENT CHECK — solo indicatore visivo, zero interazione */}
                                      {(() => {
                                        // Trova montanti verticali completati (freeLine con x1===x2, cioè verticali)
                                        const verticals = els.filter(e => e.type === "freeLine" && Math.abs(e.x1 - e.x2) < 3);
                                        if (verticals.length < 2) return null;
                                        // Prendi il punto più basso (max Y) di ogni montante
                                        const bottoms = verticals.map(v => ({ x: v.x1, y: Math.max(v.y1, v.y2) }));
                                        // Controlla se almeno 2 montanti hanno lo stesso Y in basso (tolleranza 8px)
                                        for (let i = 0; i < bottoms.length; i++) {
                                          for (let j = i + 1; j < bottoms.length; j++) {
                                            if (Math.abs(bottoms[i].y - bottoms[j].y) < 8) {
                                              const midX = (bottoms[i].x + bottoms[j].x) / 2;
                                              const alignY = (bottoms[i].y + bottoms[j].y) / 2;
                                              return <g pointerEvents="none" opacity={0.85}>
                                                <line x1={bottoms[i].x} y1={alignY} x2={bottoms[j].x} y2={alignY} stroke="#1A9E73" strokeWidth={1.2} strokeDasharray="8,4" />
                                                <rect x={midX - 42} y={alignY + 8} width={84} height={20} rx={4} fill="#1A9E73" />
                                                <text x={midX} y={alignY + 22} textAnchor="middle" fill="white" fontSize={11} fontWeight={600}>ALLINEATO</text>
                                              </g>;
                                            }
                                          }
                                        }
                                        return null;
                                      })()}
                                      {/* Live guide line to mouse */}
                                      {gx != null && gy != null && <>
                                        <line x1={p.x1} y1={p.y1} x2={gx} y2={gy} stroke={clr} strokeWidth={2.5} strokeDasharray="8,4" opacity={0.8} />
                                        {/* H/V snap indicator */}
                                        {gx === p.x1 && <line x1={gx} y1={0} x2={gx} y2={canvasH} stroke="#1A9E73" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.7} />}
                                        {gy === p.y1 && <line x1={0} y1={gy} x2={canvasW} y2={gy} stroke="#1A9E73" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.7} />}
                                        {/* Snap indicator sul punto target — cerchio verde se agganciato */}
                                        {(() => {
                                          const snapped = findSnap(gx, gy);
                                          if (snapped && Math.hypot(snapped.x - gx, snapped.y - gy) < 3) {
                                            return <>
                                              <circle cx={gx} cy={gy} r={10} fill="none" stroke="#1A9E73" strokeWidth={2} />
                                              <circle cx={gx} cy={gy} r={4} fill="#1A9E73" />
                                              <line x1={gx-14} y1={gy} x2={gx+14} y2={gy} stroke="#1A9E73" strokeWidth={1} opacity={0.6} />
                                              <line x1={gx} y1={gy-14} x2={gx} y2={gy+14} stroke="#1A9E73" strokeWidth={1} opacity={0.6} />
                                            </>;
                                          }
                                          if (drawMode === "place-mont-free" || drawMode === "place-trav-free") return null;
                                          return <circle cx={gx} cy={gy} r={5} fill={clr} fillOpacity={0.7} />;
                                        })()}
                                        {/* LIVE ALIGNMENT INDICATOR — mostra "=" quando il cursore è alla stessa Y di un piede esistente */}
                                        {(() => {
                                          // Cerca montanti verticali completati (freeLine senza subType, verticali)
                                          const vLegs = els.filter(e => e.type === "freeLine" && !e.subType && Math.abs(e.x1 - e.x2) < 5);
                                          if (vLegs.length === 0 || gx === null || gy === null) return null;
                                          // Cerca se gy è allineato al piede (max Y) di un altro montante
                                          for (const leg of vLegs) {
                                            const footY = Math.max(leg.y1, leg.y2);
                                            const footX = (leg.x1 + leg.x2) / 2;
                                            // Non confrontare con se stesso (stessa X = stesso montante in costruzione)
                                            if (Math.abs(footX - p.x1) < 5) continue;
                                            if (Math.abs(gy - footY) < 12) {
                                              return <g pointerEvents="none">
                                                <line x1={Math.min(footX, gx)} y1={footY} x2={Math.max(footX, gx)} y2={footY} stroke="#1A9E73" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.8} />
                                                <circle cx={footX} cy={footY} r={6} fill="none" stroke="#1A9E73" strokeWidth={2} opacity={0.8} />
                                                <rect x={(footX+gx)/2-14} y={footY-22} width={28} height={16} rx={3} fill="#1A9E73" opacity={0.9} />
                                                <text x={(footX+gx)/2} y={footY-11} textAnchor="middle" fill="white" fontSize={10} fontWeight={700}>=</text>
                                              </g>;
                                            }
                                          }
                                          return null;
                                        })()}
                                        {/* Angle + length label */}
                                        {/* Badge — si adatta per restare visibile */}
                                        {(() => {
                                          const bw = 110, bh = 66;
                                          const bx = gx + 16 + bw > canvasW ? gx - bw - 16 : gx + 16;
                                          const by = gy - bh - 8 < 0 ? gy + 8 : gy - bh - 8;
                                          const isH = gy === p.y1, isV = gx === p.x1;
                                          const line2 = isV ? "\u2195 VERT" : isH ? "\u2194 ORIZ" : dw._guideDeg != null ? `${dw._guideDeg}\u00b0` : "";
                                          return <>
                                            <rect x={bx} y={by} width={bw} height={bh} fill="#1A1A1C" rx={6} opacity={0.96}/>
                                            <text x={bx+bw/2} y={by+22} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff" fontFamily="'JetBrains Mono',monospace">
                                              {`${dw._guideLen ?? ""} mm`}
                                            </text>
                                            <text x={bx+bw/2} y={by+50} textAnchor="middle" fontSize={14} fontWeight={700} fill={isH||isV ? "#1A9E73" : "rgba(255,255,255,0.8)"} fontFamily="'JetBrains Mono',monospace">
                                              {line2}
                                            </text>
                                          </>;
                                        })()}
                                      </>}
                                      <circle cx={p.x1} cy={p.y1} r={8} fill={clr} fillOpacity={0.5} />
                                      <circle cx={p.x1} cy={p.y1} r={14} fill="none" stroke={clr} strokeWidth={2} strokeDasharray="4,2" />
                                      <circle cx={p.x1} cy={p.y1} r={3} fill={clr} />
                                    </>;
                                  })()}

                                  {/* Live drag dimension */}
                                  {dw._dragDim && (() => {
                                    const dd = dw._dragDim;
                                    const midY = (dd.y1 + dd.y2) / 2;
                                    if (dd.type === "v") {
                                      // Vertical montante — show ← left mm | right mm →
                                      return <>
                                        <rect x={dd.x - 62} y={midY - 8} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={dd.x - 34} y={midY + 4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">← {dd.leftMM}</text>
                                        <rect x={dd.x + 6} y={midY - 8} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={dd.x + 34} y={midY + 4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">{dd.rightMM} →</text>
                                      </>;
                                    }
                                    if (dd.type === "h") {
                                      const midX = (dd.x1 + dd.x2) / 2;
                                      return <>
                                        <rect x={midX - 28} y={dd.y - 22} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={midX} y={dd.y - 10} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">↑ {dd.topMM}</text>
                                        <rect x={midX - 28} y={dd.y + 6} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={midX} y={dd.y + 18} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">{dd.botMM} ↓</text>
                                      </>;
                                    }
                                    return null;
                                  })()}
                                  {/* ══ JUNCTION MARKERS ══ */}
                                  {(drawMode === "junction" || junctions.some((j:any) => dw._junctions?.find((jj:any) => jj.id === j.id))) && junctions.map((j: any) => {
                                    const saved = dw._junctions?.find((jj:any) => jj.id === j.id);
                                    const jType = saved?.type || "90";
                                    const isSelected = junctionEdit?.id === j.id;
                                    return (
                                      <g key={j.id} style={{ cursor: "pointer" }} onClick={(e3) => { e3.stopPropagation(); if (drawMode === "junction") setJunctionEdit(j); }}>
                                        <circle cx={j.ptX} cy={j.ptY} r={9} fill={jType === "45" ? "#D08008" : T.blue} fillOpacity={0.15} stroke={jType === "45" ? "#D08008" : T.blue} strokeWidth={isSelected ? 2.5 : 1.5} />
                                        <text x={j.ptX} y={j.ptY + 4} textAnchor="middle" fontSize={8} fontWeight={800} fill={jType === "45" ? "#D08008" : T.blue} fontFamily="monospace">{jType}°</text>
                                      </g>
                                    );
                                  })}
                                  {/* ══ OVERLAY GRADI sui vertici freeLine ══ */}
                                  {dw._showGradi && (() => {
                                    const fls = els.filter((e: any) => e.type === "freeLine" && !e.subType);
                                    if (fls.length < 2) return null;
                                    // Raccolgo endpoint e trovo coppie di linee che si incontrano allo stesso punto
                                    type Pt = { x: number; y: number; lines: { l: any; isStart: boolean }[] };
                                    const ptMap: Record<string, Pt> = {};
                                    const keyOf = (x: number, y: number) => Math.round(x) + "," + Math.round(y);
                                    fls.forEach(l => {
                                      const kS = keyOf(l.x1, l.y1), kE = keyOf(l.x2, l.y2);
                                      if (!ptMap[kS]) ptMap[kS] = { x: l.x1, y: l.y1, lines: [] };
                                      if (!ptMap[kE]) ptMap[kE] = { x: l.x2, y: l.y2, lines: [] };
                                      ptMap[kS].lines.push({ l, isStart: true });
                                      ptMap[kE].lines.push({ l, isStart: false });
                                    });
                                    return Object.values(ptMap).filter(p => p.lines.length >= 2).map((p, idx) => {
                                      // Calcolo i vettori uscenti dal vertice
                                      const vecs = p.lines.slice(0, 2).map(ln => {
                                        const other = ln.isStart ? { x: ln.l.x2, y: ln.l.y2 } : { x: ln.l.x1, y: ln.l.y1 };
                                        const dx = other.x - p.x, dy = other.y - p.y;
                                        const len = Math.hypot(dx, dy) || 1;
                                        return { dx: dx / len, dy: dy / len };
                                      });
                                      const dot = vecs[0].dx * vecs[1].dx + vecs[0].dy * vecs[1].dy;
                                      const angRad = Math.acos(Math.max(-1, Math.min(1, dot)));
                                      const angDeg = Math.round(angRad * 180 / Math.PI);
                                      // Posizione label: bisettrice interna
                                      const bx = (vecs[0].dx + vecs[1].dx), by = (vecs[0].dy + vecs[1].dy);
                                      const blen = Math.hypot(bx, by) || 1;
                                      const lx = p.x + (bx / blen) * 22, ly = p.y + (by / blen) * 22;
                                      const isRight = Math.abs(angDeg - 90) < 3;
                                      const clr = isRight ? "#1A9E73" : "#D08008";
                                      return (
                                        <g key={"ang" + idx} pointerEvents="none">
                                          <circle cx={p.x} cy={p.y} r={4} fill={clr} stroke="#fff" strokeWidth={1} />
                                          <rect x={lx - 14} y={ly - 7} width={28} height={14} rx={3} fill={clr} opacity={0.92} />
                                          <text x={lx} y={ly + 4} textAnchor="middle" fontSize={9} fontWeight={900} fill="#fff" fontFamily="monospace">{angDeg}°</text>
                                        </g>
                                      );
                                    });
                                  })()}

                                </svg>
                                </div>

                                {/* ══ PANNELLO GIUNZIONE ══ */}
                                {junctionEdit && (
                                  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)" }}
                                    onClick={() => setJunctionEdit(null)}>
                                    <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 260, display: "flex", flexDirection: "column", gap: 12 }}
                                      onClick={e => e.stopPropagation()}>
                                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1A1C" }}>⌐ Modifica Giunzione</div>
                                      <div style={{ fontSize: 11, color: "#888" }}>Scegli il tipo di taglio angolare</div>
                                      {/* Tipo giunzione */}
                                      <div style={{ display: "flex", gap: 8 }}>
                                        {[{id:"90",label:"90°",desc:"Un profilo passa"},{id:"45",label:"45°",desc:"Taglio a 45°"}].map(opt => {
                                          const saved = dw._junctions?.find((jj:any) => jj.id === junctionEdit.id);
                                          const curType = saved?.type || "90";
                                          const isSel = curType === opt.id;
                                          return (
                                            <div key={opt.id} onClick={() => {
                                              const newJ = { ...junctionEdit, type: opt.id, winner: saved?.winner || "A" };
                                              const existing = dw._junctions || [];
                                              const updated = existing.filter((jj:any) => jj.id !== junctionEdit.id);
                                              setMode({ _junctions: [...updated, newJ] });
                                              setJunctionEdit(newJ);
                                            }} style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: `2px solid ${isSel ? T.blue : "#ddd"}`, background: isSel ? `${T.blue}12` : "#fff", cursor: "pointer", textAlign: "center" }}>
                                              <div style={{ fontSize: 18, fontWeight: 800, color: isSel ? T.blue : "#555" }}>{opt.label}</div>
                                              <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{opt.desc}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      {/* Chi vince */}
                                      {(() => {
                                        const saved = dw._junctions?.find((jj:any) => jj.id === junctionEdit.id);
                                        const curType = saved?.type || "90";
                                        if (curType !== "90") return null;
                                        const elA = els.find((e:any) => e.id === junctionEdit.elA);
                                        const elB = els.find((e:any) => e.id === junctionEdit.elB);
                                        const nameA = elA?.subType || elA?.type || "A";
                                        const nameB = elB?.subType || elB?.type || "B";
                                        const curWinner = saved?.winner || "A";
                                        return (
                                          <div>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", marginBottom: 6 }}>Chi vince (passa sopra)</div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                              {[{id:"A",label:nameA.toUpperCase()},{id:"B",label:nameB.toUpperCase()}].map(opt => {
                                                const isSel = curWinner === opt.id;
                                                return (
                                                  <div key={opt.id} onClick={() => {
                                                    const newJ = { ...(saved || junctionEdit), winner: opt.id };
                                                    const existing = dw._junctions || [];
                                                    const updated = existing.filter((jj:any) => jj.id !== junctionEdit.id);
                                                    setMode({ _junctions: [...updated, newJ] });
                                                    setJunctionEdit(newJ);
                                                  }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `2px solid ${isSel ? "#1A9E73" : "#ddd"}`, background: isSel ? "#1A9E7312" : "#fff", cursor: "pointer", textAlign: "center", fontSize: 11, fontWeight: 800, color: isSel ? "#1A9E73" : "#555" }}>
                                                    {opt.label}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                        <div onClick={() => setJunctionEdit(null)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#888" }}>Chiudi</div>
                                        <div onClick={() => {
                                          const existing = dw._junctions || [];
                                          setMode({ _junctions: existing.filter((jj:any) => jj.id !== junctionEdit.id) });
                                          setJunctionEdit(null);
                                        }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #DC4444", background: "#DC444408", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#DC4444" }}>Reset</div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Footer */}
                                <div style={{ padding: "4px 10px 5px", fontSize: 9, textAlign: "center", color: (drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") ? T.grn : (drawMode === "apertura" || drawMode === "place-ap") ? T.blue : (drawMode === "line" || drawMode === "place-mont" || drawMode === "place-trav") ? "#555" : T.sub, fontWeight: drawMode ? 700 : 400 }}>
                                  {drawMode === "line" ? "⚫ Click per tracciare struttura · Le linee si concatenano"
                                    : drawMode === "apertura" ? "🔵 Click libero per disegnare apertura in blu"
                                    : drawMode === "place-mont" ? "⬛ Click su una CELLA per aggiungere il montante verticale"
                                    : drawMode === "place-trav" ? "⬛ Click su una CELLA per aggiungere il traverso orizzontale"
                                    : drawMode === "place-anta" ? "🟢 Click sulla CELLA per inserire l'anta"
                                    : drawMode === "place-porta" ? "🟢 Click sulla CELLA per inserire anta porta (profilo spesso)"
                                    : drawMode === "place-persiana" ? "🟢 Click sulla CELLA per inserire persiana con stecche"
                                    : drawMode === "place-vetro" ? "🟢 Click sulla CELLA per inserire il vetro (dentro l'anta)"
                                    : drawMode === "place-ap" ? `🔵 Click sulla CELLA per apertura ${placeApType}`
                                    : `${els.length} el. · ${cells.length} celle · Click per selezionare`}
                                </div>
                                </>}
                              </div>

                              {/* ══ OVERLAY MODIFICA MISURA ══ */}
                              {dimEdit && (
                                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)" }}
                                  onClick={() => setDimEdit(null)}>
                                  <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 240, display: "flex", flexDirection: "column", gap: 12 }}
                                    onClick={e => e.stopPropagation()}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1A1C" }}>✏️ Modifica misura lato</div>
                                    <div style={{ fontSize: 11, color: "#888" }}>Inserisci la misura reale in mm</div>
                                    <input
                                      autoFocus
                                      type="number"
                                      value={dimEdit.val}
                                      onChange={e => setDimEdit({ ...dimEdit, val: e.target.value })}
                                      onKeyDown={e => {
                                        if (e.key === "Enter") {
                                          applyDimChange(dimEdit.id, dimEdit.val, (dimEdit as any).isDim);
                                          setDimEdit(null);
                                        }
                                        if (e.key === "Escape") setDimEdit(null);
                                      }}
                                      style={{ padding: "10px 14px", border: `2px solid ${"#1A9E73"}`, borderRadius: 8, fontSize: 22, fontWeight: 800, fontFamily: "monospace", textAlign: "center", outline: "none", color: "#1A1A1C", width: "100%", display: "block", boxSizing: "border-box" as any }}
                                    />
                                    {/* Bottoni inclinazione — solo per freeLine */}
                                    {!(dimEdit as any).isDim && (
                                      <div style={{ display: "flex", gap: 6 }}>
                                        <div onClick={() => { applyDimChange(dimEdit.id, dimEdit.val, false, 'right'); setDimEdit(null); }}
                                          style={{ flex: 1, padding: "8px 4px", borderRadius: 8, background: "#F2F1EC", border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#1A1A1C" }}>← SX</div>
                                        <div onClick={() => { applyDimChange(dimEdit.id, dimEdit.val, false, 'both'); setDimEdit(null); }}
                                          style={{ flex: 1, padding: "8px 4px", borderRadius: 8, background: "#F2F1EC", border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#1A1A1C" }}>↔ Entrambi</div>
                                        <div onClick={() => { applyDimChange(dimEdit.id, dimEdit.val, false, 'left'); setDimEdit(null); }}
                                          style={{ flex: 1, padding: "8px 4px", borderRadius: 8, background: "#F2F1EC", border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#1A1A1C" }}>DX →</div>
                                      </div>
                                    )}
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <div onClick={() => setDimEdit(null)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#888" }}>Chiudi</div>
                                      <div onClick={() => { undo(); setDimEdit(null); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #DC4444", background: "#DC444408", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#DC4444" }}>↩ Ripristina</div>
                                      {(dimEdit as any).isDim && <div onClick={() => {
                                        applyDimChange(dimEdit.id, dimEdit.val, true);
                                        setDimEdit(null);
                                      }} style={{ flex: 1, padding: "9px", borderRadius: 8, background: "#1A9E73", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#fff" }}>✓ Conferma</div>}
                                    </div>
                                  </div>
                                </div>
                              )}
                              </>
                            );
}


