"use client";
// @ts-nocheck
// MASTRO — GestioneOperatori.tsx
// Gestione operatori azienda: crea, assegna ruolo, PIN, app satellite

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0";

const RUOLI = [
  { id:"titolare",           label:"Titolare / Direzione",  app:"/dashboard",                             colore:DARK },
  { id:"preventivista",      label:"Preventivista",         app:"/dashboard",                             colore:BLUE },
  { id:"tecnico_misure",     label:"Tecnico Misure",        app:"mastro-misure.vercel.app",               colore:"#2563EB" },
  { id:"montatore",          label:"Montatore",             app:"mastro-montaggi.vercel.app",             colore:TEAL },
  { id:"magazziniere",       label:"Magazziniere",          app:"mastro-magazzino.vercel.app",            colore:"#7C3AED" },
  { id:"operaio_produzione", label:"Operaio Produzione",    app:"mastro-produzione.vercel.app",           colore:"#F97316" },
  { id:"agente",             label:"Agente Vendita",        app:"mastro-rete.vercel.app",                 colore:"#8B5CF6" },
];

const OPERATORI_DEMO = [
  { id:"o1", nome:"Fabio",   cognome:"Cozza",   ruolo:"titolare",           pin:"0000", attivo:true  },
  { id:"o2", nome:"Marco",   cognome:"Vito",    ruolo:"montatore",          pin:"1234", attivo:true  },
  { id:"o3", nome:"Paolo",   cognome:"Greco",   ruolo:"tecnico_misure",     pin:"2222", attivo:true  },
  { id:"o4", nome:"Antonio", cognome:"Bruno",   ruolo:"magazziniere",       pin:"3333", attivo:true  },
  { id:"o5", nome:"Luigi",   cognome:"Perri",   ruolo:"operaio_produzione", pin:"4444", attivo:false },
];

export default function GestioneOperatori({ T }: { T:any }) {
  const [operatori, setOperatori] = useState(OPERATORI_DEMO);
  const [showNuovo, setShowNuovo] = useState(false);
  const [form, setForm] = useState({ nome:"", cognome:"", ruolo:"montatore", pin:"" });
  const [showPin, setShowPin] = useState<string|null>(null);

  const crea=()=>{
    if(!form.nome||!form.pin||form.pin.length!==4)return;
    setOperatori(ops=>[...ops,{id:Date.now().toString(),...form,attivo:true}]);
    setForm({nome:"",cognome:"",ruolo:"montatore",pin:""});
    setShowNuovo(false);
  };

  const toggleAttivo=(id:string)=>setOperatori(ops=>ops.map(o=>o.id===id?{...o,attivo:!o.attivo}:o));

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:500,color:T.text}}>Operatori azienda</div>
        <button onClick={()=>setShowNuovo(true)} style={{padding:"7px 14px",borderRadius:7,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>+ Nuovo operatore</button>
      </div>

      {/* Form nuovo */}
      {showNuovo&&(
        <div style={{background:"#F8FAFC",borderRadius:12,padding:"16px",border:`1px solid ${T.bdr}`,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:12}}>Nuovo operatore</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[["nome","Nome"],["cognome","Cognome (opz.)"]].map(([k,l])=>(
              <div key={k}>
                <div style={{fontSize:10,fontWeight:600,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:4}}>{l}</div>
                <input value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{width:"100%",padding:"8px 10px",border:`0.5px solid ${T.bdr}`,borderRadius:7,fontSize:13,fontFamily:FF,color:T.text,background:"#fff",outline:"none"}}/>
              </div>
            ))}
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:600,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:4}}>Ruolo</div>
            <select value={form.ruolo} onChange={e=>setForm(f=>({...f,ruolo:e.target.value}))} style={{width:"100%",padding:"8px 10px",border:`0.5px solid ${T.bdr}`,borderRadius:7,fontSize:13,fontFamily:FF,color:T.text,background:"#fff",outline:"none"}}>
              {RUOLI.map(r=><option key={r.id} value={r.id}>{r.label} → {r.app}</option>)}
            </select>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:600,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:4}}>PIN (4 cifre)</div>
            <input type="text" inputMode="numeric" maxLength={4} value={form.pin} onChange={e=>setForm(f=>({...f,pin:e.target.value.replace(/\D/g,"").slice(0,4)}))} placeholder="0000" style={{width:80,padding:"8px 10px",border:`0.5px solid ${T.bdr}`,borderRadius:7,fontSize:16,fontFamily:FM,color:T.text,background:"#fff",outline:"none",textAlign:"center" as any,letterSpacing:4}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowNuovo(false)} style={{flex:1,padding:"9px",borderRadius:8,border:`0.5px solid ${T.bdr}`,background:"transparent",fontSize:12,color:T.sub,cursor:"pointer",fontFamily:FF}}>Annulla</button>
            <button onClick={crea} disabled={!form.nome||form.pin.length!==4} style={{flex:2,padding:"9px",borderRadius:8,background:form.nome&&form.pin.length===4?TEAL:"#E5E3DC",color:form.nome&&form.pin.length===4?"#fff":"#9CA3AF",border:"none",fontSize:12,fontWeight:500,cursor:form.nome&&form.pin.length===4?"pointer":"not-allowed",fontFamily:FF}}>Crea operatore</button>
          </div>
        </div>
      )}

      {/* Lista operatori */}
      <div style={{display:"flex",flexDirection:"column" as any,gap:6}}>
        {operatori.map(op=>{
          const ruoloInfo = RUOLI.find(r=>r.id===op.ruolo)||RUOLI[0];
          return (
            <div key={op.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,background:"#fff",border:`0.5px solid ${op.attivo?T.bdr:T.bdr}`,opacity:op.attivo?1:0.5}}>
              <div style={{width:36,height:36,borderRadius:9,background:ruoloInfo.colore+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:ruoloInfo.colore,flexShrink:0}}>
                {op.nome[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:T.text}}>{op.nome} {op.cognome}</div>
                <div style={{fontSize:11,color:T.sub}}>{ruoloInfo.label}</div>
                <div style={{fontSize:10,color:T.sub}}>→ {ruoloInfo.app}</div>
              </div>
              {/* PIN */}
              <div style={{textAlign:"center" as any,minWidth:60}}>
                <div style={{fontSize:9,color:T.sub,marginBottom:2}}>PIN</div>
                <div onClick={()=>setShowPin(showPin===op.id?null:op.id)} style={{fontSize:13,fontFamily:FM,color:T.text,cursor:"pointer",letterSpacing:2}}>
                  {showPin===op.id?op.pin:"••••"}
                </div>
              </div>
              {/* Toggle attivo */}
              <div onClick={()=>toggleAttivo(op.id)} style={{width:36,height:20,borderRadius:10,background:op.attivo?TEAL:"#D1D5DB",position:"relative" as any,cursor:"pointer",transition:"background .2s",flexShrink:0}}>
                <div style={{position:"absolute" as any,top:2,left:op.attivo?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda ruoli */}
      <div style={{marginTop:20,background:"#F8FAFC",borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.bdr}`}}>
        <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:10}}>Ruoli e app assegnate</div>
        {RUOLI.map(r=>(
          <div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`0.5px solid ${T.bdr}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:2,background:r.colore,flexShrink:0}}/>
              <span style={{fontSize:12,color:T.text,fontWeight:500}}>{r.label}</span>
            </div>
            <span style={{fontSize:11,color:T.sub}}>{r.app}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
