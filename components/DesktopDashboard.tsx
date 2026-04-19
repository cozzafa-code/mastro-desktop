"use client";
// @ts-nocheck
// MASTRO — DesktopDashboard v4
// Drag & drop widget, percentuali, dettaglio inline, personalizzabile

import { useState, useRef, useCallback, useEffect } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73",DARK="#1A1A1C",RED="#DC4444",AMB="#D08008",PUR="#8B5CF6",BLU="#3B7FE0",ORG="#F97316";
const fmtE=(n:number)=>"€"+Math.round(n).toLocaleString("it-IT");
const fmtK=(n:number)=>n>=1000?"€"+Math.round(n/1000)+"k":fmtE(n);
const daysTo=(d:string)=>Math.floor((new Date(d).getTime()-Date.now())/86400000);
const pct=(a:number,b:number)=>b>0?Math.round(a/b*100):0;

const PIPE_ORDER=["sopralluogo","preventivo","conferma","misure","ordini","produzione","posa","chiusura"];
const PIPE_COL:Record<string,string>={sopralluogo:BLU,preventivo:AMB,conferma:TEAL,misure:PUR,ordini:RED,produzione:ORG,posa:"#F59E0B",chiusura:TEAL};
const PIPE_LBL:Record<string,string>={sopralluogo:"Sopralluogo",preventivo:"Preventivo",conferma:"Conferma",misure:"Misure",ordini:"Ordini",produzione:"Produzione",posa:"Posa",chiusura:"Chiusura"};

const DEFAULT_LAYOUT = ["pipeline","scadenze","produzione","oggi","pratiche","team","problemi","ferme"];

function getRuoloColor(r:string){if(!r)return TEAL;if(r.includes("Montatore"))return PUR;if(r.includes("Preventiv"))return BLU;return AMB;}

// ── Mini barra percentuale ────────────────────────────────────
function Bar({value,color,max=100}:any){
  return (
    <div style={{height:4,borderRadius:2,background:"#F2F1EC",overflow:"hidden",marginTop:6}}>
      <div style={{height:"100%",width:`${Math.min(pct(value,max),100)}%`,background:color,borderRadius:2,transition:"width .4s ease"}}/>
    </div>
  );
}

