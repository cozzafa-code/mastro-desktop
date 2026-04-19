"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════
// MASTRO — BoxEditor
// CAD universale: pianta → 3D isometrico → sezioni → PDF
// Cassonetti, box doccia, copricaldaia, armadi, ecc.
// ═══════════════════════════════════════════════════════
import React, { useState, useRef } from "react";

// ── MATERIALI ────────────────────────────────────────────
const MAT_LIST = [
  { id:"pvc",      label:"PVC",         color:"#93C5FD", border:"#3B7FE0", sp:4   },
  { id:"alluminio",label:"Alluminio",   color:"#CBD5E1", border:"#475569", sp:2   },
  { id:"eps",      label:"Coib. EPS",   color:"#FDE68A", border:"#D08008", sp:30  },
  { id:"legno",    label:"Legno",       color:"#D6B896", border:"#92400E", sp:18  },
  { id:"acciaio",  label:"Acciaio",     color:"#9CA3AF", border:"#374151", sp:2   },
  { id:"vetro",    label:"Vetro",       color:"#BAE6FD", border:"#0EA5E9", sp:6   },
  { id:"cartongesso",label:"Cart.",     color:"#F1F5F9", border:"#94A3B8", sp:12  },
  { id:"poliur",   label:"Poliur.",     color:"#A7F3D0", border:"#059669", sp:20  },
];

const TABS = ["Pianta","3D","Sezione H","Sezione V"];

// ── ISO HELPERS ───────────────────────────────────────────
// Proiezione isometrica: (x,y,z) → (sx,sy) in SVG
const ISO_ANG = 30 * Math.PI / 180;
const isoX = (x,y,z) => (x - y) * Math.cos(ISO_ANG);
const isoY = (x,y,z) => (x + y) * Math.sin(ISO_ANG) - z;

