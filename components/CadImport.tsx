'use client';

import React, { useState, useCallback, useRef } from 'react';
import type {
  CadImportResult, CadEntity, BoundingBox, Point,
} from '@/lib/cad/types';

const T = {
  bg: '#F2F1EC', card: '#FFFFFF', bdr: '#E0DED8', text: '#1A1A1C',
  sub: '#6B6B70', acc: '#D08008', grn: '#1A9E73', red: '#DC4444', blu: '#3B7FE0',
  ff: "'Inter', system-ui, sans-serif", fm: "'JetBrains Mono', 'Fira Mono', monospace",
};

const SVG_W = 620, SVG_H = 460, SVG_PAD = 40;

interface Transform { scale: number; dx: number; dy: number; }

function buildTransform(bounds: BoundingBox): Transform {
  const availW = SVG_W - SVG_PAD * 2, availH = SVG_H - SVG_PAD * 2;
  const scale = Math.min(bounds.width > 0 ? availW / bounds.width : 1, bounds.height > 0 ? availH / bounds.height : 1);
  return { scale, dx: SVG_PAD + (availW - bounds.width * scale) / 2, dy: SVG_PAD + (availH - bounds.height * scale) / 2 };
}

function svgX(x: number, t: Transform) { return t.dx + x * t.scale; }
function svgY(y: number, b: BoundingBox, t: Transform) { return t.dy + (b.height - y) * t.scale; }

function ptsToPath(pts: Point[], closed: boolean, b: BoundingBox, t: Transform): string {
  if (!pts.length) return '';
  let d = `M ${svgX(pts[0].x, t).toFixed(2)} ${svgY(pts[0].y, b, t).toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${svgX(pts[i].x, t).toFixed(2)} ${svgY(pts[i].y, b, t).toFixed(2)}`;
  if (closed) d += ' Z';
  return d;
}

function arcPath(cx: number, cy: number, r: number, sa: number, ea: number, b: BoundingBox, t: Transform): string {
  const saR = sa * Math.PI / 180, eaR = ea * Math.PI / 180;
  const x1 = svgX(cx + r * Math.cos(saR), t), y1 = svgY(cy + r * Math.sin(saR), b, t);
  const x2 = svgX(cx + r * Math.cos(eaR), t), y2 = svgY(cy + r * Math.sin(eaR), b, t);
  const rPx = r * t.scale;
  let sweep = ea - sa; if (sweep < 0) sweep += 360;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rPx.toFixed(2)} ${rPx.toFixed(2)} 0 ${sweep > 180 ? 1 : 0} 0 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const LAYER_PALETTE = ['#1A1A1C','#3B7FE0','#DC4444','#1A9E73','#D08008','#8B5CF6','#0891B2'];
const lcCache = new Map<string, string>();
function layerColor(layer: string): string {
  if (!lcCache.has(layer)) { let h = 0; for (const c of layer) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff; lcCache.set(layer, LAYER_PALETTE[Math.abs(h) % LAYER_PALETTE.length]); }
  return lcCache.get(layer)!;
}

