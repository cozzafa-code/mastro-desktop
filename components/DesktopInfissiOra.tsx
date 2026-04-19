"use client";
// @ts-nocheck
// MASTRO — DesktopInfissiOra.tsx
// Marketplace inverso B2C: richieste da privati, risposta serramentisti, gestione offerte

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", PURPLE="#8B5CF6";

const RICHIESTE_DEMO = [
  { id:"R001", cliente:"Marco Verdi",    citta:"Cosenza",    prov:"CS", tipo:"Sostituzione 5 finestre PVC", budget:"€3.000-5.000", urgenza:"entro 1 mese", data:"Oggi",    offerte:0, foto:2, stato:"nuova",    km:8  },
  { id:"R002", cliente:"Anna Russo",     citta:"Rende",      prov:"CS", tipo:"Porta finestra + 3 finestre", budget:"€4.000-6.000", urgenza:"entro 2 mesi",data:"Oggi",    offerte:1, foto:3, stato:"nuova",    km:3  },
  { id:"R003", cliente:"Luigi Bianchi",  citta:"Montalto U.",prov:"CS", tipo:"Tapparelle motorizzate x4",   budget:"€1.200-1.800", urgenza:"flessibile",  data:"Ieri",    offerte:2, foto:1, stato:"offerta",  km:22 },
  { id:"R004", cliente:"Sara Ferraro",   citta:"Castrovillari",prov:"CS",tipo:"Zanzariere tutta casa",      budget:"€600-1.000",   urgenza:"entro 1 mese", data:"Ieri",    offerte:3, foto:0, stato:"offerta",  km:45 },
  { id:"R005", cliente:"Fam. Esposito",  citta:"Cosenza",    prov:"CS", tipo:"Pergola bioclimatica 30mq",   budget:"€8.000+",      urgenza:"entro 3 mesi",data:"2 gg fa", offerte:1, foto:4, stato:"trattativa",km:6  },
  { id:"R006", cliente:"Carlo Mancuso",  citta:"Rende",      prov:"CS", tipo:"Infissi alluminio intera casa",budget:"€12.000+",    urgenza:"nuova costruz.",data:"3 gg fa",offerte:4, foto:5, stato:"chiusa",   km:3  },
];

const OFFERTE_DEMO: Record<string, any[]> = {
  R003: [
    { azienda:"WC Serramenti", importo:1580, stato:"inviata",   data:"Ieri" },
    { azienda:"Infissi Sud",   importo:1720, stato:"inviata",   data:"2 gg fa" },
  ],
  R004: [
    { azienda:"WC Serramenti", importo:850,  stato:"inviata",   data:"Ieri" },
    { azienda:"Zanzariere Pro",importo:780,  stato:"accettata", data:"Ieri" },
    { azienda:"Casa Bella",    importo:920,  stato:"rifiutata", data:"2 gg fa" },
  ],
  R005: [
    { azienda:"WC Serramenti", importo:8900, stato:"inviata",   data:"Oggi" },
  ],
  R006: [
    { azienda:"WC Serramenti", importo:14200,stato:"accettata", data:"3 gg fa" },
    { azienda:"Serramenti Sud",importo:13800,stato:"rifiutata", data:"3 gg fa" },
    { azienda:"Infissi CS",    importo:15100,stato:"rifiutata", data:"3 gg fa" },
    { azienda:"Casa Infissi",  importo:16000,stato:"rifiutata", data:"3 gg fa" },
  ],
};

const statoColors: Record<string,string> = {
  nuova:BLUE, offerta:AMBER, trattativa:PURPLE, chiusa:TEAL, scaduta:RED
};