// ── QUOTE SVG HELPER ─────────────────────────────────────
function Quote({ x1,y1,x2,y2,label,offset=14,color="#1A2B4A" }) {
  const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy);
  if(len<1) return null;
  const nx=-dy/len, ny=dx/len;
  const mx=(x1+x2)/2+nx*offset, my=(y1+y2)/2+ny*offset;
  const ang = Math.atan2(dy,dx)*180/Math.PI;
  const fixAng = ang>90||ang<-90 ? ang+180 : ang;
  return (
    <g>
      <line x1={x1+nx*offset} y1={y1+ny*offset} x2={x2+nx*offset} y2={y2+ny*offset}
        stroke={color} strokeWidth="1" markerStart="url(#arr)" markerEnd="url(#arr)"/>
      <line x1={x1} y1={y1} x2={x1+nx*(offset+3)} y2={y1+ny*(offset+3)} stroke={color} strokeWidth="0.6" strokeDasharray="3,2"/>
      <line x1={x2} y1={y2} x2={x2+nx*(offset+3)} y2={y2+ny*(offset+3)} stroke={color} strokeWidth="0.6" strokeDasharray="3,2"/>
      <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fill={color} fontWeight="700"
        transform={`rotate(${fixAng},${mx},${my})`}
        style={{paintOrder:"stroke",stroke:"#F0F8FF",strokeWidth:2}}>
        {label}
      </text>
    </g>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function BoxEditor({ onClose }) {
  // Dimensioni struttura in mm
  const [W, setW] = useState(1200); // larghezza
  const [H, setH] = useState(280);  // altezza
  const [D, setD] = useState(250);  // profondità

  // Materiali per ogni lato: front, back, left, right, top, bottom
  const [mats, setMats]   = useState([...MAT_LIST]);
  const [sides, setSides] = useState({
    front:"pvc", back:"pvc", left:"alluminio",
    right:"alluminio", top:"pvc", bottom:"pvc"
  });
  const [selSide, setSelSide] = useState(null);
  const [tab, setTab]     = useState(0);
  const [elements, setEl] = useState([]); // elementi aggiuntivi
  const [addMenu, setAddMenu] = useState(false);
  const [nome, setNome]   = useState("Struttura");

  const getMat = id => mats.find(m=>m.id===id)||mats[0];
  const sp = side => Math.max(getMat(sides[side]).sp, 1);

  // ── EXPORT ────────────────────────────────────────────
  const exportText = () => {
    const lines = [
      `=== ${nome.toUpperCase()} ===`,
      `Dimensioni esterne: L${W} × H${H} × P${D} mm`,
      ``,`MATERIALI:`,
      `  Fronte:    ${getMat(sides.front).label} ${sp("front")}mm`,
      `  Retro:     ${getMat(sides.back).label}  ${sp("back")}mm`,
      `  Sx:        ${getMat(sides.left).label}  ${sp("left")}mm`,
      `  Dx:        ${getMat(sides.right).label} ${sp("right")}mm`,
      `  Coperchio: ${getMat(sides.top).label}   ${sp("top")}mm`,
      `  Fondo:     ${getMat(sides.bottom).label}${sp("bottom")}mm`,
      ``,`DIMENSIONI INTERNE:`,
      `  L int: ${W - sp("left") - sp("right")}mm`,
      `  H int: ${H - sp("top") - sp("bottom")}mm`,
      `  P int: ${D - sp("front") - sp("back")}mm`,
      ``,`ELEMENTI:`,
      ...elements.map(el=>`  ${el.label}: ${el.w}×${el.h}mm pos X${el.x} Y${el.y}`),
    ];
    const txt = lines.join('\n');
    navigator.clipboard?.writeText(txt).catch(()=>{});
    alert(txt);
  };

  // ── PIANTA (top view) ─────────────────────────────────
  const PV = 320, PH = 220, PPAD = 40;
  const psc = Math.min((PV-PPAD*2)/Math.max(W,50), (PH-PPAD*2)/Math.max(D,50), 0.4);
  const pw = W*psc, pd = D*psc;
  const px0 = (PV-pw)/2, py0 = (PH-pd)/2;
  const spF=sp("front")*psc, spB=sp("back")*psc;
  const spL=sp("left")*psc,  spR=sp("right")*psc;

  // ── 3D ISOMETRICO ─────────────────────────────────────
  const IV=360, IH=300, IPAD=20;
  // Scala per far stare tutto
  const sc3 = Math.min(120/Math.max(W,1), 80/Math.max(H,1), 100/Math.max(D,1), 0.25);
  const w3=W*sc3, h3=H*sc3, d3=D*sc3;
  // Origine centro-basso del SVG
  const ox=IV/2, oy=IH*0.72;

  const iso = (x,y,z) => ({
    x: ox + isoX(x,y,z)*sc3*60,
    y: oy + isoY(x,y,z)*sc3*60
  });

  // 8 vertici del box
  const v = [
    iso(0,0,0), iso(W,0,0), iso(W,D,0), iso(0,D,0), // basso
    iso(0,0,H), iso(W,0,H), iso(W,D,H), iso(0,D,H), // alto
  ];
  const pt = v => `${v.x},${v.y}`;

  // Facce visibili in isometria (fronte=0,D | dx=W | top)
  const faceColor = side => getMat(sides[side]).color;
  const faceBorder = side => getMat(sides[side]).border;

  // ── SEZIONE ORIZZONTALE (H) — pianta con spessori ────
  // ── SEZIONE VERTICALE (V) — alzato con spessori ──────

  // SVG sezione
  const SV=320, SH_sz=200, SPAD=36;
  const renderSez = (isH) => {
    const axW = isH ? W : D;
    const axH = isH ? D : H;
    const sc2 = Math.min((SV-SPAD*2)/Math.max(axW,50), (SH_sz-SPAD*2)/Math.max(axH,50), 0.5);
    const sw=axW*sc2, sh=axH*sc2;
    const sx0=(SV-sw)/2, sy0=(SH_sz-sh)/2;
    const spA = isH ? sp("left")*sc2  : sp("top")*sc2;
    const spB2= isH ? sp("right")*sc2 : sp("bottom")*sc2;
    const spC = isH ? sp("front")*sc2 : sp("front")*sc2;
    const spD2= isH ? sp("back")*sc2  : sp("back")*sc2;
    const mA = isH ? sides.left   : sides.top;
    const mB = isH ? sides.right  : sides.bottom;
    const mC = isH ? sides.front  : sides.front;
    const mD = isH ? sides.back   : sides.back;
    return (
      <g>
        {/* Pareti */}
        <rect x={sx0} y={sy0} width={spA} height={sh} fill={faceColor(mA)} stroke={faceBorder(mA)} strokeWidth="1.5"/>
        <rect x={sx0+sw-spB2} y={sy0} width={spB2} height={sh} fill={faceColor(mB)} stroke={faceBorder(mB)} strokeWidth="1.5"/>
        <rect x={sx0} y={sy0} width={sw} height={spC} fill={faceColor(mC)} stroke={faceBorder(mC)} strokeWidth="1.5"/>
        <rect x={sx0} y={sy0+sh-spD2} width={sw} height={spD2} fill={faceColor(mD)} stroke={faceBorder(mD)} strokeWidth="1.5"/>
        {/* Interno */}
        <rect x={sx0+spA} y={sy0+spC} width={sw-spA-spB2} height={sh-spC-spD2}
          fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="0.5"/>
        {/* Tratteggio diagonale interno */}
        {Array.from({length:8}).map((_,i)=>(
          <line key={i}
            x1={sx0+spA+i*(sw-spA-spB2)/8} y1={sy0+spC}
            x2={sx0+spA} y2={sy0+spC+i*(sh-spC-spD2)/8}
            stroke="#E0F0FF" strokeWidth="0.5"/>
        ))}
        {/* Label spessori */}
        <text x={sx0+spA/2} y={sy0+sh/2} textAnchor="middle" fontSize="8"
          fill={faceBorder(mA)} fontWeight="700"
          transform={`rotate(-90,${sx0+spA/2},${sy0+sh/2})`}>
          {getMat(sides[mA]).label} {sp(mA)}
        </text>
        {/* Quote esterne */}
        <Quote x1={sx0} y1={sy0+sh} x2={sx0+sw} y2={sy0+sh}
          label={`${axW}mm`} offset={14} color="#1A2B4A"/>
        <Quote x1={sx0+sw} y1={sy0} x2={sx0+sw} y2={sy0+sh}
          label={`${axH}mm`} offset={14} color="#1A2B4A"/>
        <Quote x1={sx0+spA} y1={sy0+sh} x2={sx0+sw-spB2} y2={sy0+sh}
          label={`${axW-sp(mA)-sp(mB)} int`} offset={26} color="#0EA5E9"/>
        {/* Titolo */}
        <text x={SV/2} y={12} textAnchor="middle" fontSize="9" fill="#64748B" fontWeight="600">
          {isH?"Sezione orizzontale (pianta)":"Sezione verticale (alzato)"}
        </text>
        {/* Scala */}
        <g transform={`translate(${SPAD},${SH_sz-10})`}>
          <line x1={0} y1={0} x2={100*sc2} y2={0} stroke="#1A2B4A" strokeWidth="1.5"/>
          <line x1={0} y1={-3} x2={0} y2={3} stroke="#1A2B4A" strokeWidth="1.5"/>
          <line x1={100*sc2} y1={-3} x2={100*sc2} y2={3} stroke="#1A2B4A" strokeWidth="1.5"/>
          <text x={50*sc2} y={-5} textAnchor="middle" fontSize="8" fill="#1A2B4A" fontWeight="700">100mm</text>
        </g>
      </g>
    );
  };

  const sideNames = {
    front:"Fronte", back:"Retro", left:"Sx", right:"Dx", top:"Coperchio", bottom:"Fondo"
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:5000,background:"#fff",
      display:"flex",flexDirection:"column",fontFamily:"'Inter',sans-serif"}}>

      {/* ── HEADER ── */}
      <div style={{background:"#1A2B4A",padding:"8px 12px",
        display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <input value={nome} onChange={e=>setNome(e.target.value)}
          style={{flex:1,background:"transparent",border:"none",outline:"none",
            color:"#fff",fontSize:14,fontWeight:800,fontFamily:"'Inter',sans-serif"}}/>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>
          {W}×{H}×{D}mm
        </div>
        <div onClick={exportText}
          style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,
            fontWeight:700,background:"rgba(255,255,255,0.12)",color:"#fff",
            border:"1px solid rgba(255,255,255,0.2)"}}>📋 Export</div>
        {onClose && <div onClick={onClose}
          style={{color:"rgba(255,255,255,0.5)",fontSize:22,cursor:"pointer"}}>×</div>}
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",borderBottom:"1px solid #E2E8F0",
        flexShrink:0,background:"#F8FAFC"}}>
        {TABS.map((t,i)=>(
          <div key={i} onClick={()=>setTab(i)}
            style={{flex:1,padding:"8px 4px",textAlign:"center",cursor:"pointer",
              fontSize:11,fontWeight:700,
              color:tab===i?"#1A2B4A":"#94A3B8",
              borderBottom:tab===i?"2.5px solid #1A2B4A":"2.5px solid transparent",
              background:tab===i?"#fff":"transparent"}}>{t}</div>
        ))}
      </div>

      {/* ── SVG AREA ── */}
      <div style={{flex:1,background:"#F0F8FF",overflow:"hidden",
        display:"flex",flexDirection:"column",minHeight:0}}>
        <svg width="100%" height="100%"
          viewBox={`0 0 ${tab<=1?IV:SV} ${tab<=1?IH:SH_sz}`}
          preserveAspectRatio="xMidYMid meet"
          style={{display:"block"}}>
          <defs>
            <marker id="arr" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4 Z" fill="#1A2B4A"/>
            </marker>
          </defs>

          {/* Griglia */}
          {Array.from({length:9}).map((_,i)=>(
            <line key={"gx"+i} x1={i*50} y1={0} x2={i*50} y2={400} stroke="#E0EFFE" strokeWidth="0.4"/>
          ))}
          {Array.from({length:7}).map((_,i)=>(
            <line key={"gy"+i} x1={0} y1={i*50} x2={400} y2={i*50} stroke="#E0EFFE" strokeWidth="0.4"/>
          ))}

          {/* ── PIANTA ── */}
          {tab===0 && <g>
            <text x={PV/2} y={12} textAnchor="middle" fontSize="9" fill="#64748B" fontWeight="600">
              Pianta (vista dall'alto) — tap lato per materiale
            </text>
            {/* Lato fronte */}
            <rect x={px0} y={py0+pd-spF} width={pw} height={spF}
              fill={faceColor("front")} stroke={selSide==="front"?"#F59E0B":faceBorder("front")}
              strokeWidth={selSide==="front"?2.5:1.5} style={{cursor:"pointer"}}
              onClick={()=>setSelSide("front")}/>
            <text x={px0+pw/2} y={py0+pd-spF/2+3} textAnchor="middle"
              fontSize="8" fill={faceBorder("front")} fontWeight="700" style={{pointerEvents:"none"}}>
              fronte · {getMat(sides.front).label} {sp("front")}mm
            </text>
            {/* Lato retro */}
            <rect x={px0} y={py0} width={pw} height={spB}
              fill={faceColor("back")} stroke={selSide==="back"?"#F59E0B":faceBorder("back")}
              strokeWidth={selSide==="back"?2.5:1.5} style={{cursor:"pointer"}}
              onClick={()=>setSelSide("back")}/>
            {/* Lato sx */}
            <rect x={px0} y={py0+spB} width={spL} height={pd-spF-spB}
              fill={faceColor("left")} stroke={selSide==="left"?"#F59E0B":faceBorder("left")}
              strokeWidth={selSide==="left"?2.5:1.5} style={{cursor:"pointer"}}
              onClick={()=>setSelSide("left")}/>
            {/* Lato dx */}
            <rect x={px0+pw-spR} y={py0+spB} width={spR} height={pd-spF-spB}
              fill={faceColor("right")} stroke={selSide==="right"?"#F59E0B":faceBorder("right")}
              strokeWidth={selSide==="right"?2.5:1.5} style={{cursor:"pointer"}}
              onClick={()=>setSelSide("right")}/>
            {/* Interno */}
            <rect x={px0+spL} y={py0+spB} width={pw-spL-spR} height={pd-spF-spB}
              fill="#fff" stroke="#BAE6FD" strokeWidth="0.5"/>
            {/* Tratteggio */}
            <line x1={px0+spL} y1={py0+spB} x2={px0+pw-spR} y2={py0+pd-spF}
              stroke="#E0F0FF" strokeWidth="0.5"/>
            <line x1={px0+spL} y1={py0+pd-spF} x2={px0+pw-spR} y2={py0+spB}
              stroke="#E0F0FF" strokeWidth="0.5"/>
            {/* Quote */}
            <Quote x1={px0} y1={py0+pd} x2={px0+pw} y2={py0+pd}
              label={`L ${W}mm`} offset={14} color="#1A2B4A"/>
            <Quote x1={px0+pw} y1={py0} x2={px0+pw} y2={py0+pd}
              label={`P ${D}mm`} offset={14} color="#1A2B4A"/>
            {/* Scala */}
            <g transform={`translate(${PPAD-10},${PH-10})`}>
              <line x1={0} y1={0} x2={100*psc} y2={0} stroke="#1A2B4A" strokeWidth="1.5"/>
              <line x1={0} y1={-3} x2={0} y2={3} stroke="#1A2B4A" strokeWidth="1.5"/>
              <line x1={100*psc} y1={-3} x2={100*psc} y2={3} stroke="#1A2B4A" strokeWidth="1.5"/>
              <text x={50*psc} y={-5} textAnchor="middle" fontSize="8" fill="#1A2B4A" fontWeight="700">100mm</text>
            </g>
          </g>}

          {/* ── 3D ISOMETRICO ── */}
          {tab===1 && <g>
            <text x={IV/2} y={12} textAnchor="middle" fontSize="9" fill="#64748B" fontWeight="600">
              Vista 3D isometrica
            </text>
            {/* Faccia basso */}
            <polygon points={[v[0],v[1],v[2],v[3]].map(pt).join(' ')}
              fill={faceColor("bottom")} stroke={faceBorder("bottom")} strokeWidth="1" opacity="0.7"/>
            {/* Faccia sx */}
            <polygon points={[v[0],v[3],v[7],v[4]].map(pt).join(' ')}
              fill={faceColor("left")} stroke={faceBorder("left")} strokeWidth="1.5"
              style={{cursor:"pointer"}} onClick={()=>setSelSide("left")}/>
            {/* Faccia fronte */}
            <polygon points={[v[0],v[1],v[5],v[4]].map(pt).join(' ')}
              fill={faceColor("front")} stroke={faceBorder("front")} strokeWidth="1.5"
              style={{cursor:"pointer"}} onClick={()=>setSelSide("front")}/>
            {/* Faccia dx */}
            <polygon points={[v[1],v[2],v[6],v[5]].map(pt).join(' ')}
              fill={faceColor("right")} stroke={faceBorder("right")} strokeWidth="1.5"
              style={{cursor:"pointer"}} onClick={()=>setSelSide("right")}/>
            {/* Faccia retro */}
            <polygon points={[v[2],v[3],v[7],v[6]].map(pt).join(' ')}
              fill={faceColor("back")} stroke={faceBorder("back")} strokeWidth="1.5"
              style={{cursor:"pointer"}} onClick={()=>setSelSide("back")} opacity="0.6"/>
            {/* Faccia top */}
            <polygon points={[v[4],v[5],v[6],v[7]].map(pt).join(' ')}
              fill={faceColor("top")} stroke={faceBorder("top")} strokeWidth="1.5"
              style={{cursor:"pointer"}} onClick={()=>setSelSide("top")} opacity="0.9"/>
            {/* Label facce */}
            {[
              {face:"front", vx:[v[0],v[1],v[5],v[4]]},
              {face:"left",  vx:[v[0],v[3],v[7],v[4]]},
              {face:"top",   vx:[v[4],v[5],v[6],v[7]]},
            ].map(({face,vx})=>{
              const cx=vx.reduce((s,p)=>s+p.x,0)/4;
              const cy=vx.reduce((s,p)=>s+p.y,0)/4;
              return (
                <g key={face}>
                  <text x={cx} y={cy} textAnchor="middle" fontSize="9"
                    fill={faceBorder(face)} fontWeight="800" style={{pointerEvents:"none"}}>
                    {getMat(sides[face]).label}
                  </text>
                  <text x={cx} y={cy+11} textAnchor="middle" fontSize="8"
                    fill={faceBorder(face)} style={{pointerEvents:"none"}}>
                    {sp(face)}mm
                  </text>
                </g>
              );
            })}
            {/* Quote 3D */}
            <line x1={v[0].x} y1={v[0].y} x2={v[1].x} y2={v[1].y}
              stroke="#1A2B4A" strokeWidth="0.8" strokeDasharray="4,2"/>
            <text x={(v[0].x+v[1].x)/2} y={(v[0].y+v[1].y)/2-6}
              textAnchor="middle" fontSize="9" fill="#1A2B4A" fontWeight="700">L {W}mm</text>
            <line x1={v[1].x} y1={v[1].y} x2={v[2].x} y2={v[2].y}
              stroke="#1A2B4A" strokeWidth="0.8" strokeDasharray="4,2"/>
            <text x={(v[1].x+v[2].x)/2+14} y={(v[1].y+v[2].y)/2}
              textAnchor="start" fontSize="9" fill="#1A2B4A" fontWeight="700">P {D}mm</text>
            <line x1={v[1].x} y1={v[1].y} x2={v[5].x} y2={v[5].y}
              stroke="#1A2B4A" strokeWidth="0.8" strokeDasharray="4,2"/>
            <text x={v[5].x+6} y={(v[1].y+v[5].y)/2}
              textAnchor="start" fontSize="9" fill="#1A2B4A" fontWeight="700">H {H}mm</text>
          </g>}

          {/* ── SEZIONE H ── */}
          {tab===2 && renderSez(true)}
          {/* ── SEZIONE V ── */}
          {tab===3 && renderSez(false)}
        </svg>
      </div>

      {/* ── DIMENSIONI ── */}
      <div style={{background:"#fff",borderTop:"1px solid #E2E8F0",
        padding:"8px 10px",flexShrink:0}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:5}}>
          {[
            {l:"Larghezza",v:W,set:setW},
            {l:"Altezza",  v:H,set:setH},
            {l:"Profondità",v:D,set:setD},
          ].map(({l,v,set})=>(
            <div key={l}>
              <div style={{fontSize:9,color:"#64748B",fontWeight:700,marginBottom:2}}>{l}</div>
              <input type="number" inputMode="numeric" value={v}
                onChange={e=>set(parseInt(e.target.value)||1)}
                style={{width:"100%",padding:"5px 3px",borderRadius:6,
                  border:"1px solid #E2E8F0",fontSize:13,fontWeight:800,
                  fontFamily:"'JetBrains Mono',monospace",textAlign:"center",
                  background:"#F8FAFC",color:"#1A2B4A",boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>
        {/* Riepilogo interno */}
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {[
            {l:"Int. L",v:W-sp("left")-sp("right")},
            {l:"Int. H",v:H-sp("top")-sp("bottom")},
            {l:"Int. P",v:D-sp("front")-sp("back")},
          ].map(({l,v})=>(
            <div key={l} style={{flex:1,background:"#EFF8FF",borderRadius:6,
              padding:"4px 6px",textAlign:"center"}}>
              <div style={{fontSize:8,color:"#3B7FE0",fontWeight:700}}>{l}</div>
              <div style={{fontSize:12,fontWeight:800,color:"#1A2B4A",fontFamily:"'JetBrains Mono',monospace"}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SELEZIONE MATERIALE ── */}
      {selSide && (
        <div style={{position:"fixed",inset:0,zIndex:6000,
          background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end"}}
          onClick={()=>setSelSide(null)}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:"#fff",borderRadius:"16px 16px 0 0",
              padding:"14px",width:"100%",maxWidth:480,margin:"0 auto"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#1A2B4A",marginBottom:4}}>
              {sideNames[selSide]}
            </div>
            <div style={{fontSize:11,color:"#64748B",marginBottom:12}}>
              Attuale: {getMat(sides[selSide]).label} · {sp(selSide)}mm
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {mats.map(m=>(
                <div key={m.id}
                  onClick={()=>{setSides(s=>({...s,[selSide]:m.id}));setSelSide(null);}}
                  style={{padding:"10px",borderRadius:10,cursor:"pointer",
                    border:`2px solid ${sides[selSide]===m.id?m.border:"#E2E8F0"}`,
                    background:m.color+"50",display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:14,height:14,borderRadius:3,
                    background:m.color,border:`1.5px solid ${m.border}`,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#0F172A"}}>{m.label}</div>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                      <input type="number" value={m.sp}
                        onClick={e=>e.stopPropagation()}
                        onChange={e=>setMats(ms=>ms.map(x=>x.id===m.id?{...x,sp:parseInt(e.target.value)||1}:x))}
                        style={{width:36,padding:"2px 4px",borderRadius:4,
                          border:"1px solid #E2E8F0",fontSize:11,
                          fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}/>
                      <span style={{fontSize:9,color:"#64748B"}}>mm</span>
                    </div>
                  </div>
                  {sides[selSide]===m.id && <span style={{color:m.border,fontSize:16}}>✓</span>}
                </div>
              ))}
            </div>
            <div onClick={()=>setSelSide(null)}
              style={{marginTop:10,padding:"8px",textAlign:"center",
                color:"#94A3B8",fontSize:12,cursor:"pointer"}}>Annulla</div>
          </div>
        </div>
      )}
    </div>
  );
}
