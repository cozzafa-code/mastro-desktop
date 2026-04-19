// ═══════════════════════════════════════════════════════════════════
// MASTRO ERP — TendeSoleDetailPanel.tsx
// Form misure completo per settore TENDE DA SOLE
// Basato su catalogo MastroTendeSole (9 tipologie + tessuti + sensori + SVG)
//
// INTEGRAZIONE:
// In VanoSectorRouter.tsx:
//   import TendeSoleDetailPanel from "./TendeSoleDetailPanel";
//   case "tendesole": return <TendeSoleDetailPanel vano={vano} onUpdate={updateField} onBack={onBack} />;
//
// CAMPI SALVATI:
// tipologia, misure.lCentro, sporgenza, altezza, hMontaggio
// tessutoTipo, tessutoColore, trasparenza, volant
// strutMat, strutCol, cassonetto
// comando, sensore, accessori[]
// montaggio, aggancio, inclinazione
// note, foto.fronte, foto.retro, foto.dettaglio
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { captureFotoVano, captureFotoSimple } from "@/lib/vano-foto-uploader";

const T={bg:"#F2F1EC",card:"#FFFFFF",topbar:"#1A1A1C",acc:"#D08008",text:"#1A1A1C",sub:"#8E8E93",bdr:"#E5E4DF",green:"#1A9E73",red:"#DC4444",blue:"#3B7FE0"};
const FF="'Inter', system-ui, sans-serif";
const FM="'JetBrains Mono', monospace";
const SOLE_COLOR="#b45309";

// ═══ CATALOGO ═══
const TIPOLOGIE=[
  {id:"bracci",nome:"A bracci estensibili",desc:"Classica, bracci articolati"},
  {id:"bracci-cassonetto",nome:"A bracci con cassonetto",desc:"Bracci + cassonetto protettivo"},
  {id:"caduta",nome:"A caduta",desc:"Verticale con guide laterali"},
  {id:"caduta-bracci",nome:"A caduta con braccetti",desc:"Verticale con braccetti a molla"},
  {id:"cappottina",nome:"Cappottina",desc:"Forma curva, vetrine e balconi"},
  {id:"pergotenda",nome:"Pergotenda",desc:"Struttura autoportante, copertura orizzontale"},
  {id:"pergola-bio",nome:"Pergola bioclimatica",desc:"Lamelle orientabili alluminio"},
  {id:"vela",nome:"Vela ombreggiante",desc:"Triangolare/quadrata, tensionata"},
  {id:"zip-ext",nome:"ZIP screen esterno",desc:"Oscurante guidato, antivento"},
];
const TESSUTI_TIPO=["Acrilico tinto massa","Poliestere spalmato","PVC microforato","Soltis 92 (screen)","Soltis 86 (blackout)","Dickson Orchestra","Tempotest Parà"];
const TESSUTI_COLORE=["Bianco","Avorio","Beige","Grigio chiaro","Grigio scuro","Tortora","Sabbia","Bordeaux","Blu navy","Verde bosco","Arancione","Rosso","Rigato classico","Rigato moderno","Fantasia","Da campionario"];
const STRUTTURA_MAT=["Alluminio verniciato","Alluminio anodizzato","Acciaio zincato verniciato","Legno lamellare"];
const STRUTTURA_COL=["Bianco RAL 9010","Avorio RAL 1013","Grigio RAL 7035","Antracite RAL 7016","Marrone RAL 8017","Nero RAL 9005","Corten effect","Effetto legno","RAL custom"];
const COMANDO=["Arganello manuale","Manovella (asta)","Motore tubolare Ø45","Motore tubolare Ø60","Motore radio Somfy","Motore radio Nice","Motore WiFi/App","Motore solare"];
const MONTAGGIO=["Parete frontale","Parete sotto trave","Soffitto","Tetto (staffe inclinate)","Dentro nicchia","Su cassonetto tapparella"];
const CASSONETTO_TIPO=["Nessuno (aperto)","Semicassonetto","Cassonetto integrale","Cassonetto a scomparsa"];
const SENSORI=["Nessuno","Sensore vento","Sensore sole","Sensore vento+sole","Sensore vento+sole+pioggia","Stazione meteo completa"];
const ACCESSORI_TENDA=["Telecomando mono","Telecomando multi","Timer programmabile","Centralina domotica","Led integrato barra","Led integrato cassonetto","Volant frontale","Volant con guide"];
const AGGANCIO=["Frontale a muro","A soffitto diretto","Su staffa regolabile","Dentro nicchia","Su trave legno","Su struttura acciaio"];
const MISURE_BRACCI=[{l:300,s:200,lb:"300×200"},{l:400,s:250,lb:"400×250"},{l:500,s:300,lb:"500×300"},{l:600,s:350,lb:"600×350"},{l:400,s:200,lb:"400×200"}];
const MISURE_CADUTA=[{l:100,h:200,lb:"100×200"},{l:150,h:200,lb:"150×200"},{l:200,h:250,lb:"200×250"},{l:250,h:300,lb:"250×300"},{l:300,h:300,lb:"300×300"}];

