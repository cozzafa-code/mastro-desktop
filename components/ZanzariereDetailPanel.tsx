// ═══════════════════════════════════════════════════════════════════
// MASTRO ERP — ZanzariereDetailPanel.tsx
// Form misure completo per settore ZANZARIERE
// Basato su catalogo MastroZanzariereDemo (11 categorie + 6 reti + 8 modelli)
//
// INTEGRAZIONE:
// In VanoSectorRouter.tsx:
//   import ZanzariereDetailPanel from "./ZanzariereDetailPanel";
//   case "zanzariere": return <ZanzariereDetailPanel vano={vano} onUpdate={updateField} onBack={onBack} />;
//
// CAMPI SALVATI:
// categoria, modello, apertura
// misure.lCentro, misure.hCentro, profIncasso
// rete
// profilo, aggancio, guida, manovra, colore
// note, foto.fronte, foto.retro, foto.dettaglio
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { captureFotoVano, captureFotoSimple } from "@/lib/vano-foto-uploader";

const T={bg:"#F2F1EC",card:"#FFFFFF",topbar:"#1A1A1C",acc:"#D08008",text:"#1A1A1C",sub:"#8E8E93",bdr:"#E5E4DF",green:"#1A9E73",red:"#DC4444",blue:"#3B7FE0"};
const FF="'Inter', system-ui, sans-serif";
const FM="'JetBrains Mono', monospace";
const ZANZ_COLOR="#4b5563";

// ═══ CATALOGO ═══
const CATEGORIE=["Avvolgente verticale","Avvolgente laterale","Avvolgente con bottone","Plissettata verticale","Plissettata laterale","ZIP verticale","Incasso controtelaio","Pannello fisso","Battente 1 anta","Battente 2 ante","Scorrevole su binario"];
const RETI=[
  {nome:"Standard 18×16",desc:"Fibra di vetro grigia, la più comune",prezzo:""},
  {nome:"Antibatterica",desc:"Trattamento antimicrobico",prezzo:"+€7.20/mq"},
  {nome:"Antivento",desc:"Rete rinforzata con fili in acciaio",prezzo:"+€4.50/mq"},
  {nome:"Pet Screen",desc:"Resistente a graffi animali, spessore maggiore",prezzo:"+€12.00/mq"},
  {nome:"Antipolline",desc:"Maglia extra-fine per allergie",prezzo:"+€9.80/mq"},
  {nome:"Trasparente HD",desc:"Alta visibilità, quasi invisibile",prezzo:"+€6.00/mq"},
];
const APERTURE=["DX → SX","SX → DX","Centrale (2 ante)","Basso → Alto"];
const COLORI=["Bianco RAL 9010","Avorio RAL 1013","Marrone RAL 8017","Grigio RAL 7016","Antracite","Testa di moro","Bronzo","Effetto legno noce","Effetto legno rovere","RAL custom"];
const GUIDE=["Guida standard","Guida con spazzolino","Guida magnetica","Guida ZIP","Senza guida (solo plissettata)"];
const MANOVRA_Z=["Manuale con molla","Manuale con catenella","Manuale con asta","Motorizzata","Magnetica a sfioramento"];
const PROFILO=["Tondo Ø32","Tondo Ø42","Squadrato 35×35","Squadrato 45×45","Slim 25×35","Incasso"];
const MODELLI=[
  {id:"z01",nome:"Avvolgente Classic",tipo:"Avvolgente verticale"},
  {id:"z02",nome:"Laterale 1 anta",tipo:"Avvolgente laterale"},
  {id:"z03",nome:"Plissé Vertigo",tipo:"Plissettata verticale"},
  {id:"z04",nome:"Plissé Slide",tipo:"Plissettata laterale"},
  {id:"z05",nome:"ZIP Antivento",tipo:"ZIP verticale"},
  {id:"z06",nome:"Incasso Filomuro",tipo:"Incasso controtelaio"},
  {id:"z07",nome:"Battente Swing",tipo:"Battente 1 anta"},
  {id:"z08",nome:"Scorrevole XL",tipo:"Scorrevole su binario"},
];
const AGGANCIO=["Frontale a muro","A pavimento","A soffitto","Su controtelaio","Su serramento (clip)","Incasso a filo"];
const MISURE_STD=[{l:600,h:1200,lb:"60×120"},{l:800,h:1200,lb:"80×120"},{l:800,h:1400,lb:"80×140"},{l:1000,h:1400,lb:"100×140"},{l:1200,h:1400,lb:"120×140"},{l:1400,h:2200,lb:"140×220"},{l:1800,h:2200,lb:"180×220"},{l:2400,h:2200,lb:"240×220"}];

