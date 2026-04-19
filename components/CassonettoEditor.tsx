"use client";
// @ts-nocheck
// CassonettoEditor v3 — tap inside to add, drag to move/resize
import React, { useState, useRef, useCallback } from "react";

const MAT_LIST = [
  { id:"pvc",      label:"PVC",         color:"#93C5FD", border:"#3B7FE0", sp:4  },
  { id:"alluminio",label:"Alluminio",   color:"#CBD5E1", border:"#64748B", sp:2  },
  { id:"eps",      label:"Coib. EPS",   color:"#FDE68A", border:"#D08008", sp:30 },
  { id:"legno",    label:"Legno",       color:"#D6B896", border:"#92400E", sp:18 },
  { id:"acciaio",  label:"Acciaio",     color:"#9CA3AF", border:"#374151", sp:2  },
  { id:"aria",     label:"Aria",        color:"#F0F9FF", border:"#BAE6FD", sp:0  },
];

const ELEM_TYPES = [
  { id:"sportello",  label:"Sportello",      color:"#F97316", icon:"🚪" },
  { id:"vasistas",   label:"Vasistas",       color:"#8B5CF6", icon:"🪟" },
  { id:"zanzariera", label:"Zanzariera",     color:"#059669", icon:"🟩" },
  { id:"cintino",    label:"Foro cintino",   color:"#DC4444", icon:"⭕" },
  { id:"motore",     label:"Foro motore",    color:"#1A2B4A", icon:"⚙️" },
  { id:"guida",      label:"Guida",          color:"#0EA5E9", icon:"▐"  },
  { id:"note",       label:"Nota libera",    color:"#D08008", icon:"📝" },
];

const TABS = ["Sezione","Frontale","Dal basso"];
const VW = 560, VH = 400, PAD = 50;

// ─── Elemento nel SVG ─────────────────────────────────────
function ElemSvg({ el, sc, selected, onSelect, onDragStart, onResizeStart }) {
  const et = ELEM_TYPES.find(e=>e.id===el.tipo);
  if(!et) return null;
  const x = el.x * sc, y = el.y * sc, w = el.w * sc, h = el.h * sc;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h}
        fill={et.color+"25"} stroke={selected?"#F59E0B":et.color}
        strokeWidth={selected?2.5:1.5} strokeDasharray={selected?"none":"5,3"}
        rx="3" style={{cursor:"move"}}
        onPointerDown={e=>{e.stopPropagation();onSelect(el.id);onDragStart(e,el.id);}}/>
      <text x={x+w/2} y={y+h/2-4} textAnchor="middle" fontSize="9" fill={et.color} fontWeight="800">{et.label}</text>
      <text x={x+w/2} y={y+h/2+8} textAnchor="middle" fontSize="8" fill={et.color+"99"}>
        {Math.round(el.w)}×{Math.round(el.h)}mm
      </text>
      {selected && <>
        {/* Handle resize BR */}
        <rect x={x+w-8} y={y+h-8} width={10} height={10} fill="#F59E0B" rx="2"
          style={{cursor:"se-resize"}}
          onPointerDown={e=>{e.stopPropagation();onResizeStart(e,el.id);}}/>
        {/* Delete */}
        <g style={{cursor:"pointer"}} onPointerDown={e=>{e.stopPropagation();}}>
          <circle cx={x} cy={y} r={8} fill="#DC4444"/>
          <text x={x} y={y+4} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="900">×</text>
        </g>
      </>}
    </g>
  );
}