function SvgPreview({ result, showSnap, showProfile, activeLayer }: { result: CadImportResult; showSnap: boolean; showProfile: boolean; activeLayer: string | null }) {
  const { model, profile, snapPoints } = result;
  const b = model.bounds, t = buildTransform(b);
  const ents: CadEntity[] = activeLayer ? model.entities.filter(e => ('layer' in e ? (e as any).layer === activeLayer : true)) : model.entities;
  const qY = SVG_H - 14, qX = 14;
  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block', background: '#FFFFFF', borderRadius: 6, border: `1px solid ${T.bdr}` }}>
      <defs>
        <pattern id="cadgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#F0EFEA" strokeWidth="0.8"/></pattern>
        <marker id="arrR" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill={T.acc}/></marker>
        <marker id="arrL" markerWidth="5" markerHeight="5" refX="1" refY="2.5" orient="auto"><polygon points="5,0 0,2.5 5,5" fill={T.acc}/></marker>
        <marker id="arrU" markerWidth="5" markerHeight="5" refX="2.5" refY="1" orient="auto"><polygon points="0,5 2.5,0 5,5" fill={T.acc}/></marker>
        <marker id="arrD" markerWidth="5" markerHeight="5" refX="2.5" refY="4" orient="auto"><polygon points="0,0 2.5,5 5,0" fill={T.acc}/></marker>
      </defs>
      <rect width={SVG_W} height={SVG_H} fill="url(#cadgrid)"/>
      <rect x={svgX(0,t)} y={svgY(b.height,b,t)} width={b.width*t.scale} height={b.height*t.scale} fill="none" stroke="#DDD" strokeWidth={0.6} strokeDasharray="4,3"/>
      <g strokeLinecap="round" strokeLinejoin="round">
        {ents.map((e, i) => {
          const s = layerColor(('layer' in e ? (e as any).layer : undefined) ?? '0');
          switch (e.type) {
            case 'LINE': return <line key={i} x1={svgX(e.x1,t)} y1={svgY(e.y1,b,t)} x2={svgX(e.x2,t)} y2={svgY(e.y2,b,t)} stroke={s} strokeWidth={0.9}/>;
            case 'POLYLINE': return <path key={i} d={ptsToPath(e.points,e.closed,b,t)} fill="none" stroke={s} strokeWidth={0.9}/>;
            case 'ARC': return <path key={i} d={arcPath(e.cx,e.cy,e.r,e.startAngle,e.endAngle,b,t)} fill="none" stroke={s} strokeWidth={0.9}/>;
            case 'CIRCLE': return <circle key={i} cx={svgX(e.cx,t)} cy={svgY(e.cy,b,t)} r={e.r*t.scale} fill="none" stroke={s} strokeWidth={0.9}/>;
            case 'TEXT': return <text key={i} x={svgX(e.x,t)} y={svgY(e.y,b,t)} fontSize={Math.min(Math.max(e.height*t.scale,7),13)} fill={s} fontFamily={T.fm} opacity={0.55}>{e.text.slice(0,50)}</text>;
            default: return null;
          }
        })}
      </g>
      {showProfile && profile && (
        <g>
          <path d={ptsToPath(profile.outer,true,b,t)} fill={`${T.blu}10`} stroke={T.blu} strokeWidth={2} strokeLinejoin="round"/>
          {profile.holes.map((hole,hi) => <path key={hi} d={ptsToPath(hole,true,b,t)} fill={`${T.red}08`} stroke={T.red} strokeWidth={1.2} strokeDasharray="4,2" strokeLinejoin="round"/>)}
        </g>
      )}
      {showSnap && snapPoints.slice(0,600).map((sp,i) => {
        const sx=svgX(sp.x,t), sy=svgY(sp.y,b,t);
        if (sp.kind==='corner') return <rect key={i} x={sx-2.5} y={sy-2.5} width={5} height={5} fill={T.blu} opacity={0.75}/>;
        if (sp.kind==='mid') return <circle key={i} cx={sx} cy={sy} r={2.5} fill={T.grn} opacity={0.75}/>;
        return <circle key={i} cx={sx} cy={sy} r={3.5} fill="none" stroke={T.acc} strokeWidth={1} opacity={0.75}/>;
      })}
      <g stroke={T.acc} fill={T.acc} fontSize={10} fontFamily={T.fm}>
        <line x1={svgX(0,t)} y1={qY-6} x2={svgX(b.width,t)} y2={qY-6} strokeWidth={0.8} markerStart="url(#arrL)" markerEnd="url(#arrR)"/>
        <text x={SVG_W/2} y={qY+4} textAnchor="middle" fontSize={10}>{b.width.toFixed(2)} mm</text>
        <line x1={qX+6} y1={svgY(0,b,t)} x2={qX+6} y2={svgY(b.height,b,t)} strokeWidth={0.8} markerStart="url(#arrD)" markerEnd="url(#arrU)"/>
        <text x={qX-2} y={SVG_H/2} textAnchor="middle" fontSize={10} transform={`rotate(-90 ${qX-2} ${SVG_H/2})`}>{b.height.toFixed(2)} mm</text>
      </g>
    </svg>
  );
}

type ImportStatus = 'idle'|'loading'|'success'|'error';

export interface CadImportProps {
  onImport?: (result: CadImportResult, file: File) => void;
  style?: React.CSSProperties;
  compact?: boolean;
}