// ── KPI card con percentuale ──────────────────────────────────
function KPI({l,v,sub="",color="",alert=false,onClick=null,pctVal=null,pctOf=null,pctLabel=""}:any){
  const p = pctVal!==null && pctOf ? pct(pctVal,pctOf) : null;
  return (
    <div onClick={onClick} style={{background:alert?color+"06":"#fff",borderRadius:14,padding:"18px 20px",border:`1px solid ${alert?color+"40":"#E5E3DC"}`,cursor:onClick?"pointer":"default",transition:"box-shadow .15s"}}
      onMouseEnter={e=>onClick&&((e.currentTarget as any).style.boxShadow="0 4px 16px rgba(0,0,0,0.08)")}
      onMouseLeave={e=>((e.currentTarget as any).style.boxShadow="none")}>
      <div style={{fontSize:11,color:"#86868b",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
      <div style={{fontSize:30,fontWeight:800,color:color||DARK,fontFamily:FM,lineHeight:1}}>{v}</div>
      {sub&&<div style={{fontSize:12,color:"#86868b",marginTop:4}}>{sub}</div>}
      {p!==null&&<>
        <Bar value={pctVal} max={pctOf} color={color||DARK}/>
        <div style={{fontSize:10,color:"#86868b",marginTop:3}}>{p}% {pctLabel}</div>
      </>}
    </div>
  );
}

// ── Widget drag & drop ────────────────────────────────────────
function Widget({id,title,color="",badge="",onMore=null,hidden=false,onHide,dragging,onDragStart,onDragOver,onDrop,defaultOpen=true,children}:any){
  const [open,setOpen]=useState(defaultOpen);
  if(hidden) return null;
  return (
    <div
      draggable
      onDragStart={()=>onDragStart(id)}
      onDragOver={e=>{e.preventDefault();onDragOver(id);}}
      onDrop={()=>onDrop(id)}
      style={{background:"#fff",borderRadius:14,border:`1px solid ${color?color+"25":"#E5E3DC"}`,overflow:"hidden",marginBottom:16,opacity:dragging===id?0.5:1,transition:"opacity .15s",cursor:"grab"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",cursor:"pointer",userSelect:"none",gap:10}}>
        <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
          <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0,opacity:.3}}>
            <div style={{display:"flex",gap:2}}>{[0,1].map(i=><div key={i} style={{width:3,height:3,borderRadius:"50%",background:DARK}}/>)}</div>
            <div style={{display:"flex",gap:2}}>{[0,1].map(i=><div key={i} style={{width:3,height:3,borderRadius:"50%",background:DARK}}/>)}</div>
            <div style={{display:"flex",gap:2}}>{[0,1].map(i=><div key={i} style={{width:3,height:3,borderRadius:"50%",background:DARK}}/>)}</div>
          </div>
          {color&&<div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>}
          <span style={{fontSize:14,fontWeight:700,color:DARK,whiteSpace:"nowrap"}}>{title}</span>
          {badge&&<span style={{fontSize:11,padding:"2px 9px",borderRadius:20,background:color?color+"15":"#F2F1EC",color:color||DARK,fontWeight:700,flexShrink:0}}>{badge}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {onMore&&<span onClick={e=>{e.stopPropagation();onMore();}} style={{fontSize:11,color:"#86868b",cursor:"pointer",padding:"2px 8px",borderRadius:6,border:"1px solid #E5E3DC",whiteSpace:"nowrap"}}>Vedi tutto →</span>}
          <div onClick={e=>{e.stopPropagation();onHide(id);}} title="Nascondi widget" style={{width:22,height:22,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#C0C0C5",fontSize:14,lineHeight:1}}
            onMouseEnter={e=>((e.currentTarget as any).style.background="#F2F1EC")}
            onMouseLeave={e=>((e.currentTarget as any).style.background="transparent")}>×</div>
          <div onClick={()=>setOpen(o=>!o)} style={{color:"#86868b",fontSize:12,cursor:"pointer",width:20,textAlign:"center"}}>{open?"▲":"▼"}</div>
        </div>
      </div>
      {open&&<div style={{borderTop:"1px solid #F2F1EC"}}>{children}</div>}
    </div>
  );
}

// ── Riga commessa cliccabile ──────────────────────────────────
function CMRow({c,onClick,giorniFermaCM}:any){
  const gg=giorniFermaCM(c);
  const col=gg>=30?RED:gg>=15?ORG:AMB;
  return (
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px",borderBottom:"1px solid #F2F1EC",cursor:"pointer",transition:"background .1s"}}
      onMouseEnter={e=>((e.currentTarget as any).style.background="#F8F7F2")}
      onMouseLeave={e=>((e.currentTarget as any).style.background="transparent")}>
      <div style={{width:36,height:36,borderRadius:10,background:col+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:col,flexShrink:0}}>{(c.cliente||"?")[0]}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.cliente} {c.cognome||""}</div>
        <div style={{fontSize:11,color:"#86868b",marginTop:1}}>{c.code} · {PIPE_LBL[c.fase]||c.fase}{c.euro?` · ${fmtK(parseFloat(c.euro))}`:""}</div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:13,fontWeight:800,color:col}}>{gg}gg</div>
        <div style={{fontSize:10,color:"#86868b"}}>ferma</div>
      </div>
    </div>
  );
}

export default function DesktopDashboard(){
  const {T,cantieri=[],fattureDB=[],ordiniFornDB=[],montaggiDB=[],tasks=[],msgs=[],team=[],problemi=[],aziendaInfo,setTab,setSelectedCM,setFilterFase,giorniFermaCM,sogliaDays=7}=useMastro();

  const [scadFiltro,setScadFiltro]=useState(15);
  const [layout,setLayout]=useState<string[]>(DEFAULT_LAYOUT);
  const [hidden,setHidden]=useState<string[]>([]);
  const [dragging,setDragging]=useState<string|null>(null);
  const [dragOver,setDragOver]=useState<string|null>(null);
  const [editMode,setEditMode]=useState(false);

  // Salva preferenze
  useEffect(()=>{
    try{const s=localStorage.getItem("mastro_dash_layout");if(s){const p=JSON.parse(s);setLayout(p.layout||DEFAULT_LAYOUT);setHidden(p.hidden||[]);}}catch{}
  },[]);
  const save=(l:string[],h:string[])=>{try{localStorage.setItem("mastro_dash_layout",JSON.stringify({layout:l,hidden:h}));}catch{}};

  const hideWidget=(id:string)=>{const h=[...hidden,id];setHidden(h);save(layout,h);};
  const showAll=()=>{setHidden([]);save(layout,[]);};

  const onDragStart=(id:string)=>setDragging(id);
  const onDragOver=(id:string)=>setDragOver(id);
  const onDrop=(id:string)=>{
    if(!dragging||dragging===id)return;
    const l=[...layout];
    const from=l.indexOf(dragging),to=l.indexOf(id);
    if(from<0||to<0)return;
    l.splice(from,1);l.splice(to,0,dragging);
    setLayout(l);save(l,hidden);setDragging(null);setDragOver(null);
  };

  const TODAY=new Date().toISOString().split("T")[0];
  const NOW=new Date();
  const h=NOW.getHours();
  const saluto=h<12?"Buongiorno":h<18?"Buon pomeriggio":"Buonasera";

  const attive=cantieri.filter(c=>c.fase!=="chiusura");
  const ferme=attive.filter(c=>giorniFermaCM(c)>=sogliaDays);
  const confermati=attive.filter(c=>["conferma","misure","ordini","produzione","posa"].includes(c.fase));
  const totPipeline=attive.reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const totConfermato=confermati.reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const daIncassare=fattureDB.filter(f=>!f.pagata).reduce((s,f)=>s+(f.importo||0),0);
  const fattTot=fattureDB.reduce((s,f)=>s+(f.importo||0),0);
  const fattScad=fattureDB.filter(f=>!f.pagata&&f.scadenza&&f.scadenza<TODAY);
  const msgNonLetti=msgs.filter(m=>!m.letto).length;
  const problemiAperti=(problemi||[]).filter(p=>p.stato!=="risolto");
  const montaggiOggi=montaggiDB.filter(m=>m.data===TODAY);
  const taskOggi=tasks.filter(t=>!t.done&&t.date===TODAY);

  const LIMIT=new Date(Date.now()+scadFiltro*86400000).toISOString().split("T")[0];
  const consegne=cantieri.filter(c=>c.dataConsegna&&c.dataConsegna>=TODAY&&c.dataConsegna<=LIMIT&&c.fase!=="chiusura");
  const fattInScad=fattureDB.filter(f=>!f.pagata&&f.scadenza&&f.scadenza>=TODAY&&f.scadenza<=LIMIT);
  const montaggiInArr=montaggiDB.filter(m=>m.data>=TODAY&&m.data<=LIMIT);

  const inProduzione=cantieri.filter(c=>c.fase==="produzione");
  const inOrdini=cantieri.filter(c=>c.fase==="ordini");
  const inPosa=cantieri.filter(c=>c.fase==="posa");
  const pratiche={p50:cantieri.filter(c=>c.detrazione==="50"),p65:cantieri.filter(c=>c.detrazione==="65"),p75:cantieri.filter(c=>c.detrazione==="75")};

  const wProps=(id:string)=>({id,hidden:hidden.includes(id),onHide:hideWidget,dragging,onDragStart,onDragOver,onDrop});

  const WIDGETS:Record<string,React.ReactNode>={
    pipeline:(
      <Widget {...wProps("pipeline")} title="Pipeline commesse" badge={`${attive.length} attive`} onMore={()=>setTab("commesse")}>
        <div style={{padding:"14px 18px"}}>
          <div style={{display:"flex",gap:3,height:18,borderRadius:6,overflow:"hidden",marginBottom:14}}>
            {PIPE_ORDER.map(fase=>{const n=cantieri.filter(c=>c.fase===fase).length;if(!n)return null;return <div key={fase} style={{flex:n,background:PIPE_COL[fase],minWidth:n*18,transition:"flex .3s"}} title={`${PIPE_LBL[fase]}: ${n} (${pct(n,cantieri.length)}%)`}/>;  })}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {PIPE_ORDER.map(fase=>{
              const items=cantieri.filter(c=>c.fase===fase);
              const euro=items.reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
              const col=PIPE_COL[fase];
              const p=pct(items.length,cantieri.length);
              return (
                <div key={fase} onClick={()=>{setFilterFase(fase);setTab("commesse");}} style={{padding:"12px 12px",borderRadius:10,background:items.length>0?col+"08":"#F8F7F2",border:`1px solid ${items.length>0?col+"30":"#E5E3DC"}`,cursor:"pointer"}}
                  onMouseEnter={e=>((e.currentTarget as any).style.background=col+"14")}
                  onMouseLeave={e=>((e.currentTarget as any).style.background=items.length>0?col+"08":"#F8F7F2")}>
                  <div style={{fontSize:11,color:"#86868b",fontWeight:600,marginBottom:4}}>{PIPE_LBL[fase]}</div>
                  <div style={{fontSize:24,fontWeight:800,color:items.length>0?col:"#86868b",fontFamily:FM,lineHeight:1}}>{items.length}</div>
                  <div style={{fontSize:10,color:col,fontWeight:700,marginTop:4}}>{p}%</div>
                  {euro>0&&<div style={{fontSize:10,color:"#86868b",marginTop:2}}>{fmtK(euro)}</div>}
                  <Bar value={items.length} max={Math.max(cantieri.length,1)} color={col}/>
                </div>
              );
            })}
          </div>
        </div>
      </Widget>
    ),

    scadenze:(
      <Widget {...wProps("scadenze")} title={`Scadenze — ${scadFiltro}gg`} color={AMB}>
        <div style={{padding:"0 18px 14px"}}>
          {[{title:`Consegne (${consegne.length})`,items:consegne,render:(c:any)=>(
            <div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F2F1EC",cursor:"pointer"}}>
              <div><div style={{fontSize:13,fontWeight:600,color:DARK}}>{c.cliente} {c.cognome||""}</div><div style={{fontSize:11,color:"#86868b"}}>{c.code}</div></div>
              <span style={{fontSize:13,fontWeight:800,color:daysTo(c.dataConsegna)<=3?RED:AMB}}>{daysTo(c.dataConsegna)}gg</span>
            </div>
          ),empty:"Nessuna consegna programmata"},
          {title:`Fatture in scadenza (${fattInScad.length})`,items:fattInScad,render:(f:any)=>(
            <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F2F1EC"}}>
              <div style={{fontSize:13,color:DARK}}>{f.cliente||f.numero||"—"}</div>
              <div style={{display:"flex",gap:12}}><span style={{fontSize:13,fontWeight:700,color:AMB}}>{fmtK(f.importo||0)}</span><span style={{fontSize:12,fontWeight:700,color:daysTo(f.scadenza)<=0?RED:AMB}}>{daysTo(f.scadenza)<=0?"Scaduta":`${daysTo(f.scadenza)}gg`}</span></div>
            </div>
          ),empty:"Nessuna fattura in scadenza"},
          {title:`Montaggi (${montaggiInArr.length})`,items:montaggiInArr,render:(m:any)=>(
            <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F2F1EC"}}>
              <div style={{fontSize:13,color:DARK}}>{m.cliente||m.note||"—"}</div>
              <span style={{fontSize:12,fontWeight:700,color:PUR}}>{m.data===TODAY?"Oggi":`${daysTo(m.data)}gg`}</span>
            </div>
          ),empty:"Nessun montaggio programmato"},
          ].map(sec=>(
            <div key={sec.title}>
              <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.8,margin:"14px 0 8px"}}>{sec.title}</div>
              {sec.items.length===0?<div style={{fontSize:13,color:"#86868b",padding:"4px 0 8px"}}>{sec.empty}</div>:sec.items.slice(0,4).map(sec.render)}
            </div>
          ))}
        </div>
      </Widget>
    ),

    produzione:(
      <Widget {...wProps("produzione")} title="Produzione" color={ORG} badge={`${inProduzione.length} attive`} onMore={()=>setTab("produzione")}>
        <div>
          {[{l:"In produzione",n:inProduzione.length,tot:attive.length,c:ORG},{l:"In attesa ordini",n:inOrdini.length,tot:attive.length,c:AMB},{l:"Pronte per posa",n:inPosa.length,tot:attive.length,c:TEAL},{l:"Ordini fornitori",n:(ordiniFornDB||[]).filter((o:any)=>o.stato==="inviato").length,tot:10,c:BLU}].map(row=>(
            <div key={row.l} style={{padding:"11px 18px",borderBottom:"1px solid #F2F1EC"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:13,color:"#86868b"}}>{row.l}</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:row.c,fontWeight:700}}>{pct(row.n,row.tot||1)}%</span>
                  <span style={{fontSize:20,fontWeight:800,color:row.n>0?row.c:"#86868b",fontFamily:FM,minWidth:28,textAlign:"right"}}>{row.n}</span>
                </div>
              </div>
              <Bar value={row.n} max={Math.max(row.tot,1)} color={row.c}/>
            </div>
          ))}
          {inProduzione.slice(0,3).map((c:any)=>(
            <div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 18px",borderBottom:"1px solid #F2F1EC",cursor:"pointer"}}
              onMouseEnter={e=>((e.currentTarget as any).style.background="#F8F7F2")}
              onMouseLeave={e=>((e.currentTarget as any).style.background="transparent")}>
              <span style={{fontSize:13,color:DARK,fontWeight:600}}>{c.cliente} {c.cognome||""}</span>
              <span style={{fontSize:11,color:ORG,fontWeight:700}}>{c.code}</span>
            </div>
          ))}
        </div>
      </Widget>
    ),

    oggi:(
      <Widget {...wProps("oggi")} title="Oggi" color={PUR}>
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"14px 18px 10px"}}>
            <div style={{padding:"14px",borderRadius:10,background:PUR+"08",textAlign:"center"}}>
              <div style={{fontSize:34,fontWeight:800,color:PUR,fontFamily:FM,lineHeight:1}}>{montaggiOggi.length}</div>
              <div style={{fontSize:11,color:"#86868b",marginTop:6}}>montaggi oggi</div>
              {montaggiDB.length>0&&<div style={{fontSize:10,color:PUR,marginTop:4,fontWeight:700}}>{pct(montaggiOggi.length,montaggiDB.length)}% del totale</div>}
            </div>
            <div style={{padding:"14px",borderRadius:10,background:AMB+"08",textAlign:"center"}}>
              <div style={{fontSize:34,fontWeight:800,color:AMB,fontFamily:FM,lineHeight:1}}>{taskOggi.length}</div>
              <div style={{fontSize:11,color:"#86868b",marginTop:6}}>task oggi</div>
              {tasks.length>0&&<div style={{fontSize:10,color:AMB,marginTop:4,fontWeight:700}}>{pct(taskOggi.length,tasks.length)}% del totale</div>}
            </div>
          </div>
          {montaggiOggi.length===0
            ?<div style={{fontSize:13,color:"#86868b",textAlign:"center",padding:"10px 18px 14px"}}>Nessun montaggio oggi</div>
            :montaggiOggi.slice(0,4).map((m:any)=>(
            <div key={m.id} style={{padding:"10px 18px",borderBottom:"1px solid #F2F1EC"}}>
              <div style={{fontSize:13,fontWeight:600,color:DARK}}>{m.cliente||"—"}</div>
              <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{m.orario||""}{m.indirizzo?` · ${m.indirizzo}`:""}</div>
            </div>
          ))}
        </div>
      </Widget>
    ),

    pratiche:(
      <Widget {...wProps("pratiche")} title="Pratiche fiscali" color={BLU}>
        <div>
          {[{l:"Ristrutturazione 50%",items:pratiche.p50,c:TEAL},{l:"Ecobonus 65%",items:pratiche.p65,c:BLU},{l:"Barriere 75%",items:pratiche.p75,c:PUR}].map(row=>(
            <div key={row.l} style={{padding:"12px 18px",borderBottom:"1px solid #F2F1EC"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div>
                  <div style={{fontSize:13,color:DARK,fontWeight:500}}>{row.l}</div>
                  <div style={{fontSize:11,color:"#86868b",marginTop:1}}>{row.items.length} commesse · {fmtK(row.items.reduce((s,c)=>s+(parseFloat(c.euro)||0),0))}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:22,fontWeight:800,color:row.items.length>0?row.c:"#86868b",fontFamily:FM}}>{row.items.length}</div>
                  <div style={{fontSize:10,color:row.c,fontWeight:700}}>{pct(row.items.length,attive.length)}%</div>
                </div>
              </div>
              <Bar value={row.items.length} max={Math.max(attive.length,1)} color={row.c}/>
            </div>
          ))}
          <div style={{padding:"12px 18px"}}>
            <div style={{fontSize:11,color:"#86868b",marginBottom:4}}>Valore detraibile totale</div>
            <div style={{fontSize:22,fontWeight:800,color:BLU,fontFamily:FM}}>{fmtK([...pratiche.p50,...pratiche.p65,...pratiche.p75].reduce((s,c)=>s+(parseFloat(c.euro)||0),0))}</div>
          </div>
        </div>
      </Widget>
    ),

    team:(
      <Widget {...wProps("team")} title="Team — adesso" onMore={()=>setTab("settings")}>
        <div>
          {(team.length>0?team:[{id:"1",nome:"Titolare",ruolo:"Titolare"}]).map((m:any,i:number)=>{
            const inCantiere=montaggiDB.some(mt=>mt.operatoreId===m.id&&mt.data===TODAY);
            const tc=tasks.filter(t=>t.assegnatoA===m.id&&!t.done).length;
            const col=m.colore||getRuoloColor(m.ruolo);
            return (
              <div key={m.id||i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px",borderBottom:"1px solid #F2F1EC"}}>
                <div style={{width:38,height:38,borderRadius:10,background:col+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:col,flexShrink:0}}>{(m.nome||"?")[0]}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:DARK}}>{m.nome}</div>
                  <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{m.ruolo||"—"}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  {inCantiere&&<span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:TEAL+"15",color:TEAL,fontWeight:700}}>Cantiere</span>}
                  {tc>0&&<span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:AMB+"15",color:AMB,fontWeight:700}}>{tc} task</span>}
                  {!inCantiere&&tc===0&&<span style={{fontSize:11,color:"#86868b"}}>—</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Widget>
    ),

    problemi:(
      <Widget {...wProps("problemi")} title="Problemi e criticità" color={problemiAperti.length>0?RED:TEAL} badge={problemiAperti.length>0?`${problemiAperti.length} aperti`:""}>
        <div>
          {problemiAperti.length===0
            ?<div style={{fontSize:13,color:"#86868b",textAlign:"center",padding:"20px 18px"}}>Nessun problema aperto ✓</div>
            :problemiAperti.slice(0,6).map((p:any,i:number)=>(
            <div key={p.id||i} style={{padding:"11px 18px",borderBottom:"1px solid #F2F1EC"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titolo||"—"}</div>
                  <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{p.tipo||""}{p.commessa?` · ${p.commessa}`:""}</div>
                </div>
                <span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:p.priorita==="alta"?RED+"15":p.priorita==="media"?AMB+"15":"#F2F1EC",color:p.priorita==="alta"?RED:p.priorita==="media"?AMB:"#86868b",fontWeight:700,flexShrink:0}}>{p.priorita||"—"}</span>
              </div>
            </div>
          ))}
        </div>
      </Widget>
    ),

    ferme:(
      <Widget {...wProps("ferme")} title="Commesse da sbloccare" color={ferme.length>0?RED:""} badge={ferme.length>0?`${ferme.length} ferme · ${pct(ferme.length,attive.length)}%`:""} onMore={()=>setTab("commesse")}>
        <div>
          {ferme.length===0
            ?<div style={{fontSize:13,color:"#86868b",textAlign:"center",padding:"20px 18px"}}>Tutto in ordine ✓</div>
            :ferme.slice(0,8).map((c:any)=><CMRow key={c.id} c={c} giorniFermaCM={giorniFermaCM} onClick={()=>{setSelectedCM(c);setTab("commesse");}}/>)
          }
          {ferme.length>0&&(
            <div style={{padding:"10px 18px"}}>
              <Bar value={ferme.length} max={Math.max(attive.length,1)} color={RED}/>
              <div style={{fontSize:10,color:"#86868b",marginTop:4}}>{pct(ferme.length,attive.length)}% delle commesse attive sono ferme</div>
            </div>
          )}
        </div>
      </Widget>
    ),
  };

  return (
    <div style={{height:"100%",overflowY:"auto",background:"#F2F1EC",fontFamily:FF}}>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"22px 26px"}}>

        {/* HEADER */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <div style={{fontSize:24,fontWeight:800,color:DARK,letterSpacing:-.5}}>{saluto}, {aziendaInfo?.ragione||aziendaInfo?.nome||"Walter Cozza Serramenti"}</div>
            <div style={{fontSize:13,color:"#86868b",marginTop:3}}>{NOW.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
            {hidden.length>0&&<div onClick={showAll} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",background:TEAL+"15",color:TEAL,border:`1px solid ${TEAL}30`}}>Ripristina tutti ({hidden.length})</div>}
            <span style={{fontSize:12,color:"#86868b"}}>Scadenze:</span>
            {[7,15,30].map(d=>(<div key={d} onClick={()=>setScadFiltro(d)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",background:scadFiltro===d?DARK:"#fff",color:scadFiltro===d?"#fff":"#86868b",border:`1px solid ${scadFiltro===d?DARK:"#E5E3DC"}`}}>{d}gg</div>))}
          </div>
        </div>

        {/* ALERT */}
        {(ferme.length>0||fattScad.length>0||problemiAperti.length>0)&&(
          <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
            {ferme.length>0&&<div onClick={()=>{setFilterFase("tutte");setTab("commesse");}} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:10,background:RED+"08",border:`1.5px solid ${RED}30`,cursor:"pointer"}}><div style={{width:6,height:6,borderRadius:"50%",background:RED}}/><span style={{fontSize:13,fontWeight:700,color:RED}}>{ferme.length} commesse ferme ({pct(ferme.length,attive.length)}%) — sblocca subito</span></div>}
            {fattScad.length>0&&<div onClick={()=>setTab("contabilita")} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:10,background:AMB+"08",border:`1.5px solid ${AMB}30`,cursor:"pointer"}}><div style={{width:6,height:6,borderRadius:"50%",background:AMB}}/><span style={{fontSize:13,fontWeight:700,color:AMB}}>{fattScad.length} fatture scadute — {fmtK(fattScad.reduce((s,f)=>s+(f.importo||0),0))}</span></div>}
            {problemiAperti.length>0&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:10,background:RED+"08",border:`1.5px solid ${RED}30`}}><div style={{width:6,height:6,borderRadius:"50%",background:RED}}/><span style={{fontSize:13,fontWeight:700,color:RED}}>{problemiAperti.length} problemi aperti</span></div>}
          </div>
        )}

        {/* KPI */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
          <KPI l="Commesse attive" v={attive.length} color={TEAL} sub={`${confermati.length} confermate`} onClick={()=>setTab("commesse")} pctVal={confermati.length} pctOf={attive.length} pctLabel="confermate"/>
          <KPI l="Commesse ferme" v={ferme.length} color={ferme.length>0?RED:TEAL} sub={`Soglia ${sogliaDays}gg`} alert={ferme.length>0} onClick={()=>setTab("commesse")} pctVal={ferme.length} pctOf={attive.length} pctLabel="del totale"/>
          <KPI l="Pipeline" v={fmtK(totPipeline)} color={DARK} sub={`${fmtK(totConfermato)} confermato`} pctVal={totConfermato} pctOf={totPipeline} pctLabel="confermato"/>
          <KPI l="Da incassare" v={fmtK(daIncassare)} color={daIncassare>0?AMB:TEAL} sub={`${fattScad.length} scadute`} alert={fattScad.length>0} onClick={()=>setTab("contabilita")} pctVal={daIncassare} pctOf={fattTot||1} pctLabel="da incassare"/>
          <KPI l="Messaggi" v={msgNonLetti} color={msgNonLetti>0?BLU:TEAL} sub={`${msgs.length} totali`} onClick={()=>setTab("messaggi")} pctVal={msgNonLetti} pctOf={msgs.length||1} pctLabel="non letti"/>
          <KPI l="Problemi" v={problemiAperti.length} color={problemiAperti.length>0?RED:TEAL} sub={problemiAperti.length>0?"Da risolvere":"Tutto ok"} alert={problemiAperti.length>0} pctVal={problemiAperti.length} pctOf={(problemi||[]).length||1} pctLabel="aperti"/>
        </div>

        {/* WIDGETS IN ORDINE CONFIGURABILE */}
        <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:16}}>
          <div>
            {layout.filter((_,i)=>i%2===0).map(id=>WIDGETS[id]||null)}
          </div>
          <div>
            {layout.filter((_,i)=>i%2===1).map(id=>WIDGETS[id]||null)}
          </div>
        </div>

        {hidden.length>0&&(
          <div style={{marginTop:8,padding:"14px 18px",borderRadius:12,background:"#fff",border:"1px dashed #E5E3DC",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:"#86868b",fontWeight:600}}>Widget nascosti:</span>
            {hidden.map(id=>(
              <div key={id} onClick={()=>{const h=hidden.filter(x=>x!==id);setHidden(h);save(layout,h);}} style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:"#F2F1EC",color:"#86868b",border:"1px solid #E5E3DC"}}>
                + {id}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
