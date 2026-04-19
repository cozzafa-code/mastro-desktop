"use client";
// @ts-nocheck
// MASTRO — OnboardingRuoli.tsx
// Onboarding step 0 — selezione ruolo prima di tutto il resto

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", AMBER="#E8A020", BLUE="#3B7FE0", PURPLE="#8B5CF6";

const RUOLI = [
  { id:"titolare",      ico:"👑", nome:"Titolare / Direzione", desc:"Vedo tutto. KPI, ogni reparto, ogni persona, ogni euro. Comando io.", colore:DARK,  features:["Dashboard completa","Tutti i moduli","Analytics avanzati","Team management"] },
  { id:"preventivista", ico:"📋", nome:"Preventivista", desc:"Sopralluoghi, misure, preventivi, clienti, configuratore. Il mio pane quotidiano.", colore:BLUE, features:["Commesse e clienti","Configuratore","Preventivi e PDF","Messaggi"] },
  { id:"produzione",    ico:"🏭", nome:"Responsabile Produzione", desc:"Ordini ricevuti, barre, lavorazioni, CNC. Trasformo l'ordine in finestra.", colore:"#F97316", features:["Ordini produzione","Distinta materiali","Magazzino barre","Export CNC"] },
  { id:"montatore",     ico:"🔧", nome:"Montatore / Installatore", desc:"I miei cantieri, le mie checklist, le mie foto. Semplice e veloce.", colore:PURPLE, features:["I miei montaggi","Checklist posa","Foto cantiere","Firma cliente"] },
  { id:"amministrazione",ico:"💰",nome:"Amministrazione", desc:"Fatture, SDI, contabilità, saldi, report. Tutto sotto controllo.", colore:RED,   features:["Fatture SDI","Contabilità","Report finanziari","Incassi"] },
  { id:"agente",        ico:"🌐", nome:"Agente di Vendita (RETE)", desc:"I miei preventivi, i miei clienti, le mie provvigioni. La mia zona.", colore:TEAL,  features:["Miei preventivi","Clienti zona","Provvigioni","Performance"] },
];

const RED="#DC4444";

export default function OnboardingRuoli({ onComplete }: { onComplete:(ruolo:string)=>void }) {
  const { T } = useMastro();
  const [selected, setSelected] = useState<string|null>(null);
  const [step, setStep] = useState<"ruolo"|"azienda">("ruolo");
  const [azienda, setAzienda] = useState({ nome:"", ragione:"", piva:"", tel:"", settore:"serramenti" });

  const ruoloSel = RUOLI.find(r=>r.id===selected);

  if(step==="azienda"&&ruoloSel) return (
    <div style={{minHeight:"100vh",background:"#F4F6F8",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FF}}>
      <div style={{width:"100%",maxWidth:480}}>
        <div style={{textAlign:"center" as any,marginBottom:32}}>
          <div style={{width:52,height:52,borderRadius:14,background:ruoloSel.colore,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 14px"}}>
            {ruoloSel.ico}
          </div>
          <div style={{fontSize:22,fontWeight:700,color:DARK}}>Configura la tua azienda</div>
          <div style={{fontSize:14,color:"#6B7280",marginTop:6}}>Ruolo selezionato: <strong>{ruoloSel.nome}</strong></div>
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:"24px",border:"1px solid #E5E3DC",display:"flex",flexDirection:"column" as any,gap:14}}>
          {[
            {l:"Nome azienda",k:"nome",ph:"Walter Cozza Serramenti"},
            {l:"Ragione sociale",k:"ragione",ph:"Walter Cozza Serramenti SRL"},
            {l:"P.IVA",k:"piva",ph:"01234567890"},
            {l:"Telefono",k:"tel",ph:"+39 0984 123456"},
          ].map(({l,k,ph})=>(
            <div key={k}>
              <div style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:5}}>{l}</div>
              <input value={(azienda as any)[k]} onChange={e=>setAzienda(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={{width:"100%",padding:"10px 14px",border:"1px solid #E5E3DC",borderRadius:9,fontSize:14,fontFamily:FF,outline:"none",color:DARK,background:"#F8FAFC"}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:5}}>Settore principale</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["serramenti","🪟 Serramenti"],["tendaggi","🪞 Tendaggi"],["fabbro","⚙️ Fabbro"],["pergole","🌿 Pergole"]].map(([v,l])=>(
                <div key={v} onClick={()=>setAzienda(p=>({...p,settore:v}))} style={{padding:"10px 12px",borderRadius:9,border:`1.5px solid ${azienda.settore===v?TEAL:"#E5E3DC"}`,cursor:"pointer",textAlign:"center" as any,background:azienda.settore===v?TEAL+"08":"transparent",fontSize:13,fontWeight:azienda.settore===v?600:400,color:azienda.settore===v?TEAL:DARK}}>{l}</div>
              ))}
            </div>
          </div>
          <button onClick={()=>onComplete(selected!)} style={{padding:"13px",borderRadius:10,background:TEAL,color:"#fff",border:"none",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:FF,marginTop:4}}>
            Entra in MASTRO →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F4F6F8",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FF}}>
      <div style={{width:"100%",maxWidth:760}}>
        {/* Header */}
        <div style={{textAlign:"center" as any,marginBottom:36}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20}}>
            <div style={{width:40,height:40,borderRadius:11,background:DARK,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff"}}>M</div>
            <span style={{fontSize:16,fontWeight:800,letterSpacing:2,color:DARK}}>MASTRO</span>
          </div>
          <div style={{fontSize:28,fontWeight:700,color:DARK,marginBottom:8}}>Chi sei in azienda?</div>
          <div style={{fontSize:15,color:"#6B7280"}}>MASTRO si adatta al tuo ruolo. Vedi solo quello che ti serve.</div>
        </div>

        {/* Griglia ruoli */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
          {RUOLI.map(r=>(
            <div key={r.id} onClick={()=>setSelected(r.id)}
              style={{background:"#fff",borderRadius:16,padding:"18px 16px",border:`2px solid ${selected===r.id?r.colore:"#E5E3DC"}`,cursor:"pointer",transition:"border-color .15s",background:selected===r.id?r.colore+"06":"#fff"}}>
              <div style={{fontSize:28,marginBottom:10}}>{r.ico}</div>
              <div style={{fontSize:14,fontWeight:700,color:DARK,marginBottom:4}}>{r.nome}</div>
              <div style={{fontSize:12,color:"#6B7280",lineHeight:1.5,marginBottom:10}}>{r.desc}</div>
              <div style={{display:"flex",flexDirection:"column" as any,gap:3}}>
                {r.features.map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:selected===r.id?r.colore:"#9CA3AF"}}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{textAlign:"center" as any}}>
          <button onClick={()=>{if(selected)setStep("azienda");}}
            disabled={!selected}
            style={{padding:"14px 40px",borderRadius:12,background:selected?TEAL:"#E5E3DC",color:selected?"#fff":"#9CA3AF",border:"none",fontSize:15,fontWeight:700,cursor:selected?"pointer":"not-allowed",fontFamily:FF,transition:"background .15s"}}>
            Continua →
          </button>
          <div style={{fontSize:12,color:"#9CA3AF",marginTop:10}}>Potrai cambiarlo in seguito dalle impostazioni</div>
        </div>
      </div>
    </div>
  );
}