// ─── MAIN ─────────────────────────────────────────────────
export default function CassonettoEditor({ misure, onUpdate, onClose }) {
  const cP  = misure.casP     || 250;
  const cH  = misure.casH     || 200;
  const cL  = misure.casL     || 1200;
  const cLC = misure.casLCiel || 120;
  const cPC = misure.casPCiel || 100;

  const [mats, setMats]         = useState([...MAT_LIST]);
  const [latiMat, setLatiMat]   = useState({sup:"pvc",sx:"pvc",dx:"pvc",inf:"pvc"});
  const [selLato, setSelLato]   = useState(null);
  const [tab, setTab]           = useState(1); // 0=Sezione,1=Frontale,2=Basso
  const [elementi, setEl]       = useState([]);
  const [selEl, setSelEl]       = useState(null);
  const [addMenu, setAddMenu]   = useState(null); // {x,y} in mm coords
  const [showLib, setShowLib]   = useState(false);
  const [toolMis, setToolMis]   = useState(false);
  const [misA, setMisA]         = useState(null);
  const [misB, setMisB]         = useState(null);
  const svgRef                  = useRef(null);
  const dragRef                 = useRef(null); // {type:'move'|'resize'|'box', elId, ox,oy,mx0,my0}

  const getMat = id => mats.find(m=>m.id===id)||mats[0];

  // Dimensioni asse per ogni tab
  const axW = tab===0 ? cP : cL;
  const axH = tab===2 ? cP : cH;
  const sc  = Math.min((VW-PAD*2)/Math.max(axW,50), (VH-PAD*2-30)/Math.max(axH,50), 1.2);
  const bw  = axW*sc, bh = axH*sc;
  const bx  = (VW-bw)/2, by = VH-PAD-20;

  // Spessori
  const spT = Math.max(getMat(latiMat.sup).sp*sc,3);
  const spS = Math.max(getMat(latiMat.sx).sp*sc,3);
  const spD = Math.max(getMat(latiMat.dx).sp*sc,3);
  const spB = Math.max(getMat(latiMat.inf).sp*sc,3);
  // Zona interna in mm
  const intX0mm = getMat(latiMat.sx).sp;
  const intY0mm = getMat(latiMat.sup).sp;
  const intWmm  = axW - getMat(latiMat.sx).sp - getMat(latiMat.dx).sp;
  const intHmm  = axH - getMat(latiMat.sup).sp - getMat(latiMat.inf).sp;

  const svgPt = e => {
    const r = svgRef.current.getBoundingClientRect();
    return { x:(e.clientX-r.left)*(VW/r.width), y:(e.clientY-r.top)*(VH/r.height) };
  };
  // SVG px → mm interni
  const pxToMm = (px,py) => ({
    x: (px-bx)/sc,
    y: (by-bh+py-py)/sc, // non usato direttamente
  });

  // Pointer events sul SVG
  const onPtrMove = e => {
    const {x,y} = svgPt(e);
    const dr = dragRef.current;
    if(!dr) return;
    const dx=(x-dr.mx0)/sc, dy=(y-dr.my0)/sc;
    if(dr.type==="box-P") { onUpdate("casP",Math.max(50,Math.round((x-bx)/sc))); return; }
    if(dr.type==="box-H") { onUpdate("casH",Math.max(50,Math.round((by-y)/sc))); return; }
    if(dr.type==="box-L") { onUpdate("casL",Math.max(100,Math.round((x-bx)/sc))); return; }
    if(dr.type==="move") {
      setEl(es=>es.map(el=>el.id===dr.elId
        ? {...el, x:Math.max(0,Math.min(axW-el.w, dr.ox+dx)), y:Math.max(0,Math.min(axH-el.h, dr.oy+dy))}
        : el));
    }
    if(dr.type==="resize") {
      setEl(es=>es.map(el=>el.id===dr.elId
        ? {...el, w:Math.max(20, dr.ow+(dx)), h:Math.max(20, dr.oh+(dy))}
        : el));
    }
  };
  const onPtrUp = e => {
    if(toolMis && !dragRef.current) {
      const pt = svgPt(e);
      if(!misA){ setMisA(pt); } else if(!misB){ setMisB(pt); }
    }
    dragRef.current=null;
    svgRef.current?.releasePointerCapture(e.pointerId);
  };
  const misDist = misA&&misB ? Math.round(Math.hypot(misB.x-misA.x,misB.y-misA.y)/sc) : null;

  const onSvgClick = e => {
    if(toolMis||dragRef.current) return;
    const {x,y} = svgPt(e);
    setSelEl(null); setAddMenu(null);
    const tol=14;
    if(Math.abs(y-(by-bh))<tol&&x>bx&&x<bx+bw){setSelLato("sup");return;}
    if(Math.abs(y-by)<tol&&x>bx&&x<bx+bw){setSelLato("inf");return;}
    if(Math.abs(x-bx)<tol&&y>by-bh&&y<by){setSelLato("sx");return;}
    if(Math.abs(x-(bx+bw))<tol&&y>by-bh&&y<by){setSelLato("dx");return;}
    setSelLato(null);
  };

  const addElem = tipo => {
    const et = ELEM_TYPES.find(e=>e.id===tipo);
    const defW = tipo==="sportello"?300:tipo==="vasistas"?400:tipo==="zanzariera"?axW-60:tipo==="guida"?20:60;
    const defH = tipo==="zanzariera"?30:tipo==="guida"?axH-60:tipo==="note"?40:80;
    const newEl = {
      id:Date.now().toString(), tipo,
      x: Math.max(intX0mm, Math.min((addMenu?.mmx||intX0mm+20), axW-intX0mm-defW)),
      y: Math.max(intY0mm, Math.min((addMenu?.mmy||intY0mm+20), axH-intY0mm-defH)),
      w:defW, h:defH, tab
    };
    setEl(es=>[...es,newEl]);
    setSelEl(newEl.id);
    setAddMenu(null);
  };

  const delEl = id => { setEl(es=>es.filter(e=>e.id!==id)); setSelEl(null); };

  // Genera PDF testuale (export)
  const exportTesto = () => {
    const tabNames=["Sezione","Frontale","Dal basso"];
    const lines = [
      `=== CASSONETTO — ${tabNames[tab]} ===`,
      `Larghezza: ${cL}mm  Altezza: ${cH}mm  Profondità: ${cP}mm`,
      `Cielino: L=${cLC}mm P=${cPC}mm`,
      ``,
      `MATERIALI:`,
      `  Superiore: ${getMat(latiMat.sup).label} ${getMat(latiMat.sup).sp}mm`,
      `  Sinistro:  ${getMat(latiMat.sx).label}  ${getMat(latiMat.sx).sp}mm`,
      `  Destro:    ${getMat(latiMat.dx).label}  ${getMat(latiMat.dx).sp}mm`,
      `  Inferiore: ${getMat(latiMat.inf).label} ${getMat(latiMat.inf).sp}mm`,
      ``,
      `ELEMENTI:`,
      ...elementi.map(el=>{
        const et=ELEM_TYPES.find(e=>e.id===el.tipo);
        return `  ${et?.label}: X=${Math.round(el.x)}mm Y=${Math.round(el.y)}mm L=${Math.round(el.w)}mm H=${Math.round(el.h)}mm`;
      }),
    ];
    const txt = lines.join('\n');
    navigator.clipboard?.writeText(txt);
    alert('Copiato negli appunti!\n\n'+txt);
  };

  const elemDiTab = elementi.filter(el=>el.tab===tab);

  return (
    <div style={{position:"fixed",inset:0,zIndex:4000,background:"#fff",display:"flex",flexDirection:"column",fontFamily:"'Inter',sans-serif"}}>

      {/* HEADER */}
      <div style={{background:"#1A2B4A",padding:"8px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        <div style={{flex:1,color:"#fff",fontSize:13,fontWeight:800}}>Editor cassonetto</div>
        <div onClick={()=>setShowLib(s=>!s)} style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",
          fontSize:11,fontWeight:700,background:showLib?"#D08008":"rgba(255,255,255,0.12)",
          color:"#fff",border:"1px solid rgba(255,255,255,0.2)"}}>🎨</div>
        <div onClick={()=>{setToolMis(t=>{if(t){setMisA(null);setMisB(null);}return !t;})}}
          style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,
            background:toolMis?"#DC4444":"rgba(255,255,255,0.12)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)"}}>
          📐
        </div>
        <div onClick={exportTesto} style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",
          fontSize:11,fontWeight:700,background:"rgba(255,255,255,0.12)",color:"#fff",
          border:"1px solid rgba(255,255,255,0.2)"}}>📋</div>
        {onClose && <div onClick={onClose} style={{color:"rgba(255,255,255,0.6)",fontSize:22,cursor:"pointer",padding:"0 4px"}}>×</div>}
      </div>

      {/* TABS */}
      <div style={{display:"flex",borderBottom:"1px solid #E2E8F0",flexShrink:0,background:"#F8FAFC"}}>
        {TABS.map((t,i)=>(
          <div key={i} onClick={()=>setTab(i)}
            style={{flex:1,padding:"9px 4px",textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:700,
              color:tab===i?"#1A2B4A":"#94A3B8",
              borderBottom:tab===i?"2.5px solid #1A2B4A":"2.5px solid transparent",
              background:tab===i?"#fff":"transparent"}}>{t}</div>
        ))}
      </div>

      {/* LIBRERIA */}
      {showLib && (
        <div style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0",padding:"6px 10px",flexShrink:0}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            {mats.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 7px",
                borderRadius:7,border:`1.5px solid ${m.border}`,background:m.color+"50"}}>
                <div style={{width:10,height:10,borderRadius:2,background:m.color,border:`1px solid ${m.border}`,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,color:"#0F172A",flex:1}}>{m.label}</span>
                <input type="number" value={m.sp}
                  onChange={e=>setMats(ms=>ms.map(x=>x.id===m.id?{...x,sp:parseInt(e.target.value)||0}:x))}
                  style={{width:36,padding:"2px 3px",borderRadius:4,border:"1px solid #E2E8F0",
                    fontSize:11,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}/>
                <span style={{fontSize:9,color:"#64748B"}}>mm</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HINT */}
      {!toolMis && !addMenu && (
        <div style={{background:"#EFF8FF",padding:"5px 12px",flexShrink:0,
          fontSize:10,color:"#3B7FE0",fontWeight:600,textAlign:"center"}}>
          {tab===0?"Tap lati per materiale · Trascina ↔↕ per ridimensionare":
           "Tap dentro il rettangolo per aggiungere elementi · Tap lati per materiale"}
        </div>
      )}

      {/* SVG AREA */}
      <div style={{flex:1,background:"#EFF8FF",position:"relative",overflow:"hidden",minHeight:0}}>
        {toolMis && (
          <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",
            background:"#DC4444",color:"#fff",padding:"3px 12px",borderRadius:8,
            fontSize:11,fontWeight:700,zIndex:10,pointerEvents:"none"}}>
            {!misA?"Tap A":!misB?"Tap B":`${misDist}mm — `}
            {misB && <span onClick={()=>{setMisA(null);setMisB(null);}} style={{pointerEvents:"all",cursor:"pointer",textDecoration:"underline"}}>nuova</span>}
          </div>
        )}

        <svg ref={svgRef} width="100%" height="100%"
          viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet"
          style={{display:"block",userSelect:"none",cursor:toolMis?"crosshair":"default"}}
          onClick={onSvgClick}
          onPointerMove={onPtrMove} onPointerUp={onPtrUp}
          onPointerLeave={()=>{dragRef.current=null;}}>

          {/* Griglia */}
          {Array.from({length:12}).map((_,i)=>(
            <line key={"gx"+i} x1={i*50} y1={0} x2={i*50} y2={VH} stroke="#DCF0FF" strokeWidth="0.5"/>
          ))}
          {Array.from({length:9}).map((_,i)=>(
            <line key={"gy"+i} x1={0} y1={i*50} x2={VW} y2={i*50} stroke="#DCF0FF" strokeWidth="0.5"/>
          ))}

          {/* == SEZIONE (tab 0) == */}
          {tab===0 && (() => {
            const ferH=16;
            const rulloR=Math.min((bw-spS-spD)*0.24,(bh-spT-spB)*0.42,34);
            const rCx=bx+spS+(bw-spS-spD)/2, rCy=by-bh+spT+rulloR+4;
            const cielW=Math.min(cPC*sc,bw-spS-spD), cielH=Math.max(7,Math.min(cLC*sc*0.05,18));
            return (<g>
              <rect x={bx-18} y={by-bh-6} width={12} height={bh+ferH+12} fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.5"/>
              {/* Lati */}
              {[
                {x:bx,y:by-bh,w:bw,h:spT,id:"sup"},
                {x:bx,y:by-bh,w:spS,h:bh,id:"sx"},
                {x:bx+bw-spD,y:by-bh,w:spD,h:bh,id:"dx"},
                {x:bx,y:by-spB,w:bw,h:spB,id:"inf"},
              ].map(l=>(
                <rect key={l.id} x={l.x} y={l.y} width={l.w} height={l.h}
                  fill={getMat(latiMat[l.id]).color}
                  stroke={selLato===l.id?"#F59E0B":getMat(latiMat[l.id]).border}
                  strokeWidth={selLato===l.id?2.5:1.5} style={{cursor:"pointer"}}
                  onClick={e=>{e.stopPropagation();setSelLato(l.id);setAddMenu(null);}}/>
              ))}
              <rect x={bx+spS} y={by-bh+spT} width={bw-spS-spD} height={bh-spT-spB} fill="#EFF8FF" opacity="0.8"/>
              {rulloR>4 && <>
                <circle cx={rCx} cy={rCy} r={rulloR} fill="#DBEAFE" stroke="#3B7FE0" strokeWidth="1.5" strokeDasharray="5,3"/>
                <circle cx={rCx} cy={rCy} r={rulloR*0.28} fill="#3B7FE0" opacity="0.5"/>
                <text x={rCx} y={rCy+3} textAnchor="middle" fontSize="8" fill="#1E40AF" fontWeight="700">RULLO</text>
              </>}
              <rect x={bx} y={by} width={bw} height={ferH} fill="#1A2B4A18" stroke="#1A2B4A" strokeWidth="1.5" strokeDasharray="4,3"/>
              <text x={bx+bw/2} y={by+11} textAnchor="middle" fontSize="7" fill="#1A2B4A" fontWeight="700">feritoia</text>
              <rect x={bx+spS} y={by-spB-cielH} width={cielW} height={cielH} fill="#FDE68A" stroke="#D08008" strokeWidth="1.2" strokeDasharray="4,2" rx="2"/>
              {cielW>30 && <text x={bx+spS+cielW/2} y={by-spB-cielH/2+3} textAnchor="middle" fontSize="7" fill="#92400E" fontWeight="700">cielino</text>}
              {/* Quote */}
              <line x1={bx} y1={by+ferH+10} x2={bx+bw} y2={by+ferH+10} stroke="#1A2B4A" strokeWidth="1"/>
              <text x={bx+bw/2} y={by+ferH+22} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800">{cP}mm</text>
              <line x1={bx+bw+12} y1={by-bh} x2={bx+bw+12} y2={by} stroke="#1A2B4A" strokeWidth="1"/>
              <text x={bx+bw+24} y={by-bh/2+4} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800"
                transform={`rotate(90,${bx+bw+24},${by-bh/2+4})`}>{cH}mm</text>
              {/* Scala */}
              <g transform={`translate(${PAD-10},${VH-12})`}>
                <line x1={0} y1={0} x2={100*sc} y2={0} stroke="#1A2B4A" strokeWidth="1.5"/>
                <line x1={0} y1={-4} x2={0} y2={4} stroke="#1A2B4A" strokeWidth="1.5"/>
                <line x1={100*sc} y1={-4} x2={100*sc} y2={4} stroke="#1A2B4A" strokeWidth="1.5"/>
                <text x={50*sc} y={-6} textAnchor="middle" fontSize="9" fill="#1A2B4A" fontWeight="700">100mm</text>
              </g>
            </g>);
          })()}

          {/* == FRONTALE (tab 1) e DAL BASSO (tab 2) == */}
          {tab!==0 && (() => {
            const label = tab===1?"vista frontale (dall'interno)":"vista dal basso (feritoia in basso)";
            return (<g>
              <text x={bx+bw/2} y={by-bh-14} textAnchor="middle" fontSize="9" fill="#64748B">{label}</text>
              {/* Box principale */}
              {[
                {x:bx,y:by-bh,w:bw,h:spT,id:"sup"},
                {x:bx,y:by-bh,w:spS,h:bh,id:"sx"},
                {x:bx+bw-spD,y:by-bh,w:spD,h:bh,id:"dx"},
                {x:bx,y:by-spB,w:bw,h:spB,id:"inf"},
              ].map(l=>(
                <rect key={l.id} x={l.x} y={l.y} width={l.w} height={l.h}
                  fill={getMat(latiMat[l.id]).color}
                  stroke={selLato===l.id?"#F59E0B":getMat(latiMat[l.id]).border}
                  strokeWidth={selLato===l.id?2.5:1.5} style={{cursor:"pointer"}}
                  onClick={e=>{e.stopPropagation();setSelLato(l.id);setAddMenu(null);}}/>
              ))}
              <rect x={bx+spS} y={by-bh+spT} width={bw-spS-spD} height={bh-spT-spB} fill="#fff" opacity="0.85"/>
              {/* Hint tap */}
              {elemDiTab.length===0 && (
                <text x={bx+bw/2} y={by-bh/2+4} textAnchor="middle" fontSize="11" fill="#3B7FE080" fontWeight="700">
                  Tap qui per aggiungere elementi
                </text>
              )}
              {/* Quote */}
              <line x1={bx} y1={by+14} x2={bx+bw} y2={by+14} stroke="#1A2B4A" strokeWidth="1"/>
              <text x={bx+bw/2} y={by+26} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800">
                {tab===1?cL:cL}mm
              </text>
              <line x1={bx+bw+12} y1={by-bh} x2={bx+bw+12} y2={by} stroke="#1A2B4A" strokeWidth="1"/>
              <text x={bx+bw+24} y={by-bh/2+4} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800"
                transform={`rotate(90,${bx+bw+24},${by-bh/2+4})`}>{tab===1?cH:cP}mm</text>
              {/* Scala */}
              <g transform={`translate(${PAD-10},${VH-12})`}>
                <line x1={0} y1={0} x2={100*sc} y2={0} stroke="#1A2B4A" strokeWidth="1.5"/>
                <line x1={0} y1={-4} x2={0} y2={4} stroke="#1A2B4A" strokeWidth="1.5"/>
                <line x1={100*sc} y1={-4} x2={100*sc} y2={4} stroke="#1A2B4A" strokeWidth="1.5"/>
                <text x={50*sc} y={-6} textAnchor="middle" fontSize="9" fill="#1A2B4A" fontWeight="700">100mm</text>
              </g>
            </g>);
          })()}

          {/* ELEMENTI */}
          {elemDiTab.map(el=>(
            <ElemSvg key={el.id} el={{...el,
              x:bx+spS+el.x*sc, y:by-bh+spT+el.y*sc,
              w:el.w*sc, h:el.h*sc
            }} sc={1}
              selected={selEl===el.id}
              onSelect={id=>{setSelEl(id);setAddMenu(null);}}
              onDragStart={(e,id)=>{
                const cur=elementi.find(x=>x.id===id);
                dragRef.current={type:"move",elId:id,ox:cur.x,oy:cur.y,mx0:svgPt(e).x,my0:svgPt(e).y};
                svgRef.current?.setPointerCapture(e.pointerId);
              }}
              onResizeStart={(e,id)=>{
                const cur=elementi.find(x=>x.id===id);
                dragRef.current={type:"resize",elId:id,ow:cur.w,oh:cur.h,mx0:svgPt(e).x,my0:svgPt(e).y};
                svgRef.current?.setPointerCapture(e.pointerId);
              }}/>
          ))}

          {/* Elimina elemento selezionato */}
          {selEl && (
            <g onClick={()=>delEl(selEl)} style={{cursor:"pointer"}}>
              <rect x={VW-50} y={4} width={44} height={22} rx="6" fill="#DC4444"/>
              <text x={VW-28} y={18} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="800">✕ Elimina</text>
            </g>
          )}

          {/* Handle resize box */}
          {[
            {drag:"box-"+(tab===0?"P":tab===2?"L":"L"), cx:bx+bw, cy:by-bh/2, lbl:"↔"},
            {drag:"box-"+(tab===0?"H":tab===2?"P":"H"), cx:bx+bw/2, cy:by-bh, lbl:"↕"},
          ].map(h=>(
            <g key={h.drag}>
              <circle cx={h.cx} cy={h.cy} r={9} fill="#1A2B4A" stroke="#fff" strokeWidth="2"
                style={{cursor:h.lbl==="↔"?"ew-resize":"ns-resize"}}
                onPointerDown={e=>{e.stopPropagation();dragRef.current={type:h.drag,mx0:svgPt(e).x,my0:svgPt(e).y};svgRef.current?.setPointerCapture(e.pointerId);}}/>
              <text x={h.cx} y={h.cy+4} textAnchor="middle" fontSize="12" fill="#fff" style={{pointerEvents:"none"}}>{h.lbl}</text>
            </g>
          ))}

          {/* Misura */}
          {misA && <circle cx={misA.x} cy={misA.y} r={5} fill="#DC4444" stroke="#fff" strokeWidth="2"/>}
          {misA&&misB && <>
            <line x1={misA.x} y1={misA.y} x2={misB.x} y2={misB.y} stroke="#DC4444" strokeWidth="1.5" strokeDasharray="5,3"/>
            <circle cx={misB.x} cy={misB.y} r={5} fill="#DC4444" stroke="#fff" strokeWidth="2"/>
            <rect x={(misA.x+misB.x)/2-26} y={(misA.y+misB.y)/2-10} width={52} height={18} rx="5" fill="#DC4444"/>
            <text x={(misA.x+misB.x)/2} y={(misA.y+misB.y)/2+5} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="800">{misDist}mm</text>
          </>}
        </svg>
      </div>

      {/* MENU AGGIUNGI */}
      {addMenu && (
        <div style={{position:"fixed",inset:0,zIndex:5000,background:"rgba(0,0,0,0.4)",
          display:"flex",alignItems:"flex-end"}} onClick={()=>setAddMenu(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"16px 16px 0 0",
            padding:"14px",width:"100%",maxWidth:480,margin:"0 auto"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#1A2B4A",marginBottom:12}}>
              Aggiungi elemento
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {ELEM_TYPES.map(et=>(
                <div key={et.id} onClick={()=>addElem(et.id)}
                  style={{padding:"12px",borderRadius:10,cursor:"pointer",
                    border:`1.5px solid ${et.color}40`,background:et.color+"15",
                    display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>{et.icon}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>{et.label}</span>
                </div>
              ))}
            </div>
            <div onClick={()=>setAddMenu(null)}
              style={{marginTop:10,padding:"8px",textAlign:"center",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>
              Annulla
            </div>
          </div>
        </div>
      )}

      {/* SELEZIONE MATERIALE */}
      {selLato && (
        <div style={{position:"fixed",inset:0,zIndex:5000,background:"rgba(0,0,0,0.4)",
          display:"flex",alignItems:"flex-end"}} onClick={()=>setSelLato(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"16px 16px 0 0",
            padding:"14px",width:"100%",maxWidth:480,margin:"0 auto"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#1A2B4A",marginBottom:10}}>
              Lato {selLato==="sup"?"superiore":selLato==="inf"?"inferiore":selLato==="sx"?"sinistro":"destro"}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {mats.map(m=>(
                <div key={m.id} onClick={()=>{setLatiMat(l=>({...l,[selLato]:m.id}));setSelLato(null);}}
                  style={{padding:"9px",borderRadius:10,cursor:"pointer",
                    border:`2px solid ${latiMat[selLato]===m.id?m.border:"#E2E8F0"}`,
                    background:m.color+"60",display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:14,height:14,borderRadius:3,background:m.color,border:`1.5px solid ${m.border}`}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#0F172A"}}>{m.label}</div>
                    <div style={{fontSize:10,color:"#64748B"}}>{m.sp}mm</div>
                  </div>
                  {latiMat[selLato]===m.id && <span style={{marginLeft:"auto",color:m.border}}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CAMPI */}
      <div style={{background:"#fff",borderTop:"1px solid #E2E8F0",padding:"7px 10px",flexShrink:0}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:5}}>
          {[{l:"Larghezza",f:"casL",v:misure.casL},{l:"Altezza",f:"casH",v:misure.casH},{l:"Profondità",f:"casP",v:misure.casP}].map(({l,f,v})=>(
            <div key={f}>
              <div style={{fontSize:9,color:"#64748B",fontWeight:700,marginBottom:2}}>{l}</div>
              <input type="number" inputMode="numeric" value={v||""} placeholder="mm"
                onChange={e=>onUpdate(f,parseInt(e.target.value)||0)}
                style={{width:"100%",padding:"5px 3px",borderRadius:6,border:"1px solid #E2E8F0",
                  fontSize:13,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                  textAlign:"center",background:"#F8FAFC",color:"#1A2B4A",boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
          {[{l:"Cielino L",f:"casLCiel",v:misure.casLCiel},{l:"Cielino P",f:"casPCiel",v:misure.casPCiel}].map(({l,f,v})=>(
            <div key={f}>
              <div style={{fontSize:9,color:"#64748B",fontWeight:700,marginBottom:2}}>{l}</div>
              <input type="number" inputMode="numeric" value={v||""} placeholder="mm"
                onChange={e=>onUpdate(f,parseInt(e.target.value)||0)}
                style={{width:"100%",padding:"5px 3px",borderRadius:6,border:"1px solid #E2E8F0",
                  fontSize:13,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                  textAlign:"center",background:"#F8FAFC",color:"#1A2B4A",boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
