"use client";
// @ts-nocheck
// MASTRO — DesktopLeads.tsx
// TROVA CLIENTI: scraping Habitissimo/Instapro/Subito per zona, crediti, gestione lead

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", ORANGE="#F97316";

const FONTI = [
  { id:"habitissimo", nome:"Habitissimo",  colore:"#E8A020", desc:"Richieste preventivo serramenti Italia" },
  { id:"instapro",    nome:"Instapro",     colore:"#3B7FE0", desc:"Professionisti artigiani cerca lavoro" },
  { id:"subito",      nome:"Subito.it",    colore:"#DC4444", desc:"Annunci richiesta lavori casa" },
  { id:"immobiliare", nome:"Immobiliare",  colore:"#8B5CF6", desc:"Nuovi cantieri e ristrutturazioni" },
  { id:"google",      nome:"Google Maps",  colore:"#1A9E73", desc:"Aziende zona con esigenze infissi" },
];

const STATI_LEAD = [
  { id:"nuovo",       label:"Nuovo",       c:BLUE },
  { id:"contattato",  label:"Contattato",  c:AMBER },
  { id:"trattativa",  label:"Trattativa",  c:ORANGE },
  { id:"convertito",  label:"Convertito",  c:TEAL },
  { id:"perso",       label:"Perso",       c:RED },
];

const LEADS_DEMO = [
  { id:1, nome:"Mario Esposito",   tel:"339 1234567", comune:"Rende",    prov:"CS", fonte:"habitissimo", tipo:"Sostituzione infissi 3 vani", budget:"€3.000-5.000", data:"Oggi",   stato:"nuovo",      cred:1 },
  { id:2, nome:"Anna Ferraro",     tel:"347 9876543", comune:"Cosenza",  prov:"CS", fonte:"instapro",    tipo:"Porta blindata + finestre",   budget:"€2.000-4.000", data:"Oggi",   stato:"nuovo",      cred:1 },
  { id:3, nome:"Luigi Bianchi",    tel:"320 5544332", comune:"Catanzaro",prov:"CZ", fonte:"subito",      tipo:"Zanzariere 4 finestre",        budget:"€500-800",     data:"Ieri",   stato:"contattato", cred:1 },
  { id:4, nome:"Giulia Romano",    tel:"328 1122334", comune:"Crotone",  prov:"KR", fonte:"habitissimo", tipo:"Tapparelle motorizzate x5",     budget:"€1.500-2.500", data:"Ieri",   stato:"trattativa", cred:0 },
  { id:5, nome:"Franco Mancuso",   tel:"333 6677889", comune:"Reggio C.",prov:"RC", fonte:"google",      tipo:"Finestre PVC intera casa",      budget:"€8.000+",      data:"2 gg fa",stato:"convertito", cred:0 },
  { id:6, nome:"Sara Vitagliano",  tel:"349 2233445", comune:"Vibo V.",  prov:"VV", fonte:"immobiliare", tipo:"Finestre nuova costruzione",    budget:"€5.000-8.000", data:"3 gg fa",stato:"perso",      cred:0 },
];

const CREDITI_PIANO = { base:0, start:0, pro:20, titan:50 };

