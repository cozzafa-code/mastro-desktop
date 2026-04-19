"use client";
// @ts-nocheck
// MASTRO — DesktopPortaleB2C.tsx
// Gestione portali cliente attivi: link, stato, accessi, documenti condivisi

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0";

export default function DesktopPortaleB2C() {
  const { T, cantieri=[], fattureDB=[], msgs=[], aziendaInfo } = useMastro();
  const [search, setSearch] = useState("");
  const [selPortale, setSelPortale] = useState<any>(null);

  // Portali attivi = commesse con stato avanzato
  const portali = useMemo(()=>cantieri.filter(c=>["conferma","misure","ordini","produzione","posa","chiusura"].includes(c.fase)).map(c=>{
    const fattureCm=fattureDB.filter((f:any)=>f.cmId===c.id);
    const msgsCm=msgs.filter((m:any)=>m.cm===c.code);
    const vani=(c.vani||[]).filter((v:any)=>!v.eliminato);
    const progress={sopralluogo:12,preventivo:25,conferma:38,misure:50,ordini:62,produzione:75,posa:88,chiusura:100}[c.fase]||0;
    const token=c.id?.substring(0,8)||Math.random().toString(36).substring(2,10);
    const link=`${typeof window!=="undefined"?window.location.origin:""}/portale/${token}`;
    return { ...c, vani, fattureCm, msgsCm, progress, token, link, ultimoAccesso:c.portalAccesso||null };
  }),[cantieri,fattureDB,msgs]);

  const filtered=useMemo(()=>portali.filter(p=>!search||`${p.cliente} ${p.cognome||""} ${p.code}`.toLowerCase().includes(search.toLowerCase())),[portali,search]);

  const totAttivi=portali.length;
  const totMsgNonLetti=portali.reduce((s,p)=>s+p.msgsCm.filter((m:any)=>!m.letto).length,0);
  const totDocFirmati=0;

  const fmtE=(n:number)=>n>0?"€"+Math.round(n).toLocaleString("it-IT"):"—";
  const copyLink=(link:string)=>{if(typeof navigator!=="undefined"&&navigator.clipboard)navigator.clipboard.writeText(link);};

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Portale Cliente</span>
        <div style={{padding:"2px 10px",borderRadius:100,background:TEAL+"12",fontSize:11,fontWeight:500,color:TEAL}}>B2C · Link condivisibile</div>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[{l:"Portali attivi",v:totAttivi,c:TEAL},{l:"Msg non letti",v:totMsgNonLetti,c:totMsgNonLetti>0?BLUE:TEAL},{l:"Documenti",v:totDocFirmati,c:T.text}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* LISTA PORTALI */}
        <div style={{width:300,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px 8px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:"#F8FAFC",borderRadius:7,border:`0.5px solid ${T.bdr}`}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca cliente..." style={{border:"none",background:"transparent",fontSize:12,color:T.text,outline:"none",width:"100%",fontFamily:FF}}/>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            {filtered.length===0&&<div style={{padding:20,textAlign:"center" as any,fontSize:12,color:T.sub}}>Nessun portale attivo</div>}
            {filtered.map((p:any)=>{
              const nonLetti=p.msgsCm.filter((m:any)=>!m.letto).length;
              return (
                <div key={p.id} onClick={()=>setSelPortale(selPortale?.id===p.id?null:p)}
                  style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",background:selPortale?.id===p.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selPortale?.id===p.id?TEAL:"transparent"}`}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                    <div style={{width:32,height:32,borderRadius:8,background:TEAL+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:TEAL,flexShrink:0}}>
                      {(p.cliente||"?")[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{p.cliente} {p.cognome||""}</span>
                        {nonLetti>0&&<div style={{width:16,height:16,borderRadius:8,background:BLUE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>{nonLetti}</div>}
                      </div>
                      <div style={{fontSize:10,color:T.sub}}>{p.code} · {p.fase}</div>
                      {/* Progress bar */}
                      <div style={{height:3,background:"#F4F6F8",borderRadius:2,marginTop:5,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${p.progress}%`,background:TEAL,borderRadius:2}}/>
                      </div>
                      <div style={{fontSize:9,color:T.sub,marginTop:2}}>{p.progress}% completato</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETTAGLIO PORTALE */}
        <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",background:"#fff"}}>
          {!selPortale?(
            <div style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",gap:14,padding:40,textAlign:"center" as any}}>
              <div style={{width:64,height:64,borderRadius:18,background:TEAL+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </div>
              <div style={{fontSize:16,fontWeight:500,color:T.text}}>Portale Cliente B2C</div>
              <div style={{fontSize:13,color:T.sub,maxWidth:420,lineHeight:1.7}}>Ogni cliente riceve un link personale per seguire il suo lavoro in tempo reale: stato, documenti, pagamenti, chat diretta con voi. Disponibile su smartphone senza app da installare.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",maxWidth:440}}>
                {[["Stato lavoro live","Timeline con fasi aggiornate"],["Documenti digitali","Preventivo, fatture, CE, ENEA"],["Chat diretta","Messaggi senza WhatsApp"],["Pagamenti","Rate e saldo chiari"],["Firma digitale","Preventivo firmabile da smartphone"],["Zero app","Funziona dal browser"]].map(([t,s],i)=>(
                  <div key={i} style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",border:`0.5px solid ${T.bdr}`}}>
                    <div style={{fontSize:11,fontWeight:500,color:T.text}}>{t}</div>
                    <div style={{fontSize:10,color:T.sub,marginTop:2}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <div style={{fontSize:17,fontWeight:500,color:T.text}}>{selPortale.cliente} {selPortale.cognome||""}</div>
                  <div style={{fontSize:11,color:T.sub,marginTop:2}}>{selPortale.code} · {selPortale.indirizzo||"—"}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>copyLink(selPortale.link)} style={{padding:"6px 12px",borderRadius:7,background:BLUE,color:"#fff",border:"none",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Copia link</button>
                  <button style={{padding:"6px 12px",borderRadius:7,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:11,cursor:"pointer",fontFamily:FF}}>WhatsApp →</button>
                </div>
              </div>

              {/* Link portale */}
              <div style={{background:"#F8FAFC",borderRadius:10,padding:"12px 14px",marginBottom:14,border:`0.5px solid ${TEAL}30`,display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:2}}>Link portale cliente</div>
                  <div style={{fontSize:12,color:BLUE,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{selPortale.link||"mastro-erp.vercel.app/portale/"+selPortale.token}</div>
                </div>
                <button onClick={()=>copyLink(selPortale.link)} style={{padding:"6px 10px",borderRadius:6,background:TEAL,color:"#fff",border:"none",fontSize:11,cursor:"pointer",fontFamily:FF,flexShrink:0}}>Copia</button>
              </div>

              {/* Stato commessa */}
              <div style={{background:"#F8FAFC",borderRadius:10,padding:"12px 14px",marginBottom:14,border:`0.5px solid ${T.bdr}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5}}>Stato commessa</span>
                  <span style={{fontSize:11,fontWeight:500,color:TEAL}}>{selPortale.progress}%</span>
                </div>
                <div style={{height:6,background:"#E5E3DC",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${selPortale.progress}%`,background:TEAL,borderRadius:3}}/>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,textTransform:"capitalize" as any}}>Fase: {selPortale.fase}</div>
              </div>

              {/* Stats portale */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                {[
                  {l:"Vani",v:selPortale.vani.length,c:T.text},
                  {l:"Fatture",v:selPortale.fattureCm.length,c:T.text},
                  {l:"Messaggi",v:selPortale.msgsCm.length,c:BLUE},
                  {l:"Non letti",v:selPortale.msgsCm.filter((m:any)=>!m.letto).length,c:selPortale.msgsCm.filter((m:any)=>!m.letto).length>0?BLUE:TEAL},
                ].map((k,i)=>(
                  <div key={i} style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",border:`0.5px solid ${T.bdr}`}}>
                    <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
                    <div style={{fontSize:18,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
                  </div>
                ))}
              </div>

              {/* Fatture visibili nel portale */}
              {selPortale.fattureCm.length>0&&<>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Fatture nel portale</div>
                {selPortale.fattureCm.map((f:any,i:number)=>(
                  <div key={i} style={{padding:"8px 12px",borderRadius:8,border:`0.5px solid ${T.bdr}`,marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center",background:"#F8FAFC"}}>
                    <div>
                      <div style={{fontSize:11,fontWeight:500,color:T.text}}>{f.numero||`Fattura ${i+1}`} · {f.tipo||"fattura"}</div>
                      <div style={{fontSize:10,color:T.sub}}>{f.data||"—"}</div>
                    </div>
                    <div style={{textAlign:"right" as any}}>
                      <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:FM}}>{fmtE(f.importo||0)}</div>
                      <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:f.pagata?TEAL+"12":AMBER+"12",color:f.pagata?TEAL:AMBER,fontWeight:500}}>{f.pagata?"Pagata":"Da pagare"}</span>
                    </div>
                  </div>
                ))}
              </>}

              {/* Ultime chat */}
              {selPortale.msgsCm.length>0&&<>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"14px 0 8px"}}>Ultimi messaggi</div>
                {selPortale.msgsCm.slice(-3).reverse().map((m:any,i:number)=>(
                  <div key={i} style={{padding:"8px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,marginBottom:4,background:"#F8FAFC"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <span style={{fontSize:11,fontWeight:500,color:T.text}}>{m.from||"Cliente"}</span>
                      <span style={{fontSize:9,color:T.sub}}>{m.ora||"—"}</span>
                    </div>
                    <div style={{fontSize:10,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{m.testo||m.text||"—"}</div>
                  </div>
                ))}
              </>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
