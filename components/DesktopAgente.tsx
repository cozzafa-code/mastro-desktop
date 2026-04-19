"use client";
// @ts-nocheck
// MASTRO — DesktopAgente.tsx
// AI Agent desktop: chat, autopilot, log azioni, promemoria automatici

import { useState, useRef, useEffect } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", PURPLE="#8B5CF6";

const QUICK_ACTIONS = [
  "Com'è la situazione oggi?",
  "Quali commesse sono ferme?",
  "Chi monto domani?",
  "Statistiche del mese",
  "Fatture in scadenza?",
  "Materiali sotto scorta",
];

const AUTOPILOT_ACTIONS = [
  { id:"promemoria_conf",   label:"Promemoria conferma preventivo",   desc:"Invia WhatsApp 48h dopo l'invio se non risponde",        attivo:true,  esec:34 },
  { id:"recall_ferme",      label:"Alert commesse ferme",             desc:"Notifica quando una commessa supera i giorni soglia",    attivo:true,  esec:22 },
  { id:"avviso_consegna",   label:"Avviso arrivo materiali",          desc:"Messaggio squadra quando i materiali sono pronti",       attivo:true,  esec:8  },
  { id:"recap_mattino",     label:"Recap giornaliero",                desc:"Ogni mattina alle 8: cantieri, montaggi, priorità",      attivo:true,  esec:45 },
  { id:"followup_chiusura", label:"Follow-up post-posa",              desc:"48h dopo la posa: verifica soddisfazione + recensione",  attivo:false, esec:0  },
  { id:"scadenze_enea",     label:"Alert scadenze ENEA",              desc:"30 giorni prima della scadenza pratica",                 attivo:false, esec:0  },
];

const LOG_DEMO = [
  { t:"Oggi 08:03", a:"Recap inviato: 3 montaggi oggi, 2 commesse ferme, 1 materiale sotto scorta", tipo:"report",  stato:"letto" },
  { t:"Oggi 07:55", a:"Alert: commessa S-0014 (Bianchi) ferma da 18 giorni — forse chiamare?",      tipo:"alert",   stato:"in attesa risposta" },
  { t:"Ieri 16:30", a:"Promemoria preventivo inviato a Marco Verdi (CM-0031) — nessuna risposta",   tipo:"azione",  stato:"nessuna risposta" },
  { t:"Ieri 09:00", a:"Avviso squadra A: materiali pronti per CM-0028, posa domani mattina",         tipo:"azione",  stato:"confermato" },
  { t:"Lun 18:00",  a:"Follow-up post-posa inviato a Anna Rossi — risposta positiva ricevuta",      tipo:"azione",  stato:"risposto" },
  { t:"Lun 10:00",  a:"Commessa CM-0025 avanzata in automatico a fase Produzione",                  tipo:"azione",  stato:"completato" },
];

