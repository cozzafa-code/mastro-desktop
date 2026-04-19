"use client";
// @ts-nocheck
// MASTRO — DesktopSettings v2
// Sidebar nav + archivi completi: Profili, Vetri, Accessori, Colori

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73",DARK="#1A1A1C",RED="#DC4444",AMB="#D08008",BLU="#3B7FE0",PUR="#8B5CF6",ORG="#F97316";

const NAV=[
  { group:"Azienda", items:[
    {id:"generali",   label:"Generali",      icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"},
    {id:"team",       label:"Team",          icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"},
    {id:"squadre",    label:"Squadre",       icon:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"},
    {id:"piano",      label:"Piano",         icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"},
  ]},
  { group:"Archivi", items:[
    {id:"profili",    label:"Profili",       icon:"M4 6h16M4 10h16M4 14h16M4 18h16"},
    {id:"nodi",       label:"Nodi",          icon:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"},
    {id:"vetri",      label:"Vetri",         icon:"M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"},
    {id:"accessori",  label:"Accessori",     icon:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"},
    {id:"colori",     label:"Colori RAL",    icon:"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"},
    {id:"coprifili",  label:"Coprifili",     icon:"M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"},
    {id:"lamiere",    label:"Lamiere",       icon:"M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"},
  ]},
  { group:"Complementari", items:[
    {id:"tapparella",    label:"Tapparelle",    icon:"M4 6h16M4 12h16M4 18h7"},
    {id:"persiana",      label:"Persiane",      icon:"M4 6h16M4 12h16M4 18h16"},
    {id:"zanzariera",    label:"Zanzariere",    icon:"M4 6h16M4 10h16M4 14h16M4 18h16"},
    {id:"controtelaio",  label:"Controtelaio",  icon:"M4 4h16v16H4zM8 4v16M16 4v16M4 8h16M4 16h16"},
    {id:"cassonetto",    label:"Cassonetti",    icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"},
  ]},
  { group:"Workflow", items:[
    {id:"pipeline",   label:"Pipeline",      icon:"M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"},
    {id:"manodopera", label:"Manodopera",    icon:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"},
    {id:"fatture",    label:"Fatture SDI",   icon:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"},
    {id:"fornitori",  label:"Fornitori",     icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"},
  ]},
  { group:"Sistema", items:[
    {id:"settore",  label:"Settore",       icon:"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"},
    {id:"importa",  label:"Importa dati",  icon:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"},
    {id:"temi",     label:"Tema",          icon:"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343"},
    {id:"reset",    label:"Reset dati",    icon:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"},
  ]},
];

const Svg=({path,s=15,c="currentColor"}:any)=>(
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}>
    {path.split(/(?=M)/).filter(Boolean).map((p:string,i:number)=><path key={i} d={p.trim()}/>)}
  </svg>
);

const badge=(bg:string,c:string,txt:string)=>(
  <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:bg,color:c,fontWeight:700,whiteSpace:"nowrap"}}>{txt}</span>
);

// ── Input/Label helpers ───────────────────────────────────────
const LBL=({children}:any)=><label style={{fontSize:11,fontWeight:700,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:4,display:"block"}}>{children}</label>;
const INP=({...p})=><input {...p} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid #E5E3DC`,fontSize:13,fontFamily:FF,background:"#F8F7F2",color:DARK,outline:"none",boxSizing:"border-box",...(p.style||{})}}/>;
const SEL=({children,...p}:any)=><select {...p} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid #E5E3DC`,fontSize:13,fontFamily:FF,background:"#F8F7F2",color:DARK,outline:"none",boxSizing:"border-box",...(p.style||{})}}>{children}</select>;

// ── Sezione container ─────────────────────────────────────────
const Sez=({title,sub="",action=null,children}:any)=>(
  <div style={{marginBottom:24}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <div>
        <div style={{fontSize:15,fontWeight:700,color:DARK}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:"#86868b",marginTop:2}}>{sub}</div>}
      </div>
      {action&&<div onClick={action.fn} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,background:TEAL,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
        <Svg path="M12 4v16m8-8H4" c="#fff" s={13}/>
        {action.label}
      </div>}
    </div>
    <div style={{background:"#fff",borderRadius:12,border:`1px solid #E5E3DC`,overflow:"hidden"}}>
      {children}
    </div>
  </div>
);

// ── Modal generico ────────────────────────────────────────────
function Modal({title,onClose,children}:any){
  return (
    <div style={{position:"fixed",inset:0,zIndex:600,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,width:640,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.18)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid #E5E3DC`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontSize:16,fontWeight:800,color:DARK}}>{title}</div>
          <div onClick={onClose} style={{width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:`1px solid #E5E3DC`,color:"#86868b",fontSize:18,lineHeight:1}}>×</div>
        </div>
        <div style={{padding:"20px 22px"}}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ARCHIVIO PROFILI v3 — master-detail + DXF viewer SVG
// ═══════════════════════════════════════════════════════════════

// ── Parser LWPOLYLINE da testo DXF ───────────────────────────
function parseLWPolylines(dxfText:string):{pts:{x:number,y:number}[],closed:boolean}[]{
  const lines=dxfText.split('\n');
  const result:{pts:{x:number,y:number}[],closed:boolean}[]=[];
  let i=0;
  while(i<lines.length){
    if(lines[i].trim()==='0'&&lines[i+1]?.trim()==='LWPOLYLINE'){
      const pts:{x:number,y:number}[]=[];let closed=false;
      let j=i+2;
      while(j<lines.length-1){
        const code=lines[j].trim(),val=lines[j+1]?.trim()||'';
        if(code==='0')break;
        if(code==='70')closed=(parseInt(val)&1)===1;
        if(code==='10'){const x=parseFloat(val);if(lines[j+2]?.trim()==='20'){const y=parseFloat(lines[j+3]?.trim()||'0');pts.push({x,y});j+=2;}}
        j+=2;
      }
      if(pts.length>=2)result.push({pts,closed});
      i=j;
    }else{i++;}
  }
  return result;
}

// ── Viewer sezione DXF reale con LWPOLYLINE ──────────────────
function DXFViewer({polylines,dxfText,width=460,height=380}:any){
  const [view,setView]=useState("nodo");
  const pols:any[]=polylines&&polylines.length>0?polylines:dxfText?parseLWPolylines(dxfText):[];

  if(pols.length===0)return(
    <div style={{width,height,background:"#1A1A1C",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <div style={{fontSize:11,color:"#444",textAlign:"center"}}>Importa DXF per visualizzare il profilo</div>
    </div>
  );

  // Filtra per vista
  let target=pols;
  if(view==="rahmen")target=pols.filter((p:any)=>Math.max(...p.pts.map((c:any)=>c.x))<=2);
  else if(view==="flugel")target=pols.filter((p:any)=>Math.max(...p.pts.map((c:any)=>c.y))<=2&&Math.min(...p.pts.map((c:any)=>c.y))<-10);
  else if(view==="front")target=pols.filter((p:any)=>Math.min(...p.pts.map((c:any)=>c.x))>=-2&&Math.min(...p.pts.map((c:any)=>c.y))>=-2);
  if(target.length===0)target=pols;

  const allPts=target.flatMap((p:any)=>p.pts);
  const xs=allPts.map((c:any)=>c.x),ys=allPts.map((c:any)=>c.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const rX=maxX-minX||1,rY=maxY-minY||1;
  const PAD=12,QPAD=28,TOOLBAR=32;
  const svgH=height-TOOLBAR;
  const vW=width-PAD*2-QPAD,vH=svgH-PAD*2-QPAD;
  const scale=Math.min(vW/rX,vH/rY);
  const offX=PAD+QPAD+(vW-rX*scale)/2;
  const offY=PAD+(vH-rY*scale)/2;
  const tx=(x:number)=>offX+(x-minX)*scale;
  const ty=(y:number)=>svgH-PAD-QPAD-(y-minY)*scale;

  const step=Math.ceil(rX/7/5)*5||5;
  const qX:number[]=[],qY:number[]=[];
  for(let v=Math.ceil(minX/step)*step;v<=maxX+0.1;v+=step)qX.push(v);
  for(let v=Math.ceil(minY/step)*step;v<=maxY+0.1;v+=step)qY.push(v);

  const fills=['#D0840814','#1A9E7312','#3B7FE012','#8B5CF610','#F9731610','#06B6D410','#EC489910'];
  const strokes=['#D08008','#1A9E73','#3B7FE0','#8B5CF6','#F97316','#06B6D4','#EC4899'];

  return(
    <div style={{background:"#1A1A1C",borderRadius:10,overflow:"hidden"}}>
      {/* Toolbar */}
      <div style={{height:TOOLBAR,display:"flex",alignItems:"center",padding:"0 12px",gap:4,borderBottom:"1px solid #2A2A2E"}}>
        {[{k:"nodo",l:"Nodo"},{k:"rahmen",l:"Telaio"},{k:"flugel",l:"Anta"},{k:"front",l:"Frontale"}].map(({k,l})=>(
          <div key={k} onClick={()=>setView(k)}
            style={{padding:"3px 10px",fontSize:10,fontWeight:600,cursor:"pointer",borderRadius:5,
              background:view===k?"#D08008":"transparent",color:view===k?"#fff":"#666",transition:"all .15s"}}>
            {l}
          </div>
        ))}
        <div style={{flex:1}}/>
        <div style={{fontSize:9,color:"#333",fontFamily:"JetBrains Mono,monospace"}}>
          {Math.round(rX)}×{Math.round(rY)}mm · {pols.length} pol.
        </div>
      </div>
      {/* SVG viewer */}
      <svg width={width} height={svgH} style={{display:"block"}}>
        <rect width={width} height={svgH} fill="#1A1A1C"/>
        {/* Grid */}
        {qX.map((v,i)=><line key={"gx"+i} x1={tx(v)} y1={PAD} x2={tx(v)} y2={svgH-PAD-QPAD} stroke="#252528" strokeWidth="0.5"/>)}
        {qY.map((v,i)=><line key={"gy"+i} x1={PAD+QPAD} y1={ty(v)} x2={width-PAD} y2={ty(v)} stroke="#252528" strokeWidth="0.5"/>)}
        {/* Assi 0 */}
        {minX<=0&&maxX>=0&&<line x1={tx(0)} y1={PAD} x2={tx(0)} y2={svgH-PAD-QPAD} stroke="#ffffff15" strokeWidth="0.8" strokeDasharray="4,3"/>}
        {minY<=0&&maxY>=0&&<line x1={PAD+QPAD} y1={ty(0)} x2={width-PAD} y2={ty(0)} stroke="#ffffff15" strokeWidth="0.8" strokeDasharray="4,3"/>}
        {/* Profilo */}
        {target.map((p:any,pi:number)=>{
          const pStr=p.pts.map((c:any)=>`${tx(c.x).toFixed(1)},${ty(c.y).toFixed(1)}`).join(' ');
          return<polygon key={pi} points={pStr} fill={fills[pi%fills.length]} stroke={strokes[pi%strokes.length]} strokeWidth="0.9" strokeLinejoin="round"/>;
        })}
        {/* Quote X */}
        {qX.map((v,i)=>(
          <g key={"qx"+i}>
            <line x1={tx(v)} y1={svgH-PAD-QPAD} x2={tx(v)} y2={svgH-PAD-QPAD+3} stroke="#3B7FE050" strokeWidth="0.7"/>
            <text x={tx(v)} y={svgH-PAD-QPAD+12} fontSize="8" fill="#3B7FE0" textAnchor="middle" fontFamily="JetBrains Mono,monospace">{Math.round(v)}</text>
          </g>
        ))}
        {/* Quote Y */}
        {qY.map((v,i)=>(
          <g key={"qy"+i}>
            <line x1={PAD+QPAD-3} y1={ty(v)} x2={PAD+QPAD} y2={ty(v)} stroke="#3B7FE050" strokeWidth="0.7"/>
            <text x={PAD+QPAD-5} y={ty(v)+3} fontSize="8" fill="#3B7FE0" textAnchor="end" fontFamily="JetBrains Mono,monospace">{Math.round(v)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ArchivioProfili({sistemiDB,setSistemiDB,coloriDB}:any){
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState<string|null>(null);
  const [form,setForm]=useState<any>(null); // null = nessuna selezione

  const profili:any[]=sistemiDB||[];
  const filtered=profili.filter((s:any)=>
    !search||[s.marca,s.sistema,s.nome,s.codice].some((v:string)=>v?.toLowerCase().includes(search.toLowerCase()))
  );

  const parseDXF=(text:string,filename:string)=>{
    const codM=text.match(/\b((0[14][04]|1[0-9]{2}|0[46])x\d{2,3})\b/i);
    const codice=codM?codM[1]:filename.replace(/\.dxf$/i,"");
    const quote:number[]=[]; const mp=/\\A1;(\d+)/g; let mm:any;
    while((mm=mp.exec(text))!==null){const v=parseInt(mm[1]);if(v>=10&&v<=300)quote.push(v);}
    const BAUT=[55,65,70,80,85,95,100,120];
    const bautiefe=quote.find((q:number)=>BAUT.includes(q))||quote.filter((q:number)=>q>=50&&q<=130).sort((a:number,b:number)=>a-b)[0]||0;
    const fermSet=new Set<string>(); const fp=/\b([2-6]\d{5})\b/g; let fm:any;
    while((fm=fp.exec(text))!==null)fermSet.add(fm[1]);
    const coords:{x:number,y:number}[]=[]; const cp=/\n\s*10\n\s*([-\d.]+)\n\s*20\n\s*([-\d.]+)/g; let cv:any;
    while((cv=cp.exec(text))!==null)coords.push({x:parseFloat(cv[1]),y:parseFloat(cv[2])});
    const n=codice.toLowerCase();
    const tipo=n.includes("x2")||n.includes("x3")?"Flügel":n.includes("x4")||n.includes("x5")?"Pfosten":n.includes("x6")||n.includes("x7")||n.includes("x8")||n.includes("x9")?"Stulp":"Rahmen";
    const fornitore=text.includes("OHNE_DICHTUNGEN")||text.includes("aluplast")||text.includes("mmerling")?"Kömmerling / aluplast":"Generico";
    // Estrai LWPOLYLINE complete per il viewer
    const polylines=parseLWPolylines(text);
    return {id:"P-"+Date.now()+"_"+Math.random(),codice,marca:fornitore.split(" ")[0],sistema:codice,nome:tipo+" "+bautiefe+"mm",materiale:"PVC",tipo,bautiefe,grMl:"",qtaCassa:"",camere:0,uw:"",uf:"",rw:"",spessore:String(bautiefe),classe:"",certificazioni:"",notetech:"",sovRAL:0,sovLegno:0,euroMl:0,tipologie:"",sottosistemi:"",ferramenta:[...fermSet],quote,coords,polylines,dxfText:text,attivo:true};
  };

  const openNew=()=>{
    const np={id:"P-"+Date.now(),codice:"",marca:"",sistema:"",nome:"Nuovo profilo",materiale:"PVC",tipo:"Rahmen",bautiefe:70,grMl:"",qtaCassa:"",camere:0,uw:"",uf:"",rw:"",spessore:"70",classe:"",certificazioni:"",notetech:"",sovRAL:0,sovLegno:0,euroMl:0,tipologie:"",sottosistemi:"",ferramenta:[],quote:[],coords:[],attivo:true};
    setSistemiDB?.((p:any[])=>[...(p||[]),np]);
    setSelected(np.id); setForm(np);
  };
  const selectProfilo=(s:any)=>{setSelected(s.id);setForm({...s});};
  const updateForm=(k:string,v:any)=>{
    const next={...form,[k]:v};
    setForm(next);
    setSistemiDB?.((p:any[])=>p.map((x:any)=>x.id===next.id?next:x));
  };
  const del=(id:string)=>{
    if(!confirm("Eliminare questo profilo?"))return;
    setSistemiDB?.((p:any[])=>p.filter((x:any)=>x.id!==id));
    setSelected(null); setForm(null);
  };

  const tipoColor:Record<string,[string,string]>={
    "Rahmen":["#DBEAFE","#1E40AF"],"Flügel":["#D1FAE5","#065F46"],
    "Pfosten":["#FEF3C7","#92400E"],"Stulp":["#FCE7F3","#9D174D"],
  };

  return (
    <div style={{display:"flex",height:"100%",gap:0}}>

      {/* ── LISTA SINISTRA ─────────────────────────────────────── */}
      <div style={{width:280,flexShrink:0,borderRight:"1px solid #E5E3DC",display:"flex",flexDirection:"column",background:"#fff",height:"100%"}}>
        {/* Header lista */}
        <div style={{padding:"14px 14px 10px",borderBottom:"1px solid #E5E3DC",background:"#1A1A1C"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#fff",marginBottom:8}}>Archivio Profili PVC</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {[{n:profili.length,l:"Tot",c:AMB},{n:profili.filter((s:any)=>s.grMl).length,l:"kg/ml",c:TEAL},{n:profili.filter((s:any)=>!s.grMl||!s.qtaCassa).length,l:"Incompl.",c:RED}].map((k,i)=>(
              <div key={i} style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:18,fontWeight:800,color:k.c,lineHeight:"1"}}>{k.n}</div>
                <div style={{fontSize:9,color:"#9CA3AF"}}>{k.l}</div>
              </div>
            ))}
          </div>
          {/* Cerca */}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:"#2A2A2E",borderRadius:7}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca..." style={{border:"none",background:"transparent",fontSize:12,color:"#fff",outline:"none",width:"100%"}}/>
          </div>
        </div>

        {/* Import DXF — uno alla volta */}
        <div style={{padding:"10px 12px",borderBottom:"1px solid #F2F1EC",background:"#FFFBF5"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {/* DXF */}
            <div style={{position:"relative"}}>
              <input type="file" accept=".dxf" style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",zIndex:2}}
                onChange={e=>{
                  const file=e.target.files?.[0]; if(!file)return;
                  const r=new FileReader();
                  r.onload=ev=>{const p=parseDXF(ev.target?.result as string,file.name);setSistemiDB?.((prev:any[])=>[...(prev||[]),p]);setSelected(p.id);setForm(p);};
                  r.readAsText(file); e.target.value="";
                }}/>
              <div style={{border:`1.5px dashed ${AMB}`,borderRadius:7,padding:"8px 4px",textAlign:"center",background:"#FFFBF5",cursor:"pointer"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AMB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:2}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/></svg>
                <div style={{fontSize:9,fontWeight:700,color:"#92400E"}}>DXF/DWG</div>
              </div>
            </div>
            {/* PNG */}
            <div style={{position:"relative"}}>
              <input type="file" accept=".png,.jpg,.jpeg,.webp" style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",zIndex:2}}
                onChange={e=>{
                  const file=e.target.files?.[0]; if(!file)return;
                  const r=new FileReader();
                  r.onload=ev=>{const np:any={id:"P-"+Date.now(),codice:file.name.replace(/\.[^.]+$/,""),marca:"",sistema:"",nome:file.name.replace(/\.[^.]+$/,""),materiale:"PVC",tipo:"Rahmen",bautiefe:0,grMl:"",qtaCassa:"",ferramenta:[],quote:[],coords:[],attivo:true,imgBase64:ev.target?.result};setSistemiDB?.((prev:any[])=>[...(prev||[]),np]);setSelected(np.id);setForm(np);};
                  r.readAsDataURL(file); e.target.value="";
                }}/>
              <div style={{border:`1.5px dashed ${BLU}`,borderRadius:7,padding:"8px 4px",textAlign:"center",background:"#EFF6FF",cursor:"pointer"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BLU} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:2}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <div style={{fontSize:9,fontWeight:700,color:"#1E40AF"}}>PNG/JPG</div>
              </div>
            </div>
            {/* Nuovo manuale */}
            <div onClick={openNew} style={{border:`1.5px dashed ${TEAL}`,borderRadius:7,padding:"8px 4px",textAlign:"center",background:"#ECFDF5",cursor:"pointer"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:2}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <div style={{fontSize:9,fontWeight:700,color:"#065F46"}}>Manuale</div>
            </div>
          </div>
        </div>

        {/* Lista profili */}
        <div style={{flex:1,overflowY:"auto"}}>
          {filtered.length===0&&<div style={{padding:"24px",textAlign:"center",color:"#86868b",fontSize:12}}>Nessun profilo</div>}
          {filtered.map((s:any)=>{
            const isOn=selected===s.id;
            const [tbg,tfg]=tipoColor[s.tipo as string]||["#F2F1EC","#6B7280"];
            return (
              <div key={s.id} onClick={()=>selectProfilo(s)}
                style={{padding:"10px 14px",borderBottom:"1px solid #F2F1EC",cursor:"pointer",background:isOn?AMB+"08":"#fff",borderLeft:`3px solid ${isOn?AMB:"transparent"}`,transition:"all .1s"}}
                onMouseEnter={e=>!isOn&&((e.currentTarget as any).style.background="#F8F7F2")}
                onMouseLeave={e=>!isOn&&((e.currentTarget as any).style.background="#fff")}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700,color:isOn?AMB:DARK}}>{s.codice||s.sistema||"—"}</span>
                  <span style={{fontSize:10,padding:"1px 6px",borderRadius:3,fontWeight:700,background:tbg,color:tfg}}>{s.tipo||"?"}</span>
                </div>
                <div style={{fontSize:11,color:"#86868b",marginBottom:2}}>{s.nome||s.marca}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {s.bautiefe?<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:"#F2F1EC",color:"#86868b"}}>{s.bautiefe}mm</span>:null}
                  {s.grMl?<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:TEAL+"15",color:TEAL,fontWeight:700}}>{s.grMl}kg/ml</span>:<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:RED+"15",color:RED}}>no kg/ml</span>}
                  {s.coords?.length?<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:AMB+"15",color:AMB}}>{s.coords.length}pt</span>:null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DETTAGLIO DESTRA ───────────────────────────────────── */}
      <div style={{flex:1,overflowY:"auto",background:"#F2F1EC"}}>
        {!form?(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:12,color:"#86868b"}}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div style={{fontSize:13}}>Seleziona un profilo o importa un DXF</div>
          </div>
        ):(
          <div style={{padding:"20px 24px"}}>
            {/* Header dettaglio */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:DARK}}>{form.codice||form.nome||"Nuovo profilo"}</div>
                <div style={{fontSize:12,color:"#86868b",marginTop:2}}>{form.marca} · {form.sistema} · {form.tipo}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <div onClick={()=>del(form.id)} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:RED+"12",color:RED}}>Elimina</div>
              </div>
            </div>

            {/* ── VIEWER DXF + DATI PRODUZIONE ── */}
            <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:16,marginBottom:16}}>
              {/* Viewer sezione */}
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Sezione trasversale DXF</div>
                <DXFViewer dxfText={form.dxfText} polylines={form.polylines} width={460} height={380}/>
                {form.imgBase64&&<img src={form.imgBase64} alt="profilo" style={{maxHeight:80,border:"1px solid #E5E3DC",borderRadius:8,display:"block",marginTop:8}}/>}
                {form.coords?.length>0&&(
                  <div style={{marginTop:8,padding:"6px 10px",background:"#1A1A1C",borderRadius:6}}>
                    <div style={{fontSize:9,color:"#555",marginBottom:2}}>Coordinate ({form.coords.length} pt)</div>
                    <div style={{fontSize:9,fontFamily:"JetBrains Mono,monospace",color:AMB,lineHeight:"1.7",maxHeight:40,overflowY:"auto"}}>
                      {form.coords.slice(0,12).map((c:any,i:number)=>`(${c.x.toFixed(0)},${c.y.toFixed(0)})`).join(" ")}
                    </div>
                  </div>
                )}
              </div>
              {/* Dati produzione PVC */}
              <div style={{background:"#F0FDF4",borderRadius:12,padding:"16px",border:`2px solid ${TEAL}`}}>
                <div style={{fontSize:11,fontWeight:800,color:TEAL,textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>Dati produzione PVC ★</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <LBL>Peso kg / metro lineare ★</LBL>
                    <INP type="number" placeholder="es. 1.350" value={form.grMl||""} onChange={(e:any)=>updateForm("grMl",e.target.value)} style={{border:`2px solid ${TEAL}`,fontWeight:700,fontSize:14}}/>
                  </div>
                  <div>
                    <LBL>Quantità per cassa ★</LBL>
                    <INP placeholder="es. 50ml / 6m / 10pz" value={form.qtaCassa||""} onChange={(e:any)=>updateForm("qtaCassa",e.target.value)} style={{border:`2px solid ${BLU}`,fontWeight:700}}/>
                  </div>
                  <div>
                    <LBL>Bautiefe (mm)</LBL>
                    <INP type="number" placeholder="70" value={form.bautiefe||""} onChange={(e:any)=>updateForm("bautiefe",parseFloat(e.target.value)||0)}/>
                  </div>
                  <div>
                    <LBL>N° camere</LBL>
                    <INP type="number" placeholder="5" value={form.camere||""} onChange={(e:any)=>updateForm("camere",parseInt(e.target.value)||0)}/>
                  </div>
                  <div>
                    <LBL>Spessore telaio (mm)</LBL>
                    <INP placeholder="70" value={form.spessore||""} onChange={(e:any)=>updateForm("spessore",e.target.value)}/>
                  </div>
                  <div>
                    <LBL>€ / ml base</LBL>
                    <INP type="number" placeholder="0" value={form.euroMl||""} onChange={(e:any)=>updateForm("euroMl",parseFloat(e.target.value)||0)}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Identità */}
            <div style={{background:"#fff",borderRadius:12,padding:"16px",border:"1px solid #E5E3DC",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>Identità</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <div><LBL>Codice DXF</LBL><INP placeholder="es. 140x01" value={form.codice||""} onChange={(e:any)=>updateForm("codice",e.target.value)} style={{fontFamily:"JetBrains Mono,monospace",fontWeight:700}}/></div>
                <div><LBL>Marca</LBL><INP placeholder="Kömmerling" value={form.marca||""} onChange={(e:any)=>updateForm("marca",e.target.value)}/></div>
                <div><LBL>Sistema / Linea</LBL><INP placeholder="IDEAL 4000" value={form.sistema||""} onChange={(e:any)=>updateForm("sistema",e.target.value)}/></div>
                <div><LBL>Nome commerciale</LBL><INP placeholder="Rahmen 70mm CL" value={form.nome||""} onChange={(e:any)=>updateForm("nome",e.target.value)}/></div>
                <div><LBL>Materiale</LBL>
                  <SEL value={form.materiale||"PVC"} onChange={(e:any)=>updateForm("materiale",e.target.value)}>
                    <option>PVC</option><option>Alluminio</option><option>Legno-Alluminio</option><option>Legno</option><option>Acciaio</option><option>Ferro</option>
                  </SEL>
                </div>
                <div><LBL>Tipo elemento</LBL>
                  <SEL value={form.tipo||"Rahmen"} onChange={(e:any)=>updateForm("tipo",e.target.value)}>
                    <option>Rahmen</option><option>Flügel</option><option>Pfosten</option><option>Stulp</option>
                  </SEL>
                </div>
              </div>
            </div>

            {/* Dati tecnici */}
            <div style={{background:"#fff",borderRadius:12,padding:"16px",border:"1px solid #E5E3DC",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>Dati tecnici</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[{l:"Uw (W/m²K)",k:"uw",ph:"1.1"},{l:"Uf (W/m²K)",k:"uf",ph:"1.3"},{l:"Rw (dB)",k:"rw",ph:"42"},{l:"Camere aria",k:"camere",ph:"5"},{l:"Classe tenuta aria",k:"classeTenuta",ph:"4"},{l:"Classe tenuta acqua",k:"classeAcqua",ph:"E1350"},{l:"Classe resist. vento",k:"classeVento",ph:"C5"},{l:"Classe termica",k:"classe",ph:"A"}].map(f=>(
                  <div key={f.k}><LBL>{f.l}</LBL><INP placeholder={f.ph} value={form[f.k]||""} onChange={(e:any)=>updateForm(f.k,e.target.value)}/></div>
                ))}
                <div style={{gridColumn:"1/-1"}}><LBL>Certificazioni (EN, CE...)</LBL><INP placeholder="EN 14351-1, CE 0123" value={form.certificazioni||""} onChange={(e:any)=>updateForm("certificazioni",e.target.value)}/></div>
              </div>
            </div>

            {/* Prezzi */}
            <div style={{background:"#fff",borderRadius:12,padding:"16px",border:"1px solid #E5E3DC",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>Prezzi</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                <div><LBL>Sovrapprezzo RAL %</LBL><INP type="number" placeholder="0" value={form.sovRAL||""} onChange={(e:any)=>updateForm("sovRAL",parseFloat(e.target.value)||0)}/></div>
                <div><LBL>Sovrapprezzo legno %</LBL><INP type="number" placeholder="0" value={form.sovLegno||""} onChange={(e:any)=>updateForm("sovLegno",parseFloat(e.target.value)||0)}/></div>
                <div><LBL>Sconto max %</LBL><INP type="number" placeholder="20" value={form.scontoMax||""} onChange={(e:any)=>updateForm("scontoMax",parseFloat(e.target.value)||0)}/></div>
                <div><LBL>Margine target %</LBL><INP type="number" placeholder="35" value={form.margineTarget||""} onChange={(e:any)=>updateForm("margineTarget",parseFloat(e.target.value)||0)}/></div>
              </div>
            </div>

            {/* Applicazioni + Ferramenta */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div style={{background:"#fff",borderRadius:12,padding:"16px",border:"1px solid #E5E3DC"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Applicazioni</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div><LBL>Tipologie compatibili</LBL><INP placeholder="Finestra, Portafinestra..." value={form.tipologie||""} onChange={(e:any)=>updateForm("tipologie",e.target.value)}/></div>
                  <div><LBL>Sottosistemi (CL/SL/RL)</LBL><INP placeholder="Classic-line, Soft-line..." value={form.sottosistemi||""} onChange={(e:any)=>updateForm("sottosistemi",e.target.value)}/></div>
                </div>
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:"16px",border:"1px solid #E5E3DC"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Ferramenta layer 15 ({form.ferramenta?.length||0})</div>
                {form.ferramenta?.length>0?(
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {form.ferramenta.map((f:string,i:number)=>(
                      <span key={i} style={{padding:"3px 8px",borderRadius:5,background:"#FEF3C7",border:`1px solid ${AMB}`,fontSize:10,fontFamily:"JetBrains Mono,monospace",fontWeight:700,color:"#92400E"}}>{f}</span>
                    ))}
                  </div>
                ):<div style={{fontSize:12,color:"#86868b"}}>Nessun codice — importa DXF</div>}
                {form.quote?.length>0&&(
                  <div style={{marginTop:10}}>
                    <div style={{fontSize:9,fontWeight:700,color:"#86868b",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Quote layer 15</div>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {form.quote.map((q:number,i:number)=>(
                        <span key={i} style={{padding:"2px 7px",borderRadius:4,background:"#F2F1EC",border:"1px solid #E5E3DC",fontSize:10,fontFamily:"JetBrains Mono,monospace",fontWeight:700,color:DARK}}>{q}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Note + Attivo */}
            <div style={{background:"#fff",borderRadius:12,padding:"16px",border:"1px solid #E5E3DC",marginBottom:12}}>
              <LBL>Note tecniche / commerciali</LBL>
              <textarea value={form.notetech||""} onChange={(e:any)=>updateForm("notetech",e.target.value)} placeholder="Note interne, particolarità, condizioni fornitore..." style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #E5E3DC",fontSize:13,fontFamily:FF,background:"#F8F7F2",color:DARK,outline:"none",boxSizing:"border-box",minHeight:64,resize:"vertical"}}/>
              <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
                <div onClick={()=>updateForm("attivo",!form.attivo)} style={{width:38,height:22,borderRadius:11,background:form.attivo!==false?TEAL:"#E5E3DC",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:form.attivo!==false?18:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                </div>
                <span style={{fontSize:13,color:DARK}}>Profilo attivo nel configuratore</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// ARCHIVIO NODI — Motore composizione profili per CNC
// ═══════════════════════════════════════════════════════════════
function ArchivioNodi({nodiDB,setNodiDB,sistemiDB}:any){
  const [selected,setSelected]=useState<string|null>(null);
  const [search,setSearch]=useState("");
  const nodi:any[]=nodiDB||[];
  const profili:any[]=sistemiDB||[];
  const filtered=nodi.filter((n:any)=>!search||[n.nome,n.tipo].some((v:string)=>v?.toLowerCase().includes(search.toLowerCase())));

  const newNodo=()=>{
    const n={id:"N-"+Date.now(),nome:"Nuovo nodo",tipo:"anta_telaio",
      profiloA_id:"",profiloB_id:"",
      angolo:45,kerf:3.5,offset:0,note_cnc:"",
      dxfText:"",polylines:[]};
    setNodiDB?.((p:any[])=>[...(p||[]),n]);
    setSelected(n.id);
  };
  const upd=(id:string,k:string,v:any)=>setNodiDB?.((p:any[])=>p.map((x:any)=>x.id===id?{...x,[k]:v}:x));
  const del=(id:string)=>{if(!confirm("Eliminare?"))return;setNodiDB?.((p:any[])=>p.filter((x:any)=>x.id!==id));setSelected(null);};

  const sel=nodi.find((n:any)=>n.id===selected);
  const pA=profili.find((p:any)=>p.id===sel?.profiloA_id);
  const pB=profili.find((p:any)=>p.id===sel?.profiloB_id);

  const TIPI=[
    {k:"anta_telaio",l:"Anta + Telaio",desc:"Nodo laterale standard"},
    {k:"traverso",l:"Traverso",desc:"Nodo orizzontale"},
    {k:"pfosten",l:"Pfosten (montante)",desc:"Nodo verticale centrale"},
    {k:"angolo_45",l:"Angolo 45°",desc:"Giunzione ad angolo"},
    {k:"stulp",l:"Stulpo",desc:"Anta doppia senza montante"},
    {k:"soglia",l:"Soglia",desc:"Nodo inferiore"},
  ];

  return(
    <div style={{display:"flex",height:"100%",gap:0}}>

      {/* LISTA SINISTRA */}
      <div style={{width:260,flexShrink:0,borderRight:"1px solid #E5E3DC",display:"flex",flexDirection:"column",background:"#fff",height:"100%"}}>
        <div style={{padding:"14px 14px 10px",borderBottom:"1px solid #E5E3DC",background:"#1A1A1C"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#fff",marginBottom:8}}>Archivio Nodi</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {[{n:nodi.length,l:"Nodi",c:AMB},{n:nodi.filter((n:any)=>n.profiloA_id&&n.profiloB_id).length,l:"Completi",c:TEAL},{n:nodi.filter((n:any)=>!n.profiloA_id||!n.profiloB_id).length,l:"Da compl.",c:RED}].map((k,i)=>(
              <div key={i} style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:18,fontWeight:800,color:k.c,lineHeight:"1"}}>{k.n}</div>
                <div style={{fontSize:9,color:"#9CA3AF"}}>{k.l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:"#2A2A2E",borderRadius:7}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca nodo..." style={{border:"none",background:"transparent",fontSize:12,color:"#fff",outline:"none",width:"100%"}}/>
          </div>
        </div>

        {/* Import DXF nodo */}
        <div style={{padding:"10px 12px",borderBottom:"1px solid #F2F1EC",background:"#FFFBF5"}}>
          <div style={{position:"relative"}}>
            <input type="file" accept=".dxf" style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",zIndex:2}}
              onChange={e=>{
                const file=e.target.files?.[0];if(!file)return;
                const r=new FileReader();
                r.onload=ev=>{
                  const text=ev.target?.result as string;
                  const polylines=parseLWPolylines(text);
                  // Separa automaticamente i profili per quadrante
                  const polsA=polylines.filter((p:any)=>Math.max(...p.pts.map((c:any)=>c.x))<=2);
                  const polsB=polylines.filter((p:any)=>Math.max(...p.pts.map((c:any)=>c.y))<=2&&Math.min(...p.pts.map((c:any)=>c.y))<-10);
                  const n={id:"N-"+Date.now(),nome:file.name.replace(/\.dxf$/i,""),tipo:"anta_telaio",
                    profiloA_id:"",profiloB_id:"",angolo:45,kerf:3.5,offset:0,note_cnc:"",
                    dxfText:text,polylines,polsA,polsB};
                  setNodiDB?.((prev:any[])=>[...(prev||[]),n]);
                  setSelected(n.id);
                };
                r.readAsText(file);e.target.value="";
              }}/>
            <div style={{border:`1.5px dashed ${AMB}`,borderRadius:7,padding:"9px",textAlign:"center",background:"#FFFBF5",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AMB} strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/></svg>
              <div style={{fontSize:11,fontWeight:700,color:"#92400E"}}>Importa DXF nodo</div>
            </div>
          </div>
          <div onClick={newNodo} style={{marginTop:6,border:`1.5px dashed ${TEAL}`,borderRadius:7,padding:"8px",textAlign:"center",background:"#ECFDF5",cursor:"pointer",fontSize:11,fontWeight:700,color:"#065F46"}}>+ Crea nodo manuale</div>
        </div>

        {/* Lista nodi */}
        <div style={{flex:1,overflowY:"auto"}}>
          {filtered.length===0&&<div style={{padding:"24px",textAlign:"center",color:"#86868b",fontSize:12}}>Nessun nodo</div>}
          {filtered.map((n:any)=>{
            const isOn=selected===n.id;
            const ok=n.profiloA_id&&n.profiloB_id;
            const pA2=profili.find((p:any)=>p.id===n.profiloA_id);
            const pB2=profili.find((p:any)=>p.id===n.profiloB_id);
            return(
              <div key={n.id} onClick={()=>setSelected(n.id)}
                style={{padding:"10px 14px",borderBottom:"1px solid #F2F1EC",cursor:"pointer",
                  background:isOn?AMB+"08":"#fff",borderLeft:`3px solid ${isOn?AMB:"transparent"}`}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:ok?TEAL:RED,flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:700,color:isOn?AMB:DARK}}>{n.nome}</span>
                </div>
                <div style={{fontSize:10,color:"#86868b",marginBottom:3}}>
                  {TIPI.find((t:any)=>t.k===n.tipo)?.l||n.tipo} · {n.angolo}° · kerf {n.kerf}mm
                </div>
                <div style={{display:"flex",gap:4}}>
                  {pA2?<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:"#DBEAFE",color:"#1E40AF",fontWeight:600}}>{pA2.codice||pA2.sistema}</span>:<span style={{fontSize:9,color:RED}}>A mancante</span>}
                  <span style={{fontSize:9,color:"#ccc"}}>+</span>
                  {pB2?<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:"#D1FAE5",color:"#065F46",fontWeight:600}}>{pB2.codice||pB2.sistema}</span>:<span style={{fontSize:9,color:RED}}>B mancante</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETTAGLIO DESTRA */}
      <div style={{flex:1,overflowY:"auto",background:"#F2F1EC"}}>
        {!sel?(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:12,color:"#86868b"}}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
            <div style={{fontSize:13}}>Seleziona un nodo o importa un DXF</div>
          </div>
        ):(
          <div style={{padding:"20px 24px"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:DARK}}>{sel.nome}</div>
                <div style={{fontSize:12,color:"#86868b",marginTop:2}}>{TIPI.find((t:any)=>t.k===sel.tipo)?.l} · {sel.angolo}° · kerf {sel.kerf}mm</div>
              </div>
              <div onClick={()=>del(sel.id)} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:RED+"12",color:RED}}>Elimina</div>
            </div>

            {/* VIEWER NODO */}
            <div style={{marginBottom:16}}>
              <DXFViewer polylines={sel.polylines} dxfText={sel.dxfText} width={700} height={420}/>
            </div>

            {/* Dati nodo */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>

              {/* Info base */}
              <div style={{background:"#fff",borderRadius:12,padding:"16px",border:"1px solid #E5E3DC"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>Configurazione nodo</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div><LBL>Nome nodo</LBL><INP placeholder="es. Anta+Telaio 70+77mm" value={sel.nome||""} onChange={(e:any)=>upd(sel.id,"nome",e.target.value)}/></div>
                  <div><LBL>Tipo nodo</LBL>
                    <SEL value={sel.tipo||"anta_telaio"} onChange={(e:any)=>upd(sel.id,"tipo",e.target.value)}>
                      {TIPI.map((t:any)=><option key={t.k} value={t.k}>{t.l} — {t.desc}</option>)}
                    </SEL>
                  </div>
                </div>
              </div>

              {/* Parametri CNC */}
              <div style={{background:"#F0FDF4",borderRadius:12,padding:"16px",border:`2px solid ${TEAL}`}}>
                <div style={{fontSize:11,fontWeight:800,color:TEAL,textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>Parametri taglio CNC ★</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <LBL>Angolo taglio (°)</LBL>
                    <SEL value={String(sel.angolo||45)} onChange={(e:any)=>upd(sel.id,"angolo",parseFloat(e.target.value))}>
                      <option value="45">45° — Giunzione ad angolo</option>
                      <option value="90">90° — Taglio dritto</option>
                      <option value="22.5">22.5° — Angolo speciale</option>
                      <option value="0">0° — Parallelo</option>
                    </SEL>
                  </div>
                  <div>
                    <LBL>Kerf lama (mm)</LBL>
                    <INP type="number" step="0.1" placeholder="3.5" value={sel.kerf||""} onChange={(e:any)=>upd(sel.id,"kerf",parseFloat(e.target.value)||0)} style={{border:`2px solid ${TEAL}`,fontWeight:700}}/>
                  </div>
                  <div>
                    <LBL>Offset accoppiamento (mm)</LBL>
                    <INP type="number" step="0.1" placeholder="0" value={sel.offset||""} onChange={(e:any)=>upd(sel.id,"offset",parseFloat(e.target.value)||0)}/>
                  </div>
                  <div>
                    <LBL>Tolleranza gioco (mm)</LBL>
                    <INP type="number" step="0.1" placeholder="0.2" value={sel.tolleranza||""} onChange={(e:any)=>upd(sel.id,"tolleranza",parseFloat(e.target.value)||0)}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Selezione profili */}
            <div style={{background:"#fff",borderRadius:12,padding:"16px",border:"1px solid #E5E3DC",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>Profili del nodo</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"center"}}>
                {/* Profilo A */}
                <div style={{border:`2px solid #DBEAFE`,borderRadius:10,padding:"12px"}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#1E40AF",textTransform:"uppercase",marginBottom:8}}>Profilo A — Telaio (Rahmen)</div>
                  <SEL value={sel.profiloA_id||""} onChange={(e:any)=>upd(sel.id,"profiloA_id",e.target.value)}>
                    <option value="">— Seleziona profilo —</option>
                    {profili.filter((p:any)=>p.tipo==="Rahmen"||!p.tipo).map((p:any)=>(
                      <option key={p.id} value={p.id}>{p.codice||p.sistema} — {p.nome} {p.bautiefe?`(${p.bautiefe}mm)`:""}</option>
                    ))}
                  </SEL>
                  {pA&&<div style={{marginTop:8,padding:"6px 10px",background:"#EFF6FF",borderRadius:7,fontSize:11,color:"#1E40AF"}}>
                    {pA.bautiefe}mm · {pA.grMl?pA.grMl+"kg/ml":""} · {pA.camere||"?"}cam
                  </div>}
                </div>
                {/* Simbolo + */}
                <div style={{fontSize:24,color:"#ccc",textAlign:"center",fontWeight:300}}>+</div>
                {/* Profilo B */}
                <div style={{border:`2px solid #D1FAE5`,borderRadius:10,padding:"12px"}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#065F46",textTransform:"uppercase",marginBottom:8}}>Profilo B — Anta (Flügel)</div>
                  <SEL value={sel.profiloB_id||""} onChange={(e:any)=>upd(sel.id,"profiloB_id",e.target.value)}>
                    <option value="">— Seleziona profilo —</option>
                    {profili.filter((p:any)=>p.tipo==="Flügel"||!p.tipo).map((p:any)=>(
                      <option key={p.id} value={p.id}>{p.codice||p.sistema} — {p.nome} {p.bautiefe?`(${p.bautiefe}mm)`:""}</option>
                    ))}
                  </SEL>
                  {pB&&<div style={{marginTop:8,padding:"6px 10px",background:"#ECFDF5",borderRadius:7,fontSize:11,color:"#065F46"}}>
                    {pB.bautiefe}mm · {pB.grMl?pB.grMl+"kg/ml":""} · {pB.camere||"?"}cam
                  </div>}
                </div>
              </div>
              {/* Riepilogo nodo */}
              {pA&&pB&&(
                <div style={{marginTop:12,padding:"10px 14px",background:"#F9F8F5",borderRadius:8,border:"1px solid #E5E3DC",display:"flex",gap:20,fontSize:12,color:DARK}}>
                  <div><span style={{color:"#86868b"}}>Bautiefe totale: </span><strong>{(parseFloat(pA.bautiefe)||0)+(parseFloat(pB.bautiefe)||0)}mm</strong></div>
                  <div><span style={{color:"#86868b"}}>Perdita kerf: </span><strong style={{color:AMB}}>{sel.kerf||0}mm</strong></div>
                  <div><span style={{color:"#86868b"}}>Taglio effettivo: </span><strong style={{color:TEAL}}>{((parseFloat(pA.bautiefe)||0)+(parseFloat(pB.bautiefe)||0)-(parseFloat(sel.kerf)||0)).toFixed(1)}mm</strong></div>
                </div>
              )}
            </div>

            {/* Note CNC */}
            <div style={{background:"#fff",borderRadius:12,padding:"16px",border:"1px solid #E5E3DC"}}>
              <LBL>Note per la macchina CNC</LBL>
              <textarea value={sel.note_cnc||""} onChange={(e:any)=>upd(sel.id,"note_cnc",e.target.value)}
                placeholder="Istruzioni speciali per la macchina, sequenza lavorazioni, note operatore..."
                style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #E5E3DC",fontSize:13,fontFamily:FF,background:"#F8F7F2",color:DARK,outline:"none",boxSizing:"border-box",minHeight:80,resize:"vertical"}}/>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ARCHIVIO VETRI
// ═══════════════════════════════════════════════════════════════
function ArchivioVetri({vetriDB,setVetriDB}:any){
  const [modal,setModal]=useState<any>(null);
  const [form,setForm]=useState<any>({});
  const [search,setSearch]=useState("");

  const filtered=(vetriDB||[]).filter((v:any)=>!search||[v.code,v.nome,v.composizione].some((x:string)=>x?.toLowerCase().includes(search.toLowerCase())));

  const openNew=()=>{setForm({id:"V-"+Date.now(),code:"",nome:"",composizione:"",tipo:"vetrocamera",euroMq:0,uw:"",g:"",rw:"",spessore:"",selettivo:false,basso_emissivo:false,stratificato:false,note:""});setModal("form");};
  const save=()=>{
    if(!form.code){alert("Inserisci un codice");return;}
    if(modal==="new"||!vetriDB?.find((x:any)=>x.id===form.id)) setVetriDB?.((p:any[])=>[...(p||[]),form]);
    else setVetriDB?.((p:any[])=>p.map((x:any)=>x.id===form.id?form:x));
    setModal(null);
  };

  return (
    <>
      <Sez title="Archivio vetri" sub={`${(vetriDB||[]).length} tipologie configurate`} action={{label:"Nuovo vetro",fn:openNew}}>
        <div style={{padding:"10px 14px",borderBottom:`1px solid #F2F1EC`,display:"flex",gap:8}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#F8F7F2",borderRadius:8,border:`1px solid #E5E3DC`}}>
            <Svg path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" c="#86868b" s={13}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca codice, composizione..." style={{border:"none",background:"transparent",fontSize:13,color:DARK,outline:"none",width:"100%",fontFamily:FF}}/>
          </div>
        </div>
        {filtered.map((v:any)=>(
          <div key={v.id||v.code} style={{padding:"12px 18px",borderBottom:`1px solid #F2F1EC`,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:10,background:BLU+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Svg path="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" c={BLU} s={18}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <span style={{fontSize:13,fontWeight:800,color:DARK}}>{v.code||v.nome}</span>
                {v.tipo&&badge(BLU+"12",BLU,v.tipo)}
                {v.selettivo&&badge(TEAL+"12",TEAL,"Selettivo")}
                {v.basso_emissivo&&badge(AMB+"12",AMB,"Basso-e")}
                {v.stratificato&&badge(PUR+"12",PUR,"Stratificato")}
              </div>
              <div style={{fontSize:12,color:"#86868b"}}>{v.composizione||v.descrizione||"—"}</div>
              <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                {v.uw&&badge("#F2F1EC","#86868b",`Uw ${v.uw} W/m²K`)}
                {v.g&&badge("#F2F1EC","#86868b",`g ${v.g}`)}
                {v.rw&&badge("#F2F1EC","#86868b",`Rw ${v.rw} dB`)}
                {v.spessore&&badge("#F2F1EC","#86868b",`${v.spessore}mm`)}
                {v.euroMq>0&&badge(TEAL+"12",TEAL,`€${v.euroMq}/mq`)}
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <div onClick={()=>{setForm({...v});setModal("form");}} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:BLU+"12",color:BLU}}>Modifica</div>
              <div onClick={()=>{if(confirm("Eliminare?"))setVetriDB?.((p:any[])=>p.filter((x:any)=>x.id!==v.id&&x.code!==v.code));}} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:RED+"12",color:RED}}>Elimina</div>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{padding:"36px",textAlign:"center",color:"#86868b",fontSize:14}}>Nessun vetro — aggiungine uno</div>}
      </Sez>

      {modal==="form"&&(
        <Modal title={form.id&&(vetriDB||[]).find((x:any)=>x.id===form.id)?"Modifica vetro":"Nuovo vetro"} onClose={()=>setModal(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{padding:"14px",background:"#F8F7F2",borderRadius:10,border:`1px solid #E5E3DC`}}>
              <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>Identità</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><LBL>Codice</LBL><INP placeholder="Es. 4-16-4 Low-E" value={form.code||""} onChange={(e:any)=>setForm((p:any)=>({...p,code:e.target.value}))}/></div>
                <div><LBL>Nome commerciale</LBL><INP placeholder="Es. Planitherm Ultra" value={form.nome||""} onChange={(e:any)=>setForm((p:any)=>({...p,nome:e.target.value}))}/></div>
                <div><LBL>Tipo</LBL>
                  <SEL value={form.tipo||"vetrocamera"} onChange={(e:any)=>setForm((p:any)=>({...p,tipo:e.target.value}))}>
                    <option value="vetrocamera">Vetrocamera</option>
                    <option value="triplo">Triplo vetro</option>
                    <option value="singolo">Singolo</option>
                    <option value="stratificato">Stratificato</option>
                    <option value="temperato">Temperato</option>
                    <option value="acidato">Acidato / Satinato</option>
                    <option value="specchio">Specchio</option>
                    <option value="colorato">Colorato</option>
                  </SEL>
                </div>
                <div><LBL>Composizione</LBL><INP placeholder="Es. 4/16Ar/4 Low-E" value={form.composizione||""} onChange={(e:any)=>setForm((p:any)=>({...p,composizione:e.target.value}))}/></div>
              </div>
            </div>
            <div style={{padding:"14px",background:"#F8F7F2",borderRadius:10,border:`1px solid #E5E3DC`}}>
              <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>Prestazioni</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {[{l:"Uw (W/m²K)",k:"uw",ph:"1.1"},{l:"g (fattore solare)",k:"g",ph:"0.62"},{l:"Lt (trasmiss. luce)",k:"lt",ph:"0.75"},{l:"Rw (dB)",k:"rw",ph:"34"},{l:"Spessore totale (mm)",k:"spessore",ph:"28"},{l:"Gas intercapedine",k:"gas",ph:"Argon"}].map(f=>(
                  <div key={f.k}><LBL>{f.l}</LBL><INP placeholder={f.ph} value={form[f.k]||""} onChange={(e:any)=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}/></div>
                ))}
              </div>
              <div style={{display:"flex",gap:12,marginTop:12,flexWrap:"wrap"}}>
                {[{k:"selettivo",l:"Selettivo"},{k:"basso_emissivo",l:"Basso emissivo"},{k:"stratificato",l:"Stratificato"},{k:"temperato",l:"Temperato"},{k:"colorato",l:"Colorato/Acidato"}].map(f=>(
                  <div key={f.k} onClick={()=>setForm((p:any)=>({...p,[f.k]:!p[f.k]}))} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                    <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${form[f.k]?TEAL:"#E5E3DC"}`,background:form[f.k]?TEAL:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {form[f.k]&&<Svg path="M20 6L9 17l-5-5" c="#fff" s={11}/>}
                    </div>
                    <span style={{fontSize:12,color:DARK}}>{f.l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><LBL>€ / mq</LBL><INP type="number" placeholder="0" value={form.euroMq||""} onChange={(e:any)=>setForm((p:any)=>({...p,euroMq:parseFloat(e.target.value)||0}))}/></div>
              <div><LBL>Fornitore</LBL><INP placeholder="Es. Saint-Gobain" value={form.fornitore||""} onChange={(e:any)=>setForm((p:any)=>({...p,fornitore:e.target.value}))}/></div>
            </div>
            <div><LBL>Note</LBL><textarea value={form.note||""} onChange={(e:any)=>setForm((p:any)=>({...p,note:e.target.value}))} placeholder="Note tecniche o commerciali..." style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid #E5E3DC`,fontSize:13,fontFamily:FF,background:"#F8F7F2",color:DARK,outline:"none",boxSizing:"border-box",minHeight:60,resize:"vertical"}}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:`1px solid #E5E3DC`}}>
              <div onClick={()=>setModal(null)} style={{padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid #E5E3DC`,color:"#86868b"}}>Annulla</div>
              <div onClick={save} style={{padding:"9px 22px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",background:TEAL,color:"#fff"}}>Salva vetro</div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// ARCHIVIO COLORI
// ═══════════════════════════════════════════════════════════════
function ArchivioColori({coloriDB,setColoriDB}:any){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState<any>({});
  const [search,setSearch]=useState("");
  const [filtroTipo,setFiltroTipo]=useState("tutti");

  const tipi=["tutti","Standard","RAL","Wood","Metallizzato","Speciale"];
  const filtered=(coloriDB||[]).filter((c:any)=>{
    const matchSearch=!search||[c.code,c.nome].some((x:string)=>x?.toLowerCase().includes(search.toLowerCase()));
    const matchTipo=filtroTipo==="tutti"||c.tipo===filtroTipo;
    return matchSearch&&matchTipo;
  });

  const save=()=>{
    if(!form.code){alert("Inserisci un codice colore");return;}
    const exists=(coloriDB||[]).find((x:any)=>x.id===form.id);
    if(exists) setColoriDB?.((p:any[])=>p.map((x:any)=>x.id===form.id?form:x));
    else setColoriDB?.((p:any[])=>[...(p||[]),{...form,id:"C-"+Date.now()}]);
    setModal(false);
  };

  return (
    <>
      <Sez title="Archivio colori" sub={`${(coloriDB||[]).length} colori configurati`} action={{label:"Nuovo colore",fn:()=>{setForm({code:"",nome:"",hex:"#FFFFFF",tipo:"Standard",sovrapprezzo:0,note:""});setModal(true);}}}>
        <div style={{padding:"10px 14px",borderBottom:`1px solid #F2F1EC`,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#F8F7F2",borderRadius:8,border:`1px solid #E5E3DC`}}>
            <Svg path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" c="#86868b" s={13}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca codice RAL, nome..." style={{border:"none",background:"transparent",fontSize:13,color:DARK,outline:"none",width:"100%",fontFamily:FF}}/>
          </div>
          <div style={{display:"flex",gap:4}}>
            {tipi.map(t=>(
              <div key={t} onClick={()=>setFiltroTipo(t)} style={{padding:"5px 10px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",background:filtroTipo===t?DARK:"transparent",color:filtroTipo===t?"#fff":"#86868b",border:`1px solid ${filtroTipo===t?DARK:"#E5E3DC"}`}}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:1}}>
          {filtered.map((c:any)=>(
            <div key={c.id||c.code} style={{padding:"12px 14px",background:"#fff",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid #F2F1EC`,cursor:"pointer"}}
              onMouseEnter={e=>((e.currentTarget as any).style.background="#F8F7F2")}
              onMouseLeave={e=>((e.currentTarget as any).style.background="#fff")}>
              <div style={{width:36,height:36,borderRadius:9,background:c.hex||"#ccc",flexShrink:0,border:`1px solid rgba(0,0,0,0.08)`}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:DARK}}>{c.code||c.nome}</div>
                <div style={{fontSize:11,color:"#86868b"}}>{c.nome||c.hex||""}</div>
                {c.sovrapprezzo>0&&<div style={{fontSize:10,color:AMB,fontWeight:600}}>+{c.sovrapprezzo}%</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <div onClick={()=>{setForm({...c});setModal(true);}} style={{color:BLU,cursor:"pointer"}}><Svg path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" c={BLU} s={13}/></div>
                <div onClick={()=>{if(confirm("Eliminare?"))setColoriDB?.((p:any[])=>p.filter((x:any)=>x.id!==c.id&&x.code!==c.code));}} style={{color:RED,cursor:"pointer"}}><Svg path="M6 18L18 6M6 6l12 12" c={RED} s={13}/></div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length===0&&<div style={{padding:"36px",textAlign:"center",color:"#86868b",fontSize:14}}>Nessun colore</div>}
      </Sez>

      {modal&&(
        <Modal title={form.id&&(coloriDB||[]).find((x:any)=>x.id===form.id)?"Modifica colore":"Nuovo colore"} onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              <div>
                <LBL>Anteprima</LBL>
                <div style={{width:72,height:72,borderRadius:12,background:form.hex||"#fff",border:`1px solid #E5E3DC`}}/>
              </div>
              <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><LBL>Codice (es. RAL 9016)</LBL><INP placeholder="RAL 9016" value={form.code||""} onChange={(e:any)=>setForm((p:any)=>({...p,code:e.target.value}))}/></div>
                <div><LBL>Nome</LBL><INP placeholder="Bianco traffico" value={form.nome||""} onChange={(e:any)=>setForm((p:any)=>({...p,nome:e.target.value}))}/></div>
                <div><LBL>Colore HEX</LBL><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={form.hex||"#ffffff"} onChange={(e:any)=>setForm((p:any)=>({...p,hex:e.target.value}))} style={{width:44,height:36,border:"none",cursor:"pointer",borderRadius:6}}/><INP placeholder="#FFFFFF" value={form.hex||""} onChange={(e:any)=>setForm((p:any)=>({...p,hex:e.target.value}))}/></div></div>
                <div><LBL>Tipo</LBL>
                  <SEL value={form.tipo||"Standard"} onChange={(e:any)=>setForm((p:any)=>({...p,tipo:e.target.value}))}>
                    <option>Standard</option><option>RAL</option><option>Wood</option><option>Metallizzato</option><option>Speciale</option>
                  </SEL>
                </div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><LBL>Sovrapprezzo %</LBL><INP type="number" placeholder="0" value={form.sovrapprezzo||""} onChange={(e:any)=>setForm((p:any)=>({...p,sovrapprezzo:parseFloat(e.target.value)||0}))}/></div>
              <div><LBL>Disponibile su sistemi</LBL><INP placeholder="Tutti / Aluplast / Schüco..." value={form.sistemi||""} onChange={(e:any)=>setForm((p:any)=>({...p,sistemi:e.target.value}))}/></div>
            </div>
            <div><LBL>Note</LBL><INP placeholder="Note colore..." value={form.note||""} onChange={(e:any)=>setForm((p:any)=>({...p,note:e.target.value}))}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:`1px solid #E5E3DC`}}>
              <div onClick={()=>setModal(false)} style={{padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid #E5E3DC`,color:"#86868b"}}>Annulla</div>
              <div onClick={save} style={{padding:"9px 22px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",background:TEAL,color:"#fff"}}>Salva colore</div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// ARCHIVIO ACCESSORI (coprifili, lamiere, tapparelle, ecc.)
// ═══════════════════════════════════════════════════════════════
function ArchivioAccessori({db,setDb,titolo,categoria}:any){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState<any>({});
  const [search,setSearch]=useState("");

  const items=(db||[]).filter((a:any)=>!search||[a.codice,a.nome,a.descrizione].some((x:string)=>x?.toLowerCase().includes(search.toLowerCase())));

  const save=()=>{
    if(!form.nome){alert("Inserisci un nome");return;}
    const exists=(db||[]).find((x:any)=>x.id===form.id);
    if(exists) setDb?.((p:any[])=>p.map((x:any)=>x.id===form.id?form:x));
    else setDb?.((p:any[])=>[...(p||[]),{...form,id:categoria+"-"+Date.now()}]);
    setModal(false);
  };

  return (
    <>
      <Sez title={titolo} sub={`${(db||[]).length} elementi`} action={{label:`Aggiungi`,fn:()=>{setForm({categoria,nome:"",codice:"",descrizione:"",prezzo:0,prezzoInstall:0,unita:"pz",note:"",attivo:true});setModal(true);}}}>
        <div style={{padding:"10px 14px",borderBottom:`1px solid #F2F1EC`,display:"flex",gap:8}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#F8F7F2",borderRadius:8,border:`1px solid #E5E3DC`}}>
            <Svg path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" c="#86868b" s={13}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Cerca ${titolo.toLowerCase()}...`} style={{border:"none",background:"transparent",fontSize:13,color:DARK,outline:"none",width:"100%",fontFamily:FF}}/>
          </div>
        </div>
        {items.map((a:any)=>(
          <div key={a.id} style={{padding:"12px 18px",borderBottom:`1px solid #F2F1EC`,display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <span style={{fontSize:13,fontWeight:700,color:DARK}}>{a.nome}</span>
                {a.codice&&<span style={{fontSize:11,color:"#86868b"}}>#{a.codice}</span>}
                {!a.attivo&&badge(RED+"12",RED,"Disattivo")}
              </div>
              {a.descrizione&&<div style={{fontSize:12,color:"#86868b"}}>{a.descrizione}</div>}
              <div style={{display:"flex",gap:8,marginTop:4}}>
                {a.prezzo>0&&badge(TEAL+"12",TEAL,`€${a.prezzo}/${a.unita||"pz"}`)}
                {a.prezzoInstall>0&&badge(AMB+"12",AMB,`+€${a.prezzoInstall} install.`)}
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <div onClick={()=>{setForm({...a});setModal(true);}} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:BLU+"12",color:BLU}}>Modifica</div>
              <div onClick={()=>{if(confirm("Eliminare?"))setDb?.((p:any[])=>p.filter((x:any)=>x.id!==a.id));}} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:RED+"12",color:RED}}>Elimina</div>
            </div>
          </div>
        ))}
        {items.length===0&&<div style={{padding:"32px",textAlign:"center",color:"#86868b",fontSize:14}}>Nessun elemento — aggiungine uno</div>}
      </Sez>

      {modal&&(
        <Modal title={form.id&&(db||[]).find((x:any)=>x.id===form.id)?`Modifica ${titolo}`:`Nuovo elemento`} onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><LBL>Nome *</LBL><INP placeholder="Nome elemento" value={form.nome||""} onChange={(e:any)=>setForm((p:any)=>({...p,nome:e.target.value}))}/></div>
              <div><LBL>Codice / SKU</LBL><INP placeholder="Codice articolo" value={form.codice||""} onChange={(e:any)=>setForm((p:any)=>({...p,codice:e.target.value}))}/></div>
              <div><LBL>Prezzo €</LBL><INP type="number" placeholder="0" value={form.prezzo||""} onChange={(e:any)=>setForm((p:any)=>({...p,prezzo:parseFloat(e.target.value)||0}))}/></div>
              <div><LBL>Unità</LBL>
                <SEL value={form.unita||"pz"} onChange={(e:any)=>setForm((p:any)=>({...p,unita:e.target.value}))}>
                  <option value="pz">Pezzo</option><option value="ml">Metro lineare</option><option value="mq">Metro quadro</option><option value="set">Set</option>
                </SEL>
              </div>
              <div><LBL>Prezzo installazione €</LBL><INP type="number" placeholder="0" value={form.prezzoInstall||""} onChange={(e:any)=>setForm((p:any)=>({...p,prezzoInstall:parseFloat(e.target.value)||0}))}/></div>
              <div><LBL>Fornitore</LBL><INP placeholder="Fornitore" value={form.fornitore||""} onChange={(e:any)=>setForm((p:any)=>({...p,fornitore:e.target.value}))}/></div>
            </div>
            <div><LBL>Descrizione</LBL><textarea value={form.descrizione||""} onChange={(e:any)=>setForm((p:any)=>({...p,descrizione:e.target.value}))} placeholder="Descrizione, caratteristiche..." style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid #E5E3DC`,fontSize:13,fontFamily:FF,background:"#F8F7F2",color:DARK,outline:"none",boxSizing:"border-box",minHeight:60,resize:"vertical"}}/></div>
            <div><LBL>Note interne</LBL><INP placeholder="Note..." value={form.note||""} onChange={(e:any)=>setForm((p:any)=>({...p,note:e.target.value}))}/></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div onClick={()=>setForm((p:any)=>({...p,attivo:!p.attivo}))} style={{width:36,height:20,borderRadius:10,background:form.attivo!==false?TEAL:"#E5E3DC",cursor:"pointer",position:"relative",transition:"background .2s"}}>
                <div style={{position:"absolute",top:2,left:form.attivo!==false?17:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
              </div>
              <span style={{fontSize:13,color:DARK}}>Attivo nel configuratore</span>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:`1px solid #E5E3DC`}}>
              <div onClick={()=>setModal(false)} style={{padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid #E5E3DC`,color:"#86868b"}}>Annulla</div>
              <div onClick={save} style={{padding:"9px 22px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",background:TEAL,color:"#fff"}}>Salva</div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DesktopSettings(){
  const ctx=useMastro() as any;
  const {settingsTab,setSettingsTab,
    aziendaInfo,setAziendaInfo,
    sistemiDB,setSistemiDB,
    coloriDB,setColoriDB,
    vetriDB,setVetriDB,
    coprifiliDB,setCoprifiliDB,
    lamiereDB,setLamiereDB,
    tapparelleDB,setTapparelleDB,
    persianeDB,setPersianeDB,
    zanzariere,setZanzariere,
    controtelaioDb,setControtelaioDb,
    cassonettiDB,setCassonettiDB,
    pipelineDB,setPipelineDB,
    team,setTeam,squadreDB,setSquadreDB,
    cantieri,tasks,fattureDB,
    theme,setTheme,
  }=ctx;

  const active=settingsTab||"generali";

  const renderContent=()=>{
    switch(active){

      case "profili": return <ArchivioProfili sistemiDB={sistemiDB} setSistemiDB={setSistemiDB} coloriDB={coloriDB}/>;
      case "nodi":    return <ArchivioNodi nodiDB={ctx.nodiDB||[]} setNodiDB={ctx.setNodiDB||((fn:any)=>{})} sistemiDB={sistemiDB}/>;
      case "vetri":   return <ArchivioVetri vetriDB={vetriDB} setVetriDB={setVetriDB}/>;
      case "colori":  return <ArchivioColori coloriDB={coloriDB} setColoriDB={setColoriDB}/>;

      case "accessori": return (
        <div>
          <div style={{marginBottom:16,display:"flex",gap:8,flexWrap:"wrap"}}>
            {[{id:"coprifili",l:"Coprifili"},{id:"lamiere",l:"Lamiere"},{id:"tapparella",l:"Tapparelle"},{id:"persiana",l:"Persiane"},{id:"zanzariera",l:"Zanzariere"},{id:"controtelaio",l:"Controtelaio"},{id:"cassonetto",l:"Cassonetti"}].map(t=>(
              <div key={t.id} onClick={()=>setSettingsTab(t.id)} style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:active===t.id?DARK:"#fff",color:active===t.id?"#fff":"#86868b",border:`1px solid ${active===t.id?DARK:"#E5E3DC"}`}}>{t.l}</div>
            ))}
          </div>
          <div style={{padding:"32px",textAlign:"center",color:"#86868b",fontSize:14,background:"#fff",borderRadius:12,border:`1px solid #E5E3DC`}}>Seleziona un tipo di accessorio sopra</div>
        </div>
      );

      case "coprifili":   return <ArchivioAccessori db={coprifiliDB} setDb={setCoprifiliDB} titolo="Coprifili" categoria="coprifilo"/>;
      case "lamiere":     return <ArchivioAccessori db={lamiereDB} setDb={setLamiereDB} titolo="Lamiere" categoria="lamiera"/>;
      case "tapparella":  return <ArchivioAccessori db={tapparelleDB||[]} setDb={setTapparelleDB} titolo="Tapparelle" categoria="tapparella"/>;
      case "persiana":    return <ArchivioAccessori db={persianeDB||[]} setDb={setPersianeDB} titolo="Persiane" categoria="persiana"/>;
      case "zanzariera":  return <ArchivioAccessori db={zanzariere||[]} setDb={setZanzariere} titolo="Zanzariere" categoria="zanzariera"/>;
      case "controtelaio":return <ArchivioAccessori db={controtelaioDb||[]} setDb={setControtelaioDb} titolo="Controtelaio" categoria="controtelaio"/>;
      case "cassonetto":  return <ArchivioAccessori db={cassonettiDB||[]} setDb={setCassonettiDB} titolo="Cassonetti" categoria="cassonetto"/>;

      case "generali": return (
        <div>
          <Sez title="Dati azienda">
            <div style={{padding:"18px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[{l:"Nome azienda",k:"nome",ph:"Walter Cozza Serramenti"},{l:"Ragione sociale",k:"ragione",ph:"Walter Cozza Serramenti SRL"},{l:"Partita IVA",k:"piva",ph:"IT12345678901"},{l:"Codice fiscale",k:"cf",ph:""},{l:"Telefono",k:"telefono",ph:"+39 0984 000000"},{l:"Email",k:"email",ph:"info@azienda.it"},{l:"PEC",k:"pec",ph:"azienda@pec.it"},{l:"Sito web",k:"web",ph:"www.azienda.it"}].map(f=>(
                <div key={f.k}><LBL>{f.l}</LBL><INP placeholder={f.ph} value={aziendaInfo?.[f.k]||""} onChange={(e:any)=>setAziendaInfo?.((p:any)=>({...p,[f.k]:e.target.value}))}/></div>
              ))}
              <div style={{gridColumn:"1/-1"}}><LBL>Indirizzo</LBL><INP placeholder="Via, CAP, Città" value={aziendaInfo?.indirizzo||""} onChange={(e:any)=>setAziendaInfo?.((p:any)=>({...p,indirizzo:e.target.value}))}/></div>
            </div>
          </Sez>
          <Sez title="Impostazioni operative">
            <div style={{padding:"18px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[{l:"Soglia commesse ferme (giorni)",k:"sogliaDays",ph:"7"},{l:"IVA default %",k:"ivaDefault",ph:"10"},{l:"Margine target %",k:"margineTarget",ph:"35"},{l:"Sconto max %",k:"scontoMax",ph:"20"}].map(f=>(
                <div key={f.k}><LBL>{f.l}</LBL><INP type="number" placeholder={f.ph} value={aziendaInfo?.[f.k]||""} onChange={(e:any)=>setAziendaInfo?.((p:any)=>({...p,[f.k]:e.target.value}))}/></div>
              ))}
            </div>
          </Sez>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[{l:"Commesse",v:cantieri?.length||0,c:TEAL},{l:"Vani totali",v:(cantieri||[]).reduce((s:number,c:any)=>s+(c.vani||[]).length,0),c:BLU},{l:"Task aperte",v:(tasks||[]).filter((t:any)=>!t.done).length,c:AMB}].map((k,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:10,padding:"14px 16px",border:`1px solid #E5E3DC`}}>
                <div style={{fontSize:11,color:"#86868b",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{k.l}</div>
                <div style={{fontSize:28,fontWeight:800,color:k.c,fontFamily:FM,marginTop:4}}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>
      );

      case "pipeline": return (
        <Sez title="Pipeline fasi" sub="Trascina per riordinare, configura gate e notifiche">
          {(pipelineDB||[]).map((p:any,i:number)=>{
            const col=p.color||TEAL;
            return (
              <div key={p.id} style={{padding:"14px 18px",borderBottom:`1px solid #F2F1EC`,display:"flex",alignItems:"center",gap:12}}>
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  <div onClick={()=>{if(i===0)return;const a=[...pipelineDB];[a[i-1],a[i]]=[a[i],a[i-1]];setPipelineDB?.(a);}} style={{cursor:i===0?"default":"pointer",opacity:i===0?.2:1,color:"#86868b",fontSize:10}}>▲</div>
                  <div onClick={()=>{if(i===pipelineDB.length-1)return;const a=[...pipelineDB];[a[i],a[i+1]]=[a[i+1],a[i]];setPipelineDB?.(a);}} style={{cursor:i===pipelineDB.length-1?"default":"pointer",opacity:i===pipelineDB.length-1?.2:1,color:"#86868b",fontSize:10}}>▼</div>
                </div>
                <div style={{width:10,height:10,borderRadius:"50%",background:col,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:DARK}}>{p.nome||p.id}</div>
                  <div style={{display:"flex",gap:6,marginTop:4}}>
                    {(p.gateRequisiti||[]).length>0&&badge(RED+"12",RED,`⛔ ${p.gateRequisiti.length} gate`)}
                    {p.gateBloccante&&badge(RED+"20",RED,"Bloccante")}
                    {(p.automazioni||[]).length>0&&badge(PUR+"12",PUR,`⚡ ${p.automazioni.length} auto`)}
                    {p.emailTemplate&&badge(BLU+"12",BLU,"Email")}
                  </div>
                </div>
                <div onClick={()=>setPipelineDB?.((db:any[])=>db.map((x:any,j:number)=>j===i?{...x,attiva:!x.attiva}:x))} style={{width:38,height:22,borderRadius:11,background:p.attiva!==false?TEAL:"#E5E3DC",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:p.attiva!==false?18:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                </div>
              </div>
            );
          })}
        </Sez>
      );

      case "temi": return (
        <Sez title="Tema interfaccia">
          <div style={{padding:"18px",display:"flex",gap:12}}>
            {["chiaro","scuro","oceano"].map(t=>(
              <div key={t} onClick={()=>setTheme?.(t)} style={{flex:1,padding:"18px",borderRadius:10,border:`2px solid ${theme===t?TEAL:"#E5E3DC"}`,cursor:"pointer",textAlign:"center",background:theme===t?TEAL+"08":"#fff",transition:"all .15s"}}>
                <div style={{fontSize:28,marginBottom:8}}>{t==="chiaro"?"☀️":t==="scuro"?"🌙":"🌊"}</div>
                <div style={{fontSize:13,fontWeight:700,color:theme===t?TEAL:DARK,textTransform:"capitalize"}}>{t}</div>
              </div>
            ))}
          </div>
        </Sez>
      );

      case "reset": return (
        <Sez title="Zona reset" sub="Operazioni irreversibili">
          <div style={{padding:"18px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{padding:"14px",borderRadius:10,border:`1px solid ${AMB}40`,background:AMB+"06"}}>
              <div style={{fontSize:13,fontWeight:700,color:AMB,marginBottom:4}}>Ricarica dati demo</div>
              <div style={{fontSize:12,color:"#86868b",marginBottom:10}}>4 clienti demo con dati completi per testare il flusso.</div>
              <div onClick={()=>{if(!confirm("Ricaricare i dati demo?"))return;}} style={{padding:"8px 16px",borderRadius:8,background:AMB,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-block"}}>Ricarica dati demo</div>
            </div>
            <div style={{padding:"14px",borderRadius:10,border:`1px solid ${RED}40`,background:RED+"06"}}>
              <div style={{fontSize:13,fontWeight:700,color:RED,marginBottom:4}}>Pulisci tutto</div>
              <div style={{fontSize:12,color:"#86868b",marginBottom:10}}>Elimina tutti i dati. Irreversibile.</div>
              <div onClick={()=>{if(!confirm("ATTENZIONE: eliminare tutti i dati?"))return;if(!confirm("ULTIMA CONFERMA?"))return;localStorage.removeItem("mastro_erp_data");window.location.reload();}} style={{padding:"8px 16px",borderRadius:8,background:RED,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-block"}}>Pulisci tutto</div>
            </div>
          </div>
        </Sez>
      );

      default: return (
        <div style={{padding:"40px",textAlign:"center",color:"#86868b",fontSize:14,background:"#fff",borderRadius:12,border:`1px solid #E5E3DC`}}>Sezione in sviluppo</div>
      );
    }
  };

  return (
    <div style={{display:"flex",height:"100%",background:"#F2F1EC",fontFamily:FF}}>
      {/* SIDEBAR */}
      <div style={{width:216,flexShrink:0,background:"#fff",borderRight:`1px solid #E5E3DC`,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{padding:"14px 16px 6px",fontSize:9,fontWeight:800,color:"#C0C0C5",textTransform:"uppercase",letterSpacing:1.5}}>Impostazioni</div>
        {NAV.map(section=>(
          <div key={section.group} style={{marginBottom:2}}>
            <div style={{padding:"8px 16px 2px",fontSize:9,fontWeight:800,color:"#C0C0C5",textTransform:"uppercase",letterSpacing:1.2}}>{section.group}</div>
            {section.items.map(item=>{
              const on=active===item.id;
              return (
                <div key={item.id} onClick={()=>setSettingsTab?.(item.id)}
                  style={{display:"flex",alignItems:"center",gap:9,padding:"7px 14px 7px 12px",cursor:"pointer",background:on?TEAL+"10":"transparent",borderLeft:`3px solid ${on?TEAL:"transparent"}`,transition:"background .1s"}}
                  onMouseEnter={e=>!on&&((e.currentTarget as any).style.background="#F8F7F2")}
                  onMouseLeave={e=>!on&&((e.currentTarget as any).style.background="transparent")}>
                  <Svg path={item.icon} c={on?TEAL:"#86868b"} s={14}/>
                  <span style={{fontSize:13,fontWeight:on?700:400,color:on?TEAL:DARK}}>{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* CONTENUTO */}
      <div style={{flex:1,overflowY:"auto",padding:"22px 26px"}}>
        {renderContent()}
      </div>
    </div>
  );
}
