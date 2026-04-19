"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — renderer_svg.tsx v3.0
// Rendering ricorsivo celle + simboli tecnici reali
// Maniglia martellina reale, cerniere a vista, spessore anta
// ═══════════════════════════════════════════════════════════════
import React from "react";

const AMBER="#D08008"; const DARK="#1A1A1C"; const TEAL="#1A9E73";
const VETRO_FILL="rgba(186,214,232,0.28)";
const VETRO_STROKE="rgba(100,160,200,0.45)";
const FERMAVETRO="#4B5563";
const PROFILO_TELAIO="#A0A8B0";
const PROFILO_ANTA="#C8CDD2";
const FM="JetBrains Mono,monospace";

// ── MANIGLIA MARTELLINA (DK handle) ─────────────────────────
function ManigliaMartellina({x,y,w,h,verso}:any) {
  // Posizione: lato opposto al cardine, a 1/3 dall'alto
  const mx = verso==="sx" ? x+w-22 : x+22;
  const cy = y + h*0.42;
  const dir = verso==="sx" ? -1 : 1;
  return (
    <g fill={PROFILO_TELAIO} stroke={DARK} strokeWidth="0.8" opacity="0.9">
      {/* Rosetta ovale */}
      <ellipse cx={mx} cy={cy} rx={7} ry={11} fill="#C8CDD2"/>
      {/* Stelo verticale */}
      <rect x={mx-3} y={cy+8} width={6} height={22} rx={3} fill="#A0A8B0"/>
      {/* Braccio impugnatura */}
      <path d={`M ${mx} ${cy+14} Q ${mx+dir*18} ${cy+14} ${mx+dir*18} ${cy+28}`}
        fill="none" stroke={DARK} strokeWidth="5" strokeLinecap="round"/>
      {/* Pomello */}
      <circle cx={mx+dir*18} cy={cy+28} r={5} fill="#888"/>
    </g>
  );
}

// ── CERNIERE A VISTA ─────────────────────────────────────────
function CerniereVista({x,y,w,h,nCerniere,verso}:any) {
  const cx = verso==="sx" ? x+8 : x+w-8;
  const positions = nCerniere===3
    ? [y+h*0.15, y+h*0.5, y+h*0.85]
    : [y+h*0.2, y+h*0.8];
  return (
    <g>
      {positions.map((py,i)=>(
        <g key={i} fill={PROFILO_ANTA} stroke={DARK} strokeWidth="0.8" opacity="0.85">
          {/* Ala fissa (sul telaio) */}
          <rect x={verso==="sx"?cx-12:cx-2} y={py-14} width={14} height={28} rx={2}/>
          {/* Ala mobile (sull'anta) */}
          <rect x={verso==="sx"?cx-2:cx-12} y={py-12} width={14} height={24} rx={2}
            fill={PROFILO_TELAIO}/>
          {/* Perno centrale */}
          <circle cx={cx} cy={py} r={3.5} fill="#666" stroke="#333" strokeWidth="0.5"/>
          {/* Viti fissaggio */}
          <circle cx={verso==="sx"?cx-6:cx+6} cy={py-7} r={1.5} fill="#888"/>
          <circle cx={verso==="sx"?cx-6:cx+6} cy={py+7} r={1.5} fill="#888"/>
        </g>
      ))}
    </g>
  );
}

