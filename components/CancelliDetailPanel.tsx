// ═══════════════════════════════════════════════════════════════════
// MASTRO ERP — CancelliDetailPanel.tsx
// Form misure completo per settore CANCELLI
// Basato su catalogo MastroCancelliV2 (10 tipologie + automazione + pilastri)
//
// INTEGRAZIONE:
// In VanoSectorRouter.tsx:
//   import CancelliDetailPanel from "./CancelliDetailPanel";
//   case "cancelli": return <CancelliDetailPanel vano={vano} onUpdate={updateField} onBack={onBack} />;
//
// CAMPI SALVATI nel vano:
// tipologia, materiale
// misure.lCentro, misure.hCentro, pendenza, largCarraio, largPed, antaSx, antaDx, nPannelli
// tamponamento, finitura, colore
// automazione, autoAcc[]
// pilastri, pilDim, interasse
// aggancio
// note, foto.fronte, foto.retro, foto.dettaglio
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { captureFotoVano, captureFotoSimple } from "@/lib/vano-foto-uploader";

// ═══ MASTRO DS v1.0 ═══
const T = { bg:"#F2F1EC", card:"#FFFFFF", topbar:"#1A1A1C", acc:"#D08008", text:"#1A1A1C", sub:"#8E8E93", bdr:"#E5E4DF", green:"#1A9E73", red:"#DC4444", blue:"#3B7FE0" };
const FF = "'Inter', system-ui, sans-serif";
const FM = "'JetBrains Mono', monospace";
const CANC_COLOR = "#78716c";

// ═══ CATALOGO ═══
const TIPOLOGIE = [
  { id:"batt-sing", nome:"Battente singolo", desc:"1 anta, apertura a spinta" },
  { id:"batt-dopp", nome:"Battente doppio", desc:"2 ante simmetriche o asimmetriche" },
  { id:"scorr", nome:"Scorrevole", desc:"Su binario, 1 anta" },
  { id:"scorr-tele", nome:"Scorrevole telescopico", desc:"2+ ante sovrapposte" },
  { id:"pedonale", nome:"Pedonale", desc:"Ingresso persone, anta piccola" },
  { id:"carraio-ped", nome:"Carraio + pedonale", desc:"Combinato veicoli + persone" },
  { id:"rec-pannello", nome:"Recinzione a pannelli", desc:"Pannelli modulari su pali" },
  { id:"ringhiera", nome:"Ringhiera", desc:"Balconi, terrazze, scale" },
  { id:"parapetto", nome:"Parapetto", desc:"Protezione, altezza normativa" },
  { id:"staccionata", nome:"Staccionata", desc:"Giardino, rustico, delimitazione" },
];
const MATERIALI = ["Ferro zincato verniciato","Alluminio","Acciaio inox 304","Acciaio inox 316","COR-TEN","Ferro battuto","WPC composito","Legno trattato"];
const TAMPONAMENTO = ["Doghe orizzontali","Doghe verticali","Lamelle orientabili","Pannello cieco","Grigliato","Rete elettrosaldata","Tubolare verticale","Tubolare orizzontale","Misto (basso cieco + alto aperto)","Vetro (temperato/stratificato)"];
const AUTOMAZIONE = ["Manuale","Predisposizione cavidotto","Motore interrato 230V","Motore interrato 24V","Motore a cremagliera","Motore a catena","Motore solare","Motore a batteria"];
const AUTO_ACC = ["Telecomando 2 canali","Telecomando 4 canali","Tastierino numerico","Lettore badge/chiave","Fotocellule coppia","Lampeggiante","Antenna esterna","Costa sensibile","Selettore a chiave","Modulo WiFi/App","Batteria tampone"];
const PILASTRI = ["Esistenti (non toccare)","Nuovi in muratura","Nuovi in acciaio","Nuovi prefabbricati","Rivestimento su esistenti"];
const PILASTRI_DIM = ["20×20 cm","25×25 cm","30×30 cm","35×35 cm","40×40 cm","Tondo Ø20","Tondo Ø25","Su misura"];
const AGGANCIO = ["A pavimento con piastra","Interrato con fondazione","Su muretto esistente","Frontale a muro","Su pilastro con cardini","Tasselli chimici"];
const FINITURE = ["Zincatura a caldo","Verniciatura a polvere","Corten naturale","Verniciatura a liquido","Anodizzazione (alluminio)","Impregnante (legno)"];
const COLORI = ["Nero RAL 9005","Antracite RAL 7016","Grigio RAL 7035","Bianco RAL 9010","Marrone RAL 8017","Verde RAL 6005","Corten effect","Effetto legno","RAL custom"];

