// ═══════════════════════════════════════════════════════════════════
// MASTRO ERP — PersianeDetailPanel.tsx
// Form misure completo per settore PERSIANE
// Basato su catalogo MastroPersianeDemo (6 tipologie + 7 modelli + ferramenta)
//
// INTEGRAZIONE:
// In VanoSectorRouter.tsx:
//   import PersianeDetailPanel from "./PersianeDetailPanel";
//   case "persiane": return <PersianeDetailPanel vano={vano} onUpdate={updateField} onBack={onBack} />;
//
// CAMPI SALVATI nel vano:
// tipologia, modello, materiale
// misure.lCentro, misure.hCentro, profSpall
// stecche, ante, colore, aggancio
// ferramenta[], accessori[]
// note, foto.fronte, foto.retro, foto.dettaglio
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { captureFotoVano, captureFotoSimple } from "@/lib/vano-foto-uploader";

const T = { bg:"#F2F1EC", card:"#FFFFFF", topbar:"#1A1A1C", acc:"#D08008", text:"#1A1A1C", sub:"#8E8E93", bdr:"#E5E4DF", green:"#1A9E73", red:"#DC4444", blue:"#3B7FE0" };
const FF = "'Inter', system-ui, sans-serif";
const FM = "'JetBrains Mono', monospace";
const PERS_COLOR = "#92400e";

const TIPOLOGIE = ["Battente alla fiorentina","Battente alla genovese","Battente alla romana","Scorrevole","Libro","Fissa (schermo solare)"];
const MATERIALI = ["Alluminio","Legno","PVC","Alluminio effetto legno","Ferro battuto"];
const STECCHE = ["Fissa orientabile","Fissa chiusa","Mobile orientabile","Mista (fissa + mobile)","Cieca (piena)"];
const ANTE = ["1 anta","2 ante","3 ante","4 ante"];
const COLORI = ["Bianco RAL 9010","Avorio RAL 1013","Marrone RAL 8017","Verde RAL 6005","Grigio RAL 7016","Antracite RAL 7016S","Grigio chiaro RAL 7035","Testa di moro","Noce","Rovere dorato","Douglas","RAL custom","NCS custom","Effetto legno custom"];
const FERRAMENTA = ["Cardini a muro","Cardini a telaio","Cerniere a scomparsa","Perni regolabili","Cremonese","Spagnoletta","Fermapersiana automatico","Fermapersiana a molla","Gancio a vento"];
const ACCESSORI = ["Asta di manovra","Stecca chiusura","Pomolo interno","Blocco di sicurezza","Zanzariera integrata","Catenaccio alto/basso"];
const AGGANCIO_PERS = ["A muro con cardini","A telaio finestra","Su controtelaio","Frontale su cappotto","A pavimento con perno","Incasso a filo muro"];
const MISURE_STD = [{l:600,h:1200,lb:"60×120"},{l:800,h:1200,lb:"80×120"},{l:800,h:1400,lb:"80×140"},{l:1000,h:1400,lb:"100×140"},{l:1200,h:1400,lb:"120×140"},{l:1400,h:1600,lb:"140×160"}];
const MODELLI = [
  { id:"p01", nome:"Fiorentina Classic", tipo:"Battente alla fiorentina", bg1:"#78543e", bg2:"#a18072" },
  { id:"p02", nome:"Genovese Slim", tipo:"Battente alla genovese", bg1:"#57534e", bg2:"#78716c" },
  { id:"p03", nome:"Scorrevole Flat", tipo:"Scorrevole", bg1:"#a1a1aa", bg2:"#d4d4d8" },
  { id:"p04", nome:"Libro Compatta", tipo:"Libro", bg1:"#94a3b8", bg2:"#e2e8f0" },
  { id:"p05", nome:"Fissa Solare", tipo:"Fissa (schermo solare)", bg1:"#b45309", bg2:"#fbbf24" },
  { id:"p06", nome:"Romana Tradizione", tipo:"Battente alla romana", bg1:"#713f12", bg2:"#92400e" },
  { id:"p07", nome:"Blindata Security", tipo:"Battente alla fiorentina", bg1:"#3f3f46", bg2:"#57534e" },
];

