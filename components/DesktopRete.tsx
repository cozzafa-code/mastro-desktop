"use client";
// @ts-nocheck
// MASTRO — DesktopRete.tsx
// RETE Agenti: gestione agenti di vendita, zone, provvigioni, performance

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", PURPLE="#8B5CF6";

const AGENTI_DEMO = [
  { id:"a1", nome:"Carlo Vito",     zona:"Cosenza + Rende",     tel:"339 1111111", email:"c.vito@email.it",   attivo:true,  piano:"rete_base",  preventivi:12, convertiti:8, provvigione:8, fatturato:42000 },
  { id:"a2", nome:"Marco Esposito", zona:"Catanzaro + Lamezia", tel:"347 2222222", email:"m.esp@email.it",    attivo:true,  piano:"rete_pro",   preventivi:9,  convertiti:5, provvigione:10, fatturato:28000 },
  { id:"a3", nome:"Luigi Perri",    zona:"Reggio Calabria",     tel:"333 3333333", email:"l.perri@email.it",  attivo:false, piano:"rete_base",  preventivi:4,  convertiti:1, provvigione:8, fatturato:5500 },
  { id:"a4", nome:"Anna Greco",     zona:"Crotone + Cirò",      tel:"320 4444444", email:"a.greco@email.it",  attivo:true,  piano:"rete_pro",   preventivi:7,  convertiti:4, provvigione:10, fatturato:19000 },
];

const PREVENTIVI_RETE_DEMO = [
  { id:"R001", agente:"a1", cliente:"Fam. Russo",   comune:"Rende",    importo:4200, stato:"confermato", data:"5 Feb" },
  { id:"R002", agente:"a1", cliente:"Luigi Cimino", comune:"Cosenza",  importo:8800, stato:"in_attesa",  data:"8 Feb" },
  { id:"R003", agente:"a2", cliente:"Anna Ferraro", comune:"Catanzaro",importo:3100, stato:"confermato", data:"3 Feb" },
  { id:"R004", agente:"a4", cliente:"Fam. Mauro",   comune:"Crotone",  importo:6500, stato:"in_attesa",  data:"12 Feb" },
  { id:"R005", agente:"a1", cliente:"B. Esposito",  comune:"Rende",    importo:2900, stato:"perso",      data:"1 Feb" },
];