// ═══ UI ═══
const Chip = ({ label, sel, color, onTap, small }: any) => (
  <div onClick={onTap} style={{ padding: small?"5px 10px":"7px 13px", borderRadius:9, border:`1.5px solid ${sel?color||CANC_COLOR:T.bdr}`, background:sel?(color||CANC_COLOR)+"14":T.card, fontSize:small?10:11, fontWeight:sel?700:500, color:sel?(color||CANC_COLOR):T.text, cursor:"pointer", transition:"all .12s", fontFamily:FF, userSelect:"none" as any }}>{label}</div>
);
const ChipSel = ({ label, options, value, onChange, color, small }: any) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase" as any, letterSpacing:0.5 }}>{label}</div>
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" as any }}>{options.map((o:string) => <Chip key={o} label={o} sel={value===o} color={color} onTap={() => onChange(o)} small={small}/>)}</div>
  </div>
);
const ChipMulti = ({ label, options, value=[], onChange, small }: any) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase" as any, letterSpacing:0.5 }}>{label}</div>
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" as any }}>
      {options.map((o:string) => <Chip key={o} label={o} sel={value.includes(o)} onTap={() => onChange(value.includes(o)?value.filter((x:string)=>x!==o):[...value,o])} small={small}/>)}
    </div>
  </div>
);
const SectionAcc = ({ icon, title, color, count, open, onToggle }: any) => (
  <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0", cursor:"pointer", borderBottom:`1px solid ${T.bdr}`, marginBottom:open?12:0, userSelect:"none" as any }}>
    <span style={{ fontSize:16 }}>{icon}</span>
    <span style={{ fontSize:13, fontWeight:700, color:color||T.text, flex:1 }}>{title}</span>
    {count>0 && <span style={{ fontSize:9, fontWeight:700, background:(color||CANC_COLOR)+"20", color:color||CANC_COLOR, padding:"2px 8px", borderRadius:20 }}>{count}</span>}
    <span style={{ fontSize:11, color:T.sub, transform:open?"rotate(180deg)":"rotate(0)", transition:"transform .2s" }}>▼</span>
  </div>
);
const NumInput = ({ label, value, onChange, unit="mm" }: any) => (
  <div style={{ marginBottom:10 }}>
    <div style={{ fontSize:10, color:T.sub, marginBottom:3, fontWeight:600 }}>{label}</div>
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <input type="number" inputMode="numeric" value={value||""} onChange={(e:any)=>onChange(parseInt(e.target.value)||0)} style={{ flex:1, padding:"10px 12px", fontSize:15, fontFamily:FM, fontWeight:600, border:`1.5px solid ${T.bdr}`, borderRadius:9, background:T.card, color:T.text, outline:"none" }}/>
      <span style={{ fontSize:10, color:T.sub, background:T.bg, padding:"7px 9px", borderRadius:7, fontWeight:600 }}>{unit}</span>
    </div>
  </div>
);
const PhotoRow = ({ foto, onCapture }: any) => (
  <div style={{ display:"flex", gap:6, marginTop:10 }}>
    {["fronte","retro","dettaglio"].map(cat => {
      const has = foto?.[cat];
      return (<div key={cat} onClick={()=>onCapture(cat)} style={{ flex:1, height:56, borderRadius:10, border:has?`2px solid ${T.green}`:`2px dashed ${T.bdr}`, display:"flex", flexDirection:"column" as any, alignItems:"center", justifyContent:"center", cursor:"pointer", background:has?T.green+"08":T.card, overflow:"hidden", position:"relative" as any }}>
        {has ? <img src={has} style={{ width:"100%", height:"100%", objectFit:"cover" as any }} alt=""/> : <><span style={{ fontSize:16 }}>📷</span><span style={{ fontSize:8, color:T.sub, fontWeight:600 }}>{cat==="fronte"?"Foto ingresso":cat==="retro"?"Schizzo":"Dettaglio"}</span></>}
      </div>);
    })}
  </div>
);