// ── LINEE APERTURA STANDARD UNI ──────────────────────────────
function SimboloApertura({x,y,w,h,tipo,verso,stroke}:any) {
  const s = stroke; const da="20 8";
  switch(tipo) {
    case "anta_battente":
      return verso==="sx"
        ? <g stroke={s} fill="none" strokeWidth="1.5" strokeDasharray={da} opacity="0.6">
            <line x1={x} y1={y} x2={x+w} y2={y+h/2}/>
            <line x1={x} y1={y+h} x2={x+w} y2={y+h/2}/>
            <line x1={x} y1={y} x2={x} y2={y+h} strokeWidth="2.5" strokeDasharray="none"/>
          </g>
        : <g stroke={s} fill="none" strokeWidth="1.5" strokeDasharray={da} opacity="0.6">
            <line x1={x+w} y1={y} x2={x} y2={y+h/2}/>
            <line x1={x+w} y1={y+h} x2={x} y2={y+h/2}/>
            <line x1={x+w} y1={y} x2={x+w} y2={y+h} strokeWidth="2.5" strokeDasharray="none"/>
          </g>;
    case "anta_ribalta":
      return <g stroke={s} fill="none" strokeWidth="1.5" strokeDasharray={da} opacity="0.6">
        {verso==="sx"
          ? <><line x1={x} y1={y} x2={x+w} y2={y+h/2}/><line x1={x} y1={y+h} x2={x+w} y2={y+h/2}/><line x1={x} y1={y} x2={x} y2={y+h} strokeWidth="2.5" strokeDasharray="none"/></>
          : <><line x1={x+w} y1={y} x2={x} y2={y+h/2}/><line x1={x+w} y1={y+h} x2={x} y2={y+h/2}/><line x1={x+w} y1={y} x2={x+w} y2={y+h} strokeWidth="2.5" strokeDasharray="none"/></>
        }
        <line x1={x} y1={y+h} x2={x+w/2} y2={y+h*0.65}/>
        <line x1={x+w} y1={y+h} x2={x+w/2} y2={y+h*0.65}/>
        <line x1={x} y1={y+h} x2={x+w} y2={y+h} strokeWidth="2.5" strokeDasharray="none"/>
      </g>;
    case "wasistas":
      return <g stroke={s} fill="none" strokeWidth="1.5" strokeDasharray={da} opacity="0.6">
        <line x1={x} y1={y} x2={x+w/2} y2={y+h*0.55}/>
        <line x1={x+w} y1={y} x2={x+w/2} y2={y+h*0.55}/>
        <line x1={x} y1={y} x2={x+w} y2={y} strokeWidth="2.5" strokeDasharray="none"/>
      </g>;
    case "porta":
      return <g stroke={s} fill="none" opacity="0.7">
        <line x1={x} y1={y+h} x2={x+w} y2={y+h} strokeWidth="3"/>
        {verso==="sx"
          ? <><path d={`M ${x} ${y+h} A ${w*0.9} ${w*0.9} 0 0 1 ${x+w} ${y+h-w*0.9}`} strokeWidth="1.5" strokeDasharray={da}/><line x1={x} y1={y} x2={x} y2={y+h} strokeWidth="2" strokeDasharray="none"/></>
          : <><path d={`M ${x+w} ${y+h} A ${w*0.9} ${w*0.9} 0 0 0 ${x} ${y+h-w*0.9}`} strokeWidth="1.5" strokeDasharray={da}/><line x1={x+w} y1={y} x2={x+w} y2={y+h} strokeWidth="2" strokeDasharray="none"/></>
        }
      </g>;
    case "scorrevole":
      return <g stroke={s} fill="none" opacity="0.7">
        <rect x={x+w*0.08} y={y+3} width={w*0.42} height={h-6} strokeDasharray="12 5" strokeWidth="1.5"/>
        <line x1={x+8} y1={y+h/2} x2={x+w-8} y2={y+h/2} strokeWidth="2"/>
        <polyline points={`${x+22},${y+h/2-14} ${x+8},${y+h/2} ${x+22},${y+h/2+14}`} strokeWidth="2"/>
        <polyline points={`${x+w-22},${y+h/2-14} ${x+w-8},${y+h/2} ${x+w-22},${y+h/2+14}`} strokeWidth="2"/>
      </g>;
    case "pannello_cieco":
      return <g stroke={s} strokeWidth="1" opacity="0.2">
        <line x1={x} y1={y} x2={x+w} y2={y+h}/>
        <line x1={x+w} y1={y} x2={x} y2={y+h}/>
      </g>;
    default: return null;
  }
}

