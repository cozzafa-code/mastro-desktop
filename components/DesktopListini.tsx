"use client";
// @ts-nocheck
// MASTRO — DesktopListini.tsx
// Gestione listini fornitori: import Excel/PDF, prezzi aggiornati, applica a preventivi

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", ORANGE="#F97316";

const LISTINI_DEMO = [
  { id:"l1", fornitore:"Schüco",    sistema:"AWS 90 SI+", versione:"2026.1", data:"15 Gen 2026", voci:847,  stato:"attivo",   file:"Schuco_AWS90_2026.xlsx" },
  { id:"l2", fornitore:"Schüco",    sistema:"AWS 70",     versione:"2026.1", data:"15 Gen 2026", voci:612,  stato:"attivo",   file:"Schuco_AWS70_2026.xlsx" },
  { id:"l3", fornitore:"Reynaers",  sistema:"CS 86",      versione:"2025.3", data:"10 Nov 2025", voci:534,  stato:"attivo",   file:"Reynaers_CS86_2025.xlsx" },
  { id:"l4", fornitore:"Aluplast",  sistema:"Smart-S76",  versione:"2026.1", data:"5 Feb 2026",  voci:423,  stato:"attivo",   file:"Aluplast_SmartS76.xlsx" },
  { id:"l5", fornitore:"Emmegi",    sistema:"Profili bar.",versione:"2025.2", data:"1 Set 2025",  voci:1240, stato:"scaduto",  file:"Emmegi_barre_2025.xlsx" },
  { id:"l6", fornitore:"Vetri Sud", sistema:"Vetri piano",versione:"2026.2", data:"1 Feb 2026",  voci:89,   stato:"attivo",   file:"VetriSud_2026.xlsx" },
];

const VOCI_DEMO = [
  { codice:"AWS90-T001", desc:"Traverso superiore AWS 90 SI+", um:"ml", prezzo:18.50, sconto:0,  netto:18.50 },
  { codice:"AWS90-T002", desc:"Traverso inferiore AWS 90 SI+", um:"ml", prezzo:16.80, sconto:5,  netto:15.96 },
  { codice:"AWS90-M001", desc:"Montante AWS 90 SI+",           um:"ml", prezzo:19.20, sconto:0,  netto:19.20 },
  { codice:"AWS90-A001", desc:"Anta AWS 90 SI+",               um:"ml", prezzo:21.40, sconto:5,  netto:20.33 },
  { codice:"AWS90-G001", desc:"Guarnizione centrale EPDM",     um:"ml", prezzo:2.10,  sconto:10, netto:1.89  },
  { codice:"AWS90-F001", desc:"Ferramenta anta battente",      um:"pz", prezzo:45.00, sconto:5,  netto:42.75 },
  { codice:"AWS90-V001", desc:"Vetro camera 4/16/4 Basso Em.", um:"mq", prezzo:62.00, sconto:0,  netto:62.00 },
  { codice:"AWS90-V002", desc:"Vetro triplo Ug 0.5",           um:"mq", prezzo:98.00, sconto:0,  netto:98.00 },
];

