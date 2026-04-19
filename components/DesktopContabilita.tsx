"use client";
// @ts-nocheck
// MASTRO — DesktopContabilita.tsx
// Vista desktop Contabilità: dashboard P&L, fatture, saldi, grafici margini

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", BLUE="#3B7FE0", AMBER="#E8A020";

export default function DesktopContabilita() {
  const { T, cantieri=[], fattureDB=[], ordiniFornDB=[], setSelectedCM, setTab } = useMastro();
  const [period, setPeriod] = useState<"mese"|"trimestre"|"anno">("mese");
  const [selFattura, setSelFattura] = useState<any>(null);

  const TODAY = new Date().toISOString().split("T")[0];
  const NOW = new Date();
  const mese = NOW.getMonth(), anno = NOW.getFullYear();

  const inPeriod = (data:string) => {
    if (!data) return false;
    const d = new Date(data);
    if (period==="mese") return d.getMonth()===mese && d.getFullYear()===anno;
    if (period==="trimestre") return d.getFullYear()===anno && Math.floor(d.getMonth()/3)===Math.floor(mese/3);
    return d.getFullYear()===anno;
  };

  const fattPeriod = fattureDB.filter((f:any) => inPeriod(f.data));
  const fattScad = fattureDB.filter((f:any) => !f.pagata && f.scadenza && f.scadenza < TODAY);
  const fattAttesa = fattureDB.filter((f:any) => !f.pagata && (!f.scadenza || f.scadenza >= TODAY));
  const fatturato = fattureDB.filter((f:any)=>f.pagata&&inPeriod(f.data)).reduce((s:number,f:any)=>s+(f.importo||0),0);
  const daIncassare = fattureDB.filter((f:any)=>!f.pagata).reduce((s:number,f:any)=>s+(f.importo||0),0);
  const ordiniForn = ordiniFornDB.reduce((s:number,o:any)=>s+(o.totaleIva||o.importo||0),0);
  const margineEst = fatturato > 0 ? Math.round((1 - ordiniForn/fatturato)*100) : 0;

  // Grafico mensile semplice (ultimi 6 mesi)
  const mesiLabels = Array.from({length:6},(_,i)=>{
    const d = new Date(anno, mese-5+i, 1);
    return { label: d.toLocaleDateString("it-IT",{month:"short"}), m: d.getMonth(), y: d.getFullYear() };
  });
  const maxFatt = Math.max(1, ...mesiLabels.map(ml => fattureDB.filter((f:any)=>f.pagata&&new Date(f.data||"").getMonth()===ml.m&&new Date(f.data||"").getFullYear()===ml.y).reduce((s:number,f:any)=>s+(f.importo||0),0)));

  const fmtE = (n:number) => n > 0 ? "€"+Math.round(n).toLocaleString("it-IT") : "€0";
  const fmtEn = (n:number) => "€"+Math.round(n).toLocaleString("it-IT");

  const StatBig = ({l,v,sub="",c="",onClick=null}:any) => (
    <div onClick={onClick} style={{background:"#fff",borderRadius:12,padding:"14px 16px",border:`0.5px solid ${T.bdr}`,cursor:onClick?"pointer":"default"}}>
      <div style={{fontSize:11,color:T.sub,marginBottom:6}}>{l}</div>
      <div style={{fontSize:22,fontWeight:500,color:c||T.text,fontFamily:FM}}>{v}</div>
      {sub&&<div style={{fontSize:11,color:T.sub,marginTop:3}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>

      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Contabilità</span>
        <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
          {(["mese","trimestre","anno"] as const).map(p=>(
            <div key={p} onClick={()=>setPeriod(p)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:500,cursor:"pointer",background:period===p?DARK:"transparent",color:period===p?"#fff":T.sub,border:`0.5px solid ${period===p?DARK:T.bdr}`}}>{p.charAt(0).toUpperCase()+p.slice(1)}</div>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
        {/* KPI GRANDI */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
          <StatBig l={`Fatturato ${period}`} v={fmtEn(fatturato)} c={TEAL} sub={`${fattPeriod.filter((f:any)=>f.pagata).length} fatture`}/>
          <StatBig l="Da incassare" v={fmtEn(daIncassare)} c={daIncassare>0?AMBER:TEAL} sub={`${fattAttesa.length} fatture in attesa`}/>
          <StatBig l="Scaduto" v={fmtEn(fattScad.reduce((s:number,f:any)=>s+(f.importo||0),0))} c={fattScad.length>0?RED:TEAL} sub={`${fattScad.length} fatture scadute`}/>
          <StatBig l="Margine stimato" v={`${margineEst}%`} c={margineEst>=30?TEAL:margineEst>=20?AMBER:RED} sub={`Costo ordini: ${fmtE(ordiniForn)}`}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
          {/* GRAFICO MENSILE */}
          <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
            <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:14}}>Fatturato mensile</div>
            <div style={{display:"flex",gap:6,alignItems:"flex-end",height:100}}>
              {mesiLabels.map((ml,i)=>{
                const val = fattureDB.filter((f:any)=>f.pagata&&new Date(f.data||"").getMonth()===ml.m&&new Date(f.data||"").getFullYear()===ml.y).reduce((s:number,f:any)=>s+(f.importo||0),0);
                const h = Math.max(4, Math.round(val/maxFatt*100));
                const isLast = i===5;
                return (
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",gap:4}}>
                    <div style={{fontSize:9,color:T.sub,fontFamily:FM}}>{val>0?fmtE(val):""}</div>
                    <div style={{width:"100%",height:h,borderRadius:"4px 4px 0 0",background:isLast?TEAL:TEAL+"40",transition:"height .3s"}}/>
                    <div style={{fontSize:9,color:T.sub}}>{ml.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* P&L PER COMMESSA */}
          <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
            <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:12}}>P&L per commessa</div>
            <div style={{display:"flex",flexDirection:"column" as any,gap:4,maxHeight:150,overflowY:"auto" as any}}>
              {cantieri.filter((c:any)=>c.euro&&parseFloat(c.euro)>0).slice(0,8).map((c:any)=>{
                const ordCm = ordiniFornDB.filter((o:any)=>o.cmId===c.id).reduce((s:number,o:any)=>s+(o.totaleIva||0),0);
                const ricavo = parseFloat(c.euro)||0;
                const margine = ricavo>0?Math.round((1-ordCm/ricavo)*100):0;
                return (
                  <div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,cursor:"pointer",background:"#F8FAFC"}}>
                    <div style={{fontSize:11,color:T.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{c.cliente} {c.cognome||""}</div>
                    <div style={{fontSize:11,fontFamily:FM,color:T.text,flexShrink:0,minWidth:60,textAlign:"right" as any}}>{fmtE(ricavo)}</div>
                    <div style={{width:40,height:4,borderRadius:2,background:T.bg,flexShrink:0,overflow:"hidden"}}>
                      <div style={{height:"100%",width:Math.min(100,Math.max(0,margine))+"%",background:margine>=30?TEAL:margine>=15?AMBER:RED,borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:10,fontWeight:500,color:margine>=30?TEAL:margine>=15?AMBER:RED,flexShrink:0,minWidth:30,textAlign:"right" as any}}>{margine}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FATTURE */}
        <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:12,fontWeight:500,color:T.text}}>Tutte le fatture</span>
            <div style={{display:"flex",gap:4}}>
              <span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:RED+"12",color:RED,fontWeight:500}}>{fattScad.length} scadute</span>
              <span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:AMBER+"12",color:AMBER,fontWeight:500}}>{fattAttesa.length} in attesa</span>
            </div>
          </div>
          {/* Header tabella */}
          <div style={{display:"grid",gridTemplateColumns:"120px 1fr 100px 90px 80px 80px",padding:"6px 16px",background:"#F8FAFC",borderBottom:`0.5px solid ${T.bdr}`,gap:8}}>
            {["Numero","Cliente","Data","Scadenza","Importo","Stato"].map((h,i)=>(
              <div key={i} style={{fontSize:10,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,textAlign:i>=4?"right" as any:"left"}}>{h}</div>
            ))}
          </div>
          <div style={{maxHeight:280,overflowY:"auto" as any}}>
            {[...fattScad, ...fattAttesa, ...fattureDB.filter((f:any)=>f.pagata)].slice(0,20).map((f:any,i:number)=>{
              const cm = cantieri.find((c:any)=>c.id===f.cmId);
              const isScaduta = !f.pagata && f.scadenza && f.scadenza < TODAY;
              return (
                <div key={f.id||i} onClick={()=>setSelFattura(selFattura?.id===f.id?null:f)}
                  style={{display:"grid",gridTemplateColumns:"120px 1fr 100px 90px 80px 80px",padding:"9px 16px",borderBottom:`0.5px solid ${T.bdr}`,gap:8,cursor:"pointer",background:selFattura?.id===f.id?"rgba(26,158,115,0.04)":isScaduta?"rgba(220,68,68,0.02)":"transparent",alignItems:"center"}}>
                  <div style={{fontSize:11,fontFamily:FM,color:T.sub}}>{f.numero||`F-${i+1}`}</div>
                  <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{cm?`${cm.cliente} ${cm.cognome||""}`:f.clienteNome||"—"}</div>
                  <div style={{fontSize:11,color:T.sub}}>{f.data||"—"}</div>
                  <div style={{fontSize:11,color:isScaduta?RED:T.sub,fontWeight:isScaduta?500:400}}>{f.scadenza||"—"}</div>
                  <div style={{fontSize:12,fontWeight:500,color:T.text,textAlign:"right" as any,fontFamily:FM}}>{fmtE(f.importo||0)}</div>
                  <div style={{textAlign:"right" as any}}>
                    <span style={{fontSize:10,fontWeight:500,padding:"2px 7px",borderRadius:5,background:f.pagata?TEAL+"12":isScaduta?RED+"12":AMBER+"12",color:f.pagata?TEAL:isScaduta?RED:AMBER}}>
                      {f.pagata?"Pagata":isScaduta?"Scaduta":"In attesa"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
