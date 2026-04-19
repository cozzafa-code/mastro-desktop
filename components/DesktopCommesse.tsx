"use client";
// @ts-nocheck
// MASTRO — DesktopCommesse v3
// Rilievi, anteprima vani, kanban fix, resize lista, design system

import { useState, useRef, useCallback } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I, Ico } from "./mastro-constants";
import ConfiguratoreCommessa from "./ConfiguratoreCommessa";

const TEAL="#1A9E73",DARK="#1A1A1C",RED="#DC4444",BLU="#3B7FE0",AMB="#D08008",PUR="#8B5CF6",ORG="#F97316";
const fmtE=(n:number)=>n>0?"€"+Math.round(n).toLocaleString("it-IT"):"—";
const daysTo=(d:string)=>Math.floor((new Date(d).getTime()-Date.now())/86400000);

const TIPO_RILIEVO=[
  {id:"orientativo",  label:"Orientativo",       color:AMB,  icon:"M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"},
  {id:"definitivo",   label:"Definitivo",         color:TEAL, icon:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"},
  {id:"ricontrollo",  label:"Da ricontrollare",   color:RED,  icon:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"},
  {id:"modifica",     label:"Modifica cantiere",  color:PUR,  icon:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"},
];

// ── Icona SVG inline ─────────────────────────────────────────
const Svg=({path,s=14,c="currentColor"}:any)=>(
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path}/>
  </svg>
);

// ── Anteprima vano mini ───────────────────────────────────────
function VanoPreview({v}:{v:any}){
  const tipo=(v.tipo||"F1A").toUpperCase();
  const hasDisegno=v.disegno?.elements?.length>0;
  const col=TEAL;
  return (
    <div style={{width:52,height:42,borderRadius:6,background:"#F8F7F2",border:`1px solid #E5E3DC`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
      {hasDisegno?(
        <svg viewBox="0 0 100 80" width="48" height="38">
          <rect x="5" y="5" width="90" height="70" fill="none" stroke={col} strokeWidth="3" rx="2"/>
          {tipo.includes("F2")||tipo.includes("2A")?<line x1="50" y1="5" x2="50" y2="75" stroke={col} strokeWidth="2"/>:null}
          {tipo.includes("SC")?<line x1="50" y1="5" x2="50" y2="75" stroke={col} strokeWidth="1.5" strokeDasharray="4"/>:null}
          {!tipo.includes("FIS")&&!tipo.includes("FISSO")&&<path d="M 5 5 L 50 40" fill="none" stroke={col} strokeWidth="1.5" opacity="0.5"/>}
        </svg>
      ):(
        <svg viewBox="0 0 100 80" width="48" height="38">
          <rect x="5" y="5" width="90" height="70" fill="none" stroke={col} strokeWidth="3" rx="2"/>
          {(tipo.includes("F2")||tipo.includes("2A"))&&<line x1="50" y1="5" x2="50" y2="75" stroke={col} strokeWidth="2"/>}
          {tipo.includes("SC")&&<><line x1="50" y1="5" x2="50" y2="75" stroke={col} strokeWidth="1.5" strokeDasharray="4"/><rect x="5" y="5" width="43" height="70" fill={col} fillOpacity="0.08"/></>}
          {tipo.includes("VAS")&&<path d="M 50 5 L 5 40" fill="none" stroke={col} strokeWidth="1.5"/>}
          {tipo.includes("PF")&&<><line x1="50" y1="5" x2="50" y2="75" stroke={col} strokeWidth="2"/><path d="M 5 75 L 5 5" stroke={col} strokeWidth="3"/></>}
          {!tipo.includes("FIS")&&!tipo.includes("SC")&&!tipo.includes("VAS")&&<path d="M 5 5 L 45 40" fill="none" stroke={col} strokeWidth="1.5" opacity="0.6"/>}
        </svg>
      )}
    </div>
  );
}

// ── Kanban drag & drop ───────────────────────────────────────
function KanbanBoard({pipeline,cantieri,onSelect,onMoveFase,giorniFermaCM,sogliaDays,compact=false,kbValue="totale",fattureDB=[]}:any){
  const [dragging,setDragging]=useState<{id:string,fase:string}|null>(null);
  const [overCol,setOverCol]=useState<string|null>(null);
  const [overCard,setOverCard]=useState<string|null>(null);
  const [overPos,setOverPos]=useState<"before"|"after">("after");
  // Ordine locale per colonna — permette reorder intra-colonna
  const [colOrder,setColOrder]=useState<Record<string,string[]>>({});
  const fmtE=(n:number)=>n>0?"€"+Math.round(n).toLocaleString("it-IT"):"—";
  const daysTo=(d:string)=>Math.floor((new Date(d).getTime()-Date.now())/86400000);
  const K={TEAL:"#1A9E73",DARK:"#1A1A1C",RED:"#DC4444",BLU:"#3B7FE0",AMB:"#D08008"};

  const handleDrop=(colFase:string)=>{
    if(!dragging)return;
    if(dragging.fase!==colFase){
      // Cambio colonna
      onMoveFase(dragging.id,colFase);
      // Inserisci nell'ordine della colonna target
      if(overCard){
        setColOrder(prev=>{
          const prevOrder=prev[colFase]||cantieri.filter((c:any)=>c.fase===colFase).map((c:any)=>c.id);
          const idx=prevOrder.indexOf(overCard);
          const newOrder=[...prevOrder.filter((id:string)=>id!==dragging.id)];
          const insertAt=overPos==="before"?Math.max(0,idx):idx+1;
          newOrder.splice(insertAt,0,dragging.id);
          return {...prev,[colFase]:newOrder};
        });
      }
    } else {
      // Stesso colonna — reorder
      if(overCard&&overCard!==dragging.id){
        setColOrder(prev=>{
          const items=prev[colFase]||cantieri.filter((c:any)=>c.fase===colFase).map((c:any)=>c.id);
          const newOrder=[...items.filter((id:string)=>id!==dragging.id)];
          const idx=newOrder.indexOf(overCard);
          const insertAt=overPos==="before"?Math.max(0,idx):idx+1;
          newOrder.splice(insertAt,0,dragging.id);
          return {...prev,[colFase]:newOrder};
        });
      }
    }
    setDragging(null);setOverCol(null);setOverCard(null);setOverPos("after");
  };

  return (
    <div style={{display:"flex",gap:compact?8:14,minWidth:"max-content",minHeight:"100%",alignItems:"flex-start",padding:compact?"12px 16px":"16px 20px"}}>
      {pipeline.filter((p:any)=>p.attiva).map((p:any)=>{
        const col=p.color||K.TEAL;
        const rawItems=cantieri.filter((c:any)=>c.fase===p.id);
        const order=colOrder[p.id];
        const items=order
          ?[...order.filter((id:string)=>rawItems.some((c:any)=>c.id===id)).map((id:string)=>rawItems.find((c:any)=>c.id===id)),...rawItems.filter((c:any)=>!order.includes(c.id))].filter(Boolean)
          :rawItems;
        const isOver=overCol===p.id;
        const colW=compact?172:222;
        return (
          <div key={p.id}
            onDragOver={e=>{e.preventDefault();setOverCol(p.id);}}
            onDragLeave={e=>{if(!(e.currentTarget as any).contains(e.relatedTarget as Node)){setOverCol(null);}}}
            onDrop={()=>handleDrop(p.id)}
            style={{width:colW,minWidth:colW,display:"flex",flexDirection:"column",gap:compact?5:8,transition:"background .2s",background:isOver&&dragging&&dragging.fase!==p.id?col+"10":"transparent",borderRadius:14,padding:isOver&&dragging&&dragging.fase!==p.id?"10px 8px":"0",border:isOver&&dragging&&dragging.fase!==p.id?`2px dashed ${col}`:"2px solid transparent"}}>
            {/* Header */}
            <div style={{padding:"10px 14px",borderRadius:10,background:col+"18",border:`1.5px solid ${col}35`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:col,boxShadow:`0 0 0 3px ${col}25`}}/>
                <span style={{fontSize:13,fontWeight:700,color:col}}>{p.nome||p.id}</span>
              </div>
              <span style={{fontSize:12,fontWeight:800,color:"#fff",background:col,padding:"2px 9px",borderRadius:10}}>{items.length}</span>
            </div>
            {/* Cards */}
            {items.map((c:any)=>{
              const ferma=giorniFermaCM(c)>=sogliaDays&&c.fase!=="chiusura";
              const gg=giorniFermaCM(c);
              const initials=((c.cliente||"?")[0]+(c.cognome||"")[0]).toUpperCase();
              const isDragging=dragging?.id===c.id;
              const isDropTarget=overCard===c.id&&dragging&&dragging.id!==c.id&&overCol===p.id;
              return (
                <div key={c.id}
                  draggable
                  onDragStart={e=>{
                    setDragging({id:c.id,fase:p.id});
                    e.dataTransfer.effectAllowed="move";
                    // ghost trasparente
                    const ghost=document.createElement("div");
                    ghost.style.cssText="position:fixed;top:-999px;width:180px;padding:8px 12px;background:#fff;border-radius:10px;font-family:Inter,sans-serif;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.2);";
                    ghost.textContent=`${c.cliente} ${c.cognome||""}`;
                    document.body.appendChild(ghost);
                    e.dataTransfer.setDragImage(ghost,90,20);
                    setTimeout(()=>ghost.remove(),0);
                  }}
                  onDragEnd={()=>{setDragging(null);setOverCol(null);setOverCard(null);}}
                  onDragOver={e=>{e.preventDefault();e.stopPropagation();setOverCard(c.id);}}
                  onClick={()=>!isDragging&&onSelect(c)}
                  style={{
                    borderRadius:12,
                    background:isDragging?"#F2F1EC":"#fff",
                    border:`1.5px solid ${isDropTarget?col:ferma?K.RED+"50":"#E5E3DC"}`,
                    borderTop:isDropTarget&&overPos==="before"?`3px solid ${col}`:undefined,
                    borderBottom:isDropTarget&&overPos==="after"?`3px solid ${col}`:undefined,
                    cursor:"grab",
                    transition:"transform .1s, box-shadow .1s, opacity .15s",
                    opacity:isDragging?0.25:1,
                    transform:isDropTarget?"scale(1.01)":"scale(1)",
                    boxShadow:isDragging?"none":isDropTarget?`0 4px 16px ${col}25`:ferma?`0 0 0 1.5px ${K.RED}25`:"0 1px 4px rgba(0,0,0,.05)",
                    overflow:"hidden",
                  }}>
                  {/* Striscia colore fase */}
                  <div style={{height:4,background:`linear-gradient(90deg, ${col}, ${col}88)`,width:"100%"}}/>
                  <div style={{padding:compact?"8px 10px":"12px 14px"}}>
                    {/* Header card */}
                    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:compact?6:9}}>
                      <div style={{width:34,height:34,borderRadius:9,background:ferma?K.RED+"15":col+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:ferma?K.RED:col,flexShrink:0,border:`1.5px solid ${ferma?K.RED+"30":col+"30"}`}}>{initials}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:K.DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.cliente} {c.cognome||""}</div>
                        <div style={{fontSize:10,color:"#86868b",marginTop:1}}>{c.code}</div>
                      </div>
                    </div>
                    {/* Importo */}
                    {(()=>{
                    let val="—",valCol=K.DARK;
                    if(kbValue==="totale"&&c.euro){val=fmtE(parseFloat(c.euro));}
                    else if(kbValue==="saldo"){
                      const fatturato=fattureDB.filter((f:any)=>f.cmId===c.id).reduce((s:number,f:any)=>s+(f.importo||0),0);
                      const totIva=Math.round((parseFloat(c.euro)||0)*1.1);
                      const saldo=totIva-fatturato;
                      val=fmtE(saldo);valCol=saldo>0?K.RED:K.TEAL;
                    }
                    else if(kbValue==="consegna_gg"&&c.dataConsegna){
                      const gg=Math.floor((new Date(c.dataConsegna).getTime()-Date.now())/86400000);
                      val=gg<=0?"Scaduta":`${gg} gg`;valCol=gg<=7?K.RED:K.AMB;
                    }
                    return val!=="—"?<div style={{fontSize:16,fontWeight:800,color:valCol,fontFamily:FM,marginBottom:compact?4:8}}>{val}</div>:null;
                  })()}
                    {/* Badge */}
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:compact?4:6}}>
                      {(c.rilievi||[]).length>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:K.BLU+"12",color:K.BLU,fontWeight:600}}>{(c.rilievi||[]).length} rilievi</span>}
                      {(c.vani||[]).length>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:K.TEAL+"12",color:K.TEAL,fontWeight:600}}>{(c.vani||[]).length} vani</span>}
                      {c.sistema&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:"#F2F1EC",color:"#86868b",fontWeight:500,maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.sistema}</span>}
                    </div>
                    {c.indirizzo&&!compact&&<div style={{fontSize:10,color:"#86868b",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.indirizzo}</div>}
                    {/* Footer */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:6,borderTop:`1px solid #F2F1EC`}}>
                      {ferma
                        ?<span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:K.RED+"12",color:K.RED,fontWeight:700}}>Ferma {gg}gg</span>
                        :<span style={{fontSize:10,fontWeight:600,color:col,display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:col}}/>{p.nome}</span>
                      }
                      {c.dataConsegna&&<span style={{fontSize:10,fontWeight:700,color:daysTo(c.dataConsegna)<=7?K.RED:K.AMB}}>{daysTo(c.dataConsegna)<=0?"Scaduta":`${daysTo(c.dataConsegna)}gg`}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Empty drop zone */}
            {items.length===0&&(
              <div style={{padding:"28px 12px",borderRadius:12,border:`1.5px dashed ${isOver&&dragging?col:"#E5E3DC"}`,textAlign:"center",fontSize:12,color:isOver&&dragging?col:"#C0C0C5",background:isOver&&dragging?col+"05":"transparent",transition:"all .2s",fontWeight:isOver&&dragging?700:400}}>
                {isOver&&dragging?"Rilascia qui":"Nessuna commessa"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DesktopCommesse(){
  const {T,PIPELINE=[],cantieri=[],setCantieri,filtered=[],selectedCM,setSelectedCM,
    filterFase,setFilterFase,searchQ,setSearchQ,setShowModal,
    getVaniAttivi,giorniFermaCM,sogliaDays=7,calcolaVanoPrezzo,
    fattureDB=[],ordiniFornDB=[],montaggiDB=[],msgs=[],tasks=[]}=useMastro();

  const [detTab,setDetTab]=useState<string>("rilievi");
  const [showCfg,setShowCfg]=useState(false);
  const [viewMode,setViewMode]=useState<"lista"|"kanban">("lista");
  const [listaW,setListaW]=useState(268);
  const [filters,setFilters]=useState({ferme:false});
  const [kanbanCompact,setKanbanCompact]=useState(false);
  const [previewRilievo,setPreviewRilievo]=useState<any>(null);
  const [kbFilters,setKbFilters]=useState({ferme:false,scadenza:false,montaggi:false});
  const [kbSort,setKbSort]=useState("importo_desc");
  const [kbValue,setKbValue]=useState("totale");
  const dragging=useRef(false);
  const startX=useRef(0);
  const startW=useRef(268);

  const TODAY=new Date().toISOString().split("T")[0];
  const isFerma=(c:any)=>giorniFermaCM(c)>=sogliaDays&&c.fase!=="chiusura";
  const isScad=(c:any)=>c.scadenza&&c.scadenza<TODAY;
  const getFase=(c:any)=>PIPELINE.find((p:any)=>p.id===c.fase)||{nome:c.fase,color:TEAL};
  const getProgress=(c:any)=>{const i=PIPELINE.findIndex((p:any)=>p.id===c.fase);return i>=0?Math.round((i+1)/PIPELINE.length*100):0;};
  const initials=(c:any)=>((c.cliente||"?")[0]+(c.cognome||"")[0]).toUpperCase();

  const pipeStats=PIPELINE.filter((p:any)=>p.attiva).map((p:any)=>({
    ...p,count:cantieri.filter(c=>c.fase===p.id).length,
    euro:cantieri.filter(c=>c.fase===p.id).reduce((s:number,c:any)=>s+(parseFloat(c.euro)||0),0)
  })).filter(p=>p.count>0);
  const totAttive=cantieri.filter(c=>c.fase!=="chiusura").length;
  const totValore=cantieri.filter(c=>c.fase!=="chiusura").reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const fermeCount=cantieri.filter(c=>isFerma(c)).length;

  const cm=selectedCM;
  const vaniCm=cm?(getVaniAttivi?getVaniAttivi(cm):(cm.vani||[]).filter((v:any)=>!v.eliminato)):[];
  const rilievi=cm?.rilievi||[];
  const ordiniCm=cm?ordiniFornDB.filter((o:any)=>o.cmId===cm.id):[];
  const fattureCm=cm?fattureDB.filter((f:any)=>f.cmId===cm.id):[];
  const montaggiCm=cm?montaggiDB.filter((m:any)=>m.cmId===cm.id||m.commessaId===cm.id):[];
  const msgsCm=cm?msgs.filter((m:any)=>m.cm===cm.code):[];
  const tasksCm=cm?(tasks||[]).filter((t:any)=>t.commessaId===cm.id):[];
  const totCm=cm?vaniCm.reduce((s:number,v:any)=>s+(calcolaVanoPrezzo?calcolaVanoPrezzo(v,cm):0),0):0;
  const ivaPerc=cm?.iva||cm?.ivaPerc||10;
  const totCmIva=Math.round(totCm*(1+ivaPerc/100));
  const fatturatoCm=fattureCm.reduce((s:number,f:any)=>s+(f.importo||0),0);
  const saldoCm=totCmIva-fatturatoCm;

  const filteredAdv=filtered.filter((c:any)=>{
    if(filters.ferme&&!isFerma(c))return false;
    return true;
  });

  // Resize lista
  const onMouseDown=useCallback((e:React.MouseEvent)=>{
    dragging.current=true;startX.current=e.clientX;startW.current=listaW;
    const onMove=(ev:MouseEvent)=>{if(!dragging.current)return;const nw=Math.max(180,Math.min(480,startW.current+(ev.clientX-startX.current)));setListaW(nw);};
    const onUp=()=>{dragging.current=false;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
    e.preventDefault();
  },[listaW]);

  const TABS=[
    {id:"rilievi",   label:`Rilievi ${rilievi.length>0?rilievi.length:""}`,     color:BLU},
    {id:"vani",      label:`Vani ${vaniCm.length}`,                              color:TEAL},
    {id:"preventivo",label:"Preventivo",                                          color:AMB},
    {id:"ordini",    label:`Ordini ${ordiniCm.length}`,                          color:ORG},
    {id:"montaggi",  label:`Montaggi ${montaggiCm.length}`,                      color:PUR},
    {id:"fatture",   label:`Fatture ${fattureCm.length}`,                        color:RED},
    {id:"messaggi",  label:`Msg ${msgsCm.length}`,                               color:BLU},
    {id:"task",      label:`Task ${tasksCm.length}`,                             color:AMB},
    {id:"timeline",  label:"Timeline",                                            color:DARK},
  ];

  if(showCfg&&cm)return <ConfiguratoreCommessa commessa={cm} onClose={()=>setShowCfg(false)}/>;

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column",background:"#F2F1EC"}}>

      {/* PIPELINE BAR */}
      <div style={{background:"#fff",borderBottom:`1px solid #E5E3DC`,padding:"10px 18px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:"#86868b"}}>PIPELINE</span>
            <span style={{fontSize:12,color:"#86868b"}}>{totAttive} attive · {fmtE(totValore)}</span>
            {fermeCount>0&&<span style={{fontSize:11,fontWeight:700,color:RED,background:RED+"12",padding:"2px 8px",borderRadius:6}}>{fermeCount} ferme</span>}
          </div>
          <div style={{display:"flex",gap:6}}>
            {[{id:"lista",l:"Lista"},{id:"kanban",l:"Kanban"}].map(v=>(
              <div key={v.id} onClick={()=>setViewMode(v.id as any)} style={{padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",background:viewMode===v.id?DARK:"transparent",color:viewMode===v.id?"#fff":"#86868b",border:`1px solid ${viewMode===v.id?DARK:"#E5E3DC"}`}}>{v.l}</div>
            ))}
            <div onClick={()=>setShowModal("commessa")} style={{padding:"5px 14px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",background:TEAL,color:"#fff"}}>+ Commessa</div>
          </div>
        </div>
        <div style={{display:"flex",gap:3,height:28,borderRadius:8,overflow:"hidden"}}>
          {[{id:"tutte",nome:"Tutte",color:DARK,count:totAttive},...pipeStats].map((p:any)=>{
            const sel=filterFase===p.id;
            return (
              <div key={p.id} onClick={()=>setFilterFase(sel&&p.id!=="tutte"?"tutte":p.id)}
                style={{flex:p.id==="tutte"?0:Math.max(1,p.count),minWidth:p.id==="tutte"?70:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",opacity:sel?1:0.6,transition:"opacity .15s",padding:"0 8px",background:p.color||TEAL,overflow:"hidden",whiteSpace:"nowrap",gap:4}}>
                <span>{p.nome||p.id}</span>
                {p.id!=="tutte"&&<span style={{opacity:.8}}>{p.count}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode==="kanban"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Toolbar kanban con filtri */}
          <div style={{padding:"10px 18px",background:"#fff",borderBottom:`1px solid #E5E3DC`,display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap"}}>
            {/* Pill ferme */}
            {[
              {id:"ferme",    label:"Ferme",           col:RED},
              {id:"scadenza", label:"Scadenza 7gg",    col:AMB},
              {id:"montaggi", label:"Con montaggio",   col:TEAL},
            ].map(f=>{
              const on=(kbFilters as any)[f.id];
              return <div key={f.id} onClick={()=>setKbFilters(p=>({...p,[f.id]:!p[f.id as keyof typeof p]}))}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${on?f.col+"60":"#E5E3DC"}`,background:on?f.col+"12":"transparent",color:on?f.col:"#86868b",transition:"all .15s"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:on?f.col:"#C0C0C5"}}/>
                {f.label}
              </div>;
            })}
            <div style={{width:1,height:20,background:"#E5E3DC",flexShrink:0}}/>
            {/* Sort */}
            <select value={kbSort} onChange={e=>setKbSort(e.target.value)}
              style={{fontSize:12,padding:"5px 10px",borderRadius:20,border:`1px solid #E5E3DC`,background:"transparent",color:DARK,cursor:"pointer",fontFamily:FF,outline:"none"}}>
              <option value="importo_desc">Importo ↓</option>
              <option value="importo_asc">Importo ↑</option>
              <option value="consegna">Consegna vicina</option>
              <option value="ferma">Più ferma</option>
              <option value="modifica">Ultima modifica</option>
            </select>
            {/* Valore card */}
            <select value={kbValue} onChange={e=>setKbValue(e.target.value)}
              style={{fontSize:12,padding:"5px 10px",borderRadius:20,border:`1px solid #E5E3DC`,background:"transparent",color:DARK,cursor:"pointer",fontFamily:FF,outline:"none"}}>
              <option value="totale">€ Totale</option>
              <option value="saldo">€ Saldo</option>
              <option value="consegna_gg">Gg consegna</option>
            </select>
            <div style={{width:1,height:20,background:"#E5E3DC",flexShrink:0}}/>
            {/* Vista */}
            {[{id:"normale",l:"Normale"},{id:"compatta",l:"Compatta"}].map(v=>(
              <div key={v.id} onClick={()=>setKanbanCompact(v.id==="compatta")}
                style={{padding:"5px 11px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:(v.id==="compatta")===kanbanCompact?DARK:"transparent",color:(v.id==="compatta")===kanbanCompact?"#fff":"#86868b",border:`1px solid ${(v.id==="compatta")===kanbanCompact?DARK:"#E5E3DC"}`}}>{v.l}</div>
            ))}
            <div style={{marginLeft:"auto",display:"flex",gap:12,alignItems:"center"}}>
              {kbFilters.ferme&&<span style={{fontSize:12,color:RED,fontWeight:600}}>{filteredAdv.filter((c:any)=>isFerma(c)).length} ferme</span>}
              <span style={{fontSize:12,color:"#86868b"}}>{filteredAdv.length} commesse</span>
            </div>
          </div>
          <div style={{flex:1,overflow:"auto"}}>
            <KanbanBoard
              pipeline={PIPELINE}
              cantieri={(()=>{
                let arr=[...filteredAdv];
                // Filtri
                if(kbFilters.ferme) arr=arr.filter((c:any)=>isFerma(c));
                if(kbFilters.scadenza) arr=arr.filter((c:any)=>c.dataConsegna&&daysTo(c.dataConsegna)<=7&&daysTo(c.dataConsegna)>=0);
                if(kbFilters.montaggi) arr=arr.filter((c:any)=>montaggiDB.some((m:any)=>(m.cmId===c.id||m.commessaId===c.id)&&m.data>=TODAY));
                // Sort
                arr.sort((a:any,b:any)=>{
                  if(kbSort==="importo_desc") return (parseFloat(b.euro)||0)-(parseFloat(a.euro)||0);
                  if(kbSort==="importo_asc") return (parseFloat(a.euro)||0)-(parseFloat(b.euro)||0);
                  if(kbSort==="consegna") return (a.dataConsegna||"9999").localeCompare(b.dataConsegna||"9999");
                  if(kbSort==="ferma") return giorniFermaCM(b)-giorniFermaCM(a);
                  if(kbSort==="modifica") return (b.ultima_modifica||b.updatedAt||"").localeCompare(a.ultima_modifica||a.updatedAt||"");
                  return 0;
                });
                return arr;
              })()}
              giorniFermaCM={giorniFermaCM}
              sogliaDays={sogliaDays}
              compact={kanbanCompact}
              kbValue={kbValue}
              fattureDB={fattureDB}
              onSelect={(c:any)=>{setSelectedCM(c);setViewMode("lista");setDetTab("rilievi");}}
              onMoveFase={(cmId:string,newFase:string)=>{
                setCantieri?.((prev:any[])=>prev.map((c:any)=>c.id===cmId?{...c,fase:newFase}:c));
              }}
            />
          </div>
        </div>
      )}

      {/* LISTA VIEW */}
      {viewMode==="lista"&&(
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>

          {/* COL 1 — LISTA (resizable) */}
          <div style={{width:listaW,flexShrink:0,background:"#fff",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
            <div style={{padding:"10px 12px",borderBottom:`1px solid #E5E3DC`,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#F2F1EC",borderRadius:8,border:`1px solid #E5E3DC`,marginBottom:8}}>
                <Svg path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" c="#86868b" s={13}/>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cerca commessa..." style={{border:"none",background:"transparent",fontSize:12,color:DARK,outline:"none",width:"100%",fontFamily:FF}}/>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <div onClick={()=>setFilters(f=>({...f,ferme:!f.ferme}))} style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",background:filters.ferme?RED:"#F2F1EC",color:filters.ferme?"#fff":"#86868b",border:`1px solid ${filters.ferme?RED:"#E5E3DC"}`}}>Ferme</div>
                <div onClick={()=>{setFilters({ferme:false});setFilterFase("tutte");}} style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",background:"#F2F1EC",color:"#86868b",border:`1px solid #E5E3DC`}}>Tutte</div>
                <span style={{fontSize:11,color:"#86868b",marginLeft:"auto"}}>{filteredAdv.length}</span>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {filteredAdv.map((c:any)=>{
                const fase=getFase(c);const ferma=isFerma(c);const col=ferma?RED:fase.color||TEAL;
                return (
                  <div key={c.id} onClick={()=>{setSelectedCM(c);setDetTab("rilievi");}}
                    style={{padding:"9px 12px",borderBottom:`1px solid #F2F1EC`,cursor:"pointer",display:"flex",gap:9,alignItems:"flex-start",background:selectedCM?.id===c.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`3px solid ${selectedCM?.id===c.id?TEAL:"transparent"}`,transition:"background .1s"}}
                    onMouseEnter={e=>selectedCM?.id!==c.id&&((e.currentTarget as any).style.background="#F8F7F2")}
                    onMouseLeave={e=>selectedCM?.id!==c.id&&((e.currentTarget as any).style.background="transparent")}>
                    <div style={{width:30,height:30,borderRadius:8,background:col+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:col,flexShrink:0}}>{initials(c)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                        <span style={{fontSize:12,fontWeight:700,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.cliente}{c.cognome?" "+c.cognome:""}</span>
                        {ferma&&<div style={{width:5,height:5,borderRadius:"50%",background:RED,flexShrink:0}}/>}
                      </div>
                      <div style={{fontSize:10,color:"#86868b"}}>{c.code} · {ferma?`Ferma ${giorniFermaCM(c)}gg`:fase.nome}</div>
                      <div style={{height:2,background:"#F2F1EC",borderRadius:1,marginTop:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:getProgress(c)+"%",background:col,borderRadius:1}}/>
                      </div>
                    </div>
                    {c.euro&&<div style={{fontSize:11,fontWeight:700,color:DARK,fontFamily:FM,flexShrink:0}}>{fmtE(parseFloat(c.euro))}</div>}
                  </div>
                );
              })}
            </div>
            {/* Resize handle */}
            <div onMouseDown={onMouseDown} style={{position:"absolute",right:0,top:0,bottom:0,width:4,cursor:"col-resize",background:"transparent",zIndex:10}}
              onMouseEnter={e=>((e.currentTarget as any).style.background=TEAL+"40")}
              onMouseLeave={e=>((e.currentTarget as any).style.background="transparent")}/>
          </div>

          {/* COL 2 — DETTAGLIO */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#fff",borderRight:`1px solid #E5E3DC`,borderLeft:`1px solid #E5E3DC`}}>
            {!cm?(
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,color:"#86868b"}}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C0C0C5" strokeWidth="1"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style={{fontSize:14,color:"#86868b"}}>Seleziona una commessa</span>
              </div>
            ):(<>
              {/* Header commessa */}
              <div style={{padding:"14px 18px 0",borderBottom:`1px solid #E5E3DC`,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:isFerma(cm)?RED+"15":TEAL+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:isFerma(cm)?RED:TEAL,flexShrink:0}}>{initials(cm)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:17,fontWeight:800,color:DARK,marginBottom:3}}>{cm.cliente}{cm.cognome?" "+cm.cognome:""}</div>
                    <div style={{fontSize:12,color:"#86868b"}}>{cm.code} · {cm.indirizzo||"—"}{isFerma(cm)?<span style={{color:RED,fontWeight:700}}> · Ferma {giorniFermaCM(cm)}gg</span>:""}</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    {/* Bottone Rilievo */}
                    <div onClick={()=>{setDetTab("rilievi");}} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,background:BLU,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      <Svg path="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" c="#fff" s={13}/>
                      Rilievi
                    </div>
                    {/* Bottone Vani */}
                    <div onClick={()=>{setDetTab("vani");}} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,background:TEAL,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      <Svg path="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" c="#fff" s={13}/>
                      Vani
                    </div>
                    {/* Bottone Preventivo */}
                    <div onClick={()=>setShowCfg(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,background:AMB,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      <Svg path="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M9 7h6l2 2v3M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" c="#fff" s={13}/>
                      Preventivo
                    </div>
                    <div style={{padding:"7px 12px",borderRadius:8,background:"transparent",color:"#86868b",border:`1px solid #E5E3DC`,fontSize:12,cursor:"pointer",fontFamily:FF}}>PDF</div>
                  </div>
                </div>
                {/* KPI */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                  {[{l:"Totale",v:fmtE(totCm),c:DARK},{l:`+IVA ${ivaPerc}%`,v:fmtE(totCmIva),c:DARK},{l:"Fatturato",v:fmtE(fatturatoCm),c:TEAL},{l:"Saldo",v:fmtE(saldoCm),c:saldoCm>0?RED:TEAL}].map((k,i)=>(
                    <div key={i} style={{background:"#F8F7F2",borderRadius:8,padding:"8px 12px",border:`1px solid #E5E3DC`}}>
                      <div style={{fontSize:10,color:"#86868b",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{k.l}</div>
                      <div style={{fontSize:15,fontWeight:800,color:k.c,fontFamily:FM,marginTop:3}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                {/* Tabs */}
                <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none"}}>
                  {TABS.map(t=>(
                    <div key={t.id} onClick={()=>setDetTab(t.id)} style={{padding:"8px 14px",fontSize:12,fontWeight:detTab===t.id?700:500,color:detTab===t.id?t.color:"#86868b",borderBottom:`2px solid ${detTab===t.id?t.color:"transparent"}`,cursor:"pointer",whiteSpace:"nowrap",transition:"color .15s"}}>
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>

                {/* RILIEVI */}
                {detTab==="rilievi"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {rilievi.length===0&&(
                      <div style={{textAlign:"center",padding:"48px 20px"}}>
                        <div style={{width:64,height:64,borderRadius:16,background:BLU+"12",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                          <Svg path="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" c={BLU} s={28}/>
                        </div>
                        <div style={{fontSize:16,fontWeight:800,color:DARK,marginBottom:8}}>Nessun rilievo</div>
                        <div style={{fontSize:13,color:"#86868b",marginBottom:24}}>Registra il primo rilievo per iniziare a raccogliere le misure</div>
                        <div onClick={()=>setShowCfg(true)} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:10,background:TEAL,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                          <Svg path="M12 4v16m8-8H4" c="#fff" s={14}/>
                          Nuovo rilievo
                        </div>
                      </div>
                    )}
                    {rilievi.slice().reverse().map((r:any,i:number)=>{
                      const tipoInfo=TIPO_RILIEVO.find(t=>t.id===r.tipo)||TIPO_RILIEVO[0];
                      const vaniR=r.vani||[];
                      const misurati=vaniR.filter((v:any)=>Object.values(v.misure||{}).filter((x:any)=>(x as number)>0).length>=2).length;
                      const pct=Math.round(misurati/Math.max(vaniR.length,1)*100);
                      return (
                        <div key={r.id||i} style={{background:"#fff",borderRadius:12,border:`1px solid ${tipoInfo.color}30`,overflow:"hidden"}}>
                          <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,borderBottom:`1px solid #F2F1EC`}}>
                            <div style={{width:40,height:40,borderRadius:10,background:tipoInfo.color+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <Svg path={tipoInfo.icon} c={tipoInfo.color} s={18}/>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                <span style={{fontSize:14,fontWeight:800,color:DARK}}>Rilievo #{rilievi.length-i}</span>
                                <span style={{fontSize:11,padding:"2px 9px",borderRadius:20,background:tipoInfo.color+"15",color:tipoInfo.color,fontWeight:700}}>{tipoInfo.label}</span>
                              </div>
                              <div style={{fontSize:12,color:"#86868b"}}>{r.data||"—"} · {r.rilevatore||"—"} · {vaniR.length} vani · {misurati}/{vaniR.length} misurati</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:26,fontWeight:800,color:tipoInfo.color,fontFamily:FM,lineHeight:1}}>{pct}%</div>
                              <div style={{fontSize:10,color:"#86868b",marginTop:2}}>completato</div>
                            </div>
                          </div>
                          <div style={{height:4,background:"#F2F1EC"}}>
                            <div style={{height:"100%",width:`${pct}%`,background:tipoInfo.color,transition:"width .4s"}}/>
                          </div>
                          {/* Bottone anteprima */}
                          <div style={{padding:"10px 18px 0",display:"flex",justifyContent:"flex-end"}}>
                            <div onClick={(e)=>{e.stopPropagation();setPreviewRilievo(r);}} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:8,background:"#F8F7F2",border:`1px solid #E5E3DC`,cursor:"pointer",fontSize:12,fontWeight:600,color:DARK}}
                              onMouseEnter={e=>{(e.currentTarget as any).style.background=BLU+"12";(e.currentTarget as any).style.color=BLU;}}
                              onMouseLeave={e=>{(e.currentTarget as any).style.background="#F8F7F2";(e.currentTarget as any).style.color=DARK;}}>
                              <Svg path="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" c="currentColor" s={13}/>
                              Anteprima
                            </div>
                          </div>
                          {vaniR.length>0&&(
                            <div style={{padding:"12px 18px",display:"flex",flexDirection:"column",gap:8}}>
                              {vaniR.map((v:any,vi:number)=>{
                                const m=v.misure||{};
                                const misurato=Object.values(m).filter((x:any)=>(x as number)>0).length>=2;
                                return (
                                  <div key={v.id||vi} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,background:misurato?TEAL+"05":"#F8F7F2",border:`1px solid ${misurato?TEAL+"25":"#E5E3DC"}`}}>
                                    <VanoPreview v={v}/>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontSize:13,fontWeight:700,color:DARK}}>{v.nome||`Vano ${vi+1}`}</div>
                                      <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{v.tipo||"—"}{m.lCentro&&m.hCentro?` · ${m.lCentro}×${m.hCentro}mm`:""}{v.sistema?` · ${v.sistema}`:""}</div>
                                    </div>
                                    <div style={{flexShrink:0}}>
                                      {misurato
                                        ?<div style={{width:24,height:24,borderRadius:6,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center"}}><Svg path="M20 6L9 17l-5-5" c="#fff" s={12}/></div>
                                        :<span style={{fontSize:11,padding:"3px 8px",borderRadius:8,background:AMB+"15",color:AMB,fontWeight:700}}>Da misurare</span>
                                      }
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {r.note&&<div style={{padding:"8px 18px 14px",fontSize:12,color:"#86868b",fontStyle:"italic",borderTop:`1px solid #F2F1EC`}}>Note: {r.note}</div>}
                        </div>
                      );
                    })}
                    {rilievi.length>0&&(
                      <div onClick={()=>setShowCfg(true)} style={{padding:"14px",borderRadius:12,border:"1.5px dashed #E5E3DC",textAlign:"center",cursor:"pointer",fontSize:13,fontWeight:600,color:"#86868b",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
                        onMouseEnter={e=>{(e.currentTarget as any).style.borderColor=TEAL;(e.currentTarget as any).style.color=TEAL;}}
                        onMouseLeave={e=>{(e.currentTarget as any).style.borderColor="#E5E3DC";(e.currentTarget as any).style.color="#86868b";}}>
                        <Svg path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" c="currentColor" s={14}/>
                        Modifica rilievo
                      </div>
                    )}
                  </div>
                )}

                {/* VANI */}
                {detTab==="vani"&&(
                  <div>
                    {vaniCm.length===0?(
                      <div style={{textAlign:"center",padding:"48px 20px"}}>
                        <div style={{width:64,height:64,borderRadius:16,background:TEAL+"12",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Svg path="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" c={TEAL} s={28}/></div>
                        <div style={{fontSize:15,fontWeight:800,color:DARK,marginBottom:8}}>Nessun vano configurato</div>
                        <div onClick={()=>setShowCfg(true)} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:10,background:TEAL,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}><Svg path="M12 4v16m8-8H4" c="#fff" s={14}/>Apri Configuratore</div>
                      </div>
                    ):(
                      <>
                        {vaniCm.map((v:any,i:number)=>{
                          const p=calcolaVanoPrezzo?calcolaVanoPrezzo(v,cm):0;
                          const m=v.misure||{};
                          return (
                            <div key={v.id||i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid #E5E3DC`,marginBottom:10,background:"#fff",cursor:"pointer",display:"flex",gap:14,alignItems:"center",transition:"border-color .15s"}}
                              onMouseEnter={e=>((e.currentTarget as any).style.borderColor=TEAL)}
                              onMouseLeave={e=>((e.currentTarget as any).style.borderColor="#E5E3DC")}>
                              <VanoPreview v={v}/>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:14,fontWeight:700,color:DARK}}>{v.nome||`Vano ${i+1}`}</div>
                                <div style={{fontSize:12,color:"#86868b",marginTop:2}}>{v.tipo||"—"} · {m.lCentro||"?"}×{m.hCentro||"?"} mm{v.sistema?` · ${v.sistema}`:""}</div>
                                {v.stanza&&<div style={{fontSize:11,color:"#86868b",marginTop:1}}>{v.stanza}{v.piano?` · ${v.piano}`:""}</div>}
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:15,fontWeight:800,color:DARK,fontFamily:FM}}>{p>0?fmtE(p*(v.pezzi||1)):"—"}</div>
                                <div style={{fontSize:11,color:"#86868b"}}>{v.pezzi||1} pz</div>
                              </div>
                            </div>
                          );
                        })}
                        <div style={{padding:"10px 14px",borderRadius:10,background:DARK,display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                          <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{vaniCm.length} vani · {vaniCm.reduce((s:number,v:any)=>s+(v.pezzi||1),0)} pz</span>
                          <span style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:FM}}>{fmtE(totCm)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* PREVENTIVO */}
                {detTab==="preventivo"&&(
                  vaniCm.length===0?(
                    <div style={{textAlign:"center",padding:"48px 20px",color:"#86868b",fontSize:13}}>Nessun vano — usa il Configuratore</div>
                  ):(
                    <>
                      <div style={{background:"#fff",borderRadius:10,border:`1px solid #E5E3DC`,overflow:"hidden",marginBottom:12}}>
                        <div style={{padding:"10px 14px",background:"#F8F7F2",borderBottom:`1px solid #E5E3DC`,fontSize:10,fontWeight:700,color:"#86868b",display:"grid",gridTemplateColumns:"1fr 90px 50px 80px",gap:8,textTransform:"uppercase",letterSpacing:.5}}>
                          <span>Descrizione</span><span style={{textAlign:"center"}}>Misure</span><span style={{textAlign:"center"}}>Q.</span><span style={{textAlign:"right"}}>Prezzo</span>
                        </div>
                        {vaniCm.map((v:any,i:number)=>{
                          const p=calcolaVanoPrezzo?calcolaVanoPrezzo(v,cm):0;
                          const m=v.misure||{};
                          return (
                            <div key={v.id||i} style={{padding:"11px 14px",borderBottom:i<vaniCm.length-1?`1px solid #F2F1EC`:"none",display:"grid",gridTemplateColumns:"1fr 90px 50px 80px",gap:8,alignItems:"center"}}>
                              <div>
                                <div style={{fontSize:13,fontWeight:700,color:DARK}}>{v.nome||`Vano ${i+1}`}</div>
                                <div style={{fontSize:11,color:"#86868b"}}>{v.tipo} · {v.sistema||"—"}</div>
                              </div>
                              <div style={{fontSize:12,color:"#86868b",textAlign:"center",fontFamily:FM}}>{m.lCentro&&m.hCentro?`${m.lCentro}×${m.hCentro}`:"—"}</div>
                              <div style={{fontSize:13,fontWeight:700,color:DARK,textAlign:"center"}}>{v.pezzi||1}</div>
                              <div style={{fontSize:13,fontWeight:700,color:DARK,textAlign:"right",fontFamily:FM}}>{fmtE(p*(v.pezzi||1))}</div>
                            </div>
                          );
                        })}
                        <div style={{padding:"11px 14px",background:DARK,display:"grid",gridTemplateColumns:"1fr 90px 50px 80px",gap:8}}>
                          <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.5)",gridColumn:"1/4"}}>Totale IVA esclusa</div>
                          <div style={{fontSize:15,fontWeight:800,color:"#fff",textAlign:"right",fontFamily:FM}}>{fmtE(totCm)}</div>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {[{l:`IVA ${ivaPerc}%`,v:fmtE(totCmIva-totCm),c:DARK},{l:"Totale con IVA",v:fmtE(totCmIva),c:DARK},{l:"Fatturato",v:fmtE(fatturatoCm),c:TEAL},{l:"Saldo",v:fmtE(saldoCm),c:saldoCm>0?RED:TEAL}].map((k,i)=>(
                          <div key={i} style={{background:"#fff",borderRadius:8,padding:"10px 12px",border:`1px solid #E5E3DC`}}>
                            <div style={{fontSize:10,color:"#86868b",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{k.l}</div>
                            <div style={{fontSize:16,fontWeight:800,color:k.c,fontFamily:FM,marginTop:4}}>{k.v}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                )}

                {/* ORDINI */}
                {detTab==="ordini"&&(
                  ordiniCm.length===0?<div style={{textAlign:"center",padding:"48px 20px",color:"#86868b",fontSize:13}}>Nessun ordine fornitore</div>
                  :ordiniCm.map((o:any,i:number)=>(
                    <div key={o.id||i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid #E5E3DC`,marginBottom:8,background:"#fff",display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{width:36,height:36,borderRadius:10,background:ORG+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Svg path="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" c={ORG} s={16}/></div>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:DARK}}>{typeof o.fornitore==="object"?o.fornitore?.nome:o.fornitore||"Fornitore"}</div><div style={{fontSize:11,color:"#86868b",marginTop:2}}>{o.data||"—"} · {o.conferma?.ricevuta?"Confermato":"In attesa"}</div></div>
                      {o.totaleIva&&<div style={{fontSize:14,fontWeight:700,color:DARK,fontFamily:FM}}>{fmtE(o.totaleIva)}</div>}
                    </div>
                  ))
                )}

                {/* MONTAGGI */}
                {detTab==="montaggi"&&(
                  montaggiCm.length===0?<div style={{textAlign:"center",padding:"48px 20px",color:"#86868b",fontSize:13}}>Nessun montaggio pianificato</div>
                  :montaggiCm.map((m:any,i:number)=>(
                    <div key={m.id||i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid #E5E3DC`,marginBottom:8,background:"#fff",display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{width:36,height:36,borderRadius:10,background:PUR+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Svg path="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" c={PUR} s={16}/></div>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:DARK}}>{m.data||"—"}{m.ora?` · ${m.ora}`:""}</div><div style={{fontSize:11,color:"#86868b",marginTop:2}}>{m.squadra||m.squadraNome||"—"} · <span style={{color:m.stato==="completato"?TEAL:AMB,fontWeight:600}}>{m.stato||"pianificato"}</span></div></div>
                    </div>
                  ))
                )}

                {/* FATTURE */}
                {detTab==="fatture"&&(
                  fattureCm.length===0?<div style={{textAlign:"center",padding:"48px 20px",color:"#86868b",fontSize:13}}>Nessuna fattura</div>
                  :fattureCm.map((f:any,i:number)=>(
                    <div key={f.id||i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${f.pagata?"#E5E3DC":RED+"30"}`,marginBottom:8,background:f.pagata?"#fff":RED+"04",display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:DARK}}>{f.numero||"Fattura"} · {f.tipo||"fattura"}</div><div style={{fontSize:11,color:"#86868b",marginTop:2}}>{f.data||"—"} · <span style={{color:f.pagata?TEAL:RED,fontWeight:600}}>{f.pagata?"Pagata":"Da incassare"}</span></div></div>
                      <div style={{fontSize:15,fontWeight:800,color:f.pagata?TEAL:RED,fontFamily:FM}}>{fmtE(f.importo||0)}</div>
                    </div>
                  ))
                )}

                {/* MESSAGGI */}
                {detTab==="messaggi"&&(
                  msgsCm.length===0?<div style={{textAlign:"center",padding:"48px 20px",color:"#86868b",fontSize:13}}>Nessun messaggio</div>
                  :msgsCm.slice(-15).map((m:any,i:number)=>(
                    <div key={m.id||i} style={{padding:"10px 12px",borderRadius:10,border:`1px solid #E5E3DC`,marginBottom:8,background:"#fff"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:700,color:DARK}}>{m.from||m.mittente||"—"}</span><span style={{fontSize:11,color:"#86868b"}}>{m.ora||m.data||"—"}</span></div>
                      <div style={{fontSize:12,color:"#86868b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.testo||m.text||"—"}</div>
                    </div>
                  ))
                )}

                {/* TASK */}
                {detTab==="task"&&(
                  tasksCm.length===0?<div style={{textAlign:"center",padding:"48px 20px",color:"#86868b",fontSize:13}}>Nessuna task collegata</div>
                  :tasksCm.map((t:any,i:number)=>(
                    <div key={t.id||i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${t.priorita==="alta"?RED+"30":"#E5E3DC"}`,marginBottom:8,background:"#fff"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${t.stato==="completata"?TEAL:AMB}`,background:t.stato==="completata"?TEAL:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {t.stato==="completata"&&<Svg path="M20 6L9 17l-5-5" c="#fff" s={11}/>}
                        </div>
                        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:DARK,textDecoration:t.stato==="completata"?"line-through":"none"}}>{t.titolo}</div><div style={{fontSize:11,color:"#86868b",marginTop:2}}>{t.assegnatoNome||"—"}{t.scadenza?` · Scade ${t.scadenza}`:""}</div></div>
                        <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:t.priorita==="alta"?RED+"15":AMB+"15",color:t.priorita==="alta"?RED:AMB,fontWeight:700}}>{t.priorita}</span>
                      </div>
                    </div>
                  ))
                )}

                {/* TIMELINE */}
                {detTab==="timeline"&&(
                  (!cm.log||cm.log.length===0)?<div style={{textAlign:"center",padding:"48px 20px",color:"#86868b",fontSize:13}}>Nessuna attività registrata</div>
                  :cm.log.slice().reverse().map((l:any,i:number)=>(
                    <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid #F2F1EC`}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:l.color||TEAL,marginTop:6,flexShrink:0}}/>
                      <div><div style={{fontSize:13,color:DARK}}><b style={{fontWeight:700}}>{l.chi}</b> {l.cosa}</div><div style={{fontSize:11,color:"#86868b",marginTop:2}}>{l.quando}</div></div>
                    </div>
                  ))
                )}
              </div>
            </>)}
          </div>

          {/* COL 3 — RIEPILOGO */}
          <div style={{width:300,flexShrink:0,background:"#F8F7F2",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",background:"#fff",borderBottom:`1px solid #E5E3DC`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.8}}>{cm?"Commessa":"Riepilogo aziendale"}</div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>

              {/* SCHEDA COMMESSA RICCA */}
              {cm&&(
                <div style={{marginBottom:14}}>

                  {/* Cliente — nome + contatti */}
                  <div style={{background:"#fff",borderRadius:10,border:`1px solid #E5E3DC`,overflow:"hidden",marginBottom:10}}>
                    <div style={{padding:"12px 14px",borderBottom:`1px solid #F2F1EC`}}>
                      <div style={{fontSize:14,fontWeight:800,color:DARK,marginBottom:2}}>{cm.cliente} {cm.cognome||""}</div>
                      {cm.telefono&&(
                        <a href={`tel:${cm.telefono}`} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:TEAL,fontWeight:600,textDecoration:"none",marginBottom:4}}>
                          <Svg path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" c={TEAL} s={13}/>
                          {cm.telefono}
                        </a>
                      )}
                      {cm.indirizzo&&(
                        <a href={`https://maps.google.com/?q=${encodeURIComponent(cm.indirizzo)}`} target="_blank" rel="noreferrer"
                          style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:BLU,fontWeight:500,textDecoration:"none"}}>
                          <Svg path="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" c={BLU} s={12}/>
                          {cm.indirizzo}
                        </a>
                      )}
                    </div>
                    {/* Bottone entra nel cliente */}
                    <div onClick={()=>setTab("clienti")} style={{padding:"9px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:"#F8F7F2"}}
                      onMouseEnter={e=>((e.currentTarget as any).style.background=TEAL+"10")}
                      onMouseLeave={e=>((e.currentTarget as any).style.background="#F8F7F2")}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <Svg path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" c={TEAL} s={13}/>
                        <span style={{fontSize:12,fontWeight:700,color:TEAL}}>Scheda cliente completa</span>
                      </div>
                      <Svg path="M9 18l6-6-6-6" c={TEAL} s={12}/>
                    </div>
                  </div>

                  {/* Stato commessa — PERCHÉ è ferma */}
                  <div style={{background:"#fff",borderRadius:10,border:`1px solid ${isFerma(cm)?RED+"30":"#E5E3DC"}`,padding:"12px 14px",marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Stato commessa</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:12,color:"#86868b"}}>Fase</span>
                      <span style={{fontSize:12,fontWeight:700,color:getFase(cm).color||TEAL}}>{getFase(cm).nome||cm.fase}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:12,color:"#86868b"}}>Stato</span>
                      <span style={{fontSize:12,fontWeight:700,color:isFerma(cm)?RED:TEAL}}>{isFerma(cm)?`Ferma ${giorniFermaCM(cm)}gg`:"Attiva"}</span>
                    </div>
                    {/* PERCHÉ è ferma — ultimo evento log */}
                    {isFerma(cm)&&cm.log&&cm.log.length>0&&(
                      <div style={{marginTop:6,padding:"8px 10px",borderRadius:8,background:RED+"06",border:`1px solid ${RED}20`}}>
                        <div style={{fontSize:10,fontWeight:700,color:RED,marginBottom:3}}>Ultimo aggiornamento</div>
                        <div style={{fontSize:11,color:DARK}}><b>{cm.log[cm.log.length-1]?.chi}</b> {cm.log[cm.log.length-1]?.cosa}</div>
                        <div style={{fontSize:10,color:"#86868b",marginTop:2}}>{cm.log[cm.log.length-1]?.quando}</div>
                      </div>
                    )}
                    {isFerma(cm)&&(!cm.log||cm.log.length===0)&&(
                      <div style={{marginTop:6,padding:"8px 10px",borderRadius:8,background:RED+"06",border:`1px solid ${RED}20`}}>
                        <div style={{fontSize:11,color:RED,fontWeight:600}}>Nessuna attività da {giorniFermaCM(cm)} giorni</div>
                      </div>
                    )}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,paddingTop:8,borderTop:`1px solid #F2F1EC`}}>
                      <span style={{fontSize:12,color:"#86868b"}}>Consegna</span>
                      <span style={{fontSize:12,fontWeight:700,color:cm.dataConsegna&&daysTo(cm.dataConsegna)<=7?RED:DARK}}>{cm.dataConsegna?new Date(cm.dataConsegna+"T12:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"long"}):"—"}</span>
                    </div>
                  </div>

                  {/* Attività recenti — chi ha fatto cosa */}
                  <div style={{background:"#fff",borderRadius:10,border:`1px solid #E5E3DC`,overflow:"hidden",marginBottom:10}}>
                    <div style={{padding:"10px 14px",borderBottom:`1px solid #F2F1EC`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7}}>Attività recenti</div>
                      <div onClick={()=>setDetTab("timeline")} style={{fontSize:11,color:TEAL,cursor:"pointer",fontWeight:600}}>Tutto →</div>
                    </div>
                    {(!cm.log||cm.log.length===0)
                      ?<div style={{padding:"12px 14px",fontSize:12,color:"#86868b"}}>Nessuna attività</div>
                      :cm.log.slice(-4).reverse().map((l:any,i:number)=>(
                        <div key={i} style={{padding:"9px 14px",borderBottom:i<3?`1px solid #F2F1EC`:"none",display:"flex",gap:10,alignItems:"flex-start"}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:l.color||TEAL,flexShrink:0,marginTop:5}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><b style={{fontWeight:700}}>{l.chi}</b> {l.cosa}</div>
                            <div style={{fontSize:10,color:"#86868b",marginTop:1}}>{l.quando}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  {/* Numeri commessa */}
                  <div style={{background:"#fff",borderRadius:10,border:`1px solid #E5E3DC`,padding:"12px 14px",marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Numeri</div>
                    {[
                      {l:"Vani",v:`${vaniCm.length} · ${vaniCm.reduce((s:number,v:any)=>s+(v.pezzi||1),0)} pz`,c:DARK},
                      {l:"Rilievi",v:rilievi.length,c:DARK},
                      {l:"Ordini",v:ordiniCm.length,c:ordiniCm.length>0?AMB:DARK},
                      {l:"Fatture",v:fattureCm.length,c:fattureCm.length>0?TEAL:DARK},
                      {l:"Messaggi",v:msgsCm.length,c:msgsCm.filter((m:any)=>!m.letto).length>0?BLU:DARK},
                      {l:"Task aperte",v:tasksCm.filter((t:any)=>t.stato!=="completata").length,c:tasksCm.filter((t:any)=>t.stato!=="completata").length>0?AMB:DARK},
                    ].map((k,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<5?`1px solid #F2F1EC`:"none"}}>
                        <span style={{fontSize:12,color:"#86868b"}}>{k.l}</span>
                        <span style={{fontSize:12,fontWeight:700,color:k.c}}>{k.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Azione rapida — invia messaggio */}
                  <div onClick={()=>setDetTab("messaggi")} style={{padding:"10px 14px",borderRadius:10,background:BLU,display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",marginBottom:10}}>
                    <Svg path="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" c="#fff" s={14}/>
                    <span style={{fontSize:12,fontWeight:700,color:"#fff"}}>Invia messaggio</span>
                  </div>

                </div>
              )}

              <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Oggi</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[
                  {l:"Commesse attive",v:totAttive,c:TEAL},
                  {l:"Commesse ferme",v:fermeCount,c:fermeCount>0?RED:TEAL},
                  {l:"Valore pipeline",v:fmtE(totValore),c:DARK},
                  {l:"Ordini in corso",v:ordiniFornDB.filter((o:any)=>o.stato!=="consegnato").length,c:AMB},
                  {l:"Montaggi prog.",v:montaggiDB.filter((m:any)=>m.data>=TODAY&&m.stato!=="completato").length,c:PUR},
                  {l:"Fatture scadute",v:fattureDB.filter((f:any)=>!f.pagata&&f.scadenza<TODAY).length,c:RED},
                ].map((k,i)=>(
                  <div key={i} style={{background:"#fff",borderRadius:8,padding:"8px 10px",border:`1px solid #E5E3DC`}}>
                    <div style={{fontSize:10,color:"#86868b",fontWeight:600}}>{k.l}</div>
                    <div style={{fontSize:16,fontWeight:800,color:k.c,fontFamily:FM,marginTop:3}}>{k.v}</div>
                  </div>
                ))}
              </div>

              <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Pipeline per fase</div>
              <div style={{background:"#fff",borderRadius:10,border:`1px solid #E5E3DC`,overflow:"hidden",marginBottom:14}}>
                {pipeStats.map((p:any,i:number)=>(
                  <div key={p.id} onClick={()=>setFilterFase(p.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderBottom:i<pipeStats.length-1?`1px solid #F2F1EC`:"none",cursor:"pointer"}}
                    onMouseEnter={e=>((e.currentTarget as any).style.background="#F8F7F2")}
                    onMouseLeave={e=>((e.currentTarget as any).style.background="transparent")}>
                    <div style={{width:8,height:8,borderRadius:2,background:p.color||TEAL,flexShrink:0}}/>
                    <div style={{flex:1,fontSize:12,color:DARK}}>{p.nome}</div>
                    <div style={{fontSize:12,fontWeight:700,color:"#86868b",fontFamily:FM}}>{p.count}</div>
                    <div style={{fontSize:12,fontWeight:700,color:DARK,fontFamily:FM,minWidth:55,textAlign:"right"}}>{fmtE(p.euro)}</div>
                  </div>
                ))}
              </div>

              <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Prossimi montaggi</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
                {montaggiDB.filter((m:any)=>m.data>=TODAY).slice(0,4).map((m:any,i:number)=>(
                  <div key={i} style={{padding:"8px 10px",borderRadius:8,border:`1px solid #E5E3DC`,background:"#fff",display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{width:30,height:30,borderRadius:8,background:PUR+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:PUR,flexShrink:0,fontFamily:FM}}>{(m.data||"").split("-").slice(1).join("/")}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.cliente||m.commessa||"—"}</div>
                      <div style={{fontSize:10,color:"#86868b"}}>{m.squadraNome||m.squadra||"—"}</div>
                    </div>
                  </div>
                ))}
                {montaggiDB.filter((m:any)=>m.data>=TODAY).length===0&&<div style={{fontSize:12,color:"#86868b"}}>Nessun montaggio programmato</div>}
              </div>

              <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Messaggi recenti</div>
              {msgs.filter((m:any)=>!m.letto).slice(0,3).map((m:any,i:number)=>(
                <div key={i} style={{padding:"8px 10px",borderRadius:8,border:`1px solid #E5E3DC`,background:"#fff",marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,fontWeight:700,color:DARK}}>{m.from||"—"}</span><span style={{fontSize:10,color:"#86868b"}}>{m.ora||""}</span></div>
                  <div style={{fontSize:11,color:"#86868b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.testo||m.text||"—"}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    {/* MODAL ANTEPRIMA RILIEVO */}
    {previewRilievo&&(
      <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.4)"}} onClick={()=>setPreviewRilievo(null)}>
        <div style={{background:"#fff",borderRadius:16,width:620,maxHeight:"82vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:"18px 22px",borderBottom:`1px solid #E5E3DC`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {(()=>{const t=TIPO_RILIEVO.find((x:any)=>x.id===previewRilievo.tipo)||TIPO_RILIEVO[0];return(
                <div style={{width:40,height:40,borderRadius:10,background:t.color+"15",display:"flex",alignItems:"center",justifyContent:"center"}}><Svg path={t.icon} c={t.color} s={18}/></div>
              );})()}
              <div>
                <div style={{fontSize:16,fontWeight:800,color:DARK}}>Rilievo #{(cm?.rilievi||[]).findIndex((x:any)=>x===previewRilievo)+1}</div>
                <div style={{display:"flex",gap:8,marginTop:3}}>
                  {(()=>{const t=TIPO_RILIEVO.find((x:any)=>x.id===previewRilievo.tipo)||TIPO_RILIEVO[0];return <span style={{fontSize:11,padding:"2px 9px",borderRadius:20,background:t.color+"15",color:t.color,fontWeight:700}}>{t.label}</span>;})()}
                  <span style={{fontSize:12,color:"#86868b"}}>{previewRilievo.data||"—"} · {previewRilievo.rilevatore||"—"}</span>
                </div>
              </div>
            </div>
            <div onClick={()=>setPreviewRilievo(null)} style={{width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:`1px solid #E5E3DC`,fontSize:18,color:"#86868b"}}>×</div>
          </div>
          {/* KPI */}
          {(()=>{
            const vaniR=previewRilievo.vani||[];
            const misurati=vaniR.filter((v:any)=>Object.values(v.misure||{}).filter((x:any)=>(x as number)>0).length>=2).length;
            const pct=Math.round(misurati/Math.max(vaniR.length,1)*100);
            return(
              <div style={{padding:"14px 22px",borderBottom:`1px solid #E5E3DC`,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[{l:"Vani totali",v:vaniR.length,c:DARK},{l:"Misurati",v:misurati,c:TEAL},{l:"Da misurare",v:vaniR.length-misurati,c:vaniR.length-misurati>0?RED:TEAL},{l:"Completamento",v:`${pct}%`,c:pct===100?TEAL:pct>50?AMB:RED}].map((k,i)=>(
                  <div key={i} style={{background:"#F8F7F2",borderRadius:10,padding:"10px 12px",border:`1px solid #E5E3DC`}}>
                    <div style={{fontSize:10,color:"#86868b",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{k.l}</div>
                    <div style={{fontSize:20,fontWeight:800,color:k.c,fontFamily:FM,marginTop:4}}>{k.v}</div>
                  </div>
                ))}
              </div>
            );
          })()}
          {/* Vani */}
          <div style={{padding:"16px 22px"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>Dettaglio vani</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(previewRilievo.vani||[]).map((v:any,i:number)=>{
                const m=v.misure||{};
                const misurato=Object.values(m).filter((x:any)=>(x as number)>0).length>=2;
                return(
                  <div key={v.id||i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,background:misurato?TEAL+"05":"#F8F7F2",border:`1px solid ${misurato?TEAL+"25":"#E5E3DC"}`}}>
                    <VanoPreview v={v}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:DARK}}>{v.nome||`Vano ${i+1}`}</div>
                      <div style={{fontSize:12,color:"#86868b",marginTop:2}}>{v.tipo||"—"}{m.lCentro&&m.hCentro?<span style={{color:DARK,fontWeight:600}}> · {m.lCentro}×{m.hCentro}mm</span>:""}{v.sistema?` · ${v.sistema}`:""}</div>
                      {v.stanza&&<div style={{fontSize:11,color:"#86868b",marginTop:1}}>{v.stanza}{v.piano?` · ${v.piano}`:""}</div>}
                      {(m.lMuro||m.hMuro)&&<div style={{fontSize:11,color:"#86868b",marginTop:1}}>Muro: {m.lMuro||"?"}×{m.hMuro||"?"}mm</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                      {misurato
                        ?<div style={{width:26,height:26,borderRadius:7,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center"}}><Svg path="M20 6L9 17l-5-5" c="#fff" s={12}/></div>
                        :<span style={{fontSize:11,padding:"3px 9px",borderRadius:8,background:RED+"15",color:RED,fontWeight:700}}>Da misurare</span>
                      }
                      {v.foto&&Object.keys(v.foto).length>0&&<span style={{fontSize:10,color:"#86868b"}}>{Object.keys(v.foto).length} foto</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {previewRilievo.note&&(
              <div style={{marginTop:14,padding:"10px 14px",borderRadius:10,background:AMB+"08",border:`1px solid ${AMB}20`}}>
                <div style={{fontSize:11,fontWeight:700,color:AMB,marginBottom:4}}>Note rilievo</div>
                <div style={{fontSize:13,color:DARK}}>{previewRilievo.note}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
}