"use client";
// @ts-nocheck
// MASTRO — QuickBar.tsx
// Barra azioni rapide + pannello task/impegni globale

import { useState, useRef } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73",DARK="#1A1A1C",RED="#DC4444",AMB="#D08008",PUR="#8B5CF6",BLU="#3B7FE0";

// ── Tipi task ────────────────────────────────────────────────
interface Task {
  id: string;
  titolo: string;
  note: string;
  tipo: "personale"|"assegnata"|"commessa";
  assegnatoA: string;        // id operatore
  assegnatoNome: string;
  commessaId?: string;
  commessaNome?: string;
  scadenza?: string;
  priorita: "alta"|"media"|"bassa";
  stato: "aperta"|"in_corso"|"completata";
  allegati: Allegato[];
  createdAt: string;
  createdBy: string;
}

interface Allegato {
  id: string;
  tipo: "foto"|"video"|"nota"|"file";
  nome: string;
  url?: string;
  testo?: string;
}

const PRIORITA_COL:Record<string,string>={alta:RED,media:AMB,bassa:TEAL};
const STATO_COL:Record<string,string>={aperta:AMB,in_corso:BLU,completata:TEAL};

export default function QuickBar(){
  const {T,cantieri=[],team=[],tasks=[],setTasks,tab,setTab,setSelectedCM,aziendaInfo}=useMastro();
  const [showPanel,setShowPanel]=useState(false);
  const [showNewTask,setShowNewTask]=useState(false);
  const [filterStato,setFilterStato]=useState<string>("aperta");
  const [filterAssegnato,setFilterAssegnato]=useState<string>("tutti");
  const [selectedTask,setSelectedTask]=useState<Task|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  // Form nuova task
  const emptyForm=()=>({titolo:"",note:"",tipo:"personale" as const,assegnatoA:"me",assegnatoNome:"Io",commessaId:"",scadenza:"",priorita:"media" as const,allegati:[]});
  const [form,setForm]=useState(emptyForm());

  const myTasks=(tasks||[]).filter((t:Task)=>t.assegnatoA==="me"||t.assegnatoA===aziendaInfo?.userId);
  const openTasks=(tasks||[]).filter((t:Task)=>t.stato!=="completata");
  const urgenti=openTasks.filter((t:Task)=>t.priorita==="alta"||t.scadenza<new Date().toISOString().split("T")[0]);

  const createTask=()=>{
    if(!form.titolo.trim())return;
    const newTask:Task={
      id:"t_"+Date.now(),
      ...form,
      stato:"aperta",
      allegati:form.allegati||[],
      createdAt:new Date().toISOString(),
      createdBy:"me",
    };
    setTasks?.((prev:Task[])=>[newTask,...(prev||[])]);
    setForm(emptyForm());
    setShowNewTask(false);
  };

  const toggleStato=(taskId:string)=>{
    setTasks?.((prev:Task[])=>prev.map(t=>t.id===taskId
      ?{...t,stato:t.stato==="aperta"?"in_corso":t.stato==="in_corso"?"completata":"aperta"}
      :t
    ));
  };

  const filteredTasks=(tasks||[]).filter((t:Task)=>{
    if(filterStato!=="tutti"&&t.stato!==filterStato)return false;
    if(filterAssegnato==="me"&&t.assegnatoA!=="me")return false;
    if(filterAssegnato!=="me"&&filterAssegnato!=="tutti"&&t.assegnatoA!==filterAssegnato)return false;
    return true;
  });

  const S={
    btn:(active=false,color=DARK)=>({
      padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
      background:active?color:"#fff",color:active?"#fff":color,
      border:`1.5px solid ${active?color:color+"40"}`,transition:"all .15s",
    }),
    input:{
      width:"100%",padding:"9px 12px",borderRadius:8,
      border:`1.5px solid #E5E3DC`,fontSize:13,fontFamily:FF,
      background:"#F8F7F2",color:DARK,outline:"none",boxSizing:"border-box" as const,
    },
    label:{fontSize:11,fontWeight:700,color:"#86868b",textTransform:"uppercase" as const,letterSpacing:.7,marginBottom:4,display:"block"},
  };

  return (
    <>
      {/* ── QUICK ACTION BAR ─────────────────────────────── */}
      <div style={{background:"#fff",borderBottom:`1px solid #E5E3DC`,padding:"8px 20px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",flexShrink:0}}>

        {/* Task aperte badge */}
        <div onClick={()=>setShowPanel(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,background:openTasks.length>0?AMB+"10":"#F2F1EC",border:`1.5px solid ${openTasks.length>0?AMB+"40":"#E5E3DC"}`,cursor:"pointer",transition:"background .15s"}}
          onMouseEnter={e=>((e.currentTarget as any).style.background=AMB+"18")}
          onMouseLeave={e=>((e.currentTarget as any).style.background=openTasks.length>0?AMB+"10":"#F2F1EC")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={AMB} strokeWidth="2.5"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><path d="M9 12l2 2 4-4"/></svg>
          <span style={{fontSize:12,fontWeight:700,color:AMB}}>{openTasks.length} task aperte</span>
          {urgenti.length>0&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:10,background:RED,color:"#fff",fontWeight:800}}>{urgenti.length} urgenti</span>}
        </div>

        <div style={{width:1,height:20,background:"#E5E3DC",margin:"0 2px"}}/>

        {/* Azioni rapide */}
        {[
          {l:"+ Nuova task",c:TEAL,fn:()=>{setForm(emptyForm());setShowNewTask(true);}},
          {l:"+ Nuova commessa",c:BLU,fn:()=>setTab("commesse")},
          {l:"+ Messaggio",c:PUR,fn:()=>setTab("messaggi")},
        ].map(a=>(
          <div key={a.l} onClick={a.fn} style={{...S.btn(false,a.c),display:"flex",alignItems:"center",gap:5}}
            onMouseEnter={e=>{(e.currentTarget as any).style.background=a.c;(e.currentTarget as any).style.color="#fff";}}
            onMouseLeave={e=>{(e.currentTarget as any).style.background="#fff";(e.currentTarget as any).style.color=a.c;}}>
            {a.l}
          </div>
        ))}

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
          {urgenti.length>0&&(
            <div onClick={()=>setShowPanel(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,background:RED+"10",border:`1px solid ${RED}30`,cursor:"pointer"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:RED}}/>
              <span style={{fontSize:11,fontWeight:700,color:RED}}>{urgenti.length} in scadenza</span>
            </div>
          )}
        </div>
      </div>

      {/* ── PANNELLO TASK (slide-in dx) ───────────────────── */}
      {showPanel&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
          {/* Overlay */}
          <div onClick={()=>setShowPanel(false)} style={{flex:1,background:"rgba(0,0,0,0.2)"}}/>
          {/* Pannello */}
          <div style={{width:480,background:"#F2F1EC",display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)",overflowY:"auto"}}>

            {/* Header */}
            <div style={{padding:"16px 20px",background:"#fff",borderBottom:"1px solid #E5E3DC",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:DARK}}>Task & Impegni</div>
                <div style={{fontSize:12,color:"#86868b",marginTop:2}}>{openTasks.length} aperte · {urgenti.length} urgenti</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <div onClick={()=>{setForm(emptyForm());setShowNewTask(true);setShowPanel(false);}} style={{padding:"7px 14px",borderRadius:8,background:TEAL,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nuova</div>
                <div onClick={()=>setShowPanel(false)} style={{width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"1px solid #E5E3DC",background:"#fff",fontSize:18,color:"#86868b"}}>×</div>
              </div>
            </div>

            {/* Filtri */}
            <div style={{padding:"12px 20px",background:"#fff",borderBottom:"1px solid #E5E3DC",display:"flex",gap:6,flexWrap:"wrap",flexShrink:0}}>
              {["tutti","aperta","in_corso","completata"].map(s=>(
                <div key={s} onClick={()=>setFilterStato(s)} style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",background:filterStato===s?DARK:"#F2F1EC",color:filterStato===s?"#fff":"#86868b"}}>
                  {s==="tutti"?"Tutte":s==="aperta"?"Aperte":s==="in_corso"?"In corso":"Completate"}
                </div>
              ))}
              <div style={{width:1,background:"#E5E3DC",margin:"0 4px"}}/>
              <div onClick={()=>setFilterAssegnato("me")} style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",background:filterAssegnato==="me"?BLU:"#F2F1EC",color:filterAssegnato==="me"?"#fff":"#86868b"}}>Solo mie</div>
              <div onClick={()=>setFilterAssegnato("tutti")} style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",background:filterAssegnato==="tutti"?BLU:"#F2F1EC",color:filterAssegnato==="tutti"?"#fff":"#86868b"}}>Tutte</div>
            </div>

            {/* Lista task */}
            <div style={{flex:1,padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
              {filteredTasks.length===0&&(
                <div style={{textAlign:"center",padding:"40px 20px",color:"#86868b",fontSize:14}}>
                  {filterStato==="completata"?"Nessun task completato":"Nessun task — aggiungine uno!"}
                </div>
              )}
              {filteredTasks.map((t:Task)=>(
                <div key={t.id} style={{background:"#fff",borderRadius:12,border:`1px solid ${t.priorita==="alta"?RED+"30":"#E5E3DC"}`,overflow:"hidden"}}>
                  <div style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                      {/* Checkbox stato */}
                      <div onClick={()=>toggleStato(t.id)} style={{width:20,height:20,borderRadius:6,border:`2px solid ${STATO_COL[t.stato]}`,background:t.stato==="completata"?STATO_COL[t.stato]:"transparent",flexShrink:0,cursor:"pointer",marginTop:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {t.stato==="completata"&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        {t.stato==="in_corso"&&<div style={{width:8,height:8,borderRadius:2,background:BLU}}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:t.stato==="completata"?"#86868b":DARK,textDecoration:t.stato==="completata"?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.titolo}</div>
                        {t.note&&<div style={{fontSize:11,color:"#86868b",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.note}</div>}
                        <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                          <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:PRIORITA_COL[t.priorita]+"15",color:PRIORITA_COL[t.priorita],fontWeight:700}}>{t.priorita}</span>
                          {t.commessaNome&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:BLU+"12",color:BLU,fontWeight:600}}>{t.commessaNome}</span>}
                          {t.assegnatoNome&&t.assegnatoA!=="me"&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:PUR+"12",color:PUR,fontWeight:600}}>→ {t.assegnatoNome}</span>}
                          {t.scadenza&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:new Date(t.scadenza)<new Date()?RED+"15":AMB+"12",color:new Date(t.scadenza)<new Date()?RED:AMB,fontWeight:600}}>{new Date(t.scadenza).toLocaleDateString("it-IT",{day:"numeric",month:"short"})}</span>}
                          {t.allegati?.length>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"#F2F1EC",color:"#86868b",fontWeight:600}}>{t.allegati.length} allegati</span>}
                        </div>
                      </div>
                      <div onClick={()=>setSelectedTask(t)} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #E5E3DC",fontSize:11,color:"#86868b",cursor:"pointer",flexShrink:0}}>Apri</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUOVA TASK ─────────────────────────────── */}
      {showNewTask&&(
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.3)"}}>
          <div style={{background:"#fff",borderRadius:16,width:540,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>

            {/* Header */}
            <div style={{padding:"18px 22px",borderBottom:"1px solid #E5E3DC",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:16,fontWeight:800,color:DARK}}>Nuova Task</div>
              <div onClick={()=>setShowNewTask(false)} style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"#86868b",border:"1px solid #E5E3DC"}}>×</div>
            </div>

            <div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:14}}>

              {/* Titolo */}
              <div>
                <label style={S.label}>Titolo *</label>
                <input style={S.input} placeholder="Cosa devi fare?" value={form.titolo} onChange={e=>setForm(f=>({...f,titolo:e.target.value}))} autoFocus/>
              </div>

              {/* Note */}
              <div>
                <label style={S.label}>Note / Descrizione</label>
                <textarea style={{...S.input,minHeight:72,resize:"vertical"}} placeholder="Dettagli, istruzioni, link..." value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
              </div>

              {/* Riga: Priorità + Scadenza */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={S.label}>Priorità</label>
                  <div style={{display:"flex",gap:6}}>
                    {["alta","media","bassa"].map(p=>(
                      <div key={p} onClick={()=>setForm(f=>({...f,priorita:p as any}))} style={{flex:1,padding:"7px 4px",borderRadius:8,textAlign:"center",cursor:"pointer",fontSize:11,fontWeight:700,background:form.priorita===p?PRIORITA_COL[p]:PRIORITA_COL[p]+"10",color:form.priorita===p?"#fff":PRIORITA_COL[p],border:`1.5px solid ${PRIORITA_COL[p]}30`}}>
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={S.label}>Scadenza</label>
                  <input type="date" style={S.input} value={form.scadenza} onChange={e=>setForm(f=>({...f,scadenza:e.target.value}))}/>
                </div>
              </div>

              {/* Assegna a */}
              <div>
                <label style={S.label}>Assegna a</label>
                <select style={S.input} value={form.assegnatoA} onChange={e=>{
                  const op=team.find((t:any)=>t.id===e.target.value);
                  setForm(f=>({...f,assegnatoA:e.target.value,assegnatoNome:op?.nome||"Io"}));
                }}>
                  <option value="me">Io</option>
                  {(team||[]).map((m:any)=><option key={m.id} value={m.id}>{m.nome} — {m.ruolo}</option>)}
                </select>
              </div>

              {/* Collega commessa */}
              <div>
                <label style={S.label}>Collega a commessa (opzionale)</label>
                <select style={S.input} value={form.commessaId} onChange={e=>{
                  const cm=cantieri.find((c:any)=>c.id===e.target.value);
                  setForm(f=>({...f,commessaId:e.target.value,commessaNome:cm?`${cm.cliente} ${cm.cognome||""} · ${cm.code}`:""}));
                }}>
                  <option value="">— Nessuna commessa —</option>
                  {cantieri.filter((c:any)=>c.fase!=="chiusura").map((c:any)=>(
                    <option key={c.id} value={c.id}>{c.cliente} {c.cognome||""} · {c.code}</option>
                  ))}
                </select>
              </div>

              {/* Allegati */}
              <div>
                <label style={S.label}>Allegati</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" style={{display:"none"}} onChange={e=>{
                    const files=Array.from(e.target.files||[]);
                    const nuovi=files.map(f=>({id:"a_"+Date.now()+Math.random(),tipo:(f.type.startsWith("image")?"foto":f.type.startsWith("video")?"video":"file") as any,nome:f.name}));
                    setForm(f=>({...f,allegati:[...(f.allegati||[]),...nuovi]}));
                  }}/>
                  <div onClick={()=>fileRef.current?.click()} style={{padding:"7px 14px",borderRadius:8,border:"1.5px dashed #E5E3DC",fontSize:12,color:"#86868b",cursor:"pointer",fontWeight:600}}>+ Aggiungi file</div>
                  {(form.allegati||[]).map((a:Allegato)=>(
                    <div key={a.id} style={{padding:"5px 10px",borderRadius:8,background:"#F2F1EC",fontSize:11,color:DARK,display:"flex",alignItems:"center",gap:6}}>
                      <span>{a.tipo==="foto"?"📷":a.tipo==="video"?"🎥":"📎"}</span>
                      <span style={{maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.nome}</span>
                      <span onClick={()=>setForm(f=>({...f,allegati:f.allegati.filter((x:Allegato)=>x.id!==a.id)}))} style={{cursor:"pointer",color:"#86868b",fontSize:14,lineHeight:1}}>×</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Azioni */}
              <div style={{display:"flex",gap:10,paddingTop:4}}>
                <div onClick={()=>setShowNewTask(false)} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid #E5E3DC",fontSize:13,fontWeight:700,textAlign:"center",cursor:"pointer",color:"#86868b"}}>Annulla</div>
                <div onClick={createTask} style={{flex:2,padding:"10px",borderRadius:10,background:form.titolo.trim()?TEAL:"#E5E3DC",fontSize:13,fontWeight:700,textAlign:"center",cursor:"pointer",color:"#fff"}}>Crea Task</div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── DETTAGLIO TASK ───────────────────────────────── */}
      {selectedTask&&(
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.3)"}}>
          <div style={{background:"#fff",borderRadius:16,width:520,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{padding:"18px 22px",borderBottom:"1px solid #E5E3DC",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:800,color:DARK}}>{selectedTask.titolo}</div>
                <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:PRIORITA_COL[selectedTask.priorita]+"15",color:PRIORITA_COL[selectedTask.priorita],fontWeight:700}}>{selectedTask.priorita}</span>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:STATO_COL[selectedTask.stato]+"15",color:STATO_COL[selectedTask.stato],fontWeight:700}}>{selectedTask.stato.replace("_"," ")}</span>
                  {selectedTask.scadenza&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:AMB+"12",color:AMB,fontWeight:600}}>Scade: {new Date(selectedTask.scadenza).toLocaleDateString("it-IT",{day:"numeric",month:"long"})}</span>}
                </div>
              </div>
              <div onClick={()=>setSelectedTask(null)} style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"#86868b",border:"1px solid #E5E3DC",flexShrink:0}}>×</div>
            </div>
            <div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:14}}>
              {selectedTask.note&&<div style={{fontSize:13,color:DARK,lineHeight:1.6,background:"#F8F7F2",padding:"12px 14px",borderRadius:10}}>{selectedTask.note}</div>}
              {selectedTask.commessaNome&&(
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,background:BLU+"08",border:`1px solid ${BLU}20`,cursor:"pointer"}} onClick={()=>{const cm=cantieri.find((c:any)=>c.id===selectedTask.commessaId);if(cm){setSelectedCM(cm);setTab("commesse");setSelectedTask(null);}}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BLU} strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                  <span style={{fontSize:13,color:BLU,fontWeight:600}}>{selectedTask.commessaNome}</span>
                  <span style={{fontSize:11,color:"#86868b",marginLeft:"auto"}}>Apri commessa →</span>
                </div>
              )}
              {selectedTask.assegnatoNome&&<div style={{fontSize:12,color:"#86868b"}}>Assegnata a: <strong style={{color:DARK}}>{selectedTask.assegnatoNome}</strong></div>}
              {selectedTask.allegati?.length>0&&(
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Allegati ({selectedTask.allegati.length})</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {selectedTask.allegati.map((a:Allegato)=>(
                      <div key={a.id} style={{padding:"7px 12px",borderRadius:8,background:"#F2F1EC",fontSize:12,color:DARK,display:"flex",alignItems:"center",gap:6}}>
                        <span>{a.tipo==="foto"?"📷":a.tipo==="video"?"🎥":"📎"}</span>
                        <span>{a.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,paddingTop:4}}>
                <div onClick={()=>toggleStato(selectedTask.id)} style={{flex:1,padding:"9px",borderRadius:10,background:STATO_COL[selectedTask.stato],fontSize:12,fontWeight:700,textAlign:"center",cursor:"pointer",color:"#fff"}}>
                  {selectedTask.stato==="aperta"?"→ Inizia":"→ "+(selectedTask.stato==="in_corso"?"Completa":"Riapri")}
                </div>
                <div onClick={()=>{setTasks?.((p:Task[])=>p.filter(t=>t.id!==selectedTask.id));setSelectedTask(null);}} style={{padding:"9px 16px",borderRadius:10,border:`1.5px solid ${RED}40`,fontSize:12,fontWeight:700,cursor:"pointer",color:RED}}>Elimina</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
