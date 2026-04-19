"use client";
// @ts-nocheck
// MASTRO ERP — SkizzoTecnico
// Schizzo guidato per vano: disegna rettangolo → quota automatica → compila misure
// Touch nativo via addEventListener { passive:false } — niente preventDefault inline
import React, { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  misure?: Record<string,number>;
  onSaveMisure?: (l:number, h:number) => void;
  onClose?: () => void;
  T?: any;
}

const FM = "'JetBrains Mono','SF Mono',monospace";

// Colori pennello
const PEN_COLORS = ["#1d1d1f","#3B7FE0","#1A9E73","#D08008","#af52de","#64748B"];

export default function SkizzoTecnico({ misure, onSaveMisure, onClose, T }: Props) {
  const Tc = T || { bg:"#F2F1EC", card:"#fff", bdr:"#E5E3DC", text:"#1A1A1C",
    sub:"#8E8E93", acc:"#D08008", grn:"#1A9E73", red:"#DC4444", blue:"#3B7FE0" };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x:0, y:0 });

  const [penColor, setPenColor] = useState("#1d1d1f");
  const [penSize, setPenSize] = useState(3);
  const [tool, setTool] = useState<"pen"|"eraser"|"quote">("pen");
  const [quoteState, setQuoteState] = useState<null|{x1:number,y1:number}>(null);
  const [measureModal, setMeasureModal] = useState<null|{x1:number,y1:number,x2:number,y2:number}>(null);
  const [measureVal, setMeasureVal] = useState("");
  const [quotes, setQuotes] = useState<Array<{x1:number,y1:number,x2:number,y2:number,text:string,color:string}>>([]);
  const [saved, setSaved] = useState(false);
  const [extractedL, setExtractedL] = useState<number|null>(misure?.lCentro||null);
  const [extractedH, setExtractedH] = useState<number|null>(misure?.hCentro||null);

  // Canvas size
  const CW = typeof window !== "undefined" ? Math.min(window.innerWidth, 600) : 400;
  const CH = typeof window !== "undefined" ? window.innerHeight - 160 : 500;

  // Setup touch listeners con passive:false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: TouchEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      if ("touches" in e) {
        const t = e.touches[0] || e.changedTouches[0];
        return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy };
      }
      return { x: ((e as MouseEvent).clientX - rect.left) * sx, y: ((e as MouseEvent).clientY - rect.top) * sy };
    };

    const onStart = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      const pos = getPos(e);
      if (tool === "quote") {
        setQuoteState({ x1: pos.x, y1: pos.y });
        return;
      }
      isDrawingRef.current = true;
      lastPosRef.current = pos;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = penSize * 6;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penSize;
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    const onMove = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current) return;
      const pos = getPos(e);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPosRef.current = pos;
    };

    const onEnd = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      if (tool === "quote" && quoteState) {
        const pos = getPos(e);
        const dist = Math.hypot(pos.x - quoteState.x1, pos.y - quoteState.y1);
        if (dist > 20) {
          setMeasureModal({ x1: quoteState.x1, y1: quoteState.y1, x2: pos.x, y2: pos.y });
          setMeasureVal("");
        }
        setQuoteState(null);
        return;
      }
      isDrawingRef.current = false;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.globalCompositeOperation = "source-over";
    };

    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove",  onMove,  { passive: false });
    canvas.addEventListener("touchend",   onEnd,   { passive: false });
    canvas.addEventListener("mousedown",  onStart, { passive: false });
    canvas.addEventListener("mousemove",  onMove,  { passive: false });
    canvas.addEventListener("mouseup",    onEnd,   { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove",  onMove);
      canvas.removeEventListener("touchend",   onEnd);
      canvas.removeEventListener("mousedown",  onStart);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseup",    onEnd);
    };
  }, [tool, penColor, penSize, quoteState]);

  // Ridisegna quote sopra il canvas (overlay SVG)
  const drawQuoteSVG = (q: typeof quotes[0], i: number) => {
    const { x1, y1, x2, y2, text, color } = q;
    const angle = Math.atan2(y2-y1, x2-x1);
    const perp = angle + Math.PI/2;
    const tl = 10;
    const mx = (x1+x2)/2, my = (y1+y2)/2;
    const offX = -Math.sin(angle)*18, offY = Math.cos(angle)*18;
    const lx1 = x1 - Math.cos(perp)*tl, ly1 = y1 - Math.sin(perp)*tl;
    const lx2 = x1 + Math.cos(perp)*tl, ly2 = y1 + Math.sin(perp)*tl;
    const rx1 = x2 - Math.cos(perp)*tl, ry1 = y2 - Math.sin(perp)*tl;
    const rx2 = x2 + Math.cos(perp)*tl, ry2 = y2 + Math.sin(perp)*tl;
    return (
      <g key={i}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={color} strokeWidth={2}/>
        <line x1={rx1} y1={ry1} x2={rx2} y2={ry2} stroke={color} strokeWidth={2}/>
        <rect x={mx+offX-28} y={my-offY-12} width={56} height={24} rx={4} fill="rgba(255,255,255,0.97)" stroke={color} strokeWidth={1.5}/>
        <text x={mx+offX} y={my-offY+4} textAnchor="middle" fontSize={11} fontWeight="800"
          fontFamily={FM} fill={color}>{text}</text>
        <circle cx={x1} cy={y1} r={4} fill={color}/>
        <circle cx={x2} cy={y2} r={4} fill={color}/>
      </g>
    );
  };

  const confirmMeasure = () => {
    if (!measureModal || !measureVal.trim()) { setMeasureModal(null); return; }
    const col = "#3B7FE0";
    const newQ = { ...measureModal, text: measureVal.trim(), color: col };
    setQuotes(prev => [...prev, newQ]);
    // Prova ad estrarre L e H automaticamente
    const val = parseInt(measureVal.replace(/[^0-9]/g, ""));
    if (val > 0) {
      const dx = Math.abs(measureModal.x2 - measureModal.x1);
      const dy = Math.abs(measureModal.y2 - measureModal.y1);
      if (dx > dy) setExtractedL(val);
      else setExtractedH(val);
    }
    setMeasureModal(null); setMeasureVal("");
  };

  const handleSave = () => {
    if (extractedL && extractedH) {
      onSaveMisure?.(extractedL, extractedH);
    }
    setSaved(true);
    setTimeout(() => onClose?.(), 300);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setQuotes([]);
    setExtractedL(null);
    setExtractedH(null);
  };

  const QUICK = ["L","H","Sp","mm"];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#fff",
      display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"center", gap:10,
        padding:"10px 14px", background:Tc.card, borderBottom:`1px solid ${Tc.bdr}`,
        flexShrink:0 }}>
        <div onClick={onClose} style={{ padding:4, cursor:"pointer",
          display:"flex", alignItems:"center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={Tc.sub} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <span style={{ flex:1, fontSize:15, fontWeight:800, color:Tc.text }}>
          Schizzo vano
        </span>
        {(extractedL||extractedH) && (
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {extractedL && <span style={{ fontSize:11, fontFamily:FM, fontWeight:700,
              color:Tc.grn, background:Tc.grn+"15", padding:"3px 8px", borderRadius:6 }}>
              L={extractedL}
            </span>}
            {extractedH && <span style={{ fontSize:11, fontFamily:FM, fontWeight:700,
              color:Tc.blue, background:Tc.blue+"15", padding:"3px 8px", borderRadius:6 }}>
              H={extractedH}
            </span>}
          </div>
        )}
        <div onClick={clearCanvas} style={{ padding:"6px 10px", borderRadius:8,
          background:Tc.bg, border:`1px solid ${Tc.bdr}`,
          fontSize:11, fontWeight:600, color:Tc.sub, cursor:"pointer" }}>
          Pulisci
        </div>
        <div onClick={handleSave} style={{ padding:"8px 16px", borderRadius:8,
          background:Tc.grn, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer" }}>
          Salva
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ padding:"8px 14px", borderBottom:`1px solid ${Tc.bdr}`,
        display:"flex", alignItems:"center", gap:6, flexShrink:0, background:Tc.bg,
        flexWrap:"wrap" }}>

        {/* Strumenti */}
        {[
          { id:"pen", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>, label:"Pennino" },
          { id:"quote", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="21" x2="21" y2="3"/><path d="M3 9V3h6"/><path d="M21 15v6h-6"/></svg>, label:"Quota" },
          { id:"eraser", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 20H7L3 16l10-10 7 7-3 3"/><path d="M6.5 17.5l3-3"/></svg>, label:"Gomma" },
        ].map(({ id, icon, label }) => (
          <div key={id} onClick={() => setTool(id as any)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              padding:"6px 10px", borderRadius:8, cursor:"pointer", minWidth:48,
              background: tool===id ? Tc.acc+"20" : Tc.card,
              border:`1.5px solid ${tool===id ? Tc.acc : Tc.bdr}`,
              color: tool===id ? Tc.acc : Tc.sub }}>
            {icon}
            <span style={{ fontSize:8, fontWeight:700 }}>{label}</span>
          </div>
        ))}

        <div style={{ width:1, height:28, background:Tc.bdr, margin:"0 2px" }}/>

        {/* Colori */}
        {PEN_COLORS.map(c => (
          <div key={c} onClick={() => { setPenColor(c); setTool("pen"); }}
            style={{ width:22, height:22, borderRadius:11, background:c, cursor:"pointer",
              border: penColor===c && tool==="pen"
                ? `3px solid ${Tc.acc}` : "2px solid transparent",
              boxShadow: penColor===c && tool==="pen" ? `0 0 6px ${c}60` : "none" }} />
        ))}

        <div style={{ width:1, height:28, background:Tc.bdr, margin:"0 2px" }}/>

        {/* Spessori */}
        {[2,4,6,8].map(s => (
          <div key={s} onClick={() => setPenSize(s)}
            style={{ width:24, height:24, borderRadius:6, cursor:"pointer",
              background: penSize===s ? Tc.acc+"20" : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:s, height:s, borderRadius:"50%",
              background: penSize===s ? Tc.acc : Tc.sub }} />
          </div>
        ))}
      </div>

      {/* Hint strumento quota */}
      {tool === "quote" && (
        <div style={{ padding:"6px 14px", background:"#EFF6FF",
          borderBottom:`1px solid #DBEAFE`, fontSize:11, color:"#1D4ED8", fontWeight:600 }}>
          Trascina da un punto all'altro per aggiungere una quota con misura
        </div>
      )}

      {/* CANVAS + SVG overlay */}
      <div ref={containerRef} style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <canvas ref={canvasRef} width={CW} height={CH}
          style={{ display:"block", width:"100%", height:"100%",
            cursor: tool==="eraser" ? "cell" : tool==="quote" ? "crosshair" : "default",
            background:"#fff", touchAction:"none" }}
        />
        {/* Overlay SVG per quote */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%",
          pointerEvents:"none", overflow:"visible" }}
          viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none">
          {quotes.map((q, i) => drawQuoteSVG(q, i))}
        </svg>
      </div>

      {/* MODAL MISURA */}
      {measureModal && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:30,
          background:"#141414", borderRadius:"20px 20px 0 0",
          padding:"12px 16px 28px", boxShadow:"0 -8px 40px rgba(0,0,0,0.5)" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"#2a2a2a", margin:"0 auto 12px" }}/>
          <div style={{ fontSize:11, color:"#555", fontWeight:700, textTransform:"uppercase",
            textAlign:"center", marginBottom:10, letterSpacing:0.5 }}>Inserisci misura</div>
          {/* Prefissi */}
          <div style={{ display:"flex", gap:5, marginBottom:10, justifyContent:"center" }}>
            {QUICK.map(q => (
              <div key={q} onClick={() => {
                if (q==="mm") setMeasureVal(v => v.replace(/ mm$/,"")+" mm");
                else setMeasureVal(v => q+":"+(v.replace(/^[A-ZØa-z]+:/,"")));
              }} style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,255,255,0.08)",
                border:"1px solid #2a2a2a", color:"#888", fontSize:12, fontWeight:700,
                cursor:"pointer", fontFamily:FM }}>{q}</div>
            ))}
          </div>
          {/* Display */}
          <div style={{ padding:"14px 16px", borderRadius:12, background:"#0a0a0a",
            border:`2px solid ${Tc.blue}`, fontSize:26, fontWeight:800, fontFamily:FM,
            color:"#fff", textAlign:"center", marginBottom:12, minHeight:56,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {measureVal || <span style={{ color:"#333" }}>es. 1200</span>}
          </div>
          {/* Numpad 3×4 */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:10 }}>
            {["1","2","3","4","5","6","7","8","9","←","0","✓"].map(d => (
              <div key={d} onClick={() => {
                if (d==="←") setMeasureVal(v => v.slice(0,-1));
                else if (d==="✓") confirmMeasure();
                else setMeasureVal(v => v+d);
              }} style={{ padding:"15px 0", borderRadius:10, textAlign:"center",
                cursor:"pointer", userSelect:"none",
                background: d==="✓" ? Tc.grn : "rgba(255,255,255,0.07)",
                color: d==="✓" ? "#fff" : d==="←" ? "#666" : "#fff",
                fontSize: d==="✓" ? 18 : 20, fontWeight:800, fontFamily:FM }}>{d}</div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div onClick={() => { setMeasureModal(null); setMeasureVal(""); }}
              style={{ flex:1, padding:"12px 0", borderRadius:10,
                background:"rgba(255,255,255,0.06)", color:"#555",
                textAlign:"center", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Solo linea
            </div>
            <div onClick={confirmMeasure}
              style={{ flex:2, padding:"12px 0", borderRadius:10,
                background:Tc.grn, color:"#fff",
                textAlign:"center", fontSize:14, fontWeight:800, cursor:"pointer" }}>
              Conferma {measureVal ? `"${measureVal}"` : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