// ── RENDER SINGOLA CELLA (ricorsivo) ─────────────────────────
function RenderCella({c, gx, gy, sp, isMkt, cellaSel, onCellaClick, setDragging}:any) {
  const gw = c.larghezzaNetta;
  const gh = c.altezzaNetta;
  const isSel = cellaSel===c.id;
  const stroke = isMkt?AMBER:DARK;
  const hasChildren = c.subCelle && c.subCelle.length>0;

  // Spessore anta = ~80% spessore telaio
  const spAnta = Math.round(sp*0.80);
  const isMobile = !["fisso","pannello_cieco"].includes(c.tipo);

  return (
    <g>
      {/* Fondo cella — profilo anta se mobile */}
      <rect x={gx} y={gy} width={gw} height={gh}
        fill={isMobile?PROFILO_ANTA:PROFILO_TELAIO}
        stroke={isSel?AMBER:stroke} strokeWidth={isSel?3:1} strokeOpacity={isSel?1:0.4}
        style={{cursor:"pointer"}}
          onContextMenu={(e)=>{e.preventDefault();e.stopPropagation();onCellaContextMenu?.(c.id,e.clientX,e.clientY);}}/>

      {/* Profilo anta visibile (spessore ridotto) */}
      {isMobile && (
        <rect x={gx+spAnta} y={gy+spAnta} width={gw-spAnta*2} height={gh-spAnta*2}
          fill={VETRO_FILL} stroke={VETRO_STROKE} strokeWidth="1"/>
      )}

      {/* Vetro per fisso */}
      {!isMobile && c.tipo!=="pannello_cieco" && (
        <rect x={gx+Math.round(sp*0.35)} y={gy+Math.round(sp*0.35)}
          width={gw-Math.round(sp*0.7)} height={gh-Math.round(sp*0.7)}
          fill={VETRO_FILL} stroke={VETRO_STROKE} strokeWidth="1"/>
      )}

      {/* Sub-montanti */}
      {c.subMontanti?.map((m:any)=>(
        <rect key={m.id}
          x={gx+m.xMmRel-sp/2} y={gy} width={sp} height={gh}
          fill={isMkt?AMBER:PROFILO_TELAIO} stroke={stroke} strokeWidth={1}
          style={{cursor:"ew-resize"}}
          onMouseDown={()=>setDragging?.({id:m.id,type:"sm",cellaId:c.id})}/>
      ))}

      {/* Sub-traversi */}
      {c.subTraversi?.map((t:any)=>(
        <rect key={t.id}
          x={gx} y={gy+t.yMmRel-sp/2} width={gw} height={sp}
          fill={isMkt?AMBER:PROFILO_TELAIO} stroke={stroke} strokeWidth={1}
          style={{cursor:"ns-resize"}}
          onMouseDown={()=>setDragging?.({id:t.id,type:"st",cellaId:c.id})}/>
      ))}

      {/* Sub-celle ricorsive */}
      {hasChildren && c.subCelle.map((sc:any)=>{
        const xPts = [0,...c.subMontanti.map((m:any)=>m.xMmRel).sort((a:number,b:number)=>a-b),gw];
        const yPts = [0,...c.subTraversi.map((t:any)=>t.yMmRel).sort((a:number,b:number)=>a-b),gh];
        const spSx = sc.colIdx===0?0:sp/2;
        const spTop= sc.rowIdx===0?0:sp/2;
        const sgx = gx + xPts[sc.colIdx] + spSx;
        const sgy = gy + yPts[sc.rowIdx] + spTop;
        return (
          <RenderCella key={sc.id} c={sc} gx={sgx} gy={sgy}
            sp={sp} isMkt={isMkt} cellaSel={cellaSel}
            onCellaClick={onCellaClick} setDragging={setDragging}/>
        );
      })}

      {/* Simbolo apertura (solo foglie) */}
      {!hasChildren && (
        <SimboloApertura x={isMobile?gx+spAnta:gx} y={isMobile?gy+spAnta:gy}
          w={isMobile?gw-spAnta*2:gw} h={isMobile?gh-spAnta*2:gh}
          tipo={c.tipo} verso={c.verso} stroke={isMkt?AMBER:DARK}/>
      )}

      {/* Maniglia martellina */}
      {!hasChildren && isMobile && c.ferramenta?.maniglia && (
        <ManigliaMartellina x={isMobile?gx+spAnta:gx} y={isMobile?gy+spAnta:gy}
          w={isMobile?gw-spAnta*2:gw} h={isMobile?gh-spAnta*2:gh} verso={c.verso}/>
      )}

      {/* Cerniere a vista */}
      {!hasChildren && ["anta_battente","anta_ribalta","porta"].includes(c.tipo) && (
        <CerniereVista x={gx} y={gy} w={gw} h={gh}
          nCerniere={c.ferramenta?.nCerniere||2} verso={c.verso}/>
      )}

      {/* Quote interne (solo modalità tecnica, celle foglia) */}
      {!hasChildren && !isMkt && (()=>{
        const fs = Math.min(26,Math.max(12,gw/14));
        return (
          <g opacity="0.4" fontFamily={FM} style={{pointerEvents:"none"}}>
            <text x={gx+gw/2} y={gy+gh/2-fs*0.5} textAnchor="middle" fontSize={fs} fontWeight="700" fill={DARK}>{c.larghezzaNetta}</text>
            <text x={gx+gw/2} y={gy+gh/2+fs*1.0} textAnchor="middle" fontSize={fs*0.85} fill={TEAL}>×{c.altezzaNetta}</text>
            <text x={gx+gw/2} y={gy+gh/2+fs*2.2} textAnchor="middle" fontSize={fs*0.65} fill={DARK}>{c.tipo.replace(/_/g," ")}</text>
          </g>
        );
      })()}

      {/* Highlight selezione */}
      {isSel && <rect x={gx} y={gy} width={gw} height={gh}
        fill={AMBER} fillOpacity="0.07" stroke="none"
        style={{pointerEvents:"none"}}/>}

      {/* Click area trasparente sopra tutto */}
      <rect x={gx} y={gy} width={gw} height={gh} fill="transparent" stroke="none"
        style={{cursor:"pointer"}}
        onClick={(e)=>{e.stopPropagation();onCellaClick?.(c.id);}}
        onMouseDown={(e)=>e.stopPropagation()}/>
    </g>
  );
}