export default function DesktopInfissiOra() {
  const { T, aziendaInfo } = useMastro();
  const [selRich, setSelRich] = useState<any>(null);
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [importoOfferta, setImportoOfferta] = useState("");
  const [noteOfferta, setNoteOfferta] = useState("");
  const [offerteInviate, setOfferteInviate] = useState(new Set(["R003","R004","R005","R006"]));
  const [showOffertaForm, setShowOffertaForm] = useState(false);

  const filtered = useMemo(()=>RICHIESTE_DEMO.filter(r=>filtroStato==="tutti"||r.stato===filtroStato),[filtroStato]);
  const offerte = selRich ? (OFFERTE_DEMO[selRich.id]||[]) : [];
  const miaOfferta = offerte.find((o:any)=>o.azienda===((aziendaInfo?.nome||aziendaInfo?.ragione)||"WC Serramenti"));

  const fmtE=(n:number)=>"€"+Math.round(n).toLocaleString("it-IT");

  const inviaOfferta=()=>{
    if(!importoOfferta||!selRich) return;
    setOfferteInviate(s=>new Set([...s,selRich.id]));
    setShowOffertaForm(false);
    setImportoOfferta(""); setNoteOfferta("");
  };

  const totNuove=RICHIESTE_DEMO.filter(r=>r.stato==="nuova").length;
  const totOfferte=RICHIESTE_DEMO.filter(r=>offerteInviate.has(r.id)&&r.stato!=="chiusa").length;
  const totVinte=OFFERTE_DEMO["R006"]?.filter(o=>o.azienda===(aziendaInfo?.nome||"WC Serramenti")&&o.stato==="accettata").length||0;

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:7,background:BLUE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#fff"}}>IO</div>
          <span style={{fontSize:15,fontWeight:500,color:T.text}}>InfissiOra</span>
          <span style={{fontSize:11,color:T.sub}}>· Marketplace B2C</span>
        </div>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[{l:"Nuove richieste",v:totNuove,c:BLUE},{l:"Offerte inviate",v:totOfferte,c:AMBER},{l:"Lavori vinti",v:totVinte,c:TEAL},{l:"Raggio zona",v:"50 km",c:T.text}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:i<3?16:14,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* SIDEBAR */}
        <div style={{width:200,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Filtra per stato</div>
            {[["tutti","Tutte",T.text],["nuova","Nuove",BLUE],["offerta","Con offerta",AMBER],["trattativa","Trattativa",PURPLE],["chiusa","Chiuse",TEAL]].map(([id,l,c])=>(
              <div key={id} onClick={()=>setFiltroStato(id)} style={{padding:"6px 10px",borderRadius:7,cursor:"pointer",marginBottom:3,display:"flex",alignItems:"center",gap:8,background:filtroStato===id?c+"10":"transparent",borderLeft:`2px solid ${filtroStato===id?c:"transparent"}`}}>
                {id!=="tutti"&&<div style={{width:7,height:7,borderRadius:"50%",background:c,flexShrink:0}}/>}
                <span style={{fontSize:12,color:filtroStato===id?c:T.text,fontWeight:filtroStato===id?500:400}}>{l}</span>
                <span style={{marginLeft:"auto",fontSize:10,fontFamily:FM,color:T.sub}}>{id==="tutti"?RICHIESTE_DEMO.length:RICHIESTE_DEMO.filter(r=>r.stato===id).length}</span>
              </div>
            ))}
          </div>
          {/* Come funziona */}
          <div style={{padding:"12px 14px",flex:1}}>
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Come funziona</div>
            {[["1","Il privato cerca su InfissiOra.it"],["2","Descrive il lavoro e il budget"],["3","Tu ricevi la richiesta qui"],["4","Invii la tua offerta"],["5","Il privato sceglie la migliore"]].map(([n,s])=>(
              <div key={n} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                <div style={{width:16,height:16,borderRadius:4,background:BLUE+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:BLUE,flexShrink:0}}>{n}</div>
                <span style={{fontSize:11,color:T.sub,lineHeight:1.4}}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LISTA RICHIESTE */}
        <div style={{width:320,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,fontSize:11,fontWeight:500,color:T.sub,flexShrink:0}}>{filtered.length} richieste in zona</div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            {filtered.map(r=>{
              const sc=statoColors[r.stato]||BLUE;
              const miaOff=offerteInviate.has(r.id);
              return (
                <div key={r.id} onClick={()=>{setSelRich(r);setShowOffertaForm(false);}}
                  style={{padding:"12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",background:selRich?.id===r.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selRich?.id===r.id?TEAL:"transparent"}`}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontSize:12,fontWeight:500,color:T.text}}>{r.cliente}</span>
                        {r.stato==="nuova"&&<div style={{width:6,height:6,borderRadius:"50%",background:BLUE,flexShrink:0}}/>}
                      </div>
                      <div style={{fontSize:10,color:T.sub}}>{r.citta} ({r.prov}) · {r.km} km · {r.data}</div>
                    </div>
                    <span style={{fontSize:9,padding:"2px 7px",borderRadius:100,background:sc+"12",color:sc,fontWeight:500,flexShrink:0,whiteSpace:"nowrap" as any}}>{r.stato}</span>
                  </div>
                  <div style={{fontSize:11,color:T.text,marginBottom:6}}>{r.tipo}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,fontWeight:500,color:TEAL}}>{r.budget}</span>
                    <span style={{fontSize:10,color:T.sub}}>· {r.urgenza}</span>
                    <span style={{marginLeft:"auto",fontSize:10,color:miaOff?TEAL:T.sub,fontWeight:miaOff?500:400}}>{miaOff?"✓ Offerta inviata":`${r.offerte} offerte`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETTAGLIO + OFFERTA */}
        <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",background:"#fff"}}>
          {!selRich?(
            <div style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",gap:14,padding:40,textAlign:"center" as any}}>
              <div style={{width:64,height:64,borderRadius:18,background:BLUE+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div style={{fontSize:16,fontWeight:500,color:T.text}}>InfissiOra — Marketplace B2C</div>
              <div style={{fontSize:13,color:T.sub,maxWidth:400,lineHeight:1.7}}>I privati pubblicano la loro richiesta su InfissiOra.it. Tu ricevi le richieste nella tua zona e invii la tua offerta in 2 click. Il privato sceglie il migliore.</div>
            </div>
          ):(
            <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
              {/* Header richiesta */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <div style={{fontSize:17,fontWeight:500,color:T.text}}>{selRich.cliente}</div>
                  <div style={{fontSize:11,color:T.sub,marginTop:2}}>{selRich.citta} ({selRich.prov}) · {selRich.km} km da te · {selRich.data}</div>
                  <div style={{display:"flex",gap:6,marginTop:6}}>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:TEAL+"12",color:TEAL,fontWeight:500}}>{selRich.budget}</span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:AMBER+"12",color:AMBER,fontWeight:500}}>{selRich.urgenza}</span>
                    {selRich.foto>0&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:BLUE+"12",color:BLUE,fontWeight:500}}>{selRich.foto} foto</span>}
                  </div>
                </div>
                {!offerteInviate.has(selRich.id)&&selRich.stato!=="chiusa"&&(
                  <button onClick={()=>setShowOffertaForm(true)} style={{padding:"8px 18px",borderRadius:8,background:TEAL,color:"#fff",border:"none",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Invia offerta →</button>
                )}
                {offerteInviate.has(selRich.id)&&<span style={{fontSize:12,fontWeight:500,color:TEAL,padding:"8px 14px",borderRadius:8,background:TEAL+"12"}}>✓ Offerta inviata</span>}
              </div>

              {/* Descrizione */}
              <div style={{background:"#F8FAFC",borderRadius:10,padding:"14px 16px",marginBottom:14,border:`0.5px solid ${T.bdr}`}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Lavoro richiesto</div>
                <div style={{fontSize:14,fontWeight:500,color:T.text,marginBottom:8}}>{selRich.tipo}</div>
                {[{l:"Budget",v:selRich.budget},{l:"Urgenza",v:selRich.urgenza},{l:"Città",v:`${selRich.citta} (${selRich.prov})`},{l:"Distanza",v:`${selRich.km} km da te`},{l:"Offerte ricevute",v:`${selRich.offerte}`},{l:"Pubblicata",v:selRich.data}].map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderTop:i>0?`0.5px solid ${T.bdr}`:"none"}}>
                    <span style={{fontSize:11,color:T.sub}}>{r.l}</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text}}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Form offerta */}
              {showOffertaForm&&(
                <div style={{background:"#fff",borderRadius:10,border:`1px solid ${TEAL}30`,padding:"16px",marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:12}}>La tua offerta</div>
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:5}}>Importo €</div>
                    <input type="number" value={importoOfferta} onChange={e=>setImportoOfferta(e.target.value)} placeholder="Es. 4500" style={{width:"100%",padding:"9px 12px",border:`0.5px solid ${T.bdr}`,borderRadius:7,fontSize:14,fontFamily:FF,color:T.text,background:"#F8FAFC",outline:"none"}}/>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:5}}>Nota per il cliente</div>
                    <textarea value={noteOfferta} onChange={e=>setNoteOfferta(e.target.value)} rows={3} placeholder="Descrivi brevemente la tua proposta..." style={{width:"100%",padding:"9px 12px",border:`0.5px solid ${T.bdr}`,borderRadius:7,fontSize:13,fontFamily:FF,color:T.text,background:"#F8FAFC",outline:"none",resize:"none" as any}}/>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setShowOffertaForm(false)} style={{flex:1,padding:"9px",borderRadius:7,border:`0.5px solid ${T.bdr}`,background:"transparent",fontSize:12,color:T.sub,cursor:"pointer",fontFamily:FF}}>Annulla</button>
                    <button onClick={inviaOfferta} style={{flex:2,padding:"9px",borderRadius:7,background:TEAL,color:"#fff",border:"none",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Invia offerta {importoOfferta?`€${parseInt(importoOfferta).toLocaleString("it-IT")}`:""}</button>
                  </div>
                </div>
              )}

              {/* Offerte concorrenti */}
              {offerte.length>0&&(
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Offerte ({offerte.length})</div>
                  {offerte.map((o:any,i:number)=>{
                    const isMia=o.azienda===(aziendaInfo?.nome||"WC Serramenti");
                    const stCol=o.stato==="accettata"?TEAL:o.stato==="rifiutata"?RED:AMBER;
                    return (
                      <div key={i} style={{padding:"10px 12px",borderRadius:8,border:`0.5px solid ${isMia?TEAL:T.bdr}`,marginBottom:6,background:isMia?TEAL+"04":"#F8FAFC",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontSize:12,fontWeight:500,color:T.text}}>{o.azienda}</span>
                            {isMia&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:TEAL+"20",color:TEAL,fontWeight:700}}>La tua</span>}
                          </div>
                          <div style={{fontSize:10,color:T.sub}}>{o.data}</div>
                        </div>
                        <div style={{textAlign:"right" as any}}>
                          <div style={{fontSize:14,fontWeight:500,color:T.text,fontFamily:FM}}>{fmtE(o.importo)}</div>
                          <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:stCol+"12",color:stCol,fontWeight:500}}>{o.stato}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
