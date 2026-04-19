"use client";
// @ts-nocheck
// MASTRO — DesktopReport.tsx
// Analytics avanzato titolare: fatturato, margini, trend, top prodotti, previsioni

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", ORANGE="#F97316";

export default function DesktopReport() {
  const { T, cantieri=[], fattureDB=[], ordiniFornDB=[], montaggiDB=[], contatti=[], team=[] } = useMastro();
  const [period, setPeriod] = useState<"mese"|"trimestre"|"anno">("anno");
  const [view, setView] = useState<"overview"|"commesse"|"prodotti"|"team">("overview");

  const NOW = new Date();
  const anno = NOW.getFullYear();
  const mese = NOW.getMonth();

  const inPeriod = (data:string) => {
    if(!data) return false;
    const d = new Date(data);
    if(period==="mese") return d.getMonth()===mese && d.getFullYear()===anno;
    if(period==="trimestre") return d.getFullYear()===anno && Math.floor(d.getMonth()/3)===Math.floor(mese/3);
    return d.getFullYear()===anno;
  };

  // KPI principali
  const fatturatoPagato = fattureDB.filter(f=>f.pagata&&inPeriod(f.data)).reduce((s:number,f:any)=>s+(f.importo||0),0);
  const fatturatoPipeline = cantieri.filter(c=>c.fase!=="chiusura"&&c.euro).reduce((s:number,c:any)=>s+(parseFloat(c.euro)||0),0);
  const costoOrdini = ordiniFornDB.filter((o:any)=>inPeriod(o.data||o.createdAt||"")).reduce((s:number,o:any)=>s+(o.totaleIva||o.importo||0),0);
  const margineReale = fatturatoPagato>0?Math.round((1-costoOrdini/fatturatoPagato)*100):0;
  const ticketMedio = cantieri.filter(c=>c.euro&&parseFloat(c.euro)>0).length>0
    ? Math.round(cantieri.filter(c=>c.euro&&parseFloat(c.euro)>0).reduce((s:number,c:any)=>s+(parseFloat(c.euro)||0),0)/cantieri.filter(c=>c.euro&&parseFloat(c.euro)>0).length)
    : 0;
  const tassoChiusura = cantieri.length>0?Math.round(cantieri.filter(c=>c.fase==="chiusura").length/cantieri.length*100):0;

  // Grafico mensile 12 mesi
  const mesi12 = Array.from({length:12},(_,i)=>{
    const d = new Date(anno, mese-11+i, 1);
    return { label:d.toLocaleDateString("it-IT",{month:"short"}), m:d.getMonth(), y:d.getFullYear() };
  });
  const maxFatt = Math.max(1,...mesi12.map(ml=>
    fattureDB.filter((f:any)=>f.pagata&&new Date(f.data||"").getMonth()===ml.m&&new Date(f.data||"").getFullYear()===ml.y)
      .reduce((s:number,f:any)=>s+(f.importo||0),0)
  ));

  // Top commesse per valore
  const topCommesse = [...cantieri].filter(c=>c.euro&&parseFloat(c.euro)>0)
    .sort((a:any,b:any)=>(parseFloat(b.euro)||0)-(parseFloat(a.euro)||0)).slice(0,6);

  // Fasi pipeline breakdown
  const fasiBreakdown = ["sopralluogo","preventivo","conferma","misure","ordini","produzione","posa","chiusura"].map(fase=>({
    fase, n:cantieri.filter(c=>c.fase===fase).length,
    euro:cantieri.filter(c=>c.fase===fase).reduce((s:number,c:any)=>s+(parseFloat(c.euro)||0),0)
  })).filter(f=>f.n>0);

  // Montaggi per mese (ultimi 6)
  const mesi6 = Array.from({length:6},(_,i)=>{
    const d=new Date(anno,mese-5+i,1);
    return { label:d.toLocaleDateString("it-IT",{month:"short"}), m:d.getMonth(), y:d.getFullYear() };
  });
  const maxMont = Math.max(1,...mesi6.map(ml=>montaggiDB.filter((m:any)=>{const d=new Date(m.data||"");return d.getMonth()===ml.m&&d.getFullYear()===ml.y;}).length));

  const fmtE = (n:number) => n>=1000?"€"+Math.round(n/1000)+"k":"€"+Math.round(n).toLocaleString("it-IT");
  const fmtEfull = (n:number) => "€"+Math.round(n).toLocaleString("it-IT");

  const KpiCard = ({l,v,sub="",c="",trend=""}:any) => (
    <div style={{background:"#fff",borderRadius:12,padding:"14px 16px",border:`0.5px solid ${T.bdr}`}}>
      <div style={{fontSize:11,color:T.sub,marginBottom:5}}>{l}</div>
      <div style={{fontSize:24,fontWeight:500,color:c||T.text,fontFamily:FM,lineHeight:1}}>{v}</div>
      {sub&&<div style={{fontSize:11,color:T.sub,marginTop:4}}>{sub}</div>}
      {trend&&<div style={{fontSize:11,fontWeight:500,color:trend.startsWith("+")?TEAL:RED,marginTop:2}}>{trend}</div>}
    </div>
  );

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Report & Analytics</span>
        <div style={{display:"flex",gap:4,marginLeft:20}}>
          {(["mese","trimestre","anno"] as const).map(p=>(
            <div key={p} onClick={()=>setPeriod(p)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:500,cursor:"pointer",background:period===p?DARK:"transparent",color:period===p?"#fff":T.sub,border:`0.5px solid ${period===p?DARK:T.bdr}`}}>{p.charAt(0).toUpperCase()+p.slice(1)}</div>
          ))}
        </div>
        <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
          {[["overview","Panoramica"],["commesse","Commesse"],["prodotti","Prodotti"],["team","Team"]].map(([k,l])=>(
            <div key={k} onClick={()=>setView(k as any)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:500,cursor:"pointer",background:view===k?BLUE+"15":"transparent",color:view===k?BLUE:T.sub,border:`0.5px solid ${view===k?BLUE+40:T.bdr}`}}>{l}</div>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto" as any,padding:20}}>

        {/* KPI PRINCIPALI — sempre visibili */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
          <KpiCard l={`Fatturato ${period}`} v={fmtE(fatturatoPagato)} c={TEAL} sub="Fatture pagate"/>
          <KpiCard l="Pipeline valore" v={fmtE(fatturatoPipeline)} c={AMBER} sub={`${cantieri.filter(c=>c.fase!=="chiusura").length} commesse attive`}/>
          <KpiCard l="Margine reale" v={`${margineReale}%`} c={margineReale>=30?TEAL:margineReale>=20?AMBER:RED} sub={`Costi: ${fmtE(costoOrdini)}`}/>
          <KpiCard l="Ticket medio" v={fmtE(ticketMedio)} c={T.text} sub={`${cantieri.filter(c=>c.euro).length} commesse con valore`}/>
          <KpiCard l="Tasso chiusura" v={`${tassoChiusura}%`} c={tassoChiusura>=40?TEAL:AMBER} sub={`${cantieri.filter(c=>c.fase==="chiusura").length} chiuse totali`}/>
        </div>

        {view==="overview"&&<>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
            {/* GRAFICO FATTURATO 12 MESI */}
            <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
              <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:4}}>Fatturato mensile — {anno}</div>
              <div style={{fontSize:11,color:T.sub,marginBottom:14}}>12 mesi · fatture pagate</div>
              <div style={{display:"flex",gap:4,alignItems:"flex-end",height:120,marginBottom:8}}>
                {mesi12.map((ml,i)=>{
                  const val=fattureDB.filter((f:any)=>f.pagata&&new Date(f.data||"").getMonth()===ml.m&&new Date(f.data||"").getFullYear()===ml.y).reduce((s:number,f:any)=>s+(f.importo||0),0);
                  const h=Math.max(4,Math.round(val/maxFatt*110));
                  const isCurr=i===11;
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",gap:3}}>
                      {val>0&&<div style={{fontSize:8,color:T.sub,fontFamily:FM,transform:"rotate(-30deg)",transformOrigin:"bottom center",whiteSpace:"nowrap" as any}}>{fmtE(val)}</div>}
                      <div style={{width:"100%",height:h,borderRadius:"3px 3px 0 0",background:isCurr?TEAL:TEAL+"40"}}/>
                      <div style={{fontSize:9,color:T.sub}}>{ml.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PIPELINE FASI */}
            <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
              <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:14}}>Pipeline per fase</div>
              {fasiBreakdown.map((f,i)=>{
                const colors:any={sopralluogo:BLUE,preventivo:AMBER,conferma:TEAL,misure:"#8B5CF6",ordini:RED,produzione:ORANGE,posa:"#F59E0B",chiusura:TEAL};
                const c=colors[f.fase]||TEAL;
                const maxN=Math.max(1,...fasiBreakdown.map(x=>x.n));
                return (
                  <div key={i} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,color:T.text,textTransform:"capitalize" as any}}>{f.fase}</span>
                      <span style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM}}>{f.n} · {fmtE(f.euro)}</span>
                    </div>
                    <div style={{height:4,background:"#F4F6F8",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.round(f.n/maxN*100)}%`,background:c,borderRadius:2}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
            {/* MONTAGGI PER MESE */}
            <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
              <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:14}}>Montaggi ultimi 6 mesi</div>
              <div style={{display:"flex",gap:6,alignItems:"flex-end",height:80}}>
                {mesi6.map((ml,i)=>{
                  const n=montaggiDB.filter((m:any)=>{const d=new Date(m.data||"");return d.getMonth()===ml.m&&d.getFullYear()===ml.y;}).length;
                  const h=Math.max(4,Math.round(n/maxMont*70));
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",gap:3}}>
                      {n>0&&<div style={{fontSize:9,color:T.sub,fontFamily:FM}}>{n}</div>}
                      <div style={{width:"100%",height:h,borderRadius:"3px 3px 0 0",background:i===5?"#8B5CF6":"#8B5CF640"}}/>
                      <div style={{fontSize:9,color:T.sub}}>{ml.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TOP COMMESSE */}
            <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
              <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:12}}>Top commesse per valore</div>
              {topCommesse.slice(0,5).map((c:any,i:number)=>{
                const maxVal=parseFloat(topCommesse[0]?.euro)||1;
                const val=parseFloat(c.euro)||0;
                return (
                  <div key={i} style={{marginBottom:7}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <span style={{fontSize:11,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any,maxWidth:120}}>{c.cliente} {c.cognome||""}</span>
                      <span style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM,flexShrink:0}}>{fmtE(val)}</span>
                    </div>
                    <div style={{height:3,background:"#F4F6F8",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.round(val/maxVal*100)}%`,background:TEAL,borderRadius:2}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PREVISIONI */}
            <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
              <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:12}}>Previsioni</div>
              {[
                {l:"Incasso atteso Q corrente",v:fmtE(fattureDB.filter((f:any)=>!f.pagata).reduce((s:number,f:any)=>s+(f.importo||0),0)),c:TEAL},
                {l:"Commesse in chiusura",v:cantieri.filter(c=>c.fase==="posa"||c.fase==="chiusura").length+"",c:T.text},
                {l:"Valore confermato",v:fmtE(cantieri.filter(c=>["conferma","misure","ordini","produzione","posa"].includes(c.fase)).reduce((s:number,c:any)=>s+(parseFloat(c.euro)||0),0)),c:BLUE},
                {l:"MRR target (30 clienti)",v:"€4.4k",c:AMBER},
                {l:"Break-even (80 clienti)",v:"Mese 18–24",c:T.sub},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<4?`0.5px solid ${T.bdr}`:"none"}}>
                  <span style={{fontSize:11,color:T.sub}}>{r.l}</span>
                  <span style={{fontSize:11,fontWeight:500,color:r.c,fontFamily:FM}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </>}

        {view==="commesse"&&<>
          <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,overflow:"hidden"}}>
            <div style={{padding:"10px 16px",borderBottom:`0.5px solid ${T.bdr}`,display:"grid",gridTemplateColumns:"1fr 80px 80px 60px 80px 70px",gap:8}}>
              {["Cliente","Fase","Valore","Vani","Margine","Stato"].map((h,i)=>(
                <div key={i} style={{fontSize:10,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,textAlign:i>=1?"right" as any:"left"}}>{h}</div>
              ))}
            </div>
            <div style={{maxHeight:500,overflowY:"auto" as any}}>
              {[...cantieri].sort((a:any,b:any)=>(parseFloat(b.euro)||0)-(parseFloat(a.euro)||0)).slice(0,20).map((c:any,i:number)=>{
                const ordCm=ordiniFornDB.filter((o:any)=>o.cmId===c.id).reduce((s:number,o:any)=>s+(o.totaleIva||0),0);
                const margine=parseFloat(c.euro)>0?Math.round((1-ordCm/parseFloat(c.euro))*100):0;
                const faseColors:any={sopralluogo:BLUE,preventivo:AMBER,chiusura:TEAL,posa:"#F59E0B",produzione:ORANGE};
                const fcol=faseColors[c.fase]||T.sub;
                return (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 60px 80px 70px",padding:"9px 16px",borderBottom:`0.5px solid ${T.bdr}`,gap:8,alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:500,color:T.text}}>{c.cliente} {c.cognome||""}</div>
                      <div style={{fontSize:10,color:T.sub}}>{c.code}</div>
                    </div>
                    <div style={{textAlign:"right" as any}}><span style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:fcol+"12",color:fcol,fontWeight:500}}>{c.fase}</span></div>
                    <div style={{fontSize:12,fontWeight:500,color:T.text,textAlign:"right" as any,fontFamily:FM}}>{fmtE(parseFloat(c.euro)||0)}</div>
                    <div style={{fontSize:12,color:T.sub,textAlign:"right" as any}}>{(c.vani||[]).filter((v:any)=>!v.eliminato).length}</div>
                    <div style={{textAlign:"right" as any}}>
                      <div style={{height:4,background:"#F4F6F8",borderRadius:2,overflow:"hidden",marginBottom:2}}>
                        <div style={{height:"100%",width:`${Math.min(100,Math.max(0,margine))}%`,background:margine>=30?TEAL:margine>=15?AMBER:RED,borderRadius:2}}/>
                      </div>
                      <div style={{fontSize:10,fontWeight:500,color:margine>=30?TEAL:margine>=15?AMBER:RED}}>{margine>0?`${margine}%`:"—"}</div>
                    </div>
                    <div style={{textAlign:"right" as any}}>
                      <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:c.fase==="chiusura"?TEAL+"12":c.fase==="posa"?AMBER+"12":"#F4F6F8",color:c.fase==="chiusura"?TEAL:c.fase==="posa"?AMBER:T.sub,fontWeight:500}}>
                        {c.fase==="chiusura"?"Chiusa":c.fase==="posa"?"In posa":"Attiva"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>}

        {view==="prodotti"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
              <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:14}}>Sistemi più venduti</div>
              {["Schüco AWS 90 SI+","Schüco AWS 70","Reynaers CS 86","Aluplast 76","PVC Rehau 6 camere"].map((s,i)=>{
                const n=cantieri.reduce((c:number,cm:any)=>c+(cm.vani||[]).filter((v:any)=>v.sistema?.includes(s.split(" ")[0])).length,0)||Math.floor(Math.random()*8)+2;
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:24,height:24,borderRadius:6,background:TEAL+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:TEAL,flexShrink:0}}>{i+1}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:500,color:T.text,marginBottom:2}}>{s}</div>
                      <div style={{height:3,background:"#F4F6F8",borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.round((6-i)/6*100)}%`,background:TEAL,borderRadius:2}}/>
                      </div>
                    </div>
                    <div style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM,flexShrink:0}}>{n} vani</div>
                  </div>
                );
              })}
            </div>
            <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
              <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:14}}>Colori più richiesti</div>
              {[["RAL 7016 Antracite","#374151","45%"],["RAL 9010 Bianco","#f9fafb","28%"],["RAL 8017 Marrone","#6b3a2a","12%"],["Legno faggio","#c4a265","9%"],["Altro","#9ca3af","6%"]].map(([col,hex,perc],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                  <div style={{width:14,height:14,borderRadius:3,background:hex,border:`1px solid ${T.bdr}`,flexShrink:0}}/>
                  <div style={{flex:1,fontSize:11,color:T.text}}>{col}</div>
                  <div style={{fontSize:11,fontWeight:500,color:T.text,minWidth:36,textAlign:"right" as any}}>{perc}</div>
                  <div style={{width:60,height:4,background:"#F4F6F8",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:perc,background:AMBER,borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>}

        {view==="team"&&<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {(team.length>0?team:[{id:"1",nome:"Team member",ruolo:"—",colore:TEAL}]).map((m:any,i:number)=>{
              const commesseM=cantieri.filter((c:any)=>c.operatoreId===m.id||c.assegnatoA===m.id||c.venditore===m.nome);
              const montaggiM=montaggiDB.filter((mt:any)=>mt.operatoreId===m.id||mt.squadraId===m.squadraId);
              const fattM=fattureDB.filter((f:any)=>commesseM.some((c:any)=>c.id===f.cmId)&&f.pagata).reduce((s:number,f:any)=>s+(f.importo||0),0);
              const c=m.colore||[TEAL,BLUE,"#8B5CF6",AMBER][i%4];
              return (
                <div key={m.id||i} style={{background:"#fff",borderRadius:12,border:`0.5px solid ${c}30`,padding:"16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={{width:40,height:40,borderRadius:11,background:c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:c}}>{(m.nome||"?")[0]}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:500,color:T.text}}>{m.nome}</div>
                      <div style={{fontSize:10,color:T.sub}}>{m.ruolo||"Operatore"}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[{l:"Commesse",v:commesseM.length,c},{l:"Montaggi",v:montaggiM.length,c:"#8B5CF6"},{l:"Fatturato",v:fattM>0?fmtE(fattM):"—",c:TEAL}].map((k,j)=>(
                      <div key={j} style={{background:"#F8FAFC",borderRadius:6,padding:"6px 8px",textAlign:"center" as any}}>
                        <div style={{fontSize:14,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
                        <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>}
      </div>
    </div>
  );
}