// ── QUOTE STRUTTURA ──────────────────────────────────────────
function QuoteStruttura({xPunti,yPunti,sp,L,H,stroke}:any) {
  const els:any[]=[];
  for(let i=0;i<xPunti.length-1;i++){
    const x0=xPunti[i]+(i>0?sp/2:0);
    const x1=xPunti[i+1]-(i<xPunti.length-2?sp/2:0);
    const w=Math.round(x1-x0);
    els.push(<g key={`qx${i}`} opacity="0.55">
      <path d={`M ${x0} -45 H ${x1}`} stroke={stroke} strokeWidth="2.5"
        markerStart="url(#arr-cad)" markerEnd="url(#arr-cad)"/>
      <text x={(x0+x1)/2} y={-58} textAnchor="middle" fontSize="20" fill={stroke} fontFamily={FM}>{w}</text>
    </g>);
  }
  for(let i=0;i<yPunti.length-1;i++){
    const y0=yPunti[i]+(i>0?sp/2:0);
    const y1=yPunti[i+1]-(i<yPunti.length-2?sp/2:0);
    const h=Math.round(y1-y0);
    els.push(<g key={`qy${i}`} opacity="0.55">
      <path d={`M ${L+45} ${y0} V ${y1}`} stroke={stroke} strokeWidth="2.5"
        markerStart="url(#arr-cad)" markerEnd="url(#arr-cad)"/>
      <text x={L+70} y={(y0+y1)/2+7} textAnchor="start" fontSize="20" fill={stroke} fontFamily={FM}>{h}</text>
    </g>);
  }
  return <>{els}</>;
}

