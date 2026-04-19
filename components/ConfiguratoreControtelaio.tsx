"use client";
// @ts-nocheck
// ConfiguratoreControtelaio — motore freeLine identico a DisegnoTecnico
// Disegni segmenti liberi con snap H/V, poi riempi le zone chiuse
import React, { useState, useRef, useEffect, useCallback } from "react";

const FMono = "'JetBrains Mono','SF Mono',monospace";
const SNAP_PX = 12; // pixel di snap a punti esistenti

const CT_MAT = [
  { id:"eps",    label:"EPS",    color:"#C8DEF2", stroke:"#1A3A6A" },
  { id:"legno",  label:"Legno",  color:"#F5A623", stroke:"#C07010" },
  { id:"sede",   label:"Sede",   color:"#FFFFFF", stroke:"#DC1414", dash:true },
  { id:"profilo",label:"Profilo",color:"#E0E8F0", stroke:"#334455" },
];

// Preset — linee già disegnate in coordinate mm (origine 0,0 = angolo alto-sx)
const CT_PRESETS = [
  { n:"STH5", ids:["STH5","STH6","STH5I","STH6I"],
    lines:[
      {x1:0,y1:0,x2:350,y2:0},
      {x1:350,y1:0,x2:350,y2:60},
      {x1:350,y1:60,x2:0,y2:60},
      {x1:0,y1:60,x2:0,y2:0},
      {x1:50,y1:0,x2:50,y2:60},
      {x1:300,y1:0,x2:300,y2:60},
    ],
    fills:[{x:25,y:30,mat:"sede"},{x:175,y:30,mat:"eps"},{x:325,y:30,mat:"sede"}],
  },
  { n:"PROS", ids:["PROS","PROI"],
    lines:[
      {x1:0,y1:0,x2:280,y2:0},
      {x1:280,y1:0,x2:280,y2:80},
      {x1:280,y1:80,x2:220,y2:80},
      {x1:220,y1:80,x2:220,y2:40},
      {x1:220,y1:40,x2:0,y2:40},
      {x1:0,y1:40,x2:0,y2:0},
    ],
    fills:[{x:140,y:20,mat:"eps"}],
  },
  { n:"PROGCP", ids:["PROGCP","PROGC","PROIG","PROG"],
    lines:[
      {x1:0,y1:0,x2:280,y2:0},
      {x1:280,y1:0,x2:280,y2:170},
      {x1:280,y1:170,x2:0,y2:170},
      {x1:0,y1:170,x2:0,y2:0},
      {x1:0,y1:60,x2:230,y2:60},
      {x1:230,y1:0,x2:230,y2:60},
    ],
    fills:[{x:115,y:30,mat:"legno"},{x:140,y:115,mat:"eps"}],
  },
  { n:"STH3", ids:["STH3","STH3I"],
    lines:[
      {x1:0,y1:0,x2:325,y2:0},
      {x1:325,y1:0,x2:325,y2:80},
      {x1:325,y1:80,x2:0,y2:80},
      {x1:0,y1:80,x2:0,y2:0},
      {x1:50,y1:0,x2:50,y2:80},
    ],
    fills:[{x:25,y:40,mat:"sede"},{x:187,y:40,mat:"eps"}],
  },
  { n:"STF5", ids:["STF5","STF6","STF5I","STF6I","STF3","STF3I"],
    lines:[
      {x1:0,y1:0,x2:350,y2:0},
      {x1:350,y1:0,x2:350,y2:44},
      {x1:350,y1:44,x2:0,y2:44},
      {x1:0,y1:44,x2:0,y2:0},
      {x1:50,y1:0,x2:50,y2:44},
      {x1:300,y1:0,x2:300,y2:44},
    ],
    fills:[{x:25,y:22,mat:"sede"},{x:175,y:22,mat:"profilo"},{x:325,y:22,mat:"sede"}],
  },
];

// Flood-fill: trova quali linee circondano il punto P (in mm)
// Restituisce true se il punto è "dentro" una regione chiusa
function pointInPolygon(px, py, lines) {
  // Ray casting semplice lungo asse X
  let crosses = 0;
  lines.forEach(l => {
    const {x1,y1,x2,y2} = l;
    if ((y1 > py) !== (y2 > py)) {
      const xIntersect = x1 + (py - y1) * (x2 - x1) / (y2 - y1);
      if (px < xIntersect) crosses++;
    }
  });
  return crosses % 2 === 1;
}