// ═══ UI ═══
const Chip=({label,sel,color,onTap,small}:any)=><div onClick={onTap} style={{padding:small?"5px 10px":"7px 13px",borderRadius:9,border:`1.5px solid ${sel?color||SOLE_COLOR:T.bdr}`,background:sel?(color||SOLE_COLOR)+"14":T.card,fontSize:small?10:11,fontWeight:sel?700:500,color:sel?(color||SOLE_COLOR):T.text,cursor:"pointer",transition:"all .12s",fontFamily:FF,userSelect:"none" as any}}>{label}</div>;
const ChipSel=({label,options,value,onChange,color,small}:any)=><div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any,letterSpacing:0.5}}>{label}</div><div style={{display:"flex",gap:4,flexWrap:"wrap" as any}}>{options.map((o:string)=><Chip key={o} label={o} sel={value===o} color={color} onTap={()=>onChange(o)} small={small}/>)}</div></div>;
const ChipMulti=({label,options,value=[],onChange,small}:any)=><div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any,letterSpacing:0.5}}>{label}</div><div style={{display:"flex",gap:4,flexWrap:"wrap" as any}}>{options.map((o:string)=><Chip key={o} label={o} sel={value.includes(o)} onTap={()=>onChange(value.includes(o)?value.filter((x:string)=>x!==o):[...value,o])} small={small}/>)}</div></div>;
const SectionAcc=({icon,title,color,count,open,onToggle}:any)=><div onClick={onToggle} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 0",cursor:"pointer",borderBottom:`1px solid ${T.bdr}`,marginBottom:open?12:0,userSelect:"none" as any}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:13,fontWeight:700,color:color||T.text,flex:1}}>{title}</span>{count>0&&<span style={{fontSize:9,fontWeight:700,background:(color||SOLE_COLOR)+"20",color:color||SOLE_COLOR,padding:"2px 8px",borderRadius:20}}>{count}</span>}<span style={{fontSize:11,color:T.sub,transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▼</span></div>;
const NumInput=({label,value,onChange,unit="mm"}:any)=><div style={{marginBottom:10}}><div style={{fontSize:10,color:T.sub,marginBottom:3,fontWeight:600}}>{label}</div><div style={{display:"flex",alignItems:"center",gap:5}}><input type="number" inputMode="numeric" value={value||""} onChange={(e:any)=>onChange(parseInt(e.target.value)||0)} style={{flex:1,padding:"10px 12px",fontSize:15,fontFamily:FM,fontWeight:600,border:`1.5px solid ${T.bdr}`,borderRadius:9,background:T.card,color:T.text,outline:"none"}}/><span style={{fontSize:10,color:T.sub,background:T.bg,padding:"7px 9px",borderRadius:7,fontWeight:600}}>{unit}</span></div></div>;
const PhotoRow=({foto,onCapture}:any)=><div style={{display:"flex",gap:6,marginTop:10}}>{["fronte","retro","dettaglio"].map(cat=>{const has=foto?.[cat];return(<div key={cat} onClick={()=>onCapture(cat)} style={{flex:1,height:56,borderRadius:10,border:has?`2px solid ${T.green}`:`2px dashed ${T.bdr}`,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",cursor:"pointer",background:has?T.green+"08":T.card,overflow:"hidden",position:"relative" as any}}>{has?<img src={has} style={{width:"100%",height:"100%",objectFit:"cover" as any}} alt=""/>:<><span style={{fontSize:16}}>📷</span><span style={{fontSize:8,color:T.sub,fontWeight:600}}>{cat==="fronte"?"Foto facciata":cat==="retro"?"Schizzo":"Dettaglio"}</span></>}</div>)})}</div>;

// ═══ TENDA DRAWING SVG ═══
const TendaDraw=({d}:any)=>{
  const tipo=d.tipologia||"";const isBracci=tipo.includes("bracci");
  const isCaduta=tipo.includes("caduta")||tipo.includes("zip");const isCapp=tipo==="cappottina";
  const isPerg=tipo.includes("pergol")||tipo.includes("pergotenda");const isVela=tipo==="vela";
  const larg=d.larghezza||"—";const sporg=d.sporgenza||"—";const alt=d.altezza||"—";
  const hasCass=d.cassonetto&&d.cassonetto!=="Nessuno (aperto)";
  return(
    <div style={{background:T.card,borderRadius:12,border:`1.5px solid ${T.bdr}`,padding:"12px 8px 6px",marginBottom:14}}>
      <div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6,textAlign:"center" as any}}>Vista {isBracci||isPerg?"laterale":"frontale"}</div>
      <svg width="100%" viewBox="0 0 240 160" style={{maxHeight:200}}>
        {isBracci&&<>
          <rect x="10" y="10" width="18" height="130" fill="#e8e6e1" stroke="#ccc" strokeWidth="0.8"/>
          {hasCass&&<rect x="28" y="18" width="30" height="16" rx="4" fill={SOLE_COLOR+"22"} stroke={SOLE_COLOR} strokeWidth="1"/>}
          <rect x="28" y={hasCass?22:20} width="8" height="8" rx="4" fill={SOLE_COLOR+"44"} stroke={SOLE_COLOR} strokeWidth="0.8"/>
          <path d={`M36 ${hasCass?26:24} Q120 20 200 ${hasCass?34:32} L200 44 Q120 38 36 44 Z`} fill={SOLE_COLOR+"15"} stroke={SOLE_COLOR+"55"} strokeWidth="0.8"/>
          <path d={`M38 38 Q90 60 190 42`} fill="none" stroke={SOLE_COLOR} strokeWidth="1.5"/>
          <path d={`M38 42 Q90 80 190 46`} fill="none" stroke={SOLE_COLOR+"88"} strokeWidth="1"/>
          <rect x="190" y="30" width="6" height="20" rx="2" fill={SOLE_COLOR+"44"} stroke={SOLE_COLOR} strokeWidth="0.8"/>
          <line x1="36" y1="80" x2="196" y2="80" stroke={T.sub} strokeWidth="0.5"/>
          <text x="116" y="92" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={SOLE_COLOR}>Sporg. {sporg}</text>
          <text x="116" y="110" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={SOLE_COLOR}>Larg. {larg}</text>
        </>}
        {isCaduta&&<>
          <rect x="30" y="5" width="180" height="10" rx="2" fill="#e8e6e1" stroke="#ccc" strokeWidth="0.8"/>
          {hasCass&&<rect x="40" y="15" width="160" height="14" rx="3" fill={SOLE_COLOR+"22"} stroke={SOLE_COLOR} strokeWidth="1"/>}
          <rect x="45" y={hasCass?29:18} width="150" height="90" rx="1" fill={SOLE_COLOR+"0c"} stroke={SOLE_COLOR+"44"} strokeWidth="0.8"/>
          {tipo.includes("zip")&&<><rect x="42" y={hasCass?29:18} width="4" height="92" rx="1" fill={SOLE_COLOR+"33"}/><rect x="194" y={hasCass?29:18} width="4" height="92" rx="1" fill={SOLE_COLOR+"33"}/></>}
          <rect x="43" y={hasCass?118:107} width="154" height="4" rx="1.5" fill={SOLE_COLOR+"55"} stroke={SOLE_COLOR} strokeWidth="0.8"/>
          <line x1="45" y1="138" x2="195" y2="138" stroke={T.sub} strokeWidth="0.5"/>
          <text x="120" y="150" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={SOLE_COLOR}>{larg}</text>
          <line x1="215" y1={hasCass?29:18} x2="215" y2={hasCass?120:109} stroke={T.sub} strokeWidth="0.5"/>
          <text x="228" y={hasCass?78:67} textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={SOLE_COLOR} transform={`rotate(-90,228,${hasCass?78:67})`}>{alt}</text>
        </>}
        {isCapp&&<>
          <rect x="40" y="5" width="160" height="8" rx="2" fill="#e8e6e1" stroke="#ccc" strokeWidth="0.8"/>
          <path d="M45 13 Q120 -20 195 13 L195 80 Q120 50 45 80 Z" fill={SOLE_COLOR+"15"} stroke={SOLE_COLOR} strokeWidth="1.5"/>
          <line x1="45" y1="80" x2="45" y2="130" stroke={SOLE_COLOR} strokeWidth="1.5"/>
          <line x1="195" y1="80" x2="195" y2="130" stroke={SOLE_COLOR} strokeWidth="1.5"/>
          <text x="120" y="150" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={SOLE_COLOR}>{larg}</text>
        </>}
        {isPerg&&<>
          <line x1="30" y1="25" x2="30" y2="140" stroke={SOLE_COLOR} strokeWidth="2.5"/>
          <line x1="210" y1="25" x2="210" y2="140" stroke={SOLE_COLOR} strokeWidth="2.5"/>
          <rect x="28" y="22" width="184" height="6" rx="1.5" fill={SOLE_COLOR+"33"} stroke={SOLE_COLOR} strokeWidth="1"/>
          {[0,1,2,3,4,5,6].map(i=><rect key={i} x="34" y={32+i*10} width="172" height="3" rx="0.5" fill={SOLE_COLOR+"33"} transform={`rotate(${tipo.includes("bio")?12:0},120,${33+i*10})`}/>)}
          <text x="120" y="130" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={SOLE_COLOR}>{larg}</text>
          <text x="120" y="142" textAnchor="middle" fontSize="8" fill={T.sub}>Sporg. {sporg}</text>
        </>}
        {isVela&&<>
          <path d="M30 30 L210 20 L150 130 Z" fill={SOLE_COLOR+"12"} stroke={SOLE_COLOR} strokeWidth="1.5"/>
          <circle cx="30" cy="30" r="4" fill={SOLE_COLOR}/><circle cx="210" cy="20" r="4" fill={SOLE_COLOR}/><circle cx="150" cy="130" r="4" fill={SOLE_COLOR}/>
          <text x="120" y="150" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={SOLE_COLOR}>{larg}</text>
        </>}
        {!tipo&&<text x="120" y="80" textAnchor="middle" fontSize="11" fill={T.sub}>Seleziona una tipologia</text>}
      </svg>
    </div>
  );
};

// ═══ TIPO THUMBNAIL ═══
const TipoThumb=({id,size=48}:{id:string;size?:number})=>{
  const s=size;const C=SOLE_COLOR;
  const thumbs:Record<string,JSX.Element>={
    "bracci":<svg width={s} height={s} viewBox="0 0 56 56"><rect x="4" y="8" width="48" height="5" rx="2" fill={C+"44"} stroke={C} strokeWidth="0.8"/><path d="M8 13 Q28 20 48 13 L48 24 Q28 18 8 24 Z" fill={C+"18"}/><path d="M10 20 Q24 34 44 22" fill="none" stroke={C} strokeWidth="1.2"/></svg>,
    "bracci-cassonetto":<svg width={s} height={s} viewBox="0 0 56 56"><rect x="4" y="6" width="48" height="10" rx="3" fill={C+"33"} stroke={C} strokeWidth="0.8"/><path d="M8 16 Q28 22 48 16 L48 28 Q28 22 8 28 Z" fill={C+"18"}/><path d="M10 24 Q24 38 44 26" fill="none" stroke={C} strokeWidth="1.2"/></svg>,
    "caduta":<svg width={s} height={s} viewBox="0 0 56 56"><rect x="12" y="6" width="32" height="4" rx="1.5" fill={C+"44"}/><rect x="14" y="10" width="28" height="32" rx="1" fill={C+"12"} stroke={C+"44"} strokeWidth="0.6"/><line x1="14" y1="42" x2="42" y2="42" stroke={C} strokeWidth="1.5"/></svg>,
    "caduta-bracci":<svg width={s} height={s} viewBox="0 0 56 56"><rect x="12" y="6" width="32" height="4" rx="1.5" fill={C+"44"}/><rect x="14" y="10" width="28" height="28" rx="1" fill={C+"12"} stroke={C+"44"} strokeWidth="0.6"/><line x1="14" y1="38" x2="14" y2="46" stroke={C} strokeWidth="1.2"/><line x1="42" y1="38" x2="42" y2="46" stroke={C} strokeWidth="1.2"/></svg>,
    "cappottina":<svg width={s} height={s} viewBox="0 0 56 56"><path d="M10 32 Q28 6 46 32" fill={C+"18"} stroke={C} strokeWidth="1.2"/><line x1="10" y1="32" x2="10" y2="46" stroke={C} strokeWidth="1.2"/><line x1="46" y1="32" x2="46" y2="46" stroke={C} strokeWidth="1.2"/></svg>,
    "pergotenda":<svg width={s} height={s} viewBox="0 0 56 56"><line x1="10" y1="12" x2="10" y2="46" stroke={C} strokeWidth="2"/><line x1="46" y1="12" x2="46" y2="46" stroke={C} strokeWidth="2"/><rect x="8" y="10" width="40" height="4" rx="1" fill={C+"33"}/>{[0,1,2].map(i=><rect key={i} x="12" y={18+i*8} width="32" height="2" rx="0.5" fill={C+"33"}/>)}</svg>,
    "pergola-bio":<svg width={s} height={s} viewBox="0 0 56 56"><line x1="10" y1="12" x2="10" y2="46" stroke={C} strokeWidth="2"/><line x1="46" y1="12" x2="46" y2="46" stroke={C} strokeWidth="2"/><rect x="8" y="10" width="40" height="4" rx="1" fill={C+"33"}/>{[0,1,2,3].map(i=><rect key={i} x="12" y={18+i*6} width="32" height="2" rx="0.5" fill={C+"44"} transform={`rotate(15,28,${19+i*6})`}/>)}</svg>,
    "vela":<svg width={s} height={s} viewBox="0 0 56 56"><path d="M10 14 L46 10 L34 44 Z" fill={C+"15"} stroke={C} strokeWidth="1.2"/><circle cx="10" cy="14" r="2" fill={C}/><circle cx="46" cy="10" r="2" fill={C}/><circle cx="34" cy="44" r="2" fill={C}/></svg>,
    "zip-ext":<svg width={s} height={s} viewBox="0 0 56 56"><rect x="10" y="6" width="36" height="5" rx="2" fill={C+"33"}/><rect x="12" y="11" width="32" height="30" rx="1" fill={C+"0c"} stroke={C+"55"} strokeWidth="0.6"/><rect x="10" y="11" width="3" height="30" rx="0.5" fill={C+"44"}/><rect x="43" y="11" width="3" height="30" rx="0.5" fill={C+"44"}/></svg>,
  };
  return thumbs[id]||thumbs["bracci"];
};

// ═══ MAIN ═══
interface TendeSoleDetailPanelProps{vano:any;onUpdate:(f:string,v:any)=>void;onBack:()=>void;aziendaId?:string;cmId?:string;}

export default function TendeSoleDetailPanel({vano,onUpdate,onBack,aziendaId,cmId}:TendeSoleDetailPanelProps){
  const[step,setStep]=useState(0);
  const[sec,setSec]=useState<Record<string,boolean>>({tipo:true,mis:true,tess:false,strut:false,cmd:false,mont:false});
  const tog=(s:string)=>setSec(p=>({...p,[s]:!p[s]}));
  const d=vano||{};const m=d.misure||{};
  const set=useCallback((f:string,v:any)=>{onUpdate(f,v)},[onUpdate]);
  const setM=useCallback((f:string,v:any)=>{onUpdate("misure",{...(d.misure||{}),[f]:v})},[onUpdate,d.misure]);
  const handleFoto=(cat:string)=>{if(aziendaId&&cmId&&d.id){captureFotoVano({aziendaId,cmId,vanoId:String(d.id),categoria:cat},(url)=>set("foto",{...(d.foto||{}),[cat]:url}),(err)=>console.warn("[Foto]",err));} else {captureFotoSimple((url)=>set("foto",{...(d.foto||{}),[cat]:url}));}};

  const isBracci=(d.tipologia||"").includes("bracci");
  const isCaduta=(d.tipologia||"").includes("caduta")||(d.tipologia||"").includes("zip");
  const isPergola=(d.tipologia||"").includes("pergol");

  const tipoC=[d.tipologia].filter(Boolean).length;
  const misC=[m.lCentro,d.sporgenza||d.altezza].filter(Boolean).length;
  const tessC=[d.tessutoTipo,d.tessutoColore].filter(Boolean).length;
  const strutC=[d.strutMat,d.strutCol].filter(Boolean).length;
  const cmdC=[d.comando,d.sensore].filter(Boolean).length;
  const montC=[d.montaggio,d.aggancio,d.cassonetto].filter(Boolean).length;
  const total=tipoC+misC+tessC+strutC+cmdC+montC;
  const totalMax=16;
  const STEPS=["Tipo & Misure","Tessuto & Strut.","Comando & Mont."];

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:FF}}>
      <div style={{background:T.topbar,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky" as any,top:0,zIndex:99}}>
        <div onClick={onBack} style={{width:30,height:30,borderRadius:7,background:"#ffffff15",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:13,color:"#fff"}}>←</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:-0.3}}>☀️ Tenda da Sole — Presa Misure</div>
          <div style={{fontSize:10,color:"#888"}}>{d.nome||"Vano"} · {d.stanza||""}</div>
        </div>
        <div style={{background:total>=totalMax*0.5?T.green+"30":SOLE_COLOR+"30",color:total>=totalMax*0.5?T.green:SOLE_COLOR,padding:"3px 10px",borderRadius:16,fontSize:11,fontWeight:800,fontFamily:FM}}>{total}/{totalMax}</div>
      </div>
      <div style={{height:3,background:T.bdr}}><div style={{height:3,background:total>=totalMax*0.5?T.green:SOLE_COLOR,width:`${(total/totalMax)*100}%`,transition:"width .3s",borderRadius:2}}/></div>
      <div style={{display:"flex",gap:6,padding:"10px 16px",justifyContent:"center"}}>
        {STEPS.map((s,i)=>(<div key={i} onClick={()=>setStep(i)} style={{padding:"5px 14px",borderRadius:20,fontSize:10,fontWeight:700,cursor:"pointer",background:step===i?SOLE_COLOR:T.card,color:step===i?"#fff":T.sub,border:`1px solid ${step===i?SOLE_COLOR:T.bdr}`,transition:"all .15s"}}>{i+1}. {s}</div>))}
      </div>

      <div style={{padding:"4px 16px 100px"}}>
        {step===0&&<>
          {d.tipologia&&<TendaDraw d={{tipologia:d.tipologia,larghezza:m.lCentro,sporgenza:d.sporgenza,altezza:d.altezza,cassonetto:d.cassonetto}}/>}
          <SectionAcc icon="☀️" title="Tipologia tenda" color={SOLE_COLOR} count={tipoC} open={sec.tipo} onToggle={()=>tog("tipo")}/>
          {sec.tipo&&<div>
            <div style={{display:"flex",flexDirection:"column" as any,gap:6}}>
              {TIPOLOGIE.map(t=>(<div key={t.id} onClick={()=>set("tipologia",t.id===d.tipologia?null:t.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:11,border:`1.5px solid ${d.tipologia===t.id?SOLE_COLOR:T.bdr}`,background:d.tipologia===t.id?SOLE_COLOR+"0a":T.card,cursor:"pointer",transition:"all .12s"}}>
                <div style={{width:48,height:48,borderRadius:8,background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><TipoThumb id={t.id}/></div>
                <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:d.tipologia===t.id?SOLE_COLOR:T.text}}>{t.nome}</div><div style={{fontSize:9,color:T.sub,marginTop:1}}>{t.desc}</div></div>
                {d.tipologia===t.id&&<div style={{width:18,height:18,borderRadius:9,background:SOLE_COLOR,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:800}}>✓</div>}
              </div>))}
            </div>
          </div>}
          <SectionAcc icon="📐" title="Misure" color={SOLE_COLOR} count={misC} open={sec.mis} onToggle={()=>tog("mis")}/>
          {sec.mis&&<div>
            {isBracci&&<><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any}}>Misura rapida</div><div style={{display:"flex",gap:4,flexWrap:"wrap" as any,marginBottom:12}}>{MISURE_BRACCI.map(ms=><Chip key={ms.lb} label={ms.lb} sel={m.lCentro===ms.l&&d.sporgenza===ms.s} color={SOLE_COLOR} onTap={()=>{setM("lCentro",ms.l);set("sporgenza",ms.s)}} small/>)}</div></>}
            {isCaduta&&<><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any}}>Misura rapida</div><div style={{display:"flex",gap:4,flexWrap:"wrap" as any,marginBottom:12}}>{MISURE_CADUTA.map(ms=><Chip key={ms.lb} label={ms.lb} sel={m.lCentro===ms.l&&d.altezza===ms.h} color={SOLE_COLOR} onTap={()=>{setM("lCentro",ms.l);set("altezza",ms.h)}} small/>)}</div></>}
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1}}><NumInput label="Larghezza" value={m.lCentro} onChange={(v:number)=>setM("lCentro",v)}/></div>
              <div style={{flex:1}}><NumInput label={isBracci||isPergola?"Sporgenza":"Altezza caduta"} value={isBracci||isPergola?d.sporgenza:d.altezza} onChange={(v:number)=>set(isBracci||isPergola?"sporgenza":"altezza",v)}/></div>
            </div>
            <NumInput label="Altezza montaggio da terra" value={d.hMontaggio} onChange={(v:number)=>set("hMontaggio",v)}/>
            {m.lCentro>600&&isBracci&&<div style={{fontSize:10,color:T.red,background:T.red+"12",border:`1px solid ${T.red}30`,padding:"8px 10px",borderRadius:9,marginBottom:12}}>⚠ Larghezza &gt; 600cm: valutare giunta telo o doppia tenda</div>}
          </div>}
        </>}

        {step===1&&<>
          <SectionAcc icon="🧵" title="Tessuto e telo" color={SOLE_COLOR} count={tessC} open={sec.tess} onToggle={()=>tog("tess")}/>
          {sec.tess&&<div>
            <ChipSel label="Tipo tessuto" options={TESSUTI_TIPO} value={d.tessutoTipo} onChange={(v:string)=>set("tessutoTipo",v)} color={SOLE_COLOR}/>
            <ChipSel label="Colore/Pattern" options={TESSUTI_COLORE} value={d.tessutoColore} onChange={(v:string)=>set("tessutoColore",v)} color={SOLE_COLOR} small/>
            {isCaduta&&<ChipSel label="Trasparenza" options={["Filtrante (vista esterna)","Oscurante","Microforato 5%","Microforato 10%","Blackout totale"]} value={d.trasparenza} onChange={(v:string)=>set("trasparenza",v)} color={SOLE_COLOR} small/>}
            <ChipSel label="Volant" options={["Nessuno","Dritto 20cm","Dritto 30cm","Ondulato","Con guide laterali"]} value={d.volant} onChange={(v:string)=>set("volant",v)} color={SOLE_COLOR} small/>
          </div>}
          <SectionAcc icon="🔧" title="Struttura e finitura" color={SOLE_COLOR} count={strutC} open={sec.strut} onToggle={()=>tog("strut")}/>
          {sec.strut&&<div>
            <ChipSel label="Materiale struttura" options={STRUTTURA_MAT} value={d.strutMat} onChange={(v:string)=>set("strutMat",v)} color={SOLE_COLOR}/>
            <ChipSel label="Colore struttura" options={STRUTTURA_COL} value={d.strutCol} onChange={(v:string)=>set("strutCol",v)} color={SOLE_COLOR} small/>
            <ChipSel label="Cassonetto" options={CASSONETTO_TIPO} value={d.cassonetto} onChange={(v:string)=>set("cassonetto",v)} color={SOLE_COLOR}/>
            {d.cassonetto==="Cassonetto a scomparsa"&&<div style={{fontSize:10,color:T.green,background:T.green+"12",border:`1px solid ${T.green}30`,padding:"8px 10px",borderRadius:9,marginBottom:12}}>✓ Cassonetto a scomparsa: telo completamente protetto, estetica minimale</div>}
          </div>}
        </>}

        {step===2&&<>
          <SectionAcc icon="⚡" title="Comando e automazione" color={SOLE_COLOR} count={cmdC} open={sec.cmd} onToggle={()=>tog("cmd")}/>
          {sec.cmd&&<div>
            <ChipSel label="Tipo comando" options={COMANDO} value={d.comando} onChange={(v:string)=>set("comando",v)} color={SOLE_COLOR}/>
            <ChipSel label="Sensori" options={SENSORI} value={d.sensore} onChange={(v:string)=>set("sensore",v)} color={SOLE_COLOR}/>
            <ChipMulti label="Accessori" options={ACCESSORI_TENDA} value={d.accessori||[]} onChange={(v:string[])=>set("accessori",v)} small/>
            {(d.comando||"").includes("WiFi")&&<div style={{fontSize:10,color:T.blue,background:T.blue+"12",border:`1px solid ${T.blue}30`,padding:"8px 10px",borderRadius:9,marginBottom:12}}>📡 WiFi: compatibile Alexa, Google Home, Apple HomeKit tramite gateway</div>}
            {(d.comando||"").includes("solare")&&<div style={{fontSize:10,color:T.green,background:T.green+"12",border:`1px solid ${T.green}30`,padding:"8px 10px",borderRadius:9,marginBottom:12}}>☀️ Motore solare: nessun cablaggio elettrico necessario</div>}
          </div>}
          <SectionAcc icon="🔨" title="Montaggio e aggancio" color={SOLE_COLOR} count={montC} open={sec.mont} onToggle={()=>tog("mont")}/>
          {sec.mont&&<div>
            <ChipSel label="Posizione montaggio" options={MONTAGGIO} value={d.montaggio} onChange={(v:string)=>set("montaggio",v)} color={SOLE_COLOR}/>
            <ChipSel label="Sistema aggancio" options={AGGANCIO} value={d.aggancio} onChange={(v:string)=>set("aggancio",v)} color={SOLE_COLOR}/>
            {d.montaggio==="Tetto (staffe inclinate)"&&<NumInput label="Inclinazione tetto" value={d.inclinazione} onChange={(v:number)=>set("inclinazione",v)} unit="°"/>}
          </div>}
          <div style={{marginTop:16}}>
            <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any}}>Note</div>
            <textarea value={d.note||""} onChange={(e:any)=>set("note",e.target.value)} placeholder="Esposizione solare, ostacoli sopra, cablaggio esistente..." style={{width:"100%",padding:"10px 12px",fontSize:11,fontFamily:FF,border:`1.5px solid ${T.bdr}`,borderRadius:9,background:T.card,minHeight:50,resize:"vertical" as any,outline:"none",boxSizing:"border-box" as any}}/>
          </div>
          <PhotoRow foto={d.foto} onCapture={handleFoto}/>

          {/* RIEPILOGO inline */}
          {total>=5&&<div style={{marginTop:20,background:T.card,borderRadius:12,border:`1.5px solid ${T.bdr}`,overflow:"hidden"}}>
            <div style={{padding:"10px 14px",background:T.topbar,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12}}>📋</span><span style={{fontSize:12,fontWeight:700,color:"#fff"}}>Riepilogo Tenda da Sole</span>
              <span style={{fontSize:9,color:"#888",marginLeft:"auto",fontFamily:FM}}>{total} campi</span>
            </div>
            <div style={{padding:"12px 14px",fontSize:11,lineHeight:2.2,color:T.text}}>
              {d.tipologia&&<RLine label="Tipologia" value={TIPOLOGIE.find(t=>t.id===d.tipologia)?.nome||d.tipologia} color={SOLE_COLOR}/>}
              {m.lCentro>0&&<RLine label="Larghezza" value={`${m.lCentro} mm`} mono/>}
              {d.sporgenza>0&&<RLine label="Sporgenza" value={`${d.sporgenza} mm`} mono/>}
              {d.altezza>0&&<RLine label="Altezza" value={`${d.altezza} mm`} mono/>}
              {d.tessutoTipo&&<RLine label="Tessuto" value={d.tessutoTipo} sub={d.tessutoColore}/>}
              {d.strutMat&&<RLine label="Struttura" value={d.strutMat} sub={d.strutCol}/>}
              {d.cassonetto&&d.cassonetto!=="Nessuno (aperto)"&&<RLine label="Cassonetto" value={d.cassonetto}/>}
              {d.comando&&<RLine label="Comando" value={d.comando}/>}
              {d.sensore&&d.sensore!=="Nessuno"&&<RLine label="Sensore" value={d.sensore}/>}
              {d.montaggio&&<RLine label="Montaggio" value={d.montaggio}/>}
              {d.aggancio&&<RLine label="Aggancio" value={d.aggancio}/>}
            </div>
          </div>}
        </>}
      </div>

      <div style={{position:"fixed" as any,bottom:0,left:0,right:0,background:T.card,borderTop:`1px solid ${T.bdr}`,padding:"10px 16px",display:"flex",gap:8,maxWidth:480,margin:"0 auto",zIndex:99}}>
        <div onClick={()=>step>0?setStep(step-1):onBack()} style={{flex:1,padding:"12px",borderRadius:10,background:T.bg,textAlign:"center" as any,fontSize:12,fontWeight:700,color:T.sub,cursor:"pointer"}}>{step>0?"← Indietro":"← Esci"}</div>
        <div onClick={()=>step<2?setStep(step+1):onBack()} style={{flex:2,padding:"12px",borderRadius:10,background:step===2?(total>=5?T.green:T.bdr):SOLE_COLOR,textAlign:"center" as any,fontSize:12,fontWeight:800,color:step===2?(total>=5?"#fff":T.sub):"#fff",cursor:"pointer",transition:"all .2s"}}>
          {step===2?`✓ Salva tenda · ${total}/${totalMax}`:`Avanti → ${STEPS[step+1]}`}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus,textarea:focus{border-color:${SOLE_COLOR}!important;box-shadow:0 0 0 3px ${SOLE_COLOR}20}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}

const RLine=({label,value,sub,color,mono}:{label:string;value:string;sub?:string;color?:string;mono?:boolean})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"2px 0"}}>
    <span style={{color:T.sub,fontSize:10}}>{label}:</span>
    <span style={{fontWeight:700,fontSize:11,color:color||T.text,fontFamily:mono?FM:FF,textAlign:"right" as any,maxWidth:"65%"}}>{value}{sub&&<span style={{fontSize:9,color:T.sub,fontWeight:500,marginLeft:4}}>{sub}</span>}</span>
  </div>
);
