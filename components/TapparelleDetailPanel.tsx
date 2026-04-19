// ═══════════════════════════════════════════════════════════════════
// MASTRO ERP — TapparelleDetailPanel.tsx
// Form misure completo per settore TAPPARELLE
// Basato su catalogo MastroTapparelleDemo (7 tipologie + 11 cassonetti + 6 modelli)
//
// INTEGRAZIONE:
// In VanoSectorRouter.tsx:
//   import TapparelleDetailPanel from "./TapparelleDetailPanel";
//   case "tapparelle": return <TapparelleDetailPanel vano={vano} onUpdate={updateField} onBack={onBack} />;
//
// CAMPI SALVATI:
// tipologia, modello, materiale, stecca
// misure.lCentro, misure.hCentro
// cassonetto, ispezione, tappo, spalle, largCass
// guida, aggancio, manovra, colore
// note, foto.fronte, foto.retro, foto.dettaglio
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { captureFotoVano, captureFotoSimple } from "@/lib/vano-foto-uploader";

const T={bg:"#F2F1EC",card:"#FFFFFF",topbar:"#1A1A1C",acc:"#D08008",text:"#1A1A1C",sub:"#8E8E93",bdr:"#E5E4DF",green:"#1A9E73",red:"#DC4444",blue:"#3B7FE0"};
const FF="'Inter', system-ui, sans-serif";
const FM="'JetBrains Mono', monospace";
const TAPP_COLOR="#57534e";

// ═══ CATALOGO ═══
const TIPOLOGIE=["Avvolgibile tradizionale","Avvolgibile coibentata","Blindata / Antieffrazione","Frangisole orientabile","Micro-forate","Solare integrata","ZIP screen"];
const MATERIALI=["PVC","Alluminio coibentato","Alluminio estruso","Acciaio blindato","Legno"];
const STECCHE_TIPO=["Mini 9mm (39mm)","Maxi 14mm (55mm)","Coibentata alta densità","Microforata","Blindata 16mm"];
const COLORI=["Bianco RAL 9010","Avorio RAL 1013","Marrone RAL 8017","Grigio RAL 7016","Antracite RAL 7016S","Verde RAL 6005","Testa di moro","Effetto legno noce","Effetto legno rovere","RAL custom"];
const GUIDE=["Guide standard 30mm","Guide standard 40mm","Guide rinforzate antivento","Guide ZIP laterali","Guide a scomparsa","Guide per cappotto termico"];
const MANOVRA=["Cinghia 14mm","Cinghia 22mm","Molla a frizione","Verricello (argano)","Asta/Palo","Motorizzata tubo Ø35","Motorizzata tubo Ø45","Motorizzata tubo Ø60","Motorizzata radio","Motorizzata WiFi/App"];
const CASSONETTI=[
  {id:"cs01",nome:"IFC 25×25",dim:"25×25cm",tipo:"Frontale ispezionabile"},
  {id:"cs02",nome:"IFC 30×25",dim:"30×25cm",tipo:"Frontale ispezionabile"},
  {id:"cs03",nome:"IFC 30×30",dim:"30×30cm",tipo:"Frontale ispezionabile"},
  {id:"cs04",nome:"IFC 35×30",dim:"35×30cm",tipo:"Frontale ispezionabile"},
  {id:"cs05",nome:"IFM Modulare",dim:"Variabile",tipo:"Frontale modulare"},
  {id:"cs06",nome:"IFCL Ristrutt",dim:"Variabile",tipo:"Ristrutturazione"},
  {id:"cs07",nome:"ELIO",dim:"Compatto",tipo:"Monoblocco termoisolato"},
  {id:"cs08",nome:"VP",dim:"Standard",tipo:"Monoblocco versatile"},
  {id:"cs09",nome:"TF",dim:"Compatto",tipo:"Cassonetto a soffitto"},
  {id:"cs10",nome:"KALOS",dim:"Premium",tipo:"Finitura pregiata"},
  {id:"cs11",nome:"NOLAM",dim:"Standard",tipo:"Senza lamiera esterna"},
];
const ISPEZIONE=["Frontale","Inferiore","Laterale"];
const TAPPO=["Standard","Antisfilamento","Con guarnizione","Con isolamento"];
const SPALLE=["Standard","Rinforzate","Con taglio termico"];
const MODELLI=[
  {id:"t01",nome:"Coibentata Standard",tipo:"Avvolgibile coibentata"},
  {id:"t02",nome:"Mini PVC",tipo:"Avvolgibile tradizionale"},
  {id:"t03",nome:"Blindata RC2",tipo:"Blindata / Antieffrazione"},
  {id:"t04",nome:"Frangisole Alu",tipo:"Frangisole orientabile"},
  {id:"t05",nome:"ZIP Screen",tipo:"ZIP screen"},
  {id:"t06",nome:"Solare Smart",tipo:"Solare integrata"},
];
const AGGANCIO=["Frontale a muro","A pavimento","Su cassonetto esistente","Su controtelaio","Incasso a filo","Retro-serramento"];
const MISURE_STD=[{l:600,h:1200,lb:"60×120"},{l:800,h:1200,lb:"80×120"},{l:800,h:1400,lb:"80×140"},{l:1000,h:1400,lb:"100×140"},{l:1200,h:1400,lb:"120×140"},{l:1400,h:1600,lb:"140×160"},{l:1800,h:2200,lb:"180×220"}];