// ═══ UI ═══
const Chip=({label,sel,color,onTap,small}:any)=><div onClick={onTap} style={{padding:small?"5px 10px":"7px 13px",borderRadius:9,border:`1.5px solid ${sel?color||ZANZ_COLOR:T.bdr}`,background:sel?(color||ZANZ_COLOR)+"14":T.card,fontSize:small?10:11,fontWeight:sel?700:500,color:sel?(color||ZANZ_COLOR):T.text,cursor:"pointer",transition:"all .12s",fontFamily:FF,userSelect:"none" as any}}>{label}</div>;
const ChipSel=({label,options,value,onChange,color,small}:any)=><div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any,letterSpacing:0.5}}>{label}</div><div style={{display:"flex",gap:4,flexWrap:"wrap" as any}}>{options.map((o:string)=><Chip key={o} label={o} sel={value===o} color={color} onTap={()=>onChange(o)} small={small}/>)}</div></div>;
const SectionAcc=({icon,title,color,count,open,onToggle}:any)=><div onClick={onToggle} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 0",cursor:"pointer",borderBottom:`1px solid ${T.bdr}`,marginBottom:open?12:0,userSelect:"none" as any}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:13,fontWeight:700,color:color||T.text,flex:1}}>{title}</span>{count>0&&<span style={{fontSize:9,fontWeight:700,background:(color||ZANZ_COLOR)+"20",color:color||ZANZ_COLOR,padding:"2px 8px",borderRadius:20}}>{count}</span>}<span style={{fontSize:11,color:T.sub,transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▼</span></div>;
const NumInput=({label,value,onChange,unit="mm",placeholder}:any)=><div style={{marginBottom:10}}><div style={{fontSize:10,color:T.sub,marginBottom:3,fontWeight:600}}>{label}</div><div style={{display:"flex",alignItems:"center",gap:5}}><input type="number" inputMode="numeric" value={value||""} onChange={(e:any)=>onChange(parseInt(e.target.value)||0)} placeholder={placeholder||""} style={{flex:1,padding:"10px 12px",fontSize:15,fontFamily:FM,fontWeight:600,border:`1.5px solid ${T.bdr}`,borderRadius:9,background:T.card,color:T.text,outline:"none"}}/><span style={{fontSize:10,color:T.sub,background:T.bg,padding:"7px 9px",borderRadius:7,fontWeight:600}}>{unit}</span></div></div>;
const PhotoRow=({foto,onCapture}:any)=><div style={{display:"flex",gap:6,marginTop:10}}>{["fronte","retro","dettaglio"].map(cat=>{const has=foto?.[cat];return(<div key={cat} onClick={()=>onCapture(cat)} style={{flex:1,height:56,borderRadius:10,border:has?`2px solid ${T.green}`:`2px dashed ${T.bdr}`,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",cursor:"pointer",background:has?T.green+"08":T.card,overflow:"hidden",position:"relative" as any}}>{has?<img src={has} style={{width:"100%",height:"100%",objectFit:"cover" as any}} alt=""/>:<><span style={{fontSize:16}}>📷</span><span style={{fontSize:8,color:T.sub,fontWeight:600}}>{cat==="fronte"?"Foto vano":cat==="retro"?"Serramento":"Dettaglio"}</span></>}</div>)})}</div>;

// ═══ ZANZARIERA DRAWING SVG ═══
const ZanzDraw=({d}:any)=>{
  const cat=d.categoria||"";const larg=d.larghezza||"—";const alt=d.altezza||"—";
  const isVert=cat.includes("verticale")||cat.includes("ZIP")||cat.includes("Pannello")||cat.includes("Incasso");
  const isLat=cat.includes("laterale");
  const isBatt=cat.includes("Battente");const is2=cat.includes("2 ante");
  const isScorr=cat.includes("Scorrevole");
  return(
    <div style={{background:T.card,borderRadius:12,border:`1.5px solid ${T.bdr}`,padding:"12px 8px 6px",marginBottom:14}}>
      <div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6,textAlign:"center" as any}}>Vista frontale</div>
      <svg width="100%" viewBox="0 0 220 170" style={{maxHeight:190}}>
        {/* Muro / Telaio */}
        <rect x="35" y="15" width="150" height="120" rx="2" fill="#e8e6e1" stroke="#ccc" strokeWidth="1"/>
        {/* Vano luce */}
        <rect x="45" y="20" width="130" height="110" rx="1" fill={T.card} stroke={ZANZ_COLOR+"66"} strokeWidth="1"/>
        
        {isVert&&<>
          {/* Cassonetto superiore */}
          <rect x="47" y="22" width="126" height="10" rx="2" fill={ZANZ_COLOR+"33"} stroke={ZANZ_COLOR} strokeWidth="0.8"/>
          {/* Rete mesh */}
          <rect x="49" y="32" width="122" height="94" rx="1" fill={ZANZ_COLOR+"08"}/>
          {Array.from({length:14},(_,i)=><line key={`h${i}`} x1="49" y1={36+i*6.5} x2="171" y2={36+i*6.5} stroke={ZANZ_COLOR+"15"} strokeWidth="0.5"/>)}
          {Array.from({length:8},(_,i)=><line key={`v${i}`} x1={55+i*15} y1="32" x2={55+i*15} y2="126" stroke={ZANZ_COLOR+"15"} strokeWidth="0.5"/>)}
          {/* Guide laterali */}
          {cat.includes("ZIP")&&<><rect x="45" y="22" width="4" height="108" rx="1" fill={ZANZ_COLOR+"55"}/><rect x="171" y="22" width="4" height="108" rx="1" fill={ZANZ_COLOR+"55"}/></>}
          {/* Barra inferiore */}
          <rect x="47" y="124" width="126" height="4" rx="1.5" fill={ZANZ_COLOR+"44"} stroke={ZANZ_COLOR} strokeWidth="0.6"/>
        </>}

        {isLat&&<>
          {/* Cassonetto laterale SX */}
          <rect x="47" y="22" width="10" height="106" rx="2" fill={ZANZ_COLOR+"33"} stroke={ZANZ_COLOR} strokeWidth="0.8"/>
          {/* Rete mesh */}
          <rect x="57" y="24" width="114" height="102" rx="1" fill={ZANZ_COLOR+"08"}/>
          {Array.from({length:14},(_,i)=><line key={`h${i}`} x1="57" y1={28+i*7} x2="171" y2={28+i*7} stroke={ZANZ_COLOR+"15"} strokeWidth="0.5"/>)}
          {Array.from({length:7},(_,i)=><line key={`v${i}`} x1={63+i*16} y1="24" x2={63+i*16} y2="126" stroke={ZANZ_COLOR+"15"} strokeWidth="0.5"/>)}
          {/* Freccia apertura */}
          <line x1="130" y1="75" x2="160" y2="75" stroke={ZANZ_COLOR} strokeWidth="1.5" markerEnd="url(#arrowZ)"/>
          <defs><marker id="arrowZ" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><path d={`M0,0 L6,2 L0,4`} fill={ZANZ_COLOR}/></marker></defs>
        </>}

        {isBatt&&<>
          {is2?<>
            {/* 2 ante */}
            <rect x="47" y="22" width="62" height="106" rx="1" fill={ZANZ_COLOR+"08"} stroke={ZANZ_COLOR+"44"} strokeWidth="0.8"/>
            <rect x="111" y="22" width="62" height="106" rx="1" fill={ZANZ_COLOR+"08"} stroke={ZANZ_COLOR+"44"} strokeWidth="0.8"/>
            {/* Mesh pattern */}
            {Array.from({length:12},(_,i)=><><line key={`l${i}`} x1="49" y1={28+i*8} x2="107" y2={28+i*8} stroke={ZANZ_COLOR+"12"} strokeWidth="0.5"/><line key={`r${i}`} x1="113" y1={28+i*8} x2="171" y2={28+i*8} stroke={ZANZ_COLOR+"12"} strokeWidth="0.5"/></>)}
            {/* Cerniere */}
            <circle cx="49" cy="50" r="2.5" fill={ZANZ_COLOR+"66"}/><circle cx="49" cy="100" r="2.5" fill={ZANZ_COLOR+"66"}/>
            <circle cx="171" cy="50" r="2.5" fill={ZANZ_COLOR+"66"}/><circle cx="171" cy="100" r="2.5" fill={ZANZ_COLOR+"66"}/>
            {/* Maniglie */}
            <rect x="103" y="70" width="3" height="12" rx="1" fill={ZANZ_COLOR}/><rect x="114" y="70" width="3" height="12" rx="1" fill={ZANZ_COLOR}/>
          </>:<>
            {/* 1 anta */}
            <rect x="47" y="22" width="126" height="106" rx="1" fill={ZANZ_COLOR+"08"} stroke={ZANZ_COLOR+"44"} strokeWidth="0.8"/>
            {Array.from({length:14},(_,i)=><line key={`h${i}`} x1="49" y1={28+i*7} x2="171" y2={28+i*7} stroke={ZANZ_COLOR+"12"} strokeWidth="0.5"/>)}
            {/* Cerniere SX */}
            <circle cx="49" cy="50" r="2.5" fill={ZANZ_COLOR+"66"}/><circle cx="49" cy="100" r="2.5" fill={ZANZ_COLOR+"66"}/>
            {/* Maniglia DX */}
            <rect x="166" y="70" width="3" height="12" rx="1" fill={ZANZ_COLOR}/>
          </>}
        </>}

        {isScorr&&<>
          {/* Binario superiore e inferiore */}
          <rect x="45" y="20" width="130" height="3" rx="1" fill={ZANZ_COLOR+"55"}/>
          <rect x="45" y="127" width="130" height="3" rx="1" fill={ZANZ_COLOR+"55"}/>
          {/* Anta SX */}
          <rect x="47" y="23" width="65" height="104" rx="1" fill={ZANZ_COLOR+"08"} stroke={ZANZ_COLOR+"44"} strokeWidth="0.8"/>
          {/* Anta DX */}
          <rect x="108" y="23" width="65" height="104" rx="1" fill={ZANZ_COLOR+"0c"} stroke={ZANZ_COLOR+"44"} strokeWidth="0.8"/>
          {/* Mesh lines */}
          {Array.from({length:12},(_,i)=><><line key={`l${i}`} x1="49" y1={28+i*8} x2="110" y2={28+i*8} stroke={ZANZ_COLOR+"12"} strokeWidth="0.5"/><line key={`r${i}`} x1="110" y1={28+i*8} x2="171" y2={28+i*8} stroke={ZANZ_COLOR+"12"} strokeWidth="0.5"/></>)}
          {/* Frecce scorrevole */}
          <line x1="65" y1="138" x2="90" y2="138" stroke={ZANZ_COLOR} strokeWidth="1" markerEnd="url(#arrowZ2)"/>
          <line x1="155" y1="138" x2="130" y2="138" stroke={ZANZ_COLOR} strokeWidth="1" markerEnd="url(#arrowZ2)"/>
          <defs><marker id="arrowZ2" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><path d={`M0,0 L6,2 L0,4`} fill={ZANZ_COLOR}/></marker></defs>
        </>}

        {/* Quote larghezza */}
        <line x1="45" y1="148" x2="175" y2="148" stroke={T.sub} strokeWidth="0.5"/>
        <line x1="45" y1="144" x2="45" y2="152" stroke={T.sub} strokeWidth="0.5"/>
        <line x1="175" y1="144" x2="175" y2="152" stroke={T.sub} strokeWidth="0.5"/>
        <text x="110" y="160" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={ZANZ_COLOR}>{larg}</text>
        {/* Quota altezza */}
        <line x1="195" y1="20" x2="195" y2="130" stroke={T.sub} strokeWidth="0.5"/>
        <line x1="191" y1="20" x2="199" y2="20" stroke={T.sub} strokeWidth="0.5"/>
        <line x1="191" y1="130" x2="199" y2="130" stroke={T.sub} strokeWidth="0.5"/>
        <text x="207" y="78" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={ZANZ_COLOR} transform="rotate(-90,207,78)">{alt}</text>
        
        {!cat&&<text x="110" y="80" textAnchor="middle" fontSize="11" fill={T.sub}>Seleziona una categoria</text>}
      </svg>
    </div>
  );
};

// ═══ MAIN ═══
interface ZanzariereDetailPanelProps{vano:any;onUpdate:(f:string,v:any)=>void;onBack:()=>void;aziendaId?:string;cmId?:string;}

export default function ZanzariereDetailPanel({vano,onUpdate,onBack,aziendaId,cmId}:ZanzariereDetailPanelProps){
  const[step,setStep]=useState(0);
  const[sec,setSec]=useState<Record<string,boolean>>({tipo:true,mis:true,rete:false,config:false});
  const tog=(s:string)=>setSec(p=>({...p,[s]:!p[s]}));
  const d=vano||{};const m=d.misure||{};
  const set=useCallback((f:string,v:any)=>{onUpdate(f,v)},[onUpdate]);
  const setM=useCallback((f:string,v:any)=>{onUpdate("misure",{...(d.misure||{}),[f]:v})},[onUpdate,d.misure]);

  const handleFoto=(cat:string)=>{
    if(aziendaId&&cmId&&d.id){
      captureFotoVano({aziendaId,cmId,vanoId:String(d.id),categoria:cat},(url)=>set("foto",{...(d.foto||{}),[cat]:url}),(err)=>console.warn("[Foto]",err));
    } else {
      captureFotoSimple((url)=>set("foto",{...(d.foto||{}),[cat]:url}));
    }
  };

  const modelliVis=d.categoria?MODELLI.filter(mo=>mo.tipo===d.categoria):MODELLI;

  const tipoC=[d.categoria,d.modello,d.apertura].filter(Boolean).length;
  const misC=[m.lCentro,m.hCentro].filter(Boolean).length;
  const reteC=[d.rete].filter(Boolean).length;
  const confC=[d.colore,d.guida,d.manovra,d.profilo,d.aggancio].filter(Boolean).length;
  const total=tipoC+misC+reteC+confC;
  const totalMax=12;
  const STEPS=["Tipo & Misure","Rete & Config","Riepilogo"];

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:FF}}>
      {/* TOPBAR */}
      <div style={{background:T.topbar,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky" as any,top:0,zIndex:99}}>
        <div onClick={onBack} style={{width:30,height:30,borderRadius:7,background:"#ffffff15",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:13,color:"#fff"}}>←</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:-0.3}}>🦟 Zanzariera — Presa Misure</div>
          <div style={{fontSize:10,color:"#888"}}>{d.nome||"Vano"} · {d.stanza||""}</div>
        </div>
        <div style={{background:total>=totalMax*0.6?T.green+"30":ZANZ_COLOR+"30",color:total>=totalMax*0.6?T.green:ZANZ_COLOR,padding:"3px 10px",borderRadius:16,fontSize:11,fontWeight:800,fontFamily:FM}}>{total}/{totalMax}</div>
      </div>
      <div style={{height:3,background:T.bdr}}><div style={{height:3,background:total>=totalMax*0.6?T.green:ZANZ_COLOR,width:`${(total/totalMax)*100}%`,transition:"width .3s",borderRadius:2}}/></div>
      {/* STEP DOTS */}
      <div style={{display:"flex",gap:6,padding:"10px 16px",justifyContent:"center"}}>
        {STEPS.map((s,i)=>(<div key={i} onClick={()=>setStep(i)} style={{padding:"5px 14px",borderRadius:20,fontSize:10,fontWeight:700,cursor:"pointer",background:step===i?ZANZ_COLOR:T.card,color:step===i?"#fff":T.sub,border:`1px solid ${step===i?ZANZ_COLOR:T.bdr}`,transition:"all .15s"}}>{i+1}. {s}</div>))}
      </div>

      <div style={{padding:"4px 16px 100px"}}>
        {/* ═══ STEP 0: TIPO & MISURE ═══ */}
        {step===0&&<>
          {d.categoria&&<ZanzDraw d={{categoria:d.categoria,larghezza:m.lCentro,altezza:m.hCentro}}/>}
          
          <SectionAcc icon="🦟" title="Categoria e modello" color={ZANZ_COLOR} count={tipoC} open={sec.tipo} onToggle={()=>tog("tipo")}/>
          {sec.tipo&&<div>
            <ChipSel label="Categoria" options={CATEGORIE} value={d.categoria} onChange={(v:string)=>set("categoria",v)} color={ZANZ_COLOR}/>
            {/* Modelli carousel */}
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase" as any}}>Modello {d.categoria?`· ${modelliVis.length}`:""}</div>
                {d.modello&&<div onClick={()=>set("modello",null)} style={{fontSize:9,color:T.red,cursor:"pointer",fontWeight:700}}>✕ Rimuovi</div>}
              </div>
              <div style={{display:"flex",gap:8,overflowX:"auto" as any,paddingBottom:6}}>
                {modelliVis.map(mod=>(<div key={mod.id} onClick={()=>set("modello",d.modello===mod.id?null:mod.id)} style={{width:100,minHeight:80,borderRadius:12,border:`2px solid ${d.modello===mod.id?ZANZ_COLOR:T.bdr}`,background:d.modello===mod.id?ZANZ_COLOR+"0a":T.card,cursor:"pointer",overflow:"hidden",transition:"all .15s",flexShrink:0,padding:"10px 8px",textAlign:"center" as any}}>
                  <div style={{fontSize:10,fontWeight:700,color:d.modello===mod.id?ZANZ_COLOR:T.text}}>{mod.nome}</div>
                  <div style={{fontSize:8,color:T.sub,marginTop:2}}>{mod.tipo}</div>
                  {d.modello===mod.id&&<div style={{marginTop:4,fontSize:9,color:ZANZ_COLOR,fontWeight:800}}>✓</div>}
                </div>))}
              </div>
            </div>
            <ChipSel label="Lato apertura" options={APERTURE} value={d.apertura} onChange={(v:string)=>set("apertura",v)} color={ZANZ_COLOR} small/>
          </div>}

          <SectionAcc icon="📐" title="Misure" color={ZANZ_COLOR} count={misC} open={sec.mis} onToggle={()=>tog("mis")}/>
          {sec.mis&&<div>
            <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any}}>Misura rapida</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap" as any,marginBottom:12}}>
              {MISURE_STD.map(ms=><Chip key={ms.lb} label={ms.lb} sel={m.lCentro===ms.l&&m.hCentro===ms.h} color={ZANZ_COLOR} onTap={()=>{setM("lCentro",ms.l);setM("hCentro",ms.h)}}/>)}
            </div>
            <NumInput label="Larghezza luce" value={m.lCentro} onChange={(v:number)=>setM("lCentro",v)}/>
            <NumInput label="Altezza luce" value={m.hCentro} onChange={(v:number)=>setM("hCentro",v)}/>
            <NumInput label="Profondità incasso" value={d.profIncasso} onChange={(v:number)=>set("profIncasso",v)} placeholder="Solo per modelli a incasso"/>
            {m.lCentro>1800&&(d.categoria||"").includes("verticale")&&<div style={{fontSize:10,color:ZANZ_COLOR,background:ZANZ_COLOR+"12",padding:"6px 10px",borderRadius:8,marginBottom:10}}>⚠️ Larghezza &gt;1800mm — valutare soluzione a 2 ante o scorrevole</div>}
          </div>}
        </>}

        {/* ═══ STEP 1: RETE & CONFIG ═══ */}
        {step===1&&<>
          <SectionAcc icon="🔬" title="Tipo rete" color={ZANZ_COLOR} count={reteC} open={sec.rete} onToggle={()=>tog("rete")}/>
          {sec.rete&&<div>
            {RETI.map(r=>(<div key={r.nome} onClick={()=>set("rete",r.nome)} style={{padding:"10px 14px",borderRadius:10,border:`1.5px solid ${d.rete===r.nome?ZANZ_COLOR:T.bdr}`,background:d.rete===r.nome?ZANZ_COLOR+"0a":T.card,cursor:"pointer",marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:d.rete===r.nome?700:500,color:d.rete===r.nome?ZANZ_COLOR:T.text}}>{r.nome}</span>
                {r.prezzo&&<span style={{fontSize:9,fontWeight:700,color:ZANZ_COLOR,background:ZANZ_COLOR+"15",padding:"2px 8px",borderRadius:8}}>{r.prezzo}</span>}
              </div>
              <div style={{fontSize:9,color:T.sub,marginTop:2}}>{r.desc}</div>
              {d.rete===r.nome&&<div style={{marginTop:4,fontSize:9,color:ZANZ_COLOR,fontWeight:800}}>✓ Selezionata</div>}
            </div>))}
          </div>}

          <SectionAcc icon="⚙️" title="Profilo, guide e finitura" color={ZANZ_COLOR} count={confC} open={sec.config} onToggle={()=>tog("config")}/>
          {sec.config&&<div>
            <ChipSel label="Profilo telaio" options={PROFILO} value={d.profilo} onChange={(v:string)=>set("profilo",v)} color={ZANZ_COLOR} small/>
            <ChipSel label="Sistema di aggancio" options={AGGANCIO} value={d.aggancio} onChange={(v:string)=>set("aggancio",v)} color={ZANZ_COLOR}/>
            <ChipSel label="Guide laterali" options={GUIDE} value={d.guida} onChange={(v:string)=>set("guida",v)} color={ZANZ_COLOR} small/>
            <ChipSel label="Manovra" options={MANOVRA_Z} value={d.manovra} onChange={(v:string)=>set("manovra",v)} color={ZANZ_COLOR} small/>
            <ChipSel label="Colore profilo" options={COLORI} value={d.colore} onChange={(v:string)=>set("colore",v)} color={ZANZ_COLOR} small/>
          </div>}

          <div style={{marginTop:16}}>
            <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any}}>Note</div>
            <textarea value={d.note||""} onChange={(e:any)=>set("note",e.target.value)} placeholder="Montaggio su infisso, davanzale sporgente, tapparella esistente..." style={{width:"100%",padding:"10px 12px",fontSize:11,fontFamily:FF,border:`1.5px solid ${T.bdr}`,borderRadius:9,background:T.card,minHeight:50,resize:"vertical" as any,outline:"none",boxSizing:"border-box" as any}}/>
          </div>
          <PhotoRow foto={d.foto} onCapture={handleFoto}/>
        </>}

        {/* ═══ STEP 2: RIEPILOGO ═══ */}
        {step===2&&<>
          <div style={{background:T.card,borderRadius:12,border:`1.5px solid ${T.bdr}`,overflow:"hidden"}}>
            <div style={{padding:"10px 14px",background:T.topbar,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12}}>📋</span><span style={{fontSize:12,fontWeight:700,color:"#fff"}}>Riepilogo Zanzariera</span>
              <span style={{fontSize:9,color:"#888",marginLeft:"auto",fontFamily:FM}}>{total} campi</span>
            </div>
            <div style={{padding:"12px 14px",fontSize:11,lineHeight:2.2,color:T.text}}>
              {d.categoria&&<RLine label="Categoria" value={d.categoria} color={ZANZ_COLOR}/>}
              {d.modello&&(()=>{const mo=MODELLI.find(x=>x.id===d.modello);return mo?<RLine label="Modello" value={mo.nome}/>:null})()}
              {d.apertura&&<RLine label="Apertura" value={d.apertura}/>}
              {m.lCentro>0&&<RLine label="Misure" value={`${m.lCentro}×${m.hCentro||"—"} mm`} mono/>}
              {d.profIncasso>0&&<RLine label="Prof. incasso" value={`${d.profIncasso} mm`} mono/>}
              {d.rete&&<RLine label="Rete" value={d.rete}/>}
              {d.profilo&&<RLine label="Profilo" value={d.profilo}/>}
              {d.aggancio&&<RLine label="Aggancio" value={d.aggancio}/>}
              {d.guida&&<RLine label="Guide" value={d.guida}/>}
              {d.manovra&&<RLine label="Manovra" value={d.manovra}/>}
              {d.colore&&<RLine label="Colore" value={d.colore}/>}
              {d.note&&<RLine label="Note" value={d.note}/>}
            </div>
            {d.foto&&Object.values(d.foto).some(Boolean)&&<div style={{padding:"8px 14px 12px",display:"flex",gap:6}}>{Object.entries(d.foto).filter(([,v])=>v).map(([k,v]:any)=><img key={k} src={v} style={{width:70,height:52,objectFit:"cover" as any,borderRadius:6,border:`1px solid ${T.bdr}`}} alt={k}/>)}</div>}
          </div>
          
          {/* Mini SVG preview in riepilogo */}
          {d.categoria&&<ZanzDraw d={{categoria:d.categoria,larghezza:m.lCentro,altezza:m.hCentro}}/>}
        </>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed" as any,bottom:0,left:0,right:0,background:T.card,borderTop:`1px solid ${T.bdr}`,padding:"10px 16px",display:"flex",gap:8,maxWidth:480,margin:"0 auto",zIndex:99}}>
        <div onClick={()=>step>0?setStep(step-1):onBack()} style={{flex:1,padding:"12px",borderRadius:10,background:T.bg,textAlign:"center" as any,fontSize:12,fontWeight:700,color:T.sub,cursor:"pointer"}}>{step>0?"← Indietro":"← Esci"}</div>
        <div onClick={()=>step<2?setStep(step+1):onBack()} style={{flex:2,padding:"12px",borderRadius:10,background:step===2?(total>=4?T.green:T.bdr):ZANZ_COLOR,textAlign:"center" as any,fontSize:12,fontWeight:800,color:step===2?(total>=4?"#fff":T.sub):"#fff",cursor:"pointer",transition:"all .2s"}}>
          {step===2?`✓ Salva zanzariera · ${total}/${totalMax}`:`Avanti → ${STEPS[step+1]}`}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus,textarea:focus{border-color:${ZANZ_COLOR}!important;box-shadow:0 0 0 3px ${ZANZ_COLOR}20}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}

const RLine=({label,value,sub,color,mono}:{label:string;value:string;sub?:string;color?:string;mono?:boolean})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"2px 0"}}>
    <span style={{color:T.sub,fontSize:10}}>{label}:</span>
    <span style={{fontWeight:700,fontSize:11,color:color||T.text,fontFamily:mono?FM:FF,textAlign:"right" as any,maxWidth:"65%"}}>{value}{sub&&<span style={{fontSize:9,color:T.sub,fontWeight:500,marginLeft:4}}>{sub}</span>}</span>
  </div>
);