const Chip = ({ label, sel, color, onTap, small }: any) => (
  <div onClick={onTap} style={{ padding:small?"5px 10px":"7px 13px", borderRadius:9, border:`1.5px solid ${sel?color||PERS_COLOR:T.bdr}`, background:sel?(color||PERS_COLOR)+"14":T.card, fontSize:small?10:11, fontWeight:sel?700:500, color:sel?(color||PERS_COLOR):T.text, cursor:"pointer", transition:"all .12s", fontFamily:FF, userSelect:"none" as any }}>{label}</div>
);
const ChipSel = ({ label, options, value, onChange, color, small }: any) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase" as any, letterSpacing:0.5 }}>{label}</div>
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" as any }}>{options.map((o:string) => <Chip key={o} label={o} sel={value===o} color={color} onTap={() => onChange(o)} small={small}/>)}</div>
  </div>
);
const CheckItem = ({ label, checked, onToggle }: any) => (
  <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, border:`1.5px solid ${checked?PERS_COLOR:T.bdr}`, background:checked?PERS_COLOR+"0a":T.card, cursor:"pointer", marginBottom:4, userSelect:"none" as any }}>
    <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${checked?PERS_COLOR:T.bdr}`, background:checked?PERS_COLOR:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:800 }}>{checked?"✓":""}</div>
    <span style={{ fontSize:11, fontWeight:checked?600:400, color:checked?PERS_COLOR:T.text }}>{label}</span>
  </div>
);
const SectionAcc = ({ icon, title, color, count, open, onToggle }: any) => (
  <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0", cursor:"pointer", borderBottom:`1px solid ${T.bdr}`, marginBottom:open?12:0, userSelect:"none" as any }}>
    <span style={{ fontSize:16 }}>{icon}</span>
    <span style={{ fontSize:13, fontWeight:700, color:color||T.text, flex:1 }}>{title}</span>
    {count>0 && <span style={{ fontSize:9, fontWeight:700, background:(color||PERS_COLOR)+"20", color:color||PERS_COLOR, padding:"2px 8px", borderRadius:20 }}>{count}</span>}
    <span style={{ fontSize:11, color:T.sub, transform:open?"rotate(180deg)":"rotate(0)", transition:"transform .2s" }}>▼</span>
  </div>
);
const NumInput = ({ label, value, onChange, unit="mm", placeholder }: any) => (
  <div style={{ marginBottom:10 }}>
    <div style={{ fontSize:10, color:T.sub, marginBottom:3, fontWeight:600 }}>{label}</div>
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <input type="number" inputMode="numeric" value={value||""} onChange={(e:any)=>onChange(parseInt(e.target.value)||0)} placeholder={placeholder||""} style={{ flex:1, padding:"10px 12px", fontSize:15, fontFamily:FM, fontWeight:600, border:`1.5px solid ${T.bdr}`, borderRadius:9, background:T.card, color:T.text, outline:"none" }}/>
      <span style={{ fontSize:10, color:T.sub, background:T.bg, padding:"7px 9px", borderRadius:7, fontWeight:600 }}>{unit}</span>
    </div>
  </div>
);
const PhotoRow = ({ foto, onCapture }: any) => (
  <div style={{ display:"flex", gap:6, marginTop:10 }}>
    {["fronte","retro","dettaglio"].map(cat => {
      const has=foto?.[cat];
      return (<div key={cat} onClick={()=>onCapture(cat)} style={{ flex:1, height:56, borderRadius:10, border:has?`2px solid ${T.green}`:`2px dashed ${T.bdr}`, display:"flex", flexDirection:"column" as any, alignItems:"center", justifyContent:"center", cursor:"pointer", background:has?T.green+"08":T.card, overflow:"hidden", position:"relative" as any }}>
        {has ? <img src={has} style={{ width:"100%", height:"100%", objectFit:"cover" as any }} alt=""/> : <><span style={{ fontSize:16 }}>📷</span><span style={{ fontSize:8, color:T.sub, fontWeight:600 }}>{cat==="fronte"?"Foto esterna":cat==="retro"?"Foto interna":"Dettaglio"}</span></>}
      </div>);
    })}
  </div>
);

const ModelThumb = ({ bg1, bg2 }: { bg1:string; bg2:string }) => (
  <div style={{ width:"100%", height:72, background:`linear-gradient(145deg,${bg1}18,${bg2}28)`, position:"relative" as any, overflow:"hidden", borderRadius:"10px 10px 0 0" }}>
    {Array.from({length:8}, (_,i) => (
      <div key={i} style={{ position:"absolute", left:"12%", top:`${10+i*10}%`, width:"76%", height:"5%", background:i%2 ? bg1 : bg2, borderRadius:1 }}/>
    ))}
  </div>
);

const PersianaDraw = ({ d }: any) => {
  const larg=d.larghezza||"—"; const alt=d.altezza||"—";
  const nAnte=parseInt(d.ante)||2;
  const isScorr=(d.tipologia||"").includes("Scorrevole");
  const isLibro=(d.tipologia||"").includes("Libro");
  const isFissa=(d.tipologia||"").includes("Fissa");
  const antaW=140/nAnte;
  return (
    <div style={{ background:T.card, borderRadius:12, border:`1.5px solid ${T.bdr}`, padding:"12px 8px 6px", marginBottom:14 }}>
      <div style={{ fontSize:9, fontWeight:700, color:T.sub, textTransform:"uppercase" as any, letterSpacing:0.5, marginBottom:6, textAlign:"center" as any }}>Vista frontale</div>
      <svg width="100%" viewBox="0 0 220 180" style={{ maxHeight:200 }}>
        <rect x="20" y="20" width="180" height="140" rx="2" fill="#e8e6e1" stroke="#ccc" strokeWidth="1"/>
        <rect x="40" y="30" width="140" height="110" rx="1" fill="#87CEEB22" stroke="#999" strokeWidth="1"/>
        {Array.from({length:nAnte}, (_,i) => (
          <g key={i}>
            <rect x={40+i*antaW+1} y="31" width={antaW-2} height="108" rx="1" fill={PERS_COLOR+"18"} stroke={PERS_COLOR} strokeWidth="1.5"/>
            {Array.from({length:10}, (_,j) => <line key={j} x1={42+i*antaW} y1={40+j*10} x2={38+(i+1)*antaW} y2={40+j*10} stroke={PERS_COLOR+"44"} strokeWidth="0.8"/>)}
            {!isFissa&&!isScorr&&!isLibro && <><circle cx={i===0?42:38+(i+1)*antaW} cy="50" r="2.5" fill={PERS_COLOR}/><circle cx={i===0?42:38+(i+1)*antaW} cy="120" r="2.5" fill={PERS_COLOR}/></>}
          </g>
        ))}
        {isScorr && <line x1="35" y1="28" x2="185" y2="28" stroke={PERS_COLOR} strokeWidth="2.5"/>}
        {isLibro && Array.from({length:nAnte-1}, (_,i) => <line key={i} x1={40+(i+1)*antaW} y1="31" x2={40+(i+1)*antaW} y2="139" stroke={PERS_COLOR} strokeWidth="1.5" strokeDasharray="3,2"/>)}
        <line x1="40" y1="158" x2="180" y2="158" stroke={T.sub} strokeWidth="0.5"/>
        <text x="110" y="170" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={PERS_COLOR}>{larg}</text>
        <line x1="195" y1="30" x2="195" y2="140" stroke={T.sub} strokeWidth="0.5"/>
        <text x="208" y="88" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={PERS_COLOR} transform="rotate(-90,208,88)">{alt}</text>
        <text x="110" y="14" textAnchor="middle" fontSize="8" fill={T.sub}>{d.tipologia||"Persiana"} · {nAnte} ante</text>
        {!d.tipologia && <text x="110" y="90" textAnchor="middle" fontSize="11" fill={T.sub}>Seleziona tipologia</text>}
      </svg>
    </div>
  );
};

interface PersianeDetailPanelProps { vano:any; onUpdate:(field:string,value:any)=>void; onBack:()=>void; aziendaId?:string; cmId?:string; }

export default function PersianeDetailPanel({ vano, onUpdate, onBack, aziendaId, cmId }: PersianeDetailPanelProps) {
  const [step,setStep]=useState(0);
  const [sec,setSec]=useState<Record<string,boolean>>({ tipo:true, mis:true, config:false, ferr:false });
  const tog=(s:string)=>setSec(p=>({...p,[s]:!p[s]}));
  const d=vano||{}; const m=d.misure||{};
  const set=useCallback((f:string,v:any)=>{onUpdate(f,v)},[onUpdate]);
  const setM=useCallback((f:string,v:any)=>{onUpdate("misure",{...(d.misure||{}),[f]:v})},[onUpdate,d.misure]);
  const handleFoto=(cat:string)=>{if(aziendaId&&cmId&&d.id){captureFotoVano({aziendaId,cmId,vanoId:String(d.id),categoria:cat},(url)=>set("foto",{...(d.foto||{}),[cat]:url}),(err)=>console.warn("[Foto]",err));} else {captureFotoSimple((url)=>set("foto",{...(d.foto||{}),[cat]:url}));}};
  const modelliVisibili=d.tipologia?MODELLI.filter(mo=>mo.tipo===d.tipologia):MODELLI;
  const tipoC=[d.tipologia,d.modello,d.materiale].filter(Boolean).length;
  const misC=[m.lCentro,m.hCentro].filter(Boolean).length;
  const confC=[d.stecche,d.ante,d.colore,d.aggancio].filter(Boolean).length;
  const ferrC=Math.min((d.ferramenta||[]).length,2)+Math.min((d.accessori||[]).length,1);
  const total=tipoC+misC+confC+ferrC;
  const totalMax=14;
  const STEPS=["Tipo & Misure","Config & Ferr.","Riepilogo"];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:FF }}>
      <div style={{ background:T.topbar, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky" as any, top:0, zIndex:99 }}>
        <div onClick={onBack} style={{ width:30, height:30, borderRadius:7, background:"#ffffff15", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, color:"#fff" }}>←</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>🏠 Persiana — Presa Misure</div>
          <div style={{ fontSize:10, color:"#888" }}>{d.nome||"Vano"} · {d.stanza||""}</div>
        </div>
        <div style={{ background:total>=totalMax*0.5?T.green+"30":PERS_COLOR+"30", color:total>=totalMax*0.5?T.green:PERS_COLOR, padding:"3px 10px", borderRadius:16, fontSize:11, fontWeight:800, fontFamily:FM }}>{total}/{totalMax}</div>
      </div>
      <div style={{ height:3, background:T.bdr }}><div style={{ height:3, background:total>=totalMax*0.5?T.green:PERS_COLOR, width:`${(total/totalMax)*100}%`, transition:"width .3s", borderRadius:2 }}/></div>
      <div style={{ display:"flex", gap:6, padding:"10px 16px", justifyContent:"center" }}>
        {STEPS.map((s,i)=>(<div key={i} onClick={()=>setStep(i)} style={{ padding:"5px 14px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background:step===i?PERS_COLOR:T.card, color:step===i?"#fff":T.sub, border:`1px solid ${step===i?PERS_COLOR:T.bdr}`, transition:"all .15s" }}>{i+1}. {s}</div>))}
      </div>
      <div style={{ padding:"4px 16px 100px" }}>
        {step===0 && <>
          {d.tipologia && <PersianaDraw d={{ tipologia:d.tipologia, larghezza:m.lCentro, altezza:m.hCentro, ante:d.ante }}/>}
          <SectionAcc icon="🪟" title="Tipologia e modello" color={PERS_COLOR} count={tipoC} open={sec.tipo} onToggle={()=>tog("tipo")}/>
          {sec.tipo && <div>
            <ChipSel label="Tipologia" options={TIPOLOGIE} value={d.tipologia} onChange={(v:string)=>set("tipologia",v)} color={PERS_COLOR}/>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ fontSize:9, fontWeight:700, color:T.sub, textTransform:"uppercase" as any }}>Modello {d.tipologia?`· ${modelliVisibili.length}`:""}</div>
                {d.modello && <div onClick={()=>set("modello",null)} style={{ fontSize:9, color:T.red, cursor:"pointer", fontWeight:700 }}>✕ Rimuovi</div>}
              </div>
              <div style={{ display:"flex", gap:8, overflowX:"auto" as any, paddingBottom:6 }}>
                {modelliVisibili.map(mod=>(<div key={mod.id} onClick={()=>set("modello",d.modello===mod.id?null:mod.id)} style={{ width:100, minHeight:120, borderRadius:12, border:`2px solid ${d.modello===mod.id?PERS_COLOR:T.bdr}`, background:d.modello===mod.id?PERS_COLOR+"0a":T.card, cursor:"pointer", overflow:"hidden", transition:"all .15s", flexShrink:0, boxShadow:d.modello===mod.id?`0 2px 12px ${PERS_COLOR}25`:"none" }}>
                  <div style={{ position:"relative" as any }}>
                    <ModelThumb bg1={mod.bg1} bg2={mod.bg2}/>
                    {d.modello===mod.id && <div style={{ position:"absolute" as any, top:4, right:4, width:18, height:18, borderRadius:9, background:PERS_COLOR, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:800, zIndex:2 }}>✓</div>}
                  </div>
                  <div style={{ padding:"6px 8px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:d.modello===mod.id?PERS_COLOR:T.text, lineHeight:1.3 }}>{mod.nome}</div>
                    <div style={{ fontSize:8, color:T.sub, marginTop:2 }}>{mod.tipo}</div>
                  </div>
                </div>))}
              </div>
            </div>
            <ChipSel label="Materiale" options={MATERIALI} value={d.materiale} onChange={(v:string)=>set("materiale",v)} color={PERS_COLOR}/>
          </div>}
          <SectionAcc icon="📐" title="Misure" color={PERS_COLOR} count={misC} open={sec.mis} onToggle={()=>tog("mis")}/>
          {sec.mis && <div>
            <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase" as any }}>Misura rapida</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" as any, marginBottom:12 }}>
              {MISURE_STD.map(ms=><Chip key={ms.lb} label={ms.lb} sel={m.lCentro===ms.l&&m.hCentro===ms.h} color={PERS_COLOR} onTap={()=>{setM("lCentro",ms.l);setM("hCentro",ms.h)}}/>)}
            </div>
            <NumInput label="Larghezza vano" value={m.lCentro} onChange={(v:number)=>setM("lCentro",v)}/>
            <NumInput label="Altezza vano" value={m.hCentro} onChange={(v:number)=>setM("hCentro",v)}/>
            <NumInput label="Profondità spalletta" value={d.profSpall} onChange={(v:number)=>set("profSpall",v)} placeholder="Spazio per alloggio anta"/>
          </div>}
        </>}
        {step===1 && <>
          <SectionAcc icon="🎨" title="Configurazione" color={PERS_COLOR} count={confC} open={sec.config} onToggle={()=>tog("config")}/>
          {sec.config && <div>
            <ChipSel label="Tipo stecche" options={STECCHE} value={d.stecche} onChange={(v:string)=>set("stecche",v)} color={PERS_COLOR}/>
            <ChipSel label="Numero ante" options={ANTE} value={d.ante} onChange={(v:string)=>set("ante",v)} color={PERS_COLOR} small/>
            <ChipSel label="Colore" options={COLORI} value={d.colore} onChange={(v:string)=>set("colore",v)} color={PERS_COLOR} small/>
            <ChipSel label="Sistema di aggancio" options={AGGANCIO_PERS} value={d.aggancio} onChange={(v:string)=>set("aggancio",v)} color={PERS_COLOR}/>
          </div>}
          <SectionAcc icon="🔧" title="Ferramenta e accessori" color={PERS_COLOR} count={ferrC} open={sec.ferr} onToggle={()=>tog("ferr")}/>
          {sec.ferr && <div>
            <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:6, textTransform:"uppercase" as any }}>Ferramenta</div>
            {FERRAMENTA.map(f=><CheckItem key={f} label={f} checked={(d.ferramenta||[]).includes(f)} onToggle={()=>{ const curr=d.ferramenta||[]; set("ferramenta",curr.includes(f)?curr.filter((x:string)=>x!==f):[...curr,f]); }}/>)}
            <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:6, marginTop:12, textTransform:"uppercase" as any }}>Accessori</div>
            {ACCESSORI.map(a=><CheckItem key={a} label={a} checked={(d.accessori||[]).includes(a)} onToggle={()=>{ const curr=d.accessori||[]; set("accessori",curr.includes(a)?curr.filter((x:string)=>x!==a):[...curr,a]); }}/>)}
          </div>}
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase" as any }}>Note</div>
            <textarea value={d.note||""} onChange={(e:any)=>set("note",e.target.value)} placeholder="Muro irregolare, cappotto, distanza finestra..." style={{ width:"100%", padding:"10px 12px", fontSize:11, fontFamily:FF, border:`1.5px solid ${T.bdr}`, borderRadius:9, background:T.card, minHeight:50, resize:"vertical" as any, outline:"none", boxSizing:"border-box" as any }}/>
          </div>
          <PhotoRow foto={d.foto} onCapture={handleFoto}/>
        </>}
        {step===2 && <>
          <div style={{ background:T.card, borderRadius:12, border:`1.5px solid ${T.bdr}`, overflow:"hidden" }}>
            <div style={{ padding:"10px 14px", background:T.topbar, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12 }}>📋</span><span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>Riepilogo Persiana</span>
              <span style={{ fontSize:9, color:"#888", marginLeft:"auto", fontFamily:FM }}>{total} campi</span>
            </div>
            <div style={{ padding:"12px 14px", fontSize:11, lineHeight:2.2, color:T.text }}>
              {d.tipologia && <RLine label="Tipologia" value={d.tipologia} color={PERS_COLOR}/>}
              {d.modello && (()=>{ const mo=MODELLI.find(x=>x.id===d.modello); return mo?<RLine label="Modello" value={mo.nome}/>:null; })()}
              {d.materiale && <RLine label="Materiale" value={d.materiale}/>}
              {m.lCentro>0 && <RLine label="Misure" value={`${m.lCentro}×${m.hCentro||"—"} mm`} mono/>}
              {d.profSpall>0 && <RLine label="Prof. spalletta" value={`${d.profSpall} mm`} mono/>}
              {d.stecche && <RLine label="Stecche" value={d.stecche}/>}
              {d.ante && <RLine label="Ante" value={d.ante}/>}
              {d.colore && <RLine label="Colore" value={d.colore}/>}
              {d.aggancio && <RLine label="Aggancio" value={d.aggancio}/>}
              {(d.ferramenta||[]).length>0 && <RLine label="Ferramenta" value={(d.ferramenta||[]).join(", ")}/>}
              {(d.accessori||[]).length>0 && <RLine label="Accessori" value={(d.accessori||[]).join(", ")}/>}
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
        <div onClick={()=>step<2?setStep(step+1):onBack()} style={{ flex:2, padding:"12px", borderRadius:10, background:step===2?(total>=4?T.green:T.bdr):PERS_COLOR, textAlign:"center" as any, fontSize:12, fontWeight:800, color:step===2?(total>=4?"#fff":T.sub):"#fff", cursor:"pointer", transition:"all .2s" }}>
          {step===2?`✓ Salva persiana · ${total}/${totalMax}`:`Avanti → ${STEPS[step+1]}`}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus,textarea:focus{border-color:${PERS_COLOR}!important;box-shadow:0 0 0 3px ${PERS_COLOR}20}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}`}</style>
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