// ═══ TIPOLOGIA THUMBS ═══
const TipoThumb = ({ id, size=48 }: { id:string; size?:number }) => {
  const s=size; const C=CANC_COLOR;
  const thumbs: Record<string,JSX.Element> = {
    "batt-sing": <svg width={s} height={s} viewBox="0 0 56 56"><rect x="4" y="10" width="6" height="36" rx="1" fill="#888"/><rect x="46" y="10" width="6" height="36" rx="1" fill="#888"/><rect x="10" y="14" width="36" height="28" rx="1" fill="none" stroke={C} strokeWidth="1.5"/>{[0,1,2,3,4].map(i=><rect key={i} x={14+i*7} y="16" width="2" height="24" rx="0.5" fill={C+"55"}/>)}<path d="M46 42 Q46 26 32 22" fill="none" stroke={C+"33"} strokeWidth="0.8" strokeDasharray="3,2"/></svg>,
    "batt-dopp": <svg width={s} height={s} viewBox="0 0 56 56"><rect x="4" y="10" width="6" height="36" rx="1" fill="#888"/><rect x="46" y="10" width="6" height="36" rx="1" fill="#888"/><rect x="10" y="14" width="16" height="28" rx="1" fill="none" stroke={C} strokeWidth="1.5"/><rect x="30" y="14" width="16" height="28" rx="1" fill="none" stroke={C} strokeWidth="1.5"/><line x1="28" y1="14" x2="28" y2="42" stroke={C} strokeWidth="1" strokeDasharray="2,2"/></svg>,
    "scorr": <svg width={s} height={s} viewBox="0 0 56 56"><rect x="4" y="10" width="6" height="36" rx="1" fill="#888"/><rect x="46" y="10" width="6" height="36" rx="1" fill="#888"/><rect x="10" y="14" width="30" height="28" rx="1" fill="none" stroke={C} strokeWidth="1.5"/><line x1="4" y1="44" x2="52" y2="44" stroke={C} strokeWidth="2"/><polygon points="32,27 40,28 32,29" fill={C}/></svg>,
    "scorr-tele": <svg width={s} height={s} viewBox="0 0 56 56"><rect x="4" y="10" width="6" height="36" rx="1" fill="#888"/><rect x="46" y="10" width="6" height="36" rx="1" fill="#888"/><rect x="10" y="14" width="22" height="28" rx="1" fill="none" stroke={C} strokeWidth="1.5"/><rect x="14" y="16" width="22" height="24" rx="1" fill="none" stroke={C+"66"} strokeWidth="1"/><line x1="4" y1="44" x2="52" y2="44" stroke={C} strokeWidth="2"/></svg>,
    "pedonale": <svg width={s} height={s} viewBox="0 0 56 56"><rect x="14" y="10" width="6" height="36" rx="1" fill="#888"/><rect x="36" y="10" width="6" height="36" rx="1" fill="#888"/><rect x="20" y="14" width="16" height="28" rx="1" fill="none" stroke={C} strokeWidth="1.5"/><circle cx="33" cy="28" r="2" fill={C}/></svg>,
    "carraio-ped": <svg width={s} height={s} viewBox="0 0 56 56"><rect x="2" y="10" width="5" height="36" rx="1" fill="#888"/><rect x="28" y="10" width="4" height="36" rx="1" fill="#888"/><rect x="49" y="10" width="5" height="36" rx="1" fill="#888"/><rect x="7" y="14" width="21" height="28" rx="1" fill="none" stroke={C} strokeWidth="1.2"/><rect x="32" y="16" width="17" height="24" rx="1" fill="none" stroke={C} strokeWidth="1.2"/></svg>,
    "rec-pannello": <svg width={s} height={s} viewBox="0 0 56 56">{[0,1,2,3].map(i=><rect key={i} x={6+i*14} y="10" width="3" height="36" rx="0.5" fill="#888"/>)}{[0,1,2].map(i=><rect key={`p${i}`} x={9+i*14} y="14" width="11" height="28" rx="1" fill="none" stroke={C} strokeWidth="1"/>)}</svg>,
    "ringhiera": <svg width={s} height={s} viewBox="0 0 56 56"><rect x="6" y="10" width="44" height="3" rx="1" fill={C}/><rect x="6" y="36" width="44" height="3" rx="1" fill={C+"66"}/>{[0,1,2,3,4,5,6].map(i=><rect key={i} x={10+i*6} y="13" width="2" height="23" rx="0.5" fill={C+"77"}/>)}<rect x="4" y="8" width="4" height="36" rx="1" fill="#888"/><rect x="48" y="8" width="4" height="36" rx="1" fill="#888"/></svg>,
    "parapetto": <svg width={s} height={s} viewBox="0 0 56 56"><rect x="6" y="16" width="44" height="4" rx="1" fill={C}/><rect x="8" y="20" width="40" height="8" rx="1" fill={C+"15"} stroke={C+"33"} strokeWidth="0.5"/><rect x="6" y="28" width="44" height="3" rx="1" fill={C+"55"}/><rect x="4" y="14" width="4" height="28" rx="1" fill="#888"/><rect x="48" y="14" width="4" height="28" rx="1" fill="#888"/></svg>,
    "staccionata": <svg width={s} height={s} viewBox="0 0 56 56"><rect x="6" y="22" width="44" height="3" rx="0.5" fill="#a18072"/><rect x="6" y="32" width="44" height="3" rx="0.5" fill="#a18072"/>{[0,1,2,3,4,5].map(i=><path key={i} d={`M${10+i*8} 12 L${14+i*8} 8 L${18+i*8} 12 L${18+i*8} 40 L${10+i*8} 40 Z`} fill="#c4a882" stroke="#a18072" strokeWidth="0.8"/>)}</svg>,
  };
  return thumbs[id]||thumbs["batt-sing"];
};