export default function CadImport({ onImport, style, compact=false }: CadImportProps) {
  const [status, setStatus]           = useState<ImportStatus>('idle');
  const [result, setResult]           = useState<CadImportResult|null>(null);
  const [errorMsg, setErrorMsg]       = useState('');
  const [dragOver, setDragOver]       = useState(false);
  const [showSnap, setShowSnap]       = useState(false);
  const [showProfile, setShowProfile] = useState(true);
  const [activeLayer, setActiveLayer] = useState<string|null>(null);
  const [fileName, setFileName]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'dxf') { setErrorMsg(`Formato non supportato: .${ext}. Carica un .dxf`); setStatus('error'); return; }
    setFileName(file.name); setStatus('loading'); setErrorMsg(''); setResult(null); setActiveLayer(null);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch('/api/cad/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult(data as CadImportResult); setStatus('success'); onImport?.(data as CadImportResult, file);
    } catch (err) { setErrorMsg(err instanceof Error ? err.message : String(err)); setStatus('error'); }
  }, [onImport]);

  return (
    <div style={{ fontFamily: T.ff, color: T.text, ...style }}>
      <div role="button" tabIndex={0} onClick={() => fileRef.current?.click()}
        onKeyDown={e => e.key==='Enter' && fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files?.[0]; if(f)processFile(f); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{ border:`2px dashed ${dragOver?T.blu:T.bdr}`, borderRadius:10, padding:compact?'16px 20px':'32px 20px', textAlign:'center', cursor:'pointer', background:dragOver?`${T.blu}08`:T.bg, transition:'all 0.15s', userSelect:'none' }}>
        <input ref={fileRef} type="file" accept=".dxf" style={{display:'none'}} onChange={e => { const f=e.target.files?.[0]; if(f)processFile(f); e.target.value=''; }}/>
        <div style={{fontSize:compact?20:28,marginBottom:6}}>📐</div>
        <div style={{fontSize:13,fontWeight:700,color:T.text}}>{status==='loading'?'Elaborazione DXF...':'Trascina un file DXF'}</div>
        <div style={{fontSize:11,color:T.sub,marginTop:3}}>oppure clicca per scegliere · solo .dxf · max 10 MB</div>
        {fileName && status!=='idle' && <div style={{marginTop:8,fontSize:11,color:T.blu,fontFamily:T.fm}}>{fileName}</div>}
      </div>

      {status==='loading' && (
        <div style={{marginTop:10,height:3,borderRadius:2,background:T.bdr,overflow:'hidden'}}>
          <div style={{height:'100%',width:'60%',background:T.acc,borderRadius:2,animation:'mastro-slide 1.2s ease-in-out infinite'}}/>
          <style>{`@keyframes mastro-slide{0%{transform:translateX(-80%)}100%{transform:translateX(200%)}}`}</style>
        </div>
      )}

      {status==='error' && (
        <div style={{marginTop:10,padding:'10px 14px',borderRadius:7,background:`${T.red}10`,border:`1px solid ${T.red}40`,color:T.red,fontSize:12}}>
          <strong>Errore: </strong>{errorMsg}
        </div>
      )}

      {status==='success' && result && (
        <div style={{marginTop:14}}>
          {result.warnings.length>0 && (
            <div style={{padding:'8px 12px',borderRadius:7,marginBottom:10,background:`${T.acc}12`,border:`1px solid ${T.acc}40`,fontSize:11,color:T.acc}}>
              {result.warnings.map((w,i)=><div key={i}>⚠ {w}</div>)}
            </div>
          )}
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
            {[
              {label:'Entità',value:result.model.entityCount,color:T.text},
              {label:'Layer',value:result.model.layers.length,color:T.blu},
              {label:'Snap',value:result.snapPoints.length,color:T.grn},
              {label:'L',value:`${result.model.bounds.width.toFixed(1)} mm`,color:T.acc},
              {label:'H',value:`${result.model.bounds.height.toFixed(1)} mm`,color:T.acc},
              ...(result.profile?[{label:'Camere',value:result.profile.holes.length,color:T.red},{label:'Bautiefe',value:`${result.profile.thickness?.toFixed(1)} mm`,color:T.blu}]:[]),
            ].map(({label,value,color})=>(
              <div key={label} style={{padding:'4px 10px',borderRadius:20,background:T.card,border:`1px solid ${T.bdr}`,fontSize:11,display:'flex',gap:5,alignItems:'center'}}>
                <span style={{color:T.sub}}>{label}</span><strong style={{color}}>{value}</strong>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
            {[{active:showProfile,onClick:()=>setShowProfile(v=>!v),color:T.blu,label:'Profilo'},{active:showSnap,onClick:()=>setShowSnap(v=>!v),color:T.grn,label:'Snap'}].map(({active,onClick,color,label})=>(
              <button key={label} onClick={onClick} style={{padding:'4px 12px',borderRadius:20,cursor:'pointer',fontSize:11,fontFamily:T.ff,fontWeight:active?700:400,border:`1px solid ${active?color:T.bdr}`,background:active?`${color}15`:T.card,color:active?color:T.sub}}>
                {label}
              </button>
            ))}
            <select value={activeLayer??''} onChange={e=>setActiveLayer(e.target.value||null)} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${T.bdr}`,fontSize:11,fontFamily:T.fm,background:T.card,color:T.text,cursor:'pointer'}}>
              <option value="">Tutti i layer</option>
              {result.model.layers.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <SvgPreview result={result} showSnap={showSnap} showProfile={showProfile} activeLayer={activeLayer}/>
          <div style={{display:'flex',gap:16,marginTop:8,fontSize:10,color:T.sub}}>
            <span><span style={{color:T.blu,fontWeight:700}}>■</span> Corner</span>
            <span><span style={{color:T.grn,fontWeight:700}}>●</span> Midpoint</span>
            <span><span style={{color:T.acc,fontWeight:700}}>○</span> Intersezione</span>
            {result.profile&&<><span><span style={{color:T.blu}}>━━</span> Outer</span><span><span style={{color:T.red}}>╌╌</span> Camera</span></>}
          </div>
        </div>
      )}
    </div>
  );
}