// ═══ UI ═══
const Chip=({label,sel,color,onTap,small}:any)=><div onClick={onTap} style={{padding:small?"5px 10px":"7px 13px",borderRadius:9,border:`1.5px solid ${sel?color||TAPP_COLOR:T.bdr}`,background:sel?(color||TAPP_COLOR)+"14":T.card,fontSize:small?10:11,fontWeight:sel?700:500,color:sel?(color||TAPP_COLOR):T.text,cursor:"pointer",transition:"all .12s",fontFamily:FF,userSelect:"none" as any}}>{label}</div>;
const ChipSel=({label,options,value,onChange,color,small}:any)=><div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any,letterSpacing:0.5}}>{label}</div><div style={{display:"flex",gap:4,flexWrap:"wrap" as any}}>{options.map((o:string)=><Chip key={o} label={o} sel={value===o} color={color} onTap={()=>onChange(o)} small={small}/>)}</div></div>;
const SectionAcc=({icon,title,color,count,open,onToggle}:any)=><div onClick={onToggle} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 0",cursor:"pointer",borderBottom:`1px solid ${T.bdr}`,marginBottom:open?12:0,userSelect:"none" as any}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:13,fontWeight:700,color:color||T.text,flex:1}}>{title}</span>{count>0&&<span style={{fontSize:9,fontWeight:700,background:(color||TAPP_COLOR)+"20",color:color||TAPP_COLOR,padding:"2px 8px",borderRadius:20}}>{count}</span>}<span style={{fontSize:11,color:T.sub,transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▼</span></div>;
const NumInput=({label,value,onChange,unit="mm",placeholder}:any)=><div style={{marginBottom:10}}><div style={{fontSize:10,color:T.sub,marginBottom:3,fontWeight:600}}>{label}</div><div style={{display:"flex",alignItems:"center",gap:5}}><input type="number" inputMode="numeric" value={value||""} onChange={(e:any)=>onChange(parseInt(e.target.value)||0)} placeholder={placeholder||""} style={{flex:1,padding:"10px 12px",fontSize:15,fontFamily:FM,fontWeight:600,border:`1.5px solid ${T.bdr}`,borderRadius:9,background:T.card,color:T.text,outline:"none"}}/><span style={{fontSize:10,color:T.sub,background:T.bg,padding:"7px 9px",borderRadius:7,fontWeight:600}}>{unit}</span></div></div>;
const PhotoRow=({foto,onCapture}:any)=><div style={{display:"flex",gap:6,marginTop:10}}>{["fronte","retro","dettaglio"].map(cat=>{const has=foto?.[cat];return(<div key={cat} onClick={()=>onCapture(cat)} style={{flex:1,height:56,borderRadius:10,border:has?`2px solid ${T.green}`:`2px dashed ${T.bdr}`,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",cursor:"pointer",background:has?T.green+"08":T.card,overflow:"hidden",position:"relative" as any}}>{has?<img src={has} style={{width:"100%",height:"100%",objectFit:"cover" as any}} alt=""/>:<><span style={{fontSize:16}}>📷</span><span style={{fontSize:8,color:T.sub,fontWeight:600}}>{cat==="fronte"?"Foto esterna":cat==="retro"?"Cassonetto":"Dettaglio"}</span></>}</div>)})}</div>;

// ═══ TAPPARELLA DRAWING ═══
const TappDraw=({d}:any)=>{
  const larg=d.larghezza||"—";const alt=d.altezza||"—";const hasCass=!!d.cassonetto;
  const isZip=(d.tipologia||"").includes("ZIP");
  return(
    <div style={{background:T.card,borderRadius:12,border:`1.5px solid ${T.bdr}`,padding:"12px 8px 6px",marginBottom:14}}>
      <div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6,textAlign:"center" as any}}>Vista frontale</div>
      <svg width="100%" viewBox="0 0 220 170" style={{maxHeight:190}}>
        {/* Muro */}
        <rect x="20" y="15" width="180" height="140" rx="2" fill="#e8e6e1" stroke="#ccc" strokeWidth="1"/>
        {/* Cassonetto */}
        {hasCass&&<rect x="40" y="20" width="140" height="18" rx="3" fill={TAPP_COLOR+"22"} stroke={TAPP_COLOR} strokeWidth="1.2"/>}
        {hasCass&&<text x="110" y="33" textAnchor="middle" fontSize="7" fill={TAPP_COLOR} fontWeight="600">📦 Cassonetto</text>}
        {/* Telo tapparella */}
        <rect x="45" y={hasCass?38:25} width="130" height="95" rx="1" fill={TAPP_COLOR+"0c"} stroke={TAPP_COLOR+"55"} strokeWidth="0.8"/>
        {/* Stecche */}
        {Array.from({length:10},(_,i)=><line key={i} x1="47" y1={(hasCass?44:31)+i*9} x2="173" y2={(hasCass?44:31)+i*9} stroke={TAPP_COLOR+"33"} strokeWidth="0.8"/>)}
        {/* Guide laterali */}
        <rect x="42" y={hasCass?38:25} width="4" height="97" rx="1" fill={TAPP_COLOR+"44"}/>
        <rect x="174" y={hasCass?38:25} width="4" height="97" rx="1" fill={TAPP_COLOR+"44"}/>
        {/* ZIP guides */}
        {isZip&&<><rect x="40" y={hasCass?38:25} width="6" height="97" rx="1" fill={TAPP_COLOR+"66"}/><rect x="174" y={hasCass?38:25} width="6" height="97" rx="1" fill={TAPP_COLOR+"66"}/></>}
        {/* Barra finale */}
        <rect x="44" y={hasCass?131:120} width="132" height="4" rx="1.5" fill={TAPP_COLOR+"55"} stroke={TAPP_COLOR} strokeWidth="0.8"/>
        {/* Quote */}
        <line x1="45" y1="152" x2="175" y2="152" stroke={T.sub} strokeWidth="0.5"/>
        <text x="110" y="163" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={TAPP_COLOR}>{larg}</text>
        <line x1="195" y1={hasCass?38:25} x2="195" y2={hasCass?133:122} stroke={T.sub} strokeWidth="0.5"/>
        <text x="207" y={hasCass?88:76} textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={TAPP_COLOR} transform={`rotate(-90,207,${hasCass?88:76})`}>{alt}</text>
        {!d.tipologia&&<text x="110" y="85" textAnchor="middle" fontSize="11" fill={T.sub}>Seleziona tipologia</text>}
      </svg>
    </div>
  );
};

// ═══ MAIN ═══
interface TapparelleDetailPanelProps{vano:any;onUpdate:(f:string,v:any)=>void;onBack:()=>void;aziendaId?:string;cmId?:string;}

export default function TapparelleDetailPanel({vano,onUpdate,onBack,aziendaId,cmId}:TapparelleDetailPanelProps){
  const[step,setStep]=useState(0);
  const[sec,setSec]=useState<Record<string,boolean>>({tipo:true,mis:true,cass:false,guide:false});
  const tog=(s:string)=>setSec(p=>({...p,[s]:!p[s]}));
  const d=vano||{};const m=d.misure||{};
  const set=useCallback((f:string,v:any)=>{onUpdate(f,v)},[onUpdate]);
  const setM=useCallback((f:string,v:any)=>{onUpdate("misure",{...(d.misure||{}),[f]:v})},[onUpdate,d.misure]);
  const handleFoto=(cat:string)=>{if(aziendaId&&cmId&&d.id){captureFotoVano({aziendaId,cmId,vanoId:String(d.id),categoria:cat},(url)=>set("foto",{...(d.foto||{}),[cat]:url}),(err)=>console.warn("[Foto]",err));} else {captureFotoSimple((url)=>set("foto",{...(d.foto||{}),[cat]:url}));}};

  const modelliVis=d.tipologia?MODELLI.filter(mo=>mo.tipo===d.tipologia):MODELLI;
  const isMotor=(d.manovra||"").includes("Motor");

  const tipoC=[d.tipologia,d.modello,d.materiale].filter(Boolean).length;
  const misC=[m.lCentro,m.hCentro].filter(Boolean).length;
  const cassC=[d.cassonetto,d.ispezione].filter(Boolean).length;
  const guideC=[d.guida,d.manovra,d.colore,d.aggancio].filter(Boolean).length;
  const total=tipoC+misC+cassC+guideC;
  const totalMax=14;
  const STEPS=["Tipo & Misure","Cass. & Config","Riepilogo"];

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:FF}}>
      <div style={{background:T.topbar,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky" as any,top:0,zIndex:99}}>
        <div onClick={onBack} style={{width:30,height:30,borderRadius:7,background:"#ffffff15",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:13,color:"#fff"}}>←</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:-0.3}}>🔽 Tapparella — Presa Misure</div>
          <div style={{fontSize:10,color:"#888"}}>{d.nome||"Vano"} · {d.stanza||""}</div>
        </div>
        <div style={{background:total>=totalMax*0.5?T.green+"30":TAPP_COLOR+"30",color:total>=totalMax*0.5?T.green:TAPP_COLOR,padding:"3px 10px",borderRadius:16,fontSize:11,fontWeight:800,fontFamily:FM}}>{total}/{totalMax}</div>
      </div>
      <div style={{height:3,background:T.bdr}}><div style={{height:3,background:total>=totalMax*0.5?T.green:TAPP_COLOR,width:`${(total/totalMax)*100}%`,transition:"width .3s",borderRadius:2}}/></div>
      <div style={{display:"flex",gap:6,padding:"10px 16px",justifyContent:"center"}}>
        {STEPS.map((s,i)=>(<div key={i} onClick={()=>setStep(i)} style={{padding:"5px 14px",borderRadius:20,fontSize:10,fontWeight:700,cursor:"pointer",background:step===i?TAPP_COLOR:T.card,color:step===i?"#fff":T.sub,border:`1px solid ${step===i?TAPP_COLOR:T.bdr}`,transition:"all .15s"}}>{i+1}. {s}</div>))}
      </div>

      <div style={{padding:"4px 16px 100px"}}>
        {step===0&&<>
          {d.tipologia&&<TappDraw d={{tipologia:d.tipologia,larghezza:m.lCentro,altezza:m.hCentro,cassonetto:d.cassonetto}}/>}
          <SectionAcc icon="🔽" title="Tipologia e modello" color={TAPP_COLOR} count={tipoC} open={sec.tipo} onToggle={()=>tog("tipo")}/>
          {sec.tipo&&<div>
            <ChipSel label="Tipologia" options={TIPOLOGIE} value={d.tipologia} onChange={(v:string)=>set("tipologia",v)} color={TAPP_COLOR}/>
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase" as any}}>Modello {d.tipologia?`· ${modelliVis.length}`:""}</div>
                {d.modello&&<div onClick={()=>set("modello",null)} style={{fontSize:9,color:T.red,cursor:"pointer",fontWeight:700}}>✕ Rimuovi</div>}
              </div>
              <div style={{display:"flex",gap:8,overflowX:"auto" as any,paddingBottom:6}}>
                {modelliVis.map(mod=>(<div key={mod.id} onClick={()=>set("modello",d.modello===mod.id?null:mod.id)} style={{width:100,minHeight:90,borderRadius:12,border:`2px solid ${d.modello===mod.id?TAPP_COLOR:T.bdr}`,background:d.modello===mod.id?TAPP_COLOR+"0a":T.card,cursor:"pointer",overflow:"hidden",transition:"all .15s",flexShrink:0,padding:"10px 8px",textAlign:"center" as any}}>
                  <div style={{fontSize:10,fontWeight:700,color:d.modello===mod.id?TAPP_COLOR:T.text}}>{mod.nome}</div>
                  <div style={{fontSize:8,color:T.sub,marginTop:2}}>{mod.tipo}</div>
                  {d.modello===mod.id&&<div style={{marginTop:4,fontSize:9,color:TAPP_COLOR,fontWeight:800}}>✓</div>}
                </div>))}
              </div>
            </div>
            <ChipSel label="Materiale tapparella" options={MATERIALI} value={d.materiale} onChange={(v:string)=>set("materiale",v)} color={TAPP_COLOR}/>
            <ChipSel label="Tipo stecca" options={STECCHE_TIPO} value={d.stecca} onChange={(v:string)=>set("stecca",v)} color={TAPP_COLOR} small/>
          </div>}
          <SectionAcc icon="📐" title="Misure" color={TAPP_COLOR} count={misC} open={sec.mis} onToggle={()=>tog("mis")}/>
          {sec.mis&&<div>
            <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any}}>Misura rapida</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap" as any,marginBottom:12}}>
              {MISURE_STD.map(ms=><Chip key={ms.lb} label={ms.lb} sel={m.lCentro===ms.l&&m.hCentro===ms.h} color={TAPP_COLOR} onTap={()=>{setM("lCentro",ms.l);setM("hCentro",ms.h)}}/>)}
            </div>
            <NumInput label="Larghezza vano" value={m.lCentro} onChange={(v:number)=>setM("lCentro",v)}/>
            <NumInput label="Altezza caduta" value={m.hCentro} onChange={(v:number)=>setM("hCentro",v)}/>
          </div>}
        </>}

        {step===1&&<>
          <SectionAcc icon="📦" title="Cassonetto" color={TAPP_COLOR} count={cassC} open={sec.cass} onToggle={()=>tog("cass")}/>
          {sec.cass&&<div>
            <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:8,textTransform:"uppercase" as any}}>Modello cassonetto</div>
            <div style={{display:"flex",gap:6,overflowX:"auto" as any,paddingBottom:6,marginBottom:12}}>
              {CASSONETTI.map(cs=>(<div key={cs.id} onClick={()=>set("cassonetto",d.cassonetto===cs.id?null:cs.id)} style={{minWidth:90,padding:"8px 10px",borderRadius:10,border:`1.5px solid ${d.cassonetto===cs.id?TAPP_COLOR:T.bdr}`,background:d.cassonetto===cs.id?TAPP_COLOR+"0a":T.card,cursor:"pointer",flexShrink:0,textAlign:"center" as any}}>
                <div style={{fontSize:10,fontWeight:700,color:d.cassonetto===cs.id?TAPP_COLOR:T.text}}>{cs.nome}</div>
                <div style={{fontSize:8,color:T.sub}}>{cs.dim}</div>
                <div style={{fontSize:7,color:T.sub}}>{cs.tipo}</div>
              </div>))}
            </div>
            {d.cassonetto&&(()=>{const c=CASSONETTI.find(x=>x.id===d.cassonetto);return c?<div style={{background:TAPP_COLOR+"0c",border:`1px solid ${TAPP_COLOR}25`,borderRadius:10,padding:"10px 14px",marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:TAPP_COLOR}}>{c.nome} — {c.dim}</div><div style={{fontSize:10,color:T.sub}}>{c.tipo}</div></div>:null})()}
            <ChipSel label="Ispezione" options={ISPEZIONE} value={d.ispezione} onChange={(v:string)=>set("ispezione",v)} color={TAPP_COLOR} small/>
            <ChipSel label="Tappo" options={TAPPO} value={d.tappo} onChange={(v:string)=>set("tappo",v)} color={TAPP_COLOR} small/>
            <ChipSel label="Spalle" options={SPALLE} value={d.spalle} onChange={(v:string)=>set("spalle",v)} color={TAPP_COLOR} small/>
            <NumInput label="Larghezza cassonetto" value={d.largCass} onChange={(v:number)=>set("largCass",v)} placeholder="Se diversa dal vano"/>
          </div>}
          <SectionAcc icon="⚙️" title="Guide, manovra e finitura" color={TAPP_COLOR} count={guideC} open={sec.guide} onToggle={()=>tog("guide")}/>
          {sec.guide&&<div>
            <ChipSel label="Guide laterali" options={GUIDE} value={d.guida} onChange={(v:string)=>set("guida",v)} color={TAPP_COLOR} small/>
            <ChipSel label="Sistema di aggancio" options={AGGANCIO} value={d.aggancio} onChange={(v:string)=>set("aggancio",v)} color={TAPP_COLOR}/>
            <ChipSel label="Manovra / Comando" options={MANOVRA} value={d.manovra} onChange={(v:string)=>set("manovra",v)} color={TAPP_COLOR}/>
            {isMotor&&<div style={{fontSize:10,color:T.green,background:T.green+"12",padding:"8px 12px",borderRadius:8,marginBottom:10}}>💡 Verificare alimentazione elettrica nel cassonetto — predisporre tubo Ø20</div>}
            <ChipSel label="Colore" options={COLORI} value={d.colore} onChange={(v:string)=>set("colore",v)} color={TAPP_COLOR} small/>
          </div>}
          <div style={{marginTop:16}}>
            <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:5,textTransform:"uppercase" as any}}>Note</div>
            <textarea value={d.note||""} onChange={(e:any)=>set("note",e.target.value)} placeholder="Cassonetto incassato, cappotto, posizione cinghia..." style={{width:"100%",padding:"10px 12px",fontSize:11,fontFamily:FF,border:`1.5px solid ${T.bdr}`,borderRadius:9,background:T.card,minHeight:50,resize:"vertical" as any,outline:"none",boxSizing:"border-box" as any}}/>
          </div>
          <PhotoRow foto={d.foto} onCapture={handleFoto}/>
        </>}

        {step===2&&<>
          <div style={{background:T.card,borderRadius:12,border:`1.5px solid ${T.bdr}`,overflow:"hidden"}}>
            <div style={{padding:"10px 14px",background:T.topbar,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12}}>📋</span><span style={{fontSize:12,fontWeight:700,color:"#fff"}}>Riepilogo Tapparella</span>
              <span style={{fontSize:9,color:"#888",marginLeft:"auto",fontFamily:FM}}>{total} campi</span>
            </div>
            <div style={{padding:"12px 14px",fontSize:11,lineHeight:2.2,color:T.text}}>
              {d.tipologia&&<RLine label="Tipologia" value={d.tipologia} color={TAPP_COLOR}/>}
              {d.modello&&(()=>{const mo=MODELLI.find(x=>x.id===d.modello);return mo?<RLine label="Modello" value={mo.nome}/>:null})()}
              {d.materiale&&<RLine label="Materiale" value={d.materiale}/>}
              {d.stecca&&<RLine label="Stecca" value={d.stecca}/>}
              {m.lCentro>0&&<RLine label="Misure" value={`${m.lCentro}×${m.hCentro||"—"} mm`} mono/>}
              {d.cassonetto&&(()=>{const c=CASSONETTI.find(x=>x.id===d.cassonetto);return c?<RLine label="📦 Cassonetto" value={`${c.nome} (${c.dim})`}/>:null})()}
              {d.ispezione&&<RLine label="Ispezione" value={d.ispezione}/>}
              {d.guida&&<RLine label="Guide" value={d.guida}/>}
              {d.aggancio&&<RLine label="Aggancio" value={d.aggancio}/>}
              {d.manovra&&<RLine label="Manovra" value={d.manovra}/>}
              {d.colore&&<RLine label="Colore" value={d.colore}/>}
              {d.note&&<RLine label="Note" value={d.note}/>}
            </div>
            {d.foto&&Object.values(d.foto).some(Boolean)&&<div style={{padding:"8px 14px 12px",display:"flex",gap:6}}>{Object.entries(d.foto).filter(([,v])=>v).map(([k,v]:any)=><img key={k} src={v} style={{width:70,height:52,objectFit:"cover" as any,borderRadius:6,border:`1px solid ${T.bdr}`}} alt={k}/>)}</div>}
          </div>
        </>}
      </div>

      <div style={{position:"fixed" as any,bottom:0,left:0,right:0,background:T.card,borderTop:`1px solid ${T.bdr}`,padding:"10px 16px",display:"flex",gap:8,maxWidth:480,margin:"0 auto",zIndex:99}}>
        <div onClick={()=>step>0?setStep(step-1):onBack()} style={{flex:1,padding:"12px",borderRadius:10,background:T.bg,textAlign:"center" as any,fontSize:12,fontWeight:700,color:T.sub,cursor:"pointer"}}>{step>0?"← Indietro":"← Esci"}</div>
        <div onClick={()=>step<2?setStep(step+1):onBack()} style={{flex:2,padding:"12px",borderRadius:10,background:step===2?(total>=4?T.green:T.bdr):TAPP_COLOR,textAlign:"center" as any,fontSize:12,fontWeight:800,color:step===2?(total>=4?"#fff":T.sub):"#fff",cursor:"pointer",transition:"all .2s"}}>
          {step===2?`✓ Salva tapparella · ${total}/${totalMax}`:`Avanti → ${STEPS[step+1]}`}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus,textarea:focus{border-color:${TAPP_COLOR}!important;box-shadow:0 0 0 3px ${TAPP_COLOR}20}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}

const RLine=({label,value,sub,color,mono}:{label:string;value:string;sub?:string;color?:string;mono?:boolean})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"2px 0"}}>
    <span style={{color:T.sub,fontSize:10}}>{label}:</span>
    <span style={{fontWeight:700,fontSize:11,color:color||T.text,fontFamily:mono?FM:FF,textAlign:"right" as any,maxWidth:"65%"}}>{value}{sub&&<span style={{fontSize:9,color:T.sub,fontWeight:500,marginLeft:4}}>{sub}</span>}</span>
  </div>
);