export default function DesktopAgente() {
  const { T, cantieri=[], msgs=[], montaggiDB=[], fattureDB=[], team=[], giorniFermaCM, sogliaDays=7 } = useMastro();
  const [mode, setMode] = useState<"chat"|"autopilot"|"log">("chat");
  const [input, setInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState([
    { id:1, dir:"ai", txt:"Buongiorno! Sono il tuo assistente MASTRO. Ecco la situazione di oggi:", tipo:"report" },
  ]);
  const [apState, setApState] = useState<Record<string,boolean>>(()=>{
    const m:any={};AUTOPILOT_ACTIONS.forEach(a=>{m[a.id]=a.attivo;});return m;
  });
  const endRef = useRef<HTMLDivElement>(null);
  const TODAY = new Date().toISOString().split("T")[0];

  const ferme = cantieri.filter(c=>giorniFermaCM(c)>=sogliaDays&&c.fase!=="chiusura");
  const montaggiOggi = montaggiDB.filter((m:any)=>m.data===TODAY);
  const fatScad = fattureDB.filter((f:any)=>!f.pagata&&f.scadenza&&f.scadenza<TODAY);
  const nonLetti = msgs.filter((m:any)=>!m.letto).length;

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[chatMsgs]);

  // Genera risposta AI contestuale
  const getAIResp = (q:string):{ txt:string; tipo:string } => {
    const ql=q.toLowerCase();
    if(ql.includes("oggi")||ql.includes("situazione"))
      return {txt:`Oggi hai ${montaggiOggi.length} montaggi programmati, ${ferme.length} commesse ferme da più di ${sogliaDays} giorni, e ${nonLetti} messaggi non letti. ${fatScad.length>0?`Attenzione: ${fatScad.length} fatture scadute da incassare.`:"Situazione finanziaria ok."}`, tipo:"report"};
    if(ql.includes("ferme")||ql.includes("bloccate"))
      return {txt:ferme.length>0?`${ferme.length} commesse ferme: ${ferme.slice(0,3).map(c=>`${c.cliente} (${giorniFermaCM(c)}gg)`).join(", ")}${ferme.length>3?` + altre ${ferme.length-3}`:""}. Vuoi che prepari un messaggio di follow-up?`:`Nessuna commessa ferma — tutto in movimento!`, tipo:ferme.length>0?"alert":"azione"};
    if(ql.includes("montag")||ql.includes("domani"))
      return {txt:montaggiOggi.length>0?`Oggi: ${montaggiOggi.slice(0,3).map((m:any)=>m.cliente||"—").join(", ")}. ${montaggiOggi.length} interventi totali.`:"Nessun montaggio programmato oggi.", tipo:"azione"};
    if(ql.includes("statist")||ql.includes("mese"))
      return {txt:`Questo mese: ${cantieri.filter(c=>c.fase!=="chiusura").length} commesse attive, €${Math.round(cantieri.filter(c=>c.euro).reduce((s,c)=>s+(parseFloat(c.euro)||0),0)/1000)}k in pipeline, ${cantieri.filter(c=>c.fase==="chiusura").length} chiuse.`, tipo:"report"};
    if(ql.includes("fattur")||ql.includes("incass"))
      return {txt:fatScad.length>0?`${fatScad.length} fatture scadute per un totale di €${Math.round(fatScad.reduce((s:number,f:any)=>s+(f.importo||0),0)).toLocaleString("it-IT")}. Vuoi che prepari i solleciti?`:"Nessuna fattura scaduta.", tipo:fatScad.length>0?"alert":"azione"};
    if(ql.includes("materiali")||ql.includes("scorta"))
      return {txt:"Controllo magazzino in corso... Per dati aggiornati vai al modulo Produzione → Magazzino.", tipo:"azione"};
    return {txt:"Capito! Elaboro la tua richiesta. Puoi anche andare direttamente al modulo specifico per i dettagli.", tipo:"azione"};
  };

  const send = () => {
    if(!input.trim()) return;
    const newId=chatMsgs.length+1;
    const q=input;
    setChatMsgs(p=>[...p,{id:newId,dir:"biz",txt:q,tipo:""}]);
    setInput("");
    setTimeout(()=>{
      const r=getAIResp(q);
      setChatMsgs(p=>[...p,{id:newId+1,dir:"ai",txt:r.txt,tipo:r.tipo}]);
    },600);
  };

  const TIPO_STYLE:Record<string,{bg:string,border:string}> = {
    report:      {bg:BLUE+"08",     border:BLUE+"25"},
    azione:      {bg:TEAL+"08",     border:TEAL+"25"},
    alert:       {bg:RED+"08",      border:RED+"25"},
    suggerimento:{bg:PURPLE+"08",   border:PURPLE+"25"},
  };

  return (
    <div style={{display:"flex",height:"100%",background:"#F4F6F8",overflow:"hidden"}}>
      {/* SIDEBAR SINISTRA — situazione live */}
      <div style={{width:240,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
        <div style={{padding:"12px 14px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${TEAL},${BLUE})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:T.text}}>MASTRO Agente</div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:TEAL}}/>
                <span style={{fontSize:10,color:TEAL,fontWeight:500}}>Attivo 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats live */}
        <div style={{padding:"12px 14px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
          <div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Situazione live</div>
          {[
            {l:"Commesse ferme",    v:ferme.length,      c:ferme.length>0?RED:TEAL,   alert:ferme.length>0},
            {l:"Montaggi oggi",     v:montaggiOggi.length,c:PURPLE,                   alert:false},
            {l:"Messaggi non letti",v:nonLetti,           c:nonLetti>0?BLUE:TEAL,     alert:nonLetti>0},
            {l:"Fatture scadute",   v:fatScad.length,    c:fatScad.length>0?RED:TEAL,  alert:fatScad.length>0},
          ].map((k,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:i<3?`0.5px solid ${T.bdr}`:"none"}}>
              <span style={{fontSize:11,color:T.sub}}>{k.l}</span>
              <span style={{fontSize:12,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</span>
            </div>
          ))}
        </div>

        {/* Azioni rapide AI */}
        <div style={{padding:"10px 14px",flex:1,overflowY:"auto" as any}}>
          <div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Chiedi all'agente</div>
          {QUICK_ACTIONS.map((q,i)=>(
            <div key={i} onClick={()=>{setInput(q);setMode("chat");}} style={{padding:"7px 10px",borderRadius:7,border:`0.5px solid ${T.bdr}`,fontSize:11,color:T.text,cursor:"pointer",marginBottom:5,background:"#F8FAFC"}}>
              {q}
            </div>
          ))}
          <div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"14px 0 8px"}}>Questo mese</div>
          {[
            {l:"Azioni eseguite",v:LOG_DEMO.length+89,c:T.text},
            {l:"Messaggi inviati",v:47,c:BLUE},
            {l:"Alert scadenze",v:12,c:AMBER},
            {l:"Ore risparmiate",v:"~14h",c:TEAL},
          ].map((k,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",borderRadius:6,marginBottom:4,background:"#fff",border:`0.5px solid ${T.bdr}`}}>
              <span style={{fontSize:10,color:T.sub}}>{k.l}</span>
              <span style={{fontSize:11,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",minWidth:0}}>
        {/* Mode tabs */}
        <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",gap:0,paddingLeft:16,flexShrink:0}}>
          {[["chat","Chat"],["autopilot","Autopilot"],["log","Log azioni"]].map(([id,l])=>(
            <div key={id} onClick={()=>setMode(id as any)} style={{padding:"10px 16px",fontSize:12,fontWeight:500,color:mode===id?TEAL:T.sub,borderBottom:`2px solid ${mode===id?TEAL:"transparent"}`,cursor:"pointer"}}>{l}</div>
          ))}
        </div>

        {/* CHAT */}
        {mode==="chat"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
            <div style={{flex:1,overflowY:"auto" as any,padding:"16px 20px",display:"flex",flexDirection:"column" as any,gap:10}}>
              {/* Situazione iniziale */}
              {ferme.length>0&&(
                <div style={{padding:"10px 14px",borderRadius:10,background:RED+"06",border:`0.5px solid ${RED}20`,marginBottom:4}}>
                  <div style={{fontSize:12,fontWeight:500,color:RED,marginBottom:2}}>Attenzione: {ferme.length} commesse ferme</div>
                  <div style={{fontSize:11,color:T.sub}}>{ferme.slice(0,2).map(c=>`${c.cliente} (${giorniFermaCM(c)}gg)`).join(" · ")}{ferme.length>2?` + altre ${ferme.length-2}`:""}</div>
                </div>
              )}
              {chatMsgs.map((m:any)=>{
                const isAi=m.dir==="ai";
                const ts=m.tipo&&TIPO_STYLE[m.tipo];
                return (
                  <div key={m.id} style={{display:"flex",justifyContent:isAi?"flex-start":"flex-end",gap:8,alignItems:"flex-start"}}>
                    {isAi&&<div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${TEAL},${BLUE})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    </div>}
                    <div style={{maxWidth:"70%",padding:"10px 14px",borderRadius:isAi?"4px 14px 14px 14px":"14px 14px 4px 14px",background:isAi?(ts?ts.bg:"#fff"):TEAL,color:isAi?T.text:"#fff",border:isAi&&ts?`0.5px solid ${ts.border}`:isAi?`0.5px solid ${T.bdr}`:"none"}}>
                      <div style={{fontSize:13,lineHeight:1.55}}>{m.txt}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef}/>
            </div>
            {/* Input */}
            <div style={{background:"#fff",borderTop:`0.5px solid ${T.bdr}`,padding:"12px 20px",flexShrink:0}}>
              <div style={{display:"flex",gap:8}}>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send();}}
                  placeholder="Chiedi all'agente MASTRO..." style={{flex:1,padding:"10px 14px",border:`0.5px solid ${T.bdr}`,borderRadius:22,fontSize:13,fontFamily:FF,color:T.text,background:"#F8FAFC",outline:"none"}}/>
                <button onClick={send} style={{width:40,height:40,borderRadius:20,border:"none",background:`linear-gradient(135deg,${TEAL},${BLUE})`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AUTOPILOT */}
        {mode==="autopilot"&&(
          <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
            <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${TEAL}30`,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:14,fontWeight:500,color:T.text}}>Modalità Autopilot</div>
                <div style={{fontSize:11,color:T.sub,marginTop:2}}>L'agente lavora in autonomia 24/7 — tu approvi le azioni importanti</div>
              </div>
              <div style={{textAlign:"right" as any}}>
                <div style={{fontSize:22,fontWeight:500,color:TEAL,fontFamily:FM}}>95</div>
                <div style={{fontSize:9,color:T.sub}}>azioni questo mese</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column" as any,gap:8}}>
              {AUTOPILOT_ACTIONS.map((a)=>(
                <div key={a.id} style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:T.text}}>{a.label}</div>
                    <div style={{fontSize:11,color:T.sub,marginTop:2}}>{a.desc}</div>
                    {a.esec>0&&<div style={{fontSize:10,color:TEAL,marginTop:3,fontWeight:500}}>{a.esec} esecuzioni</div>}
                  </div>
                  <div onClick={()=>setApState(p=>({...p,[a.id]:!p[a.id]}))} style={{width:40,height:22,borderRadius:11,background:apState[a.id]?TEAL:"#E5E3DC",padding:2,cursor:"pointer",flexShrink:0,transition:"background .2s"}}>
                    <div style={{width:18,height:18,borderRadius:9,background:"#fff",marginLeft:apState[a.id]?18:0,transition:"margin-left .2s"}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOG */}
        {mode==="log"&&(
          <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
            <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:14}}>Ultime azioni dell'agente</div>
            {LOG_DEMO.map((l,i)=>{
              const ts=TIPO_STYLE[l.tipo]||TIPO_STYLE.azione;
              const stCol=l.stato==="completato"||l.stato==="risposto"||l.stato==="letto"?TEAL:l.stato==="nessuna risposta"||l.stato==="in attesa risposta"?AMBER:BLUE;
              return (
                <div key={i} style={{background:"#fff",borderRadius:10,border:`0.5px solid ${ts.border}`,padding:"10px 14px",marginBottom:6}}>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.4,marginBottom:6}}>{l.a}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:10,color:T.sub}}>{l.t}</span>
                    <span style={{fontSize:9,fontWeight:500,padding:"1px 7px",borderRadius:5,background:stCol+"12",color:stCol}}>{l.stato}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