export default function DesktopRete() {
  const { T, aziendaInfo } = useMastro();
  const [selAgente, setSelAgente] = useState<any>(null);
  const [agentTab, setAgentTab] = useState<"overview"|"preventivi"|"provvigioni">("overview");

  const totFatturato = AGENTI_DEMO.reduce((s,a)=>s+a.fatturato,0);
  const totProvvigioni = AGENTI_DEMO.reduce((s,a)=>s+Math.round(a.fatturato*a.provvigione/100),0);
  const totPreventivi = AGENTI_DEMO.reduce((s,a)=>s+a.preventivi,0);
  const tassoMedio = Math.round(AGENTI_DEMO.reduce((s,a)=>s+(a.convertiti/Math.max(a.preventivi,1)),0)/AGENTI_DEMO.length*100);

  const fmtE=(n:number)=>"€"+Math.round(n).toLocaleString("it-IT");

  const prevAgente = selAgente ? PREVENTIVI_RETE_DEMO.filter(p=>p.agente===selAgente.id) : [];
  const provvAgente = selAgente ? Math.round(selAgente.fatturato * selAgente.provvigione/100) : 0;

  const statoColor=(s:string)=>({confermato:TEAL,in_attesa:AMBER,perso:RED}[s]||T.sub);

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>RETE Agenti</span>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[{l:"Agenti attivi",v:AGENTI_DEMO.filter(a=>a.attivo).length,c:TEAL},{l:"Preventivi",v:totPreventivi,c:T.text},{l:"Fatturato rete",v:fmtE(totFatturato),c:TEAL},{l:"Provvigioni maturate",v:fmtE(totProvvigioni),c:AMBER},{l:"Tasso conv.",v:`${tassoMedio}%`,c:tassoMedio>=50?TEAL:AMBER}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:i>=2?12:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
          <button style={{padding:"7px 14px",borderRadius:7,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>+ Invita agente</button>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* LISTA AGENTI */}
        <div style={{width:280,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,fontSize:11,fontWeight:500,color:T.sub,flexShrink:0}}>{AGENTI_DEMO.length} agenti nella rete</div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            {AGENTI_DEMO.map(a=>{
              const tasso=Math.round(a.convertiti/Math.max(a.preventivi,1)*100);
              const col=[TEAL,BLUE,PURPLE,AMBER][AGENTI_DEMO.indexOf(a)%4];
              return (
                <div key={a.id} onClick={()=>{setSelAgente(selAgente?.id===a.id?null:a);setAgentTab("overview");}}
                  style={{padding:"12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",background:selAgente?.id===a.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selAgente?.id===a.id?TEAL:"transparent"}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:34,height:34,borderRadius:9,background:col+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:col,flexShrink:0,position:"relative"}}>
                      {a.nome.split(" ").map(w=>w[0]).join("")}
                      {!a.attivo&&<div style={{position:"absolute",bottom:-1,right:-1,width:8,height:8,borderRadius:"50%",background:RED,border:"1.5px solid #fff"}}/>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,color:T.text}}>{a.nome}</div>
                      <div style={{fontSize:10,color:T.sub}}>{a.zona}</div>
                    </div>
                    {a.attivo&&<div style={{width:6,height:6,borderRadius:"50%",background:TEAL,flexShrink:0}}/>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
                    {[{l:"Prev.",v:a.preventivi},{l:"Conv.",v:a.convertiti},{l:"Tasso",v:`${tasso}%`}].map((k,i)=>(
                      <div key={i} style={{background:"#F8FAFC",borderRadius:5,padding:"4px 6px",textAlign:"center" as any}}>
                        <div style={{fontSize:12,fontWeight:500,color:i===2&&tasso>=50?TEAL:T.text,fontFamily:FM}}>{k.v}</div>
                        <div style={{fontSize:8,color:T.sub}}>{k.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETTAGLIO AGENTE */}
        <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",background:"#fff"}}>
          {!selAgente?(
            <div style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",gap:14,padding:40,textAlign:"center" as any}}>
              <div style={{width:64,height:64,borderRadius:18,background:PURPLE+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <div style={{fontSize:16,fontWeight:500,color:T.text}}>MASTRO RETE</div>
              <div style={{fontSize:13,color:T.sub,maxWidth:380,lineHeight:1.7}}>Gestisci la tua rete di agenti commerciali. Ogni agente vede solo i suoi preventivi, clienti e provvigioni. Tu vedi tutto.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",maxWidth:400}}>
                {[["App dedicata agente","Deploy separato Vercel"],["Zone assegnate","Clienti solo della sua zona"],["Provvigioni auto","Calcolate da ogni commessa"],["Performance","Ranking e obiettivi mensili"]].map(([t,s],i)=>(
                  <div key={i} style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",border:`0.5px solid ${T.bdr}`}}>
                    <div style={{fontSize:11,fontWeight:500,color:T.text}}>{t}</div>
                    <div style={{fontSize:10,color:T.sub,marginTop:2}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <>
              <div style={{padding:"12px 16px 0",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:500,color:T.text}}>{selAgente.nome}</div>
                    <div style={{fontSize:11,color:T.sub,marginTop:2}}>{selAgente.zona} · {selAgente.tel} · {selAgente.email}</div>
                    <div style={{display:"flex",gap:6,marginTop:5}}>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:selAgente.attivo?TEAL+"12":RED+"12",color:selAgente.attivo?TEAL:RED,fontWeight:500}}>{selAgente.attivo?"Attivo":"Inattivo"}</span>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:BLUE+"12",color:BLUE,fontWeight:500}}>Provv. {selAgente.provvigione}%</span>
                    </div>
                  </div>
                  <button style={{padding:"6px 12px",borderRadius:7,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:11,cursor:"pointer",fontFamily:FF}}>Invia invito app</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>
                  {[{l:"Preventivi",v:selAgente.preventivi,c:T.text},{l:"Convertiti",v:selAgente.convertiti,c:TEAL},{l:"Fatturato",v:fmtE(selAgente.fatturato),c:T.text},{l:"Provvigioni",v:fmtE(provvAgente),c:AMBER}].map((k,i)=>(
                    <div key={i} style={{background:"#F8FAFC",borderRadius:6,padding:"6px 8px"}}>
                      <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
                      <div style={{fontSize:13,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:0}}>
                  {[["overview","Panoramica"],["preventivi","Preventivi"],["provvigioni","Provvigioni"]].map(([id,l])=>(
                    <div key={id} onClick={()=>setAgentTab(id as any)} style={{padding:"6px 14px",fontSize:11,fontWeight:500,color:agentTab===id?PURPLE:T.sub,borderBottom:`2px solid ${agentTab===id?PURPLE:"transparent"}`,cursor:"pointer"}}>{l}</div>
                  ))}
                </div>
              </div>

              <div style={{flex:1,overflowY:"auto" as any,padding:14}}>
                {agentTab==="overview"&&<>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:T.sub,marginBottom:4}}>Tasso di conversione</div>
                    <div style={{height:8,background:"#F4F6F8",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.round(selAgente.convertiti/Math.max(selAgente.preventivi,1)*100)}%`,background:TEAL,borderRadius:4}}/>
                    </div>
                    <div style={{fontSize:11,color:TEAL,marginTop:3}}>{Math.round(selAgente.convertiti/Math.max(selAgente.preventivi,1)*100)}% ({selAgente.convertiti}/{selAgente.preventivi})</div>
                  </div>
                  <div style={{background:"#F8FAFC",borderRadius:10,padding:"12px",border:`0.5px solid ${T.bdr}`}}>
                    <div style={{fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Info agente</div>
                    {[{l:"Piano",v:selAgente.piano==="rete_pro"?"RETE Pro (+€10/mese)":"RETE Base"},{l:"Provvigione",v:`${selAgente.provvigione}% su confermato`},{l:"Zona assegnata",v:selAgente.zona},{l:"Telefono",v:selAgente.tel},{l:"Email",v:selAgente.email}].map((r,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<4?`0.5px solid ${T.bdr}`:"none"}}>
                        <span style={{fontSize:11,color:T.sub}}>{r.l}</span>
                        <span style={{fontSize:11,fontWeight:500,color:T.text}}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </>}

                {agentTab==="preventivi"&&<>
                  {prevAgente.length===0&&<div style={{textAlign:"center" as any,padding:20,fontSize:12,color:T.sub}}>Nessun preventivo</div>}
                  {prevAgente.map((p,i)=>(
                    <div key={i} style={{background:"#fff",borderRadius:9,border:`0.5px solid ${T.bdr}`,padding:"10px 12px",marginBottom:6,display:"flex",gap:10,alignItems:"center"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:500,color:T.text}}>{p.cliente} · {p.comune}</div>
                        <div style={{fontSize:10,color:T.sub}}>{p.id} · {p.data}</div>
                      </div>
                      <div style={{textAlign:"right" as any}}>
                        <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:FM}}>{fmtE(p.importo)}</div>
                        <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:statoColor(p.stato)+"12",color:statoColor(p.stato),fontWeight:500}}>{p.stato.replace("_"," ")}</span>
                      </div>
                    </div>
                  ))}
                </>}

                {agentTab==="provvigioni"&&<>
                  <div style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,padding:"14px",marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:10}}>Riepilogo provvigioni</div>
                    {[{l:"Fatturato confermato",v:fmtE(selAgente.fatturato)},{l:"% provvigione",v:`${selAgente.provvigione}%`},{l:"Provvigioni maturate",v:fmtE(provvAgente)},{l:"Già pagate",v:"€0"},{l:"Da pagare",v:fmtE(provvAgente)}].map((r,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<4?`0.5px solid ${T.bdr}`:"none"}}>
                        <span style={{fontSize:11,color:T.sub}}>{r.l}</span>
                        <span style={{fontSize:12,fontWeight:i===4?700:500,color:i===4?AMBER:T.text,fontFamily:FM}}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <button style={{width:"100%",padding:"10px",borderRadius:8,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Segna provvigioni come pagate</button>
                </>}
              </div>
            </>
          )}
        </div>

        {/* PANNELLO DX — ranking */}
        <div style={{width:240,flexShrink:0,background:"#F8FAFC",borderLeft:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,flexShrink:0}}>Ranking agenti</div>
          <div style={{flex:1,overflowY:"auto" as any,padding:"10px 14px"}}>
            {[...AGENTI_DEMO].sort((a,b)=>b.fatturato-a.fatturato).map((a,i)=>{
              const medals=["🥇","🥈","🥉","4️⃣"];
              const col=[TEAL,BLUE,PURPLE,AMBER][i];
              return (
                <div key={a.id} onClick={()=>{setSelAgente(a);setAgentTab("overview");}} style={{padding:"8px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,marginBottom:6,cursor:"pointer",background:selAgente?.id===a.id?"rgba(26,158,115,0.06)":"#fff"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:16}}>{medals[i]}</span>
                    <span style={{fontSize:12,fontWeight:500,color:T.text,flex:1}}>{a.nome}</span>
                  </div>
                  <div style={{height:3,background:"#F4F6F8",borderRadius:2,overflow:"hidden",marginBottom:3}}>
                    <div style={{height:"100%",width:`${Math.round(a.fatturato/AGENTI_DEMO[0].fatturato*100)}%`,background:col,borderRadius:2}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:10,color:T.sub}}>{Math.round(a.convertiti/Math.max(a.preventivi,1)*100)}% conv.</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM}}>{fmtE(a.fatturato)}</span>
                  </div>
                </div>
              );
            })}
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"14px 0 8px"}}>Totale rete</div>
            {[{l:"Fatturato generato",v:fmtE(totFatturato)},{l:"Provvigioni maturate",v:fmtE(totProvvigioni)},{l:"Preventivi fatti",v:totPreventivi+""}].map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",borderRadius:6,marginBottom:4,background:"#fff",border:`0.5px solid ${T.bdr}`}}>
                <span style={{fontSize:10,color:T.sub}}>{r.l}</span>
                <span style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM}}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