function getBBox(lines) {
  if(!lines||!lines.length) return {minX:0,maxX:300,minY:0,maxY:100,w:300,h:100};
  const xs=[...lines.map(l=>l.x1),...lines.map(l=>l.x2)];
  const ys=[...lines.map(l=>l.y1),...lines.map(l=>l.y2)];
  const minX=Math.min(...xs),maxX=Math.max(...xs);
  const minY=Math.min(...ys),maxY=Math.max(...ys);
  return {minX,maxX,minY,maxY,w:(maxX-minX)||1,h:(maxY-minY)||1};
}

function scaleFor(lines, VW, VH, PAD) {
  const bb = getBBox(lines);
  const sc = Math.min((VW-PAD*2)/bb.w, (VH-PAD*2)/bb.h);
  const offX = PAD + ((VW-PAD*2) - bb.w*sc)/2 - bb.minX*sc;
  const offY = PAD + ((VH-PAD*2) - bb.h*sc)/2 - bb.minY*sc;
  return { sc, offX, offY, bb,
    toSvg: (x,y) => ({sx: x*sc+offX, sy: y*sc+offY}),
    toWorld: (sx,sy) => ({x:(sx-offX)/sc, y:(sy-offY)/sc})
  };
}

export default function ConfiguratoreControtelaio({value, sistemaId, onChange, T}) {
  const Tc = T||{bg:"#F2F1EC",card:"#FFFFFF",bdr:"#E5E3DC",text:"#1A1A1C",
    sub:"#8E8E93",acc:"#D08008",grn:"#1A9E73",red:"#DC4444",blue:"#3B7FE0"};

  const getPreset = (sid) => CT_PRESETS.find(p=>p.ids?.includes(sid))||null;
  const init = value||{};
  const initP = (!init.lines?.length && sistemaId) ? getPreset(sistemaId) : null;

  const [lines,   setLines]   = useState(initP?.lines  || init.lines  || []);
  const [fills,   setFills]   = useState(initP?.fills  || init.fills  || []);
  const [pending, setPending] = useState(null); // {x1,y1} punto iniziale linea in corso
  const [selMat,  setSelMat]  = useState("eps");
  const [drawMode,setDrawMode]= useState(true); // true=disegna, false=seleziona/cancella
  const [misuraL, setMisuraL] = useState(init.misuraL||"");
  const [misuraH, setMisuraH] = useState(init.misuraH||"");
  const [cursor,  setCursor]  = useState(null); // posizione cursore in mm mentre disegna
  const [zoom,    setZoom]    = useState(1);
  const [panX,    setPanX]    = useState(0);
  const [panY,    setPanY]    = useState(0);
  const svgRef = useRef(null);
  const tRef   = useRef([]);
  const pinchRef = useRef(null);
  const prevSis = useRef(sistemaId);

  useEffect(()=>{onChange?.({lines,fills,misuraL,misuraH});},[lines,fills,misuraL,misuraH]);

  useEffect(()=>{
    if(sistemaId && sistemaId!==prevSis.current){
      prevSis.current=sistemaId;
      const p=getPreset(sistemaId);
      if(p){setLines(p.lines||[]);setFills(p.fills||[]);
        setPending(null);setZoom(1);setPanX(0);setPanY(0);}
    }
  },[sistemaId]);

  const resetView = () => {setZoom(1);setPanX(0);setPanY(0);};

  const loadPreset = (p) => {
    setLines(p.lines||[]);setFills(p.fills||[]);
    setPending(null);setZoom(1);setPanX(0);setPanY(0);
  };

  // Canvas dimensions
  const VW = typeof window!=="undefined" ? Math.min(window.innerWidth-32,520) : 400;
  const PAD = 50;
  const bb = getBBox(lines.length ? lines : [{x1:0,y1:0,x2:300,y2:100}]);
  const VH = Math.min(340, Math.max(180, VW * (bb.h/bb.w) + PAD*2));
  const S = scaleFor(lines.length?lines:[{x1:0,y1:0,x2:300,y2:100}], VW, VH, PAD);

  const vbW=VW/zoom, vbH=VH/zoom;
  const vbX=panX+(VW-vbW)/2, vbY=panY+(VH-vbH)/2;

  // Converti evento → coordinate mondo mm
  const evToWorld = useCallback((e) => {
    const svg=svgRef.current; if(!svg) return {x:0,y:0};
    const r=svg.getBoundingClientRect();
    const cl=e.touches?.[0]||e;
    const sx=vbX+(cl.clientX-r.left)/r.width*vbW;
    const sy=vbY+(cl.clientY-r.top)/r.height*vbH;
    return S.toWorld(sx,sy);
  },[vbX,vbY,vbW,vbH,S]);

  // Snap a punti esistenti o a linee H/V
  const snapPoint = useCallback((wx,wy) => {
    // Snap a punti esistenti
    const pts=[...lines.flatMap(l=>[{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}])];
    for(const p of pts){
      const d=Math.hypot((wx-p.x)*S.sc,(wy-p.y)*S.sc);
      if(d<SNAP_PX) return {x:p.x,y:p.y,snapped:true};
    }
    // Snap orizzontale/verticale al punto iniziale della linea corrente
    if(pending){
      const adx=Math.abs(wx-pending.x1)*S.sc;
      const ady=Math.abs(wy-pending.y1)*S.sc;
      if(adx<SNAP_PX) return {x:pending.x1,y:wy,snapped:false};
      if(ady<SNAP_PX) return {x:wx,y:pending.y1,snapped:false};
    }
    return {x:Math.round(wx/5)*5,y:Math.round(wy/5)*5,snapped:false};
  },[lines,pending,S.sc]);

  // Click sul canvas: disegna una linea
  const handleCanvasClick = useCallback((e) => {
    if(!drawMode) return;
    const raw=evToWorld(e);
    const {x,y}=snapPoint(raw.x,raw.y);
    if(!pending){
      setPending({x1:x,y1:y});
    } else {
      if(x===pending.x1&&y===pending.y1){setPending({x1:x,y1:y});return;}
      setLines(prev=>[...prev,{id:Date.now(),x1:pending.x1,y1:pending.y1,x2:x,y2:y}]);
      setPending({x1:x,y1:y}); // continua dal nuovo punto
    }
  },[drawMode,pending,evToWorld,snapPoint]);

  // Mouse move: mostra preview linea
  const handleCanvasMove = useCallback((e) => {
    if(!drawMode||!pending) return;
    const raw=evToWorld(e);
    const {x,y}=snapPoint(raw.x,raw.y);
    setCursor({x,y});
  },[drawMode,pending,evToWorld,snapPoint]);

  // Click su zona: riempi con materiale selezionato
  const handleFillClick = useCallback((e) => {
    if(drawMode) return;
    const raw=evToWorld(e);
    const wx=raw.x, wy=raw.y;
    // Aggiorna fill esistente vicino al tap, oppure aggiunge nuovo
    // NON controlla se la forma è chiusa — funziona anche su forme aperte
    const existing=fills.findIndex(f=>Math.hypot(f.x-wx,f.y-wy)*S.sc<28);
    if(existing>=0){
      setFills(f=>f.map((x,i)=>i===existing?{...x,mat:selMat}:x));
    } else {
      setFills(f=>[...f,{x:wx,y:wy,mat:selMat}]);
    }
  },[drawMode,lines,fills,selMat,evToWorld,S.sc]);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    if(drawMode) handleCanvasClick(e);
    else handleFillClick(e);
  },[drawMode,handleCanvasClick,handleFillClick]);

  // Touch handlers zoom/pan
  const onTS=useCallback((e)=>{tRef.current=Array.from(e.touches);pinchRef.current=null;},[]);
  const onTM=useCallback((e)=>{
    e.preventDefault();
    const ts=Array.from(e.touches);
    if(ts.length===1&&tRef.current[0]){
      setPanX(x=>x-(ts[0].clientX-tRef.current[0].clientX)/zoom);
      setPanY(y=>y-(ts[0].clientY-tRef.current[0].clientY)/zoom);
    } else if(ts.length===2&&tRef.current.length===2){
      const d=Math.hypot(ts[0].clientX-ts[1].clientX,ts[0].clientY-ts[1].clientY);
      if(pinchRef.current) setZoom(z=>Math.min(8,Math.max(0.3,z*d/pinchRef.current)));
      pinchRef.current=d;
    }
    tRef.current=ts;
  },[zoom]);
  const onTE=useCallback((e)=>{tRef.current=Array.from(e.touches);pinchRef.current=null;},[]);

  // Genera path SVG per il fill flood (grid di campionamento)
  // Per ogni fill, disegna un cerchio di riempimento con clipPath del poligono
  const renderFills = () => {
    if(!lines.length) return null;
    // Costruisce il path SVG del contorno (tutte le linee)
    return fills.map((f,i)=>{
      const mat=CT_MAT.find(m=>m.id===f.mat)||CT_MAT[0];
      const {sx,sy}=S.toSvg(f.x,f.y);
      const fill=mat.id==="eps"?"url(#ctE)":mat.id==="legno"?"url(#ctW)":mat.color;
      // Usa un cerchio grande come fill — viene ritagliato dal clipPath della sagoma
      const R=500; // raggio enorme — ritagliato dalla sagoma
      return (
        <g key={i} clipPath={`url(#sgClip${i})`}>
          <defs>
            <clipPath id={`sgClip${i}`}>
              {/* Usa tutte le linee per costruire un path di clip approssimativo */}
              <polygon points={getOutlinePoints(lines)}/>
            </clipPath>
          </defs>
          <circle cx={sx} cy={sy} r={R*S.sc} fill={fill} opacity={0.9}/>
          <text x={sx} y={sy+4} textAnchor="middle" fontSize={11}
            fontWeight="800" fontFamily={FMono}
            fill={mat.id==="eps"?"#1A3A6A":mat.id==="legno"?"#774400":"#334455"}>
            {mat.id!=="sede"?mat.label:""}
          </text>
        </g>
      );
    });
  };

  // Costruisce i punti del contorno della zona che contiene il punto (x,y)
  // Approccio semplificato: usa tutte le linee come poligono
  // Ricostruisce il contorno seguendo le linee connesse in ordine
  // Funziona per qualsiasi forma, anche non convessa (L, U, T ecc.)
  function buildContour(lines) {
    if(!lines||lines.length<2) return "";
    // Costruisce adiacenza: ogni punto → linee connesse
    const snap = (x,y) => `${Math.round(x*2)/2},${Math.round(y*2)/2}`;
    const adj = {};
    lines.forEach((l,i)=>{
      const k1=snap(l.x1,l.y1), k2=snap(l.x2,l.y2);
      if(!adj[k1]) adj[k1]={pt:{x:l.x1,y:l.y1},next:[]};
      if(!adj[k2]) adj[k2]={pt:{x:l.x2,y:l.y2},next:[]};
      adj[k1].next.push(k2);
      adj[k2].next.push(k1);
    });
    // Trova un punto di partenza (preferibilmente angolo top-left)
    const keys=Object.keys(adj);
    let start=keys[0];
    let minScore=Infinity;
    keys.forEach(k=>{const p=adj[k].pt; const s=p.x+p.y; if(s<minScore){minScore=s;start=k;}});
    // Percorri il contorno
    const path=[];
    const visited=new Set();
    let cur=start, prev=null;
    for(let i=0;i<keys.length+1;i++){
      path.push(adj[cur].pt);
      visited.add(cur);
      const neighbors=adj[cur].next.filter(n=>n!==prev&&!visited.has(n));
      if(!neighbors.length) break;
      prev=cur; cur=neighbors[0];
    }
    return path.map(p=>{const s=S.toSvg(p.x,p.y);return s.sx.toFixed(1)+","+s.sy.toFixed(1);}).join(" ");
  }

  function getOutlinePoints(lines) {
    return buildContour(lines);
  }

  const polyContour = lines.length>=2 ? buildContour(lines) : "";

  const curSvg = cursor&&pending ? S.toSvg(cursor.x,cursor.y) : null;
  const pendSvg = pending ? S.toSvg(pending.x1,pending.y1) : null;

  return (
    <div style={{borderRadius:8,overflow:"hidden",border:"1px solid "+Tc.bdr,background:Tc.card}}>

      {/* Preset */}
      <div style={{display:"flex",gap:4,padding:"6px 8px",overflowX:"auto",
        borderBottom:"1px solid "+Tc.bdr,background:Tc.bg}}>
        {CT_PRESETS.map(p=>{
          const isActive=p.ids?.includes(sistemaId);
          return(
            <button key={p.n} onClick={()=>loadPreset(p)}
              style={{padding:"4px 10px",borderRadius:6,whiteSpace:"nowrap",
                border:"1.5px solid "+(isActive?"#1A9E73":Tc.bdr),
                background:isActive?"#1A9E7318":Tc.card,
                fontSize:10,fontWeight:700,cursor:"pointer",
                color:isActive?"#1A9E73":Tc.text}}>
              {p.n}
            </button>
          );
        })}
        <button onClick={()=>{setLines([]);setFills([]);setPending(null);resetView();}}
          style={{padding:"4px 8px",borderRadius:6,border:"1px solid "+Tc.bdr,
            background:"white",fontSize:10,cursor:"pointer",color:Tc.sub,marginLeft:"auto"}}>
          🗑
        </button>
      </div>

      {/* Mode switch */}
      <div style={{display:"flex",gap:0,borderBottom:"1px solid "+Tc.bdr}}>
        <div onClick={()=>{setDrawMode(true);setPending(null);}}
          style={{flex:1,padding:"7px",textAlign:"center",cursor:"pointer",fontSize:10,
            fontWeight:drawMode?800:500,
            color:drawMode?"#0F766E":Tc.sub,
            background:drawMode?"#F0FDF9":"white",
            borderBottom:drawMode?"2px solid #0F766E":"2px solid transparent"}}>
          ✏️ Disegna linee
        </div>
        <div onClick={()=>setDrawMode(false)}
          style={{flex:1,padding:"7px",textAlign:"center",cursor:"pointer",fontSize:10,
            fontWeight:!drawMode?800:500,
            color:!drawMode?Tc.acc:Tc.sub,
            background:!drawMode?"#FFF8E8":"white",
            borderBottom:!drawMode?"2px solid "+Tc.acc:"2px solid transparent"}}>
          🎨 Riempi zona
        </div>
      </div>

      {/* Canvas */}
      <div style={{position:"relative",background:"#F0FDF9",height:VH,
        overflow:"hidden",touchAction:"none"}}
        onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>

        <div style={{position:"absolute",top:8,right:8,zIndex:20,
          display:"flex",flexDirection:"column",gap:4}}>
          {[{l:"+",fn:()=>setZoom(z=>Math.min(8,z*1.35))},
            {l:"−",fn:()=>setZoom(z=>Math.max(0.3,z*0.74))},
            {l:"↺",fn:resetView}].map(b=>(
            <div key={b.l} onClick={b.fn}
              style={{width:30,height:30,borderRadius:7,background:"rgba(255,255,255,0.92)",
                border:"1px solid "+Tc.bdr,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:b.l==="↺"?14:18,fontWeight:800,
                cursor:"pointer",color:"#0F766E"}}>
              {b.l}
            </div>
          ))}
        </div>

        {/* Hint */}
        {!lines.length&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center",flexDirection:"column",gap:6,color:"#94A3B8",
            pointerEvents:"none"}}>
            <div style={{fontSize:28}}>✏️</div>
            <div style={{fontSize:13,fontWeight:600}}>
              {drawMode?"Tocca per iniziare a disegnare":"Seleziona prima un preset"}
            </div>
            <div style={{fontSize:10,textAlign:"center"}}>
              Ogni tap crea un punto — i segmenti si uniscono automaticamente
            </div>
          </div>
        )}

        <svg ref={svgRef} width="100%" height="100%"
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{display:"block",cursor:drawMode?"crosshair":"pointer"}}
          onClick={handleClick}
          onMouseMove={handleCanvasMove}>

          <defs>
            <pattern id="ctE" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#C8DEF2"/>
              <circle cx="4" cy="4" r="2.5" fill="none" stroke="#1A3A6A" strokeWidth="0.7"/>
            </pattern>
            <pattern id="ctW" x="0" y="0" width="8" height="5" patternUnits="userSpaceOnUse">
              <rect width="8" height="5" fill="#F5A623"/>
              <line x1="0" y1="2.5" x2="8" y2="2.5" stroke="#C07010" strokeWidth="0.8"/>
              <line x1="0" y1="4" x2="8" y2="4" stroke="#C07010" strokeWidth="0.3"/>
            </pattern>
            <pattern id="ctG" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#E8EEF5" strokeWidth="0.5"/>
            </pattern>
            {polyContour&&<clipPath id="mainClip"><polygon points={polyContour}/></clipPath>}
          </defs>

          <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="url(#ctG)"/>

          {/* Riempimenti */}
          {fills.map((f,i)=>{
            const mat=CT_MAT.find(m=>m.id===f.mat)||CT_MAT[0];
            const {sx,sy}=S.toSvg(f.x,f.y);
            const fill=mat.id==="eps"?"url(#ctE)":mat.id==="legno"?"url(#ctW)":mat.color;
            return(
              <g key={i} clipPath="url(#mainClip)">
                <circle cx={sx} cy={sy} r={500} fill={fill} opacity={0.88}/>
                <text x={sx} y={sy+4} textAnchor="middle" fontSize={11}
                  fontWeight="800" fontFamily={FMono}
                  fill={mat.id==="eps"?"#1A3A6A":mat.id==="legno"?"#774400":"#334455"}>
                  {mat.id!=="sede"&&mat.id!=="vuoto"?mat.label:""}
                </text>
              </g>
            );
          })}

          {/* Linee disegnate */}
          {lines.map((l,i)=>{
            const a=S.toSvg(l.x1,l.y1), b=S.toSvg(l.x2,l.y2);
            const mm=Math.round(Math.hypot(l.x2-l.x1,l.y2-l.y1));
            const mx=(a.sx+b.sx)/2, my=(a.sy+b.sy)/2;
            const isH=Math.abs(b.sy-a.sy)<Math.abs(b.sx-a.sx);
            const qx=mx+(isH?0:-22), qy=my+(isH?-14:0);
            return (
              <g key={l.id||i}
                onClick={e=>{if(!drawMode){e.stopPropagation();
                  setLines(prev=>prev.filter((_,j)=>j!==i));
                  setFills(f=>f); // mantieni fills
                }}}
                style={{cursor:drawMode?"crosshair":"pointer"}}>
                {/* Hit area trasparente larga */}
                <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                  stroke={drawMode?"transparent":"#DC444420"} strokeWidth={16}/>
                {/* Linea visibile */}
                <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                  stroke="#1A3A6A" strokeWidth={2.5} strokeLinecap="round"/>
                {/* Icona cestino in modalità cancella */}
                {!drawMode&&(
                  <g>
                    <circle cx={mx} cy={my} r={10} fill="white"
                      stroke="#DC4444" strokeWidth={1.5} opacity={0.9}/>
                    <text x={mx} y={my+4} textAnchor="middle" fontSize={12}
                      fill="#DC4444" fontWeight="900">×</text>
                  </g>
                )}
                {/* Quota */}
                {drawMode&&(
                  <g>
                    <rect x={qx-16} y={qy-8} width={32} height={12} rx={3} fill="rgba(255,255,255,0.93)"/>
                    <text x={qx} y={qy+2} textAnchor="middle" fontSize={10}
                      fill="#0F172A" fontWeight="800" fontFamily={FMono}>{mm}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Preview linea in corso */}
          {drawMode&&pending&&curSvg&&pendSvg&&(
            <line x1={pendSvg.sx} y1={pendSvg.sy} x2={curSvg.sx} y2={curSvg.sy}
              stroke="#0F766E" strokeWidth={2} strokeDasharray="6,4" opacity={0.7}/>
          )}

          {/* Punto iniziale linea corrente */}
          {pending&&pendSvg&&(
            <circle cx={pendSvg.sx} cy={pendSvg.sy} r={6}
              fill="#1A9E73" stroke="#fff" strokeWidth={2}/>
          )}

          {/* Punti di snap */}
          {drawMode&&lines.map((l,i)=>[
            S.toSvg(l.x1,l.y1),
            S.toSvg(l.x2,l.y2)
          ].map((s,j)=>(
            <circle key={`${i}_${j}`} cx={s.sx} cy={s.sy} r={4}
              fill="#1A3A6A" stroke="#fff" strokeWidth={1.5} opacity={0.6}/>
          )))}
        </svg>
      </div>

      {/* Contatore linee */}
      {lines.length>0&&(
        <div style={{padding:"4px 8px",borderTop:"1px solid "+Tc.bdr,
          display:"flex",gap:6,alignItems:"center",background:"#fff",fontSize:10,color:Tc.sub}}>
          <span>{lines.length} linee</span>
          {pending&&<span style={{color:"#0F766E",fontWeight:700}}>• In corso — tap per chiudere</span>}
          {!drawMode&&<span style={{color:Tc.acc,fontWeight:700}}>
            Tocca una zona per riempirla · Tocca una linea per cancellarla
          </span>}
          <button onClick={()=>{setPending(null);}}
            style={{marginLeft:"auto",padding:"2px 7px",borderRadius:5,
              border:"1px solid "+Tc.bdr,background:"white",fontSize:9,cursor:"pointer",color:Tc.sub}}>
            Annulla linea
          </button>
        </div>
      )}

      {/* MATERIALI */}
      <div style={{padding:"10px 10px 8px",borderTop:"2px solid "+Tc.bdr,background:Tc.bg}}>
        <div style={{fontSize:10,fontWeight:800,color:Tc.sub,textTransform:"uppercase",
          letterSpacing:0.5,marginBottom:8}}>
          Materiale selezionato
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {CT_MAT.map(mat=>{
            const isAct=selMat===mat.id;
            return(
              <div key={mat.id} onClick={()=>setSelMat(mat.id)}
                style={{padding:"8px 4px",borderRadius:8,textAlign:"center",cursor:"pointer",
                  border:"2px solid "+(isAct?mat.stroke:Tc.bdr),
                  background:isAct?mat.color:"#fff",
                  boxShadow:isAct?"0 2px 8px "+mat.stroke+"35":"none",
                  transition:"all 0.12s"}}>
                <svg width={42} height={26} style={{display:"block",margin:"0 auto 4px",
                  borderRadius:4,overflow:"hidden"}}>
                  <defs>
                    <pattern id={"pE"+mat.id} x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
                      <rect width="7" height="7" fill="#C8DEF2"/>
                      <circle cx="3.5" cy="3.5" r="2.2" fill="none" stroke="#1A3A6A" strokeWidth="0.6"/>
                    </pattern>
                    <pattern id={"pW"+mat.id} x="0" y="0" width="7" height="4" patternUnits="userSpaceOnUse">
                      <rect width="7" height="4" fill="#F5A623"/>
                      <line x1="0" y1="2" x2="7" y2="2" stroke="#C07010" strokeWidth="0.7"/>
                    </pattern>
                  </defs>
                  <rect width={42} height={26} rx={3}
                    fill={mat.id==="eps"?"url(#pE"+mat.id+")":mat.id==="legno"?"url(#pW"+mat.id+")":mat.color}
                    stroke={mat.stroke} strokeWidth={1.2}
                    strokeDasharray={mat.dash?"4,2":undefined}/>
                </svg>
                <div style={{fontSize:10,fontWeight:isAct?800:600,
                  color:isAct?mat.stroke:Tc.sub,lineHeight:1}}>
                  {mat.label}
                </div>
              </div>
            );
          })}
        </div>
        {!drawMode&&<div style={{marginTop:6,fontSize:9,color:Tc.sub,textAlign:"center"}}>
          Seleziona materiale → tocca la zona nel disegno
        </div>}
      </div>

      {/* Misure telaio */}
      <div style={{background:Tc.card,borderTop:"1px solid "+Tc.bdr,padding:"10px 12px 14px"}}>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:800,color:Tc.sub,marginBottom:3,textTransform:"uppercase"}}>Telaio L</div>
            <input inputMode="decimal" value={misuraL} onChange={e=>setMisuraL(e.target.value)}
              placeholder="mm" style={{width:"100%",padding:"8px 10px",borderRadius:7,
                boxSizing:"border-box",border:"1.5px solid "+Tc.bdr,fontSize:18,fontWeight:800,
                fontFamily:FMono,textAlign:"center",background:"#fff",outline:"none"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:800,color:Tc.sub,marginBottom:3,textTransform:"uppercase"}}>Telaio H</div>
            <input inputMode="decimal" value={misuraH} onChange={e=>setMisuraH(e.target.value)}
              placeholder="mm" style={{width:"100%",padding:"8px 10px",borderRadius:7,
                boxSizing:"border-box",border:"1.5px solid "+Tc.bdr,fontSize:18,fontWeight:800,
                fontFamily:FMono,textAlign:"center",background:"#fff",outline:"none"}}/>
          </div>
        </div>
      </div>
    </div>
  );
}