// ═══ CANCELLO DRAWING ═══
const CancelloDraw = ({ d }: any) => {
  const tipo=d.tipologia||""; const larg=d.larghezza||"—"; const alt=d.altezza||"—";
  const isScorr=tipo.includes("scorr"); const isDopp=tipo.includes("dopp")||tipo==="carraio-ped";
  const isRec=tipo.includes("rec")||tipo==="ringhiera"||tipo==="parapetto"||tipo==="staccionata";
  const hasPend=d.pendenza&&d.pendenza>0;
  return (
    <div style={{ background:T.card, borderRadius:12, border:`1.5px solid ${T.bdr}`, padding:"12px 8px 6px", marginBottom:14 }}>
      <div style={{ fontSize:9, fontWeight:700, color:T.sub, textTransform:"uppercase" as any, letterSpacing:0.5, marginBottom:6, textAlign:"center" as any }}>Vista frontale</div>
      <svg width="100%" viewBox="0 0 240 150" style={{ maxHeight:180 }}>
        <line x1="0" y1={hasPend?128:120} x2="240" y2="120" stroke="#a1a1aa" strokeWidth="1.5"/>
        {isRec ? <>
          {[0,1,2,3,4].map(i=><rect key={i} x={20+i*50} y="30" width="6" height="90" rx="1" fill="#888" stroke="#666" strokeWidth="0.5"/>)}
          {[0,1,2,3].map(i=><rect key={`p${i}`} x={26+i*50} y="40" width="44" height="70" rx="1" fill="none" stroke={CANC_COLOR} strokeWidth="1.2"/>)}
          <line x1="20" y1="135" x2="220" y2="135" stroke={T.sub} strokeWidth="0.5"/>
          <text x="120" y="146" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={CANC_COLOR}>Lung. {larg}</text>
        </> : <>
          <rect x="20" y="20" width="14" height="100" rx="2" fill="#999" stroke="#777" strokeWidth="0.8"/>
          <rect x="206" y="20" width="14" height="100" rx="2" fill="#999" stroke="#777" strokeWidth="0.8"/>
          {isDopp ? <>
            <rect x="34" y="32" width="80" height="85" rx="1" fill="none" stroke={CANC_COLOR} strokeWidth="1.5"/>
            <rect x="126" y="32" width="80" height="85" rx="1" fill="none" stroke={CANC_COLOR} strokeWidth="1.5"/>
            <line x1="120" y1="32" x2="120" y2="117" stroke={CANC_COLOR} strokeWidth="1.5" strokeDasharray="4,3"/>
          </> : isScorr ? <>
            <rect x="34" y="32" width="140" height="85" rx="1" fill="none" stroke={CANC_COLOR} strokeWidth="1.5"/>
            <line x1="20" y1="119" x2="220" y2="119" stroke={CANC_COLOR} strokeWidth="2.5"/>
            <line x1="80" y1="74" x2="180" y2="74" stroke={CANC_COLOR} strokeWidth="1.5"/><polygon points="176,71 184,74 176,77" fill={CANC_COLOR}/>
          </> : <>
            <rect x="34" y="32" width="172" height="85" rx="1" fill="none" stroke={CANC_COLOR} strokeWidth="1.5"/>
            <path d="M34 117 Q34 60 100 50" fill="none" stroke={CANC_COLOR+"33"} strokeWidth="0.8" strokeDasharray="4,3"/>
            <circle cx="196" cy="74" r="3" fill={CANC_COLOR}/>
          </>}
          <line x1="34" y1="132" x2="206" y2="132" stroke={T.sub} strokeWidth="0.5"/>
          <text x="120" y="144" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={CANC_COLOR}>{larg}</text>
          <line x1="222" y1="32" x2="222" y2="117" stroke={T.sub} strokeWidth="0.5"/>
          <text x="234" y="78" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={CANC_COLOR} transform="rotate(-90,234,78)">{alt}</text>
        </>}
        {!tipo && <text x="120" y="75" textAnchor="middle" fontSize="11" fill={T.sub}>Seleziona tipologia</text>}
        {hasPend && <text x="200" y="112" fontSize="8" fill={T.red}>↗ {d.pendenza}°</text>}
      </svg>
    </div>
  );
};

