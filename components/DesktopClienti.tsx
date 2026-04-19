"use client";
// @ts-nocheck
// MASTRO — DesktopClienti.tsx
// CRM completo: anagrafica 360°, storico commesse, LTV, margini, messaggi, documenti

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", PURPLE="#8B5CF6";

export default function DesktopClienti() {
  const { T, cantieri=[], contatti=[], fattureDB=[], msgs=[], ordiniFornDB=[], montaggiDB=[], setSelectedCM, setTab, calcolaVanoPrezzo } = useMastro();
  const [search, setSearch] = useState("");
  const [selCliente, setSelCliente] = useState<any>(null);
  const [detTab, setDetTab] = useState<"overview"|"commesse"|"fatture"|"messaggi"|"docs">("overview");
  const [sortBy, setSortBy] = useState<"nome"|"ltv"|"ultima">("ultima");

  // Costruisce lista clienti da contatti + commesse
  const clienti = useMemo(() => {
    const base = contatti.length > 0 ? contatti.filter((c:any)=>c.tipo==="cliente"||!c.tipo) : [];
    // Clienti da commesse (se non ci sono contatti)
    const daCommesse = cantieri.reduce((acc:any[], c:any) => {
      const nome = `${c.cliente||""} ${c.cognome||""}`.trim();
      if(!nome) return acc;
      if(acc.find(x=>x.nome===nome)) return acc;
      acc.push({ id:`cm_${c.id}`, nome, tel:c.tel||"", email:c.email||"", indirizzo:c.indirizzo||"" });
      return acc;
    }, []);
    const lista = base.length > 0 ? base : daCommesse;
    return lista.map((cl:any) => {
      const nome = cl.nome||(cl.ragione||"");
      const commesseCliente = cantieri.filter((c:any)=>`${c.cliente||""} ${c.cognome||""}`.trim()===nome||(cl.id&&(c.clienteId===cl.id||c.contattoId===cl.id)));
      const fattureCliente = fattureDB.filter((f:any)=>commesseCliente.some((c:any)=>c.id===f.cmId));
      const ltv = fattureCliente.filter((f:any)=>f.pagata).reduce((s:number,f:any)=>s+(f.importo||0),0);
      const pipeline = commesseCliente.filter((c:any)=>c.fase!=="chiusura").reduce((s:number,c:any)=>s+(parseFloat(c.euro)||0),0);
      const ordiniCl = ordiniFornDB.filter((o:any)=>commesseCliente.some((c:any)=>c.id===o.cmId)).reduce((s:number,o:any)=>s+(o.totaleIva||0),0);
      const margine = ltv>0?Math.round((1-ordiniCl/ltv)*100):0;
      const ultima = commesseCliente.sort((a:any,b:any)=>(b.updatedAt||"").localeCompare(a.updatedAt||""))[0];
      const msgsCl = msgs.filter((m:any)=>m.clienteId===cl.id||commesseCliente.some((c:any)=>c.code===m.cm));
      return { ...cl, nome, commesse:commesseCliente, ltv, pipeline, margine, ultima, msgs:msgsCl, fatture:fattureCliente };
    });
  }, [contatti, cantieri, fattureDB, msgs, ordiniFornDB]);

  const filtered = useMemo(() => {
    let lista = search ? clienti.filter((c:any)=>c.nome.toLowerCase().includes(search.toLowerCase())||(c.tel||"").includes(search)||(c.email||"").includes(search)) : clienti;
    if(sortBy==="ltv") lista = [...lista].sort((a:any,b:any)=>b.ltv-a.ltv);
    else if(sortBy==="nome") lista = [...lista].sort((a:any,b:any)=>a.nome.localeCompare(b.nome));
    return lista;
  }, [clienti, search, sortBy]);

  const fmtE = (n:number) => n>0?"€"+Math.round(n).toLocaleString("it-IT"):"—";
  const initials = (nome:string) => nome.split(" ").slice(0,2).map((w:string)=>w[0]||"").join("").toUpperCase();
  const coloreCliente = (n:string) => [TEAL,BLUE,PURPLE,AMBER,"#F97316","#EC4899"][n.charCodeAt(0)%6];

  const totLtv = clienti.reduce((s:number,c:any)=>s+c.ltv,0);
  const totPipeline = clienti.reduce((s:number,c:any)=>s+c.pipeline,0);
  const clientiAttivi = clienti.filter((c:any)=>c.commesse.some((cm:any)=>cm.fase!=="chiusura")).length;

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Clienti</span>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[{l:"Clienti totali",v:clienti.length,c:T.text},{l:"Attivi",v:clientiAttivi,c:TEAL},{l:"LTV totale",v:fmtE(totLtv),c:TEAL},{l:"Pipeline",v:fmtE(totPipeline),c:AMBER}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:i>=2?13:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* LISTA CLIENTI */}
        <div style={{width:280,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px 8px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:"#F8FAFC",borderRadius:7,border:`0.5px solid ${T.bdr}`,marginBottom:8}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca cliente..." style={{border:"none",background:"transparent",fontSize:12,color:T.text,outline:"none",width:"100%",fontFamily:FF}}/>
            </div>
            <div style={{display:"flex",gap:4}}>
              {[["ultima","Recenti"],["ltv","Per LTV"],["nome","A-Z"]].map(([k,l])=>(
                <div key={k} onClick={()=>setSortBy(k as any)} style={{padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",background:sortBy===k?DARK:"transparent",color:sortBy===k?"#fff":T.sub,border:`0.5px solid ${sortBy===k?DARK:T.bdr}`}}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            {filtered.length===0&&<div style={{padding:20,textAlign:"center" as any,fontSize:12,color:T.sub}}>Nessun cliente trovato</div>}
            {filtered.map((cl:any)=>{
              const col=coloreCliente(cl.nome);
              const attivo=cl.commesse.some((c:any)=>c.fase!=="chiusura");
              return (
                <div key={cl.id} onClick={()=>{setSelCliente(cl);setDetTab("overview");}}
                  style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",display:"flex",gap:8,alignItems:"flex-start",background:selCliente?.id===cl.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selCliente?.id===cl.id?TEAL:"transparent"}`}}>
                  <div style={{width:34,height:34,borderRadius:9,background:col+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:col,flexShrink:0,position:"relative"}}>
                    {initials(cl.nome)}
                    {attivo&&<div style={{position:"absolute",bottom:-1,right:-1,width:8,height:8,borderRadius:"50%",background:TEAL,border:`1.5px solid #fff`}}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{cl.nome}</div>
                    <div style={{fontSize:10,color:T.sub,marginTop:1}}>{cl.commesse.length} commesse · {fmtE(cl.ltv)} LTV</div>
                    {cl.margine>0&&<div style={{fontSize:10,color:cl.margine>=30?TEAL:cl.margine>=15?AMBER:RED,fontWeight:500}}>Margine {cl.margine}%</div>}
                  </div>
                  {cl.msgs.filter((m:any)=>!m.letto).length>0&&<div style={{width:16,height:16,borderRadius:"50%",background:BLUE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>{cl.msgs.filter((m:any)=>!m.letto).length}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* DETTAGLIO CLIENTE */}
        <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",background:"#fff",borderRight:`0.5px solid ${T.bdr}`}}>
          {!selCliente?(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" as any,gap:10,color:T.sub}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span style={{fontSize:13}}>Seleziona un cliente</span>
            </div>
          ):(
            <>
              {/* Header cliente */}
              <div style={{padding:"14px 16px 0",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                  <div style={{width:48,height:48,borderRadius:12,background:coloreCliente(selCliente.nome)+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:coloreCliente(selCliente.nome),flexShrink:0}}>{initials(selCliente.nome)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:17,fontWeight:500,color:T.text}}>{selCliente.nome}</div>
                    <div style={{fontSize:11,color:T.sub,marginTop:2}}>{selCliente.tel||"—"} · {selCliente.email||"—"}</div>
                    <div style={{fontSize:11,color:T.sub}}>{selCliente.indirizzo||"—"}</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button style={{padding:"5px 10px",borderRadius:6,background:TEAL,color:"#fff",border:"none",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Nuova commessa</button>
                    <button style={{padding:"5px 10px",borderRadius:6,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:11,cursor:"pointer",fontFamily:FF}}>Messaggio</button>
                  </div>
                </div>
                {/* KPI cliente */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:8}}>
                  {[
                    {l:"Commesse",v:selCliente.commesse.length,c:T.text},
                    {l:"LTV pagato",v:fmtE(selCliente.ltv),c:TEAL},
                    {l:"Pipeline",v:fmtE(selCliente.pipeline),c:AMBER},
                    {l:"Margine",v:selCliente.margine>0?`${selCliente.margine}%`:"—",c:selCliente.margine>=30?TEAL:selCliente.margine>=15?AMBER:RED},
                    {l:"Messaggi",v:selCliente.msgs.length,c:BLUE},
                  ].map((k,i)=>(
                    <div key={i} style={{background:"#F8FAFC",borderRadius:6,padding:"5px 8px"}}>
                      <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
                      <div style={{fontSize:13,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:0}}>
                  {([["overview","Panoramica"],["commesse",`Commesse ${selCliente.commesse.length}`],["fatture",`Fatture ${selCliente.fatture.length}`],["messaggi",`Msg ${selCliente.msgs.length}`]] as [string,string][]).map(([id,l])=>(
                    <div key={id} onClick={()=>setDetTab(id as any)} style={{padding:"6px 12px",fontSize:11,fontWeight:500,color:detTab===id?TEAL:T.sub,borderBottom:`2px solid ${detTab===id?TEAL:"transparent"}`,cursor:"pointer",whiteSpace:"nowrap" as any}}>{l}</div>
                  ))}
                </div>
              </div>

              <div style={{flex:1,overflowY:"auto" as any,padding:"12px 16px"}}>
                {/* OVERVIEW */}
                {detTab==="overview"&&<>
                  {/* Barra LTV */}
                  {selCliente.ltv>0&&<div style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:11,color:T.sub}}>Fatturato vs Pipeline</span>
                      <span style={{fontSize:11,fontWeight:500,color:T.text}}>{fmtE(selCliente.ltv+selCliente.pipeline)}</span>
                    </div>
                    <div style={{height:6,background:"#F4F6F8",borderRadius:3,overflow:"hidden",display:"flex"}}>
                      <div style={{width:`${Math.round(selCliente.ltv/(selCliente.ltv+selCliente.pipeline+1)*100)}%`,background:TEAL,borderRadius:3}}/>
                      <div style={{flex:1,background:AMBER+"60"}}/>
                    </div>
                    <div style={{display:"flex",gap:12,marginTop:4}}>
                      <span style={{fontSize:9,color:TEAL}}>Pagato {fmtE(selCliente.ltv)}</span>
                      <span style={{fontSize:9,color:AMBER}}>Pipeline {fmtE(selCliente.pipeline)}</span>
                    </div>
                  </div>}
                  {/* Ultima commessa */}
                  {selCliente.ultima&&<div style={{background:"#F8FAFC",borderRadius:10,padding:"12px",marginBottom:10,cursor:"pointer"}} onClick={()=>{setSelectedCM(selCliente.ultima);setTab("commesse");}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6}}>Ultima commessa</div>
                    <div style={{fontSize:13,fontWeight:500,color:T.text}}>{selCliente.ultima.code} · {selCliente.ultima.fase}</div>
                    <div style={{fontSize:11,color:T.sub,marginTop:2}}>{selCliente.ultima.indirizzo||"—"} · {fmtE(parseFloat(selCliente.ultima.euro)||0)}</div>
                  </div>}
                  {/* Info contatto */}
                  <div style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,overflow:"hidden"}}>
                    {[
                      {l:"Telefono",v:selCliente.tel||"—"},
                      {l:"Email",v:selCliente.email||"—"},
                      {l:"Indirizzo",v:selCliente.indirizzo||"—"},
                      {l:"P.IVA / CF",v:selCliente.piva||selCliente.cf||"—"},
                      {l:"Note",v:selCliente.note||"—"},
                    ].map((r,i)=>(
                      <div key={i} style={{display:"flex",padding:"8px 12px",borderBottom:i<4?`0.5px solid ${T.bdr}`:"none",gap:12}}>
                        <span style={{fontSize:11,color:T.sub,minWidth:80,flexShrink:0}}>{r.l}</span>
                        <span style={{fontSize:11,color:T.text,fontWeight:r.v!=="—"?500:400}}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </>}

                {/* COMMESSE */}
                {detTab==="commesse"&&<>
                  {selCliente.commesse.length===0&&<div style={{textAlign:"center" as any,padding:20,fontSize:12,color:T.sub}}>Nessuna commessa</div>}
                  {selCliente.commesse.map((c:any,i:number)=>(
                    <div key={i} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,padding:"10px 12px",marginBottom:6,cursor:"pointer",display:"flex",gap:10,alignItems:"center"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:12,fontWeight:500,color:T.text}}>{c.code}</span>
                          <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:TEAL+"12",color:TEAL,fontWeight:500}}>{c.fase}</span>
                        </div>
                        <div style={{fontSize:11,color:T.sub,marginTop:2}}>{c.indirizzo||"—"} · {(c.vani||[]).filter((v:any)=>!v.eliminato).length} vani</div>
                      </div>
                      <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:FM}}>{fmtE(parseFloat(c.euro)||0)}</div>
                    </div>
                  ))}
                </>}

                {/* FATTURE */}
                {detTab==="fatture"&&<>
                  {selCliente.fatture.length===0&&<div style={{textAlign:"center" as any,padding:20,fontSize:12,color:T.sub}}>Nessuna fattura</div>}
                  {selCliente.fatture.map((f:any,i:number)=>(
                    <div key={i} style={{background:"#fff",borderRadius:10,border:`0.5px solid ${f.pagata?T.bdr:RED+"30"}`,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:500,color:T.text}}>{f.numero||`Fattura ${i+1}`} · {f.tipo||"fattura"}</div>
                        <div style={{fontSize:10,color:T.sub}}>{f.data||"—"}{f.scadenza?` · Scad. ${f.scadenza}`:""}</div>
                      </div>
                      <div style={{textAlign:"right" as any}}>
                        <div style={{fontSize:13,fontWeight:500,color:T.text,fontFamily:FM}}>{fmtE(f.importo||0)}</div>
                        <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:f.pagata?TEAL+"12":RED+"12",color:f.pagata?TEAL:RED,fontWeight:500}}>{f.pagata?"Pagata":"Da pagare"}</span>
                      </div>
                    </div>
                  ))}
                </>}

                {/* MESSAGGI */}
                {detTab==="messaggi"&&<>
                  {selCliente.msgs.length===0&&<div style={{textAlign:"center" as any,padding:20,fontSize:12,color:T.sub}}>Nessun messaggio</div>}
                  {selCliente.msgs.slice(-15).reverse().map((m:any,i:number)=>(
                    <div key={i} style={{padding:"8px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,marginBottom:5,background:"#fff"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,fontWeight:500,color:T.text}}>{m.from||m.mittente||"Cliente"}</span>
                        <span style={{fontSize:10,color:T.sub}}>{m.ora||m.data||"—"}</span>
                      </div>
                      <div style={{fontSize:11,color:T.sub}}>{m.testo||m.text||"—"}</div>
                    </div>
                  ))}
                </>}
              </div>
            </>
          )}
        </div>

        {/* PANNELLO DX — top clienti */}
        <div style={{width:260,flexShrink:0,background:"#F8FAFC",display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,flexShrink:0}}>Top clienti per LTV</div>
          <div style={{flex:1,overflowY:"auto" as any,padding:"10px 14px"}}>
            {[...clienti].sort((a:any,b:any)=>b.ltv-a.ltv).slice(0,8).map((cl:any,i:number)=>{
              const col=coloreCliente(cl.nome);
              const maxLtv=clienti[0]?.ltv||1;
              return (
                <div key={i} onClick={()=>{setSelCliente(cl);setDetTab("overview");}} style={{marginBottom:8,cursor:"pointer",padding:"8px 10px",borderRadius:8,background:selCliente?.id===cl.id?"rgba(26,158,115,0.06)":"#fff",border:`0.5px solid ${selCliente?.id===cl.id?TEAL:T.bdr}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                    <div style={{width:8,height:8,borderRadius:2,background:col,flexShrink:0}}/>
                    <span style={{fontSize:11,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any,flex:1}}>{cl.nome}</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM,flexShrink:0}}>{fmtE(cl.ltv)}</span>
                  </div>
                  <div style={{height:3,background:"#F4F6F8",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.round((cl.ltv||0)/Math.max(maxLtv,1)*100)}%`,background:col,borderRadius:2}}/>
                  </div>
                  <div style={{fontSize:9,color:T.sub,marginTop:3}}>{cl.commesse.length} commesse · margine {cl.margine}%</div>
                </div>
              );
            })}
            {/* Statistiche */}
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"14px 0 8px"}}>Statistiche</div>
            {[
              {l:"LTV medio",v:fmtE(clienti.length>0?Math.round(totLtv/clienti.length):0)},
              {l:"Clienti con pipeline",v:clienti.filter((c:any)=>c.pipeline>0).length+""},
              {l:"Margine medio",v:Math.round(clienti.filter((c:any)=>c.margine>0).reduce((s:number,c:any)=>s+c.margine,0)/Math.max(1,clienti.filter((c:any)=>c.margine>0).length))+"%"},
            ].map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderRadius:7,background:"#fff",border:`0.5px solid ${T.bdr}`,marginBottom:5}}>
                <span style={{fontSize:11,color:T.sub}}>{r.l}</span>
                <span style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM}}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