export default function DesktopListini() {
  const { T } = useMastro();
  const [selListino, setSelListino] = useState<any>(LISTINI_DEMO[0]);
  const [searchVoci, setSearchVoci] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<"voci"|"impostazioni">("voci");

  const vociFiltrate = useMemo(()=>VOCI_DEMO.filter(v=>
    !searchVoci||v.desc.toLowerCase().includes(searchVoci.toLowerCase())||v.codice.toLowerCase().includes(searchVoci.toLowerCase())
  ),[searchVoci]);

  const listiniAttivi=LISTINI_DEMO.filter(l=>l.stato==="attivo");
  const totVoci=LISTINI_DEMO.reduce((s,l)=>s+l.voci,0);

  const fmtE=(n:number)=>"€"+n.toFixed(2).replace(".",",");

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Listini</span>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[{l:"Listini attivi",v:listiniAttivi.length,c:TEAL},{l:"Voci totali",v:totVoci.toLocaleString("it-IT"),c:T.text},{l:"Aggiorn. recente",v:"5 Feb 2026",c:T.sub}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:i===0?16:13,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
          <button onClick={()=>setShowImport(true)} style={{padding:"7px 14px",borderRadius:7,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>+ Importa listino</button>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Lista listini */}
        <div style={{width:260,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,fontSize:11,fontWeight:500,color:T.sub,flexShrink:0}}>{LISTINI_DEMO.length} listini caricati</div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            {LISTINI_DEMO.map(l=>(
              <div key={l.id} onClick={()=>setSelListino(l)}
                style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",background:selListino?.id===l.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selListino?.id===l.id?TEAL:"transparent"}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{l.fornitore} · {l.sistema}</div>
                    <div style={{fontSize:10,color:T.sub}}>v{l.versione} · {l.data}</div>
                  </div>
                  <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:l.stato==="attivo"?TEAL+"12":RED+"12",color:l.stato==="attivo"?TEAL:RED,fontWeight:500,flexShrink:0}}>{l.stato}</span>
                </div>
                <div style={{fontSize:10,color:T.sub}}>{l.voci.toLocaleString("it-IT")} voci · {l.file}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dettaglio listino */}
        <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",background:"#fff"}}>
          {showImport?(
            <div style={{flex:1,overflowY:"auto" as any,padding:24}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div style={{fontSize:15,fontWeight:500,color:T.text}}>Importa listino fornitore</div>
                <button onClick={()=>setShowImport(false)} style={{padding:"5px 12px",borderRadius:6,border:`0.5px solid ${T.bdr}`,background:"transparent",fontSize:11,color:T.sub,cursor:"pointer"}}>Annulla</button>
              </div>
              {/* Drop zone */}
              <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);setShowImport(false);}}
                style={{border:`2px dashed ${dragOver?TEAL:T.bdr}`,borderRadius:14,padding:"48px 20px",textAlign:"center" as any,background:dragOver?TEAL+"04":"#F8FAFC",cursor:"pointer",marginBottom:16,transition:"all .15s"}}>
                <div style={{fontSize:32,marginBottom:12}}>📂</div>
                <div style={{fontSize:15,fontWeight:500,color:T.text,marginBottom:6}}>Trascina il file listino qui</div>
                <div style={{fontSize:12,color:T.sub}}>Supporta Excel (.xlsx), CSV, PDF tabellar</div>
                <button style={{marginTop:14,padding:"8px 20px",borderRadius:8,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Oppure scegli file</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Excel .xlsx","Formato nativo fornitori"],["CSV tabulare","Separatore ; o ,"],["PDF tabellare","Estrazione automatica"],["Copia/incolla","Da email o web"]].map(([t,s],i)=>(
                  <div key={i} style={{padding:"12px",borderRadius:8,border:`0.5px solid ${T.bdr}`,background:"#F8FAFC"}}>
                    <div style={{fontSize:12,fontWeight:500,color:T.text}}>{t}</div>
                    <div style={{fontSize:10,color:T.sub,marginTop:2}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          ):selListino&&(
            <>
              <div style={{padding:"10px 16px 0",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:500,color:T.text}}>{selListino.fornitore} — {selListino.sistema}</div>
                    <div style={{fontSize:11,color:T.sub}}>v{selListino.versione} · {selListino.data} · {selListino.voci.toLocaleString()} voci</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button style={{padding:"5px 10px",borderRadius:6,background:ORANGE,color:"#fff",border:"none",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Aggiorna listino</button>
                    <button style={{padding:"5px 10px",borderRadius:6,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:11,cursor:"pointer",fontFamily:FF}}>Applica a preventivi</button>
                  </div>
                </div>
                <div style={{display:"flex",gap:0}}>
                  {[["voci","Voci listino"],["impostazioni","Impostazioni sconto"]].map(([id,l])=>(
                    <div key={id} onClick={()=>setActiveTab(id as any)} style={{padding:"6px 14px",fontSize:11,fontWeight:500,color:activeTab===id?TEAL:T.sub,borderBottom:`2px solid ${activeTab===id?TEAL:"transparent"}`,cursor:"pointer"}}>{l}</div>
                  ))}
                </div>
              </div>

              {activeTab==="voci"&&(
                <>
                  <div style={{padding:"8px 12px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:"#F8FAFC",borderRadius:7,border:`0.5px solid ${T.bdr}`}}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input value={searchVoci} onChange={e=>setSearchVoci(e.target.value)} placeholder="Cerca voce o codice..." style={{border:"none",background:"transparent",fontSize:12,color:T.text,outline:"none",width:"100%",fontFamily:FF}}/>
                    </div>
                  </div>
                  <div style={{background:"#F8FAFC",borderBottom:`0.5px solid ${T.bdr}`,padding:"6px 16px",display:"grid",gridTemplateColumns:"100px 1fr 50px 70px 10px 70px",gap:8,flexShrink:0}}>
                    {["Codice","Descrizione","U.M.","Prezzo","","Netto"].map((h,i)=>(
                      <div key={i} style={{fontSize:9,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,textAlign:i>=2?"right" as any:"left"}}>{h}</div>
                    ))}
                  </div>
                  <div style={{flex:1,overflowY:"auto" as any}}>
                    {vociFiltrate.map((v,i)=>(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"100px 1fr 50px 70px 40px 70px",padding:"8px 16px",borderBottom:`0.5px solid ${T.bdr}`,gap:8,alignItems:"center"}}>
                        <div style={{fontSize:10,fontFamily:FM,color:T.sub}}>{v.codice}</div>
                        <div style={{fontSize:12,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{v.desc}</div>
                        <div style={{fontSize:11,color:T.sub,textAlign:"right" as any}}>{v.um}</div>
                        <div style={{fontSize:12,color:T.text,textAlign:"right" as any,fontFamily:FM}}>{fmtE(v.prezzo)}</div>
                        <div style={{fontSize:10,color:v.sconto>0?TEAL:T.sub,textAlign:"center" as any}}>{v.sconto>0?`-${v.sconto}%`:"—"}</div>
                        <div style={{fontSize:12,fontWeight:500,color:TEAL,textAlign:"right" as any,fontFamily:FM}}>{fmtE(v.netto)}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab==="impostazioni"&&(
                <div style={{flex:1,overflowY:"auto" as any,padding:16}}>
                  <div style={{background:"#F8FAFC",borderRadius:10,padding:"14px",border:`0.5px solid ${T.bdr}`,marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:10}}>Sconto applicato ({selListino.fornitore})</div>
                    {[{l:"Profili telaio",v:"0%"},{l:"Profili anta",v:"5%"},{l:"Guarnizioni",v:"10%"},{l:"Ferramenta",v:"5%"},{l:"Vetri",v:"0%"}].map((r,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<4?`0.5px solid ${T.bdr}`:"none"}}>
                        <span style={{fontSize:12,color:T.sub}}>{r.l}</span>
                        <input defaultValue={r.v} style={{width:60,padding:"3px 8px",border:`0.5px solid ${T.bdr}`,borderRadius:5,fontSize:12,fontFamily:FM,textAlign:"right" as any,color:T.text,background:"#fff",outline:"none"}}/>
                      </div>
                    ))}
                  </div>
                  <button style={{padding:"9px 18px",borderRadius:8,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Salva impostazioni sconto</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