export default function DesktopLeads() {
  const { T, cantieri=[], setShowModal, setTab } = useMastro();
  const [leads, setLeads] = useState(LEADS_DEMO);
  const [selLead, setSelLead] = useState<any>(null);
  const [filtroFonte, setFiltroFonte] = useState("tutti");
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [filtroZona, setFiltroZona] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanProg, setScanProg] = useState(0);
  const [crediti] = useState(20); // PRO plan demo
  const [creditiUsati] = useState(leads.filter(l=>l.cred===1).length);

  const filtered = useMemo(()=>leads.filter(l=>{
    if(filtroFonte!=="tutti"&&l.fonte!==filtroFonte) return false;
    if(filtroStato!=="tutti"&&l.stato!==filtroStato) return false;
    if(filtroZona&&!l.comune.toLowerCase().includes(filtroZona.toLowerCase())&&!l.prov.toLowerCase().includes(filtroZona.toLowerCase())) return false;
    return true;
  }),[leads,filtroFonte,filtroStato,filtroZona]);

  const statoInfo = (id:string) => STATI_LEAD.find(s=>s.id===id)||STATI_LEAD[0];
  const fonteInfo = (id:string) => FONTI.find(f=>f.id===id)||FONTI[0];
  const nuovi = leads.filter(l=>l.stato==="nuovo").length;
  const convertiti = leads.filter(l=>l.stato==="convertito").length;
  const tassoConv = leads.length>0?Math.round(convertiti/leads.length*100):0;

  const startScan = () => {
    setScanning(true); setScanProg(0);
    const interval = setInterval(()=>{
      setScanProg(p=>{
        if(p>=100){ clearInterval(interval); setScanning(false); return 100; }
        return p+8;
      });
    }, 120);
  };

  const aggiornaStato = (id:number, stato:string) => {
    setLeads(l=>l.map(x=>x.id===id?{...x,stato}:x));
  };

  const convertiInCommessa = (lead:any) => {
    setLeads(l=>l.map(x=>x.id===lead.id?{...x,stato:"convertito"}:x));
    setSelLead(null);
    // In produzione: crea commessa + contatto in Supabase
  };

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Trova Clienti</span>
        <div style={{padding:"2px 10px",borderRadius:100,background:TEAL+"12",fontSize:11,fontWeight:500,color:TEAL}}>Piano PRO · {crediti-creditiUsati} crediti rimanenti</div>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[{l:"Leads totali",v:leads.length,c:T.text},{l:"Nuovi oggi",v:nuovi,c:BLUE},{l:"Convertiti",v:convertiti,c:TEAL},{l:"Tasso conv.",v:`${tassoConv}%`,c:TEAL}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:i===3?14:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
          <button onClick={startScan} disabled={scanning} style={{padding:"7px 14px",borderRadius:7,background:scanning?"#F4F6F8":TEAL,color:scanning?T.sub:"#fff",border:`0.5px solid ${scanning?T.bdr:TEAL}`,fontSize:12,fontWeight:500,cursor:scanning?"not-allowed":"pointer",fontFamily:FF}}>
            {scanning?`Scansione ${scanProg}%...`:"Scansiona zona →"}
          </button>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* SIDEBAR FILTRI + FONTI */}
        <div style={{width:220,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"12px 14px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Zona</div>
            <input value={filtroZona} onChange={e=>setFiltroZona(e.target.value)} placeholder="Comune o provincia..." style={{width:"100%",padding:"6px 10px",border:`0.5px solid ${T.bdr}`,borderRadius:7,fontSize:12,fontFamily:FF,color:T.text,background:"#F8FAFC",outline:"none"}}/>
          </div>

          {/* Fonti */}
          <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Fonte</div>
            <div onClick={()=>setFiltroFonte("tutti")} style={{padding:"5px 8px",borderRadius:6,cursor:"pointer",marginBottom:3,background:filtroFonte==="tutti"?DARK:"transparent",borderLeft:`2px solid ${filtroFonte==="tutti"?TEAL:"transparent"}`}}>
              <span style={{fontSize:12,fontWeight:500,color:filtroFonte==="tutti"?"#fff":T.sub}}>Tutte le fonti</span>
            </div>
            {FONTI.map(f=>{
              const n=leads.filter(l=>l.fonte===f.id).length;
              return (
                <div key={f.id} onClick={()=>setFiltroFonte(filtroFonte===f.id?"tutti":f.id)}
                  style={{padding:"6px 8px",borderRadius:6,cursor:"pointer",marginBottom:3,display:"flex",alignItems:"center",gap:8,background:filtroFonte===f.id?f.colore+"12":"transparent",borderLeft:`2px solid ${filtroFonte===f.id?f.colore:"transparent"}`}}>
                  <div style={{width:7,height:7,borderRadius:2,background:f.colore,flexShrink:0}}/>
                  <span style={{fontSize:12,color:filtroFonte===f.id?f.colore:T.text,flex:1}}>{f.nome}</span>
                  <span style={{fontSize:10,fontWeight:500,color:T.sub,fontFamily:FM}}>{n}</span>
                </div>
              );
            })}
          </div>

          {/* Stati */}
          <div style={{padding:"10px 14px",flex:1,overflow:"hidden"}}>
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Stato</div>
            <div onClick={()=>setFiltroStato("tutti")} style={{padding:"5px 8px",borderRadius:6,cursor:"pointer",marginBottom:3,background:filtroStato==="tutti"?DARK:"transparent"}}>
              <span style={{fontSize:12,fontWeight:500,color:filtroStato==="tutti"?"#fff":T.sub}}>Tutti</span>
            </div>
            {STATI_LEAD.map(s=>{
              const n=leads.filter(l=>l.stato===s.id).length;
              return (
                <div key={s.id} onClick={()=>setFiltroStato(filtroStato===s.id?"tutti":s.id)}
                  style={{padding:"6px 8px",borderRadius:6,cursor:"pointer",marginBottom:3,display:"flex",alignItems:"center",gap:8,background:filtroStato===s.id?s.c+"12":"transparent",borderLeft:`2px solid ${filtroStato===s.id?s.c:"transparent"}`}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:s.c,flexShrink:0}}/>
                  <span style={{fontSize:12,color:filtroStato===s.id?s.c:T.text,flex:1}}>{s.label}</span>
                  <span style={{fontSize:10,fontWeight:500,color:T.sub,fontFamily:FM}}>{n}</span>
                </div>
              );
            })}
          </div>

          {/* Crediti */}
          <div style={{padding:"12px 14px",borderTop:`0.5px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6}}>Crediti piano PRO</div>
            <div style={{height:6,background:"#F4F6F8",borderRadius:3,overflow:"hidden",marginBottom:4}}>
              <div style={{height:"100%",width:`${Math.round(creditiUsati/crediti*100)}%`,background:TEAL,borderRadius:3}}/>
            </div>
            <div style={{fontSize:11,color:T.sub}}>{creditiUsati}/{crediti} usati questo mese</div>
            <div onClick={()=>setTab("settings")} style={{marginTop:8,padding:"5px 10px",borderRadius:6,background:TEAL+"10",border:`0.5px solid ${TEAL}30`,fontSize:10,fontWeight:500,color:TEAL,cursor:"pointer",textAlign:"center" as any}}>Upgrade a TITAN → 50/mese</div>
          </div>
        </div>

        {/* LISTA LEADS */}
        <div style={{width:320,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <span style={{fontSize:11,fontWeight:500,color:T.sub}}>{filtered.length} leads</span>
          </div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            {filtered.length===0&&<div style={{padding:20,textAlign:"center" as any,fontSize:12,color:T.sub}}>Nessun lead con questi filtri</div>}
            {filtered.map((lead)=>{
              const st=statoInfo(lead.stato);
              const ft=fonteInfo(lead.fonte);
              return (
                <div key={lead.id} onClick={()=>setSelLead(selLead?.id===lead.id?null:lead)}
                  style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",background:selLead?.id===lead.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selLead?.id===lead.id?TEAL:"transparent"}`}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                    <div style={{width:32,height:32,borderRadius:9,background:ft.colore+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:ft.colore,flexShrink:0}}>
                      {lead.nome.split(" ").map((w:string)=>w[0]).slice(0,2).join("")}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{lead.nome}</span>
                        {lead.stato==="nuovo"&&<div style={{width:6,height:6,borderRadius:"50%",background:BLUE,flexShrink:0}}/>}
                      </div>
                      <div style={{fontSize:10,color:T.sub}}>{lead.comune} ({lead.prov}) · {lead.data}</div>
                      <div style={{fontSize:10,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any,marginTop:2}}>{lead.tipo}</div>
                      <div style={{display:"flex",gap:4,marginTop:4}}>
                        <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:ft.colore+"12",color:ft.colore,fontWeight:500}}>{ft.nome}</span>
                        <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:st.c+"12",color:st.c,fontWeight:500}}>{st.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETTAGLIO LEAD */}
        <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",background:"#fff"}}>
          {!selLead?(
            <div style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",gap:16,padding:40,textAlign:"center" as any}}>
              <div style={{width:64,height:64,borderRadius:18,background:TEAL+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <div style={{fontSize:16,fontWeight:500,color:T.text}}>TROVA CLIENTI</div>
              <div style={{fontSize:13,color:T.sub,maxWidth:380,lineHeight:1.7}}>Scraping automatico da Habitissimo, Instapro, Subito.it e Google Maps per la tua zona. Lead B2C pronti nel gestionale, un click per convertirli in commessa.</div>
              <button onClick={startScan} style={{padding:"10px 24px",borderRadius:9,background:TEAL,color:"#fff",border:"none",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FF}}>
                {scanning?`Scansione in corso ${scanProg}%...`:"Avvia scansione zona"}
              </button>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",maxWidth:420}}>
                {FONTI.map(f=>(
                  <div key={f.id} style={{padding:"10px 12px",borderRadius:8,border:`0.5px solid ${T.bdr}`,background:"#F8FAFC",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:2,background:f.colore,flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:11,fontWeight:500,color:T.text}}>{f.nome}</div>
                      <div style={{fontSize:9,color:T.sub}}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <div style={{fontSize:18,fontWeight:500,color:T.text}}>{selLead.nome}</div>
                  <div style={{fontSize:11,color:T.sub,marginTop:3}}>{selLead.comune} ({selLead.prov}) · {fonteInfo(selLead.fonte).nome} · {selLead.data}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>convertiInCommessa(selLead)} style={{padding:"7px 14px",borderRadius:7,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Converti in commessa →</button>
                </div>
              </div>

              {/* Info lead */}
              <div style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,overflow:"hidden",marginBottom:14}}>
                {[
                  {l:"Telefono",v:selLead.tel},
                  {l:"Comune",v:`${selLead.comune} (${selLead.prov})`},
                  {l:"Richiesta",v:selLead.tipo},
                  {l:"Budget indicativo",v:selLead.budget},
                  {l:"Fonte",v:fonteInfo(selLead.fonte).nome},
                  {l:"Data lead",v:selLead.data},
                  {l:"Stato",v:statoInfo(selLead.stato).label},
                ].map((r,i)=>(
                  <div key={i} style={{display:"flex",padding:"8px 14px",borderBottom:i<6?`0.5px solid ${T.bdr}`:"none",gap:12}}>
                    <span style={{fontSize:11,color:T.sub,minWidth:120,flexShrink:0}}>{r.l}</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text}}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Aggiorna stato */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Aggiorna stato</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap" as any}}>
                  {STATI_LEAD.map(s=>(
                    <div key={s.id} onClick={()=>aggiornaStato(selLead.id,s.id)}
                      style={{padding:"5px 12px",borderRadius:6,border:`1.5px solid ${selLead.stato===s.id?s.c:T.bdr}`,cursor:"pointer",background:selLead.stato===s.id?s.c+"12":"transparent",fontSize:11,fontWeight:selLead.stato===s.id?500:400,color:selLead.stato===s.id?s.c:T.sub}}>
                      {s.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6}}>Note</div>
                <textarea placeholder="Aggiungi note su questo lead..." rows={4} style={{width:"100%",padding:"10px 12px",border:`0.5px solid ${T.bdr}`,borderRadius:8,fontSize:12,fontFamily:FF,color:T.text,background:"#F8FAFC",outline:"none",resize:"vertical" as any}}/>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