// ═══ MAIN ═══
interface CancelliDetailPanelProps { vano:any; onUpdate:(field:string,value:any)=>void; onBack:()=>void; aziendaId?:string; cmId?:string; }

export default function CancelliDetailPanel({ vano, onUpdate, onBack, aziendaId, cmId }: CancelliDetailPanelProps) {
  const [step,setStep]=useState(0);
  const [sec,setSec]=useState<Record<string,boolean>>({ tipo:true, mis:true, design:false, auto:false, pil:false, mont:false });
  const tog=(s:string)=>setSec(p=>({...p,[s]:!p[s]}));
  const d=vano||{}; const m=d.misure||{};
  const set=useCallback((f:string,v:any)=>{onUpdate(f,v)},[onUpdate]);
  const setM=useCallback((f:string,v:any)=>{onUpdate("misure",{...(d.misure||{}),[f]:v})},[onUpdate,d.misure]);
  const handleFoto=(cat:string)=>{if(aziendaId&&cmId&&d.id){captureFotoVano({aziendaId,cmId,vanoId:String(d.id),categoria:cat},(url)=>set("foto",{...(d.foto||{}),[cat]:url}),(err)=>console.warn("[Foto]",err));} else {captureFotoSimple((url)=>set("foto",{...(d.foto||{}),[cat]:url}));}};
  const isRec=(d.tipologia||"").includes("rec")||d.tipologia==="ringhiera"||d.tipologia==="parapetto"||d.tipologia==="staccionata";
  const isGate=!isRec&&!!d.tipologia;

  const tipoC=[d.tipologia,d.materiale].filter(Boolean).length;
  const misC=[m.lCentro,m.hCentro].filter(Boolean).length;
  const desC=[d.tamponamento,d.finitura,d.colore].filter(Boolean).length;
  const autoC=[d.automazione,...(d.autoAcc||[])].filter(Boolean).length;
  const pilC=[d.pilastri,d.pilDim].filter(Boolean).length;
  const montC=[d.aggancio].filter(Boolean).length;
  const total=tipoC+misC+desC+autoC+pilC+montC;
  const totalMax=16;
  const STEPS=["Tipo & Misure","Design & Auto","Riepilogo"];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:FF }}>
      <div style={{ background:T.topbar, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky" as any, top:0, zIndex:99 }}>
        <div onClick={onBack} style={{ width:30, height:30, borderRadius:7, background:"#ffffff15", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, color:"#fff" }}>←</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>🏗️ {isRec?"Recinzione":"Cancello"} — Presa Misure</div>
          <div style={{ fontSize:10, color:"#888" }}>{d.nome||"Vano"} · {d.stanza||""}</div>
        </div>
        <div style={{ background:total>=totalMax*0.5?T.green+"30":CANC_COLOR+"30", color:total>=totalMax*0.5?T.green:CANC_COLOR, padding:"3px 10px", borderRadius:16, fontSize:11, fontWeight:800, fontFamily:FM }}>{total}/{totalMax}</div>
      </div>
      <div style={{ height:3, background:T.bdr }}><div style={{ height:3, background:total>=totalMax*0.5?T.green:CANC_COLOR, width:`${(total/totalMax)*100}%`, transition:"width .3s", borderRadius:2 }}/></div>
      <div style={{ display:"flex", gap:6, padding:"10px 16px", justifyContent:"center" }}>
        {STEPS.map((s,i)=>(<div key={i} onClick={()=>setStep(i)} style={{ padding:"5px 14px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background:step===i?CANC_COLOR:T.card, color:step===i?"#fff":T.sub, border:`1px solid ${step===i?CANC_COLOR:T.bdr}`, transition:"all .15s" }}>{i+1}. {s}</div>))}
      </div>
      <div style={{ padding:"4px 16px 100px" }}>
        {step===0 && <>
          {d.tipologia && <CancelloDraw d={{ tipologia:d.tipologia, larghezza:m.lCentro, altezza:m.hCentro, pendenza:d.pendenza }}/>}
          <SectionAcc icon="🏗️" title="Tipologia" color={CANC_COLOR} count={tipoC} open={sec.tipo} onToggle={()=>tog("tipo")}/>
          {sec.tipo && <div>
            <div style={{ display:"flex", flexDirection:"column" as any, gap:5, marginBottom:12 }}>
              {TIPOLOGIE.map(t=>(<div key={t.id} onClick={()=>set("tipologia",t.id===d.tipologia?null:t.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:10, border:`1.5px solid ${d.tipologia===t.id?CANC_COLOR:T.bdr}`, background:d.tipologia===t.id?CANC_COLOR+"0a":T.card, cursor:"pointer", transition:"all .12s" }}>
                <div style={{ width:48, height:48, borderRadius:7, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><TipoThumb id={t.id}/></div>
                <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:700, color:d.tipologia===t.id?CANC_COLOR:T.text }}>{t.nome}</div><div style={{ fontSize:9, color:T.sub }}>{t.desc}</div></div>
                {d.tipologia===t.id && <div style={{ width:16, height:16, borderRadius:8, background:CANC_COLOR, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", fontWeight:800 }}>✓</div>}
              </div>))}
            </div>
            <ChipSel label="Materiale" options={MATERIALI} value={d.materiale} onChange={(v:string)=>set("materiale",v)} color={CANC_COLOR}/>
          </div>}
          <SectionAcc icon="📐" title="Misure" color={CANC_COLOR} count={misC} open={sec.mis} onToggle={()=>tog("mis")}/>
          {sec.mis && <div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1 }}><NumInput label={isRec?"Lunghezza totale":"Larghezza luce"} value={m.lCentro} onChange={(v:number)=>setM("lCentro",v)}/></div>
              <div style={{ flex:1 }}><NumInput label="Altezza" value={m.hCentro} onChange={(v:number)=>setM("hCentro",v)}/></div>
            </div>
            {d.tipologia==="carraio-ped" && <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1 }}><NumInput label="Largh. carraio" value={d.largCarraio} onChange={(v:number)=>set("largCarraio",v)}/></div>
              <div style={{ flex:1 }}><NumInput label="Largh. pedonale" value={d.largPed} onChange={(v:number)=>set("largPed",v)}/></div>
            </div>}
            {(d.tipologia||"").includes("dopp") && <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1 }}><NumInput label="Anta SX" value={d.antaSx} onChange={(v:number)=>set("antaSx",v)}/></div>
              <div style={{ flex:1 }}><NumInput label="Anta DX" value={d.antaDx} onChange={(v:number)=>set("antaDx",v)}/></div>
            </div>}
            <NumInput label="Pendenza terreno" value={d.pendenza} onChange={(v:number)=>set("pendenza",v)} unit="°"/>
            {d.pendenza>5 && <div style={{ fontSize:10, color:T.red, background:T.red+"12", border:`1px solid ${T.red}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>⚠ Pendenza &gt; 5°: necessario cancello con compensazione dislivello</div>}
            {isRec && <NumInput label="N° pannelli/campate" value={d.nPannelli} onChange={(v:number)=>set("nPannelli",v)} unit="pz"/>}
          </div>}
        </>}

        {step===1 && <>
          <SectionAcc icon="⚙️" title="Design e finitura" color={CANC_COLOR} count={desC} open={sec.design} onToggle={()=>tog("design")}/>
          {sec.design && <div>
            <ChipSel label="Tamponamento" options={TAMPONAMENTO} value={d.tamponamento} onChange={(v:string)=>set("tamponamento",v)} color={CANC_COLOR}/>
            <ChipSel label="Finitura" options={FINITURE} value={d.finitura} onChange={(v:string)=>set("finitura",v)} color={CANC_COLOR}/>
            <ChipSel label="Colore" options={COLORI} value={d.colore} onChange={(v:string)=>set("colore",v)} color={CANC_COLOR} small/>
            {(d.materiale||"")==="COR-TEN" && <div style={{ fontSize:10, color:T.acc, background:T.acc+"12", border:`1px solid ${T.acc}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>🟫 COR-TEN: ossidazione naturale 6-12 mesi. Macchia durante ossidazione.</div>}
          </div>}
          {isGate && <>
            <SectionAcc icon="⚡" title="Automazione" color={CANC_COLOR} count={autoC} open={sec.auto} onToggle={()=>tog("auto")}/>
            {sec.auto && <div>
              <ChipSel label="Tipo automazione" options={AUTOMAZIONE} value={d.automazione} onChange={(v:string)=>set("automazione",v)} color={CANC_COLOR}/>
              {d.automazione&&d.automazione!=="Manuale"&&d.automazione!=="Predisposizione cavidotto" && <ChipMulti label="Accessori automazione" options={AUTO_ACC} value={d.autoAcc||[]} onChange={(v:string[])=>set("autoAcc",v)} small/>}
              {d.automazione==="Predisposizione cavidotto" && <div style={{ fontSize:10, color:T.acc, background:T.acc+"12", border:`1px solid ${T.acc}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>⚡ Predisposizione: cavidotto Ø40mm + cassetta 503 ai pilastri + alimentazione 230V</div>}
              {d.automazione&&d.automazione.includes("solare") && <div style={{ fontSize:10, color:T.green, background:T.green+"12", border:`1px solid ${T.green}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>☀️ Solare: nessun cablaggio, pannello su pilastro, batteria integrata</div>}
            </div>}
          </>}
          <SectionAcc icon="🧱" title="Pilastri e supporti" color={CANC_COLOR} count={pilC} open={sec.pil} onToggle={()=>tog("pil")}/>
          {sec.pil && <div>
            <ChipSel label="Pilastri" options={PILASTRI} value={d.pilastri} onChange={(v:string)=>set("pilastri",v)} color={CANC_COLOR}/>
            {d.pilastri&&d.pilastri!=="Esistenti (non toccare)" && <ChipSel label="Dimensione pilastri" options={PILASTRI_DIM} value={d.pilDim} onChange={(v:string)=>set("pilDim",v)} color={CANC_COLOR} small/>}
            {isRec && <NumInput label="Interasse pali" value={d.interasse} onChange={(v:number)=>set("interasse",v)}/>}
          </div>}
          <SectionAcc icon="🔨" title="Montaggio" color={CANC_COLOR} count={montC} open={sec.mont} onToggle={()=>tog("mont")}/>
          {sec.mont && <div><ChipSel label="Sistema aggancio" options={AGGANCIO} value={d.aggancio} onChange={(v:string)=>set("aggancio",v)} color={CANC_COLOR}/></div>}
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase" as any }}>Note</div>
            <textarea value={d.note||""} onChange={(e:any)=>set("note",e.target.value)} placeholder="Dislivello terreno, ostacoli, passaggio cavi..." style={{ width:"100%", padding:"10px 12px", fontSize:11, fontFamily:FF, border:`1.5px solid ${T.bdr}`, borderRadius:9, background:T.card, minHeight:50, resize:"vertical" as any, outline:"none", boxSizing:"border-box" as any }}/>
          </div>
          <PhotoRow foto={d.foto} onCapture={handleFoto}/>
        </>}

        {step===2 && <>
          <div style={{ background:T.card, borderRadius:12, border:`1.5px solid ${T.bdr}`, overflow:"hidden" }}>
            <div style={{ padding:"10px 14px", background:T.topbar, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12 }}>📋</span><span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>Riepilogo {isRec?"Recinzione":"Cancello"}</span>
              <span style={{ fontSize:9, color:"#888", marginLeft:"auto", fontFamily:FM }}>{total} campi</span>
            </div>
            <div style={{ padding:"12px 14px", fontSize:11, lineHeight:2.2, color:T.text }}>
              {d.tipologia && <RLine label="Tipologia" value={TIPOLOGIE.find(t=>t.id===d.tipologia)?.nome||d.tipologia} color={CANC_COLOR}/>}
              {d.materiale && <RLine label="Materiale" value={d.materiale}/>}
              {m.lCentro>0 && <RLine label={isRec?"Lunghezza":"Larghezza"} value={`${m.lCentro} mm`} mono/>}
              {m.hCentro>0 && <RLine label="Altezza" value={`${m.hCentro} mm`} mono/>}
              {d.pendenza>0 && <RLine label="Pendenza" value={`${d.pendenza}°`} color={T.red}/>}
              {d.tamponamento && <RLine label="Tamponamento" value={d.tamponamento}/>}
              {d.finitura && <RLine label="Finitura" value={d.finitura} sub={d.colore||undefined}/>}
              {d.automazione&&d.automazione!=="Manuale" && <RLine label="Automazione" value={d.automazione}/>}
              {(d.autoAcc||[]).length>0 && <RLine label="Acc. auto" value={(d.autoAcc||[]).join(", ")}/>}
              {d.pilastri && <RLine label="Pilastri" value={d.pilastri} sub={d.pilDim||undefined}/>}
              {d.aggancio && <RLine label="Aggancio" value={d.aggancio}/>}
              {d.note && <RLine label="Note" value={d.note}/>}
            </div>
            {d.foto&&Object.values(d.foto).some(Boolean) && <div style={{ padding:"8px 14px 12px", display:"flex", gap:6 }}>
              {Object.entries(d.foto).filter(([,v])=>v).map(([k,v]:any)=><img key={k} src={v} style={{ width:70, height:52, objectFit:"cover" as any, borderRadius:6, border:`1px solid ${T.bdr}` }} alt={k}/>)}
            </div>}
          </div>
        </>}
      </div>
      <div style={{ position:"fixed" as any, bottom:0, left:0, right:0, background:T.card, borderTop:`1px solid ${T.bdr}`, padding:"10px 16px", display:"flex", gap:8, maxWidth:480, margin:"0 auto", zIndex:99 }}>
        <div onClick={()=>step>0?setStep(step-1):onBack()} style={{ flex:1, padding:"12px", borderRadius:10, background:T.bg, textAlign:"center" as any, fontSize:12, fontWeight:700, color:T.sub, cursor:"pointer" }}>{step>0?"← Indietro":"← Esci"}</div>
        <div onClick={()=>step<2?setStep(step+1):onBack()} style={{ flex:2, padding:"12px", borderRadius:10, background:step===2?(total>=5?T.green:T.bdr):CANC_COLOR, textAlign:"center" as any, fontSize:12, fontWeight:800, color:step===2?(total>=5?"#fff":T.sub):"#fff", cursor:"pointer", transition:"all .2s" }}>
          {step===2?`✓ Salva ${isRec?"recinzione":"cancello"} · ${total}/${totalMax}`:`Avanti → ${STEPS[step+1]}`}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus,textarea:focus{border-color:${CANC_COLOR}!important;box-shadow:0 0 0 3px ${CANC_COLOR}20}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}

const RLine = ({ label, value, sub, color, mono }: { label:string; value:string; sub?:string; color?:string; mono?:boolean }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"2px 0" }}>
    <span style={{ color:T.sub, fontSize:10 }}>{label}:</span>
    <span style={{ fontWeight:700, fontSize:11, color:color||T.text, fontFamily:mono?FM:FF, textAlign:"right" as any, maxWidth:"65%" }}>
      {value}{sub && <span style={{ fontSize:9, color:T.sub, fontWeight:500, marginLeft:4 }}>{sub}</span>}
    </span>
  </div>
);