// ── RENDERER PRINCIPALE ───────────────────────────────────────
export function RendererSVG({infisso,width="90%",height="90%",onCellaClick,onCellaContextMenu,svgRef,setDragging}:any) {
  const {larghezzaVano:L,altezzaVano:H,sistema,montanti,traversi,griglia} = infisso;
  const sp = sistema.spessoreTelaio;
  const isMkt = infisso._mode==="marketing";
  const stroke = isMkt?AMBER:DARK;
  const strokeW = isMkt?5:2.5;

  return (
    <svg ref={svgRef} width={width} height={height}
      viewBox={`-240 -300 ${L+480} ${H+600}`}
      preserveAspectRatio="xMidYMid meet"
      style={{display:"block"}}>

      <defs>
        <marker id="arr-cad" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill={stroke}/>
        </marker>
      </defs>

      {/* Telaio esterno */}
      <rect x={0} y={0} width={L} height={H}
        fill={isMkt?"#111":PROFILO_TELAIO} stroke={stroke} strokeWidth={strokeW}/>
      {/* Luce interna telaio */}
      <rect x={sp} y={sp} width={L-sp*2} height={H-sp*2}
        fill="none" stroke={stroke} strokeWidth={strokeW*0.5} opacity="0.35"/>
      {/* Smussi angoli */}
      {[[0,0,sp,sp],[L,0,L-sp,sp],[0,H,sp,H-sp],[L,H,L-sp,H-sp]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={strokeW*0.6}/>
      ))}

      {/* Montanti globali */}
      {montanti.map((m:any)=>(
        <g key={m.id}>
          <rect x={m.xMm-sp/2} y={sp} width={sp} height={H-sp*2}
            fill={isMkt?AMBER:PROFILO_TELAIO} stroke={stroke} strokeWidth={1}
            style={{cursor:"ew-resize"}}
            onMouseDown={()=>setDragging?.({id:m.id,type:"m"})}/>
          <line x1={m.xMm} y1={sp} x2={m.xMm} y2={H-sp}
            stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="3 3"/>
        </g>
      ))}

      {/* Traversi globali */}
      {traversi.map((t:any)=>(
        <g key={t.id}>
          <rect x={sp} y={t.yMm-sp/2} width={L-sp*2} height={sp}
            fill={isMkt?AMBER:PROFILO_TELAIO} stroke={stroke} strokeWidth={1}
            style={{cursor:"ns-resize"}}
            onMouseDown={()=>setDragging?.({id:t.id,type:"t"})}/>
          <line x1={sp} y1={t.yMm} x2={L-sp} y2={t.yMm}
            stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="3 3"/>
        </g>
      ))}

      {/* Celle (ricorsive) */}
      {griglia.celle.map((c:any)=>{
        const gx = griglia.xPunti[c.colIdx] + (c.colIdx>0?sp/2:0);
        // _colYStart: posizione assoluta dello slot (per celle con traversi locali)
        const gy = c._colYStart !== undefined
          ? c._colYStart + (c._colYStart > sp ? sp/2 : 0)
          : griglia.yPunti[c.rowIdx] + (c.rowIdx>0?sp/2:0);
        return (
          <RenderCella key={c.id} c={c} gx={gx} gy={gy}
            sp={sp} isMkt={isMkt}
            cellaSel={infisso._cellaSel}
            onCellaClick={onCellaClick}
            setDragging={setDragging}/>
        );
      })}

      {/* Quote struttura */}
      {!isMkt && (
        <QuoteStruttura
          xPunti={griglia.xPunti} yPunti={griglia.yPunti}
          sp={sp} L={L} H={H} stroke={AMBER}/>
      )}

      {/* Quote esterne principali */}
      <g>
        <text x={L/2} y={-165} textAnchor="middle" fontSize="150" fontWeight="900" fill={stroke} fontFamily={FM}>{L} mm</text>
        <path d={`M 0 -115 H ${L}`} stroke={stroke} strokeWidth="7"
          markerStart="url(#arr-cad)" markerEnd="url(#arr-cad)"/>
      </g>
      <g>
        <text x={-210} y={H/2} textAnchor="middle" fontSize="150" fontWeight="900" fill={stroke} fontFamily={FM}
          transform={`rotate(-90,-210,${H/2})`}>{H} mm</text>
        <path d={`M -155 0 V ${H}`} stroke={stroke} strokeWidth="7"
          markerStart="url(#arr-cad)" markerEnd="url(#arr-cad)"/>
      </g>
    </svg>
  );
}
